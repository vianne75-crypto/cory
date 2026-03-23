---
title: X1_FLUX_조회엔드포인트_요청
date: 2026-03-19
type: operations
product: [알쓰패치]
segment: [대학_보건센터]
tags: [FLUX, Apps Script, DM, 캠페인, 자동화]
---
# FLUX 이음님께 — HC DM 데이터 조회 엔드포인트 추가 요청

> 발신: HUNTER 다래 | 일자: 2026-03-19 | 긴급도: 🔴 즉시 (D+14 마감 2026-03-20)
> **[RESOLVED 2026-03-19] FLUX 이음 검토 완료 — GAS 수정 불필요**
> CF Worker `/fetch-sheet` 엔드포인트가 이미 동일 기능 제공 중.
> `GET https://aps-webhook.vianne75.workers.dev/fetch-sheet?sheetId=1wdfX6X_...&gid=1808108290`
> HC_샘플신청(GID:1808108290), HC_클릭로그(GID:1907658694) 직접 조회 가능. 추가 개발 없음.

---

## 요청 배경

현재 Apps Script 엔드포인트는 **QR 스캔 처리 전용**으로, 데이터 조회 기능이 없습니다.
D+14 KPI 체크(내일 3/20)를 위해 Claude Code가 구글시트 데이터를 직접 읽을 수 있는
**조회 전용 엔드포인트**가 필요합니다.

---

## 요청 사항

기존 Apps Script(`apps_script_tracker.js`)에 **`action=report` 파라미터** 처리 로직 추가.

### 호출 방식

```
GET {배포URL}?action=report&secret=aps2026hc
```

### 응답 형식 (JSON)

```json
{
  "generated_at": "2026-03-20T09:00:00",
  "click_log": {
    "total": 13,
    "unique_utm": 7,
    "by_utm": [
      { "utm": "h110", "count": 2, "last_scan": "2026-03-18" },
      ...
    ]
  },
  "sample_requests": {
    "total": 3,
    "list": [
      { "utm": "h032", "name": "이화진", "phone": "010-****-****", "requested_at": "2026-03-10" },
      ...
    ]
  }
}
```

---

## 구현 위치

**파일**: `dm_landing/apps_script_tracker.js`
**함수**: `doGet(e)` 내 분기 추가

```javascript
// doGet() 맨 위에 추가
if (e.parameter.action === 'report' && e.parameter.secret === 'aps2026hc') {
  return reportHcStatus();
}
```

**신규 함수** `reportHcStatus()`:
- `HC_클릭로그` 시트 전체 읽기 → 총 건수 + UTM별 고유 카운트
- `HC_샘플신청` 시트 전체 읽기 → 신청 건수 + 리스트
- JSON 반환 (`ContentService.createTextOutput(...).setMimeType(ContentService.MimeType.JSON)`)

---

## 보안

- `secret=aps2026hc` 파라미터 일치 시만 응답
- 전화번호는 뒷 4자리 마스킹 처리

---

## 일정

- **요청일**: 2026-03-19
- **필요일**: 2026-03-20 오전 (D+14 KPI 체크 전)
- 배포 후 URL 동일 (재배포 시 새 URL 발급되면 알려주세요)

감사합니다!

HUNTER 다래 드림

---

## 추가 요청 — HC_샘플신청 발송 기록 쓰기 권한 (2026-03-19)

> 대표님이 쓰기 권한 부여 승인하셨습니다.

### 배경

샘플 발송 완료 후 구글시트 `HC_샘플신청` 탭에 발송일·송장번호·배송업체를 Claude Code가 직접 기록할 수 있도록 **쓰기 엔드포인트** 추가 요청드립니다.

### 요청 사항

Apps Script에 `action=update_shipment` POST 처리 추가.

#### 호출 방식

```
POST {배포URL}
Content-Type: application/json

{
  "action": "update_shipment",
  "secret": "aps2026hc",
  "utm": "h272",
  "shipped_date": "2026-03-19",
  "tracking_number": "44019611090",
  "carrier": "로젠택배"
}
```

#### 동작

- `HC_샘플신청` 시트에서 UTM코드 일치 행 검색
- 해당 행의 발송일 / 송장번호 / 배송업체 컬럼 업데이트
- 성공 시 `{"result": "ok"}` 반환

#### 시트 컬럼 (현재 없으면 추가)

| 컬럼명 | 내용 |
|--------|------|
| 발송일 | YYYY-MM-DD |
| 송장번호 | 숫자 문자열 |
| 배송업체 | 로젠택배 등 |

### 보안

- `secret=aps2026hc` 일치 시만 허용
- UTM코드 기준 단건 업데이트만 허용 (전체 삭제·덮어쓰기 불가)

감사합니다!
