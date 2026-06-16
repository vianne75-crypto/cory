---
title: P0-3 스타터패키지·프로그램북·얼라이언스 CRM 통합 — PULSE 위임
date: 2026-04-09
type: spec
product: [알쓰패치]
tags: [PULSE, CRM, 얼라이언스, 스타터패키지, 프로그램북, F1, 통합]
agent: SAGE
status: active
---

# P0-3 스타터패키지·프로그램북·얼라이언스 CRM 통합

> 위임자: SAGE 슬기 → PULSE 다온
> 마감: **2026-04-16** (F1 4/20 출시 D-4)
> 배경: F1 스타터패키지 4/20 출시 + 프로그램북 v0 작성 중 + 얼라이언스 4단계 운영 중. 세 개념이 cory CRM에 통합 미반영 상태.

---

## 1. 전체 구조 (대표 확정)

```
[프로그램북 — 학술 근거]
   ↓ 정당화
[스타터패키지 F1 — 현장 도구]
   ↓ 활용
[얼라이언스 — 사람 네트워크]
   ↓ 확산

수직 확대 흐름:
스카우트(개인) → 마스터(기관 담당자) → 프로(강사) → 엔터프라이즈(파트너)
```

### 핵심 융합 포인트

| 단계 | 도구 | 자격 | 권한 |
|------|------|------|------|
| **스카우트** | APS 라이트 4문항 (개인용) | 퀴즈 통과 | 샘플 5매 + 25% 할인 |
| **마스터** | AUDIT-K 10문항 (집단 진단) + F1 스타터패키지 | 마스터 온보딩 5편 + 커리큘럼 3모듈 | F1 구매 + 기관 보고서 발급 |
| **프로** | 강연 시나리오 + 마진쉐어 | 강연 10회+ + 상담 100회+ | 강사료 + 발굴 마진 (신규 10%·재구매 5%) |
| **엔터프라이즈** | 프로그램 공동 IP | 프로 1년+ + 학회 임원/논문 | 강사 양성 + 로열티 |

---

## 2. cory CRM 적용 — 신규 필드 (PULSE 설계 요청)

### 2-1. institutions 테이블 신규 필드 7개

```sql
ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS has_master            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS master_count          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS f1_starter_purchased  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS f1_starter_date       TEXT,
  ADD COLUMN IF NOT EXISTS programbook_received  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS audit_k_sessions      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alliance_tier         TEXT;  -- SCOUT/MASTER/PRO/ENTERPRISE
```

| 필드 | 설명 | 입력 시점 |
|------|------|---------|
| `has_master` | 기관 내 마스터급 인력 보유 여부 | 마스터 등록 시 자동 |
| `master_count` | 기관 내 마스터 인원 수 | 마스터 등록·이직 시 갱신 |
| `f1_starter_purchased` | F1 스타터패키지 구매 여부 | wcolive 주문 매칭 |
| `f1_starter_date` | F1 첫 구매일 | wcolive 주문 매칭 |
| `programbook_received` | 프로그램북 수령 여부 | 수동 + GAS 자동화 |
| `audit_k_sessions` | AUDIT-K 집단 진단 실시 횟수 | 기관 보고서 발급 시 +1 |
| `alliance_tier` | 기관 단위 얼라이언스 등급 | 마스터 보유 + F1 구매 시 자동 |

### 2-2. alliance_tier 자동 산출 로직

```
- 마스터 0명 → NULL (일반 기관)
- 마스터 1명 + F1 미구매 → 'POTENTIAL'
- 마스터 1명 + F1 구매 → 'MASTER'
- 마스터 2명+ + F1 구매 + AUDIT-K 5회+ → 'ACTIVE_MASTER'
- 위 + 강사 보유 → 'PRO_INSTITUTION'
```

---

## 3. 신규 테이블 (PULSE 검토 후 결정)

### 옵션 A: persons 테이블 신설 (기관 내 개별 마스터 추적)

```sql
CREATE TABLE IF NOT EXISTS persons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  institution_id INTEGER REFERENCES institutions(id),
  role TEXT,  -- 보건관리자/보건교사/간호사/의사/기타
  alliance_level TEXT,  -- SCOUT/MASTER/PRO/ENTERPRISE
  quiz_passed_at TIMESTAMP,
  onboarding_completed_at TIMESTAMP,
  master_certified_at TIMESTAMP,
  pro_certified_at TIMESTAMP,
  consultation_count INTEGER DEFAULT 0,
  training_sessions INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**장점**: 담당자 이직 시 추적 가능, 개인별 실적 측정
**단점**: aps7.net 회원 DB와 동기화 설계 필요 (FLUX 협업)

### 옵션 B: institutions 필드만으로 처리 (간단)

`master_count`, `pro_count` 필드만 기관별 집계로 유지.

**장점**: 즉시 구현
**단점**: 개인 추적 불가

> **PULSE 권고**: 옵션 B로 4/16까지 1차 구현 → 옵션 A는 Q3 검토

---

## 4. 워크플로 (CRM 자동화 트리거)

### 4-1. F1 출시 직후 (4/20~)

```
[wcolive 주문] F1 스타터패키지 구매
   ↓ (자동 매칭 — FLUX P0-2 인프라 활용)
[cory] institutions.f1_starter_purchased = true
   ↓
[자동] alliance_tier 재계산
   ↓
[자동 알림] PULSE에게 신규 F1 구매 기관 슬랙/이메일 알림
   ↓
[PULSE 액션] 기관 카드에 "F1 도입" 태그 + 30일 후속 일정 등록
```

### 4-2. 프로그램북 배포 (이해국 교수 감수 후)

```
[FORGE] 프로그램북 v1 완성
   ↓
[발송 대상 추출] cory에서 alliance_tier = MASTER 기관 추출
   ↓
[수동 발송] PRISM 인쇄 + PULSE 우편/이메일 발송
   ↓
[cory] programbook_received = true 일괄 UPDATE
```

### 4-3. AUDIT-K 사용 추적

```
[기관 보고서 발급] aps7.net F4 마스터 트랙
   ↓ (수동 or webhook)
[cory] audit_k_sessions += 1
   ↓
[자동] AUDIT-K 5회+ 도달 시 alliance_tier → ACTIVE_MASTER 승격
   ↓
[PULSE 알림] 우수 기관 표창 후보 리스트
```

---

## 5. PULSE 즉시 실행 항목 (4/16 마감)

### Step 1: 현황 파악 (4/10 ~ 4/11)

- [ ] 위 7개 신규 필드 SQL 작성 + Supabase 실행 가이드 작성 (P0-1 패턴)
- [ ] 옵션 A vs 옵션 B 결정 → SAGE 보고
- [ ] 자동화 트리거 3종 (4-1·4-2·4-3) 워크플로 다이어그램 작성

### Step 2: SQL 실행 (4/12 ~ 4/13)

- [ ] Supabase에 신규 필드 추가 (대표 직접 실행)
- [ ] alliance_tier 자동 산출 함수 또는 뷰 생성
- [ ] 기존 152개 구매 기관 alliance_tier 1차 분류

### Step 3: cory 대시보드 반영 (4/14 ~ 4/15)

- [ ] 기관 상세 카드에 "F1 도입" "프로그램북 수령" "마스터 보유" 표시
- [ ] alliance_tier 필터 추가
- [ ] AUDIT-K 사용 횟수 표시

### Step 4: 4/20 출시 대비 (4/16)

- [ ] F1 출시 직후 자동 매칭 시나리오 검증
- [ ] PULSE 알림 채널 설정 (어디로 알림?)
- [ ] SAGE 보고서 작성

---

## 6. 미결 사항 (PULSE 확인 필요)

| # | 항목 | 현재 상태 | 결정 요청 |
|---|------|---------|---------|
| **L1** | 스타터패키지 정식 명칭 | "스타터" "1차 패키지" "시작 키트" 혼재 | "F1 스타터패키지" 통일 권장 |
| **L2** | 프로그램북 발송 우선순위 | 미정 | alliance_tier=MASTER 기관 우선 |
| **L3** | F2~F4 출시 로드맵 | "예정" 미명시 | FORGE 협의 |
| **L4** | 마진쉐어 cap | 무제한 명시 | 정책 결정 필요 |
| **L5** | 스카우트→마스터 전환율 목표 | 0 (미설정) | 1차 5% 잠정 |
| **L6** | 개인 마스터 vs 기관 마스터 구분 | 양분 상태 | 옵션 A 채택 시 자동 해소 |

---

## 7. 핵심 KPI (PULSE 추적 대상)

```
F1 도입 기관 수 (월간) — 목표: 4월 20개, 5월 50개
프로그램북 수령 마스터 수 — 목표: 6월까지 100명
AUDIT-K 평균 사용 횟수 (마스터당) — 목표: 분기별 3회
스카우트→마스터 전환율 — 목표: 5% (1차)
```

---

## 8. 협업 요청

| 에이전트 | 요청 사항 |
|---------|---------|
| **FLUX 이음** | 옵션 A 선택 시 aps7.net ↔ persons 동기화 스크립트 |
| **FORGE 벼리** | 프로그램북 v1 완성 → 발송 대상 분류 자문 |
| **SAGE 슬기** | 미결사항 L1~L6 대표 확인 후 확정 |
| **PRISM 채린** | 프로그램북 인쇄·디자인 |
| **HUNTER 다래** | 신규 마스터 후보 발굴 (현재 152개 구매 기관 중 보건관리자 보유 기관) |

---

## 관련 문서

- [[APS얼라이언스_전략서]] — 4단계 멤버십 구조
- [[얼라이언스_멤버십_개요_v1]] — BOND 작성
- [[마스터_커리큘럼_초안_v0]] — FORGE 작성
- [[2026-03-30-gtm-F1Standard정식출시]] — F1 출시 계획
- [[P02_재구매데이터_채우기_FLUX]] — wcolive 매칭 인프라 (선행)
