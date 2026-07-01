# INBOX — PULSE 다온 · FLUX 이음

> 협업 요청 수신함. 10분 루프 자동 스캔.
> 요청 추가: FROM/REQ/FILE/DUE 4개 필드만 채우면 됨.
> 완료 항목: `INBOX_DONE.md` 참조
> **INBOX 경량화 규칙**: 한 줄 요약 + 참조파일 링크만. 상세는 산출물 파일 안에. 완료 즉시 `INBOX_DONE.md` 이동.
> **2026-06-20 볼트최적화**: 구 OPEN 잔존분 ~22건(완료·흡수 공지·노담/강동경희 캠페인) → `INBOX_DONE.md` 일괄 이관. 원본 백업 `_archive/INBOX_backup_20260620.md`.

---

## OPEN

| # | FROM | 요청 내용 | 참조 파일 | 마감 | 상태 |
|---|------|---------|---------|------|------|
| KISS-체험팩발송+태그 | SAGE 🔴 | FLUX — KISS 즉석등록→**사업장 체험팩(5개) 발송 자동화**(주소→발송큐·~150건·1인 수작업 불가) + cory `KISS2026` 태그·핫리드(사업장 보건관리자) 분류 + D+30 팔로업 트리거 | `마케팅전략/aps_marketing/KISS2026_즉석등록_사업장체험팩_발주_20260622.md` | 🔴 ~6/30 | OPEN |
| 모비스-사전사후매칭 | FORGE 🟡 | FLUX — 현대모비스 사전·사후·추적 3시점 매칭키 저장 스키마 + 대응표본 페어 추출 쿼리 + 개인정보 최소수집·익명화. PIXEL 프론트와 페이로드 협의 | `APS보건교육연구소/현대모비스_사전사후_문항설계_초안_v0_20260616.md` | 🟡 차기 자문회의 전 | OPEN |
| 양구D+90-금연사업인터뷰 | SAGE 🔴 | PULSE — 양구군보건소 진입 기록·금연사업 메타 등록 + D+90(2026-09) 자동 알람 + 사용 인터뷰 4문항 회수 → 1C 트랙·금연사업 ICP 검증 | `마케팅전략/aps_marketing/ICP_v3.1_3트랙_B2G.md` | 🔴 2026-09 인터뷰 | OPEN |
| supabase-grant-2026 | PIXEL 🟡 | FLUX — Supabase Data API enforcement(2026-10-30): Security Advisor 점검(즉시) + 테이블 생성 GRANT 템플릿 + RLS 병행 | `~/.claude/projects/-Users-olive-Qsync----/memory/supabase_data_api_grant_policy_2026.md` | 🟡 10/30 (점검 즉시) | OPEN |
| Phase3자동화-가입폼v3.2 | SAGE 🟡 | FLUX — 가입폼 v3.2 가점 자동 산출 + 의료인 첨부 검증(첨부시만 가점) + 승급 임계 40점. 🚨 PIXEL 첨부 필수 룰 완료 회신 후 가동 | `얼라이언스CS/APS회원가입폼_의학계열_누락_대표결정요청_BOND_가온.md` | 🟡 PIXEL 완료 후 | OPEN |
| 원가구조-SCM로스율 | FORGE 🔴 | FLUX SCM — `inventory_items` 7종 단가 등록 + `loss_records` 5단계 신설 + 월간 로스율 리포트(SAGE 대시보드) + 부직포 재고 확인. 사외비 | `APS보건교육연구소/알쓰패치_원가구조_실측_v1_20260503.md` `cory/SCM_운영_매뉴얼_GRID_이음.md` | 🔴 SCM 운영 | OPEN |
| P0-3-스타터얼라이언스CRM | SAGE 🔴 | PULSE — 신규 필드 7개(has_master·alliance_tier 등) + 자동화 트리거 3종 + alliance_tier 산출. 옵션 A/B 결정. **memory상 OPEN** | `cory/P03_스타터패키지_프로그램북_얼라이언스_CRM통합_PULSE.md` | 🔴 | OPEN |
| 입금세금계산서-상태입력루틴화 | FLUX→PULSE 🟢 | **[FLUX 진단완료+구축 7/01]** memo_raw **전체 413건 NULL**(구조적·wcolive 관리자메모 미수집). ✅수동 발행/입금 토글 완성(메모 없는 건 커버) ✅경로A 스크래퍼 완성(jumun_list.htm 고유번호/메모)+worker `/sync-order-memos` 배포·E2E검증. **남음**: 대표 스크래퍼 1회 실행→[메모파싱] / **PULSE 주간 상태업데이트 루틴**→[[재무_월간요약_2026]] 현금·미수금 피드 | `cory/입금세금계산서_상태입력_진단회신_FLUX_20260701.md` `cory/주문메모_스크래퍼_초안_FLUX_20260701.md` | 🟢 PULSE 루틴 | OPEN |
| 판관비-추출루트 | SAGE 🟡 | FLUX — 6월 판관비(인쇄·도구·마케팅) 추출 루트 식별(대표: cory↔홈페이지 연결로 가능). cory에 비용 테이블 없음·인쇄필드 미채움 → 애니빌드 정산/발주/결제 경로 대표 확인 후 6월분 집계 → 재무시트 영업이익 마감. 월별 정례화 | `cory/판관비_추출루트_핸드오프_SAGE_20260701.md` | 🟡 금주 | OPEN |
| 대리점세금계산서-팝빌API구현 | SAGE 🟡 | FLUX(대표 방식A 확정) — ①**대리점 사업자번호 추출: wcolive 회원정보(mem_id 기준)→cory 매핑** ②팝빌 발행 API `cory/scripts/issue_invoices_asp.py`(승인목록 Y건만·공급가액 floor(총액/1.1)·수신자=대리점 사업자번호) ③발행결과 Supabase `invoice_issued/invoice_date` 쓰기(서비스롤) ④승인목록 md 생성. 선행: 대표 팝빌 가입·인증서 등록. 수동대체=run_workflow.py | `경영지원(슬기)/재무/대리점_세금계산서_발행자동화_설계_v1.md` | 🟡 팝빌 세팅 후 | OPEN |
| 버전병존-archive스캔 | 대표 🟡 | cory/ 하위 v1/v2 병존 문서 _archive 스캔 (전사 CLAUDE.md §7) | 전사 CLAUDE.md §7 | 상시 | OPEN |

---

> **CRM 인프라 P0 시리즈**: P0-1 ✅(4/08) / P0-2·P0-3 OPEN — F1 파일럿 KR1 측정·얼라이언스 운영의 핵심 블로커.
