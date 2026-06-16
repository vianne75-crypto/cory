---
title: cory DB 정규화 전략 v1
date: 2026-05-17
type: strategy
agent: FLUX
status: draft
---

# cory DB 정규화 전략 v1

## 현재 상태 분석

### ✅ 잘된 것
- 기본 CRUD 테이블 구조 안정적
- RLS 정책 (anon 관리자 필터 완성)
- 상담·주문 매칭 로직 구현됨

### ❌ 문제점

| 문제 | 원인 | 영향 |
|------|------|------|
| contact 정보 JSONB 저장 | metadata JSONB 구조 | 쿼리·인덱스 불가, contact_email 채우기 어려움 |
| type 분류 단순 | "공공기관(기타)" 고정값 | 구매채널 2원화(공공/민간) 필터링 불가 |
| alliance_tier 필드 없음 | P0-3 UI에만 존재, DB 미반영 | F1 구매자 자동 배치 불가 |
| purchase_count=0 | first_purchase_date 없음 | KR1 "재구매율" 측정 불가 |
| persons 테이블 없음 | 담당자 정보 기관에 포함 | HC 샘플 신청 시 담당자 추적 불가 |

---

## 정규화 방향 (3단계)

### Phase 1: 연락처 정규화 (즉시)

**목표**: contact 정보를 JSONB에서 표준 컬럼으로 승격

```sql
ALTER TABLE institutions ADD COLUMN (
  contact_name VARCHAR(100),
  contact_mobile VARCHAR(20),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  contact_updated_at TIMESTAMPTZ
);

-- 기존 metadata 마이그레이션
UPDATE institutions SET
  contact_name = metadata->>'contact_name',
  contact_mobile = metadata->>'contact_mobile',
  contact_phone = metadata->>'contact_phone',
  contact_email = metadata->>'contact_email',
  contact_updated_at = NOW()
WHERE metadata IS NOT NULL;

-- 인덱스 추가
CREATE INDEX idx_institutions_contact_email ON institutions(contact_email);
CREATE INDEX idx_institutions_contact_phone ON institutions(contact_mobile, contact_phone);
```

**이점**:
- 쿼리 성능 향상 (JSONB 파싱 제거)
- 이메일 필터링 가능 (WHERE contact_email IS NOT NULL)
- 인덱스 활용

---

### Phase 2: 기관 분류 정규화 (금주)

**목표**: type을 세분화하고, 채널/등급 필드 추가

```sql
ALTER TABLE institutions ADD COLUMN (
  org_type VARCHAR(20),      -- '공공' | '민간' | '학계' (구매채널용)
  channel_group VARCHAR(20),  -- '공공_wcolive' | '민간_aps7' | 'B2C' (발송 채널용)
  alliance_tier VARCHAR(20),  -- 'POTENTIAL' | 'MASTER' | 'ACTIVE_MASTER' (얼라이언스용)
  alliance_tier_updated_at TIMESTAMPTZ
);

-- org_type 자동 분류 (기존 type 기반)
UPDATE institutions SET org_type = CASE
  WHEN type ILIKE '%보건소%' OR type ILIKE '%중독%' OR type ILIKE '%정신%' THEN '공공'
  WHEN type ILIKE '%기업%' OR type ILIKE '%대학%' OR type ILIKE '%병원%' THEN '민간'
  WHEN type ILIKE '%학회%' THEN '학계'
  ELSE '공공'
END;

-- channel_group 자동 배치
UPDATE institutions SET channel_group = CASE
  WHEN org_type = '공공' THEN 'public_wcolive'
  WHEN org_type = '민간' THEN 'private_aps7'
  ELSE 'b2c'
END;

-- 인덱스
CREATE INDEX idx_institutions_org_type ON institutions(org_type);
CREATE INDEX idx_institutions_channel_group ON institutions(channel_group);
CREATE INDEX idx_institutions_alliance_tier ON institutions(alliance_tier);
```

**이점**:
- 채널 분기 자동화 가능 (SELECT * WHERE channel_group='public_wcolive')
- P0-3 alliance_tier 자동 배치
- L8/노담 발송 대상 정확히 필터링

---

### Phase 3: 재구매 데이터 + 담당자 분리 (2주)

**목표**: 구매 기록 정확화 + 담당자 추적

```sql
-- 재구매 데이터 필드 추가
ALTER TABLE institutions ADD COLUMN (
  first_purchase_date DATE,
  purchase_count_updated_at TIMESTAMPTZ,
  note TEXT
);

-- 담당자 테이블 신설 (persons)
CREATE TABLE persons (
  id SERIAL PRIMARY KEY,
  institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100),
  title VARCHAR(100),          -- "보건담당자", "복지 담당", 등
  mobile VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(100),
  source VARCHAR(20),          -- 'hc_sample' | 'manual' | 'adot' | 'consultation'
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_persons_institution ON persons(institution_id);
CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_source ON persons(source);
```

**이점**:
- HC 샘플 신청 시 담당자 추적 (source='hc_sample')
- Adot 통화 기록과 담당자 매칭
- 메일링 리스트 구축 용이

---

## 영향도 분석

### 1단계 영향도: 낮음 (호환성 유지)
- 기존 JS 코드에서 `metadata->>'contact_email'` → `contact_email`로 변경
- 쿼리 성능 향상만 있고 로직 변경 없음

### 2단계 영향도: 중간
- **INBOX #53 구매채널 2원화 해제** ✅ (channel_group으로 분기 가능)
- 발송 쿼리 단순화
- **기존 JS 필터링 로직 간소화** (type 기반 → org_type 기반)

### 3단계 영향도: 높음
- **기관-담당자 분리로 데이터 정규화** (큰 변화)
- 기존 상담 시스템과 통합 필요
- HC 워크플로 재정의 필요

---

## 이행 계획

### ✅ 즉시 (내일, 5/18)
1. Phase 1 SQL 실행 (대표 승인)
2. JS 코드에서 metadata 쿼리 → 표준 컬럼 전환
3. contact_email 입력률 재조사

### 🟡 이번 주 (5/19~5/23)
1. Phase 2 SQL 실행
2. INBOX #53 "구매채널 2원화" 해제 (FLUX 분기 로직 구현)
3. 기관 목록 테이블에 channel_group 배지 추가

### 🟢 다음 주 (5/24~5/30)
1. Phase 3 SQL 실행
2. 담당자 테이블 UI (admin-institutions 모달)
3. HC 샘플 신청 → persons 자동 생성 로직

---

## 의존성

| 단계 | 의존 | 피드백 |
|------|------|--------|
| Phase 1 | 대표 SQL 실행 | vianne75@gmail.com |
| Phase 2 | FLUX 분기 로직 | aps-webhook 배포 필요 |
| Phase 3 | 상담·HC 시스템 | 담당자 출처 명확화 필요 |

---

## 성공 지표

| 항목 | 현재 | 목표 | 측정 |
|------|------|------|------|
| contact_email 입력률 | ~10% | >50% | 공공데이터 매칭 후 재측정 |
| 채널 분기 자동화율 | 0% | 100% | 발송 쿼리 WHERE channel_group= |
| purchase_count 정확도 | 모두 0 | 실제 값 | wcolive 데이터 매칭 |
| 담당자 추적율 | ~30% (메타) | >70% | persons 테이블 채우기 |
