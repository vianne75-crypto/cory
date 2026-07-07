---
title: KISS 2026 백엔드 스펙 v2 — aps-lead Worker
date: 2026-07-02
version: 2.0
type: spec
agent: FLUX + PULSE
status: active
priority: 🔴 인쇄 마감 2026-07-05
tags: [KISS2026, QR랜딩, 다채널리드, Cloudflare, Supabase]
---

# KISS 2026 백엔드 스펙 v2

> **대표 승인**: 2026-07-02 (재제안 v2 채택)
> **컨틴전시 반영**: 신규 Worker 분리 + kiss_signups 단일 테이블 + Google Form 백업

---

## 1. 아키텍처

```
[사용자 · kiss-go.pages.dev / aps7.net/kiss2026]
         │
         │ POST /kiss-submit
         │ GET  /kiss-counter
         ▼
[aps-lead.workers.dev]  ← 신규 Worker (기존 aps-webhook과 격리)
         │
         ├─ 필수 검증·중복 차단·카운터 게이트
         ├─ INSERT public.kiss_signups
         └─ fire-and-forget: institution 자동 매칭
         │
         ▼
[Supabase]
  └─ public.kiss_signups (RLS + GRANT 2026-10-30 정책 준수)
  └─ public.settings (kiss_counter JSONB)
```

---

## 2. 엔드포인트

### POST /kiss-submit

**Request:**
```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "institution_name": "서울시 강남구보건소",
  "address": "서울시 강남구 XX로 XX",
  "email": "opt@example.com",
  "quiz_answer": "b",
  "privacy_agreed": true,
  "marketing_agreed": false,
  "utm_source": "kiss2026",
  "utm_medium": "card",
  "utm_content": "front_qr"
}
```

**Response 200:**
```json
{
  "success": true,
  "id": 47,
  "counter": { "current": 47, "max": 150, "remaining": 103, "status": "open" }
}
```

**Response 400** — 필수 필드 누락·형식 오류
**Response 410** — 선착순 마감
**Response 429** — 5분 내 동일 IP 중복

### GET /kiss-counter

**Response 200:**
```json
{ "current": 47, "max": 150, "remaining": 103, "status": "open" }
```

**status 값:** `open`(여유) · `low`(30 미만 임박) · `closed`(마감)

### GET /health

Worker 상태 헬스체크: `{ "status": "ok", "worker": "aps-lead" }`

---

## 3. 데이터 스키마

**파일**: `data/kiss-signups-schema.sql`

### 필드 요약

| 필드 | 타입 | 필수 | 설명 |
|------|-----|:---:|------|
| name | VARCHAR(50) | ✅ | 담당자명 |
| phone | VARCHAR(20) | ✅ | 정규화된 휴대폰 |
| institution_name | VARCHAR(200) | ✅ | 기관명 |
| address | VARCHAR(500) |  | 배송지 |
| email | VARCHAR(100) |  | 이메일 |
| quiz_answer | VARCHAR(20) |  | 폭음 퀴즈 응답 |
| privacy_agreed | BOOL | ✅ | 개인정보 동의 (필수 체크) |
| marketing_agreed | BOOL |  | 마케팅 동의 |
| utm_* | VARCHAR(50) |  | 유입 추적 |
| matched_institution_id | INT |  | 자동 매칭된 기관 |
| ip_hash | VARCHAR(64) |  | 중복 방지 (SHA-256+salt) |

### 정책

- **RLS**: 관리자 + service_role만 접근
- **GRANT**: authenticated·service_role (2026-10-30 정책 준수)
- **인덱스**: created_at·phone·matched·processed·ip_hash

---

## 4. 카운터

- 위치: `settings.kiss_counter` JSONB
- 초기값: `{ "max": 150, "campaign": "kiss2026", "closed": false }`
- 실시간 계산: `COUNT(*) FROM kiss_signups WHERE created_at >= '2026-07-02'`
- 카운터 뷰: `public.kiss_counter_view` (anon SELECT 허용, 프론트 직접 조회 가능)

### 프레임

- **백엔드**: `current` + `max` + `remaining` 모두 제공 → 프론트가 자유롭게 선택
- **현재 프론트 (MUSE 최신본)**: "N팩 남음" (잔여 프레임 유지)
- **대안**: "신청자 N명 / 100명" (신청자 프레임, 원할 때 전환)

---

## 5. 보안·정합성

| 항목 | 조치 |
|------|------|
| CORS | `Access-Control-Allow-Origin: *` (개방 후 필요 시 화이트리스트) |
| DoS 방어 | 필드 길이 제한 (name 50·phone 20·institution 200·address 500) |
| 중복 방지 | IP 해시 + 5분 rate limit |
| 카운터 race | 응답 시 재조회 (double-check) |
| 개인정보 | privacy_agreed 필수, IP는 해시만 저장 |
| Supabase key | service_role, Cloudflare secret으로만 저장 |

---

## 6. cory 연동 (자동 매칭)

신청 즉시 `ctx_matchInstitution()` fire-and-forget:
1. `institution_name`으로 `institutions.name ILIKE` 검색
2. 정확히 1건 매칭 시 `matched_institution_id` + `processed=true` 갱신
3. 여러 건 or 0건이면 미매칭 상태 (관리자 수동 처리)

향후 CORY_CRM_REDESIGN_v4 정합:
- `subdomain_territory` 자동 부여 (기관명 기반)
- `source_entry='kiss_qr'` 지정
- 다음 KISS 이벤트에도 재사용 가능

---

## 7. 배포 순서

### 7-1. Supabase (대표 승인 후)

```
Supabase SQL Editor → data/kiss-signups-schema.sql 실행
→ 검증 쿼리 3개로 확인
```

### 7-2. Worker 배포

```bash
cd cory/workers
npm install -g wrangler   # 미설치 시
wrangler login

# 시크릿 등록
wrangler secret put SUPABASE_SERVICE_KEY   # 값 붙여넣기
wrangler secret put IP_SALT                 # 임의 문자열

# 배포
wrangler deploy
```

**결과**: `https://aps-lead.<계정>.workers.dev` 활성

### 7-3. 도메인 라우팅 (선택)

Cloudflare 대시보드에서 커스텀 라우팅:
- `aps-lead.vianne75.workers.dev` (기본)
- 또는 서브도메인 매핑

### 7-4. PIXEL 프론트 연동

kiss-go 프로젝트에서:
```js
const API_BASE = 'https://aps-lead.vianne75.workers.dev';

// 카운터 조회
const counter = await fetch(`${API_BASE}/kiss-counter`).then(r => r.json());

// 신청 제출
const result = await fetch(`${API_BASE}/kiss-submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
}).then(r => r.json());
```

---

## 8. 테스트 체크리스트

- [ ] SQL 실행 후 `kiss_signups` 테이블 생성 확인
- [ ] `kiss_counter_view` 조회 → `{ max: 150, current: 0 }` 확인
- [ ] `curl` 로 `/health` 응답 확인
- [ ] `curl` 로 `/kiss-counter` 초기값 확인
- [ ] 정상 페이로드로 `/kiss-submit` 성공
- [ ] 필수 필드 누락 페이로드로 400 응답 확인
- [ ] 5분 내 동일 IP 재요청으로 429 확인
- [ ] 카운터 150 초과 시 410 확인 (시뮬레이션)
- [ ] 기관명 정확 매칭 시 자동 매칭 확인
- [ ] admin.html에서 신청 확인용 뷰 (임시)

---

## 9. 컨틴전시

### C1. PIXEL 병목 (7/3 정오 체크포인트)

**발동 조건**: PIXEL이 7/3 정오까지 kiss-go 백엔드 연동 착수 안 함

**대응**: Google Form 백업 (30분 세팅)
- Form 응답 → Google Sheets → 매일 cory 수동 동기화
- QR 랜딩 완료 화면에서 Form 링크로 폴백
- 학회 종료 후 leads로 배치 이관

### C2. Worker 5xx 폭증

**발동 조건**: Cloudflare Analytics에서 5xx > 5%

**대응**:
1. Worker 로그 확인 (Cloudflare 대시보드 → Logs)
2. Supabase 문제면 → 서비스키·GRANT 확인
3. 지속 실패 시 → 완료 화면 폴백 ("전화 문의" CTA)

### C3. 카운터 조회 실패

**대응**: 프론트에서 catch 후 정적 표시 ("체험팩 문의 환영") + 신청 폼은 유지

### C4. 신청 폭증 (>150건/일)

**대응**: 자동 마감 (백엔드 status=closed) + 대기 리스트 안내 UI

---

## 10. 향후 확장 (KISS 이후)

이 Worker는 다채널 리드 통합의 첫 실전:

- **`aps-lead`** 네이밍이 이미 통합 의도 표현
- 두 번째 채널(alth 공용랜딩·검색랜딩 등) 열릴 때:
  1. `kiss_signups` → `leads` 로 마이그레이션 (channel='kiss_qr' 태깅)
  2. 신규 엔드포인트 `/lead-intake` 추가 (범용)
  3. CORY_CRM_REDESIGN_v4.1 문서화

- 예상 시점: 도메인 v3 Phase 1 완료 후 (2026-08~09)

---

## 11. 핸드오프 5요소

- **요약**: KISS 2026 QR 랜딩 백엔드 = 신규 `aps-lead` Worker + `kiss_signups` 테이블 + 카운터. 컨틴전시 3종 반영.
- **핵심 발견**:
  ①기존 aps-webhook 신뢰성 이슈(138625) → 신규 Worker 분리로 격리
  ②kiss_signups 단일 테이블 승격은 두 번째 채널 확정 시 (YAGNI)
  ③프론트 카운터 프레임 자유로 (백엔드 양쪽 다 제공)
- **요청**:
  1. 대표: `data/kiss-signups-schema.sql` Supabase 실행
  2. FLUX: Worker 배포 (wrangler 필요)
  3. PIXEL: kiss-go에 fetch 연동 (스펙 §7-4)
- **긴급도**: 🔴 인쇄 마감 7/5
- **참조 문서**:
  - `cory/data/kiss-signups-schema.sql`
  - `cory/workers/aps-lead-worker.js`
  - `cory/workers/wrangler.toml`
  - `웹운영/KISS2026_QR랜딩_웹구현_핸드오프_FORGE→PIXEL_20260630.md`
  - `APS보건교육연구소/KISS_QR랜딩_카피감수회신_FORGE_20260702.md`
