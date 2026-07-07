-- ============================================
-- kiss_diagnosis: q2_channels_etc 컬럼 추가
-- 작성: 2026-07-07 (FLUX) — PIXEL kiss진단-q2etc컬럼 요청
-- 목적: Q2(정보습득 채널·복수선택) '기타' 자유입력란 저장.
--       프론트가 payload에 q2_channels_etc(text) 전송 → 컬럼 없으면 저장 누락.
-- 실행: Supabase SQL Editor (idempotent)
-- ============================================

ALTER TABLE public.kiss_diagnosis
  ADD COLUMN IF NOT EXISTS q2_channels_etc VARCHAR(100);

-- ⚠️ 조인 뷰(kiss_signup_diagnosis_view)가 라이브라면 이 컬럼을 노출하려면
--    kiss-privacy-hardening.sql 뷰 섹션을 재실행할 것(DROP VIEW 후 CREATE).
--    CREATE OR REPLACE는 중간 컬럼 삽입 불가 → DROP 후 재생성 필요.

-- ─── 검증 (별도 실행) ───
/*
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'kiss_diagnosis' AND column_name = 'q2_channels_etc';
*/
