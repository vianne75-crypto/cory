---
title: "cory 데이터 품질 개선안"
date: 2026-03-31
from: 대표
to: PULSE 다온 · FLUX 이음
type: spec
status: open
---

# cory 데이터 품질 개선안

> 배경: LTV 심층 분석 과정에서 발견된 데이터 정합성 이슈.
> COLD 분리 미반영으로 재구매율이 22%→33%로 12%p 오차 발생.
> 이 수준의 데이터 오류는 OKR 판정·영업 전략·가격 결정에 직접 영향.

---

## 발견된 이슈 (5건)

### 이슈 1. COLD 스테이지 미반영 🔴 Critical

| 항목 | 현황 |
|---|---|
| **문제** | C-02에서 119개 기관을 COLD로 재분류 완료했으나, `institutions_list.txt` 엑스포트와 대시보드에 COLD 스테이지가 반영되지 않음 |
| **영향** | 구매(218)에 COLD가 섞여 있어 재구매율·LTV 산출 오류. 보건소 재구매율 22%(오류) vs 33%(실제) |
| **원인 추정** | Supabase DB에는 COLD 업데이트 완료되었으나 엑스포트/대시보드 뷰가 구 스테이지 참조 |
| **확인 필요** | Supabase에서 `SELECT purchase_stage, COUNT(*) FROM institutions GROUP BY purchase_stage` 실행 → COLD가 보이는지 |

**개선안:**
1. `institutions_list.txt` 재엑스포트 (COLD 포함)
2. 대시보드 `calcRepurchaseRate()` 함수에서 COLD 제외 확인
3. purchase_stage enum에 COLD 공식 추가

---

### 이슈 2. purchase_stage "추천" 기준 모호 🟡 High

| 항목 | 현황 |
|---|---|
| **문제** | 추천 = "타 기관 자발적 소개"인데, 실제로는 구매 빈도 기반으로 자동 분류된 기관 포함 (횡성군·광진구) |
| **영향** | 추천(12개) 중 실제 추천 행동 확인된 기관 불명 → 재구매율·세그먼트 분석 왜곡 |
| **근본 원인** | 추천 판정 기준이 코드에 정의되어 있지 않음 — 수동 판단 |

**개선안:**
1. `referral_confirmed` BOOLEAN 필드 신설 (`institutions` 테이블)
2. 현재 추천 12개 전수 검증 — BOND가 상담 메모에 "타 기관 소개" 기록 있는 기관만 유지
3. 미확인 기관 → 만족으로 재분류
4. 향후 규칙: BOND가 상담 메모에 "소개받은 기관: XXX" 기록 시에만 추천 전환

---

### 이슈 3. 기관 중복 등록 🟡 High

| 항목 | 현황 |
|---|---|
| **문제** | 동일 기관이 다른 이름으로 중복 등록 (예: "용산보건소" / "용산구보건소", "울산 남구보건소" / "울산남구보건소") |
| **영향** | 기관 수 과대 계상, 기관당 누적금액 분산, LTV 과소 추정 |
| **규모 추정** | 보건소만 5~10건 추정 (전체 838개 중 30~50건 가능) |

**개선안:**
1. 기관명 정규화 스크립트 실행 (공백·접미사·지역명 통일)
2. 중복 후보 리스트 자동 추출 (유사도 80%+ 기관명 쌍)
3. 수동 확인 후 merge (한쪽에 주문 이력 통합)
4. 신규 등록 시 유사 기관명 경고 기능 추가

---

### 이슈 4. 주문 금액 데이터 불완전 🟡 High

| 항목 | 현황 |
|---|---|
| **문제** | `institutions_list.txt`에 누적금액 필드가 없음. COLD 보고서에만 일부 금액 존재. 정확한 기관별 ARPA 산출 불가 |
| **영향** | LTV 분석이 추정치에 의존 — ARPA 100만원은 가정, 검증 안 됨 |
| **원인** | cory DB에 `purchase_amount` 필드는 있지만 엑스포트에 미포함 |

**개선안:**
1. `institutions_list.txt` 엑스포트에 `purchase_amount`, `last_purchase_date`, `purchase_count` 포함
2. 또는 SQL 뷰로 세그먼트별 ARPA 자동 집계: `SELECT segment, AVG(purchase_amount) FROM institutions WHERE purchase_stage IN ('구매','만족','추천') GROUP BY segment`
3. 대시보드에 세그먼트별 ARPA 카드 추가

---

### 이슈 5. 신규 유입 기관 미등록 🟡 Medium

| 항목 | 현황 |
|---|---|
| **문제** | cory INBOX #30 — 상담 매칭 과정에서 12개 미등록 기관 발견 (세종문화회관·쿠팡케어센터 등). 상담은 발생했으나 CRM에 미등록 |
| **영향** | 고객 여정 추적 누락, 매출 기회 손실 |

**개선안:**
1. PULSE 제안대로 `rematch-consultations.js` 실행 시 미등록 기관 자동 추출 + 등록
2. 신규 등록 시 `sourced_by='consult_discovery'` 태깅
3. SAGE 결정 필요: 자동 등록 범위 (전체 vs 주력 세그먼트만) — INBOX #30 M1 회신

---

## 우선순위 매트릭스

| 이슈 | 임팩트 | 구현 난이도 | 우선순위 |
|---|---|---|---|
| **#1 COLD 미반영** | 높음 (KPI 오류) | 낮음 (SQL 1건 + 엑스포트) | **P0 즉시** |
| **#2 추천 기준** | 높음 (세그먼트 분석) | 낮음 (필드 1개 + 수동 검증) | **P0 즉시** |
| **#3 기관 중복** | 중 (데이터 정확도) | 중 (정규화 스크립트) | **P1 (4/14)** |
| **#4 금액 미포함** | 높음 (LTV 분석) | 낮음 (엑스포트 컬럼 추가) | **P0 즉시** |
| **#5 미등록 기관** | 중 (매출 기회) | 중 (자동 등록 로직) | **P1 (4/14)** |

---

## 즉시 실행 요청 (P0)

### FLUX 이음

| # | 액션 | 산출물 | 마감 |
|---|---|---|---|
| D1 | Supabase에서 `purchase_stage` 분포 확인 — COLD가 DB에 존재하는지 | SQL 결과 스크린샷 | **4/02** |
| D2 | `institutions_list.txt` 재엑스포트 (purchase_stage COLD 포함 + purchase_amount + last_purchase_date + purchase_count) | 갱신된 txt 파일 | **4/04** |
| D3 | 대시보드 `calcRepurchaseRate()`에서 COLD 스테이지 제외 여부 확인 + 미제외 시 수정 | app.js 수정 | **4/04** |
| D4 | `referral_confirmed` BOOLEAN 필드 ALTER TABLE SQL 작성 | SQL 스크립트 | **4/07** |

### PULSE 다온

| # | 액션 | 산출물 | 마감 |
|---|---|---|---|
| D5 | 추천(12개) 기관 전수 검증 — 상담 메모에서 "타 기관 소개" 기록 검색 | 확인/미확인 분류 리스트 | **4/07** |
| D6 | 기관명 중복 후보 리스트 추출 (유사도 80%+ 쌍) | 중복 후보 리스트 | **4/14** |

---

## 관련 문서

- `PM Skills/09-running-log/2026-03-31-ltv-보건소-차상위세그먼트심층분석.md`
- `PM Skills/09-running-log/2026-03-31-ltv-전문센터-최상위세그먼트심층분석.md`
- `PM Skills/09-running-log/2026-03-30-세그먼트-구매자명칭기준.md`
- `cory/C02_COLD_재활성화_대상.md`
