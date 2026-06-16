-- AB테스트 결과 수집 테이블
-- 실행: Supabase SQL Editor (rvqkoiqjjhlrgqitnxwt.supabase.co)

CREATE TABLE IF NOT EXISTS abtest_results (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  score_a SMALLINT NOT NULL,
  score_b SMALLINT NOT NULL,
  winner TEXT NOT NULL,          -- 'A', 'B', 'TIE'
  a_q1 SMALLINT, a_q2 SMALLINT, a_q3 SMALLINT,
  b_q1 SMALLINT, b_q2 SMALLINT, b_q3 SMALLINT,
  ua TEXT
);

-- 익명 접근 허용 (INSERT only)
ALTER TABLE abtest_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON abtest_results
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "auth_select" ON abtest_results
  FOR SELECT TO authenticated
  USING (true);

-- 관리자(anon)도 결과 조회 가능하도록 (대시보드용)
CREATE POLICY "anon_select" ON abtest_results
  FOR SELECT TO anon
  USING (true);
