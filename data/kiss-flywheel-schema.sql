-- ============================================
-- KISS 플라이휠(구매의향 신호) 저장 — 유실 복구
-- 작성: 2026-07-05 (FLUX)
-- 목적: 완료화면 3버튼(직접구매/공공경로/보건기관문의) 선택 저장.
-- ⚠️ 라이브 테이블은 PIXEL이 먼저 생성함(컬럼: id·created_at·choice·utm_*).
--    본 파일은 그 테이블에 조인키 ref_key만 추가하는 정합용(idempotent).
-- 실행: Supabase SQL Editor
-- ============================================

-- 없으면 생성 (있으면 skip)
CREATE TABLE IF NOT EXISTS public.kiss_flywheel (
  id SERIAL PRIMARY KEY,
  choice VARCHAR(20),
  utm_source VARCHAR(50),
  utm_medium VARCHAR(50),
  utm_campaign VARCHAR(50),
  utm_content VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기존 PIXEL 테이블과 정합: 비식별 조인키 추가 (원본 전화 저장 안 함)
ALTER TABLE public.kiss_flywheel ADD COLUMN IF NOT EXISTS ref_key VARCHAR(64);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_kiss_flywheel_created_at ON public.kiss_flywheel(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kiss_flywheel_ref_key    ON public.kiss_flywheel(ref_key);
CREATE INDEX IF NOT EXISTS idx_kiss_flywheel_choice     ON public.kiss_flywheel(choice);

-- GRANT (2026-10-30 정책 준수)
GRANT SELECT, INSERT, UPDATE ON public.kiss_flywheel TO authenticated;
GRANT ALL ON public.kiss_flywheel TO service_role;

-- ─── 실행 후 ───
-- Worker /kiss-flywheel 은 이미 choice·ref_key·utm_* 로 저장 (컬럼 일치, 코드 수정 불필요).
-- PIXEL: 완료화면 3버튼을 레거시 프록시(/kiss2026/api/apply) →
--   aps-lead.vianne75.workers.dev/kiss-flywheel 로 전환.
-- 전환 완료 후: 레거시 프록시 anon 저장 분기 폐기 + kiss_flywheel RLS 강화 검토.

-- ─── 검증 (별도 실행) ───
/*
SELECT choice, ref_key, created_at FROM public.kiss_flywheel ORDER BY id DESC LIMIT 5;
*/
