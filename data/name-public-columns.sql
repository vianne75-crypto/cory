-- 도입기관 실명공개 제어 컬럼 (BOND 판정 반영 · 2026-07-07)
-- name_public: 지도 실명 노출 여부 (대표: 기관명이라 공개 OK / 군·보안=강제 false)
-- institution_class: 군/보안 등 특수 식별 · name_source: 실명 출처
-- 프론트(adopted-map)는 name_public=false면 "유형(지역)" 익명 표기 + 면책배너

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS name_public   boolean DEFAULT true;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS institution_class text;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS name_source   text;

-- 군경소방 = 강제 비공개 (BOND 특수기관 제약)
UPDATE institutions SET name_public = false, institution_class = '군경소방'
 WHERE type = '군경소방';
-- 실거래 도입기관(비군) = 실명 공개 OK, 출처=실거래
UPDATE institutions SET name_source = '실거래'
 WHERE purchase_amount > 0 AND type <> '군경소방';

-- 공개뷰에 name_public·institution_class 노출 (프론트 제어용)
CREATE OR REPLACE VIEW public_adopted_institutions AS
SELECT id, name, type, region, district, lat, lng,
  NULLIF(LEFT(COALESCE(NULLIF(first_purchase_date::text,''), NULLIF(last_purchase_date::text,'')),4),'')::int AS adopted_year,
  track, name_public, institution_class
FROM institutions
WHERE purchase_amount > 0
  AND type IN ('보건소','전문기관','금연지원센터','광역시도 및 중앙기관','공공병원','기타 지자체 및 복지기관')
  -- 군경소방은 view 자체에서도 제외(이중 안전)
  AND COALESCE((metadata->>'public_optout')::boolean, false) = false;
GRANT SELECT ON public_adopted_institutions TO anon;

-- 검증: SELECT count(*) FILTER (WHERE name_public) AS 공개, count(*) FILTER (WHERE NOT name_public) AS 비공개 FROM public_adopted_institutions;
