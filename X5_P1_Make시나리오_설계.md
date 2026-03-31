---
title: X5_P1_Make시나리오_설계
date: 2026-03-27
type: spec
product: [알쓰패치]
tags: [FLUX, 자동화, Make, Supabase, 주문알림, X5]
agent: FLUX
status: active
---
# X5 Phase 1 — P1 신규 주문 알림 Make.com 시나리오 설계

> 작성: SAGE 슬기 (FLUX X5 착수 지원) | 날짜: 2026-03-27
> 참조: [[경영지원(슬기)/S7_주문관리자동화_스펙기획]] P1 섹션
> 마감: **2026-04-06**

---

## 1. 시나리오 목표

wcolive 신규 주문이 Supabase `orders` 테이블에 적재되는 즉시 (최대 5~10분 지연) 대표에게 알림 발송.

**트리거**: Supabase `orders` 테이블 신규 행 INSERT
**액션**: 카카오 알림톡 or 문자(SMS) 대표 수신
**도구**: Make.com (무료 플랜, 월 1,000 실행 이내)

---

## 2. Make.com 시나리오 구성 (모듈 순서)

```
[Module 1] Watch Rows — Supabase
     ↓
[Module 2] Filter — 조건 필터
     ↓
[Module 3] Send SMS / 카카오 알림톡
```

---

## 3. 모듈별 설정 상세

### Module 1: Watch Rows (Supabase)

| 항목 | 값 |
|------|-----|
| Connection | Supabase rvqkoiqjjhlrgqitnxwt |
| Table name | `orders` |
| Trigger column | `id` (auto-increment) |
| Limit | 10 (1회 실행당 최대 10건) |
| Sort | `id DESC` (최신순) |

> ⚠️ Supabase Make.com 커넥터 설정 시 필요한 정보:
> - Project URL: `https://rvqkoiqjjhlrgqitnxwt.supabase.co`
> - API Key: `cory/js/supabase-config.js` 내 `anonKey` 확인

### Module 2: Filter (조건 필터)

신규 주문만 알림 발송 (재처리 방지).

| 조건 | 값 |
|------|-----|
| `reg_time` | ≥ 현재 시각 - 30분 (오래된 기록 무시) |
| `order_status` 또는 존재 여부 | NULL이 아닌 경우 |

> 대안: Supabase Webhook 방식 사용 시 Module 1을 `Custom Webhook (Receive)`로 변경하면 필터 불필요. Supabase → Database → Webhooks에서 `orders` INSERT 이벤트 → Make.com Webhook URL 등록.
> **추천: Webhook 방식** (실시간, 폴링보다 정확)

### Module 3: SMS 발송 (추천 — 즉시 구현 가능)

**방법 A: 기존 애니빌드 SMS (가장 빠름)**
- 현재 애니빌드 SMS 계정 보유 → API 연동 가능
- Make.com → HTTP Module → 애니빌드 API 호출
- 또는 Make.com 내 SMS 모듈 (Twilio 등 별도 가입 불필요 시)

**방법 B: Make.com → Gmail**
- 대표 Gmail로 즉시 이메일 발송
- 무료, 설정 5분
- 한계: 이메일이라 즉시 확인 안 될 수 있음

**방법 C: Make.com → Slack (추천 중기)**
- Slack 워크스페이스 있으면 즉시 알림

**최단 구현: Gmail (방법 B) → SMS 연동 후 교체**

---

## 4. 알림 메시지 포맷

```
[APS 신규주문]
기관: {{goods_buyer}}
품목: {{goods_name}} {{goods_cnt}}개
금액: {{goods_price}}원
주문번호: {{order_idx}}
주문일시: {{reg_time}}
→ cory 매칭 필요
```

> Make.com 변수명은 Supabase `orders` 테이블 컬럼명 그대로 사용.
> 컬럼명 확인 필요: `goods_buyer`, `goods_name`, `goods_cnt`, `goods_price`, `order_idx`, `reg_time`

---

## 5. Webhook 방식 설정 (추천)

Supabase Webhook 방식이 폴링보다 정확하고 무료 실행 횟수를 덜 소모함.

### Supabase 측 설정
1. Supabase 대시보드 → Database → Webhooks
2. "New Webhook" 클릭
3. 설정:
   - Name: `make-order-alert`
   - Table: `orders`
   - Events: `INSERT` 체크
   - Method: `POST`
   - URL: (Make.com에서 생성한 Webhook URL 붙여넣기)
   - HTTP Headers: `Content-Type: application/json`

### Make.com 측 설정
1. 새 시나리오 생성
2. 첫 모듈: `Webhooks > Custom Webhook`
3. "Add" 클릭 → Webhook URL 복사 → Supabase에 붙여넣기
4. 두 번째 모듈: HTTP Request (애니빌드 SMS API) 또는 Gmail

---

## 6. 구현 체크리스트

| # | 항목 | 담당 | 완료 여부 |
|---|------|------|---------|
| 1 | Make.com 계정 확인 (기존 A1 가입 여부) | FLUX | - |
| 2 | Supabase orders 테이블 컬럼명 확인 | FLUX | - |
| 3 | Make.com Webhook URL 생성 | FLUX | - |
| 4 | Supabase Webhook 등록 (INSERT → Make.com URL) | FLUX | - |
| 5 | 알림 발송 모듈 설정 (Gmail or SMS) | FLUX | - |
| 6 | 테스트 주문으로 알림 수신 확인 | FLUX + 대표 | - |

---

## 7. 대안 — Google Apps Script (Make.com 없을 경우)

```javascript
// GAS 10분 트리거 버전 (Make.com 대안)
function checkNewOrders() {
  const SUPABASE_URL = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co';
  const ANON_KEY = '...'; // cory/js/supabase-config.js 참조

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const res = UrlFetchApp.fetch(
    `${SUPABASE_URL}/rest/v1/orders?reg_time=gte.${tenMinutesAgo}&order=id.desc`,
    { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
  );

  const orders = JSON.parse(res.getContentText());
  if (orders.length === 0) return;

  const msg = orders.map(o =>
    `[신규주문] ${o.goods_buyer} / ${o.goods_name} ${o.goods_cnt}개 / ${o.goods_price}원`
  ).join('\n');

  GmailApp.sendEmail('대표이메일@gmail.com', '[APS] 신규 주문 알림', msg);
}
```

> 이 GAS 버전은 `cory/gas/` 디렉토리에 `order-alert.js`로 저장 후 10분 트리거 설정.

---

## 관련 문서

- [[경영지원(슬기)/S7_주문관리자동화_스펙기획]] — 전체 Phase 스펙
- [[cory/TODO.md]] — X5 과제 현황
- Supabase 접속: `rvqkoiqjjhlrgqitnxwt.supabase.co`
