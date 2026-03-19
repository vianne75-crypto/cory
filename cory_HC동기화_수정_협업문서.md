---
title: cory_HC동기화_수정_협업문서
date: 2026-03-18
type: operations
product: [알쓰패치]
segment: [대학_보건센터, 기업_보건관리자]
tags: [PULSE, DM, 캠페인, CRM, 보건]
---
# cory — HC 동기화 Worker 수정 협업문서

> Cloudflare Worker `syncHcInstitutions()` 함수 수정사항 정리
> 작성일: 2026-03-09

---

## 1. 배경

### 문제 1: 동기화 시 CRM 필드 삭제됨
- DB에 추가한 CRM 전용 필드(status, scoring, change_log 등)가 동기화 실행 시 사라짐
- 원인: Worker가 metadata를 시트 값으로 **완전 교체**하기 때문
- 시트에는 CRM 필드가 없으므로 → 동기화 = CRM 필드 삭제

### 문제 2: 이름 기준 매칭의 한계
- 시트에서 대학 이름을 수정하면 DB에서 못 찾아서 **새 기관으로 삽입**됨
- utm_code가 고유 식별자이므로 이걸로 매칭해야 이름 변경이 안전

---

## 2. 수정 대상

**파일**: `gas/cloudflare-worker.js` → `syncHcInstitutions()` 함수 (424줄~)

> ⚠️ Cloudflare 대시보드에서 수동 편집했으나 동작 확인 실패.
> **cory 프로젝트에서 코드 수정 후 재배포 필요.**

---

## 3. 수정 내용 (총 3곳)

### 수정 A: SELECT에 metadata 추가

**위치**: 기존 HC 기관 로드 쿼리 (약 430줄)

```javascript
// ❌ 변경 전
const existing = await supaFetch(supabaseUrl, supabaseKey,
  `/rest/v1/institutions?type=eq.${encodeURIComponent('대학[[Segments/기업_보건관리자|보건관리자]]')}&select=id,name,purchase_stage,purchase_amount,purchase_volume`,
  'GET'
);

// ✅ 변경 후 (metadata 추가)
const existing = await supaFetch(supabaseUrl, supabaseKey,
  `/rest/v1/institutions?type=eq.${encodeURIComponent('대학보건관리자')}&select=id,name,purchase_stage,purchase_amount,purchase_volume,metadata`,
  'GET'
);
```

**이유**: metadata를 읽어야 utm_code 매칭 + CRM 필드 머지가 가능

---

### 수정 B: 매칭 방식을 name → utm_code 우선으로 변경

**위치**: existingMap 생성 + 매칭 로직 (약 435~452줄)

```javascript
// ❌ 변경 전
const existingMap = {};
(existing || []).forEach(inst => { existingMap[inst.name] = inst; });

// ... (중간 코드 동일) ...

for (const rec of records) {
  if (!rec.name) continue;
  const ex = existingMap[rec.name];

// ✅ 변경 후
// utm_code 기준 매칭 (이름 변경 시에도 안전)
const utmMap = {};
const nameMap = {};
(existing || []).forEach(inst => {
  const utm = (inst.metadata || {}).utm_code;
  if (utm) utmMap[utm] = inst;
  nameMap[inst.name] = inst;
});

// ... (중간 코드 동일) ...

for (const rec of records) {
  if (!rec.name) continue;
  const recUtm = (rec.metadata || {}).utm_code;
  const ex = (recUtm && utmMap[recUtm]) || nameMap[rec.name];
```

**동작**:
1. utm_code로 먼저 매칭 시도
2. utm_code 없으면 name으로 폴백
3. 둘 다 없으면 신규 삽입

---

### 수정 C: metadata 머지 + name 변경 반영

**위치**: changes 객체 구성 (약 457~472줄)

```javascript
// ❌ 변경 전
    } else {
      const changes = {};
      if (rec.region && rec.region !== ex.region) changes.region = rec.region;
      if (rec.district) changes.district = rec.district;
      // ...
      if (rec.metadata) changes.metadata = rec.metadata;

// ✅ 변경 후
    } else {
      const changes = {};
      if (rec.name && rec.name !== ex.name) changes.name = rec.name;  // ← 추가: 이름 변경 반영
      if (rec.region && rec.region !== ex.region) changes.region = rec.region;
      if (rec.district) changes.district = rec.district;
      // ...
      // CRM 전용 필드(status, scoring, change_log 등) 보존: 기존 metadata 머지
      if (rec.metadata) {
        changes.metadata = { ...(ex.metadata || {}), ...rec.metadata };
      }
```

**동작**:
- `{ ...(ex.metadata), ...rec.metadata }` = 기존 DB 값 위에 시트 값 덮어씀
- 시트에 있는 키(utm_code, address 등) → 시트 값으로 업데이트
- 시트에 없는 키(status, scoring 등) → 기존 DB 값 보존
- 이름이 바뀌었으면 DB의 name도 업데이트

---

## 4. 수정 후 데이터 흐름

```
구글시트 (원본)
  │
  ├─ utm_code: h032          → DB utm_code = h032 (시트가 관리)
  ├─ address: "서울시..."     → DB address = "서울시..." (시트가 관리)
  ├─ contact_phone: "02-..." → DB contact_phone = "02-..." (시트가 관리)
  ├─ name: "명지대학교"       → DB name = "명지대학교" (시트가 관리)
  │
  └─ (시트에 없는 CRM 키)
       status: "active"       → 그대로 보존 ✅
       scoring: {total: 0}    → 그대로 보존 ✅
       change_log: [...]      → 그대로 보존 ✅
       fingerprint_score: 65  → 그대로 보존 ✅
```

---

## 5. 현재 DB 상태 (2026-03-09)

| 항목 | 수치 |
|------|------|
| HC 기관 총 수 | 431건 |
| CRM status 필드 보유 | 431건 (100%) |
| CRM scoring 필드 보유 | 431건 (100%) |
| utm_code 보유 | ~382건 |

### DB에 추가된 CRM 전용 필드 (metadata 내)

| 키 | 용도 | 시트 관리 여부 |
|-----|------|---------------|
| `status` | 기관 상태 (active/inactive) | DB only |
| `scoring` | 기관 우선순위 점수 (학생수, 기숙사 등) | DB only |
| `change_log` | 변경 이력 | DB only |
| `fingerprint_score` | 공공데이터 매칭 점수 | DB only |
| `dm_campaign` | 소속 캠페인 | DB only |
| `dm_sent_date` | DM 발송일 | DB only |
| `sample_included` | 샘플 동봉 여부 | DB only |
| `last_verified_date` | 최종 검증일 | DB only |
| `verification_method` | 검증 방법 | DB only |
| `api_source_id` | 공공데이터 API ID | DB only |

### DB에 추가된 SQL 객체

| 객체 | 이름 | 용도 |
|------|------|------|
| GIN 인덱스 | `idx_inst_metadata_utm` | utm_code 검색 최적화 |
| GIN 인덱스 | `idx_inst_metadata_status` | status 필터링 최적화 |
| 트리거 | `check_utm_code_unique` | utm_code 중복 방지 |
| 뷰 | `hc_overview` | 대시보드용 HC 기관 요약 |

---

## 6. 검증 방법

수정 배포 후 아래 순서로 확인:

**1단계: 동기화 전 CRM 필드 확인**
```sql
SELECT name, metadata->>'status', metadata->'scoring'->>'total'
FROM institutions
WHERE type = '대학보건관리자' AND metadata->>'status' IS NOT NULL
LIMIT 5;
```

**2단계: 시트에서 동기화 실행**
- 시트 메뉴 → HC 동기화 → Supabase 동기화 실행

**3단계: 동기화 후 CRM 필드 확인**
- 같은 쿼리 재실행 → status, scoring 값 그대로면 성공

**4단계: 이름 변경 테스트**
- 시트에서 대학 이름 하나 수정 → 동기화 → DB에서 이름 변경 확인

---

## 7. 로컬 파일 수정 완료 상태

| 파일 | 수정 A | 수정 B | 수정 C | 비고 |
|------|--------|--------|--------|------|
| `gas/cloudflare-worker.js` (로컬) | ✅ | ✅ | ✅ | cory 프로젝트 내 수정 완료 |
| Cloudflare 대시보드 (배포) | ✅ | ❌ 미확인 | ❌ 미확인 | 수동 편집 시 오류 가능성 |

> **→ 로컬 파일 기준으로 Cloudflare에 재배포 필요**
> `npx wrangler deploy gas/cloudflare-worker.js --name aps-webhook`
> 또는 대시보드에서 로컬 파일 내용을 통째로 붙여넣기

---

## 8. 관련 파일

| 파일 | 역할 |
|------|------|
| `gas/cloudflare-worker.js` | Worker 본체 (Supabase 중계) |
| `gas/hc-sync-gas.js` | Apps Script (시트 → Worker 전송) |
| `js/admin/admin-hc-sync.js` | Admin 패널 동기화 (이미 머지 방식) |
| `data/migrate_hc_metadata.sql` | DB 스키마 변경 (실행 완료) |
| `data/update_hc_metadata.py` | CRM 필드 초기 데이터 투입 (실행 완료) |

---

## 관련 링크

- [[Segments/대학_보건센터]]
- [[Segments/기업_보건관리자]]
