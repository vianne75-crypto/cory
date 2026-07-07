-- ============================================
-- Webhook 상태 동기화 유실(drift) 진단
-- 작성: 2026-05-27 (138625 케이스 발견)
-- 목적: cory-애니빌드 상태 불일치 규모 파악
-- ============================================

-- ─────────────────────────────────────────────
-- Q1: 138625 cory 현재 상태
-- ─────────────────────────────────────────────
SELECT id, order_idx, goods_name, state_subject,
       sale_price, sale_cnt, (sale_price * sale_cnt) AS amount,
       institution_id, reg_time, created_at
FROM orders WHERE order_idx = '138625';

-- ─────────────────────────────────────────────
-- Q2: state_subject 값 분포 (drift 규모 추정)
-- 발송대기·결제확인 등 정상 상태 vs 취소·환불 상태
-- ─────────────────────────────────────────────
SELECT
  COALESCE(state_subject, '(NULL)') AS state,
  COUNT(*) AS cnt,
  SUM(sale_price * sale_cnt) AS total_amount,
  MIN(reg_time) AS oldest,
  MAX(reg_time) AS latest
FROM orders
GROUP BY state_subject
ORDER BY cnt DESC;

-- ─────────────────────────────────────────────
-- Q3: 오래된 발송대기 주문 (취소 가능성 높음)
-- reg_time 30일 이상 지났는데 여전히 발송대기 = 애니빌드에서 취소되었을 확률
-- ─────────────────────────────────────────────
SELECT
  id, order_idx, goods_name,
  state_subject, reg_time,
  (CURRENT_DATE - LEFT(reg_time, 10)::date) AS days_since_order,
  sale_price * sale_cnt AS amount,
  institution_id
FROM orders
WHERE state_subject IN ('발송대기', '입금대기', '결제확인', '주문접수')
  AND reg_time IS NOT NULL
  AND LEFT(reg_time, 10)::date < CURRENT_DATE - INTERVAL '30 days'
ORDER BY reg_time ASC
LIMIT 100;

-- ─────────────────────────────────────────────
-- Q4: 특정 시점 이후 상태 갱신 이력 (drift 시작 시점 추정)
-- ─────────────────────────────────────────────
SELECT
  DATE(created_at) AS created_date,
  COUNT(*) AS orders_created,
  COUNT(DISTINCT state_subject) AS unique_states
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY created_date DESC;
