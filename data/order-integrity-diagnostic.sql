-- ============================================
-- 주문 정합성 진단 (138625 사례 계기)
-- 작성: 2026-05-27 (PULSE + FLUX)
-- 목적: cory orders + institutions 간 정합성 왜곡 파악
-- Supabase SQL Editor에서 순서대로 실행
-- ============================================

-- ─────────────────────────────────────────────
-- Q1: 138625 주문 현재 상태 확인
-- ─────────────────────────────────────────────
SELECT
  id, order_idx, goods_name, sale_price, sale_cnt,
  (sale_price * sale_cnt) AS amount,
  state_subject, reg_time,
  institution_id, matched, manual_match,
  payment_confirmed, invoice_issued
FROM orders
WHERE order_idx = '138625';

-- ─────────────────────────────────────────────
-- Q2: 전체 취소·환불 주문 목록 + 매출 왜곡 규모
-- ─────────────────────────────────────────────
SELECT
  state_subject,
  COUNT(*) AS order_count,
  COUNT(DISTINCT institution_id) AS inst_count,
  SUM(sale_price * sale_cnt) AS total_amount,
  MIN(reg_time) AS oldest,
  MAX(reg_time) AS latest
FROM orders
WHERE COALESCE(state_subject, '') IN ('취소', '환불', '주문취소', '결제취소', '반품')
   OR state_subject ILIKE '%취소%'
   OR state_subject ILIKE '%환불%'
   OR state_subject ILIKE '%반품%'
GROUP BY state_subject
ORDER BY total_amount DESC;

-- ─────────────────────────────────────────────
-- Q3: state_subject 전체 값 분포 (이상값 확인)
-- ─────────────────────────────────────────────
SELECT
  COALESCE(state_subject, '(NULL)') AS state,
  COUNT(*) AS cnt,
  SUM(sale_price * sale_cnt) AS total_amount
FROM orders
GROUP BY state_subject
ORDER BY cnt DESC;

-- ─────────────────────────────────────────────
-- Q4: institutions.purchase_amount 왜곡 규모
-- 취소·환불 포함 vs 제외 비교
-- ─────────────────────────────────────────────
WITH order_agg AS (
  SELECT
    o.institution_id,
    -- 전체 amount (취소 포함)
    SUM(o.sale_price * o.sale_cnt) AS total_all,
    -- 유효 amount (취소·환불 제외)
    SUM(CASE
      WHEN COALESCE(o.state_subject, '') NOT IN ('취소', '환불', '주문취소', '결제취소', '반품')
       AND (o.state_subject IS NULL OR (o.state_subject NOT ILIKE '%취소%' AND o.state_subject NOT ILIKE '%환불%' AND o.state_subject NOT ILIKE '%반품%'))
      THEN o.sale_price * o.sale_cnt ELSE 0
    END) AS total_valid,
    -- 취소된 amount
    SUM(CASE
      WHEN o.state_subject ILIKE '%취소%' OR o.state_subject ILIKE '%환불%' OR o.state_subject ILIKE '%반품%'
      THEN o.sale_price * o.sale_cnt ELSE 0
    END) AS total_cancelled,
    COUNT(*) FILTER (WHERE o.state_subject ILIKE '%취소%' OR o.state_subject ILIKE '%환불%' OR o.state_subject ILIKE '%반품%') AS cancelled_count
  FROM orders o
  WHERE o.institution_id IS NOT NULL
  GROUP BY o.institution_id
)
SELECT
  COUNT(*) AS total_institutions,
  COUNT(*) FILTER (WHERE total_cancelled > 0) AS institutions_with_cancelled,
  SUM(total_cancelled) AS total_cancelled_amount,
  SUM(total_valid) AS total_valid_amount,
  ROUND(100.0 * SUM(total_cancelled) / NULLIF(SUM(total_all), 0), 2) AS cancelled_pct
FROM order_agg;

-- ─────────────────────────────────────────────
-- Q5: institutions.purchase_amount vs orders 실제 합계 불일치 목록
-- ─────────────────────────────────────────────
WITH order_valid AS (
  SELECT
    o.institution_id,
    SUM(o.sale_price * o.sale_cnt) AS valid_amount
  FROM orders o
  WHERE o.institution_id IS NOT NULL
    AND COALESCE(o.state_subject, '') NOT IN ('취소', '환불', '주문취소', '결제취소', '반품')
    AND (o.state_subject IS NULL OR (o.state_subject NOT ILIKE '%취소%' AND o.state_subject NOT ILIKE '%환불%' AND o.state_subject NOT ILIKE '%반품%'))
  GROUP BY o.institution_id
)
SELECT
  i.id,
  i.name,
  i.purchase_amount AS inst_amount,
  COALESCE(v.valid_amount, 0) AS orders_valid_amount,
  i.purchase_amount - COALESCE(v.valid_amount, 0) AS diff,
  i.purchase_stage
FROM institutions i
LEFT JOIN order_valid v ON v.institution_id = i.id
WHERE i.purchase_amount IS NOT NULL
  AND ABS(COALESCE(i.purchase_amount, 0) - COALESCE(v.valid_amount, 0)) > 100
ORDER BY diff DESC
LIMIT 50;

-- ─────────────────────────────────────────────
-- Q6: purchase_stage='구매' 인데 실제 유효 주문 0건인 기관
-- (취소된 주문 때문에 '구매' 승격된 케이스)
-- ─────────────────────────────────────────────
WITH order_valid_count AS (
  SELECT
    institution_id,
    COUNT(*) AS valid_orders
  FROM orders
  WHERE institution_id IS NOT NULL
    AND COALESCE(state_subject, '') NOT IN ('취소', '환불', '주문취소', '결제취소', '반품')
    AND (state_subject IS NULL OR (state_subject NOT ILIKE '%취소%' AND state_subject NOT ILIKE '%환불%' AND state_subject NOT ILIKE '%반품%'))
  GROUP BY institution_id
)
SELECT
  i.id, i.name, i.purchase_stage, i.purchase_amount,
  COALESCE(v.valid_orders, 0) AS valid_orders,
  (SELECT COUNT(*) FROM orders o2 WHERE o2.institution_id = i.id) AS total_orders
FROM institutions i
LEFT JOIN order_valid_count v ON v.institution_id = i.id
WHERE i.purchase_stage IN ('구매', '재구매', '만족', '추천', '파트너')
  AND COALESCE(v.valid_orders, 0) = 0
ORDER BY i.name
LIMIT 50;
