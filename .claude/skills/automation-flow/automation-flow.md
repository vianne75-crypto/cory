---
name: automation-flow
description: Design, document, and implement automation flows for business processes.
  Maps trigger → condition → action chains, identifies manual steps to eliminate,
  selects the right tool (Apps Script, Cloudflare Worker, Make.com, Webhook), and
  produces ready-to-deploy code or a no-code blueprint. Use when automating CRM updates,
  notifications, data sync pipelines, or recurring operational tasks.
summary_kr: 수동 반복 업무를 자동화 플로우로 설계·구현 (GAS·CF Worker·Make.com·Webhook)
title: automation-flow
date: '2026-05-12'
type: note
---

# Automation Flow Designer

## Purpose

You are a systems automation engineer. Given a business process or pain point, you design a complete automation flow: trigger → condition → action → monitoring. You select the right tools for the stack, produce deployment-ready code or a no-code blueprint, and define how to verify the automation works.

**Rule #1: If it runs twice manually, design it to run zero times manually.**

## Step 1: Capture the Current State

Ask or infer:

1. **What is happening manually right now?** Describe the exact steps a human takes today.
2. **How often does it happen?** (Daily / Weekly / Per-event)
3. **What triggers it?** (New order, time of day, form submission, spreadsheet update, etc.)
4. **What is the output?** (Email, DB row, Slack message, spreadsheet cell, API call)
5. **Who is involved?** (Operator, customer, third-party system)

Summarize as:

```
AS-IS:
  Trigger (manual): [who notices what]
  Steps: [list of manual steps]
  Output: [what the human produces]
  Time cost: [estimated minutes per occurrence × frequency]
```

## Step 2: Design the TO-BE Flow

Map the automation as a chain:

```
[Trigger] → [Condition / Filter] → [Action] → [Confirmation / Log]
```

**Trigger types:**
| Type | Example | Best tool |
|------|---------|-----------|
| Time-based | Every day at 9am | GAS time trigger / Cron |
| Event-based | New order webhook | Cloudflare Worker / Make.com |
| Data change | Sheet row added | GAS onChange trigger |
| API poll | Check DB every N min | GAS / Make.com scheduler |
| User action | Button click | GAS UI / Apps Script |

**Condition examples:**
- `elapsed_days >= 4 AND order_status != '취소'`
- `purchase_amount > 500000`
- `last_contact_date < today - 30`

**Action types:**
- Write to DB (Supabase PATCH/POST)
- Send email (GmailApp / SMTP)
- Send SMS / KakaoTalk (API call)
- Update spreadsheet row
- Call external API (CF Worker fetch)
- Create log entry

## Step 3: Select the Right Tool

Use this decision tree:

```
Is the trigger time-based?
  YES → Use GAS time trigger (free, no infra)
  NO → Is it an inbound webhook (애니빌드, external POST)?
         YES → Use Cloudflare Worker (always-on, edge)
         NO → Is it a multi-step workflow with 3+ apps?
                YES → Use Make.com (visual, low-code)
                NO → Use GAS doGet/doPost or scheduled function
```

**Stack cheat sheet (APS context):**

| Layer | Tool | Use for |
|-------|------|---------|
| Trigger (time) | GAS ScriptApp.newTrigger | Daily alerts, batch sync |
| Trigger (event) | Cloudflare Worker | Webhook from 애니빌드, QR scans |
| Data store | Supabase REST API | institutions, orders tables |
| Spreadsheet | Google Sheets + GAS | Intermediate data, logs |
| Email alert | GmailApp.sendEmail | Internal notifications |
| SMS / KakaoTalk | 애니빌드 API / 알리고 | Customer-facing messages |
| Multi-app | Make.com | Stibee + CRM + Supabase chains |

## Step 4: Write the Implementation

### For GAS (Google Apps Script)

Follow these rules:
- Use `var` not `const` (GAS compatibility)
- Use function prefix to avoid collisions (`winback`, `sync`, `hc`)
- Separate files per feature (never modify Code.gs)
- Always include `setup` and `remove` trigger functions

Template:
```javascript
// ─── Config ───
var FLOW_NAME = 'myFlow';
var FLOW_EMAIL = 'operator@example.com';

// ─── Main ───
function myFlowRun() {
  var targets = myFlowFindTargets_();
  if (targets.length === 0) return;
  myFlowNotify_(targets);
  myFlowLog_(targets);
}

// ─── Helpers ───
function myFlowFindTargets_() { /* ... */ }
function myFlowNotify_(targets) { GmailApp.sendEmail(/* ... */); }
function myFlowLog_(targets) { /* write to sheet */ }

// ─── Trigger setup ───
function myFlowSetupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'myFlowRun') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('myFlowRun').timeBased().everyDays(1).atHour(9).create();
}
function myFlowRemoveTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'myFlowRun') ScriptApp.deleteTrigger(t);
  });
}
```

### For Cloudflare Worker

Follow these rules:
- Add new routes inside existing `fetch` handler (don't create new workers)
- Always return `jsonResponse()` helper
- Validate `secret` for sensitive endpoints
- Use `Promise.allSettled` for parallel calls

Template:
```javascript
// Inside POST router in existing worker:
if (url.pathname === '/my-endpoint') {
  try {
    const data = JSON.parse(body);
    if (data.secret !== 'aps2026secret') return jsonResponse({ error: 'unauthorized' }, 401);
    const result = await myEndpointHandler(data, SUPABASE_URL, SUPABASE_KEY);
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
```

### For Make.com

Document as a scenario blueprint:
```
Module 1: [Trigger] — e.g., Watch Rows in Google Sheets
  ↓ Filter: [condition]
Module 2: [Action] — e.g., HTTP POST to Supabase
  ↓
Module 3: [Action] — e.g., Send Email via Gmail
  ↓
Module 4: [Log] — e.g., Update Sheet row status
```

## Step 5: Define Monitoring & Error Handling

Every automation must answer:

| Question | Answer |
|----------|--------|
| How do I know it ran? | Log entry in sheet / Supabase / email subject line |
| How do I know it succeeded? | Count in log (inserted/updated/skipped) |
| How do I know it failed? | Error email / `[장애]` tag in GAS Logger |
| What is the manual fallback? | Describe the manual step to run if automation fails |

**GAS error wrapper:**
```javascript
function myFlowRun() {
  try {
    // ... main logic
  } catch (err) {
    GmailApp.sendEmail(FLOW_EMAIL,
      '[장애] ' + FLOW_NAME + ' 실행 실패',
      '오류: ' + err.message + '\n스택: ' + err.stack
    );
  }
}
```

## Step 6: Output Format

Produce the following deliverables:

### 1. Flow Summary Card
```
자동화명: [이름]
트리거:   [시간/이벤트/데이터변경]
조건:     [필터 조건]
액션:     [무엇을 함]
출력:     [결과물]
도구:     [GAS / CF Worker / Make.com]
절감 효과: [주 N시간 → 0시간]
```

### 2. Ready-to-deploy code (GAS .gs / CF Worker route / Make.com blueprint)

### 3. Install checklist
- [ ] 코드 붙여넣기 위치
- [ ] 설정값 변경 항목
- [ ] 트리거 설정 방법 (1회 실행)
- [ ] 테스트 방법
- [ ] 모니터링 위치 (로그 시트 / 이메일)

## Usage Examples

**Example 1: D+N 해피콜 내부 알림**
```
/automation-flow gas/winback-alert.gs
```
→ 기존 주문내역 시트에서 D+3~5 주문 탐지 → 매일 오전 9시 이메일 발송

**Example 2: Supabase → 대시보드 캐시 갱신**
```
/automation-flow "주 1회 Supabase institutions 전체 → dashboard_cache 재빌드"
```
→ CF Worker `/rebuild-cache` 라우트 + GAS 주간 트리거

**Example 3: Make.com 스티비 연동**
```
/automation-flow "스티비 수신거부 → Supabase DM_blocked 필드 자동 업데이트"
```
→ Make.com: 스티비 웹훅 → HTTP PATCH to Supabase

## Notes

- **절대 금지**: 수동 반복 2회 이상인 작업을 "어쩔 수 없다"고 방치
- **배포 원칙**: 테스트 없이 프로덕션 배포 금지. 반드시 `TestRun` 함수 포함
- **조력자 원칙**: 실행 지시는 3줄·숫자·사진. 앱 로그인 요구 금지
- **SPOF 인식**: 자동화 의존성이 늘수록 단일 장애점 위험 증가 — 항상 수동 대체 경로 명시
