-- ============================================================
-- ICP v3.1 트랙 필드 추가 + 자동 분류
-- 출처: SAGE 공지 ICP-v3.1-3트랙공지 (2026-06-05)
-- 문서: 마케팅전략/aps_marketing/ICP_v3.1_3트랙_B2G.md
-- 작성: FLUX 이음 (2026-06-09)
-- 실행: Supabase SQL Editor에서 전체 복사·실행 (대표 또는 SAGE 읽기권 외 — UPDATE 포함)
-- ============================================================

-- 1) track 컬럼 추가 (ENUM 대용 VARCHAR + CHECK 제약)
--    값: 1A(광역시 자치구) · 1B(일반 시) · 1C(군 단위) · mega(광역 메가/공공 전문) · b2b(사업장) · other
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS track VARCHAR(10);

ALTER TABLE institutions DROP CONSTRAINT IF EXISTS institutions_track_check;
ALTER TABLE institutions ADD CONSTRAINT institutions_track_check
  CHECK (track IS NULL OR track IN ('1A','1B','1C','mega','b2b','other'));

-- 2) 인덱스 (대시보드 트랙별 필터/집계용)
CREATE INDEX IF NOT EXISTS idx_institutions_track ON institutions (track);

-- 3) 자동 분류 UPDATE
--    ⚠️ 순서 중요: '군' 판정이 광역시 '구' 판정보다 먼저 와야 함
--       (울주군=울산광역시, 기장군=부산광역시, 달성군/군위군=대구, 강화군/옹진군=인천 → 모두 1C)
UPDATE institutions SET track = CASE
  -- 보건소 3트랙 (ICP v3.1 핵심)
  WHEN type = '보건소' AND district LIKE '%군' THEN '1C'   -- 군 단위 (광역시 소속 군 포함)
  WHEN type = '보건소' AND region IN (
        '서울특별시','부산광역시','대구광역시','인천광역시',
        '광주광역시','대전광역시','울산광역시'
      ) AND district LIKE '%구' THEN '1A'                   -- 광역시 자치구
  WHEN type = '보건소' AND district LIKE '%시' THEN '1B'    -- 일반 시
  WHEN type = '보건소' AND district LIKE '%구' THEN '1B'    -- 일반 시 행정구(특례시 등)
  WHEN type = '보건소' THEN 'other'                          -- 분류 불가 보건소(예외)

  -- 2차 ICP: 사업장
  WHEN type IN ('산업보건','사업장') THEN 'b2b'

  -- 광역 메가 채널 + 공공 전문기관 (ICP §4)
  WHEN type IN ('광역시도 및 중앙기관','금연지원센터','전문기관') THEN 'mega'

  -- 그 외(대학보건센터·전공교육·강사·대행사·교육기관·군경소방·복지기관)
  ELSE 'other'
END;

-- 4) 검증 쿼리 (실행 후 결과 확인)
-- SELECT track, count(*) FROM institutions GROUP BY track ORDER BY track;
-- 기대값(보건소 241 기준): 1A≈72 · 1B≈86 · 1C≈83
-- SELECT region, district, name FROM institutions WHERE type='보건소' AND track IS NULL;  -- 0건이어야 정상
