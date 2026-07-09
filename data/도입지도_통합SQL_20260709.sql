-- ================================================================
-- 도입지도 통합 SQL — 대표 Supabase SQL Editor에서 1회 실행
-- 2026-07-09 · 한 번에 수행:
--   ① 실명공개 제어 컬럼 (name_public·institution_class·name_source)
--   ② 전남광주통합특별시 출범(2026-07-01) region 갱신 (구명칭 legacy 보존)
--   ③ 광역/권역 관할 service_regions 신명칭 치환
--   ④ 통합 공개뷰 재생성 (실명·관할·군경소방 제외 반영)
-- ⚠️ 이 파일이 name-public-columns.sql을 대체(supersede).
-- ================================================================

-- ── ① 실명공개 제어 컬럼 ──
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS name_public       boolean DEFAULT true;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS institution_class text;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS name_source       text;

UPDATE institutions SET name_public = false, institution_class = '군경소방'
 WHERE type = '군경소방';
UPDATE institutions SET name_source = '실거래'
 WHERE purchase_amount > 0 AND type <> '군경소방';

-- ── ② 전남광주통합특별시 region 갱신 (구 광주광역시·전라남도·전남 → 통합명) ──
-- 구명칭은 metadata.legacy_region에 보존(주소 캐시 혼재·소급 조회 대응). district(시군구)·track 불변.
UPDATE institutions
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{legacy_region}', to_jsonb(region)),
      region   = '전남광주통합특별시'
  WHERE region IN ('광주광역시', '전라남도', '전남');

-- ── ③ 광역 관할 service_regions 신명칭 치환 (화순전남금연지원센터 등) ──
UPDATE institutions
  SET metadata = jsonb_set(metadata, '{service_regions}', '["전남광주통합특별시"]'::jsonb)
  WHERE metadata->'service_regions' ?| array['광주광역시','전라남도','전남'];

-- ── ④ 통합 공개뷰 ──
CREATE OR REPLACE VIEW public_adopted_institutions AS
SELECT id, name, type, region, district, lat, lng,
  NULLIF(LEFT(COALESCE(NULLIF(first_purchase_date::text,''), NULLIF(last_purchase_date::text,'')),4),'')::int AS adopted_year,
  track, name_public, institution_class,
  metadata->'service_regions' AS service_regions,   -- jsonb array (관할 시도)
  metadata->>'service_scope'  AS service_scope       -- 광역|권역|(null=기초)
FROM institutions
WHERE purchase_amount > 0
  AND type IN ('보건소','전문기관','금연지원센터','광역시도 및 중앙기관','공공병원','기타 지자체 및 복지기관')
  -- 군경소방 의도적 제외(실명 민감성)
  AND COALESCE((metadata->>'public_optout')::boolean, false) = false;
GRANT SELECT ON public_adopted_institutions TO anon;

-- ── 검증 ──
-- SELECT region, count(*) FROM institutions WHERE region='전남광주통합특별시' GROUP BY region;  -- 약 126
-- SELECT name, service_regions, service_scope FROM public_adopted_institutions WHERE service_scope IS NOT NULL;
-- SELECT count(*) FILTER (WHERE name_public) 공개, count(*) FILTER (WHERE NOT name_public) 비공개 FROM public_adopted_institutions;
