-- 대리점 사업자정보 매핑 테이블 (Phase 0 — 세금계산서 발행 자동화)
-- ⚠️ 사외비: 사업자번호는 민감정보. anon SELECT 정책 절대 추가 금지.
-- 쓰기/읽기는 service_role(팝빌 발행 스크립트)만. cory 대시보드(anon)는 접근 불가.
-- 근거: 경영지원(슬기)/재무/대리점_세금계산서_발행자동화_설계_v1.md §6 Phase 0

CREATE TABLE IF NOT EXISTS dealer_business_info (
  mem_id        text PRIMARY KEY,   -- wcolive 회원ID = orders.mem_id 조인키
  memlv         text,               -- 1100 유통회원 / 1400 APS대리점 / 3000 대리점
  company_name  text,               -- 상호
  business_no   text,               -- 사업자등록번호 (000-00-00000)
  ceo_name      text,               -- 대표자명
  address       text,               -- 사업장 주소
  email         text,               -- 전자세금계산서 수신 이메일
  note          text,
  updated_at    timestamptz DEFAULT now()
);

-- RLS 활성화 + anon 정책 없음 → anon 전면 차단(기본 deny). service_role만 RLS 우회 접근.
ALTER TABLE dealer_business_info ENABLE ROW LEVEL SECURITY;

-- ❌ 아래 같은 anon 정책을 추가하지 말 것 (사외비 유출):
--   CREATE POLICY anon_all ON dealer_business_info FOR ALL TO anon USING (true);

COMMENT ON TABLE dealer_business_info IS '대리점 사업자정보(사외비) — 세금계산서 발행용. service_role 전용.';
