---
title: P0-2 재구매 데이터 채우기 — FLUX 이음 위임
date: 2026-04-08
type: spec
product: [알쓰패치]
tags: [재구매율, KR1, Supabase, wcolive, FLUX, P02]
agent: SAGE
status: active
---

# P0-2 재구매 데이터 채우기 (FLUX 위임)

> 위임자: SAGE 슬기 → FLUX 이음
> 마감: **2026-04-14**
> 선행 조건: P0-1 SQL 실행 완료 ✅ (2026-04-08, 대표 직접 실행)

---

## 1. 배경

P0-1로 `institutions` 테이블에 3개 컬럼 추가 + 2개 뷰 생성 완료:
- `first_purchase_date` (TEXT)
- `last_purchase_date` (TEXT)
- `purchase_count` (INTEGER)
- 뷰: `cohort_repurchase_rate`, `kr1_repurchase_summary`

**현재 상태**: 모든 기관의 `purchase_count = 0` → KR1 재구매율 NULL

**목표**: wcolive 주문 데이터를 cory institutions와 매칭하여 재구매 데이터 채우기.
KR1 측정 인프라 가동.

---

## 2. 작업 범위

### 2-1. 데이터 소스

- **wcolive 주문 DB** (어드민 주문 목록 또는 직접 DB 접근)
- **cory institutions 테이블** (Supabase)

### 2-2. 매칭 키

| wcolive 필드 | cory 필드 | 매칭 방법 |
|------------|----------|----------|
| 사용처명/기관명 | `name` | 정확 일치 우선, fallback: 부분 일치 |
| 후불 입금자명 | `name` | "후불 계산서" / "후불 카드결제" 패턴 제외 후 매칭 |
| 주문일 | `first_purchase_date` / `last_purchase_date` | YYYY-MM-DD 형식 |

### 2-3. 계산 로직

기관별로:
1. 모든 주문을 시간 순으로 정렬
2. **첫 주문일** → `first_purchase_date`
3. **마지막 주문일** → `last_purchase_date`
4. **고유 주문 횟수** (같은 날 중복 주문은 1회로 카운트) → `purchase_count`

### 2-4. 결과 검증

```sql
-- 실행 후 확인
SELECT * FROM kr1_repurchase_summary;
-- 예상: total_buyers > 0, repurchased_buyers > 0, repurchase_rate_pct > 0

SELECT * FROM cohort_repurchase_rate ORDER BY cohort_month DESC LIMIT 12;
-- 예상: 월별 코호트별 재구매율
```

---

## 3. 구현 방법 — 3가지 옵션

### 옵션 A: 수동 CSV 임포트 (가장 빠름)

1. wcolive 어드민에서 주문 목록 CSV export (2024-01-01 ~ 현재)
2. Python/SQL로 기관별 집계
3. UPDATE 쿼리 일괄 생성
4. Supabase SQL Editor에서 실행

**장점**: 1회성, 빠름
**단점**: 자동화 안 됨, 신규 주문 반영 안 됨

### 옵션 B: GAS 동기화 스크립트 (중기)

1. wcolive 주문 → 구글시트 동기화 (Apps Script)
2. 구글시트 → cory institutions 업데이트 (기존 HcSync 패턴 응용)
3. 일 1회 자동 실행

**장점**: 자동화
**단점**: 구현 시간 1~2일

### 옵션 C: Supabase Edge Function (최종)

1. wcolive 주문 webhook → Supabase Edge Function
2. 신규 주문마다 자동 매칭 + UPDATE
3. 실시간 KR1 갱신

**장점**: 실시간, 정확
**단점**: 구현 시간 2~3일, wcolive webhook 설정 필요

---

## 4. 권장 진행 순서

> 1인 운영 제약 + 4/14 마감 고려.

1. **4/08~10**: 옵션 A로 1차 데이터 채우기 (KR1 즉시 측정)
2. **4/11~13**: 옵션 B 구현 (자동화 기반)
3. **4/14**: 1차 검증 + SAGE 보고
4. **Q3**: 옵션 C로 업그레이드 (선택)

---

## 5. 예외 처리 가이드

### 매칭 실패 케이스

| 케이스 | 처리 |
|--------|------|
| wcolive 사용처명이 cory에 없음 | 신규 기관으로 등록 (sourced_by='order_discovery') |
| 동일 기관 다른 표기 (예: "광진구보건소" vs "서울 광진구 보건소") | 매칭 알고리즘에 정규화 추가 (공백/지역명 제거) |
| 후불 입금자명이 개인명 | 별도 시트로 분리 → PULSE 수동 매칭 |
| 샘플 주문만 있는 기관 | `purchase_count = 0` 유지 (구매 아님) |

### 데이터 정합성 체크

```sql
-- 1. purchase_count > 0인데 first_purchase_date NULL
SELECT id, name FROM institutions
WHERE purchase_count > 0 AND first_purchase_date IS NULL;

-- 2. 첫 구매일이 마지막 구매일보다 미래
SELECT id, name FROM institutions
WHERE first_purchase_date::date > last_purchase_date::date;

-- 3. purchase_count = 1인데 first ≠ last (논리 오류)
SELECT id, name FROM institutions
WHERE purchase_count = 1 AND first_purchase_date != last_purchase_date;
```

---

## 6. 산출물

| # | 산출물 | 형식 | 마감 |
|---|--------|------|------|
| 1 | wcolive 주문 → cory 매칭 결과 리포트 | MD | 4/10 |
| 2 | 옵션 A 1차 UPDATE 실행 완료 | SQL 로그 | 4/10 |
| 3 | KR1 재구매율 첫 측정값 | 스크린샷 | 4/10 |
| 4 | 옵션 B GAS 스크립트 (자동화) | .gs | 4/13 |
| 5 | 매칭 실패 기관 리스트 | CSV | 4/13 |
| 6 | SAGE 보고서 | MD | 4/14 |

---

## 7. 핵심 KR1 정의 (재확인)

> 2026-03-30 확정 (방안 A)
> **재구매율 = 재구매자(purchase_count >= 2) ÷ 전체 구매자(purchase_count >= 1) × 100**
> 목표: **35%** (Q2 KR1)

---

## 8. 협업 요청

| 에이전트 | 요청 사항 |
|---------|---------|
| **PULSE 다온** | 매칭 실패 기관 수동 매칭 (4/12) |
| **HUNTER 다래** | 신규 등록 기관 검증 (sourced_by='order_discovery') |
| **SAGE** | 주간 진행 점검 (4/10, 4/13) |

---

## 관련 문서

- [[P01_재구매플래그_DB스키마_FLUX]] — 선행 작업 (완료 ✅)
- [[2026-03-30-세그먼트-구매자명칭기준]] — KR1 정의서
- [[알쓰패치_마케팅전략서_2026]] — 상위 10개 반복구매 기관 리스트
