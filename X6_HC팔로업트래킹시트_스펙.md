---
title: X6 HC 팔로업 트래킹 시트 — buildFollowupSheet() 스펙
date: 2026-03-27
type: spec
product: [알쓰패치]
segment: [대학_보건센터]
tags: [FLUX, HC, DM, 팔로업, Apps Script, 구글시트]
agent: FLUX
status: active
---

# X6 HC 팔로업 트래킹 시트 — `buildFollowupSheet()` 구현 스펙

> **목적**: HC DM 캠페인에서 QR 스캔만 하고 샘플 신청을 하지 않은 기관을 자동 추출하여 전화 팔로업 트래킹 시트를 구성한다.
> **SAGE 설계 2026-03-27 | FLUX 이음 구현 담당**

---

## 1. 입력 데이터 (기존 시트)

| 시트명 | 변수명 | 내용 |
|--------|--------|------|
| `HC_클릭로그` | `SHEET_HC` | QR 스캔 로그 (uid=h코드, campaign, timestamp, userAgent) |
| `HC_샘플신청` | `SHEET_HC_SAMPLE` | 샘플 신청 폼 제출 (시간, UTM코드, 기관명, 부서명, 배송주소, 담당자, 휴대폰, ...) |

---

## 2. 출력 시트

**시트명**: `HC_DM_팔로업트래킹`
**생성 방식**: 없으면 신규 생성, 있으면 A1부터 덮어쓰기 (헤더 제외)

### 컬럼 구조

| 열 | 컬럼명 | 출처 | 비고 |
|----|--------|------|------|
| A | h코드 | HC_클릭로그 uid | e.g., h048 |
| B | 학교명 | lookupSchoolName(uid) | 아래 매핑 함수 참조 |
| C | 최초스캔일 | HC_클릭로그 timestamp 최솟값 | |
| D | 스캔횟수 | HC_클릭로그 uid 등장 횟수 | |
| E | 캠페인코드 | HC_클릭로그 campaign | 2025hc/2026hc 구분 |
| F | 신청여부 | HC_샘플신청 UTM코드 조회 | "신청완료" / "미신청" |
| G | 신청일 | HC_샘플신청 시간 (있는 경우) | |
| H | 전화번호 | lookupPhone(uid) | 아래 매핑 참조 |
| I | 우선순위 | lookupTier(uid) | A/B/C/- |
| J | 전화팔로업결과 | 수동 입력 | 통화성공/부재/거절/연결불가 |
| K | 담당자명 | 수동 입력 | |
| L | 샘플신청Y/N | 수동 입력 | 전화 후 신청 여부 |
| M | 비고 | 수동 입력 | |

---

## 3. 핵심 로직

```javascript
function buildFollowupSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ── 1. HC_클릭로그 읽기 ──
  var hcSheet = ss.getSheetByName(SHEET_HC);
  if (!hcSheet) { Logger.log('HC_클릭로그 없음'); return; }
  var hcData = hcSheet.getDataRange().getValues(); // [timestamp, uid, campaign, userAgent]
  // 헤더 제거
  var hcHeader = hcData.shift();

  // uid별 집계: { h048: { count: 3, firstScan: Date, campaign: '2026hc' } }
  var scanMap = {};
  hcData.forEach(function(row) {
    var uid = String(row[1]).trim();
    var ts = row[0];
    var camp = String(row[2]).trim();
    if (!uid) return;
    if (!scanMap[uid]) {
      scanMap[uid] = { count: 0, firstScan: ts, campaign: camp };
    }
    scanMap[uid].count++;
    if (ts < scanMap[uid].firstScan) scanMap[uid].firstScan = ts;
    if (camp === '2026hc') scanMap[uid].campaign = camp; // 신규 캠페인 우선
  });

  // ── 2. HC_샘플신청 읽기 ──
  var sampleSheet = ss.getSheetByName(SHEET_HC_SAMPLE);
  var requestMap = {};
  if (sampleSheet) {
    var sampleData = sampleSheet.getDataRange().getValues();
    sampleData.shift(); // 헤더
    sampleData.forEach(function(row) {
      var utm = String(row[1]).trim(); // B열: UTM코드
      var ts = row[0];
      if (!utm) return;
      requestMap[utm] = { requested: true, requestDate: ts };
    });
  }

  // ── 3. 팔로업 시트 구성 ──
  var followSheet = ss.getSheetByName('HC_DM_팔로업트래킹');
  if (!followSheet) {
    followSheet = ss.insertSheet('HC_DM_팔로업트래킹');
  }

  // 헤더
  var headers = ['h코드', '학교명', '최초스캔일', '스캔횟수', '캠페인코드',
                 '신청여부', '신청일', '전화번호', '우선순위',
                 '전화팔로업결과', '담당자명', '샘플신청Y/N', '비고'];
  followSheet.clearContents();
  followSheet.appendRow(headers);
  followSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  followSheet.setFrozenRows(1);

  // 데이터 행 추가
  var uids = Object.keys(scanMap).sort();
  uids.forEach(function(uid) {
    var scan = scanMap[uid];
    var req = requestMap[uid] || {};
    var requested = req.requested ? '신청완료' : '미신청';
    var requestDate = req.requestDate || '';
    followSheet.appendRow([
      uid,
      lookupSchoolName(uid),
      scan.firstScan,
      scan.count,
      scan.campaign,
      requested,
      requestDate,
      lookupPhone(uid),
      lookupTier(uid),
      '', '', '', ''  // 수동 입력 컬럼
    ]);
  });

  // 신청여부 "미신청" 행 노란색 강조
  highlightUnrequested(followSheet);

  SpreadsheetApp.flush();
  Logger.log('HC_DM_팔로업트래킹 시트 생성 완료. 총 ' + uids.length + '개교');
}
```

---

## 4. 보조 함수 — 학교명·전화·Tier 매핑

```javascript
// HC 전화 팔로업 우선순위 리스트 (TOP 15)
var HC_SCHOOL_MAP = {
  'h048': { name: '계명대학교', phone: '053-580-6220', tier: 'A' },
  'h019': { name: '고려대학교', phone: '02-3290-1571', tier: 'A' },
  'h021': { name: '연세대학교(서울)', phone: '02-2228-1229', tier: 'A' },
  'h024': { name: '중앙대학교', phone: '02-820-5500', tier: 'A' },
  'h022': { name: '숙명여자대학교', phone: '02-710-9920', tier: 'A' },
  'h029': { name: '성균관대(자연과학)', phone: '031-290-5250', tier: 'B' },
  'h033': { name: '강원대학교', phone: '033-250-8091', tier: 'B' },
  'h040': { name: 'KAIST', phone: '042-350-4816', tier: 'B' },
  'h042': { name: '우송대학교', phone: '042-629-6812', tier: 'B' },
  'h052': { name: '국립창원대', phone: '055-213-2114', tier: 'B' },
  'h049': { name: '부산가톨릭대', phone: '051-510-0528', tier: 'C' },
  'h043': { name: '배재대학교', phone: '042-520-5488', tier: 'C' },
  'h039': { name: '국립공주대', phone: '041-850-8114', tier: 'C' },
  'h054': { name: '경남대학교', phone: '055-249-2205', tier: 'C' },
  'h011': { name: '위덕대학교', phone: '054-760-1000', tier: 'C' },
  // 기존 신청 기관
  'h051': { name: '부산보건대학교', phone: '', tier: '-' },
  'h037': { name: '충북대학교', phone: '', tier: '-' },
  'h417': { name: '한국외대(글로벌)', phone: '', tier: '-' },
  'h272': { name: '한국영상대학교', phone: '', tier: '-' },
};

function lookupSchoolName(uid) {
  return HC_SCHOOL_MAP[uid] ? HC_SCHOOL_MAP[uid].name : uid + '(미매핑)';
}
function lookupPhone(uid) {
  return HC_SCHOOL_MAP[uid] ? HC_SCHOOL_MAP[uid].phone : '';
}
function lookupTier(uid) {
  return HC_SCHOOL_MAP[uid] ? HC_SCHOOL_MAP[uid].tier : '-';
}

function highlightUnrequested(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var data = sheet.getRange(2, 6, lastRow - 1, 1).getValues(); // F열: 신청여부
  data.forEach(function(row, i) {
    if (row[0] === '미신청') {
      sheet.getRange(i + 2, 1, 1, 13).setBackground('#fff9c4'); // 노란색
    }
  });
}
```

---

## 5. 트리거 설정 (선택)

- **수동 실행**: Apps Script 편집기에서 `buildFollowupSheet()` 직접 실행
- **자동 실행 (권장)**: 시간 기반 트리거 — 매일 오전 9시 (HC DM D+30까지만)
  ```
  ScriptApp.newTrigger('buildFollowupSheet')
    .timeBased().everyDays(1).atHour(9).create();
  ```

---

## 6. 주의사항

- `SPREADSHEET_ID`는 기존 `apps_script_tracker.js`의 상수 재사용
- `HC_클릭로그` 헤더 구조 확인 필요 (timestamp 위치 = A열 가정)
- 주소록 CSV 385개교 전체 매핑은 별도 시트 "학교코드매핑" 탭으로 확장 가능 (Phase 2)
- 수동 입력 컬럼(J~M)은 덮어쓰기 방지 로직 추가 권장 (기존 값 보존)

---

## 관련 문서

- [[cory/X5_주문관리자동화]] — FLUX 이음 주관 자동화 체계
- [[farm360/HC_전화팔로업_우선순위리스트]] — Tier A/B/C 리스트
- `apps_script_tracker.js` — 기존 doGet/doPost 핸들러
