-- ============================================================
-- C-03: followup_date 컬럼 추가 + 예산 편성기 D-day 설정
-- 작성: FLUX 이음 (SAGE 대행) | 2026-03-29
-- 대상: COLD 단계 B2G 기관 99건 → followup_date = 2026-09-01
-- 실행: Supabase SQL Editor (rvqkoiqjjhlrgqitnxwt.supabase.co)
-- ============================================================

-- STEP 1: 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS followup_date TEXT;

-- ============================================================
-- STEP 2: B2G 기관 일괄 followup_date 설정
--  대상 유형: 보건소, 전문기관(중독관리/정신건강복지센터),
--             군/경/소방, 광역시도 건강증진부서, 공공기관(기타), 금연지원센터
--  조건: purchase_stage = 'cold' AND 해당 유형
-- ============================================================

UPDATE institutions
SET followup_date = '2026-09-01'
WHERE purchase_stage = 'cold'
  AND type IN (
    '보건소',
    '전문기관',
    '군/경/소방',
    '광역시도 건강증진부서',
    '공공기관(기타)',
    '금연지원센터'
  );

-- ============================================================
-- STEP 3: 결과 확인
-- ============================================================

SELECT
  type,
  COUNT(*) AS 건수,
  followup_date
FROM institutions
WHERE followup_date = '2026-09-01'
GROUP BY type, followup_date
ORDER BY 건수 DESC;

-- 예상 결과:
-- 보건소          34건
-- 전문기관        30건
-- 군/경/소방      19건
-- 공공기관(기타)   4건
-- 광역시도         1건
-- 금연지원센터     1건
-- 합계 약 89건
-- (99건 기준과 차이가 있으면 type 컬럼값 확인 필요 — 아래 조회로 확인)

-- 보조 조회: type 컬럼 실제 값 확인
-- SELECT DISTINCT type FROM institutions WHERE purchase_stage = 'cold' ORDER BY type;
