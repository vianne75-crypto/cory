-- 최근 1년 이내 알쓰패치 구매 보건소 추출 (L8 통합 안내 우선 발송 대상)
-- 작성: 2026-04-17 (PULSE 다온, 대표 지시)
-- 목적: 알쓰패치 통합전략 + 포장 리뉴얼 + 노담 세계금연의날 이벤트 통합 알림톡 1차 발송 대상
-- Supabase SQL Editor에서 실행

-- 포함: 보건소, 통합건강증진지원센터, 금연클리닉, 금연지원센터
-- 제외: 중독관리통합지원센터, 정신보건센터, 건강생활지원센터

SELECT DISTINCT
  i.id,
  i.name,
  i.type,
  i.region,
  i.district,
  i.purchase_stage,
  i.last_purchase_date,
  i.purchase_count,
  i.metadata->>'contact_name' AS contact_name,
  i.metadata->>'contact_mobile' AS contact_mobile,
  i.metadata->>'contact_phone' AS contact_phone
FROM institutions i
JOIN orders o ON o.institution_id = i.id
WHERE
  -- ① 포함: 보건소 OR 통합건강증진 OR 금연클리닉 OR 금연지원
  (
    i.name LIKE '%보건소%'
    OR i.name LIKE '%통합건강증진%'
    OR i.name LIKE '%금연클리닉%'
    OR i.name LIKE '%금연지원%'
  )
  -- ② 제외: 중독/정신보건/건강생활지원
  AND i.name NOT LIKE '%중독%'
  AND i.name NOT LIKE '%정신보건%'
  AND i.name NOT LIKE '%건강생활지원%'
  -- ③ 알쓰패치 상품 (노담 제외)
  AND o.goods_name ILIKE '%알쓰%'
  AND o.goods_name NOT ILIKE '%노담%'
  -- ④ 최근 1년 이내 구매
  AND o.reg_time::date >= (CURRENT_DATE - INTERVAL '1 year')
  -- ⑤ 취소/환불 제외
  AND COALESCE(o.state_subject, '') NOT IN ('취소', '환불')
ORDER BY i.last_purchase_date DESC NULLS LAST;

-- ─── 요약 카운트 (별도 실행) ────────────────────────
-- 총 대상 기관 수 + 연락처 보유 기관 수 확인용
/*
SELECT
  COUNT(DISTINCT i.id) AS total_institutions,
  COUNT(DISTINCT CASE
    WHEN i.metadata->>'contact_mobile' IS NOT NULL
      OR i.metadata->>'contact_phone' IS NOT NULL
    THEN i.id END) AS with_phone,
  COUNT(DISTINCT CASE
    WHEN i.metadata->>'contact_mobile' IS NULL
      AND i.metadata->>'contact_phone' IS NULL
    THEN i.id END) AS no_phone
FROM institutions i
JOIN orders o ON o.institution_id = i.id
WHERE
  (i.name LIKE '%보건소%' OR i.name LIKE '%통합건강증진%' OR i.name LIKE '%금연클리닉%' OR i.name LIKE '%금연지원%')
  AND i.name NOT LIKE '%중독%'
  AND i.name NOT LIKE '%정신보건%'
  AND i.name NOT LIKE '%건강생활지원%'
  AND o.goods_name ILIKE '%알쓰%'
  AND o.goods_name NOT ILIKE '%노담%'
  AND o.reg_time::date >= (CURRENT_DATE - INTERVAL '1 year')
  AND COALESCE(o.state_subject, '') NOT IN ('취소', '환불');
*/
