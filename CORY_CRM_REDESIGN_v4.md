---
title: cory 대시보드·CRM 전략 재구성 v4 — 순수 Branded House 정합
date: 2026-05-27
version: 4.0
type: strategy
agent: PULSE + FLUX
status: draft
product: [알쓰patches, 노담패치]
segment: [B2C, B2B, B2G, 학술, 얼라이언스]
supersedes: _archive/CORY_CRM_REDESIGN_v3.md
tags: [도메인전략v3, 단일마스터, alth.co.kr, 서브도메인영토, CRM재구성, 회원통합, 애니빌드API]
---

# cory 대시보드·CRM 전략 재구성 v4

> **계기**: 도메인 전략 v3 (alth.co.kr 단일 마스터, 순수 Branded House) 확정 → v3(3축) 무효화 → v4 재정합 필요
> **이전 버전**: [[CORY_CRM_REDESIGN_v4]] (3축 기반, 5/21 작성·5/27 archive)
> **승격 근거**: PIXEL 도메인 전략 v3 발행 (5/21, 대표 승인 대기 5/24) — alth.co.kr 회사명 "알쓰" 일치·외부 호칭·발음·정설 우월 (32 vs 22점)

---

## 1. 한 줄 결론

> **cory는 단일 마스터 alth.co.kr 서브도메인 영토(biz·gov·edu·research·shop·blog)로 재구성된다. institutions 테이블에 `subdomain_territory`·`segment_v2`·`primary_subdomain`·`brand_voice` 필드를 추가하고, 발송·CTA·콘텐츠를 서브도메인별 자동 분기하면서 이메일은 @alth.co.kr 단일로 통합한다.**

---

## 2. v3(3축) → v4(단일 마스터) 변경 핵심

| 영역 | v3 (3축·archive) | **v4 (단일 마스터)** |
|------|----------------|-------------------|
| 도메인 모델 | 3축 마스터 (aps7·alth·aldh2) | **단일 alth.co.kr + 서브도메인 영토** |
| territory 필드 값 | system_aps7·brand_alth·academic_aldh2 | **biz·gov·edu·research·shop·blog** |
| CTA URL 분기 | 3개 마스터 도메인 | **모두 *.alth.co.kr 서브도메인** |
| 이메일 도메인 | 3개 (@aps7·@alth·@aldh2) | **@alth.co.kr 단일** (역할별 5~8개 alias) |
| 발신자 프로필 | 영토별 분리 | **단일 브랜드 + 톤만 분기** |
| SEO 권위 | 분산 누적 | **단일 도메인 집중 누적** |
| 1인 운영 부담 | 4개 도메인 관리 | **1개 도메인 관리** |

---

## 3. v4 서브도메인 영토 매핑

```
🎯 alth.co.kr (마스터)
│
├── 🏢 biz.alth.co.kr      ← 기업·B2B·얼라이언스      [aps7 흡수]
├── 🏛️ gov.alth.co.kr      ← 보건소·공공·B2G            [wcolive 흡수]
├── 🎓 edu.alth.co.kr      ← 교육·자격증·얼라이언스    [aps7/edu 흡수]
├── 📚 research.alth.co.kr  ← 학술·논문·전문가          [aldh2 흡수]
├── 🛒 shop.alth.co.kr     ← 이커머스 (B2C·통합 결제)  [wcolive/aps7 자사몰 흡수]
├── 📝 blog.alth.co.kr     ← 트라이브즈·블로그·SNS 유입
├── 🔧 admin.alth.co.kr    ← 관리자 (cory 대시보드 별도)
└── 📨 @alth.co.kr         ← 이메일 단일 통합
```

---

## 4. 데이터 모델 재정의

### 4-1. institutions 신규 필드 (v4)

```sql
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS subdomain_territory VARCHAR(20);
-- 값: 'biz' | 'gov' | 'edu' | 'research' | 'shop' | 'blog' | NULL

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS segment_v2 VARCHAR(20);
-- 값: 'b2c' | 'b2b_corp' | 'b2b_health' | 'b2g_public' | 'b2g_academic' | 'alliance'

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS primary_subdomain VARCHAR(50);
-- 값: 'shop.alth.co.kr' | 'gov.alth.co.kr' | 'biz.alth.co.kr' | 'edu.alth.co.kr'

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS brand_voice VARCHAR(30);
-- 값: 'friendly_b2c' | 'professional_b2b' | 'authoritative_academic'

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS source_entry VARCHAR(20);
-- 데이터 유입 출처 (애니빌드 API): 'biz' | 'gov' | 'shop' | 'research' | 'legacy_wcolive' | 'legacy_aps7'
```

### 4-2. 서브도메인 영토 자동 산출 로직

```js
function calcSubdomainTerritory(inst) {
  // 1. source_entry 우선
  if (inst.source_entry) {
    if (['biz','gov','edu','research','shop','blog'].includes(inst.source_entry)) {
      return inst.source_entry;
    }
    // legacy 도메인 매핑
    if (inst.source_entry === 'legacy_wcolive') return 'gov';
    if (inst.source_entry === 'legacy_aps7')    return 'biz';
  }
  
  // 2. segment_v2 기반
  const seg = inst.segment_v2;
  if (seg === 'b2c')           return 'shop';
  if (seg === 'b2g_public')    return 'gov';
  if (seg === 'b2g_academic')  return 'research';
  if (seg === 'b2b_health')    return 'biz';
  if (seg === 'b2b_corp')      return 'biz';
  if (seg === 'alliance')      return 'edu';
  
  // 3. type 기반 폴백
  const t = (inst.type || '').toLowerCase();
  if (t.includes('보건소') || t.includes('중독') || t.includes('정신')) return 'gov';
  if (t.includes('학회'))                                                 return 'research';
  if (t.includes('기업') || t.includes('병원') || t.includes('대학'))     return 'biz';
  return null;
}
```

### 4-3. CTA URL 자동 분기 (단일 마스터 하위)

```js
function getCtaUrl(inst, action) {
  const sub = inst.subdomain_territory;
  
  // 구매 액션
  if (action === 'purchase') {
    if (sub === 'gov')      return 'https://gov.alth.co.kr/order';
    if (sub === 'biz')      return 'https://biz.alth.co.kr/order';
    if (sub === 'shop')     return 'https://shop.alth.co.kr';
    return 'https://shop.alth.co.kr';  // 폴백
  }
  
  // 콘텐츠 액션
  if (action === 'content') {
    if (sub === 'gov')      return 'https://gov.alth.co.kr/resources';
    if (sub === 'research') return 'https://research.alth.co.kr';
    if (sub === 'biz')      return 'https://biz.alth.co.kr/resources';
    return 'https://blog.alth.co.kr';
  }
  
  // 교육 액션
  if (action === 'edu')     return 'https://edu.alth.co.kr';
  
  // 메인 폴백
  return 'https://alth.co.kr';
}
```

---

## 5. CRM 분류 — 서브도메인 × 세그먼트 매트릭스

```
                       │ biz       │ gov     │ edu       │ research  │ shop      
                       │ (B2B)     │ (B2G)   │ (얼라이언스) │ (학술)    │ (B2C)
─────────────────────┼─────────┼───────┼─────────┼─────────┼─────────
b2c (일반 소비자)      │ —         │ —       │ —         │ —         │ ⭐ Primary
b2b_corp (기업)        │ ⭐ Primary│ 보조    │ —         │ —         │ —
b2b_health (보건관리자)│ ⭐ Primary│ —       │ 진학      │ ⭐ 자료    │ —
b2g_public (보건소)    │ —         │ ⭐ Primary│ 교육     │ ⭐ 자료    │ —
b2g_academic (학회)    │ —         │ —       │ —         │ ⭐ Primary │ —
alliance (얼라이언스)  │ 보조      │ —       │ ⭐ Primary│ —         │ —
```

**기존 분류 마이그레이션:**

| 기존 institutions.type | subdomain_territory | segment_v2 | brand_voice |
|----------------------|---------------------|------------|-------------|
| 보건소 | gov | b2g_public | authoritative_academic |
| 통합건강증진 | gov | b2g_public | authoritative_academic |
| 중독관리/정신건강 | gov | b2g_public | authoritative_academic |
| 학회 | research | b2g_academic | authoritative_academic |
| 기업 | biz | b2b_corp | professional_b2b |
| 병원 | biz | b2b_health | professional_b2b |
| 대학보건관리자 | biz | b2b_health | professional_b2b |
| 일반 | shop | b2c | friendly_b2c |

---

## 6. 대시보드 뷰 재구성

### 6-1. 메인 대시보드 — 서브도메인 패널 (6분면)

```
┌─ biz (B2B) ──┬─ gov (B2G) ──┬─ edu (얼라이언스) ─┐
│ 기관 수      │ 보건소 수    │ 마스터 수          │
│ 구매 단계    │ 결제 현황    │ 활동도             │
├──────────────┼──────────────┼─────────────────────┤
│ research     │ shop (B2C)   │ blog (전환)         │
│ 다운로드 수  │ 주문 건수    │ 유입 → 구매 전환    │
│ 인용 수      │ 재구매율     │ 트라이브즈 참여     │
└──────────────┴──────────────┴─────────────────────┘
```

### 6-2. 통합 퍼널 (서브도메인 색상 구분)

```
인지 → 관심 → 고려 → 구매 → 만족 → 추천 → 파트너
[🟦 biz] [🟥 gov] [🟪 edu] [🟩 research] [🟨 shop]
```

### 6-3. Cross-subdomain 진화 추적

shop → biz로 전환된 사용자 (B2C → B2B 진화):
- 알쓰패치 개인 구매 → 회사 보건관리자로 추천
- 트라이브즈 콘텐츠 → 사업장 도입 검토
- 대표적 전환 사례 식별

---

## 7. 발송 채널 재정의

### 7-1. 카카오 알림톡 — 단일 발신자, 톤 분기

```js
function getKakaoTemplate(inst, campaign) {
  const sub = inst.subdomain_territory;
  
  // 발신자는 단일 (브랜드)
  const sender = 'ALTH 알쓰패치';
  
  // 서브도메인별 CTA
  const cta = getCtaUrl(inst, 'purchase');
  
  // 톤 분기 (brand_voice)
  const voice = inst.brand_voice;
  
  return { sender, cta, voice, template: `${campaign}_${sub}` };
}
```

### 7-2. 이메일 — @alth.co.kr 단일 도메인 + 역할 alias

| 캠페인 유형 | 발신 주소 | brand_voice |
|-----------|----------|-------------|
| 브랜드 이벤트·사은가 | `hello@alth.co.kr` | friendly_b2c |
| 회사 공식·뉴스 | `news@alth.co.kr` | professional_b2b |
| 학술 자료·논문 | `research@alth.co.kr` | authoritative_academic |
| B2G 견적·납품 | `gov@alth.co.kr` | authoritative_academic |
| 얼라이언스 운영 | `alliance@alth.co.kr` | professional_b2b |
| 고객지원 | `support@alth.co.kr` | friendly_b2c |
| 세금계산서 | `billing@alth.co.kr` | professional_b2b |
| 채용·파트너십 | `contact@alth.co.kr` | professional_b2b |

→ **8개 alias 발신, 1개 도메인 통합** (Cloudflare Email Routing)

### 7-3. 브랜드 보이스 톤 가이드 (변경 없음)

| brand_voice | 톤 | 호칭 |
|------------|-----|------|
| `friendly_b2c` | 친근·도발 | "여러분" |
| `professional_b2b` | 공식·실용 | "OO 담당자님" |
| `authoritative_academic` | 권위·정확 | "OO 선생님" / "OO 보건소" |

---

## 8. 데이터 흐름 (v4)

```
[애니빌드 마스터 어드민]                    [cory]
   │
   ├─ alth.co.kr (메인)
   ├─ shop·biz·gov·edu·research 서브도메인
   │     ↓ 통합 API + Webhook
   ▼
[애니빌드 공식 API]
  ├─ 회원 정보 조회
  ├─ 주문서 조회
  └─ Webhook (회원가입·주문·상태변경)
       ↓
[Cloudflare Worker]
       ↓
[cory Supabase]
  ├─ source_entry 자동 부여 (Webhook 출처에 따라)
  ├─ subdomain_territory 자동 분류 (calcSubdomainTerritory)
  ├─ segment_v2 자동 매핑
  └─ primary_subdomain 자동 설정
       ↓
[cory 대시보드 + 발송 자동화]
```

---

## 9. 단계별 이행 계획 (v4)

### Phase 0 — 현재 상태 (2026-05-27)
- ✅ contact_* 정규화 완료
- ✅ JS 코드 metadata → 표준 컬럼 전환 일부 완료
- ⏳ 도메인 전략 v3 대표 승인 대기 (5/24 → 미확인)
- ⏳ PIXEL 회원 통일 진행 중
- ⏳ 애니빌드 API 활성화 대기

### Phase 1 — 서브도메인 메타데이터 추가 (대표 승인 직후)
1. institutions에 5개 필드 추가
2. 기존 1234개 기관 자동 분류
3. JS 매핑 함수 신설

### Phase 2 — 데이터 동기화 (도메인 마이그레이션 시작 후)
1. 애니빌드 API → contact·source_entry 충원
2. 신규 Webhook 활성화
3. *.alth.co.kr 서브도메인별 source_entry 자동 부여

### Phase 3 — 대시보드 재구성 (도메인 마이그레이션 M+3)
1. 메인 대시보드 6분면 패널
2. 통합 퍼널 색상 구분
3. Cross-subdomain 진화 추적

### Phase 4 — 발송 자동화 (PIXEL Email Routing 완료 후)
1. @alth.co.kr 8개 alias 활성화
2. 카카오 알림톡 단일 발신자 + 톤 분기
3. brand_voice 자동 적용

---

## 10. v3(3축) → v4(단일) 차이점 요약

| 영역 | v3 (archived) | **v4** | 영향 |
|------|-------------|--------|------|
| territory 값 | 'system_aps7', 'brand_alth', 'academic_aldh2' | **'biz', 'gov', 'edu', 'research', 'shop', 'blog'** | 필드명·값 변경 |
| CTA 도메인 | 3개 마스터 | **모두 *.alth.co.kr 서브도메인** | URL 구조 변경 |
| 발신 이메일 | 3개 도메인 | **@alth.co.kr 단일** | DNS·SPF 단순화 |
| 발신자 | 영토별 별도 프로필 | **단일 브랜드** | 발송 통합 |
| SEO 전략 | 3축 분산 | **단일 집중** | 단일 권위 누적 |
| 운영 복잡도 | 높음 | **낮음 (1인 운영 적합)** | 관리 부담 ↓ |

---

## 11. 위험·반론 대응

| 우려 | 대응 |
|------|------|
| "단일 도메인 장애 시 전체 다운?" | Cloudflare Email Routing + Vercel 분산 배포로 SPOF 회피 |
| "서브도메인 분류 오류 시 발송 채널 혼선?" | 폴백 정책: territory 미설정 시 shop.alth.co.kr + friendly_b2c |
| "기존 wcolive·aps7 회원이 alth로 이전 시 혼란?" | 12개월 마이그레이션 동안 cross-link + 301 리다이렉트로 자연스러운 이전 |
| "research 영토는 학술 권위 부족하지 않나?" | aldh2.org 별도 유지 옵션 검토 (도메인 전략 v3 §4-4) |
| "PIXEL 도메인 전략 확정 지연 시 cory 작업도 지연?" | Phase 1(메타데이터 추가)은 도메인 마이그레이션 무관하게 진행 가능 |

---

## 12. 의존성 & 핸드오프

### cory 단독 진행 가능 (대표 승인만 필요)
- Phase 1 메타데이터 추가 SQL
- 자동 분류 로직 구현
- 대시보드 6분면 UI 설계

### PIXEL 의존
- 도메인 전략 v3 대표 승인 + Phase 1 인프라
- *.alth.co.kr 서브도메인 활성화
- Cloudflare Email Routing 8개 alias

### 대표 결정 의존
- 도메인 전략 v3 최종 승인
- 애니빌드 API 활성화
- aldh2 처리 옵션 (research 흡수 vs 별도 유지)
- 이메일 8개 alias 정책

### MUSE 의존
- 3종 brand_voice 카피 가이드 작성

### SAGE 의존 (본 보고)
- v4 전사 정합 검토
- 서브도메인 × 세그먼트 매트릭스 합의
- 영토별 KPI 합의

---

## 13. SAGE 보고 요청 사항

1. **v4 전략 검토 + 승인** (단일 마스터 정합)
2. **서브도메인 × 세그먼트 매트릭스 합의** (운영 정책 확정)
3. **영토별 KPI 합의** (Phase 3 대시보드 측정 기준)
4. **이메일 alias 8개 정책** (역할 분담·운영 책임)
5. **research 영토 처리 옵션** (aldh2 흡수 vs 별도 유지)

---

## 14. 핸드오프 5요소

- **요약**: 도메인 전략 v2.2(3축) → v3(단일 alth.co.kr) 승격에 따라 cory CRM 재구성 v3 → v4 정합. 서브도메인 영토 × 세그먼트 매트릭스로 데이터 모델·발송·대시보드 전면 재설계.
- **핵심 발견**:
  ①territory 값을 3축(system·brand·academic) → 6서브도메인(biz·gov·edu·research·shop·blog)으로 변경
  ②이메일을 4개 도메인 → @alth.co.kr 단일 8개 alias로 통합
  ③Phase 1(메타데이터 추가)은 도메인 마이그레이션과 무관하게 즉시 가능
- **요청**: SAGE — ①v4 검토·승인 ②매트릭스 합의 ③영토별 KPI 합의 ④alias 정책 ⑤research 옵션 결정
- **긴급도**: 🟡 도메인 v3 대표 승인 후 즉시 가동 (PIXEL 회원 통일과 병렬)
- **참조 문서**:
  - [[CORY_CRM_REDESIGN_v4]] (본 문서)
  - [[CORY_CRM_REDESIGN_v4]] (3축 기반·archive)
  - [[경영지원(슬기)/도메인_전략_v3_순수BrandedHouse]]
  - [[NORMALIZATION_STRATEGY]]
  - `memory/project_member_unification`

---

## 관련 문서

- [[CORY_CRM_REDESIGN_v4]]
- [[NORMALIZATION_STRATEGY]]
- [[PHASE1_ACTIONMAP]]
- [[경영지원(슬기)/도메인_전략_v3_순수BrandedHouse]]
- [[웹운영/마이그레이션_12개월계획_v3_20260521]]
