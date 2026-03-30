-- consultations 테이블 팔로업 컬럼 확장
-- 실행: Supabase Dashboard → SQL Editor

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT '애니빌드',
  ADD COLUMN IF NOT EXISTS contact_type TEXT,
  ADD COLUMN IF NOT EXISTS result       TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS next_followup_date DATE,
  ADD COLUMN IF NOT EXISTS campaign     TEXT;

-- 기존 데이터 source 백필
UPDATE consultations SET source = '애니빌드' WHERE source IS NULL;

-- 인덱스 (기관별 팔로업 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_consultations_inst_date
  ON consultations(institution_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_source
  ON consultations(source);
CREATE INDEX IF NOT EXISTS idx_consultations_next_followup
  ON consultations(next_followup_date)
  WHERE next_followup_date IS NOT NULL;
