---
title: "CRM 자동화 트리거 로드맵 — cory 6대 갭 채우기"
date: 2026-04-09
type: roadmap
product: [알쓰패치]
agent: GRID 이음 + SAGE 슬기
status: draft
deadline: 2026-04-21
tags: [CRM, cory, 자동화, 트리거, lifecycle, 재구매]
related:
  - "[[마케팅전략/aps_marketing/CJM_기반_CRM_전체구조_v1|CJM 기반 CRM v1 (SAGE)]]"
  - "[[cory/SCM_운영_매뉴얼_GRID_이음|SCM 운영 매뉴얼 (이음)]]"
  - "`PM Skills/09-running-log/2026-04-05-growth-loops-보건관리자-그로스멤버십전략`"
---

# CRM 자동화 트리거 로드맵
## cory 6대 갭 채우기 — 4/21 확정 목표

> **발신**: SAGE 슬기
> **수신**: GRID 이음
> **마감**: 2026-04-21 (Week 2 리뷰 미팅과 동시 검토)
> **목적**: 재구매율 17% → 30% 목표 달성을 위한 cory 자동화 트리거 6종 설계

---

## 1. 배경

`CJM_기반_CRM_전체구조_v1.md`(2026-03-28) 5번 섹션에서 정의된 **"아직 어느 쪽도 안 하는 것 — 갭"** 6가지가 cory의 가장 큰 미구현 영역입니다.

이 갭을 채우지 못하면:
- ❌ 예산 편성기(9~11월) 재구매 기회 매년 자동 누락
- ❌ B2I 주관기관 교체 시 신규 주관기관 즉시 접촉 실패
- ❌ B2B 담당자 이직 시 새 기관 자동 리드화 불가
- ❌ 성과 보고서 수동 생성 → 재구매 동기 부여 실패
- ❌ 838개 기관 × 8단계 퍼널 수동 운영 한계

→ **재구매율 30% 목표 달성 불가능**.

---

## 2. 6대 자동화 트리거 정의

### Trigger 1: 예산 편성기 자동 접촉 (9~11월) 🔴 최우선

| 항목 | 내용 |
|---|---|
| **트리거 조건** | 매년 9월 1일 / 10월 1일 / 11월 1일 자정 |
| **대상** | `institutions` 테이블 중 `track IN ('B2G','B2I','B2B')` AND `status NOT IN ('lost','blocked')` |
| **액션** | (1) 담당자 카톡 알림톡 발송 — "내년도 예산 편성 시기입니다" + 사례 PDF 링크 (2) cory에 `followup_date = 7일 후` 자동 입력 (3) BOND 가온 상담 큐에 자동 배정 |
| **메시지 톤** | 트랙별 분기 — B2G는 "예산 신청 가이드", B2I는 "주관기관 보고 자료", B2B는 "보건관리자 ROI" |
| **성공 지표** | 9~11월 발송된 메시지 → 90일 내 발주 전환율 > 25% |
| **구현 도구** | Make.com 스케줄 트리거 + Supabase 쿼리 + 애니빌드 알림톡 API |
| **예상 공수** | Make 시나리오 1개 + 메시지 템플릿 3개 + 테스트 = 3일 |

---

### Trigger 2: B2I 주관기관 교체 모니터링 🔴 핵심 자산 보호

| 항목 | 내용 |
|---|---|
| **트리거 조건** | (a) `institutions.subcontract_renewal_year` 도래 90일 전 (b) 외부 신호 — 입찰공고·복지부 보도자료 키워드 매칭 |
| **대상** | B2I 4종 (중독관리·금연지원·근로자건강·정신건강복지센터) |
| **액션** | (1) SAGE에게 알림 — "주관기관 교체 가능성" (2) 입찰결과 발표 후 신규 주관기관명 cory `institutions.current_operator` 업데이트 (3) 신규 주관기관 담당자 자동 발굴 큐 등록 |
| **성공 지표** | 교체 후 30일 내 신규 주관기관 첫 접촉 100% |
| **구현 도구** | (a) Supabase scheduled function (b) 입찰공고 RSS·키워드 알림 (외부 시스템) — Phase 2에서 자동화, Phase 1은 SAGE 수동 입력 |
| **선행 작업** | `institutions` 테이블에 `subcontract_start_year`, `current_operator`, `subcontract_renewal_year` 컬럼 추가 |
| **예상 공수** | 스키마 변경 + Make 시나리오 + 수동 입력 SOP = 4일 |

---

### Trigger 3: 담당자 이직 추적 → 신규 리드 자동 생성 🟡

| 항목 | 내용 |
|---|---|
| **트리거 조건** | (a) Alliance 회원이 aps7.net 프로필에서 소속 기관 변경 (b) cory 상담 시 "이직했습니다" 발언 BOND가 입력 (c) 카톡 채널 차단·반송 신호 |
| **대상** | B2B 담당자 (사업장 보건관리자, 병원 보건부서, 대학보건센터) |
| **액션** | (1) `contacts.previous_institution` 필드에 이전 기관 기록 (2) `contacts.current_institution` 신규 기관으로 업데이트 (3) 신규 기관이 cory에 없으면 `institutions`에 자동 생성 (LEAD 단계) (4) 이전 담당자와의 관계는 유지 (재접촉 가능성) |
| **성공 지표** | 이직 인지 → 신규 기관 등록까지 24h 이내 |
| **구현 도구** | aps7.net ↔ cory 연동 (Trigger 6과 묶음 개발) |
| **선행 작업** | `contacts` 테이블에 `previous_institution`, `transition_date` 컬럼 |
| **예상 공수** | Trigger 6과 합쳐 5일 |

---

### Trigger 4: 학회 리드 → cory 자동 등록 🟡

| 항목 | 내용 |
|---|---|
| **트리거 조건** | 학회 부스 QR 스캔 / 명함 OCR / 강연 후 설문 응답 |
| **액션** | (1) Google Form/Tally 응답 → Make.com → cory `institutions` + `contacts` 자동 insert (2) `source = '학회_{학회명}_{날짜}'` 태그 (3) `sourced_by` 필드에 발굴자(스카우트/직원) ID 기록 — C3 sourced_by 필드 설계서 활용 |
| **성공 지표** | 학회 종료 24h 내 cory 등록 100% |
| **구현 도구** | Make.com + Google Form/Tally + Supabase REST API |
| **선행 작업** | C3 `sourced_by` 필드 (이미 설계 완료, 적용 대기) |
| **예상 공수** | 폼 1개 + Make 1개 + 테스트 = 2일 |

---

### Trigger 5: 성과 보고서 자동 생성 (PDF) 🟡

| 항목 | 내용 |
|---|---|
| **트리거 조건** | (a) 출고 30일 후 (b) 기관 요청 시 (c) 분기말 자동 |
| **대상** | 출고 완료 + E13 설문 회수율 > 0% 기관 |
| **액션** | (1) Supabase 출고·E13 설문·재구매 이력 집계 (2) PDF 템플릿에 자동 채움 (Carbone.io 또는 Google Docs API) (3) 담당자 카톡으로 PDF 링크 발송 (4) cory `reports` 테이블에 발송 이력 기록 |
| **PDF 구성** | 1쪽 요약 / 2쪽 참여율·완료율 / 3쪽 체질 분포 / 4쪽 비교(전국 평균 vs 우리 기관) / 5쪽 다음 단계 제안 |
| **성공 지표** | 보고서 발송 → 90일 내 재구매 전환율 > 35% (현재 17% 대비 +18%p) |
| **구현 도구** | Carbone.io 또는 Google Apps Script + Cloudflare R2(파일 호스팅) |
| **선행 작업** | E13 설문 응답 표준화, 출고 → 설문 트리거 (별도) |
| **예상 공수** | 템플릿 + 자동화 + 테스트 = 7일 (가장 큰 작업) |

---

### Trigger 6: aps7.net Alliance 등급 → cory 연동 🟡

| 항목 | 내용 |
|---|---|
| **트리거 조건** | aps7.net 회원 등급 변경 (일반회원 → 스카우트 → 마스터) 또는 포인트 적립 발생 |
| **액션** | (1) aps7.net Webhook → Make.com → cory `contacts.alliance_level`, `alliance_points` 업데이트 (2) 등급 변경 시 SAGE 알림 (3) 마스터 승급자는 별도 큐로 분리 (이음·BOND 양쪽 알림) |
| **성공 지표** | 등급 변경 → cory 반영 1시간 이내 |
| **구현 도구** | aps7.net Webhook + Make.com + Supabase |
| **선행 작업** | aps7.net Webhook 발행 기능 (PIXEL/이음 협업) |
| **예상 공수** | Webhook + Make + 테스트 = 4일 |

---

## 3. 우선순위 및 일정

### Phase 1 (4/22 ~ 5/3): 수동 입력 + 핵심 트리거 2종

| 시점 | 작업 | 담당 |
|---|---|---|
| 4/22~24 | Supabase 스키마 확장 (subcontract, transition, reports 테이블·컬럼) | 이음 |
| 4/25~27 | **Trigger 1 (예산편성기)** Make 시나리오 + 메시지 템플릿 3종 | 이음+가온 |
| 4/28~30 | **Trigger 4 (학회 리드)** Tally 폼 + Make + sourced_by 적용 | 이음 |
| 5/1~3 | Phase 1 통합 테스트 + SAGE 검수 | 이음+SAGE |

### Phase 2 (5/4 ~ 5/17): 연동 트리거 3종

| 시점 | 작업 | 담당 |
|---|---|---|
| 5/4~7 | **Trigger 6 (Alliance 연동)** Webhook + Make | 이음+PIXEL |
| 5/8~10 | **Trigger 3 (담당자 이직)** Trigger 6 위에 얹기 | 이음 |
| 5/11~14 | **Trigger 2 (주관기관 교체)** Phase 1 = SOP 수동 입력 / Phase 2 = 자동화 검토 | 이음+SAGE |
| 5/15~17 | Phase 2 통합 테스트 | 이음 |

### Phase 3 (5/18 ~ 5/31): 가장 큰 작업

| 시점 | 작업 | 담당 |
|---|---|---|
| 5/18~24 | **Trigger 5 (성과 보고서 PDF)** 템플릿 설계 + Carbone 연동 | 이음+벼리 |
| 5/25~28 | E13 설문 → 보고서 데이터 파이프라인 | 이음+벼리 |
| 5/29~31 | 첫 보고서 시범 발송 (5개 기관) | 이음+가온 |

**총 6주 일정. 6/1부터 6대 트리거 풀가동 가능**.

---

## 4. 의존성 매트릭스

| Trigger | 선행 조건 | 의존 작업 |
|---|---|---|
| 1. 예산편성기 | `institutions.followup_date` 필드 | 없음 (즉시 가능) |
| 2. 주관기관 교체 | `subcontract_*` 컬럼 추가 | 없음 |
| 3. 담당자 이직 | `contacts.previous_institution` | **Trigger 6 선행** |
| 4. 학회 리드 | `sourced_by` 필드 | C3 설계서 적용 (대기 중) |
| 5. 성과 보고서 | E13 설문 표준화 + PDF 인프라 | **벼리 협업 필수** |
| 6. Alliance 연동 | aps7.net Webhook 발행 기능 | **PIXEL 협업 필수** |

→ Trigger **1, 2, 4는 독립**적으로 즉시 착수 가능.
→ Trigger **3은 6 이후**.
→ Trigger **5는 가장 늦게 + 가장 큰 영향**.

---

## 5. 4/21 SAGE+이음 미팅 결정 사항

이 로드맵을 4/21 미팅에서 다음 사항 확정:

- [ ] 6대 트리거 우선순위 동의
- [ ] Phase 1·2·3 일정 조정 (이음 SCM 운영 부하와 충돌 검토)
- [ ] Trigger 5(보고서) 외주 vs 자체 개발 결정
- [ ] Trigger 6(Alliance Webhook) PIXEL 협업 일정
- [ ] Trigger 5 PDF 템플릿 디자인 PRISM 합류 여부
- [ ] 예산 (Carbone.io ~$50/월, R2 ~$15/월, Make 추가 시나리오)

---

## 6. 성공 지표 (6월 말)

| KPI | 현재 | 6월 목표 |
|---|---|---|
| 예산편성기 발송 후 90일 발주 전환율 | — | > 25% |
| B2I 주관기관 교체 대응 시간 | 수동 (몇 주~몇 달) | < 30일 |
| 학회 리드 cory 등록 시점 | 수동 (며칠 후) | 24h 이내 |
| 성과 보고서 발송률 | 거의 0% | > 70% |
| **재구매율 (전체 기관 평균)** | **17%** | **25% (1차) → 30% (Q4)** |

---

## 7. 금지사항 (이음 페르소나)

- ❌ 트리거 동작 검증 없이 운영 적용
- ❌ 메시지 발송 후 응답률·반송률 미모니터링
- ❌ Supabase 스키마 변경을 SAGE 미승인 적용
- ❌ Trigger 5 PDF 자동화를 외주 결정 없이 6주 내 자체 개발 강행
- ❌ SCM 운영(어제 착수)과 일정 충돌 무시

---

## 8. 참조 문서

- `마케팅전략/aps_marketing/CJM_기반_CRM_전체구조_v1.md` — 이 로드맵의 근거
- `cory/SCM_운영_매뉴얼_GRID_이음.md` — 이음 SCM 매뉴얼 (병행)
- `cory/C3_sourced_by_필드설계서_FLUX_이음.md` — Trigger 4 선행
- `PM Skills/09-running-log/2026-04-05-growth-loops-보건관리자-그로스멤버십전략.md` — Trigger 6 비즈니스 맥락
- `PM Skills/09-running-log/2026-04-07-partnership-GC케어-파트너십플랜.md` — Trigger 1 핵심 활용처

---

**"수동 반복 = 버그. 6대 트리거가 살아나면 cory는 진짜 CRM이 된다."**
— SAGE 슬기 → GRID 이음
