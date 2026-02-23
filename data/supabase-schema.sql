-- ============================================
-- APS 대시보드 Supabase 스키마
-- Supabase SQL Editor에서 실행
-- ============================================

-- 1. 기관 테이블
CREATE TABLE institutions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '공공기관(기타)',
  region TEXT NOT NULL,
  district TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  products TEXT[] DEFAULT '{}',
  purchase_cycle TEXT DEFAULT '-',
  purchase_volume INTEGER DEFAULT 0,
  purchase_amount DOUBLE PRECISION DEFAULT 0,
  purchase_stage TEXT DEFAULT '인지',
  last_purchase_date TEXT DEFAULT '-',
  consult_count INTEGER DEFAULT 0,
  last_consult_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 상담내역 테이블
CREATE TABLE consultations (
  id SERIAL PRIMARY KEY,
  institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
  date TEXT,
  tags TEXT[] DEFAULT '{}',
  content TEXT,
  md_name TEXT,
  raw_institution_name TEXT,
  matched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 주문 테이블
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
  order_idx TEXT,
  option_user TEXT,
  addr TEXT,
  goods_name TEXT,
  sale_price DOUBLE PRECISION DEFAULT 0,
  sale_cnt INTEGER DEFAULT 0,
  state_subject TEXT,
  reg_time TEXT,
  matched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 미매칭 상담 큐
CREATE TABLE unmatched_consultations (
  id SERIAL PRIMARY KEY,
  date TEXT,
  tags TEXT[] DEFAULT '{}',
  content TEXT,
  md_name TEXT,
  raw_institution_name TEXT,
  suggested_institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
  suggestion_score DOUBLE PRECISION,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 설정 테이블 (key-value)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 대시보드 캐시 (단일 행)
CREATE TABLE dashboard_cache (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  published_by TEXT
);

-- 7. 관리자 화이트리스트
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX idx_institutions_region ON institutions(region);
CREATE INDEX idx_institutions_type ON institutions(type);
CREATE INDEX idx_institutions_stage ON institutions(purchase_stage);
CREATE INDEX idx_consultations_institution ON consultations(institution_id);
CREATE INDEX idx_consultations_date ON consultations(date);
CREATE INDEX idx_consultations_matched ON consultations(matched);
CREATE INDEX idx_orders_institution ON orders(institution_id);
CREATE INDEX idx_orders_reg_time ON orders(reg_time);
CREATE INDEX idx_unmatched_resolved ON unmatched_consultations(resolved);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 관리자 확인 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- dashboard_cache: 누구나 읽기, 관리자만 쓰기
CREATE POLICY "Public read dashboard_cache"
  ON dashboard_cache FOR SELECT
  USING (true);

CREATE POLICY "Admin write dashboard_cache"
  ON dashboard_cache FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin update dashboard_cache"
  ON dashboard_cache FOR UPDATE
  USING (is_admin());

-- institutions: 관리자만 접근
CREATE POLICY "Admin all institutions"
  ON institutions FOR ALL
  USING (is_admin());

-- consultations: 관리자만 접근 + Webhook(service_role)도 접근 허용
CREATE POLICY "Admin all consultations"
  ON consultations FOR ALL
  USING (is_admin());

CREATE POLICY "Service insert consultations"
  ON consultations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service select consultations"
  ON consultations FOR SELECT
  USING (auth.role() = 'service_role');

-- orders: 관리자만 접근 + Webhook(service_role)도 접근 허용
CREATE POLICY "Admin all orders"
  ON orders FOR ALL
  USING (is_admin());

CREATE POLICY "Service insert orders"
  ON orders FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service update orders"
  ON orders FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service select orders"
  ON orders FOR SELECT
  USING (auth.role() = 'service_role');

-- institutions: Webhook에서 매칭 조회 + 구매정보 업데이트 허용
CREATE POLICY "Service select institutions"
  ON institutions FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service update institutions"
  ON institutions FOR UPDATE
  USING (auth.role() = 'service_role');

-- unmatched_consultations: 관리자만 접근
CREATE POLICY "Admin all unmatched"
  ON unmatched_consultations FOR ALL
  USING (is_admin());

-- settings: 관리자만 접근
CREATE POLICY "Admin all settings"
  ON settings FOR ALL
  USING (is_admin());

-- admin_users: 관리자만 읽기 (최초 수동 INSERT 필요)
CREATE POLICY "Admin read admin_users"
  ON admin_users FOR SELECT
  USING (is_admin());

-- ============================================
-- 초기 데이터
-- ============================================

-- 대시보드 캐시 초기 행
INSERT INTO dashboard_cache (id, data) VALUES (1, '{}');

-- 기본 설정
INSERT INTO settings (key, value) VALUES
  ('stage_map', '{"문의": "관심", "견적": "고려", "시안": "고려", "샘플": "고려", "수주": "고려"}'),
  ('region_targets', '{"강원특별자치도":64,"경기도":124,"경상남도":55,"경상북도":71,"광주광역시":26,"대구광역시":37,"대전광역시":25,"부산광역시":56,"서울특별시":104,"세종특별자치시":5,"울산광역시":16,"인천광역시":34,"전라남도":60,"전북특별자치도":54,"제주특별자치도":8,"충청남도":58,"충청북도":41}');

-- ★ 첫 관리자 이메일 등록 (본인 이메일로 변경!)
-- INSERT INTO admin_users (email, name) VALUES ('your-email@gmail.com', '관리자');

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER institutions_updated_at
  BEFORE UPDATE ON institutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
