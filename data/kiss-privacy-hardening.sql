-- ============================================
-- KISS 개인정보 강화 — BOND 지시 반영
-- 작성: 2026-07-03 (FLUX)
-- 목적: sensitive_agreed 별도 동의 + 설문↔연락처 비식별 분리
-- 근거: 개인정보보호법 §23 (민감정보), §26 (수탁)
-- 실행: Supabase SQL Editor
-- ============================================

-- ─────────────────────────────────────────────
-- Step 1: kiss_signups — 컬럼 추가
-- ─────────────────────────────────────────────
ALTER TABLE public.kiss_signups
  ADD COLUMN IF NOT EXISTS sensitive_agreed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.kiss_signups
  ADD COLUMN IF NOT EXISTS sensitive_agreed_at TIMESTAMPTZ;

ALTER TABLE public.kiss_signups
  ADD COLUMN IF NOT EXISTS ref_key VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_kiss_signups_ref_key ON public.kiss_signups(ref_key);

-- ─────────────────────────────────────────────
-- Step 2: kiss_diagnosis — 비식별 재구성
-- ref_phone 제거 + ref_key 신설 (phone·이름 완전 격리)
-- ─────────────────────────────────────────────
ALTER TABLE public.kiss_diagnosis
  ADD COLUMN IF NOT EXISTS ref_key VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_kiss_diagnosis_ref_key ON public.kiss_diagnosis(ref_key);

-- ref_phone 컬럼 제거 (기존 값 있어도 개인정보 원칙상 삭제)
-- 안전 삭제: 먼저 NULL 갱신 → 삭제
UPDATE public.kiss_diagnosis SET ref_phone = NULL WHERE ref_phone IS NOT NULL;
ALTER TABLE public.kiss_diagnosis DROP COLUMN IF EXISTS ref_phone;

-- 관련 인덱스도 제거 (컬럼 삭제 시 자동 제거되지만 명시)
DROP INDEX IF EXISTS idx_kiss_diagnosis_ref_phone;

-- ─────────────────────────────────────────────
-- Step 3: 조인 뷰 재구성 — ref_key 기반
-- ─────────────────────────────────────────────
DROP VIEW IF EXISTS public.kiss_signup_diagnosis_view;

CREATE VIEW public.kiss_signup_diagnosis_view AS
SELECT
  s.id AS signup_id,
  s.name,
  s.phone,
  s.institution_name,
  s.email,
  s.marketing_agreed,
  s.sensitive_agreed,
  s.matched_institution_id,
  s.created_at AS signup_at,
  d.id AS diagnosis_id,
  d.q1_attendance,
  d.q2_channels,
  d.q2_channels_etc,
  d.q3_public,
  d.q4_cjm,
  d.q5_usage,
  d.q6_flywheel,
  d.created_at AS diagnosis_at
FROM public.kiss_signups s
LEFT JOIN public.kiss_diagnosis d ON d.ref_key = s.ref_key
ORDER BY s.created_at DESC;

GRANT SELECT ON public.kiss_signup_diagnosis_view TO authenticated, service_role;

-- ─────────────────────────────────────────────
-- Step 4: 검증 쿼리 (별도 실행)
-- ─────────────────────────────────────────────
/*
-- kiss_signups 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kiss_signups' AND column_name IN ('sensitive_agreed','sensitive_agreed_at','ref_key');

-- kiss_diagnosis 컬럼 확인 (ref_phone 삭제·ref_key 존재)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kiss_diagnosis' ORDER BY ordinal_position;

-- 뷰 확인
SELECT * FROM public.kiss_signup_diagnosis_view LIMIT 5;
*/
