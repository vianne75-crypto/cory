-- D4: referral_confirmed 필드 추가
-- 추천 행동이 확인된 기관만 purchase_stage='추천' 유지
-- 실행: Supabase Dashboard → SQL Editor

ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS referral_confirmed BOOLEAN DEFAULT FALSE;

-- 현재 추천 단계 기관 확인용 (실행 전 검토)
-- SELECT id, name, purchase_stage, referral_confirmed
-- FROM institutions
-- WHERE purchase_stage = '추천';
