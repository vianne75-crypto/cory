-- ============================================
-- alth 공용 랜딩(B2G/B2B) 문의 리드 테이블
-- 작성: 2026-07-07 (FLUX) — PIXEL alth리드폼-엔드포인트 요청
-- 목적: alth.co.kr /gov·/biz 문의 폼 → aps-lead Worker POST /alth-lead 저장.
--       PULSE 전화 후속관리. KISS 패턴 재사용(별도 테이블).
-- 정책: Supabase 2026-10-30 GRANT enforcement 준수.
-- ※ 개인정보: B2G/B2B 문의 = 연락 동의(privacy_agreed) 기반 → 전화 평문 저장
--    (KISS 대중 신청과 달리 후속 연락이 목적. 민감정보 없음).
-- 실행: Supabase SQL Editor
-- ============================================

-- Step 1: 테이블 생성
CREATE TABLE IF NOT EXISTS public.alth_leads (
  id SERIAL PRIMARY KEY,

  track           VARCHAR(20),    -- 'public'(보건기관) | 'workplace'(사업장)
  institution     VARCHAR(200),   -- 기관/사업장명
  name            VARCHAR(50),    -- 담당자명
  phone           VARCHAR(20),    -- 연락처 (후속 목적 평문)
  message         TEXT,           -- 문의 내용 (선택)

  -- 동의 (연락 동의)
  privacy_agreed     BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_agreed_at  TIMESTAMPTZ,

  -- 유입 추적
  page          VARCHAR(200),     -- 제출 페이지 경로 (/gov, /biz 등)
  utm_source    VARCHAR(50),
  utm_medium    VARCHAR(50),
  utm_campaign  VARCHAR(50),
  utm_content   VARCHAR(50),

  -- 감사
  ip_hash       VARCHAR(64),
  user_agent    VARCHAR(300),

  -- CRM 후속관리 (PULSE)
  matched_institution_id INTEGER REFERENCES public.institutions(id) ON DELETE SET NULL,
  status        VARCHAR(20) DEFAULT 'new',   -- new/contacted/qualified/converted/dropped
  processed     BOOLEAN DEFAULT FALSE,
  processed_at  TIMESTAMPTZ,
  processed_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: 인덱스
CREATE INDEX IF NOT EXISTS idx_alth_leads_created_at ON public.alth_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alth_leads_track      ON public.alth_leads(track);
CREATE INDEX IF NOT EXISTS idx_alth_leads_status     ON public.alth_leads(status);
CREATE INDEX IF NOT EXISTS idx_alth_leads_phone      ON public.alth_leads(phone);   -- 60초 중복 방지 조회

-- Step 3: GRANT (2026-10-30 enforcement 대비)
GRANT SELECT, INSERT, UPDATE ON public.alth_leads TO authenticated;
GRANT ALL ON public.alth_leads TO service_role;
GRANT USAGE ON SEQUENCE public.alth_leads_id_seq TO authenticated, service_role;

-- Step 4: RLS 정책 (kiss_diagnosis 패턴 정합)
ALTER TABLE public.alth_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all alth_leads"
  ON public.alth_leads FOR ALL
  USING (is_admin());

CREATE POLICY "Service insert alth_leads"
  ON public.alth_leads FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service select alth_leads"
  ON public.alth_leads FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service update alth_leads"
  ON public.alth_leads FOR UPDATE
  USING (auth.role() = 'service_role');

-- ─── 검증 (별도 실행) ───
/*
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'alth_leads' ORDER BY ordinal_position;
SELECT id, track, institution, name, phone, status, created_at FROM public.alth_leads ORDER BY id DESC LIMIT 5;
*/
