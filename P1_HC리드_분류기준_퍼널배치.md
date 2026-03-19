---
title: P1_HC리드_분류기준_퍼널배치
date: 2026-03-18
type: operations
product: [알쓰패치]
segment: [대학_보건센터, 기업_보건관리자, 전문기관]
tags: [PULSE, P1, 교육, DM, 리드, 캠페인, 보건]
---
# P1 — HC DM 리드 분류 기준 & 퍼널 배치

> 담당: PULSE 다온 | 작성: 2026-03-17 | 협업: ← HUNTER 다래 (리드) → FLUX 이음 (DB 반영)
> DM 발송일: 2026-03-06 | 기준일: 2026-03-17 (D+11)

---

## 1. HC DM 캠페인 현황

| 항목 | 수치 |
|------|------|
| 발송 총 대상 | 385개교 |
| 샘플 동봉 발송 | 226개교 (1순위 98 + 2순위 128) |
| 경과일 | 11일 (3/6 발송) |
| 추적 채널 | QR 스캔 → Apps Script → HC_클릭로그 / HC_샘플신청 |

---

## 2. 리드 분류 기준 (Hot / Warm / Cold)

### 분류 체계

| 등급 | 기준 | 의미 | 권장 액션 |
|------|------|------|----------|
| 🔴 **Hot** | QR 스캔 + 샘플 신청 완료 | 적극 관심. 제품 직접 받겠다는 의사 표현 | 5영업일 내 팔로업 연락 |
| 🟡 **Warm** | QR 스캔 O / 샘플 신청 X | 관심은 있으나 아직 행동 안 함 | 2차 넛지 발송 검토 |
| 🔵 **Mild** | 미스캔 + 교육허브 UTM 접속 | DM 봤지만 QR 대신 직접 접속 | Warm과 동일 처리 |
| ⚫ **Cold** | 반응 없음 (스캔 0 + 미신청) | 미도달 또는 무관심 | 2차 DM 라운드 대상 |
| ↩️ **반송** | 주소 오류로 미도달 | 주소 정제 필요 | 주소 확인 후 재발송 |

### 세부 판별 로직

```
HC_클릭로그 탭 기준:
  utm_code 스캔 기록 있음 → 스캔 O
  utm_code 스캔 기록 없음 → 스캔 X

HC_샘플신청 탭 기준:
  신청 기록 있음 → 샘플 신청 O
  신청 기록 없음 → 샘플 신청 X

분류:
  스캔 O + 신청 O → Hot
  스캔 O + 신청 X → Warm
  스캔 X + 신청 X → Cold
  반송 처리된 건 → 반송
```

---

## 3. 퍼널 단계 매핑

| 리드 등급 | purchase_stage | 근거 |
|----------|---------------|------|
| Hot (샘플 신청) | **고려** | 샘플 = 구매 전 검토 단계 |
| Warm (스캔만) | **관심** | 정보 탐색 단계 |
| Cold (무반응) | **인지** | DM 도달 = 인지 단계 최소 확보 |
| 기존 구매 이력 있는 기관 | 기존 stage 유지 | 중복 다운그레이드 방지 |

---

## 4. metadata 필드 기록 사항

HC 기관 신규 등록 또는 업데이트 시 아래 필드를 반드시 기록:

```json
{
  "dm_campaign": "HC_2026_Q1",
  "dm_sent_date": "2026-03-06",
  "sample_included": true,
  "qr_scanned": true,
  "qr_scan_date": "YYYY-MM-DD",
  "qr_scan_count": 1,
  "sample_requested": true,
  "sample_request_date": "YYYY-MM-DD",
  "lead_grade": "Hot",
  "followup_due": "2026-03-25"
}
```

---

## 5. 팔로업 우선순위 & 액션 플랜

### Hot 리드 (샘플 신청 기관)

| 단계 | 타이밍 | 방법 | 내용 |
|------|--------|------|------|
| 1차 팔로업 | 샘플 배송 완료 +3일 | 카카오톡/이메일 | "샘플 받으셨나요? 사용 결과가 궁금합니다" |
| 2차 팔로업 | 1차 +7일 (무응답 시) | 전화 | 견적 필요 여부 확인 |
| 견적 발송 | 관심 확인 즉시 | 이메일 | 기관 규모별 맞춤 견적 |

**KPI**: Hot 리드 → 견적 전환율 목표 30% 이상

### Warm 리드 (스캔만)

| 단계 | 타이밍 | 방법 | 내용 |
|------|--------|------|------|
| 2차 넛지 | 3/27 전후 | 이메일 또는 카카오 채널 | 교육허브 신규 자료 안내 |
| 재타겟 DM | 4월 중 | 우편 또는 이메일 | "샘플 아직 신청 안 하셨나요?" |

**KPI**: Warm → Hot 전환율 목표 15% 이상

### Cold 리드 (무반응)

| 방법 | 시기 | 비고 |
|------|------|------|
| 2차 DM 라운드 | 4~5월 | 축제 시기 전후 |
| 이유 분석 | H1 리포트에서 | 반송률, 주소 오류 등 |

---

## 6. 기관 유형별 처리 방침

| 기관 유형 | 처리 |
|----------|------|
| **신규 기관** (기존 구매 이력 없음) | 신규 등록 + 퍼널 배치 |
| **기존 구매 기관** (cory DB 이미 존재) | 기존 레코드에 DM 필드만 추가 (stage 변경 X) |
| **이탈 기관** (12개월+ 미구매) | stage = '관심'으로 재활성화 + 이탈 플래그 해제 |

---

## 7. FLUX X2 요청 사항

HC 리드 분류 완료 후 FLUX 이음에게 전달:

```
요청: HC DM 응답 데이터 Supabase 자동 반영
대상: HC_클릭로그 + HC_샘플신청 구글시트
필요 작업:
  1. 스캔 기록 → metadata.qr_scanned = true / qr_scan_date / qr_scan_count
  2. 샘플 신청 기록 → metadata.sample_requested = true / sample_request_date
  3. lead_grade 자동 산정 및 기록
  4. 팔로업 due date 자동 계산 (샘플 배송일 +3일)
우선순위: X1(HC 동기화 안정) 다음 착수
```

---

## 8. 현황 확인 쿼리 (FLUX에게 실행 요청)

```sql
-- HC DM 응답 현황 집계
SELECT
  metadata->>'lead_grade' AS grade,
  COUNT(*) AS cnt,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS pct
FROM institutions
WHERE type = '대학[[Segments/기업_보건관리자|보건관리자]]'
  AND metadata->>'dm_campaign' = 'HC_2026_Q1'
GROUP BY metadata->>'lead_grade'
ORDER BY cnt DESC;

-- Hot 리드 목록 (팔로업 대상)
SELECT name, region, district,
  metadata->>'qr_scan_date',
  metadata->>'sample_request_date',
  metadata->>'followup_due'
FROM institutions
WHERE type = '대학보건관리자'
  AND metadata->>'lead_grade' = 'Hot'
ORDER BY metadata->>'sample_request_date';
```

---

## 관련 링크

- [[Segments/대학_보건센터]]
- [[Segments/기업_보건관리자]]
- [[Segments/전문기관]]
