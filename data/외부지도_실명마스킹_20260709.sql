-- 외부 공개지도 실명 비공개 (2026-07-09 대표 확정) — 대표 Supabase 1회 실행
-- 원칙: 내부(cory)=전체 실명 / 외부 공개지도=실명 표시 안 함.
-- 구현: 공개뷰가 name_public=true(정부 발간물 수록 or 공개동의 확보분)일 때만 실명,
--       그 외는 name=NULL 반환 → 외부 API로도 실명 유출 없음(DB 레벨 차단).
-- SAGE/BOND 옵트인 룰(기본 false·동의분만 true·군보안 강제 false)과 정합.

CREATE OR REPLACE VIEW public_adopted_institutions AS
SELECT id,
  CASE WHEN name_public THEN name ELSE NULL END AS name,   -- 옵트인(true)만 실명, 나머지 NULL
  type, region, district, lat, lng,
  NULLIF(LEFT(COALESCE(NULLIF(first_purchase_date::text,''), NULLIF(last_purchase_date::text,'')),4),'')::int AS adopted_year,
  track, name_public, institution_class,
  metadata->'service_regions' AS service_regions,
  metadata->>'service_scope'  AS service_scope
FROM institutions
WHERE purchase_amount > 0
  AND type IN ('보건소','전문기관','금연지원센터','광역시도 및 중앙기관','공공병원','기타 지자체 및 복지기관')
  AND COALESCE((metadata->>'public_optout')::boolean, false) = false;
GRANT SELECT ON public_adopted_institutions TO anon;

-- 검증: 현재 전 기관 name_public=false → name 전부 NULL(외부 실명 노출 0)
-- SELECT count(*) FILTER (WHERE name IS NOT NULL) AS 실명노출 FROM public_adopted_institutions;  -- 0 기대
