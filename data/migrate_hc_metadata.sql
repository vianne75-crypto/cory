-- ============================================
-- HC(대학보건관리자) metadata 확장 마이그레이션
-- 실행: Supabase SQL Editor
-- 날짜: 2026-03-09
-- ============================================
--
-- 목적:
--   1. utm_code를 institutions.metadata에 저장 (DM 추적의 불변 식별자)
--   2. Identity Fingerprint 필드 추가 (공공데이터 매칭용)
--   3. 변동 관리 + 스코어링 모델 필드 추가
--
-- ⚠️ 주의: utm_code(HC-001~HC-385)는 절대 변경 불가
--   - DM 이미 발송 완료 (2026-03-06)
--   - QR 트래킹 활성 중
--   - Apps Script에서 utm_code로 클릭로그 기록 중
--
-- metadata JSONB 구조:
-- {
--   "utm_code": "HC-001",              -- 불변 마케팅 식별자
--   "homepage_url": "https://...",      -- 대학 홈페이지
--   "zip_code": "50830",               -- 우편번호
--   "full_address": "경상남도...",       -- 전체 주소
--   "address2": "삼계동",               -- 건물/호실
--   "center_name": "학생건강센터",       -- 보건센터명
--   "university_type": "4년제",          -- 대학유형
--   "establishment": "사립",             -- 설립유형
--   "priority": 1,                       -- DM 우선순위 (1/2/3)
--   "sample_included": true,             -- 샘플 동봉 여부
--   "dm_sent_date": "2026-03-06",        -- DM 발송일
--   "dm_campaign": "2026hc",             -- DM 캠페인 코드
--   "status": "active",                  -- active/renamed/merged/closed
--   "api_source_id": null,               -- 공공데이터 매칭 코드
--   "fingerprint_score": null,           -- 매칭 신뢰도 (0~100)
--   "last_verified_date": "2026-03-09",  -- 최근 검증일
--   "verification_method": "manual",     -- api/manual
--   "scoring": {                         -- 우선순위 스코어링
--     "student_count": 0,
--     "dormitory": 0,
--     "medical_school": 0,
--     "center_level": 0,
--     "region_influence": 0,
--     "total": 0
--   },
--   "change_log": []                     -- 변동 이력
-- }

-- ============================================
-- 1. utm_code 인덱스 (metadata 내 검색 성능)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_institutions_utm_code
  ON institutions USING GIN ((metadata->'utm_code'));

CREATE INDEX IF NOT EXISTS idx_institutions_status
  ON institutions USING GIN ((metadata->'status'));

-- ============================================
-- 2. utm_code 유니크 보장 함수
-- ============================================
-- utm_code가 설정된 경우 중복 삽입 방지
CREATE OR REPLACE FUNCTION check_utm_code_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.metadata ? 'utm_code' AND NEW.metadata->>'utm_code' IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM institutions
      WHERE id != NEW.id
        AND metadata->>'utm_code' = NEW.metadata->>'utm_code'
    ) THEN
      RAISE EXCEPTION 'utm_code % already exists', NEW.metadata->>'utm_code';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER institutions_utm_unique
  BEFORE INSERT OR UPDATE ON institutions
  FOR EACH ROW EXECUTE FUNCTION check_utm_code_unique();

-- ============================================
-- 3. 변동 감지 뷰 (대시보드용)
-- ============================================
CREATE OR REPLACE VIEW hc_overview AS
SELECT
  id,
  name,
  region,
  district,
  purchase_stage,
  purchase_volume,
  last_purchase_date,
  -- 기존 metadata 키 (import_hc_centers.py에서 생성)
  metadata->>'utm_code' AS utm_code,
  metadata->>'website' AS website,
  metadata->>'address' AS full_address,
  metadata->>'postal_code' AS postal_code,
  metadata->>'school_type' AS school_type,
  metadata->>'category' AS category,
  metadata->>'target_dept' AS target_dept,
  metadata->>'contact_phone' AS contact_phone,
  metadata->>'priority' AS priority,
  -- 새 CRM 관리 필드 (update_hc_metadata.py에서 추가)
  (metadata->>'sample_included')::boolean AS sample_included,
  metadata->>'status' AS status,
  metadata->>'api_source_id' AS api_source_id,
  (metadata->>'fingerprint_score')::numeric AS fingerprint_score,
  metadata->>'last_verified_date' AS last_verified_date,
  metadata->>'dm_campaign' AS dm_campaign,
  (metadata->'scoring'->>'total')::int AS scoring_total
FROM institutions
WHERE type = '대학보건관리자';

-- ============================================
-- 확인 쿼리
-- ============================================
-- 마이그레이션 후 확인:
-- SELECT * FROM hc_overview ORDER BY utm_code LIMIT 10;
-- SELECT count(*) FROM hc_overview WHERE utm_code IS NOT NULL;
-- SELECT count(*) FROM hc_overview WHERE status = 'active';
