-- 노담패치 사은가 발송 대상 — 알쓰패치 구매 이력 기관 (최근 3개월 노담 구매 제외)
-- 작성: 2026-05-05 (PULSE 다온)
-- 목적: 노담패치 세계금연의날 사은가 카카오 알림톡 + 이메일 발송 대상
-- 조건: 알쓰패치 최근 2년 구매 + 최근 3개월 노담 구매 제외 + 대리점/유통 제외
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
  i.metadata->>'contact_phone'  AS contact_phone,
  i.metadata->>'contact_email'  AS contact_email
FROM institutions i
WHERE
  -- ① 알쓰패치 최근 2년 구매 이력
  i.id IN (
    SELECT DISTINCT o.institution_id
    FROM orders o
    WHERE
      o.goods_name ILIKE '%알쓰%'
      AND o.goods_name NOT ILIKE '%노담%'
      AND o.reg_time::date >= (CURRENT_DATE - INTERVAL '2 years')
      AND COALESCE(o.state_subject, '') NOT IN ('취소', '환불')
      AND o.institution_id IS NOT NULL
  )
  -- ② 최근 3개월(2026-02-05~2026-05-05) 노담패치 구매 기관 제외
  AND i.id NOT IN (
    SELECT DISTINCT o.institution_id
    FROM orders o
    WHERE
      o.goods_name ILIKE '%노담%'
      AND o.reg_time::date >= (CURRENT_DATE - INTERVAL '3 months')
      AND COALESCE(o.state_subject, '') NOT IN ('취소', '환불')
      AND o.institution_id IS NOT NULL
  )
  -- ③ 대리점 제외
  AND i.name NOT ILIKE '%대리점%'
  -- ④ 유통회원 제외
  AND i.name NOT ILIKE '%유통%'
  -- ⑤ APS대리점 제외
  AND i.name NOT ILIKE '%APS%대리%'
  AND i.name NOT ILIKE '%에이피에스%대리%'
  -- ⑥ 연락처 보유 (email 또는 phone 중 하나)
  AND (
    (i.metadata->>'contact_email') IS NOT NULL
    OR (i.metadata->>'contact_mobile') IS NOT NULL
    OR (i.metadata->>'contact_phone')  IS NOT NULL
  )
ORDER BY
  i.purchase_stage,
  i.last_purchase_date DESC NULLS LAST;

-- ─── 요약 카운트 (별도 실행) ─────────────────────────────
/*
SELECT
  COUNT(DISTINCT i.id) AS total_cnt,
  COUNT(DISTINCT CASE WHEN (i.metadata->>'contact_email') IS NOT NULL THEN i.id END) AS has_email,
  COUNT(DISTINCT CASE WHEN (i.metadata->>'contact_mobile') IS NOT NULL THEN i.id END) AS has_mobile,
  COUNT(DISTINCT CASE WHEN (i.metadata->>'contact_phone')  IS NOT NULL THEN i.id END) AS has_phone
FROM institutions i
WHERE
  i.id IN (
    SELECT DISTINCT o.institution_id FROM orders o
    WHERE o.goods_name ILIKE '%알쓰%' AND o.goods_name NOT ILIKE '%노담%'
      AND o.reg_time::date >= (CURRENT_DATE - INTERVAL '2 years')
      AND COALESCE(o.state_subject, '') NOT IN ('취소', '환불') AND o.institution_id IS NOT NULL
  )
  AND i.id NOT IN (
    SELECT DISTINCT o.institution_id FROM orders o
    WHERE o.goods_name ILIKE '%노담%' AND o.reg_time::date >= (CURRENT_DATE - INTERVAL '3 months')
      AND COALESCE(o.state_subject, '') NOT IN ('취소', '환불') AND o.institution_id IS NOT NULL
  )
  AND i.name NOT ILIKE '%대리점%' AND i.name NOT ILIKE '%유통%'
  AND i.name NOT ILIKE '%APS%대리%' AND i.name NOT ILIKE '%에이피에스%대리%'
  AND ((i.metadata->>'contact_email') IS NOT NULL OR (i.metadata->>'contact_mobile') IS NOT NULL OR (i.metadata->>'contact_phone') IS NOT NULL);
*/
