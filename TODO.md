# TODO — cory (PULSE 다온 · FLUX 이음)

> 10분마다 자동 확인. 완료 시 [x] 체크, 신규 과제 하단에 추가.

---

## 🔴 즉시 (긴급)

- [x] X3 주문 동기화 버그 수정 — reg_time 1970년 파싱 오류 + 중복 행 삽입 (FLUX) ✅ 2026-03-20
  - reg_time: YYYYMMDD/Unix/문자열 모두 처리 (stage7에서 완료)
  - 중복 행: goodsInfo를 기존 goods_name 기준으로 필터링 (stage8 수정)
  - ⚠️ Cloudflare Workers 배포 필요: cloudflare-worker.js → wrangler deploy

## 🔴 마케팅 협력 토론 A-task (마감: 3/27)

- [ ] A1 Make.com 가입 + 스티비 연동 검토 보고서 — F1 자동화 노코드 허브 구축 가능성 확인 (FLUX) ← `aps_marketing/에이전트_마케팅_협력_토론.md`
- [ ] A2 cory 대시보드 "이번 달 접촉 필요 기관" 뷰 추가 — 마지막 접촉일 기준 자동 정렬 (FLUX) ← `aps_marketing/에이전트_마케팅_협력_토론.md`
- [ ] A4 윙백서클 ① D+4 해피콜 Apps Script 내부 알림 초안 — 구글시트 트리거 기반 (FLUX) ← `aps_marketing/에이전트_마케팅_협력_토론.md`

## 🟡 단기 (이번 주)

- [x] P3a HC 샘플 신청 4건 → cory CRM "고려" 이관 ✅ 2026-03-20
  - ⚠️ 팔로업 D-day: 부산보건대·충북대·한국외대 (3/20), 한국영상대 (3/27)
- [ ] P3b 신규 주문 3건 기관 매칭 + 입금 확인 팔로업 (PULSE)
  - 춘천시보건소(105만), 정선군보건소(105만), 성동구교육센터(~365만)
- [ ] P4 기관 검색 기능 요건 정의 (PULSE)
- [ ] X1 HC 동기화 안정 운영 모니터링 (FLUX)

## 🟢 대기 (선행 완료 후)

- [ ] X2 교육 도입 수준 필드 DB 반영 ← P2 설계 완료 후 (FLUX)
- [ ] X4 기관 검색 기능 구현 ← P4 요건 정의 후 (FLUX)
