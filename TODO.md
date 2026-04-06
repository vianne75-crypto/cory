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
