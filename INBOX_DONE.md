# INBOX DONE — PULSE·FLUX

> 완료된 과제 아카이브. INBOX.md 토큰 절감 목적으로 분리 (2026-04-24).

---

## DONE

| # | FROM | 요청 내용 | 참조 파일 | 마감 | 상태 |
|---|------|---------|---------|------|------|
| alth리드폼-엔드포인트 | PIXEL 🟡 (7/6·감사 M5) | **[/alth-lead 엔드포인트+alth_leads 테이블]** | `cory/workers/aps-lead-worker.js` `cory/data/alth-leads-schema.sql` | 금주 | DONE ✅ 2026-07-07 (FLUX — `POST /alth-lead`(track public/workplace·필수/길이검증·전화정규화·**IP 10분 스로틀+전화 10분 idempotent·fail-open**·기관자동매칭) + alth_leads 테이블(RLS/GRANT 2026-10-30 정합·전화 평문=연락동의 기반). 적대적검증 16확정 반영(남용방지·fail-open·likeSafe). 배포 v9c360bfb·스모크 5/5 통과. ⚠️**프론트 갭**: gov/biz에 `<form id=leadForm>` 마크업 없음→fetch 미발사=웹운영 회신) |
| kiss진단-q2etc컬럼 | PIXEL 🟢 (7/7) | **[kiss_diagnosis q2_channels_etc 컬럼]** | `cory/workers/aps-lead-worker.js` `cory/data/kiss-diagnosis-q2etc-migration.sql` | 금주 | DONE ✅ 2026-07-07 (FLUX — ALTER ADD q2_channels_etc VARCHAR(100)·Worker kissDiagnosis 저장+빈응답가드 포함·관리자 진단뷰 렌더·조인뷰 반영. 배포·스모크 통과) |
| KISS카운터-일별한정재구조 | SAGE 🔴 (대표 B안) | **[KISS 카운터 일별 재구조]** | `cory/workers/aps-lead-worker.js` `cory/KISS_실행가이드_대표용_20260705.md` | 학회 전 | DONE ✅ 2026-07-05 (FLUX — getCounterState 일별모델 재작성: 캡100·매일 KST리셋·일별시딩(7/9=55·7/10=58)·마감임박 상태(open/low≤20/ending≤5/closed)·is_last_day. `GET /kiss-counter`={date,cap,taken,remaining,status,is_last_day}. settings.kiss_counter 시딩 SQL 대표 실행 확인. PIXEL 프론트 렌더 전환 = 웹운영 INBOX 발주) |
| KISS-민감정보-비식별저장 | PIXEL 🔴 (BOND §23) | **[KISS 민감정보 처리]** | `cory/KISS_실행가이드_대표용_20260705.md` `cory/data/kiss-privacy-hardening.sql` | 7/6 전 | DONE ✅ 2026-07-05 (FLUX — **대표 결정: 민감정보 비수집**. Worker가 quiz_answer 미저장 → 파이프라인 민감정보 0건 → §23 비수집 충족. + ref_key 해시(전화 원본 미저장)·sensitive_agreed 컬럼·salt fail-closed. BOND 비수집 통보=얼라이언스CS INBOX / PIXEL 동의UI 제거=웹운영 INBOX) |
| KISS-리드테이블신설-통지 | PIXEL 🟢 | **[KISS 리드 테이블 인지·연계]** | `cory/js/admin/admin-kiss.js` `cory/data/kiss-flywheel-schema.sql` | 인지 | DONE ✅ 2026-07-05 (FLUX — cory 대시보드 KISS 리드 탭 신설(신청+진단 뷰·기관매칭·처리토글). kiss_flywheel PIXEL 테이블에 ref_key 정합 + `/kiss-flywheel` 엔드포인트 E2E. 38에이전트 적대적 검증 후 하드닝. 카운터 count는 뷰 기반) |
| P0-2-재구매데이터 | SAGE 🔴 | **[재구매 데이터 백필 → KR1 측정 가동]** | `cory/P02_재구매데이터_채우기_FLUX.md` `cory/scripts/p02-backfill-purchase-data.py` | KR1 측정 | DONE ✅ 2026-06-25 (FLUX — Order.xls(wcolive 원본·사용처명 매칭 115건) + cory orders(157) 통합 집계 → 119개 기관 first/last_purchase_date·purchase_count 백필. **KR1 재구매율 26.1%**(재구매 31·구매자 119·목표 35%). 도입연도 2022~2026 분포→도입지도 정확도↑. 미매칭 187건은 추후 줄임말 사전 보강) |
| FAB-v2.7 / 팔안쪽 표준 | SAGE 슬기 ⭐⭐ | **[FAB v2.7 + "팔 안쪽" 메시지 표준 cory 적용]** | `cory/CRM_메시지_표준_FAB_v2.7_팔안쪽.md` | ⭐ 즉시 | DONE ✅ 2026-06-09 (FLUX — cory 발신 코드·GAS·HTML·webhook 전수 점검: 금지표현(손등·팔뚝·상박) **0건**, 구버전 FAB 정량 클레임 **0건**, webhook은 JSON 응답으로 카피 없음 → **정정 대상 없음**. winback·order-alert는 내부 알림(FAB 불필요). f1-launch-mailer는 F1키트 전용·발송 완료. 향후 신규/개정 메시지 준수용 표준 문서 신설(FAB v2.7 full+단축형, 팔안쪽 톤, 절주/금연 분담). 메시지 개정 시 적용) |
| ICP-v3.1-3트랙공지 | SAGE 슬기 ⭐⭐ | **[ICP v3.1 3트랙 cory 반영]** FLUX+PULSE 공동. | `마케팅전략/aps_marketing/ICP_v3.1_3트랙_B2G.md` · `cory/data/add-icp-track-field.sql` | ⭐ 즉시 | DONE ✅ 2026-06-09 (FLUX+PULSE — ①track 필드 SQL 마이그레이션 `data/add-icp-track-field.sql` (VARCHAR+CHECK 1A·1B·1C·mega·b2b·other + 인덱스 + 자동분류 UPDATE) ②보건소 241개 자동분류 검증 **1A 72·1B 86·1C 83** (other 0·울주군 등 광역시 군→1C 정확) ③대시보드 트랙 필터+배지 ④신규 등록 classifyTrack() 자동. 🔴 **대표 SQL 실행 필요** → Supabase SQL Editor. 트랙별 재구매·이탈 분석은 실행 후 가능) |
| 34 | 대표 🔴 | **[대기업 미등록 6사 즉시 cory 등록]** | `경영지원(슬기)/대기업_레퍼런스_마케팅활용_지시.md` | **4/02** | DONE ✅ 2026-03-31 (PULSE 처리 — 현대모비스 id=2141·현대자동차 id=2142·기아자동차 id=2143·BGF리테일 id=2144·CJ대한통운 id=2145·호텔롯데 id=2146 등록 완료. type=산업보건, sourced_by=order_discovery. 상담 재매칭 실행 완료) |
| 32 | 대표 | **[cory 데이터 품질 개선 — P0 즉시 실행 4건]** | `cory/CORY_데이터품질_개선안.md` | **D6: 4/14** | DONE ✅ 2026-04-08 — D1~D5 완료 / D6) 중복 후보 추출+병합 5건 완료: ①창원중독 870←984 (3,370만/41상담) ②용산구보건소 1020←1036 (446만/42상담) ③대구동구중독 1003←1094 ④동국사대부속고 969←1022 ⑤국군강릉병원 976←1004 (region 정정+병합, 150만/60상담). 1,240→1,235개 기관 |
| 37 | SAGE 슬기 (전사 공지) | **[W-MAIN 2단계 분리 + 전략 수정 — 즉시 숙지]** Phase A(6섹션 HTML) 4/06 · Phase B(Framer) 6월 연기. 카피 v2 확정. 대기업 16곳 레퍼런스 전사 활용. **PULSE·FLUX 영향**: cory 데이터 품질 개선(#32) 계속. 대기업 6사 등록(#34) 완료 확인. 상세: `경영지원(슬기)/전사공지_W-MAIN_2단계분리_20260401.md` | `경영지원(슬기)/전사공지_W-MAIN_2단계분리_20260401.md` | **즉시** | DONE ✅ 2026-04-06 (PULSE·FLUX 숙지 완료 — cory 영향: ①#32 데이터품질 계속 ②#34 대기업6사 등록 확인완료 ③레퍼런스 16곳 cory DB 정합성 유지) |
| 36 | HUNTER 다래 (MUSE 대행) | **[W-MAIN v2 확정 — 수치 참고]** 2026-03-31 대표 확정. cory 관련 수치: 보건소 104개 도입·재구매율 66%·누적 120만매·대기업 10개+. 이 수치가 랜딩페이지에 노출되므로 cory DB 수치와 정합성 유지 필요. 수치 변경 시 MUSE에게 알림 요청. | `farm360/W-MAIN_카피프레임_v2.md` | 참고 | DONE ✅ 2026-04-06 (PULSE 숙지 완료 — 랜딩페이지 노출 수치 확인: 보건소104·재구매율66%·누적120만매·대기업10+·사업장참여율97%·전문센터평균177만원. 수치 변경 시 MUSE 알림 프로토콜 인지) |
| 35 | HUNTER 다래 | **[HC 전화 팔로업 기관 6건 — 후속 팔로업 이관]** 아래 상세 참조. 전화 접촉+샘플 발송 완료 기관 후속 관리 요청. 기관별 온도·참고 사항 포함. | `farm360/TODO.md` HC 팔로업 섹션, `farm360/HC_전화팔로업_우선순위리스트.md`, `farm360/HC_전화팔로업_이메일템플릿_MUSE.md` | **4/06** | DONE ✅ 2026-04-06 (PULSE 처리 — 6건 followup_date 세팅+상담메모 등록 완료. 🟢오늘 전화4건: 연세대원주·인천대·한국관광대·한국영상대. 🟡대기2건: 부산보건대·한국외대→9/01 예약) |
| 31 | SAGE 슬기 (대표 지시) | **[횡성군·광진구 추천 단계 재검증 + referral_confirmed 필드 검토]** | `마케팅전략/aps_marketing/보건소_지역전파모델_인사이트.md` | **4/07** | DONE ✅ 2026-03-31 (대표 확인: 추천 사례 기억에 없음. 추천 단계 재분류는 보류. 대신 추천 액션 프로토콜 신규 설계 방향으로 전환 → #33 등록) |
| 30 | PULSE 다온 → SAGE 슬기 | **[신규 유입 기관 자동 감지 워크플로 검토 요청]** ✅ **구현 완료 2026-04-06**: STEP4 미등록 기관 자동 등록 + STEP5 재매칭 로직 추가. **결과**: 12건 자동 등록 (금호건설·한국해양조사협회·국군포천병원·쿠팡케어센터·한국폴리텍대학 등) + 12건 상담 재매칭 완료. sourced_by='consult_discovery' 태깅, needs_wcolive_check=true 플래그, type 수동 보정 6건. inferInstitutionType() suffix 기반 분류 함수 추가. | `scripts/rematch-consultations.js` | **4/07** | DONE ✅ 2026-04-06 (PULSE·FLUX 처리 — STEP4+5 구현, 12건 등록+매칭 완료) |
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

## 일괄 정리 2026-06-20 (구 OPEN 잔존분 — 볼트최적화)

> INBOX.md OPEN에 잔존하던 완료·흡수·종료 항목 일괄 이관. 상세는 각 참조파일에 보존. 원본 백업: `cory/_archive/INBOX_backup_20260620.md`.
> ⚠️ **P0-2 재구매 데이터·P0-3 스타터/얼라이언스 CRM 통합은 memory상 OPEN 유지 → INBOX.md에 잔류**.

### A. 흡수된 전사 공지·표준 (memory/CLAUDE.md 상시 기준)
| # | 요약 | 참조 |
|---|------|------|
| 도메인v2.2 | 3축 도메인 매핑 매트릭스 v1 (v3 단일마스터로 승계) | `경영지원(슬기)/콘텐츠_도메인_매핑_매트릭스_v1_20260519.md` |
| 마케팅교본 | 「첫 고객을 잡아라」 기본 교본 (OPEN 스크립트·LAER·FVM·KPI 흡수) | `마케팅전략/aps_marketing/책분석_첫고객을잡아라_BillKim.md` |
| 트라이브즈 | 트라이브즈 방향성 v1 (4/21) | `마케팅전략/aps_marketing/트라이브즈_콘텐츠_마케팅_방향성_v1.md` |
| 53·51 | 구매 채널 2원화 FLUX 분기 로직(5/05) + 용어 이중체계 v1 | `경영지원(슬기)/전사공지_구매채널_2원화_확정_20260504.md` |
| 48·47 | core-doc 숙지(L1~L4 필드·재접촉 시퀀스) + SSOT v2.0 숙지 | `경영지원(슬기)/전사공지_core-doc_보건프로그램설계_20260420.md` |
| 41 | "체감/체험" 용어 분리 (4/12) | — |

### B. 종료된 캠페인 (노담 완판 5/21 · 강동경희 4/29 · 포장 AB)
| # | 요약 | 참조 |
|---|------|------|
| 노담완판-카카오발송 | 노담 조기 완판 감사 카카오·SMS 발송 (5/21) | `경영지원(슬기)/노담조기소진_트로이목마공지_v1_20260521.md` |
| 노담사은가-5_21·사은가-카톡·사은가-이메일대상자 | 노담 사은가 D-7 친구톡 대상자 추출·발송·이메일 314명 추출 | `farm360/노담패치_사은가_aps7공지본문_MUSE_나래_20260504.md` |
| 52·52BOND·공지-PULSE | 노담 D-30 카카오 알림톡 2분기 심사·BOND 검증·v1.2 | `farm360/공지캠페인_카카오알림톡_2분기_MUSE_v1.md` |
| 44·43 | 노담 카카오 B2C·기존 구매기관 1차 텍스트 발송 (4/16) | `APS보건교육연구소/노담패치_소진계획_통합전환_v1.md` |
| 42 | 카카오 채널 AB테스트 UTM 세팅·집계 (포장 캠페인) | `경영지원(슬기)/카카오채널_포장변경_AB테스트_캠페인플랜_v1.md` |
| 50·49 | CJM FLUX 발주(GA4·트리거) + myreg7 cory 매핑(경희의료원 4/29) | `경영지원(슬기)/CJM_3대가정_대표승인요청서.md` |

### C. 완료·이관 (CRM·발송·조회)
| # | 요약 | 참조 |
|---|------|------|
| 29 | L8 F1 출시 안내 152개소 일괄 발송 (F1 파일럿) | `PM Skills/09-running-log/2026-03-30-gtm-F1Standard정식출시.md` |
| 45 | 창원중독·삼척정신건강 구매 이력 조회 | `얼라이언스CS/INBOX.md` #15 |
| 40 | 납품 후 피드백 질문지 CRM 연동 검토 (L3·L4 작업으로 승계) | `APS보건교육연구소/납품후피드백_질문지_PULSE협업요청.md` |
| 33 | 추천 액션 프로토콜 설계 (CJM 교차 루프로 승계) | — |
| #35 | HC 전화 팔로업 기관 6건 후속 (연세대미래·인천대·한국관광대 등·3/19 발송) | `farm360/HC_전화팔로업_이메일템플릿_MUSE.md` |

## ✅ 대리점 세금계산서 팝빌 발행 (2026-07-06)
6월 대리점 4장 국세청 실발행 완료(총 6,125,000원, 승인번호 ...ad1b4~b7). 팝빌 API `issue_invoices_asp.py`. 연동계정 vianne75·파트너포인트 과금. cory invoice_issued 반영. 다음할일: cory [발행]버튼→실팝빌 연동.
