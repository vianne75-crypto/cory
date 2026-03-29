/**
 * HC (대학보건관리자) Google Sheet → Supabase 자동 동기화
 *
 * 설치 방법:
 * 1. Google Sheet → 확장 프로그램 → Apps Script
 * 2. 기존 Code.gs 옆에 새 파일 추가: + → 스크립트 → 이름: "HcSync"
 * 3. 이 코드를 HcSync.gs에 붙여넣기 (기존 Code.gs는 건드리지 않음!)
 * 4. 저장 → 실행 (syncHcToSupabase 함수 선택) → 권한 승인
 * 5. 시트 새로고침 → 메뉴에 "HC 동기화" 추가됨
 *
 * 주의: 기존 DM추적 스크립트(Code.gs)와 같은 프로젝트에 공존
 *   - 기존 Code.gs: doGet/doPost (QR스캔 + 샘플신청 웹앱)
 *   - 이 파일: syncHcToSupabase (기관 데이터 → Supabase 동기화)
 *   - 변수명 충돌 없음, onOpen()도 기존에 없으므로 안전
 */

// ─── 설정 (기존 Code.gs와 변수명 겹치지 않음) ───
var SYNC_WORKER_URL = 'https://aps-webhook.vianne75.workers.dev';
var SYNC_HC_SHEET = '학생건강센터';       // HC 기관 데이터 탭 (gid=1088038092)
var SYNC_HC_CLICK = 'HC_클릭로그';        // QR 스캔 로그 탭
var SYNC_HC_SAMPLE = 'HC_샘플신청';       // 샘플 신청 로그 탭
var SYNC_HC_FOLLOWUP = 'HC_팔로업';       // HC 팔로업 메모 탭 (HUNTER 다래 입력)

var SYNC_REGION_MAP = {
  '서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시',
  '인천': '인천광역시', '광주': '광주광역시', '대전': '대전광역시',
  '울산': '울산광역시', '세종': '세종특별자치시', '경기': '경기도',
  '강원': '강원특별자치도', '충북': '충청북도', '충남': '충청남도',
  '전북': '전북특별자치도', '전남': '전라남도', '경북': '경상북도',
  '경남': '경상남도', '제주': '제주특별자치도',
};

// ─── 커스텀 메뉴 (기존 Code.gs에 onOpen 없으므로 안전) ───
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('HC 동기화')
    .addItem('Supabase 동기화 실행', 'syncHcToSupabase')
    .addSeparator()
    .addItem('자동 동기화 설정 (1시간)', 'setupSyncTrigger')
    .addItem('자동 동기화 해제', 'removeSyncTrigger')
    .addToUi();

  ui.createMenu('HC 팔로업')
    .addItem('팔로업 동기화 실행 (신규만)', 'syncHcFollowups')
    .addSeparator()
    .addItem('자동 동기화 설정 (매일 오전 9시)', 'setupFollowupTrigger')
    .addItem('자동 동기화 해제', 'removeFollowupTrigger')
    .addToUi();

  ui.createMenu('윙백 알림')
    .addItem('오늘 해피콜 대상 즉시 확인', 'winbackTestRun')
    .addSeparator()
    .addItem('매일 자동 알림 설정 (오전 9시)', 'winbackSetupTrigger')
    .addItem('자동 알림 해제', 'winbackRemoveTrigger')
    .addToUi();
}

// ─── 메인: 기관 데이터 + QR/샘플 응답 → Supabase ───
function syncHcToSupabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1) 기관 데이터 동기화
  var instResult = syncInstitutionData_(ss);

  // 2) QR 클릭 + 샘플신청 카운트 집계 → Worker에 전달
  var responseResult = syncResponseData_(ss);

  // 결과 알림
  var msg = 'HC 동기화 완료\n\n';
  if (instResult) {
    msg += '[기관 데이터]\n'
      + '전체: ' + (instResult.total || 0) + '건\n'
      + '신규: ' + (instResult.inserted || 0) + '건\n'
      + '업데이트: ' + (instResult.updated || 0) + '건\n'
      + '변경없음: ' + (instResult.unchanged || 0) + '건\n\n';
  }
  if (responseResult) {
    msg += '[응답 추적]\n'
      + 'QR스캔: ' + (responseResult.qr_count || 0) + '건\n'
      + '샘플신청: ' + (responseResult.sample_count || 0) + '건\n'
      + '단계 업데이트: ' + (responseResult.stage_updated || 0) + '건';
  }

  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { /* 트리거 실행 시 무시 */ }
}

// ─── 기관 데이터 동기화 ───
function syncInstitutionData_(ss) {
  var sheet = ss.getSheetByName(SYNC_HC_SHEET);
  if (!sheet) {
    // gid로 찾기
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() === 1088038092) { sheet = sheets[i]; break; }
    }
  }
  if (!sheet) { Logger.log('HC 시트 없음: ' + SYNC_HC_SHEET); return null; }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var headers = data[0].map(function (h) { return String(h).trim(); });
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    headers.forEach(function (h, idx) { row[h] = String(data[i][idx] || '').trim(); });

    if (row['DM발송대상'] !== 'Y') continue;
    var name = row['학교명'];
    if (!name) continue;

    var regionShort = row['소재지역'];
    var region = SYNC_REGION_MAP[regionShort] || '';
    var addr = row['주소'] || '';
    var district = syncParseDistrict_(addr);
    var hasPurchase = row['알쓰패치구매이력'] === 'Y';
    var totalQty = parseInt(row['총구매수량'] || '0') || 0;

    records.push({
      name: name,
      type: '대학보건센터',
      region: region,
      district: district,
      purchase_stage: (hasPurchase && totalQty > 0) ? '구매' : '관심',
      purchase_amount: hasPurchase ? totalQty * 800 : 0,
      purchase_volume: totalQty,
      products: hasPurchase ? ['알쓰패치'] : [],
      last_purchase_date: row['최근구매일'] || '-',
      metadata: {
        school_type: row['학교유형'] || '',
        category: row['구분'] || '',
        target_dept: row['타겟부서'] || '',
        proposal_point: row['제안포인트'] || '',
        contact_name: row['담당자명'] || '',
        contact_phone: row['건강센터연락처'] || '',
        recipient: row['수신자'] || '',
        utm_code: row['UTM고유번호'] || '',
        website: row['추출url'] || '',
        postal_code: row['우편번호'] || '',
        address: addr,
        address2: row['주소2'] || '',
        dm_sent: row['DM발송여부'] || '',
        dm_target: row['DM발송대상'] || '',
        priority: row['우선순위'] || '',
        note: row['비고'] || '',
      }
    });
  }

  Logger.log('기관 동기화 대상: ' + records.length + '건');
  if (records.length === 0) return null;

  // Cloudflare Workers subrequest 제한(50회) 우회: 20건씩 배치 전송
  var BATCH_SIZE = 20;
  var totalResult = { success: true, total: records.length, inserted: 0, updated: 0, unchanged: 0 };

  for (var b = 0; b < records.length; b += BATCH_SIZE) {
    var batch = records.slice(b, b + BATCH_SIZE);
    var resp = UrlFetchApp.fetch(SYNC_WORKER_URL + '/sync-hc-institutions', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(batch),
      muteHttpExceptions: true
    });

    var result = JSON.parse(resp.getContentText());
    if (result.error) {
      Logger.log('배치 ' + (b / BATCH_SIZE + 1) + ' 오류: ' + result.error);
      continue;
    }
    totalResult.inserted += (result.inserted || 0);
    totalResult.updated += (result.updated || 0);
    totalResult.unchanged += (result.unchanged || 0);
  }

  Logger.log('기관 동기화 결과: ' + JSON.stringify(totalResult));
  return totalResult;
}

// ─── QR 클릭 + 샘플신청 응답 → purchase_stage 업데이트 ───
function syncResponseData_(ss) {
  // UTM코드 → 학교명 매핑 (기관 시트에서)
  var instSheet = ss.getSheetByName(SYNC_HC_SHEET);
  if (!instSheet) return null;

  var instData = instSheet.getDataRange().getValues();
  var instHeaders = instData[0].map(function (h) { return String(h).trim(); });
  var utmIdx = instHeaders.indexOf('UTM고유번호');
  var nameIdx = instHeaders.indexOf('학교명');
  if (utmIdx < 0 || nameIdx < 0) return null;

  var utmToName = {};
  for (var i = 1; i < instData.length; i++) {
    var utm = String(instData[i][utmIdx] || '').trim();
    var name = String(instData[i][nameIdx] || '').trim();
    if (utm && name) utmToName[utm] = name;
  }

  // QR 클릭 로그에서 고유 UTM 수집
  var qrUtms = {};
  var qrSheet = ss.getSheetByName(SYNC_HC_CLICK);
  var qrCount = 0;
  if (qrSheet && qrSheet.getLastRow() > 1) {
    var qrData = qrSheet.getDataRange().getValues();
    for (var i = 1; i < qrData.length; i++) {
      var utm = String(qrData[i][1] || '').trim(); // B열: UTM코드
      if (utm) { qrUtms[utm] = true; qrCount++; }
    }
  }

  // 샘플신청 로그에서 고유 UTM 수집
  var sampleUtms = {};
  var sampleSheet = ss.getSheetByName(SYNC_HC_SAMPLE);
  var sampleCount = 0;
  if (sampleSheet && sampleSheet.getLastRow() > 1) {
    var sampleData = sampleSheet.getDataRange().getValues();
    for (var i = 1; i < sampleData.length; i++) {
      var utm = String(sampleData[i][1] || '').trim(); // B열: UTM코드
      if (utm) { sampleUtms[utm] = true; sampleCount++; }
    }
  }

  // 단계 업데이트 데이터 구성
  var stageUpdates = [];

  // 샘플신청한 기관 → '고려'
  for (var utm in sampleUtms) {
    var name = utmToName[utm];
    if (name) stageUpdates.push({ name: name, purchase_stage: '고려', reason: '샘플신청' });
  }

  // QR만 스캔한 기관 (샘플신청은 안 한) → '관심' 유지 (이미 관심이므로 변경 불필요)
  // → QR스캔만으로는 단계 변경하지 않음 (이미 DM발송=관심)

  if (stageUpdates.length === 0) {
    return { qr_count: qrCount, sample_count: sampleCount, stage_updated: 0 };
  }

  // Worker로 단계 업데이트 요청
  var resp = UrlFetchApp.fetch(SYNC_WORKER_URL + '/sync-hc-institutions', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(stageUpdates),
    muteHttpExceptions: true
  });

  var result = JSON.parse(resp.getContentText());
  Logger.log('응답 추적 결과: ' + JSON.stringify(result));

  return {
    qr_count: qrCount,
    sample_count: sampleCount,
    stage_updated: result.updated || 0
  };
}

// ─── 주소 파싱 (기존 parseDistrict와 이름 충돌 방지) ───
function syncParseDistrict_(addr) {
  if (!addr) return null;
  var parts = addr.trim().split(/\s+/);
  if (parts.length >= 2) {
    var d = parts[1];
    if (d.endsWith('시') || d.endsWith('군') || d.endsWith('구')) return d;
  }
  return null;
}

// ─── 자동 동기화 트리거 (이름 충돌 방지: setup/removeSyncTrigger) ───
function setupSyncTrigger() {
  removeSyncTrigger();
  ScriptApp.newTrigger('syncHcToSupabase')
    .timeBased()
    .everyHours(1)
    .create();
  Logger.log('자동 동기화 트리거 설정 (1시간)');
  SpreadsheetApp.getUi().alert('자동 동기화 설정 완료\n1시간마다 Supabase에 동기화됩니다.');
}

function removeSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncHcToSupabase') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

// ─── HC 팔로업 동기화 (HC_팔로업 탭 → Supabase consultations) ───
// 컬럼 구조 (A~H): utm_code | 기관명 | 담당자 | 통화일 | 반응온도 | 교육일정 | 다음연락 | 메모
function syncHcFollowups() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SYNC_HC_FOLLOWUP);
  if (!sheet) {
    Logger.log('HC_팔로업 시트 없음');
    try { SpreadsheetApp.getUi().alert('HC_팔로업 탭이 없습니다.\nHUNTER 다래에게 탭 추가를 요청하세요.'); } catch (e) {}
    return;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    Logger.log('HC_팔로업 데이터 없음 (헤더만 존재)');
    try { SpreadsheetApp.getUi().alert('팔로업 데이터가 없습니다.'); } catch (e) {}
    return;
  }

  // 마지막 동기화 행 확인 (중복 삽입 방지)
  var props = PropertiesService.getScriptProperties();
  var lastSyncedRow = parseInt(props.getProperty('HC_FOLLOWUP_LAST_ROW') || '1');

  // 헤더(0번)를 제외하고 lastSyncedRow 이후 새 행만 처리
  var newRows = data.slice(Math.max(1, lastSyncedRow));
  if (newRows.length === 0) {
    Logger.log('HC_팔로업 새 데이터 없음 (lastSyncedRow=' + lastSyncedRow + ')');
    try { SpreadsheetApp.getUi().alert('새 팔로업 데이터가 없습니다.\n이미 모두 동기화되었습니다.'); } catch (e) {}
    return;
  }

  var records = [];
  for (var i = 0; i < newRows.length; i++) {
    var r = newRows[i];
    var instName = String(r[1] || '').trim();  // B열: 기관명
    var callDate = String(r[3] || '').trim();  // D열: 통화일
    if (!instName || !callDate) continue;       // 필수 필드 없으면 건너뜀

    var reaction = String(r[4] || '').trim();
    var reactionTag = reaction === '긍정' ? '긍정반응' : reaction === '부정' ? '부정반응' : '보통반응';
    var schedule = String(r[5] || '없음').trim() || '없음';
    var nextContact = String(r[6] || '불필요').trim() || '불필요';
    var memo = String(r[7] || '').trim();

    // CF Worker syncConsultations는 content의 [태그] 문자열에서 tags를 추출
    var content = '[HC팔로업][' + reactionTag + '] 반응:' + (reaction || '-')
      + ' | 교육일정:' + schedule
      + ' | 다음연락:' + nextContact
      + (memo ? ' | ' + memo : '');

    records.push({
      consultant: instName,                              // CF Worker 기관 매칭 필드
      md: String(r[2] || 'HUNTER 다래').trim(),         // CF Worker md_name 필드
      date: callDate,
      content: content,
    });
  }

  if (records.length === 0) {
    Logger.log('유효한 HC_팔로업 레코드 없음 (기관명·통화일 필수)');
    try { SpreadsheetApp.getUi().alert('유효한 데이터가 없습니다.\n기관명(B열)과 통화일(D열)을 확인하세요.'); } catch (e) {}
    return;
  }

  Logger.log('HC_팔로업 동기화 대상: ' + records.length + '건');

  var resp = UrlFetchApp.fetch(SYNC_WORKER_URL + '/sync-consultations', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(records),
    muteHttpExceptions: true,
  });

  var result = JSON.parse(resp.getContentText());
  Logger.log('HC_팔로업 동기화 결과: ' + JSON.stringify(result));

  if (result.error) {
    Logger.log('동기화 오류: ' + result.error);
    try { SpreadsheetApp.getUi().alert('동기화 오류: ' + result.error); } catch (e) {}
    return;
  }

  // 성공 시 처리된 마지막 행 번호 저장 (다음 실행에서 중복 방지)
  props.setProperty('HC_FOLLOWUP_LAST_ROW', String(data.length));

  var msg = 'HC 팔로업 동기화 완료\n\n'
    + '신규 행: ' + newRows.length + '건\n'
    + '저장: ' + (result.inserted || 0) + '건\n'
    + '기관 매칭: ' + (result.matched || 0) + '건';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}

  return result;
}

// ─── 팔로업 자동 동기화 트리거 (매일 오전 9시) ───
function setupFollowupTrigger() {
  removeFollowupTrigger();
  ScriptApp.newTrigger('syncHcFollowups')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  Logger.log('팔로업 자동 동기화 트리거 설정 (매일 오전 9시)');
  try { SpreadsheetApp.getUi().alert('팔로업 자동 동기화 설정 완료\n매일 오전 9시에 실행됩니다.'); } catch (e) {}
}

function removeFollowupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncHcFollowups') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}
