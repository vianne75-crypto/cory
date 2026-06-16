---
title: Supabase Security Advisor 점검 체크리스트
date: 2026-05-27
type: checklist
agent: FLUX
status: active
tags: [supabase, security, GRANT, RLS, 2026-10-30-enforcement]
---

# cory Supabase Security Advisor 점검

> **계기**: PIXEL #supabase-grant-2026 (5/27) — 2026-10-30부터 신규 테이블 자동 노출 ❌
> **점검 목적**: ①현재 노출 중 테이블 파악 ②의도치 않은 노출 사전 차단 ③신규 테이블 표준 마련

---

## 1. 대표 직접 점검 절차

### Step 1: Security Advisor 접속

```
https://supabase.com/dashboard/project/rvqkoiqjjhlrgqitnxwt/advisors/security
```

### Step 2: 경고 항목 확인

다음 항목들이 표시되는지 확인:
- 🔴 `rls_disabled_in_public` — public 스키마인데 RLS 미활성화 테이블
- 🟡 `policy_exists_rls_disabled` — 정책은 있는데 RLS 비활성
- 🟡 `function_search_path_mutable` — search_path 변경 가능 함수
- 🟢 `auth_otp_long_expiry` — OTP 만료 시간 길음

### Step 3: 결과 공유

스크린샷 또는 경고 항목 텍스트 공유 → FLUX 분석 후 후속 조치

---

## 2. 현재 cory 테이블 RLS 정책 현황 (supabase-schema.sql 기준)

| 테이블 | RLS | anon SELECT | service_role | 비고 |
|--------|-----|-------------|--------------|------|
| institutions | ✅ | ❌ (관리자만) | SELECT·UPDATE | OK |
| consultations | ✅ | ❌ | INSERT·SELECT | OK |
| orders | ✅ | ❌ | INSERT·UPDATE·SELECT | OK |
| unmatched_consultations | ✅ | ❌ | - | OK |
| settings | ✅ | ❌ | - | OK |
| dashboard_cache | ✅ | ✅ (의도) | - | 공개용 |
| admin_users | ✅ | ❌ | - | OK |

⚠️ **schema 파일 outdated 가능성**: 메모리에 `kr1`·`hc_log` 언급되어 있으나 schema에 없음. 실제 DB 테이블 목록 확인 필요.

### 실제 테이블 목록 조회 SQL (Supabase SQL Editor)

```sql
SELECT
  table_name,
  has_table_privilege('anon', 'public.' || table_name, 'SELECT') AS anon_select,
  has_table_privilege('authenticated', 'public.' || table_name, 'SELECT') AS auth_select,
  has_table_privilege('service_role', 'public.' || table_name, 'SELECT') AS service_select,
  (SELECT relrowsecurity FROM pg_class WHERE relname = table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) AS rls_enabled
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

→ 실행 결과 공유 시 어떤 테이블이 어느 권한으로 노출되는지 한눈에 확인 가능.

---

## 3. 신규 테이블 표준 SQL 템플릿

### 3-1. 관리자 전용 (대부분의 cory 테이블)

```sql
CREATE TABLE public.테이블명 (
  id SERIAL PRIMARY KEY,
  -- 필드 정의
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.테이블명 ENABLE ROW LEVEL SECURITY;

-- GRANT (2026-10-30 enforcement 대비)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.테이블명 TO authenticated;
GRANT ALL ON public.테이블명 TO service_role;
-- anon 권한 부여하지 않음 (관리자 전용)

-- 시퀀스 권한 (SERIAL 컬럼 사용 시)
GRANT USAGE ON SEQUENCE public.테이블명_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.테이블명_id_seq TO service_role;

-- RLS 정책
CREATE POLICY "Admin all 테이블명"
  ON public.테이블명 FOR ALL
  USING (is_admin());

CREATE POLICY "Service all 테이블명"
  ON public.테이블명 FOR ALL
  USING (auth.role() = 'service_role');
```

### 3-2. 공개 읽기 허용 (대시보드 캐시 등)

```sql
CREATE TABLE public.테이블명 (...);

ALTER TABLE public.테이블명 ENABLE ROW LEVEL SECURITY;

-- anon에 SELECT만 허용
GRANT SELECT ON public.테이블명 TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.테이블명 TO authenticated;
GRANT ALL ON public.테이블명 TO service_role;

CREATE POLICY "Public read 테이블명"
  ON public.테이블명 FOR SELECT
  USING (true);

CREATE POLICY "Admin write 테이블명"
  ON public.테이블명 FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin update 테이블명"
  ON public.테이블명 FOR UPDATE
  USING (is_admin());
```

### 3-3. Webhook(service_role) 입력 허용

```sql
CREATE TABLE public.테이블명 (...);

ALTER TABLE public.테이블명 ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.테이블명 TO authenticated;
GRANT ALL ON public.테이블명 TO service_role;

CREATE POLICY "Admin all 테이블명"
  ON public.테이블명 FOR ALL
  USING (is_admin());

CREATE POLICY "Service insert 테이블명"
  ON public.테이블명 FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service select 테이블명"
  ON public.테이블명 FOR SELECT
  USING (auth.role() = 'service_role');
```

---

## 4. CORY_CRM_REDESIGN_v4 Phase 1 SQL 영향

기존 Phase 1 SQL은 **ALTER TABLE** (컬럼 추가)이므로 GRANT 영향 없음:

```sql
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS subdomain_territory VARCHAR(20);
-- 기존 테이블의 GRANT 정책 유지 → 추가 작업 불필요
```

→ Phase 1 SQL은 기존 정책에 영향 받지 않음. **OK**

**단, v4 Phase 3·4에서 신규 테이블 추가 시 (예: persons 테이블) 위 템플릿 적용 필수.**

---

## 5. 점검 후 후속 조치

| 발견 사항 | 조치 |
|---------|------|
| 노출된 민감 테이블 발견 | 해당 테이블 GRANT 회수 + RLS 정책 추가 |
| RLS 미활성 테이블 | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` |
| 정책 누락 테이블 | 위 템플릿에서 정책 추가 |
| 함수 search_path 변경 가능 | `SET search_path = public, pg_catalog;` 추가 |

---

## 6. 정기 점검 일정 권장

- **즉시** (오늘): Security Advisor 1회 점검 + 결과 공유
- **2026-10-30 직전** (10월 중순): 재점검 + enforcement 대비 마무리
- **분기별** (Q1·Q2·Q3·Q4 시작 시): 정기 점검

---

## 관련 문서

- [[supabase_data_api_grant_policy_2026]] (메모리)
- [[supabase-schema.sql]]
- [[CORY_CRM_REDESIGN_v4]] Phase 1·3·4 신규 테이블 정책 적용
