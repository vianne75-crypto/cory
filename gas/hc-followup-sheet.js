/**
 * HC_DM_팔로업트래킹 시트 자동 생성
 * GAS 파일명: HcFollowupSheet.gs
 *
 * 설치:
 *   1. 구글시트 → 확장 프로그램 → Apps Script
 *   2. 새 파일 → 이름: HcFollowupSheet
 *   3. 이 코드 전체 붙여넣기
 *   4. buildFollowupSheet() 직접 실행 (최초 1회)
 *   5. 자동 실행 원하면 buildFollowupSheetSetupTrigger() 1회 실행
 *
 * 주의: SPREADSHEET_ID는 apps_script_tracker.js(Code.gs)의 상수 공유
 */

// ─── HC 학교 매핑 (h코드 → 학교명·전화·Tier) ───
var HC_FOLLOWUP_MAP = {
  // Tier A — 최우선
  'h048': { name: '계명대학교',          phone: '053-580-6220', tier: 'A' },
  'h019': { name: '고려대학교',          phone: '02-3290-1571',  tier: 'A' },
  'h021': { name: '연세대학교(서울)',    phone: '02-2228-1229',  tier: 'A' },
  'h024': { name: '중앙대학교',          phone: '02-820-5500',   tier: 'A' },
  'h022': { name: '숙명여자대학교',      phone: '02-710-9920',   tier: 'A' },
  // Tier B
  'h029': { name: '성균관대(자연과학)', phone: '031-290-5250',  tier: 'B' },
  'h033': { name: '강원대학교',          phone: '033-250-8091',  tier: 'B' },
  'h040': { name: 'KAIST',              phone: '042-350-4816',  tier: 'B' },
  'h042': { name: '우송대학교',          phone: '042-629-6812',  tier: 'B' },
  'h052': { name: '국립창원대',          phone: '055-213-2114',  tier: 'B' },
  // Tier C
  'h049': { name: '부산가톨릭대',        phone: '051-510-0528',  tier: 'C' },
  'h043': { name: '배재대학교',          phone: '042-520-5488',  tier: 'C' },
  'h039': { name: '국립공주대',          phone: '041-850-8114',  tier: 'C' },
  'h054': { name: '경남대학교',          phone: '055-249-2205',  tier: 'C' },
  'h011': { name: '위덕대학교',          phone: '054-760-1000',  tier: 'C' },
  // Tier B — 전화 루트 HC DM 발송 대상 (2026-03-27 추가)
  'h408': { name: '연세대학교(원주캠퍼스)', phone: '033-760-2641', tier: 'B' },
  'h110': { name: '인천대학교',           phone: '032-835-9266', tier: 'B' },
  'h240': { name: '한국관광대학교',        phone: '031-644-1161', tier: 'B' },
  // 기존 신청 완료 기관 (Tier 해당 없음)
  'h051': { name: '부산보건대학교',      phone: '',              tier: '-' },
  'h037': { name: '충북대학교',          phone: '043-261-3559',  tier: '-' },
  'h417': { name: '한국외대(글로벌)',    phone: '',              tier: '-' },
  'h272': { name: '한국영상대학교',      phone: '',              tier: '-' },
};

var FOLLOWUP_SHEET_NAME = 'HC_DM_팔로업트래킹';
var FOLLOWUP_HEADERS = [
  'h코드', '학교명', '최초스캔일', '스캔횟수', '캠페인코드',
  '신청여부', '신청일', '전화번호', '우선순위',
  '전화팔로업결과', '담당자명', '샘플신청Y/N', '비고'
];
// J~M = 인덱스 9~12 (0-based) = 수동 입력 컬럼
var MANUAL_COL_START = 10; // 시트 열 번호 (1-based) = J열
var MANUAL_COL_COUNT = 4;  // J, K, L, M

// ─── 메인 함수 ───
function buildFollowupSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. HC_클릭로그 읽기
  var hcSheet = ss.getSheetByName(SHEET_HC);
  if (!hcSheet) {
    Logger.log('[오류] HC_클릭로그 시트 없음');
    return;
  }
  var hcData = hcSheet.getDataRange().getValues();
  hcData.shift(); // 헤더 제거

  // uid별 집계
  var scanMap = {};
  hcData.forEach(function(row) {
    var ts   = row[0];
    var uid  = String(row[1] || '').trim();
    var camp = String(row[2] || '').trim();
    if (!uid) return;
    if (!scanMap[uid]) {
      scanMap[uid] = { count: 0, firstScan: ts, campaign: camp };
    }
    scanMap[uid].count++;
    if (ts && ts < scanMap[uid].firstScan) scanMap[uid].firstScan = ts;
    if (camp === '2026hc') scanMap[uid].campaign = camp; // 신규 캠페인 우선
  });

  // 2. HC_샘플신청 읽기
  var sampleSheet = ss.getSheetByName(SHEET_HC_SAMPLE);
  var requestMap = {};
  if (sampleSheet) {
    var sampleData = sampleSheet.getDataRange().getValues();
    sampleData.shift(); // 헤더
    sampleData.forEach(function(row) {
      var utm = String(row[1] || '').trim(); // B열: UTM코드
      if (!utm) return;
      requestMap[utm] = { requested: true, requestDate: row[0] };
    });
  }

  // 3. 팔로업 시트 준비
  var followSheet = ss.getSheetByName(FOLLOWUP_SHEET_NAME);
  if (!followSheet) {
    followSheet = ss.insertSheet(FOLLOWUP_SHEET_NAME);
  }

  // ── 수동 입력 컬럼(J~M) 기존 값 보존 ──
  var manualMap = {}; // { uid: [J, K, L, M] }
  var existingLastRow = followSheet.getLastRow();
  if (existingLastRow > 1) {
    var existingKeys = followSheet.getRange(2, 1, existingLastRow - 1, 1).getValues();
    var existingManual = followSheet.getRange(2, MANUAL_COL_START, existingLastRow - 1, MANUAL_COL_COUNT).getValues();
    existingKeys.forEach(function(keyRow, i) {
      var uid = String(keyRow[0] || '').trim();
      if (uid) manualMap[uid] = existingManual[i];
    });
  }

  // 4. 시트 초기화 후 재구성
  followSheet.clearContents();
  followSheet.clearFormats();

  // 헤더
  followSheet.appendRow(FOLLOWUP_HEADERS);
  followSheet.getRange(1, 1, 1, FOLLOWUP_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#e8eaf6');
  followSheet.setFrozenRows(1);

  // 데이터 행 추가
  var uids = Object.keys(scanMap).sort();
  var rows = [];
  uids.forEach(function(uid) {
    var scan = scanMap[uid];
    var req  = requestMap[uid] || {};
    var manual = manualMap[uid] || ['', '', '', ''];
    rows.push([
      uid,
      buildFollowupLookupName_(uid),
      scan.firstScan,
      scan.count,
      scan.campaign,
      req.requested ? '신청완료' : '미신청',
      req.requestDate || '',
      buildFollowupLookupPhone_(uid),
      buildFollowupLookupTier_(uid),
      manual[0], manual[1], manual[2], manual[3]
    ]);
  });

  if (rows.length > 0) {
    followSheet.getRange(2, 1, rows.length, FOLLOWUP_HEADERS.length).setValues(rows);
  }

  // 5. 미신청 행 노란색 강조 (신청완료·수동입력된 행은 녹색)
  buildFollowupHighlight_(followSheet, rows.length);

  // 6. 열 너비 자동 맞춤
  followSheet.autoResizeColumns(1, FOLLOWUP_HEADERS.length);

  SpreadsheetApp.flush();
  var msg = 'HC_DM_팔로업트래킹 생성 완료. 총 ' + uids.length + '개교 (수동입력 보존: ' + Object.keys(manualMap).length + '건)';
  Logger.log(msg);
  return msg;
}

// ─── 강조 표시 ───
function buildFollowupHighlight_(sheet, dataRowCount) {
  if (dataRowCount < 1) return;
  var statusValues = sheet.getRange(2, 6, dataRowCount, 1).getValues(); // F열
  var manualValues = sheet.getRange(2, MANUAL_COL_START, dataRowCount, 1).getValues(); // J열
  for (var i = 0; i < dataRowCount; i++) {
    var status = statusValues[i][0];
    var hasManual = String(manualValues[i][0] || '').trim() !== '';
    var range = sheet.getRange(i + 2, 1, 1, FOLLOWUP_HEADERS.length);
    if (status === '미신청' && !hasManual) {
      range.setBackground('#fff9c4'); // 노란색 — 전화 필요
    } else if (status === '미신청' && hasManual) {
      range.setBackground('#e8f5e9'); // 연녹색 — 전화 완료
    } else {
      range.setBackground(null); // 신청완료 — 배경 없음
    }
  }
}

// ─── 조회 헬퍼 ───
function buildFollowupLookupName_(uid) {
  return HC_FOLLOWUP_MAP[uid] ? HC_FOLLOWUP_MAP[uid].name : uid + '(미매핑)';
}
function buildFollowupLookupPhone_(uid) {
  return HC_FOLLOWUP_MAP[uid] ? HC_FOLLOWUP_MAP[uid].phone : '';
}
function buildFollowupLookupTier_(uid) {
  return HC_FOLLOWUP_MAP[uid] ? HC_FOLLOWUP_MAP[uid].tier : '-';
}

// ─── 트리거 설정 (매일 오전 9시) ───
function buildFollowupSheetSetupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'buildFollowupSheet') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('buildFollowupSheet')
    .timeBased().everyDays(1).atHour(9).create();
  Logger.log('트리거 설정 완료 — 매일 09시 buildFollowupSheet 실행');
}

function buildFollowupSheetRemoveTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'buildFollowupSheet') ScriptApp.deleteTrigger(t);
  });
  Logger.log('트리거 제거 완료');
}
