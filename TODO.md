# TODO — cory (PULSE 다온 · FLUX 이음)

> 10분마다 자동 확인. 완료 시 [x] 체크, 신규 과제 하단에 추가.

---

## 🔴 즉시 (긴급)

- [x] X3 주문 동기화 버그 수정 — reg_time 1970년 파싱 오류 + 중복 행 삽입 (FLUX) ✅ 2026-03-20
  - reg_time: YYYYMMDD/Unix/문자열 모두 처리 (stage7에서 완료)
  - 중복 행: goodsInfo를 기존 goods_name 기준으로 필터링 (stage8 수정)
  - ⚠️ Cloudflare Workers 배포 필요: cloudflare-worker.js → wrangler deploy

## 🔴 마케팅 협력 토론 A-task (마감: 3/27)

- [x] A1 Make.com 가입 + 스티비 연동 검토 보고서 — F1 자동화 노코드 허브 구축 가능성 확인 (FLUX) ✅ 2026-03-24 → `aps_marketing/A1_Make_스티비_연동_검토보고서.md`
- [x] A2 cory 대시보드 "이번 달 접촉 필요 기관" 뷰 추가 — 마지막 접촉일 기준 자동 정렬 (FLUX) ✅ 2026-03-23
- [x] A4 윙백서클 ① D+4 해피콜 Apps Script 내부 알림 초안 — 구글시트 트리거 기반 (FLUX) ✅ 2026-03-23

## 🟡 단기 (이번 주)

- [x] **ICP v3.1 3트랙 필드 구현** (FLUX+PULSE) ✅ 2026-06-09 → `data/add-icp-track-field.sql`
  - track 필드(1A·1B·1C·mega·b2b·other) + CHECK + 인덱스 + 자동분류 UPDATE
  - 보건소 241개 자동분류: 1A 72·1B 86·1C 83 (other 0)
  - 대시보드 트랙 필터 + 1A/1B/1C 배지 + 신규등록 classifyTrack() 자동
  - 🔴 **대표 실행 필요**: `data/add-icp-track-field.sql` Supabase SQL Editor에서 실행

- [x] P3a HC 샘플 신청 4건 → cory CRM "고려" 이관 ✅ 2026-03-20
  - ⚠️ 팔로업 D-day: 부산보건대·충북대·한국외대 (3/20), 한국영상대 (3/27)
- [x] P3b 신규 주문 3건 기관 매칭 + 입금 확인 팔로업 (PULSE) ✅ 2026-03-25
  - 춘천시보건소(895)·정선군보건소(1013)·성동구교육센터(2134) 모두 구매 단계 정상 배치
  - ⚠️ X3 중복 행 이슈: 137535(~30개)·137555(8개) 중복, 춘천시 purchase_amount 중복 집계 → FLUX X3
- [x] P4 기관 검색 기능 요건 정의 (PULSE) ✅ 2026-03-25 → `P4_기관검색_요건정의서.md`
- [ ] X1 HC 동기화 안정 운영 모니터링 (FLUX)

## 🔁 매일 (상시 과제)

- [ ] **M1 기관명 매칭 개선** — 매일 미매칭 건 확인 → 줄임말 사전 추가 · 매칭 로직 보완 (FLUX)
  - 줄임말 사전: `scripts/rematch-consultations.js` ABBREVIATIONS
  - 주문 매칭: `gas/order-worker.js` 3-tier 로직
  - 상담 매칭: `scripts/rematch-consultations.js` inferBogunso + 공백제거
  - **매일 체크**: 미매칭 상담 건수 확인 → 패턴 발견 시 사전 추가 → 재매칭 실행

## 🟡 단기 (4월)

- [ ] **P0-3 스타터패키지·얼라이언스 CRM 통합** (PULSE+FLUX, 마감 4/16 → 진행 중)
  - [x] SQL 7개 필드 실행 완료 ✅ 2026-04-17 (대표 직접)
  - [x] 기관 수정 모달 — 얼라이언스 필드 UI 추가 ✅ 2026-04-17
  - [x] 기관 상담 모달 — alliance_tier 배지 + F1/마스터/프로그램북 태그 ✅ 2026-04-17
  - [x] 기관 목록 테이블 — alliance_tier 배지 ✅ 2026-04-17
  - [ ] 기존 구매 기관 alliance_tier 1차 분류 (SAGE 보고 후 일괄 UPDATE)
  - [x] F1 출시 직후 자동 매칭 시나리오 검증 ✅ 2026-04-17 — acceptOrderMatch + syncOrders에 F1 감지 로직 추가
- [ ] **L8 F1 출시 안내 — 방식 전환: 카카오 알림톡 + 공지 페이지** (마감 4/19, FLUX)
  - [x] GAS 이메일 스크립트 완성 ✅ 2026-04-17 → `gas/f1-launch-mailer.gs`
  - [x] 이메일 보유 현황 확인 ✅ 2026-04-17 — **0건** → 이메일 방식 포기
  - [x] 전환 전략: 비즈뿌리오 카카오 알림톡 + 공지 페이지(wcolive+aps7) 링크 ✅ 2026-04-17
  - [x] 3가지 소식 통합 메시지 구조 확정 ✅ 2026-04-17 (알쓰패치 통합전략·포장 리뉴얼·노담 세계금연의날 이벤트)
  - [x] MUSE 핸드오프(farm360 INBOX #43) ✅ 2026-04-17 — 알림톡 카피 정제 요청
  - [x] PIXEL 핸드오프(웹운영 INBOX) ✅ 2026-04-17 — wcolive+aps7 공지 페이지 제작 요청
  - [ ] 🔴 MUSE 카피 정제 수신 + PIXEL 공지 URL 수신 (~4/19)
  - [ ] 🔴 비즈뿌리오 템플릿 등록·심사 요청 (카카오 알림톡 심사 1~3일)
  - [ ] 🔴 **발송 대상 필터링** — 최근 노담패치 구매 이력 있는 기관 제외 (SAGE INBOX #43 지시)
  - [ ] 🔴 비즈뿌리오 업로드 CSV 생성 — `f1ExportPpurioCSV()` 실행 후 편집
  - [ ] 🔴 4/20 오전 비즈뿌리오 일괄 발송
- [ ] **X5 주문관리 시스템 자동화** — 전사 중요 과제 (대표 지시 2026-03-27, FLUX 이음 주관)
  - ✅ 스펙 확정 2026-03-27 → `경영지원(슬기)/S7_주문관리자동화_스펙기획.md`
  - ~~Phase 1 P1 신규 주문 알림~~ → 불필요 (애니빌드 기존 알림으로 충분, 대표 확인 2026-03-30)
  - **Phase 2 (4/20)**:
    - [x] P2 CRM 자동 매칭 ✅ 2026-04-06 — syncOrders()에 smartMatchOrder 엔진 연결 (score≥0.7 자동, 폴백 이름매칭)
    - [x] P3 입금 확인 UI ✅ 2026-04-06 — 미수금 필터 카드 + 입금확인 버튼 + payment_confirmed/payment_date 필드
    - 🔴 **대표 실행 필요**: `data/add-payment-fields.sql` Supabase SQL Editor에서 실행
  - P4 run_workflow.py 비대화식 개선 (후순위)
  - INBOX #11 착수 요청 등록 완료

## 🟢 대기 (선행 완료 후)

- [x] X2 교육 도입 수준 필드 DB 반영 (FLUX) ✅ 2026-03-25 — admin에 "교육도입 초기배치" 버튼 추가, runEduAdoptionBatch() 구현
- [x] X4 기관 검색 기능 구현 (FLUX) ✅ 2026-03-25 — G1 주문번호 역추적 + G2 #태그 검색

## 세금계산서 발행 연동 (다음 할일, 2026-07-01 대표)
- [ ] cory 주문 [발행] 버튼 → 실제 팝빌 발행 API 연동 (현재는 invoice_issued 표시만, 실발행 안 됨)
  - 팝빌 issue_invoices_asp.py 완성 후 admin-orders.js confirmInvoice/toggleInvoice에서 호출
  - 안전장치: 발행 전 확인 다이얼로그 + 발행 실패 시 표시 롤백
