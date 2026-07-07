-- ============================================
-- KISS 2026 청중 진단 6문항 백엔드 스키마
-- 작성: 2026-07-03 (FLUX)
-- 목적: 완료 화면 진단 응답 저장 (kiss_signups과 분리, 선택 응답)
-- 정책: Supabase 2026-10-30 GRANT enforcement 준수
-- ============================================
-- ⚠️ 실제 라이브 테이블은 PIXEL이 생성(컬럼: q1_attendance·q3_public·q5_usage·
--    q2_channels text). 본 파일은 그 라이브 스키마에 맞춰 정정된 재현용이며,
--    개인정보 강화(ref_phone DROP·ref_key·조인뷰)는 kiss-privacy-hardening.sql이
--    최종본이다. 실행 순서: 이 파일 → kiss-privacy-hardening.sql.
-- ============================================

-- Step 1: kiss_diagnosis 테이블 생성 (라이브 컬럼명 정합)
CREATE TABLE IF NOT EXISTS public.kiss_diagnosis (
  id SERIAL PRIMARY KEY,

  -- kiss_signups와 느슨한 연결 (초기 ref_phone → 이후 ref_key로 대체·hardening 참조)
  ref_phone VARCHAR(20),

  -- 6개 문항 (스킵 가능) — 라이브 컬럼명
  q1_attendance VARCHAR(30),  -- 학회 참석 반복성 (첫참석/2회이상/매년)
  q2_channels   text,         -- 정보 탐색 채널 (복수, 콤마 결합 문자열)
  q2_channels_etc VARCHAR(100),-- Q2 '기타' 자유입력 (PIXEL 7/7 · kiss-diagnosis-q2etc-migration.sql)
  q3_public     VARCHAR(30),  -- 공공 활용도 (미사용/검토/도입/도입확대)
  q4_cjm        VARCHAR(30),  -- CJM 단계 (인지/관심/고려/구매/활용/추천)
  q5_usage      VARCHAR(30),  -- 활용 단계 (자료수령/일부활용/전면활용) — 도입자 조건부
  q6_flywheel   VARCHAR(30),  -- 플라이휠 의향 (있음/보통/없음)

  -- 유입 추적
  utm_source   VARCHAR(50),
  utm_medium   VARCHAR(50),
  utm_campaign VARCHAR(50),
  utm_content  VARCHAR(50),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_kiss_diagnosis_created_at ON public.kiss_diagnosis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kiss_diagnosis_q3         ON public.kiss_diagnosis(q3_public);
CREATE INDEX IF NOT EXISTS idx_kiss_diagnosis_q6         ON public.kiss_diagnosis(q6_flywheel);

-- Step 2: GRANT (2026-10-30 enforcement 대비)
GRANT SELECT, INSERT, UPDATE ON public.kiss_diagnosis TO authenticated;
GRANT ALL ON public.kiss_diagnosis TO service_role;
GRANT USAGE ON SEQUENCE public.kiss_diagnosis_id_seq TO authenticated, service_role;

-- Step 3: RLS 정책
ALTER TABLE public.kiss_diagnosis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all kiss_diagnosis"
  ON public.kiss_diagnosis FOR ALL
  USING (is_admin());

CREATE POLICY "Service insert kiss_diagnosis"
  ON public.kiss_diagnosis FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service select kiss_diagnosis"
  ON public.kiss_diagnosis FOR SELECT
  USING (auth.role() = 'service_role');

-- Step 4: 신청↔진단 조인 뷰 → kiss-privacy-hardening.sql에서 ref_key 기반으로 최종 정의.
--   (구 정의는 ref_phone=phone 조인이라 개인정보 강화와 상충 → 본 파일에서 제거)

-- ─── 검증 쿼리 (별도 실행) ───
/*
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'kiss_diagnosis' ORDER BY ordinal_position;
*/
