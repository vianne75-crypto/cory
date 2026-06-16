---
title: "SCM 운영 매뉴얼 — GRID 이음"
date: 2026-04-08
type: ops-manual
product: [알쓰패치]
agent: GRID 이음
status: draft
tags: [SCM, 재고, 발주, 출고, 운영매뉴얼]
related:
  - "[[cory/CLAUDE]]"
  - "`PM Skills/PROJECTS/aps-agents/grid-ieum`"
---

# SCM 운영 매뉴얼 — GRID 이음

> **목적**: 알쓰패치 양산 본격화에 따른 재고·발주·입출고·추적 업무를 표준화한다.
> **스코프**: 알쓰패치 단일 SKU → Phase2에서 패밀리팩·후속 프로그램 확장
> **운영 기간**: 2026-04-08 착수 → 2주 운영 후 Pain Point 회수 → 신규 스킬 개발(B)

---

## 1. 배경 및 원칙

### 왜 지금인가
- 알쓰패치 누적 판매 **112만개** (2026.03 기준) — 이미 SCM 규모 도달
- GC케어 파트너십 진입 시 **월 1만 거래처 / 월 10만 단위** 주문 대응 필요
- 현재 발주·재고·출고가 수동 관리 → 이음으로 통합 관리 이관

### 운영 원칙
1. **수동 반복 = 버그** (이음 페르소나) — 자동화 우선, 수동은 임시 해결책
2. **실데이터 축적 우선** — 스킬 신규 개발 전 2주간 실운영으로 Pain Point 수집
3. **단일 출처** (Single Source of Truth) — 재고 수치는 Supabase만 신뢰
4. **가시성 = 안전** — 주단위 재고·리드타임·결품률 리포트

---

## 2. 5단계 SCM 표준 프로세스

```
① 수요 예측 → ② 발주 → ③ 입고 → ④ 재고 관리 → ⑤ 출고 추적
```

### ① 수요 예측 (Demand Forecast)

| 항목 | 운영 방식 | 도구 |
|---|---|---|
| 채널별 수요 | B2G(보건소·군) / B2B(기업·GC케어) / B2C(온라인) 분리 집계 | Supabase 쿼리 |
| 예측 주기 | 월간 (매월 1일 다음달 예측 확정) | Google Sheet |
| 참고 데이터 | 최근 6개월 출고량 + 계절성(절주의 달 4월, 연말) + 파이프라인 | — |
| 최소 MOQ | 알쓰패치 단일 SKU 기준 1만개 (제조 최소 생산 단위) | — |

**PM Skill 활용**: `metrics-dashboard` — 월간 수요 예측 대시보드 구축

### ② 발주 (Purchase Order)

| 항목 | 운영 방식 |
|---|---|
| 발주 트리거 | 안전재고 이하 도달 시 자동 알림 (Make.com) |
| 안전재고 | **2주 평균 출고량 × 1.5** (리드타임 커버 + 버퍼) |
| 발주 승인 | 10만개 미만 이음 단독 / 10만개 이상 SAGE 승인 |
| 발주처 | 제조사 계약 업체 (리드타임 2주) |
| 문서화 | `cory/PO/YYYY-MM-DD-PO-{업체}-{수량}.md` |

**PM Skill 활용**: `automation-flow` — 안전재고 알림 자동화 플로우

### ③ 입고 (Goods Receipt)

| 항목 | 운영 방식 |
|---|---|
| 입고 검수 | 수량·외관·시리얼 번호 확인 |
| 입고 등록 | Supabase `inventory_in` 테이블 insert |
| 불량 처리 | 불량률 2% 초과 시 즉시 SAGE 보고 + 제조사 클레임 |
| 창고 위치 | 본사 창고 기본, B2G 대량 건은 직송 처리 |

### ④ 재고 관리 (Inventory Management)

| 항목 | 운영 방식 |
|---|---|
| 실시간 가시성 | Supabase `inventory_current` 뷰 |
| ABC 분류 | A: 알쓰패치 단품 / B: 패밀리팩 / C: 후속 프로그램 연계 |
| 재고 회전율 | 주 1회 리포트 (월 4회) |
| 유효기한 관리 | 제조일로부터 1년 — 입고 순 FIFO |
| 결품 대응 | 결품 발생 시 24h 내 SAGE 보고 + 긴급 발주 |

**PM Skill 활용**: `sql-queries` — 재고 쿼리 템플릿 / `dummy-dataset` — 재고 시뮬레이션

### ⑤ 출고 추적 (Order Fulfillment)

| 항목 | 운영 방식 |
|---|---|
| B2G 출고 | 공문·조달청 경로 → `gov-order` 스킬 참조 |
| B2B 출고 | 기업 직납 / GC케어 등 파트너 경유 |
| B2C 출고 | wcolive.com / 스마트스토어 → CJ 대한통운 연동 |
| 출고 등록 | Supabase `orders` + `shipment` 테이블 |
| 추적 번호 | 애니빌드 알림톡 자동 발송 |
| E13 효과 리포트 | 출고 30일 후 설문 링크 발송 (FORGE 연계) |

**PM Skill 활용**: `gov-order` — 관급 조달 발주 표준

---

## 3. Supabase 테이블 구조 (초안)

```sql
-- 재고 입고 기록
CREATE TABLE IF NOT EXISTS inventory_in (
  id SERIAL PRIMARY KEY,
  po_number TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT 'ALTH-PATCH-01',
  quantity INT NOT NULL,
  mfg_date DATE NOT NULL,
  exp_date DATE NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);

-- 재고 출고 기록
CREATE TABLE IF NOT EXISTS inventory_out (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INT NOT NULL,
  channel TEXT CHECK (channel IN ('B2G','B2B','B2C')),
  shipped_at TIMESTAMPTZ DEFAULT NOW(),
  tracking_no TEXT
);

-- 재고 현황 뷰 (실시간 집계)
CREATE OR REPLACE VIEW inventory_current AS
SELECT
  sku,
  COALESCE(SUM(i.quantity), 0) - COALESCE(SUM(o.quantity), 0) AS stock_qty,
  MIN(i.exp_date) AS nearest_exp
FROM inventory_in i
LEFT JOIN inventory_out o USING (sku)
GROUP BY sku;
```

> **이음이 직접 cory에 적용하기 전 SAGE 승인 필수**.

---

## 4. KPI 지표

| 지표 | 목표 | 측정 주기 |
|---|---|---|
| 재고 회전율 | 월 1회 이상 | 주간 |
| 결품률 | < 1% | 월간 |
| 불량률 | < 2% | 입고 시 |
| 평균 리드타임 | < 14일 (발주→입고) | 발주 건별 |
| B2C 출고 리드타임 | < 24h (주문→출고) | 일간 |
| E13 설문 회수율 | > 15% | 월간 |

---

## 5. 2주 Pain Point 수집 가이드

> **목적**: Week 3(4/22~) 신규 SCM 스킬 개발(B)의 스코프 결정

매일 퇴근 전 `cory/SCM_painpoint_log.md`에 1줄 추가:

```
2026-04-XX | [카테고리] | 상황 | 소요시간 | 자동화 가능성
```

**카테고리 예시**: 발주타이밍 / 재고가시성 / 결품대응 / 입고검수 / 출고오류 / 리드타임지연 / 데이터불일치

Week 2 말(4/21) SAGE와 함께 리뷰 → 가장 빈발·고비용 3가지 선정 → B 스킬 개발 대상 확정.

---

## 6. 사용 가능한 PM Skills (이번 주 설치 완료)

`/Users/olive/Qsync/cory/.claude/skills/`에 설치됨:

| 스킬 | 용도 | 우선 활용 시점 |
|---|---|---|
| `automation-flow` | 발주·알림·출고 자동화 설계 | 즉시 — 안전재고 알림 |
| `gov-order` | 관급 조달 발주 처리 | 즉시 — B2G 출고 표준화 |
| `sql-queries` | Supabase 재고 쿼리 | 즉시 — inventory_current 뷰 구축 |
| `dummy-dataset` | 재고 시뮬레이션 데이터 | Week 2 — 안전재고 시뮬레이션 |
| `metrics-dashboard` | 재고 KPI 대시보드 | Week 2 — KPI 리포트 |
| `create-prd` | SCM 시스템 PRD | Week 3+ — Phase2 시스템 도입 시 |

---

## 7. 금지사항 (이음 페르소나 기반)

- ❌ 테스트 없이 Supabase 스키마 변경 적용
- ❌ 안전재고 알림 무시
- ❌ 재고 불일치 발견 시 SAGE 보고 누락
- ❌ 비용 영향도 없이 신규 시스템 도입 제안
- ❌ 수동 엑셀 작업을 2주 이상 반복 (자동화 대상)

---

## 8. 다음 단계

| 시점 | 액션 | 담당 |
|---|---|---|
| 4/8 | 이 매뉴얼 이음 확인 + 스킬 6종 확인 | 이음 |
| 4/9~4/14 | Supabase 스키마 초안 SAGE 검토 → 적용 | 이음+SAGE |
| 4/9~4/21 | SCM 일상 운영 + Pain Point 로그 축적 | 이음 |
| 4/21 | Week 2 리뷰 미팅 | 이음+SAGE |
| 4/22~ | 신규 SCM 스킬 개발 착수 (B 단계) | SAGE+이음 |

---

## 9. 참조

- 이음 프로필: `PM Skills/PROJECTS/aps-agents/grid-ieum.md`
- cory 프로젝트 지침: `cory/CLAUDE.md`
- GC케어 파트너십 플랜: `PM Skills/09-running-log/2026-04-07-partnership-GC케어-파트너십플랜.md`
- 메가 바이어 전략: `PM Skills/09-running-log/2026-04-05-market-sizing-알쓰패치-메가바이어전략.md`
