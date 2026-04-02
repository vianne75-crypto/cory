# INBOX — PULSE 다온 · FLUX 이음

> 협업 요청 수신함. 10분 루프 자동 스캔.
> 요청 추가: FROM/REQ/FILE/DUE 4개 필드만 채우면 됨.

---

## OPEN

| # | FROM | 요청 내용 | 참조 파일 | 마감 | 상태 |
|---|------|---------|---------|------|------|
| 34 | 대표 🔴 | **[대기업 미등록 6사 즉시 cory 등록]** | `경영지원(슬기)/대기업_레퍼런스_마케팅활용_지시.md` | **4/02** | DONE ✅ 2026-03-31 (PULSE 처리 — 현대모비스 id=2141·현대자동차 id=2142·기아자동차 id=2143·BGF리테일 id=2144·CJ대한통운 id=2145·호텔롯데 id=2146 등록 완료. type=산업보건, sourced_by=order_discovery. 상담 재매칭 실행 완료) |
| 32 | 대표 | **[cory 데이터 품질 개선 — P0 즉시 실행 4건]** | `cory/CORY_데이터품질_개선안.md` | **D6: 4/14** | DONE(D1~D5) ✅ 2026-03-31 — D1) COLD 119건 DB 정상 확인 ✅ D2) institutions_list.txt 재엑스포트(1221건, COLD+금액+일자 포함) ✅ D3) calcRepurchaseRate() COLD 이미 제외 확인 ✅ D4) referral_confirmed SQL 작성(`data/add-referral-confirmed.sql`) ✅ D5) 추천 12개 검증 → 대표 확인 추천 사례 없음, #33으로 프로토콜 재설계 전환 ✅ / D6) 기관 중복 후보 추출 **4/14 대기** |
| 37 | SAGE 슬기 (전사 공지) | **[W-MAIN 2단계 분리 + 전략 수정 — 즉시 숙지]** Phase A(6섹션 HTML) 4/06 · Phase B(Framer) 6월 연기. 카피 v2 확정. 대기업 16곳 레퍼런스 전사 활용. **PULSE·FLUX 영향**: cory 데이터 품질 개선(#32) 계속. 대기업 6사 등록(#34) 완료 확인. 상세: `경영지원(슬기)/전사공지_W-MAIN_2단계분리_20260401.md` | `경영지원(슬기)/전사공지_W-MAIN_2단계분리_20260401.md` | **즉시** | OPEN |
| 36 | HUNTER 다래 (MUSE 대행) | **[W-MAIN v2 확정 — 수치 참고]** 2026-03-31 대표 확정. cory 관련 수치: 보건소 104개 도입·재구매율 66%·누적 120만매·대기업 10개+. 이 수치가 랜딩페이지에 노출되므로 cory DB 수치와 정합성 유지 필요. 수치 변경 시 MUSE에게 알림 요청. | `farm360/W-MAIN_카피프레임_v2.md` | 참고 | OPEN |
| 35 | HUNTER 다래 | **[HC 전화 팔로업 기관 6건 — 후속 팔로업 이관]** 아래 상세 참조. 전화 접촉+샘플 발송 완료 기관 후속 관리 요청. 기관별 온도·참고 사항 포함. | `farm360/TODO.md` HC 팔로업 섹션, `farm360/HC_전화팔로업_우선순위리스트.md`, `farm360/HC_전화팔로업_이메일템플릿_MUSE.md` | **4/06** |
| 33 | PULSE 다온 → SAGE 슬기 | **[추천 액션 프로토콜 설계 요청]** 대표 확인: 현재 추천 단계 기관 중 실제 추천 사례 없음. **대표 방향**: CRM 추천 단계에 추천 액션을 정의하고, wcolive/aps7 회원가입 시 **추천인 기재 필드**를 활용하여 추천 전환을 추적하려 함. **SAGE 설계 요청**: ①추천 액션 정의 — 어떤 행동이 "추천"인가? (타 기관 소개 / 회원가입 추천인 기재 / SNS 공유 등) ②회원가입 추천인 필드 → cory 연동 방안 — wcolive/aps7 회원 데이터에서 추천인이 기재된 경우 추천 기관 자동 매칭 ③`referral_confirmed` 필드 활용 — 추천 행동 확인 시만 purchase_stage='추천' 전환 ④BOND 역할 — 추천 행동 확인 프로세스 (상담 메모 기록 기준). 배경: 현재 추천 단계 12개 기관은 근거 없는 배치 상태. | — | **4/14** | OPEN |
| 31 | SAGE 슬기 (대표 지시) | **[횡성군·광진구 추천 단계 재검증 + referral_confirmed 필드 검토]** | `마케팅전략/aps_marketing/보건소_지역전파모델_인사이트.md` | **4/07** | DONE ✅ 2026-03-31 (대표 확인: 추천 사례 기억에 없음. 추천 단계 재분류는 보류. 대신 추천 액션 프로토콜 신규 설계 방향으로 전환 → #33 등록) |
| 30 | PULSE 다온 → SAGE 슬기 | **[신규 유입 기관 자동 감지 워크플로 검토 요청]** ✅ **SAGE 회신 2026-04-01**: **M1) 전체 자동 등록 승인** — 상담이 발생한 기관은 세그먼트 무관하게 모두 등록. 이유: 상담 발생 = 이미 관심 표현한 기관, 누락은 여정 추적 손실. **M2) 기관명 suffix 기반(현행) 충분** — 추가로 상담 태그 기반 purchase_stage 자동 추정 적용 ([문의]=관심, [견적·샘플]=고려, [수주]=구매). suffix 분류 불가 시 type='미분류' 태깅 후 PULSE 수동 확인. **M3) wcolive 교차 확인 보류** — API 키 발급 없이 `needs_wcolive_check=true` 플래그 추가, 월 1회 PULSE가 수동 대조. 1인 운영 제약상 API 연동은 Q3 이후 검토. **PULSE 착수 요청**: ①rematch-consultations.js에 미등록 기관 자동 등록 로직 추가 ②sourced_by='consult_discovery' 태깅 ③신규 등록 시 PULSE 알림 (console.log 또는 구글시트 로그). | `scripts/rematch-consultations.js` | **4/07** | DONE ✅ 2026-04-01 (SAGE 회신 완료 — PULSE 착수 대기) |
| 29 | SAGE 슬기 | **[L8 / F1 출시 안내 일괄 발송 세팅]** 4/20 Launch Day 오전 발송. cory purchase_stage = 구매·만족·추천 152개소 대상. MUSE 카피(L3) + 견적서 PDF 첨부. 방법: Make.com 시나리오(X5 P2) 또는 GAS 이메일 일괄 발송 또는 수동 카카오(최후 대안). 열람 추적 가능하면 D+3 미열람 기관 리스트 BOND 전달. | `PM Skills/09-running-log/2026-03-30-gtm-F1Standard정식출시.md` 섹션 3-B | **4/19** | OPEN |

## DONE

| # | FROM | 요청 내용 | 참조 파일 | 마감 | 상태 |
|---|------|---------|---------|------|------|
| 29 | HUNTER 다래 | **[Apps Script 코드 분리 — FLUX 검토 완료]** 5개 파일 전수 검토 결과: ✅ 이상 없음. **검토 결과**: ①함수명 충돌 없음 — 각 파일 함수명 완전 분리(doGet/doPost·syncSampleToCory_ in Tracker / updateShipment·jsonResponse·escHtml in Shipment / generateLabels·setupSheets in Labels / buildSampleFormHtml·buildHakhoiFormHtml·buildSuccessHtml in HtmlTemplates) ②SYNC_WORKER_URL — Config.gs.js에 미선언이지만 HcSync.gs(기존 파일)와 동일 프로젝트 전역 공유, **충돌 없음** ③GAS 프로젝트 내 모든 .gs 파일 전역 스코프 공유 → 배포 시 HcSync.gs 함께 포함하면 정상 동작. **🔴 대표님 배포 가이드**: ①Apps Script 편집기 열기(기존 `apps_script_tracker.js` 프로젝트) ②파일 5개 신규 추가(Config·Tracker·Shipment·Labels·HtmlTemplates) ③기존 `apps_script_tracker.js` 파일 삭제(중복 함수 방지) ④HcSync.gs 유지 확인 ⑤배포 → 새 배포 → 웹 앱으로 배포(기존 URL 유지). | `farm360/dm_landing/gas/` 전체 | **4/06** | DONE ✅ 2026-03-30 (FLUX 처리 — 5파일 구조 이상 없음 확인. 대표 Apps Script 배포 필요) |
| 26 | SAGE 슬기 | **[P0-1] cory 재구매 플래그 DB 스키마 구축** ✅ **SQL 스크립트 완성 2026-03-30** → `cory/P01_재구매플래그_DB스키마_FLUX.sql`. STEP1 ALTER TABLE 3필드 추가 + STEP3 cohort_repurchase_rate 뷰 + STEP4 kr1_repurchase_summary 뷰(KR1 목표 35% 포함) + 실행 후 확인 쿼리 + 수동 입력 가이드 포함. **🔴 대표 직접 실행**: Supabase → SQL Editor → SQL 파일 실행. | `cory/P01_재구매플래그_DB스키마_FLUX.sql` | **4/14** | DONE ✅ 2026-03-30 (FLUX 처리 — SQL 스크립트 완성. 대표 Supabase 실행 대기) |
| 28 | SAGE 슬기 🔴 | **[OKR KR1 기준 변경 공지] 재구매율 공식 방안A 확정 + KR1 목표 35% 상향** | `PM Skills/09-running-log/2026-03-30-세그먼트-구매자명칭기준.md` | **즉시** | DONE ✅ 2026-03-30 (PULSE·FLUX 숙지 완료 — ①재구매율 = 재구매자(만족+추천) ÷ 구매자 × 100 방안A 확정 ②KR1 목표 25% → **35%** 상향 ③세그먼트·구매자 명칭 기준서 참조: `2026-03-30-세그먼트-구매자명칭기준.md`. cory 상담 메모·purchase_stage 업데이트 시 기준 적용) |
| 25 | SAGE 슬기 | **[F1 시범기관 / 사업장 후보 확인]** cory에서 purchase_stage=구매이상 + type=사업장 기관 목록 리스트업 요청. F1 교육 키트 시범 기관 3번째(사업장 세그먼트) 후보 선정용. | `cory/F1_시범기관_사업장후보_FLUX.md` | **4/08** | DONE ✅ 2026-03-30 (FLUX 처리 — cory 사업장 type 10개 전수 조회. **결과: purchase_stage 입력 기관 0개** — 전부 미상. 잠재 후보 3순위: ①GC녹십자(id:144) ②한화큐셀 충북 2곳(id:211·212, 충북대 김희연 연계 가능) ③서울교통공사(id:133). 상세: `cory/F1_시범기관_사업장후보_FLUX.md`. SAGE 보고: F1 즉시 시범 가능 기관 없음. HUNTER 충북대 팔로업 통해 한화큐셀 충북 접근 권장) |
| 24 | SAGE 슬기 (Phase 0) | **[P0-B] E13 발송 기관 추적 시트 준비** ✅ **SAGE 완료 2026-03-30** → `cory/P0B_E13발송추적_준비_SAGE.md`. 구글 시트 스키마(10컬럼)·조건부 서식·파일럿 Tier1 5개 기관·운영 프로토콜·KR 연결 완성. **🔴 대표 직접 실행**: 구글 시트 생성 + 컬럼 입력 + cory_id 확인 (체크리스트 5항목). E13 출시 즉시 운영 가능 상태. | `cory/P0B_E13발송추적_준비_SAGE.md` | **4/07** | DONE ✅ 2026-03-30 |
| 23 | SAGE 슬기 | **[Phase 0 / P0-C] 기관 세그먼트 "전문센터" 분류 추가** — 암센터·중독관리통합지원센터·정신건강복지센터·근로자건강센터·금연지원센터·한국건강증진개발원 키워드 기반 `전문센터` 세그먼트 신설. reclassify.py 또는 data.js 분류 룰 업데이트 후 기존 838개 기관 소급 적용. 대시보드 필터에 세그먼트 항목(전문센터/보건소/학교/사업장/기타) 추가. | `PM Skills/09-running-log/2026-03-30-sprint-알쓰패치-Phase0인프라.md` P0-C 섹션 | **4/14** | DONE ✅ 2026-03-30 (FLUX 처리 — data.js `EXPERT_CENTER_KEYWORDS`+`getSegment()` 추가. index.html 세그먼트 필터 그룹(전문센터/보건소/학교/사업장/군경/기타) 추가. filters.js `applyFilters()` 세그먼트 필터 적용. app.js DOMContentLoaded 세그먼트 자동 설정 추가. 838개 기관 소급 적용 완료) |
| 22 | SAGE 슬기 | **[Phase 0 / P0-A] cory 대시보드 재구매율 지표 카드 추가** — 만족+추천/전체구매(만족+추천+구매) % 계산. 상단 KPI 카드 영역에 재구매율 % + 목표(25%) 대비 게이지 표시. 클릭 시 만족·추천 기관 목록 필터링. 구현 위치: charts.js 또는 app.js `calcRepurchaseRate()` 함수 추가. | `PM Skills/09-running-log/2026-03-30-sprint-알쓰패치-Phase0인프라.md` P0-A 섹션 | **4/13** | DONE ✅ 2026-03-30 (FLUX 처리 — app.js `calcRepurchaseRate()` 신규 추가, `updateSummaryCards()` 재구매율 DOM 업데이트, `bindRepurchaseCard()` 클릭 필터링 추가. index.html 재구매율 카드+게이지 바 추가. 실제 DB 기준: 재구매율 25.0% = 38/152) |
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

---

### #35 상세 — HC 전화 팔로업 기관 6건 후속 이관

> FROM: HUNTER 다래 | 마감: 4/06 (D+30)
> 전화 접촉 + 샘플 발송 완료 기관. 후속 팔로업으로 **샘플 활용 확인 + 본품 전환 유도** 요청.
> 이메일 템플릿: `farm360/HC_전화팔로업_이메일템플릿_MUSE.md` (Case A/B/C)

#### 🟢 신규 팔로업 대상 (3건 — 전화 접촉 후 샘플 발송, 추가 반응 없음)

| UTM | 학교 | 담당자 | 연락처 | 샘플발송일 | 경과 | 참고 사항 | 권장 액션 |
|-----|------|--------|--------|----------|------|----------|----------|
| h408 | **연세대 미래캠(원주)** | 김다래 | 033-760-2641 / 010-8625-3208 | 3/19 | D+12 | 건강관리센터 학생회관 2층 212호. 전화에서 긍정 반응 후 샘플 요청 | 샘플 체험 여부 확인 → 관심 시 본품 안내 |
| h110 | **인천대(송도)** | 김민영 | 032-835-9266 / 010-4338-9448 | 3/19 | D+12 | 보건진료소 17호관 104호. **교육자료를 먼저 요청** → 이메일 발송 완료 | 교육자료 활용 여부 확인 → 샘플 체험 유도 |
| h240 | **한국관광대** | 권혜정 | 031-644-1161 / 010-7232-0460 | 3/19 | D+12 | 강의동 1층 보건실. 전화에서 긍정 반응 | 샘플 체험 여부 확인 → 관심 시 본품 안내 |

#### 🟡 기존 등록 기관 — 팔로업 참고 정보 업데이트 (3건)

| UTM | 학교 | 담당자 | 온도 | 참고 사항 | 권장 액션 |
|-----|------|--------|------|----------|----------|
| h051 | **부산보건대** | 이화진 | **Warm** | 샘플 수령했으나 **미사용**. 올해 캠페인 계획 미수립 | ⏸ **9월 예산 편성기 재접촉** 예약. 현재는 대기 |
| h417 | **한국외대(글로벌)** | 정미애 | **Cold** | 절주교육 필요성 인식 없음. 단, **본인·딸이 아시안플러시 → 개인 관심** | SMS 채널만 유지. 강제 전환 시도 금지 |
| h272 | **한국영상대** | 안아름 | — | 샘플 신청 3/19, 발송 3/27 완료 | 도착 확인 + 체험 여부 확인 |

#### PULSE 액션 요약

1. 🟢 신규 3건 → **4/06 전 전화 팔로업** (샘플 활용 확인 + 본품 전환)
2. 부산보건대 → **followup_date = 2026-09-01** 예약
3. 한국외대 → Cold 유지, SMS만
4. 한국영상대 → 도착 확인 전화
