---
title: cory 대시보드·CRM 전략 재구성 v3 — 3축 마스터 정합
date: 2026-05-21
type: strategy
agent: PULSE + FLUX
status: superseded
superseded_by: CORY_CRM_REDESIGN_v4.md
superseded_date: 2026-05-27
product: [알쓰패치, 노담패치]
segment: [B2C, B2B, B2G, 학술, 얼라이언스]
tags: [도메인전략v2.2, 3축마스터, CRM재구성, 정규화, channel_group, archived]
---

> ⚠️ 이 문서는 [[CORY_CRM_REDESIGN_v4]]으로 승격되었습니다 (2026-05-27, 도메인 전략 v3 정합 갱신)
> **최신 버전**: [[CORY_CRM_REDESIGN_v4]]
> **승격 근거**: [[경영지원(슬기)/도메인_전략_v3_순수BrandedHouse]] (v2.2 → v3 단일 마스터 alth.co.kr 전환)

# cory 대시보드·CRM 전략 재구성 v3

> **계기**: 도메인 전략 v2.2 3축 마스터 (aps7·alth·aldh2) 확정 + 회원 통합 결정 + 애니빌드 API 발견 + Phase 1 contact 정규화 완료.
> **이전 버전**: NORMALIZATION_STRATEGY.md (Phase 1·2·3 기반)
> **변경 폭**: 데이터 모델 재정의 + 대시보드 뷰 신설 + 발송 채널 영토 분리.

---

## 1. 한 줄 결론

> **cory는 3축 영토(territory) × 세그먼트 매트릭스로 재구성된다. 단일 institutions 테이블에 `territory`·`segment_v2`·`cta_domain`·`brand_voice` 필드를 추가하고, 각 영토(aps7·alth·aldh2)에서 들어오는 데이터를 통합하면서 발송 시 영토별 CTA·톤·이메일 도메인을 자동 분기한다.**

---

## 2. 핵심 변화 — v2(Phase 1·2·3) → v3 (3축)

| 영역 | v2 | **v3 (3축)** |
|------|-----|-----------|
| 채널 분기 기준 | `channel_group` (공공 wcolive / 민간 aps7) | `territory` (aps7·alth·aldh2) + `segment_v2` |
| 발송 CTA URL | wcolive vs aps7 단일 분기 | 영토별 분기 + 세그먼트 정합 |
| 이메일 도메인 | 단일 (회사) | `@aps7.net` (회사) + `@alth.co.kr` (브랜드) |
| 데이터 소스 | wcolive Webhook | 통합 어드민(olive5277) + 애니빌드 공식 API |
| 회원 정보 | 사이트별 분산 | 회원 공유 활성화 후 단일 contact_* |
| 세그먼트 | 5종 (보건소·기업·전문·대학·B2C) | 영토 × 세그먼트 매트릭스 |
| 대시보드 뷰 | 단일 퍼널 | 영토 패널 + 세그먼트 매트릭스 + 통합 퍼널 |

---

## 3. 데이터 모델 재정의

### 3-1. institutions 신규 필드 (Phase 2 → v3 갱신)

```sql
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS territory VARCHAR(20);
-- 값: 'system_aps7' | 'brand_alth' | 'academic_aldh2' | NULL (미분류)

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS segment_v2 VARCHAR(20);
-- 값: 'b2c' | 'b2b_corp' | 'b2b_health' | 'b2g_public' | 'b2g_academic' | 'alliance'

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS primary_cta_domain VARCHAR(50);
-- 값: 'shop.alth.co.kr' | 'gov.aps7.net' | 'aldh2.kr' | 'edu.aps7.net'

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS brand_voice VARCHAR(20);
-- 값: 'friendly_b2c' | 'professional_b2b' | 'authoritative_academic'

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS source_master VARCHAR(20);
-- 데이터 유입 출처 도메인 (aps7·alth·aldh2·legacy_wcolive)
```

### 3-2. 영토 자동 산출 로직

```js
function calcTerritory(inst) {
  // 1. 명시적 source_master가 있으면 우선
  if (inst.source_master === 'aldh2') return 'academic_aldh2';
  if (inst.source_master === 'alth')  return 'brand_alth';
  if (inst.source_master === 'aps7')  return 'system_aps7';
  
  // 2. segment_v2 기반 추론
  const seg = inst.segment_v2;
  if (seg === 'b2c') return 'brand_alth';
  if (seg === 'b2g_public' || seg === 'b2g_academic') return 'academic_aldh2';
  if (seg === 'b2b_corp' || seg === 'b2b_health' || seg === 'alliance') return 'system_aps7';
  
  // 3. type 기반 폴백
  const t = (inst.type || '').toLowerCase();
  if (t.includes('보건소') || t.includes('중독') || t.includes('정신')) return 'academic_aldh2';
  if (t.includes('기업') || t.includes('병원') || t.includes('대학')) return 'system_aps7';
  return null;
}
```

### 3-3. CTA URL 자동 분기

```js
function getCtaUrl(inst, action) {
  const t = inst.territory;
  
  // 구매 액션
  if (action === 'purchase') {
    if (t === 'brand_alth')      return 'https://shop.alth.co.kr';
    if (t === 'academic_aldh2')  return 'https://gov.aps7.net';
    if (t === 'system_aps7')     return 'https://aps7.net/order';
  }
  
  // 콘텐츠 액션
  if (action === 'content') {
    if (t === 'brand_alth')      return 'https://alth.co.kr/tribes/';
    if (t === 'academic_aldh2')  return 'https://aldh2.kr/research/';
    if (t === 'system_aps7')     return 'https://aps7.net';
  }
  
  // 교육·자격증 액션
  if (action === 'edu') {
    return 'https://edu.aps7.net';  // 영토 무관, 얼라이언스 통합
  }
  
  return null;
}
```

---

## 4. CRM 분류 재구성 — 영토 × 세그먼트 매트릭스

```
                       │ system_aps7   │ brand_alth     │ academic_aldh2
                       │ (회사·시스템) │ (브랜드·소비자)│ (학술·공공)
─────────────────────┼─────────────┼──────────────┼──────────────
b2c (일반 소비자)      │ —             │ ⭐ Primary    │ 학술 진입 시
b2b_corp (기업)        │ ⭐ Primary    │ 보조           │ 보건관리자 일부
b2b_health (보건관리자)│ Primary        │ —             │ ⭐ 자료 다운로드
b2g_public (보건소)    │ 결제만         │ —             │ ⭐ Primary
b2g_academic (학회)    │ —              │ —             │ ⭐ Primary
alliance (얼라이언스)  │ ⭐ Primary    │ —             │ —
```

**핵심 원리:**
- 한 기관이 **여러 영토에 등장 가능** (예: 기업 보건관리자는 b2b_health × system_aps7 + academic_aldh2 듀얼)
- **Primary 영토 1개**(필수) + **Secondary 영토 N개**(선택) 관리

---

## 5. 대시보드 뷰 재구성

### 5-1. 메인 대시보드 — 3축 패널

```
┌─ aps7 (회사·시스템) ─┬─ alth (브랜드) ─┬─ aldh2 (학술) ─┐
│  기관 수: XXX        │  방문자: XXX     │  논문 인용: XX  │
│  구매 단계: XXX      │  트라이브즈: XX  │  보건소: XXX    │
│  얼라이언스: XX      │  이벤트 참여: XX │  공공기관: XX   │
└─────────────────────┴─────────────────┴────────────────┘
```

### 5-2. 통합 퍼널 (영토 색상 구분)

```
인지 → 관심 → 고려 → 구매 → 만족 → 추천 → 파트너
 [🟦 aps7] [🟪 alth] [🟩 aldh2]  
   (각 단계에서 영토별 비율 표시)
```

### 5-3. 영토별 상세 뷰

각 영토 클릭 시:
- 영토 진입 → 첫 접촉 채널
- 세그먼트 분포
- 평균 구매 단계
- 평균 재구매 주기
- 이탈률
- Cross-territory 이동 패턴 (예: alth → aldh2로 진화한 사용자)

### 5-4. 매트릭스 뷰

영토 × 세그먼트 교차 테이블:
- 각 셀에 기관 수·매출·재구매율 표시
- 비어있는 셀(0%) 식별 → 영토 확장 기회

---

## 6. 데이터 흐름 재설계

```
[3축 마스터]                    [통합 어드민]            [cory]
┌──────────────┐
│ aps7.net    │──┐
├──────────────┤  │     ┌─────────────┐      ┌──────────┐
│ alth.co.kr  │──┼─────▶│ olive5277 │─────▶│ Supabase  │
├──────────────┤  │     │ (통합)     │ API   │ + Webhook │
│ aldh2.kr    │──┘     └─────────────┘       └──────────┘
└──────────────┘                                  │
                                                  ▼
                                          [territory 자동 분류]
                                          [segment_v2 자동 분류]
                                          [primary_cta_domain 자동 설정]
```

### 데이터 소스별 영토 매핑 (애니빌드 API 활성화 후)

| 데이터 소스 | source_master | 자동 부여 territory |
|-------------|---------------|---------------------|
| `aps7.net` 회원가입 | aps7 | system_aps7 |
| `alth.co.kr/shop` 주문 | alth | brand_alth |
| `aldh2.kr` 다운로드/문의 | aldh2 | academic_aldh2 |
| `gov.aps7.net` B2G 결제 | aps7 | academic_aldh2 (B2G 청구) |
| HC 샘플 신청 | (gas) | system_aps7 (b2b_health) |
| Adot 통화 기록 | (gas) | 영토 보존 또는 미분류 |

---

## 7. 발송 채널 재정의

### 7-1. 카카오 알림톡 분기

```js
function getKakaoTemplate(inst, campaign) {
  const t = inst.territory;
  
  // 영토별 발신 프로필
  const sender = {
    'brand_alth':     'ALTH 브랜드 채널',       // 친근 톤
    'system_aps7':    'APS 회사 공식',          // 공식 톤
    'academic_aldh2': 'ALDH2 학술 센터',         // 권위 톤
  }[t];
  
  // 영토별 CTA URL
  const cta = getCtaUrl(inst, 'purchase');
  
  return { sender, cta, template: `${campaign}_${t}` };
}
```

### 7-2. 이메일 도메인 분기

| 캠페인 유형 | 발신 도메인 | 영토 |
|-----------|-----------|------|
| 브랜드 이벤트·노담사은가 | `@alth.co.kr` | brand_alth |
| 회사 공식·뉴스·세금계산서 | `@aps7.net` | system_aps7 |
| 학술 자료·논문·세미나 | `@aldh2.kr` | academic_aldh2 |
| 얼라이언스 운영·자격증 | `@aps7.net` | system_aps7 |

### 7-3. 브랜드 보이스 톤 가이드

| brand_voice | 톤 | 호칭 | 예시 |
|------------|-----|------|------|
| `friendly_b2c` | 친근·도발 | "여러분" | "이번엔 직원이 먼저 물어봤어요" |
| `professional_b2b` | 공식·실용 | "OO 담당자님" | "보건 사업 계획 수립을 위한 자료를 안내드립니다" |
| `authoritative_academic` | 권위·정확 | "OO 선생님" / "OO 보건소" | "ALDH2 결핍 검사의 보건교육 활용 가이드를 송부드립니다" |

---

## 8. 단계별 이행 계획

### Phase 0 — 현재 상태 (2026-05-21)
- ✅ contact_* 정규화 완료 (1234 기관, 31.7% 충원)
- ✅ JS 코드 metadata → 표준 컬럼 전환 일부 완료
- ⏳ PIXEL 회원 통일 + 회원공유 진행 중
- ⏳ 애니빌드 API 활성화 대기

### Phase 1 — 3축 메타데이터 추가 (PIXEL 회원 통일 직후)
1. institutions에 5개 필드 추가 (territory·segment_v2·primary_cta_domain·brand_voice·source_master)
2. 기존 기관 자동 분류 (calcTerritory 적용)
3. JS 매핑 함수 신설 (getCtaUrl·getKakaoTemplate)

### Phase 2 — 데이터 동기화 (API 활성화 후)
1. 애니빌드 회원 정보 조회 API → contact_* + source_master 충원
2. 애니빌드 주문서 조회 API → orders 백필 + territory 부여
3. 신규 Webhook 4개 활성화 (주문상태·회원가입·회원수정·로그인)

### Phase 3 — 대시보드 재구성 (Phase 2 안정화 후)
1. 메인 대시보드에 3축 패널 추가
2. 통합 퍼널 색상 구분
3. 영토 × 세그먼트 매트릭스 뷰
4. Cross-territory 이동 추적

### Phase 4 — 발송 자동화 (대시보드 안정화 후)
1. 카카오 알림톡 영토별 템플릿 분기
2. 이메일 도메인 자동 선택
3. 브랜드 보이스 자동 적용 (MUSE 협업)

---

## 9. 마이그레이션 매트릭스

기존 데이터를 신규 필드로 매핑:

| 기존 institutions.type | 기존 purchase_stage | territory | segment_v2 | brand_voice |
|----------------------|---------------------|-----------|------------|-------------|
| 보건소 | * | academic_aldh2 | b2g_public | authoritative_academic |
| 통합건강증진 | * | academic_aldh2 | b2g_public | authoritative_academic |
| 중독관리/정신건강 | * | academic_aldh2 | b2g_public | authoritative_academic |
| 학회 | * | academic_aldh2 | b2g_academic | authoritative_academic |
| 기업 | * | system_aps7 | b2b_corp | professional_b2b |
| 병원 | * | system_aps7 | b2b_health | professional_b2b |
| 대학보건관리자 | * | system_aps7 | b2b_health | professional_b2b |
| 일반 | * | brand_alth | b2c | friendly_b2c |

---

## 10. 성공 지표 (KPI 재구성)

| 지표 | 측정 | 목표 (M+6) |
|------|------|----------|
| **영토별 활성 기관 비율** | territory별 COUNT | aps7 40% / alth 30% / aldh2 30% |
| **Cross-territory 진화율** | 다영토 등장 기관 / 전체 | >20% |
| **CTA 정합률** | 발송 시 territory-CTA 일치 | >95% |
| **브랜드 보이스 정합률** | territory-tone 일치 | >90% |
| **재구매율 by 영토** | 영토별 재구매 발생률 | aps7 50% / alth 30% / aldh2 60% |
| **데이터 출처 분포** | source_master별 신규 | 균등 분포 |

---

## 11. 위험·반론 대응

| 우려 | 대응 |
|------|------|
| "한 기관이 여러 영토에 속하면 혼란?" | Primary 1개 + Secondary N개 구조. Primary만 발송 기본값 |
| "기존 분류 마이그레이션 비용?" | type 기반 자동 분류 (calcTerritory) → 95% 자동 매핑 |
| "대시보드 너무 복잡?" | 영토 패널·매트릭스 뷰는 옵션. 기본 뷰는 통합 퍼널 유지 |
| "발송 분기 로직 오류 시 발송 실패?" | 폴백 도메인 정책: territory 미설정 시 `@aps7.net` + `aps7.net` CTA |
| "PIXEL 통합 도메인 결정 지연?" | Phase 1(메타데이터 추가)은 PIXEL 무관하게 진행 가능 |

---

## 12. 의존성 & 핸드오프

### cory 단독 진행 가능
- Phase 1 메타데이터 추가
- 자동 분류 로직 구현
- 대시보드 패널 설계 (UI만)

### PIXEL 의존
- 회원 통일 + 공유 활성화 (Phase 2 선행)
- 통합 어드민 olive5277 URL 확정
- Cloudflare Email Routing (@alth.co.kr 활성화)

### 대표 결정 의존
- 애니빌드 API 활성화
- Tier 2 방어 도메인 등록 범위
- 이메일 도메인 사용 정책 (회사 vs 브랜드)

### MUSE 의존
- 브랜드 보이스별 카피 작성 (3종 톤 가이드)

### SAGE 의존
- 영토별 KPI 측정 합의
- 전사 영토 정책 합의

---

## 13. 핸드오프 5요소

- **요약**: 도메인 전략 v2.2(3축 마스터) + 회원 통합 + 애니빌드 API에 맞춰 cory CRM·대시보드를 영토 × 세그먼트 매트릭스로 재구성한다.
- **핵심 발견**:
  ①기존 channel_group(공공/민간 2원)으로는 3축 영토 표현 불가
  ②territory + segment_v2 + cta_domain + brand_voice 4필드로 발송·콘텐츠·톤 자동 분기 가능
  ③Phase 1(메타데이터 추가)은 PIXEL 회원 통일과 무관하게 즉시 진행 가능
- **요청**: 대표 — ①v3 전략 승인 ②Phase 1 SQL 실행 권한 ③영토 × 세그먼트 매트릭스 합의
- **긴급도**: 🟡 PIXEL 회원 통일 완료 시점에 맞춰 가동 준비
- **참조 문서**:
  - [[NORMALIZATION_STRATEGY]] (v2 기반)
  - [[경영지원(슬기)/도메인_전략_v2.2_3축마스터]]
  - [[PHASE1_ACTIONMAP]]
  - [[memory/project_member_unification]]

---

## 관련 문서

- [[NORMALIZATION_STRATEGY]] (v2 → 본 문서로 확장)
- [[PHASE1_ACTIONMAP]]
- [[경영지원(슬기)/도메인_전략_v2.2_3축마스터]]
- [[웹운영/Phase1_실행가이드_도메인전략v2.2_20260519]]
