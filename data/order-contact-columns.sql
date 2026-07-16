-- 주문서 주문자 연락처 컬럼 (CRM 연락처 우선순위 · 2026-07-09)
-- 원칙: 한 기관에 담당자 여럿 → 그 주문의 주문자 연락처가 진짜(회원정보보다 우선).
-- 출처: wcolive 주문목록(jumun_list) "주문자명·주문자 메일주소·주문자 핸드폰" 컬럼.
-- 우선순위: order.contact_email > member_contacts.email(회원 폴백).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_name  text;   -- 주문자명
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_email text;   -- 주문자 이메일
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_phone text;   -- 주문자 핸드폰

-- 검증: SELECT count(*) FILTER (WHERE contact_email<>'') AS 주문자이메일 FROM orders;
