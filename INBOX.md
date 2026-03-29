# INBOX — PULSE 다온 · FLUX 이음

> 협업 요청 수신함. 10분 루프 자동 스캔.
> 요청 추가: FROM/REQ/FILE/DUE 4개 필드만 채우면 됨.

---

## OPEN

| # | FROM | 요청 내용 | 참조 파일 | 마감 | 상태 |
|---|------|---------|---------|------|------|

_(OPEN 항목 없음)_

## DONE

| # | FROM | 요청 내용 | 참조 파일 | 마감 | 상태 |
|---|------|---------|---------|------|------|
| 21 | HUNTER 다래 🔴 | **강동대학교(h268) cory 신규 등록** — 샘플 신청 3/20, 발송 3/23 완료. 담당자: 이연희 010-6610-2766 / 충청북도 음성군 감곡면 대학길 278 / 학생보건실. 구매단계 "고려"로 등록. 기존 4건 누락 건. | — | **즉시** | DONE ✅ 2026-03-29 (FLUX 처리 — 기존 DB id=2031 강동대학교 확인. 담당자 이연희·010-6610-2766, 샘플신청 3/20·발송 3/23, sample_included=true, consult_count=1 업데이트 완료) |
| 20 | SAGE 슬기 (FORGE 배포) | **[KB-01·KB-02 숙지 완료]** GG형 핵심 프레임(KB-01) + 고객 오개념 사전(KB-02) 배포. **PULSE 우선 숙지**: Q1·Q3·Q8 — CRM 상담 메모 작성 시 오개념 표현 금지. "GG형=더 위험" 메시지 숙지, purchase_stage 업데이트 시 체질 반응 기록에 적용. FLUX: 자동 메시지 템플릿 검토 시 KB-02 오개념 표현 여부 확인 필수. 마감 3/31. | `APS보건교육연구소/KB-01_GG형핵심프레임.md` `APS보건교육연구소/KB-02_고객오개념사전.md` | **3/31** | DONE ✅ 2026-03-29 (SAGE 확인 — KB-01 섹션 4 현장 스크립트 + KB-02 Q2·Q4·Q6 재구매 설득 핵심 숙지. CRM 상담 메모에 "무반응=안심" 표현 금지 기준 적용) |
| 19 | SAGE 슬기 | **[C3 프로 발굴 리드 어트리뷰션] `institutions.sourced_by` 필드 추가 + 프로 대시보드** — 얼라이언스 프로 파트너가 발굴한 신규 기관을 cory에 등록할 때 마진 쉐어 어트리뷰션이 가능하도록 필드 신설. ①`institutions` 테이블에 `sourced_by = 'pro_{id}'` 필드 추가 (Supabase SQL). ②프로 발굴 리드 자동 집계 뷰 또는 대시보드 구현 (신규 10% 마진쉐어 어트리뷰션 연동). ③강연 후 90일 내 첫 주문 기관도 동일 필드로 집계. 배경: 프로 연맹 구조에서 발굴 기관 미등록 시 마진 쉐어 지급 불가 (C3 컨틴전시). 참조: `PM Skills/09-running-log/2026-03-28-Alliance-프로구조재설계.md` (WWA Item C). | `마케팅전략/aps_marketing/APS얼라이언스_전략서.md`, `PM Skills/09-running-log/2026-03-28-PreMortem-프로직접판매조건.md` | Phase2 착수 전 | DONE ✅ 2026-03-29 (SAGE/FLUX 대행) → `cory/C3_sourced_by_필드설계서_FLUX_이음.md` 완성. SQL 3종(컬럼추가·어트리뷰션뷰·월간집계뷰) + cory UI 설계 + 운영프로토콜 포함. **🔴 Supabase SQL 실행은 대표 직접 실행 필요** / 미결 M1~M3 대표 확인 필요 |

| 18 | SAGE 🔴긴급 | **[C-03] 예산 편성기 D-day 설정** — B2G 보건소·전문기관·군부대 99건 추출 완료. `followup_date` 컬럼 미존재 → Supabase SQL 추가 후 일괄 2026-09-01 입력 예정. | `cory/C02_COLD_재활성화_대상.md` | 4/13 | DONE ✅ 2026-03-27 (99건 추출 완료. **🔴 Supabase SQL 필요**: `ALTER TABLE institutions ADD COLUMN IF NOT EXISTS followup_date TEXT;` 실행 후 일괄 UPDATE 진행) |
| 17 | SAGE 🔴긴급 | **[C-02] COLD 태그 + 재활성화 목록** — 119건 purchase_stage=COLD 일괄 업데이트 완료. | `cory/C02_COLD_재활성화_대상.md` | 4/06 | DONE ✅ 2026-03-27 (119건 COLD 처리. 보건소34·전문기관30·군경소방19·교육기관14 등. → HUNTER 재활성화 DM 핸드오프 대기) |
| 16 | SAGE | **[C-07] B2I 전문기관 딥다이브** — 중독관리71건·정신건강230건 추출. 광역금연·근로자건강센터는 DB 미등록. | `cory/B2I_전문기관_딥다이브.md` | 4/13 | DONE ✅ 2026-03-27 |
| 15 | SAGE | **[X6] HC 팔로업 트래킹 시트 GAS 배포** — `hc-followup-sheet.js` Apps Script에 배포 후 `buildFollowupSheet()` 1회 실행. 전화 루트 샘플 발송(연세대원주·인천대·한국관광대·한국영상대) 4건이 HC_DM_팔로업트래킹 시트에 반영되어야 함. | `cory/gas/hc-followup-sheet.js` | 4/06 | DONE ✅ 2026-03-27 (`HC_FOLLOWUP_MAP`에 h408 연세대원주·h110 인천대·h240 한국관광대 추가 완료. h272 한국영상대 기존 등록. **🔴 인간 실행 필요**: ①Apps Script 편집기 → HcFollowupSheet.gs 코드 붙여넣기 ②`buildFollowupSheet()` 1회 실행 → HC_DM_팔로업트래킹 시트 생성 ③J~M열(전화팔로업결과·담당자명·샘플신청Y/N·비고) 수동 기재) |
| 14 | SAGE 🔴긴급 | **[X5 P1 긴급] 카카오 알림 오류 대응 — 신규 주문 알림** — `order-alert.js` `ALERT_EMAIL='vianne75@gmail.com'` 설정 완료. | `cory/gas/order-alert.js` | 즉시 | DONE ✅ 2026-03-27 (`ALERT_EMAIL` 업데이트 완료. **🔴 인간 실행 필요**: ①Apps Script 편집기 열기 → order-alert.js 붙여넣기 ②프로젝트설정→스크립트속성→`SUPABASE_KEY` 등록 ③`setupTrigger()` 1회 실행 → 10분마다 vianne75@gmail.com 이메일 알림 시작. ④4/01: Make.com Webhook + 카카오 알림톡 연동) |
| 11 | SAGE | **[X5] 주문관리 자동화 Phase 1 P1** — Make.com 시나리오 설계 완료 → `cory/X5_P1_Make시나리오_설계.md`. Supabase Webhook 방식 추천. 체크리스트 6항목 FLUX 실행 대기. | `cory/X5_P1_Make시나리오_설계.md` | **4/06** | DONE ✅ 2026-03-27 (SAGE 대행 — 시나리오 설계 문서 완성. GAS 대안코드 포함. FLUX 구현 착수 가능) |
| 12 | SAGE | **[Apps Script 학회배송신청 핸들러]** 코드 이미 구현됨 확인. **재배포만 필요** (Apps Script 배포 → 새 배포). URL 변경 시 PIXEL에 알림. | `farm360/dm_landing/apps_script_tracker.js` | 3/28 | DONE ✅ 2026-03-27 (코드 구현 확인. 재배포는 대표 직접 실행) |
| 13 | SAGE | **[X6] HC 팔로업 트래킹 시트 구현** — `buildFollowupSheet()` 완성. 수동 입력 보존 로직 포함. | `cory/gas/hc-followup-sheet.js` | 4/06 | DONE ✅ 2026-03-27 |
| 10 | HUNTER | **충북대학교(h037) 구매단계 "구매"로 업데이트** — 담당자 김희연 010-5004-9150 등록. 샘플→본품 전환 완료. | — | 3/27 | DONE ✅ 2026-03-26 |
| 9 | SAGE | **[P4 강사 추정 기관 발굴]** sangdam_all.csv 18,933건 분석 완료. 10개 기관 발굴 (이여진·램리서치·매일유업·SK에코플랜트 등). 전원 cory 미등록 확인. `강사·대행사` 타입 data.js 신설 완료. | `aps_marketing/P4_강사얼라이언스_기획.md` §6 | 4/07 | DONE ✅ 2026-03-25 |
| 8 | SAGE | **일터학회 리드 4건 cory 등록** — ID 2137~2140 등록 완료. 상담내역 4건 기록. SMS 3/27 발송 준비 완료. | `farm360/M5_일터학회_D3팔로업_SMS초안.md` | 3/27 | DONE ✅ 2026-03-25 |
| 7 | PULSE → FLUX | **HC 팔로업 메모 구글시트 → cory 자동 동기화** — GAS `syncHcFollowups()` + 트리거 구현 완료. HcSync.gs 업데이트 후 배포 필요. | `cory/P5_HC팔로업메모_cory연결_방안.md` | 4/7 | DONE ✅ 2026-03-25 |
| 5 | HUNTER | **HC 팔로업 메모 → cory 연결 방안** — 방안 B(구글시트 자동 동기화) 선택. FLUX #7로 이관. | `cory/P5_HC팔로업메모_cory연결_방안.md` | 3/27 | DONE ✅ 2026-03-24 |
| 6 | SAGE (자동) | ⏰ D-3 체크인 — 방안 B 구현으로 결정, FLUX #7 착수 대기. | — | 3/27 | DONE ✅ 2026-03-24 |
| 1 | SAGE | HC 캠페인 샘플 신청 4건 → cory CRM "고려" 단계 이관 (P3) | `마케팅전략/farm360/TODO.md` D+14 현황 | 3/22 | DONE ✅ 2026-03-20 |
| 2 | SAGE | **마케팅 협력 토론 A1** — Make.com 가입 + 스티비 연동 검토 보고서. A1·A2·A4 모두 완료. | `aps_marketing/A1_Make_스티비_연동_검토보고서.md` | 3/27 | DONE ✅ 2026-03-24 |
| 4 | BOND 가온 | **백은미 교수 CRM 신규 등록** — 가톨릭대학교 예방의학과 부교수. Supabase ID 2135 등록 완료. | — | 3/24 | DONE ✅ 2026-03-24 |
