---
title: Phase 1 완료 후 액션 맵
date: 2026-05-17
type: strategy
agent: PULSE + FLUX
---

# Phase 1 Contact 정규화 → 후속 액션

## 0️⃣ 대표 실행 (5/18)

```sql
-- data/phase1-contact-normalization.sql 
-- Supabase SQL Editor에서 전체 복사·실행
```

**대기: 마이그레이션 성공 확인 (검증 쿼리 3개 실행)**

---

## 1️⃣ FLUX 즉시 액션 (5/18 오전)

### ✅ JS 코드 전수 검사 + 수정

| 파일 | 수정 내용 | 우선도 |
|------|---------|--------|
| `js/admin/admin-institutions.js` | `metadata->>'contact_*'` → `contact_*` 전환 | 🔴 |
| `js/admin/admin-hc-sync.js` | HC DM 추적에서 metadata 접근 제거 | 🔴 |
| `js/admin/admin-upload.js` | CSV 업로드 시 contact_* 직접 INSERT | 🟡 |
| `gas/hc-sync-gas.js` | GAS에서 Supabase 쓰기 시 metadata 제거 | 🔴 |

### 💾 기관 수정 모달 개선 (Contact 섹션)

```js
// admin-institutions.js: editInstContactInfo() 함수 신설 또는 개선

function editInstContactInfo() {
  // institutions 테이블의 새 컬럼에 직접 바인딩
  document.getElementById('contactName').value = institution.contact_name || '';
  document.getElementById('contactEmail').value = institution.contact_email || '';
  document.getElementById('contactMobile').value = institution.contact_mobile || '';
  document.getElementById('contactPhone').value = institution.contact_phone || '';
  // metadata 접근 제거
}

function saveInstContactInfo() {
  const updates = {
    contact_name: document.getElementById('contactName').value,
    contact_email: document.getElementById('contactEmail').value,
    contact_mobile: document.getElementById('contactMobile').value,
    contact_phone: document.getElementById('contactPhone').value,
    contact_updated_at: new Date().toISOString()
  };
  // Supabase UPDATE
}
```

---

## 2️⃣ PULSE 즉시 실행 (5/18 오전~정오)

### 📊 Contact 현황 재조사

Phase 1 검증 쿼리 결과를 보고:

```
총 기관: XXX개
├─ 이메일 보유: XX개 (XX%)
├─ 모바일 보유: XX개 (XX%)
├─ 폰 보유: XX개 (XX%)
└─ 연락처 전무: XX개 (XX%)
```

**발견 사항 분류:**
- ✅ 충분함 (>50%): 바로 Phase 2 진행
- 🟡 부족함 (20~50%): 공공데이터 매칭 필요
- 🔴 심각함 (<20%): 수동 입력 또는 발송 대상 축소

---

## 3️⃣ L8·노담 발송 해제 (5/18 오후)

### 🎯 쿼리 간소화 (이전 엉망 쿼리 대체)

```sql
-- 노담 사은가 발송 대상 (간단해짐)
SELECT
  i.id, i.name, i.contact_name, i.contact_email, i.contact_mobile, i.contact_phone
FROM institutions i
WHERE
  -- 알쓰패치 2년 구매
  i.id IN (SELECT DISTINCT institution_id FROM orders WHERE goods_name ILIKE '%알쓰%' AND goods_name NOT ILIKE '%노담%' AND ...)
  -- 최근 3개월 노담 제외
  AND i.id NOT IN (SELECT DISTINCT institution_id FROM orders WHERE goods_name ILIKE '%노담%' AND ...)
  -- 대리점 제외
  AND i.name NOT ILIKE '%대리점%'
  -- 연락처 보유
  AND (i.contact_email IS NOT NULL OR i.contact_mobile IS NOT NULL);
```

**이점:**
- JSONB 파싱 제거 → 쿼리 속도 ↑
- 인덱스 활용 가능 → 필터링 정확도 ↑
- 직관적 코드

### 📧 이메일 CSV 생성 + 발송

```js
// f1-launch-mailer.gs
function f1ExportEmailList() {
  const targets = supabase.from('institutions')
    .select('id, name, contact_email')
    .in('purchase_stage', ['구매', '재구매', '만족'])
    .not('contact_email', 'is', null)
    .execute();
  
  // CSV 생성 → 이메일 발송
}
```

---

## 4️⃣ Phase 2 준비 (5/19~5/23)

### Phase 2: org_type + channel_group 추가

```sql
-- phase2-org-classification.sql (아래 참고)
ALTER TABLE institutions ADD COLUMN org_type VARCHAR(20);
ALTER TABLE institutions ADD COLUMN channel_group VARCHAR(20);

UPDATE institutions SET
  org_type = CASE
    WHEN name ILIKE '%보건소%' OR type ILIKE '%중독%' THEN '공공'
    WHEN type ILIKE '%기업%' OR type ILIKE '%대학%' THEN '민간'
    ELSE '기타'
  END
```

**효과:**
- ✅ INBOX #53 "구매채널 2원화" 해제 (channel_group으로 분기)
- ✅ L8/노담 발송 시 CTA URL 자동 분기 (wcolive vs aps7)
- ✅ alliance_tier 자동 배치 근거 마련

---

## 5️⃣ Phase 3 준비 (5/24~5/30)

### Phase 3: persons 테이블 신설

```sql
-- phase3-persons-table.sql
CREATE TABLE persons (
  id SERIAL PRIMARY KEY,
  institution_id INTEGER REFERENCES institutions(id),
  name VARCHAR(100),
  email VARCHAR(100),
  mobile VARCHAR(20),
  source VARCHAR(20),  -- 'hc_sample' | 'manual' | 'consultation'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**활용:**
- HC 샘플 신청 → persons 자동 생성
- Adot 통화 기록 → 담당자 매칭
- 메일링 리스트 구축

---

## 📋 Timeline

```
5/18 (토)
├─ 대표: Phase 1 SQL 실행
├─ FLUX: JS 코드 수정 (metadata 제거)
├─ PULSE: Contact 현황 재조사
└─ 모두: L8·노담 발송 재실행

5/19~5/23 (월~금)
├─ Phase 2 SQL + org_type 자동 분류
├─ INBOX #53 "구매채널 2원화" 해제
└─ 채널 분기 로직 테스트

5/24~5/30 (월~일)
├─ Phase 3 SQL + persons 테이블 생성
├─ HC 샘플 → persons 자동 연동
└─ 담당자 추적 UI 구현
```

---

## ⚠️ 주의사항

1. **RLS 정책 검토**: contact_* 필드 쓰기 권한 (anon 사용자가 수정 가능한가?)
2. **metadata 백업**: 마이그레이션 전 기존 metadata 스냅샷 생성
3. **JS 코드 테스트**: 모든 metadata 접근 제거 확인 (전수 검사 필수)
4. **성능 모니터링**: 인덱스 추가 후 느린 쿼리 로그 확인

---

## 성공 지표

| 단계 | 지표 | 목표 |
|------|------|------|
| Phase 1 | contact_* 입력률 | >50% |
| Phase 2 | 채널 분기 정확도 | 100% (자동화) |
| Phase 3 | 담당자 추적율 | >70% |

