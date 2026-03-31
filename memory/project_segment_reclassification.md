---
name: 세그먼트 유동적 재분류 원칙
description: cory 기관 세그먼트는 파밍·마케팅 결과에 따라 추후 유동적으로 재분류할 수 있음
type: project
---

현재 세그먼트 순서(2026-03-29 확정):
보건소 > 전문기관 > 금연지원센터 > 광역시도 및 중앙기관 > 산업보건 > 대학보건센터 > 초중고 > 전공교육 > 강사·대행사

**Why:** 파밍 캠페인과 마케팅 결과에 따라 세그먼트별 매출 비중이 달라질 수 있음. 금연지원센터는 현재 3위권 진입 목표로 별도 분리 관리 중.

**How to apply:** 세그먼트 순서 변경 요청 시 DB PATCH + admin.html dropdown 수정 + cloudflare-worker.js/hc-sync-gas.js 참조 업데이트 + GitHub push 세트로 처리. 코드 내 타입 문자열이 DB 값과 반드시 일치해야 함.
