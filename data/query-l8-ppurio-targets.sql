-- L8 비즈뿌리오 알림톡 발송 대상 — 연락처 보유 기관
-- 작성: 2026-04-21 (PULSE 다온)
-- 목적: 알쓰패치 통합전략 + 포장 리뉴얼 + 노담 세계금연의날 이벤트 알림톡 발송
-- 조건: 구매·재구매·만족·추천·파트너 단계 + 연락처(mobile 또는 phone) 보유
-- Supabase SQL Editor에서 실행

SELECT
  i.id,
  i.name,
  i.type,
  i.region,
  i.district,
  i.purchase_stage,
  i.last_purchase_date,
  i.metadata->>'contact_name'   AS contact_name,
  i.metadata->>'contact_mobile' AS contact_mobile,
  i.metadata->>'contact_phone'  AS contact_phone
FROM institutions i
WHERE
  -- ① 구매 경험 있는 단계만
  i.purchase_stage IN ('구매', '재구매', '만족', '추천', '파트너')
  -- ② 연락처 보유 (mobile 또는 phone 중 하나라도)
  AND (
    (i.metadata->>'contact_mobile') IS NOT NULL
    OR (i.metadata->>'contact_phone') IS NOT NULL
  )
  -- ③ 노담패치 최근 구매 기관 제외 (별도 서브쿼리)
  AND i.id NOT IN (
    SELECT DISTINCT o.institution_id
    FROM orders o
    WHERE
      o.goods_name ILIKE '%노담%'
      AND o.reg_time::date >= (CURRENT_DATE - INTERVAL '1 year')
      AND COALESCE(o.state_subject, '') NOT IN ('취소', '환불')
      AND o.institution_id IS NOT NULL
  )
ORDER BY
  i.purchase_stage,
  i.last_purchase_date DESC NULLS LAST;

-- ─── 요약 카운트 (별도 실행) ─────────────────────────────
/*
SELECT
  i.purchase_stage,
  COUNT(*) AS cnt,
  COUNT(CASE WHEN (i.metadata->>'contact_mobile') IS NOT NULL THEN 1 END) AS has_mobile,
  COUNT(CASE WHEN (i.metadata->>'contact_phone')  IS NOT NULL THEN 1 END) AS has_phone
FROM institutions i
WHERE
  i.purchase_stage IN ('구매', '재구매', '만족', '추천', '파트너')
  AND (
    (i.metadata->>'contact_mobile') IS NOT NULL
    OR (i.metadata->>'contact_phone') IS NOT NULL
  )
  AND i.id NOT IN (
    SELECT DISTINCT o.institution_id FROM orders o
    WHERE o.goods_name ILIKE '%노담%'
      AND o.reg_time::date >= (CURRENT_DATE - INTERVAL '1 year')
      AND COALESCE(o.state_subject, '') NOT IN ('취소', '환불')
      AND o.institution_id IS NOT NULL
  )
GROUP BY i.purchase_stage
ORDER BY cnt DESC;
*/
