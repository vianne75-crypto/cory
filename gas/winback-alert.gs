/**
 * APS 윙백서클 내부 알림 — 해피콜 대상 자동 탐지
 *
 * ─ 설치 방법 ─────────────────────────────────────────
 * 1. Google Sheet → 확장 프로그램 → Apps Script
 * 2. + 버튼 → 스크립트 → 이름: "WinbackAlert" 입력
 * 3. 이 코드 전체를 붙여넣기 → 저장
 * 4. winbackSetupTrigger 선택 → ▶ 실행 (1회만)
 *    → 이후 매일 오전 9시 자동 실행됨
 *
 * ─ 주의 (기존 파일과 충돌 방지) ──────────────────────
 * - Code.gs: doPost/doGet (애니빌드 Webhook) ← 건드리지 않음
 * - HcSync.gs: syncHcToSupabase (HC 동기화)  ← 건드리지 않음
 * - 이 파일: winback 접두사 함수만 사용
 * - var 사용 (const 금지 — GAS 호환)
 */

// ─── 설정 ────────────────────────────────────────────
var WINBACK_EMAIL       = 'vianne75@gmail.com';   // 알림 수신 이메일 (대표님)
var WINBACK_SHEET_NAME  = '주문내역';              // Code.gs SHEET_ORDERS와 동일
var WINBACK_COL_DATE    = 1;   // A: order_idx
var WINBACK_COL_REGTIME = 2;   // B: reg_time
var WINBACK_COL_STATE   = 3;   // C: state
var WINBACK_COL_NAME    = 6;   // F: s_name (수신인)
var WINBACK_COL_ADDR    = 8;   // H: addr
var WINBACK_COL_GOODS   = 12;  // L: goods_name
var WINBACK_COL_QTY     = 13;  // M: sale_cnt
var WINBACK_COL_PRICE   = 14;  // N: sale_price
var WINBACK_COL_OPTUSER = 16;  // P: option_user (기관명)

// 윙백 단계 정의 (이 파일에서 확장 가능)
var WINBACK_STAGES = [
  {
    step: 1,
    label: '① 현장 지원 해피콜',
    minDay: 3,
    maxDay: 5,
    desc: '배송 후 첫 활용 시점 — 활용 시작 확인 + 현장 반응 지원',
    agent: 'BOND 가온',
    script: [
      '"안녕하세요, APS입니다. 주문하신 제품 잘 받으셨나요?"',
      '"이번 주 교육 일정이 잡혀 계신가요?"',
      '"혹시 활용 방법 관련해서 궁금하신 점 있으시면 알려주세요."'
    ]
  },
  {
    step: 2,
    label: '② 효과 측정 해피콜',
    minDay: 12,
    maxDay: 16,
    desc: '교육 실시 후 효과 측정 — 보고서 양식 지원',
    agent: 'FORGE 벼리 + BOND 가온',
    script: [
      '"교육 진행하셨나요? 참여자 반응이 어떠셨는지 여쭤봐도 될까요?"',
      '"결과 보고서 작성에 도움이 되는 양식을 보내드릴게요."'
    ]
  }
];

// ─── 메인: 일일 해피콜 체크 ──────────────────────────
function winbackDailyCheck() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var allTargets = [];

  WINBACK_STAGES.forEach(function(stage) {
    var targets = winbackFindOrders_(today, stage.minDay, stage.maxDay);
    if (targets.length > 0) {
      allTargets.push({ stage: stage, targets: targets });
    }
  });

  if (allTargets.length === 0) {
    Logger.log('[WinbackAlert] ' + winbackFmtDate_(today) + ' — 해피콜 대상 없음');
    return;
  }

  winbackSendEmail_(today, allTargets);
  winbackWriteLog_(today, allTargets);
}

// ─── 주문내역 시트에서 D+N 대상 탐색 ────────────────
function winbackFindOrders_(today, minDay, maxDay) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(WINBACK_SHEET_NAME);
  if (!sheet) {
    Logger.log('[WinbackAlert] 시트 없음: ' + WINBACK_SHEET_NAME);
    return [];
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // 헤더만 있는 경우

  var targets = [];
  var now = today.getTime();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    // 취소/환불 제외
    var state = String(row[WINBACK_COL_STATE - 1] || '');
    if (state.indexOf('취소') >= 0 || state.indexOf('환불') >= 0) continue;

    // reg_time 파싱 (yyyy-MM-dd HH:mm:ss 형식)
    var regTimeStr = String(row[WINBACK_COL_REGTIME - 1] || '');
    if (!regTimeStr) continue;
    var orderDate = winbackParseDate_(regTimeStr);
    if (!orderDate) continue;

    // 경과일 계산
    var elapsed = Math.floor((now - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    if (elapsed < minDay || elapsed > maxDay) continue;

    // 기관명: option_user 우선, 없으면 s_name
    var instName = String(row[WINBACK_COL_OPTUSER - 1] || '').trim()
                || String(row[WINBACK_COL_NAME - 1] || '').trim()
                || '(이름 없음)';

    targets.push({
      orderId:   String(row[WINBACK_COL_DATE - 1] || ''),
      name:      instName,
      addr:      String(row[WINBACK_COL_ADDR - 1] || '').slice(0, 20),
      goods:     String(row[WINBACK_COL_GOODS - 1] || ''),
      qty:       Number(row[WINBACK_COL_QTY - 1] || 0),
      amount:    Number(row[WINBACK_COL_PRICE - 1] || 0),
      orderDate: winbackFmtDate_(orderDate),
      elapsed:   elapsed
    });
  }

  return targets;
}

// ─── 이메일 발송 ──────────────────────────────────────
function winbackSendEmail_(today, allTargets) {
  var dateStr = winbackFmtDate_(today);
  var totalCount = allTargets.reduce(function(s, g) { return s + g.targets.length; }, 0);

  var subject = '[APS 해피콜 알림] ' + dateStr + ' — 총 ' + totalCount + '건';

  var html = '<div style="font-family:Apple SD Gothic Neo,Malgun Gothic,sans-serif;max-width:680px;margin:0 auto">';
  html += '<div style="background:#1a237e;color:white;padding:20px 24px;border-radius:8px 8px 0 0">';
  html += '<h2 style="margin:0;font-size:18px">📞 APS 해피콜 알림</h2>';
  html += '<p style="margin:4px 0 0;opacity:0.8;font-size:13px">' + dateStr + ' 기준 · 총 ' + totalCount + '건</p>';
  html += '</div>';

  allTargets.forEach(function(group) {
    var stage = group.stage;
    var targets = group.targets;

    html += '<div style="background:white;border:1px solid #e0e0e0;border-top:none;padding:20px 24px">';
    html += '<h3 style="margin:0 0 4px;color:#1a237e;font-size:15px">' + stage.label + '</h3>';
    html += '<p style="margin:0 0 8px;font-size:12px;color:#666">' + stage.desc + '</p>';
    html += '<p style="margin:0 0 12px;font-size:12px;color:#888">담당: ' + stage.agent + '</p>';

    // 통화 스크립트
    html += '<div style="background:#f3f4f6;border-radius:6px;padding:12px;margin-bottom:16px">';
    html += '<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#555">💬 통화 스크립트</p>';
    stage.script.forEach(function(line) {
      html += '<p style="margin:2px 0;font-size:12px;color:#333">' + line + '</p>';
    });
    html += '</div>';

    // 대상 기관 테이블
    html += '<table style="width:100%;border-collapse:collapse;font-size:13px">';
    html += '<thead><tr style="background:#f5f5f5">';
    ['기관명', '주소', '제품', '수량', '금액', '주문일', 'D+일수'].forEach(function(th) {
      html += '<th style="padding:7px 10px;text-align:left;border-bottom:1px solid #ddd;font-weight:600;color:#555;white-space:nowrap">' + th + '</th>';
    });
    html += '</tr></thead><tbody>';

    targets.forEach(function(t, idx) {
      var bg = idx % 2 === 0 ? 'white' : '#fafafa';
      var amountStr = t.amount > 0 ? (t.amount / 10000).toFixed(0) + '만원' : '-';
      html += '<tr style="background:' + bg + '">';
      html += '<td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-weight:600">' + t.name + '</td>';
      html += '<td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;color:#666;font-size:12px">' + t.addr + '</td>';
      html += '<td style="padding:7px 10px;border-bottom:1px solid #f0f0f0">' + t.goods + '</td>';
      html += '<td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center">' + t.qty + '개</td>';
      html += '<td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:right">' + amountStr + '</td>';
      html += '<td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#888">' + t.orderDate + '</td>';
      html += '<td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center">';
      html += '<span style="background:#1976D2;color:white;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700">D+' + t.elapsed + '</span>';
      html += '</td></tr>';
    });

    html += '</tbody></table></div>';
  });

  // 푸터
  html += '<div style="background:#f8f8f8;border:1px solid #e0e0e0;border-top:none;padding:12px 24px;border-radius:0 0 8px 8px">';
  html += '<p style="margin:0;font-size:11px;color:#aaa">APS 윙백서클 자동 알림 · 문의: cory CRM 대시보드</p>';
  html += '</div></div>';

  GmailApp.sendEmail(WINBACK_EMAIL, subject, '', { htmlBody: html });
  Logger.log('[WinbackAlert] 이메일 발송 완료: ' + subject);
}

// ─── 알림 로그 시트 기록 ─────────────────────────────
function winbackWriteLog_(today, allTargets) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName('해피콜_로그');

  if (!logSheet) {
    logSheet = ss.insertSheet('해피콜_로그');
    logSheet.appendRow(['알림일시', '단계', '기관명', '주문번호', '제품', '수량', '금액', '주문일', 'D+일수']);
    logSheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    logSheet.setFrozenRows(1);
  }

  var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
  allTargets.forEach(function(group) {
    group.targets.forEach(function(t) {
      logSheet.appendRow([
        now,
        group.stage.label,
        t.name,
        t.orderId,
        t.goods,
        t.qty,
        t.amount,
        t.orderDate,
        'D+' + t.elapsed
      ]);
    });
  });
}

// ─── 트리거 설정/해제 ────────────────────────────────
function winbackSetupTrigger() {
  // 기존 winback 트리거 모두 제거 (중복 방지)
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'winbackDailyCheck') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 매일 오전 9시 실행
  ScriptApp.newTrigger('winbackDailyCheck')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .inTimezone('Asia/Seoul')
    .create();

  Logger.log('[WinbackAlert] 트리거 설정 완료: 매일 오전 9시');
  SpreadsheetApp.getUi().alert('✅ 해피콜 알림 설정 완료\n매일 오전 9시에 자동 실행됩니다.');
}

function winbackRemoveTrigger() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'winbackDailyCheck') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });
  Logger.log('[WinbackAlert] 트리거 ' + removed + '개 제거');
  SpreadsheetApp.getUi().alert('트리거 ' + removed + '개 제거 완료');
}

// 즉시 테스트 실행 (오늘 대상 확인용)
function winbackTestRun() {
  winbackDailyCheck();
  SpreadsheetApp.getUi().alert('테스트 실행 완료. 이메일 확인 또는 로그 시트를 확인하세요.');
}

// ─── 유틸 ─────────────────────────────────────────────
function winbackParseDate_(str) {
  if (!str) return null;
  // "yyyy-MM-dd HH:mm:ss" 또는 "yyyy-MM-dd" 형식 처리
  var m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  var d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  d.setHours(0, 0, 0, 0);
  return d;
}

function winbackFmtDate_(d) {
  return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd');
}
