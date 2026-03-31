---
title: C3 프로 발굴 리드 어트리뷰션 — sourced_by 필드 설계서
date: 2026-03-29
type: spec
product: [알쓰패치]
segment: [전문기관, 기업_보건관리자, 보건소]
tags: [CRM, 얼라이언스, 프로연맹, 어트리뷰션, Supabase]
agent: FLUX
status: draft
---

# C3 프로 발굴 리드 어트리뷰션 — sourced_by 필드 설계서

> **목적**: 얼라이언스 프로 파트너가 발굴한 신규 기관을 cory에 등록할 때, 마진 쉐어 어트리뷰션이 가능하도록 `sourced_by` 필드를 신설하고 집계 뷰를 구현한다.
> **관련 INBOX**: PULSE #19 (Phase2 착수 전)
> **참조**: `PM Skills/09-running-log/2026-03-28-Alliance-프로구조재설계.md` WWA Item C
> **계약 조항 기반**: `얼라이언스CS/프로연맹_계약조항_초안_BOND_가온.md` (마진쉐어 10%)

---

## 1. 배경 및 요구사항

### 비즈니스 요구사항

| 조건 | 내용 |
|------|------|
| 프로 파트너 유형 | 보건관리자 출신 강사·강의 대행사 등 얼라이언스 프로 등급 |
| 마진쉐어 조건 | 프로가 발굴한 기관에서 **90일 내 첫 주문** 발생 시 → 해당 주문 금액의 10% 지급 |
| 강연 연계 | 강연 후 90일 내 첫 주문 기관도 동일 어트리뷰션 적용 |
| 어트리뷰션 충돌 | 동일 기관 복수 프로가 발굴한 경우 → 먼저 등록한 프로 기준 (선착순) |

### 현재 상태 (Gap)

- `institutions` 테이블에 발굴 출처 필드 없음
- 프로가 기관 소개해도 누가 소개했는지 추적 불가
- 마진쉐어 지급 근거 데이터 부재

---

## 2. Supabase 스키마 변경

### 2-1. `institutions` 테이블 컬럼 추가

```sql
-- sourced_by 컬럼 추가 (프로 파트너 ID 또는 식별자)
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS sourced_by TEXT DEFAULT NULL;

-- sourced_at 컬럼 추가 (발굴 등록 일시 — 90일 계산 기준)
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS sourced_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- sourced_type 컬럼 추가 (발굴 경로 구분)
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS sourced_type TEXT DEFAULT NULL
CHECK (sourced_type IN ('pro_referral', 'lecture', 'dm', 'direct', 'cold', NULL));
```

**컬럼 정의:**

| 컬럼 | 타입 | 예시 값 | 설명 |
|------|------|---------|------|
| `sourced_by` | TEXT | `pro_1234` | 프로 파트너 ID (형식: `pro_{cory_id}`) |
| `sourced_at` | TIMESTAMP | `2026-03-15 10:00:00+09` | 발굴 등록 일시 (90일 계산 기준점) |
| `sourced_type` | TEXT | `pro_referral` | 발굴 경로: pro_referral(직접소개)/lecture(강연)/dm(DM)/direct(직접)/cold(콜드) |

### 2-2. 어트리뷰션 판정 뷰

```sql
-- 90일 내 첫 주문 어트리뷰션 판정 뷰
CREATE OR REPLACE VIEW v_pro_attribution AS
SELECT
  i.id AS institution_id,
  i.name AS institution_name,
  i.sourced_by,
  i.sourced_at,
  i.sourced_type,
  o.id AS first_order_id,
  o.order_date,
  o.amount AS order_amount,
  ROUND(o.amount * 0.10) AS margin_share_amount,
  EXTRACT(DAY FROM (o.order_date::timestamp - i.sourced_at)) AS days_to_first_order,
  CASE
    WHEN EXTRACT(DAY FROM (o.order_date::timestamp - i.sourced_at)) <= 90
    THEN TRUE
    ELSE FALSE
  END AS is_within_attribution_window
FROM institutions i
LEFT JOIN LATERAL (
  -- 기관의 첫 번째 주문만 가져오기
  SELECT id, order_date, amount
  FROM orders
  WHERE institution_id = i.id
  ORDER BY order_date ASC
  LIMIT 1
) o ON TRUE
WHERE i.sourced_by IS NOT NULL;
```

### 2-3. 프로별 월간 어트리뷰션 집계 뷰

```sql
-- 프로 파트너별 월간 마진쉐어 집계
CREATE OR REPLACE VIEW v_pro_monthly_attribution AS
SELECT
  sourced_by AS pro_id,
  DATE_TRUNC('month', order_date::timestamp) AS month,
  COUNT(*) AS attributed_orders,
  SUM(order_amount) AS total_order_amount,
  SUM(margin_share_amount) AS total_margin_share
FROM v_pro_attribution
WHERE is_within_attribution_window = TRUE
  AND order_date IS NOT NULL
GROUP BY sourced_by, DATE_TRUNC('month', order_date::timestamp)
ORDER BY month DESC, total_margin_share DESC;
```

---

## 3. cory 대시보드 UI 설계

### 3-1. 기관 등록 폼 추가 필드

`institution` 등록·수정 화면에 아래 필드 추가:

```html
<!-- cory 대시보드 기관 등록 폼 추가 영역 -->
<div class="form-group">
  <label>발굴 출처</label>
  <select name="sourced_type">
    <option value="">-- 선택 --</option>
    <option value="direct">직접 발굴 (APS 내부)</option>
    <option value="pro_referral">프로 파트너 소개</option>
    <option value="lecture">강연 후 연결</option>
    <option value="dm">DM 캠페인</option>
    <option value="cold">콜드 리드</option>
  </select>
</div>

<div class="form-group" id="pro-referral-fields" style="display:none;">
  <label>소개 프로 파트너 ID</label>
  <input type="text" name="sourced_by" placeholder="pro_XXXX">
  <small>프로 파트너 cory ID를 입력하세요 (예: pro_2135)</small>
</div>
```

### 3-2. 어트리뷰션 대시보드 탭 (신규)

```
[기관관리] [상담이력] [주문현황] [어트리뷰션] ← 신규 탭
```

**어트리뷰션 탭 구성:**

| 섹션 | 내용 |
|------|------|
| 요약 카드 | 이번 달 어트리뷰션 건수 / 마진쉐어 합계 / 90일 내 전환율 |
| 프로별 테이블 | 프로ID / 소개 기관수 / 전환 건수 / 마진쉐어 합계 |
| 기관별 목록 | 기관명 / 소개자 / 등록일 / 첫주문일 / 경과일 / 어트리뷰션 여부 |

---

## 4. 운영 프로토콜

### 4-1. 프로가 기관 발굴 시 등록 절차

```
① 프로 파트너 → APS 대표에게 카톡/이메일로 기관 정보 전달
② 대표 → cory에서 기관 신규 등록
   - sourced_by: pro_{파트너_cory_ID}
   - sourced_at: 등록 당일 일시 자동
   - sourced_type: pro_referral 또는 lecture
③ 90일 내 첫 주문 발생 시 → 주문 등록 시 자동 어트리뷰션 계산
④ 월말 → v_pro_monthly_attribution 조회 → 마진쉐어 지급
```

### 4-2. 강연 후 어트리뷰션 처리

강연 프로가 강연한 기관을 cory에 등록할 때:
- `sourced_type`: `lecture`
- `sourced_by`: `pro_{강연자_ID}`
- `sourced_at`: **강연 당일 날짜**로 수동 입력 (강연일 기준 90일 카운트)

### 4-3. 어트리뷰션 충돌 처리

동일 기관에 복수 프로가 소개한 경우:
- **원칙**: 먼저 cory에 등록한 `sourced_by` 기준 (선착순)
- `sourced_by` 값은 최초 등록 후 변경 불가 (대표만 변경 권한)

---

## 5. 구현 체크리스트

### Phase 2A — 데이터베이스 (Supabase 직접 실행 필요)

- [ ] `institutions` 테이블 컬럼 3개 추가 SQL 실행
- [ ] `v_pro_attribution` 뷰 생성 SQL 실행
- [ ] `v_pro_monthly_attribution` 뷰 생성 SQL 실행
- [ ] 기존 프로 소개 기관 확인 후 `sourced_by` 소급 입력 (해당 건 있을 경우)

### Phase 2B — cory 대시보드 UI (FLUX 구현)

- [ ] 기관 등록/수정 폼에 `sourced_type` / `sourced_by` 필드 추가
- [ ] `sourced_type = pro_referral` 선택 시 프로 ID 입력란 동적 표시
- [ ] 어트리뷰션 대시보드 탭 신규 구현
  - [ ] 요약 카드 3종
  - [ ] 프로별 집계 테이블
  - [ ] 기관별 어트리뷰션 목록 (90일 경과일 카운트다운 포함)

### Phase 2C — 운영 가이드 (BOND 협업)

- [ ] 프로 파트너 계약서에 어트리뷰션 조건 명문화 확인 (`프로연맹_계약조항_초안_BOND_가온.md` 참조)
- [ ] 프로 파트너에게 기관 발굴 보고 양식 제공

---

## 6. 미결 사항

| # | 항목 | 결정 필요자 | 기한 |
|---|------|----------|------|
| M1 | `orders` 테이블 존재 여부 확인 — 현재 cory가 Supabase orders 테이블을 쓰는지, 아니면 `sangdam` 기록으로 주문 추적하는지 | FLUX (DB 스키마 확인) | Phase2 착수 전 |
| M2 | 마진쉐어 10% 기준 확정 여부 — 계약 초안(BOND)은 10%이나 대표 최종 승인 필요 | 대표 | Phase2 착수 전 |
| M3 | 프로 파트너 ID 체계 — 현재 cory ID를 그대로 쓸지, 별도 pro_code 부여할지 | SAGE + 대표 | Phase2 착수 전 |

---

## 관련 문서

- [[얼라이언스CS/프로연맹_계약조항_초안_BOND_가온]]
- [[마케팅전략/aps_marketing/APS얼라이언스_전략서]]
- `PM Skills/09-running-log/2026-03-28-Alliance-프로구조재설계.md`
- `PM Skills/09-running-log/2026-03-28-PreMortem-프로직접판매조건.md`
