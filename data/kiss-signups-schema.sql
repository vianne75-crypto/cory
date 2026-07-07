-- ============================================
-- KISS 2026 신청 폼 백엔드 스키마
-- 작성: 2026-07-02 (PULSE + FLUX)
-- 목적: KISS QR 랜딩 신청 데이터 저장 + 카운터
-- 정책: Supabase 2026-10-30 GRANT enforcement 준수
-- 실행: Supabase SQL Editor (대표 승인 후)
-- ============================================

-- ─────────────────────────────────────────────
-- Step 1: kiss_signups 테이블 생성
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kiss_signups (
  id SERIAL PRIMARY KEY,

  -- 리드 필수 정보
  name             VARCHAR(50)  NOT NULL,
  phone            VARCHAR(20)  NOT NULL,
  institution_name VARCHAR(200) NOT NULL,
  address          VARCHAR(500),

  -- 선택 정보
  email            VARCHAR(100),
  quiz_answer      VARCHAR(20),           -- 폭음 퀴즈 응답 코드 (참고)

  -- 동의 (감사 로그)
  privacy_agreed        BOOLEAN NOT NULL DEFAULT false,
  marketing_agreed      BOOLEAN NOT NULL DEFAULT false,
  privacy_agreed_at     TIMESTAMPTZ,

  -- 유입 추적
  utm_source   VARCHAR(50),
  utm_medium   VARCHAR(50),
  utm_campaign VARCHAR(50),
  utm_content  VARCHAR(50),

  -- cory 연동 (자동 매칭)
  matched_institution_id INTEGER REFERENCES public.institutions(id) ON DELETE SET NULL,
  processed              BOOLEAN NOT NULL DEFAULT false,
  processed_at           TIMESTAMPTZ,
  processed_note         TEXT,

  -- 중복·감사
  ip_hash    VARCHAR(64),
  user_agent VARCHAR(300),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_kiss_signups_created_at ON public.kiss_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kiss_signups_phone      ON public.kiss_signups(phone);
CREATE INDEX IF NOT EXISTS idx_kiss_signups_matched    ON public.kiss_signups(matched_institution_id);
CREATE INDEX IF NOT EXISTS idx_kiss_signups_processed  ON public.kiss_signups(processed);
CREATE INDEX IF NOT EXISTS idx_kiss_signups_ip_hash    ON public.kiss_signups(ip_hash, created_at DESC);

-- ─────────────────────────────────────────────
-- Step 2: 카운터 설정 (settings 테이블 재사용)
-- ─────────────────────────────────────────────
-- max=100 (대표 확정 2026-07-02 신청자 프레임 "선착순 100명")
INSERT INTO public.settings (key, value) VALUES
  ('kiss_counter', '{
    "max": 100,
    "campaign": "kiss2026",
    "opened_at": "2026-07-02",
    "closed": false
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- Step 3: GRANT (2026-10-30 enforcement 대비)
-- ─────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON public.kiss_signups TO authenticated;
GRANT ALL ON public.kiss_signups TO service_role;
GRANT USAGE ON SEQUENCE public.kiss_signups_id_seq TO authenticated, service_role;

-- ─────────────────────────────────────────────
-- Step 4: RLS 정책
-- ─────────────────────────────────────────────
ALTER TABLE public.kiss_signups ENABLE ROW LEVEL SECURITY;

-- 관리자: 전체 접근
CREATE POLICY "Admin all kiss_signups"
  ON public.kiss_signups FOR ALL
  USING (is_admin());

-- Worker(service_role): INSERT·SELECT·UPDATE 필요 (매칭 후 processed 갱신)
CREATE POLICY "Service insert kiss_signups"
  ON public.kiss_signups FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service select kiss_signups"
  ON public.kiss_signups FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service update kiss_signups"
  ON public.kiss_signups FOR UPDATE
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- Step 5: 카운터 조회용 뷰 (실시간)
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.kiss_counter_view AS
SELECT
  (SELECT value FROM public.settings WHERE key = 'kiss_counter') AS config,
  COUNT(*) AS current_count
FROM public.kiss_signups
WHERE created_at >= '2026-07-02';

GRANT SELECT ON public.kiss_counter_view TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────
-- Step 6: 검증 쿼리 (실행 후 확인)
-- ─────────────────────────────────────────────
/*
-- 스키마 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kiss_signups' ORDER BY ordinal_position;

-- 카운터 확인
SELECT * FROM public.kiss_counter_view;

-- 권한 확인
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'kiss_signups';
*/
