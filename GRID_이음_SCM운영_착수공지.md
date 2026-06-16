---
title: "GRID 이음 — SCM 운영 착수 공지"
date: 2026-04-08
type: briefing
agent: GRID 이음
from: SAGE 슬기
status: active
tags: [공지, SCM, 착수]
---

# GRID 이음 — SCM 운영 착수 공지

> **발신**: SAGE 슬기 (PM Skills, 2026-04-08)
> **수신**: GRID 이음
> **주제**: 알쓰패치 SCM 운영 공식 착수 및 PM Skills 6종 설치 안내

---

## 1. 배경

알쓰패치 누적 판매 112만개 돌파 + GC케어 등 메가 바이어 진입을 앞두고, **SCM 운영을 이음 전담**으로 공식화합니다.

기존 분산 관리(수동 엑셀 + 각자 처리)를 **단일 파이프라인(Supabase + Make.com 자동화 + cory 문서)**으로 통합합니다.

---

## 2. 이번 주 즉시 착수 사항

### (1) PM Skills 6종 설치 완료 ✅

`/Users/olive/Qsync/cory/.claude/skills/` 하위에 이미 설치했습니다.

| 스킬 | 우선 활용 |
|---|---|
| `automation-flow` | 안전재고 알림 자동화 |
| `gov-order` | B2G 출고 표준화 |
| `sql-queries` | Supabase 재고 쿼리 템플릿 |
| `dummy-dataset` | 재고 시뮬레이션 |
| `metrics-dashboard` | 재고 KPI 대시보드 |
| `create-prd` | Phase2 시스템 PRD |

이음이 직접 호출해서 쓸 수 있는 상태.

### (2) SCM 운영 매뉴얼 초안 제공

문서: `cory/SCM_운영_매뉴얼_GRID_이음.md`

**이음이 이번 주 해야 할 일**:
- [ ] 매뉴얼 정독
- [ ] Supabase 테이블 스키마 초안 검토 (`inventory_in`, `inventory_out`, `inventory_current` 뷰)
- [ ] SAGE에게 스키마 적용 전 승인 요청
- [ ] 안전재고 계산 로직 확정 (2주 평균 출고량 × 1.5 기본)
- [ ] `SCM_painpoint_log.md` 파일 생성 후 매일 1줄 기록 시작

---

## 3. 2주 운영 후 신규 스킬 개발 (B 단계)

**왜 지금 스킬을 먼저 안 만드는가**:
- 실제 Pain Point 없이 만든 스킬은 실사용 0% 될 위험
- 2주 운영으로 데이터(리드타임, MOQ, 결품 패턴 등) 축적 후 스킬화가 품질 높음
- 이음 페르소나 "수동 반복 = 버그" 원칙에 맞게, **진짜 반복 병목부터** 자동화

**Week 3 (4/22~) 일정**:
- 4/21 SAGE+이음 Week 2 리뷰 미팅
- Pain Point Top 3 선정
- 선정된 병목 기반으로 신규 스킬 1~3종 개발 (스코프는 리뷰 시 확정)

---

## 4. 이번 주 KPI

| 지표 | 목표 |
|---|---|
| 매뉴얼 정독 + 질문 회수 | 4/10까지 |
| Supabase 스키마 승인 | 4/11까지 |
| 실운영 시작 | 4/14부터 |
| Pain Point 로그 기록 | 매일 1줄 이상 |

---

## 5. 의사결정 권한

| 사안 | 권한 |
|---|---|
| 발주 10만개 미만 | **이음 단독** |
| 발주 10만개 이상 | **SAGE 승인 필요** |
| Supabase 스키마 변경 | **SAGE 승인 필요** |
| 불량률 2% 초과 | **즉시 SAGE 보고** |
| 결품 발생 | **24h 내 SAGE 보고 + 긴급 발주** |
| 신규 시스템 도입 | **SAGE 협의** (비용 영향도 반드시 첨부) |

---

## 6. 금지사항 (이음 페르소나)

- ❌ 테스트 없이 Supabase 스키마 프로덕션 적용
- ❌ 안전재고 알림 무시
- ❌ 수동 엑셀 작업을 2주 이상 반복
- ❌ 비용 영향도 없이 기술 도입 제안
- ❌ 재고 불일치 발견 시 SAGE 보고 누락

---

## 7. 질문·피드백 경로

- 즉시 응답 필요: SAGE 카톡
- 일반 질문: `cory/INBOX.md`에 이슈 등록
- 주간 리뷰: 매주 금요일 (첫 리뷰 4/10)

---

## 8. 참조 문서

- 매뉴얼: `cory/SCM_운영_매뉴얼_GRID_이음.md`
- 이음 프로필: `PM Skills/PROJECTS/aps-agents/grid-ieum.md`
- GC케어 파트너십: `PM Skills/09-running-log/2026-04-07-partnership-GC케어-파트너십플랜.md`
- 메가 바이어 전략: `PM Skills/09-running-log/2026-04-05-market-sizing-알쓰패치-메가바이어전략.md`

---

**"수동 반복 = 버그. 자동화할 수 있는 건 전부 자동화한다."**
— GRID 이음 페르소나
