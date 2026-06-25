-- ============================================================
-- 도입기관 공개 지도·목록 — 공개용 View (FLUX 데이터 피드)
-- 출처: 대표 인사이트 2026-06-25 (도입기관 공개지도)
-- 설계: cory/도입기관_공개지도_설계_FLUX.md
-- 실행: Supabase SQL Editor (대표 또는 service_role)
-- ============================================================

-- 공개 노출 = 기관명·유형·지역·좌표·도입연도만. 담당자·금액·수량·메모는 절대 제외.
CREATE OR REPLACE VIEW public_adopted_institutions AS
SELECT
  id,
  name,
  type,
  region,
  district,
  lat,
  lng,
  EXTRACT(YEAR FROM first_purchase_date)::int AS adopted_year,
  track
FROM institutions
WHERE purchase_amount > 0                          -- 실거래 발생 = 도입 (purchase_stage는 수기·과소집계라 미사용)
  AND type IN ('보건소','전문기관','금연지원센터','광역시도 및 중앙기관')
  AND COALESCE((metadata->>'public_optout')::boolean, false) = false;  -- 기관 옵트아웃 존중

-- Supabase Data API 노출 (2026-10-30 GRANT enforcement 정책 대응)
GRANT SELECT ON public_adopted_institutions TO anon;

-- 검증
-- SELECT count(*) FROM public_adopted_institutions;          -- 약 198건
-- SELECT region, count(*) FROM public_adopted_institutions GROUP BY region ORDER BY 2 DESC;
-- SELECT count(*) FROM public_adopted_institutions WHERE lat IS NOT NULL;  -- 약 96%

-- ⚠️ 실명 공개 go-live 전 BOND 법적 검토(공공기관 중립성·동의) 필수.
--    폴백: name 제외하고 district 단위 카운트만 노출하는 별도 뷰로 전환 가능.
