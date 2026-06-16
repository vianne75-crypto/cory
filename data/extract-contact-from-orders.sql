-- ============================================
-- wcolive 주문 데이터에서 담당자 정보 추출
-- 작성: 2026-05-20 (FLUX 이음 / PULSE 다온)
-- 목적: orders.option_user에서 담당자명·전화·이메일 추출 → institutions에 충원
-- 실행 순서: Step 1 (샘플 확인) → Step 2 (정규식 추출) → Step 3 (UPDATE)
-- ============================================

-- ─────────────────────────────────────────────
-- Step 1: option_user 샘플 분석 (실행 후 패턴 확인)
-- ─────────────────────────────────────────────
SELECT
  o.institution_id,
  i.name AS inst_name,
  o.option_user,
  o.addr,
  o.reg_time
FROM orders o
JOIN institutions i ON o.institution_id = i.id
WHERE o.option_user IS NOT NULL
  AND LENGTH(o.option_user) > 10
  AND i.purchase_stage IN ('구매', '재구매', '만족', '추천', '파트너')
  AND (i.contact_email IS NULL AND i.contact_mobile IS NULL)
ORDER BY o.reg_time DESC
LIMIT 20;

-- ─────────────────────────────────────────────
-- Step 2: 패턴별 추출 가능성 분석
-- ─────────────────────────────────────────────
/*
SELECT
  COUNT(*) AS total_orders,
  COUNT(CASE WHEN o.option_user ~ '\d{2,3}-?\d{3,4}-?\d{4}' THEN 1 END) AS has_phone_pattern,
  COUNT(CASE WHEN o.option_user ~ '01[016789]-?\d{3,4}-?\d{4}' THEN 1 END) AS has_mobile_pattern,
  COUNT(CASE WHEN o.option_user ~ '[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' THEN 1 END) AS has_email_pattern,
  COUNT(CASE WHEN o.option_user ~ '담당자[:\s]*[가-힣]{2,4}' THEN 1 END) AS has_contact_label
FROM orders o
JOIN institutions i ON o.institution_id = i.id
WHERE o.option_user IS NOT NULL
  AND i.purchase_stage IN ('구매', '재구매', '만족', '추천', '파트너');
*/

-- ─────────────────────────────────────────────
-- Step 3: 추출 함수 (option_user 파싱)
-- ─────────────────────────────────────────────
/*
-- 정규식 패턴:
-- 이메일: [A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}
-- 모바일: 01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}
-- 유선: 0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}
-- 담당자명: 담당자[:\s]+([가-힣]{2,4})

CREATE OR REPLACE FUNCTION extract_contact_from_option(opt TEXT)
RETURNS TABLE(name TEXT, mobile TEXT, phone TEXT, email TEXT) AS $$
BEGIN
  RETURN QUERY SELECT
    (regexp_matches(opt, '담당자[:\s]+([가-힣]{2,4})'))[1] AS name,
    (regexp_matches(opt, '(01[016789][-.\s]?\d{3,4}[-.\s]?\d{4})'))[1] AS mobile,
    (regexp_matches(opt, '(0[2-6][0-9]?[-.\s]?\d{3,4}[-.\s]?\d{4})'))[1] AS phone,
    (regexp_matches(opt, '([A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'))[1] AS email;
END;
$$ LANGUAGE plpgsql;
*/

-- ─────────────────────────────────────────────
-- Step 4: 일괄 UPDATE (Step 1 결과 검토 후 실행)
-- ─────────────────────────────────────────────
/*
WITH extracted AS (
  SELECT
    o.institution_id,
    -- 가장 최근 주문에서 추출
    (regexp_match(o.option_user, '([A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'))[1] AS email,
    (regexp_match(o.option_user, '(01[016789][-.\s]?\d{3,4}[-.\s]?\d{4})'))[1] AS mobile,
    (regexp_match(o.option_user, '(0[2-6][0-9]?[-.\s]?\d{3,4}[-.\s]?\d{4})'))[1] AS phone,
    (regexp_match(o.option_user, '담당자[:\s]+([가-힣]{2,4})'))[1] AS contact_name,
    o.reg_time,
    ROW_NUMBER() OVER (PARTITION BY o.institution_id ORDER BY o.reg_time DESC) AS rn
  FROM orders o
  JOIN institutions i ON o.institution_id = i.id
  WHERE o.option_user IS NOT NULL
    AND i.purchase_stage IN ('구매', '재구매', '만족', '추천', '파트너')
    AND (i.contact_email IS NULL OR i.contact_mobile IS NULL)
)
UPDATE institutions i SET
  contact_email = COALESCE(i.contact_email, e.email),
  contact_mobile = COALESCE(i.contact_mobile, REPLACE(REPLACE(e.mobile, '.', '-'), ' ', '-')),
  contact_phone = COALESCE(i.contact_phone, REPLACE(REPLACE(e.phone, '.', '-'), ' ', '-')),
  contact_name = COALESCE(i.contact_name, e.contact_name),
  contact_updated_at = NOW()
FROM extracted e
WHERE i.id = e.institution_id
  AND e.rn = 1
  AND (e.email IS NOT NULL OR e.mobile IS NOT NULL OR e.phone IS NOT NULL OR e.contact_name IS NOT NULL);
*/

-- ─────────────────────────────────────────────
-- Step 5: 결과 검증
-- ─────────────────────────────────────────────
/*
SELECT
  COUNT(*) AS total,
  COUNT(contact_name) AS has_name,
  COUNT(contact_email) AS has_email,
  COUNT(contact_mobile) AS has_mobile,
  COUNT(contact_phone) AS has_phone,
  COUNT(CASE WHEN contact_email IS NOT NULL OR contact_mobile IS NOT NULL OR contact_phone IS NOT NULL THEN 1 END) AS has_any_contact
FROM institutions
WHERE purchase_stage IN ('구매', '재구매', '만족', '추천', '파트너');
*/
