-- ============================================================
-- P0-1 cory 재구매 플래그 DB 스키마
-- 생성: FLUX 이음 | 2026-03-30
-- 목적: OKR KR1 재구매율 측정 인프라 구축
-- 실행: Supabase 대시보드 → SQL Editor → 아래 순서대로 실행
-- ============================================================

-- STEP 1: institutions 테이블에 3개 필드 추가
-- ※ IF NOT EXISTS 사용 — 이미 존재할 경우 오류 방지

ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS first_purchase_date TEXT,
  ADD COLUMN IF NOT EXISTS last_purchase_date  TEXT,
  ADD COLUMN IF NOT EXISTS purchase_count      INTEGER DEFAULT 0;

-- STEP 2: 필드 설명 주석
COMMENT ON COLUMN institutions.first_purchase_date IS '첫 구매일 (YYYY-MM-DD 형식, 수동 입력 또는 wcolive 주문 연동)';
COMMENT ON COLUMN institutions.last_purchase_date  IS '마지막 구매일 (YYYY-MM-DD 형식)';
COMMENT ON COLUMN institutions.purchase_count      IS '누적 구매 횟수 (1=첫구매, 2=재구매, ...)';

-- STEP 3: 월별 코호트 재구매율 집계 뷰 생성
-- 재구매 정의: 첫 구매일 기준 12개월 내 purchase_count >= 2

CREATE OR REPLACE VIEW cohort_repurchase_rate AS
SELECT
  DATE_TRUNC('month', first_purchase_date::date) AS cohort_month,
  COUNT(*) AS total_institutions,
  SUM(CASE WHEN purchase_count >= 2 THEN 1 ELSE 0 END) AS repurchased,
  ROUND(
    100.0 * SUM(CASE WHEN purchase_count >= 2 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    1
  ) AS repurchase_rate_pct
FROM institutions
WHERE first_purchase_date IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;

-- STEP 4: 전체 재구매율 요약 뷰 (KR1 대시보드용)
-- 방안A 기준: 재구매자(purchase_count >= 2) / 전체 구매자(purchase_count >= 1) × 100

CREATE OR REPLACE VIEW kr1_repurchase_summary AS
SELECT
  COUNT(*) FILTER (WHERE purchase_count >= 1) AS total_buyers,
  COUNT(*) FILTER (WHERE purchase_count >= 2) AS repurchased_buyers,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE purchase_count >= 2)
            / NULLIF(COUNT(*) FILTER (WHERE purchase_count >= 1), 0),
    1
  ) AS repurchase_rate_pct,
  35.0 AS kr1_target_pct  -- KR1 목표: 35% (2026-03-30 확정)
FROM institutions;

-- ============================================================
-- 실행 후 확인 쿼리
-- ============================================================

-- 1. 컬럼 추가 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'institutions'
  AND column_name IN ('first_purchase_date', 'last_purchase_date', 'purchase_count');

-- 2. 뷰 조회 테스트
SELECT * FROM kr1_repurchase_summary;
SELECT * FROM cohort_repurchase_rate LIMIT 5;

-- ============================================================
-- 수동 데이터 입력 가이드
-- ============================================================
-- purchase_count 기준:
--   0 = 미구매 (샘플만 신청)
--   1 = 첫 구매 (purchase_stage = '구매')
--   2+ = 재구매 (purchase_stage = '만족' 또는 '추천')
--
-- 예시:
-- UPDATE institutions
-- SET first_purchase_date = '2025-09-01',
--     last_purchase_date  = '2026-02-15',
--     purchase_count      = 2
-- WHERE id = 144;  -- GC녹십자
--
-- wcolive.com 주문 데이터와 수동 대조 후 입력 권장
-- 자동화는 P0-2 이후 별도 스크립트로 처리
-- ============================================================
