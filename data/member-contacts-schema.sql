-- 회원 연락처 마스터 (CRM 자동화 기반 · 2026-07-09)
-- 문제: 애니빌드 주문 webhook은 이메일·전화를 안 실어옴(주문마다 연락처 누락) → CRM 불가.
-- 해결: 회원(mem_id) 연락처를 별도 수집 → order.mem_id 조인으로 모든 주문에 연락처 자동.
-- 수집: ①애니빌드 회원 webhook(가입·수정) 자동 ②wcolive mem_list 백필 1회.
-- RLS: cory 관리자(anon) 사용 위해 anon 허용 (institutions.contact_* 와 동일 모델).

CREATE TABLE IF NOT EXISTS member_contacts (
  mem_id      text PRIMARY KEY,   -- wcolive 회원ID = orders.mem_id 조인키
  name        text,               -- 회원명(담당자)
  email       text,               -- 전자세금계산서·CS 연락 이메일
  phone       text,               -- 연락처
  company     text,               -- 상호/기관명(회원 상호칸)
  memlv       text,               -- 회원등급코드
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE member_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all ON member_contacts;
CREATE POLICY anon_all ON member_contacts FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON member_contacts TO anon;

COMMENT ON TABLE member_contacts IS '회원 연락처 마스터 — 주문 mem_id 조인용(CRM 연락처 보강). webhook+백필 자동수집.';
