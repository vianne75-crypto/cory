---
title: "HUNTER → cory 이관 프로토콜"
date: 2026-03-31
type: spec
product: [알쓰패치]
tags: [CRM, 리드이관, HUNTER, PULSE, farm360]
agent: PULSE
status: active
---

# HUNTER → cory 이관 프로토콜

> farm360(HUNTER 다래)에서 발굴한 신규 기관을 cory CRM으로 이관하고 퍼널 관리를 시작하는 표준 프로세스.

---

## 1. 이관 채널 맵

```
[발굴 채널]                [이관 방식]               [초기 퍼널]
HC DM QR 클릭      →  CF Worker 자동 동기화  →  인지 (purchase_stage='인지')
HC 샘플 신청        →  GAS 자동 동기화       →  관심 (sample_included=true)
HC 전화 팔로업      →  cory INBOX 표준 포맷  →  관심 or 고려
기타 DM 캠페인 응답 →  farm360 시트 배치 이관 →  관심
HUNTER 수동 발굴    →  cory INBOX 표준 포맷  →  단계 판단 후 등록
상담내역 발굴       →  consult_discovery 자동 → 관심 (상담 태그 기준)
주문 발견           →  order sync 자동       →  구매
```

---

## 2. 이관 기준 (Gate — 통과해야 cory 등록)

| 조건 | 내용 |
|------|------|
| ✅ 필수 | 기관명 확인됨 |
| ✅ 필수 | 세그먼트 추정 가능 (이름 suffix 또는 HUNTER 판단) |
| ✅ 필수 | 유효한 접촉 증거 1건 이상 (QR클릭/샘플신청/전화/이메일/상담/주문) |
| ⚠️ 권고 | 연락처(전화 or 이메일) 1개 이상 |
| ❌ 제외 | 개인 구매자 (기관명 없음) |
| ❌ 제외 | 이미 cory에 등록된 기관 (중복 방지) |

---

## 3. 초기 퍼널 단계 배정 규칙

| 접촉 수준 | purchase_stage | 기준 |
|----------|---------------|------|
| QR만 클릭 | `인지` | 관심 표현이 없는 단순 노출 |
| 샘플 신청 | `관심` | 능동적 행동 = 관심 확인 |
| 전화/이메일 문의 | `관심` | 직접 연락 = 관심 확인 |
| 견적 요청 | `고려` | 구매 검토 시작 |
| 구매 완료 | `구매` | 실제 주문 |

---

## 4. HUNTER INBOX 표준 포맷 (수동 이관 시)

HUNTER가 cory INBOX에 신규 기관을 등록할 때 반드시 아래 형식 사용:

```
| # | FROM | 요청 내용 | 참조 파일 | 마감 |
|---|------|---------|---------|------|
| N | HUNTER 다래 | [신규기관 cory 등록] 기관명: OO대학교 / 세그먼트: 대학보건센터 / 지역: 서울 / 연락처: 02-xxx-xxxx / 담당자: 홍길동 / 접촉 근거: HC DM 전화 팔로업 D+3 응답 / 초기 단계: 관심 / 메모: 9월 예산편성 예정 | farm360/HC_전화팔로업_우선순위리스트.md | 즉시 |
```

**필수 필드:**
- `기관명` — 정식 명칭
- `세그먼트` — 보건소/대학보건센터/전문기관/산업보건/초중고/전공/광역시도및중앙기관
- `접촉 근거` — 어떤 행동이 있었는가
- `초기 단계` — 인지/관심/고려

**선택 필드:**
- 지역, 연락처, 담당자, 메모

---

## 5. sourced_by 태그 기준

| 태그 | 설명 | 설정 주체 |
|------|------|---------|
| `hc_dm_qr` | HC DM QR 클릭 | CF Worker 자동 |
| `hc_dm_sample` | HC 샘플 신청 | GAS 자동 |
| `hunter_manual` | HUNTER 직접 발굴 | PULSE 수동 등록 시 |
| `campaign_dm` | 기타 DM 캠페인 응답 | 배치 이관 시 자동 |
| `consult_discovery` | 상담내역 매칭 중 발견 | rematch-consultations.js |
| `order_discovery` | 주문 데이터에서 발견 | 주문 동기화 시 |
| `referral` | 기존 고객 추천 경유 | PULSE 수동 (추후 자동화) |

---

## 6. PULSE 처리 워크플로 (이관 후)

```
신규 기관 cory 등록됨 (sourced_by 태그 포함)
    ↓
PULSE 주 1회 신규 유입 기관 검토 (매주 월요일)
    ↓
등급 산정:
  Hot  — 연락처 있음 + 견적 or 샘플 신청
  Warm — 연락처 있음 or 이메일 문의
  Cold — QR만 클릭 or 연락처 없음
    ↓
팔로업 스케줄 설정:
  Hot  → 3일 내 접촉
  Warm → 2주 내 접촉
  Cold → 다음 캠페인 대기
    ↓
consultations 테이블에 팔로업 기록
```

---

## 7. 배치 이관 (farm360 구글시트 → cory) — 향후 자동화

**대상:** 기타 DM 캠페인 응답 (HC DM 외)

**트리거:** HUNTER가 farm360 Google Sheet "이관대기" 탭에 기관 목록 작성 → FLUX가 배치 이관 실행

**farm360 "이관대기" 탭 필드:**
```
name | type | region | contact | contact_person | purchase_stage | source | campaign | notes
```

**이관 스크립트:** `scripts/farm360-import.js` (향후 구현)
- 중복 기관명 fuzzy check (유사도 80%+)
- 신규면 INSERT / 기존이면 UPDATE (sourced_by, lead_date만 추가)

---

## 8. cory 신규 유입 뷰 (대시보드)

> 구현 위치: admin.html → 기관 탭 → "신규 유입" 필터

**조건:**
```sql
WHERE sourced_by IN ('hunter_manual', 'hc_dm_qr', 'hc_dm_sample', 'campaign_dm', 'consult_discovery')
  AND purchase_stage IN ('인지', '관심', '고려')
ORDER BY created_at DESC
```

**표시 컬럼:** 기관명 / 세그먼트 / 유입경로 / 유입일 / 퍼널단계 / 연락처 / 팔로업 상태

---

## 9. 오늘 전화 뷰 (상담 탭)

> 구현 위치: admin.html → 상담내역 탭 → "오늘 팔로업" 빠른 필터

**조건:**
```sql
WHERE next_followup_date = CURRENT_DATE
ORDER BY source, matched DESC
```

---

## 10. 팔로업 결과 수신 프로토콜 (HUNTER → PULSE)

> **핵심 원칙**: HUNTER가 전화·현장접촉·DM 결과를 만들면, cory가 즉시 반영해야 한다.
> 팔로업 결과는 리드 이관만큼 중요하다 — 빠진 결과 = 중복 연락 = 고객 신뢰 손상.

### 10-1. 수신 채널 3가지

| 채널 | 트리거 | 데이터 소스 | 동기화 방식 |
|------|--------|-----------|-----------|
| **A. 구글시트 자동** | 시트 행 추가/수정 시 | farm360 구글시트 (팔로업 탭, 샘플신청 탭) | CF Worker `/sync-followup-results` (신규 구현) |
| **B. INBOX 수동** | HUNTER가 INBOX에 기록 | cory INBOX.md 표준 포맷 | PULSE 세션 시작 시 처리 |
| **C. 캠페인 배치** | 캠페인 종료 후 일괄 | farm360 "이관대기" 탭 | `scripts/farm360-import.js` 배치 실행 |

### 10-2. 구글시트 팔로업 탭 구조

> 시트: `HC_DM_팔로업트래킹` (기존) + 캠페인별 샘플신청 탭

**팔로업트래킹 수동 입력 컬럼 (J~M):**

| 열 | 필드 | 용도 |
|----|------|------|
| J | 전화팔로업결과 | 통화성공/부재/거절/연결불가/이메일발송 |
| K | 담당자명 | 실제 통화 상대 |
| L | 샘플신청Y/N | 샘플 추가 신청 여부 |
| M | 비고 | 특이사항, 다음 접촉 메모 |

**캠페인별 샘플신청 탭 (gid별):**

| 탭 | GID | 용도 |
|----|-----|------|
| HC_샘플신청 | (미확인) | HC DM 샘플 신청 |
| 학회 샘플신청 | 538324 | 학회 현장 배포 후 샘플 신청 |

### 10-3. 동기화 트리거 운영

```
[즉시 반영 — 매일]
  ① 세션 시작 시 INBOX 스캔 → HUNTER OPEN 항목 즉시 처리
  ② 상담 모달에서 통화 결과 직접 입력 (대표 or PULSE)

[자동 동기화 — 1시간 주기]
  ③ GAS 트리거: 구글시트 팔로업트래킹 J~M열 변경 감지
     → CF Worker /sync-followup-results → consultations INSERT
     → institutions.metadata 업데이트 (contact_name, contact_phone)

[배치 동기화 — 캠페인 종료 시]
  ④ 캠페인별 샘플신청 탭 → cory 기관 등록 + 팔로업 레코드 생성
     → 트리거: HUNTER가 INBOX에 "배치 이관 요청" 등록
```

### 10-4. HUNTER 다래에게 요청 사항

> **요청일: 2026-03-31 | 요청자: PULSE 다온**

다래에게 아래 규칙을 전달하고 준수 요청:

**① 통화 결과는 반드시 구글시트에 즉시 기록**
- HC_DM_팔로업트래킹 J~M열 (전화팔로업결과, 담당자명, 샘플신청Y/N, 비고)
- 기록 없으면 cory에서 중복 연락할 수 있음

**② 신규 샘플 발송 시 샘플신청 탭에 기록**
- 캠페인별 샘플신청 탭 (HC/학회 등)에 행 추가
- 필수: 이름, 소속기관, 배송주소, 연락처, 캠페인코드, 발송일, 송장번호

**③ 퍼널 변경 이벤트 발생 시 INBOX 즉시 등록**
- 거절 → Cold 전환 (cory 퍼널 업데이트 필요)
- 구매 전환 (충북대 케이스) → cory 퍼널 + 금액 업데이트
- 새로운 담당자 발견 → metadata 업데이트

**④ 주간 핸드오프 (매주 월요일)**
- 전주 통화 결과 요약 + 이번 주 팔로업 대상 목록
- INBOX 표준 포맷으로 등록

### 10-5. 자동화 로드맵

| 단계 | 내용 | 시기 |
|------|------|------|
| Phase 1 (현재) | 수동 — INBOX + 상담 모달 직접 입력 | 즉시 |
| Phase 2 | GAS 트리거 — 시트 J~M열 변경 → consultations 자동 INSERT | 4월 2주차 |
| Phase 3 | 캠페인 탭 자동 동기화 — 샘플 신청 → 기관 등록 + 팔로업 | 4월 3주차 |
| Phase 4 | 양방향 — cory 결과 → 시트 역동기화 (HUNTER 참조용) | 5월 |

---

## 관련 문서

- [[cory/INBOX.md]] — HUNTER 핸드오프 수신함
- [[마케팅전략/farm360/HC_전화팔로업_우선순위리스트.md]] — HC 우선순위 리스트 + 통화 결과
- [[마케팅전략/farm360/DM_발송_운영가이드.md]] — DM 운영 표준
- `gas/cloudflare-worker.js` — HC 자동 동기화 (hc_dm_qr/hc_dm_sample)
- `gas/hc-followup-sheet.js` — HC 팔로업 트래킹 시트 빌더
- `scripts/rematch-consultations.js` — 상담 발굴 (consult_discovery)
