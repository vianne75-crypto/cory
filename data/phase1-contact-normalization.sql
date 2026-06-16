-- ============================================
-- Phase 1: Contact 정규화
-- Supabase SQL Editor에서 실행
-- 목적: metadata JSONB의 contact_* → 표준 컬럼으로 승격
-- 영향: 모든 이메일/폰 기반 조회·발송에 성능·신뢰성 확보
-- ============================================

-- Step 1: 새 컬럼 추가
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_mobile VARCHAR(20);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_updated_at TIMESTAMPTZ;

-- Step 2: 기존 metadata에서 마이그레이션
UPDATE institutions SET
  contact_name = COALESCE(contact_name, metadata->>'contact_name'),
  contact_mobile = COALESCE(contact_mobile, metadata->>'contact_mobile'),
  contact_phone = COALESCE(contact_phone, metadata->>'contact_phone'),
  contact_email = COALESCE(contact_email, metadata->>'contact_email'),
  contact_updated_at = COALESCE(contact_updated_at, NOW())
WHERE metadata IS NOT NULL AND metadata != '{}'::jsonb;

-- Step 3: 인덱스 추가 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_institutions_contact_email ON institutions(contact_email);
CREATE INDEX IF NOT EXISTS idx_institutions_contact_mobile ON institutions(contact_mobile);
CREATE INDEX IF NOT EXISTS idx_institutions_contact_phone ON institutions(contact_phone);
CREATE INDEX IF NOT EXISTS idx_institutions_contact_name ON institutions(contact_name);

-- Step 4: 검증 쿼리 (별도 실행하여 확인)
/*
-- ① 마이그레이션 성공 확인
SELECT
  COUNT(*) AS total,
  COUNT(contact_name) AS has_name,
  COUNT(contact_email) AS has_email,
  COUNT(contact_mobile) AS has_mobile,
  COUNT(contact_phone) AS has_phone,
  COUNT(CASE WHEN contact_email IS NOT NULL OR contact_mobile IS NOT NULL OR contact_phone IS NOT NULL THEN 1 END) AS has_any_contact
FROM institutions;

-- ② 여전히 metadata에만 있는 연락처 확인
SELECT id, name, metadata
FROM institutions
WHERE (
  (metadata->>'contact_email') IS NOT NULL AND contact_email IS NULL
  OR (metadata->>'contact_mobile') IS NOT NULL AND contact_mobile IS NULL
  OR (metadata->>'contact_phone') IS NOT NULL AND contact_phone IS NULL
)
LIMIT 20;

-- ③ 이메일 필터링 테스트 (L8·노담 발송용)
SELECT
  COUNT(*) AS target_cnt,
  COUNT(contact_email) AS email_cnt,
  COUNT(contact_mobile) AS mobile_cnt
FROM institutions
WHERE purchase_stage IN ('구매', '재구매', '만족', '추천', '파트너')
  AND (contact_email IS NOT NULL OR contact_mobile IS NOT NULL);
*/

-- ============================================
-- 완료 메시지
-- ============================================
-- 실행 후 위 검증 쿼리를 순서대로 실행하여 마이그레이션 성공 확인.
-- Phase 1 완료 후:
-- - JS 코드에서 metadata->>'contact_*' 제거
-- - admin-institutions.js의 editInstitution() editInstContactInfo() 신설 또는 개선
-- - Supabase Row Level Security 정책 검토 (contact_* 필드 쓰기 권한 확인)
