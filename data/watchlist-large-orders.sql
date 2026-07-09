-- ============================================================
-- 대형거래 워치리스트 감지 뷰 (cory데이터고도화-Q1, SAGE 승인 7/9)
-- 목적: 대형거래 미포착 방지 — ①KISS 대형계정/b2b 사업장 주문 자동감지
--       ②미매칭 대형주문(놓칠 위험) 상시 노출.
-- 발단: 현대차 950·롯데GRS 6,500개가 미매칭으로 방치됐던 사고.
-- 실행: Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE VIEW watchlist_large_orders AS
SELECT
  o.id           AS order_id,
  o.order_idx,
  o.reg_time,
  o.option_user,
  o.sale_cnt,
  o.sale_price,
  (o.sale_cnt * o.sale_price) AS amount,
  o.institution_id,
  i.name         AS inst_name,
  i.track,
  CASE
    WHEN i.id IS NOT NULL
         AND (i.metadata->>'source' LIKE '%KISS%' OR i.track = 'b2b')
                                                    THEN '🎯 워치리스트 히트(대형계정 주문)'
    WHEN o.institution_id IS NULL AND o.sale_cnt >= 300
                                                    THEN '🔴 미매칭 대형(놓칠 위험)'
    WHEN o.sale_cnt >= 500                          THEN '🟡 대형거래'
    ELSE '· 중형'
  END AS flag
FROM orders o
LEFT JOIN institutions i ON i.id = o.institution_id
WHERE o.sale_cnt >= 300
   OR (i.id IS NOT NULL AND (i.metadata->>'source' LIKE '%KISS%' OR i.track = 'b2b'))
ORDER BY o.reg_time DESC;

GRANT SELECT ON watchlist_large_orders TO anon, authenticated;

-- ─── PULSE 주간 루틴 쿼리 ───
-- 미포착 위험만:  SELECT * FROM watchlist_large_orders WHERE flag = '🔴 미매칭 대형(놓칠 위험)';
-- 대형계정 히트:  SELECT * FROM watchlist_large_orders WHERE flag LIKE '🎯%';
-- 임계 알림 후보(SAGE): 신규 미매칭 대형주문 발생 시 주간 확인 → 매칭 or 신규 기관 등록.
