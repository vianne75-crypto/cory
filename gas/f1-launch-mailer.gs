/**
 * F1 Standard 출시 안내 이메일 일괄 발송 (L8)
 * 대상: purchase_stage = '구매' · '만족' · '추천' 기관 (152개소)
 * 발송일: 2026-04-20 오전 (F1 출시 당일)
 *
 * ─ 설치 방법 ──────────────────────────────────────────
 * 1. Google Sheet → 확장 프로그램 → Apps Script
 * 2. + 버튼 → 스크립트 파일 → 이름: "F1LaunchMailer"
 * 3. 이 코드 전체 붙여넣기 → 저장
 * 4. SUPABASE_ANON_KEY 값 채워넣기 (_SECRET/cory-credentials.md)
 * 5. f1LaunchTest() 실행 → 대상 기관 목록 로그 확인
 * 6. 이상 없으면 f1LaunchSendAll() 실행
 *
 * ─ 주의 ────────────────────────────────────────────────
 * - var 사용 (const 금지 — GAS 호환)
 * - 기존 Code.gs / HcSync.gs / WinbackAlert.gs 건드리지 않음
 * - 함수명 f1Launch 접두사 사용 (충돌 방지)
 */

// ─── 설정 ─────────────────────────────────────────────
var F1_SUPABASE_URL      = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co';
var F1_SUPABASE_ANON_KEY = 'sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU';

var F1_SENDER_EMAIL = 'vianne75@gmail.com'; // 발신자 (Gmail 계정)
var F1_SENDER_NAME  = 'APS 알쓰패치솔루션';
var F1_TARGET_STAGES = ['구매', '만족', '추천'];
var F1_LOG_SHEET_NAME = 'F1출시_발송로그';

// ─── 1. 테스트 실행 (발송 전 목록 확인) ──────────────
function f1LaunchTest() {
  var institutions = f1FetchTargets_();
  Logger.log('[F1Launch] 총 대상: ' + institutions.length + '건');

  var emailCount = 0;
  institutions.forEach(function(inst) {
    var email = f1GetEmail_(inst);
    if (email) emailCount++;
    Logger.log('[F1Launch] id=' + inst.id + ' | ' + inst.name + ' | email=' + (email || '없음') + ' | stage=' + inst.purchase_stage);
  });

  Logger.log('[F1Launch] 이메일 보유: ' + emailCount + '건 / 전체: ' + institutions.length + '건');
  SpreadsheetApp.getUi().alert(
    '✅ 대상 기관 확인\n전체: ' + institutions.length + '건\n이메일 보유: ' + emailCount + '건\n\n로그 확인 후 f1LaunchSendAll() 실행'
  );
}

// ─── 2. 전체 발송 ──────────────────────────────────────
function f1LaunchSendAll() {
  if (!F1_SUPABASE_ANON_KEY) {
    SpreadsheetApp.getUi().alert('❌ SUPABASE_ANON_KEY가 비어 있습니다. 설정 후 재실행.');
    return;
  }

  var institutions = f1FetchTargets_();
  var sent = 0, skipped = 0, noEmail = 0;
  var logRows = [];

  institutions.forEach(function(inst) {
    var email = f1GetEmail_(inst);
    if (!email) {
      noEmail++;
      logRows.push([new Date(), inst.id, inst.name, inst.purchase_stage, '', 'NO_EMAIL', '']);
      return;
    }

    // 중복 발송 방지: 로그 시트 확인
    if (f1AlreadySent_(inst.id)) {
      skipped++;
      logRows.push([new Date(), inst.id, inst.name, inst.purchase_stage, email, 'SKIPPED', '이미 발송됨']);
      return;
    }

    try {
      var contact = (inst.metadata && inst.metadata.contact_name) ? inst.metadata.contact_name : '담당자';
      var subject = '[APS] ' + inst.name + ' 선생님, 패치 체험 후 교육을 이어가는 방법';
      var html = f1BuildEmailHtml_(inst.name, contact);
      GmailApp.sendEmail(email, subject, '', {
        name: F1_SENDER_NAME,
        htmlBody: html,
        replyTo: F1_SENDER_EMAIL
      });
      sent++;
      logRows.push([new Date(), inst.id, inst.name, inst.purchase_stage, email, 'SENT', '']);
      Utilities.sleep(500); // 초당 2건 제한
    } catch (e) {
      logRows.push([new Date(), inst.id, inst.name, inst.purchase_stage, email, 'ERROR', e.message]);
    }
  });

  f1WriteLog_(logRows);
  var msg = '발송 완료\n발송: ' + sent + '건\n건너뜀(중복): ' + skipped + '건\n이메일 없음: ' + noEmail + '건';
  Logger.log('[F1Launch] ' + msg);
  SpreadsheetApp.getUi().alert('✅ ' + msg);
}

// ─── Supabase 기관 목록 조회 ──────────────────────────
function f1FetchTargets_() {
  var stageFilter = F1_TARGET_STAGES.map(function(s) { return 'purchase_stage.eq.' + s; }).join(',');
  var url = F1_SUPABASE_URL + '/rest/v1/institutions?or=(' + stageFilter + ')&select=id,name,purchase_stage,metadata&limit=500';

  var options = {
    method: 'GET',
    headers: {
      'apikey': F1_SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + F1_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  var resp = UrlFetchApp.fetch(url, options);
  if (resp.getResponseCode() !== 200) {
    Logger.log('[F1Launch] Supabase 조회 실패: ' + resp.getContentText());
    return [];
  }

  return JSON.parse(resp.getContentText()) || [];
}

// ─── 이메일 추출 (metadata.contact_email 우선) ────────
function f1GetEmail_(inst) {
  var m = inst.metadata || {};
  var email = m.contact_email || m.email || '';
  // 간단한 형식 검증
  if (!email || email.indexOf('@') < 0) return '';
  return email.trim().toLowerCase();
}

// ─── HTML 이메일 생성 ─────────────────────────────────
function f1BuildEmailHtml_(instName, contactName) {
  var html = '';
  html += '<div style="font-family:Apple SD Gothic Neo,Malgun Gothic,sans-serif;max-width:620px;margin:0 auto;color:#333;">';

  // 헤더
  html += '<div style="background:#1a237e;color:white;padding:24px 28px;border-radius:8px 8px 0 0;">';
  html += '<p style="margin:0 0 4px;font-size:12px;opacity:0.7;">APS 알쓰패치솔루션</p>';
  html += '<h2 style="margin:0;font-size:20px;font-weight:700;">F1 금주 교육 키트 출시</h2>';
  html += '</div>';

  // 본문
  html += '<div style="background:white;border:1px solid #e0e0e0;border-top:none;padding:28px;">';
  html += '<p style="margin:0 0 16px;">' + contactName + ' 선생님, 안녕하세요.<br>APS 알쓰패치솔루션입니다.</p>';
  html += '<p style="margin:0 0 20px;color:#555;">"체험은 잘 되는데, 그다음 교육을 어떻게 해야 할지 모르겠어요."<br>기존 기관 선생님들의 가장 많은 질문이었습니다.</p>';
  html += '<p style="margin:0 0 20px;">이 고민을 해결하기 위해, 패치 체험 후 바로 이어서 쓸 수 있는<br><strong>F1 금주 교육 키트를 출시했습니다.</strong></p>';

  // 키트 구성
  html += '<div style="background:#f5f7ff;border-left:4px solid #1a237e;border-radius:4px;padding:16px 20px;margin:0 0 16px;">';
  html += '<p style="margin:0 0 10px;font-weight:700;color:#1a237e;">📦 F1 Standard 금주 교육 키트 (6종)</p>';
  var items = [
    '절주 목표 설정 워크시트 — 참여자가 직접 작성',
    '폭음 위험 인포그래픽 — 부스·교육장 게시용 (A2)',
    '절주 행동변화 가이드 PPT — 7장, 강의 즉시 활용',
    '상담 참조카드 — 체질별 상담 멘트 (A5 양면)',
    '교육자료 활용 가이드 — 현장 세팅 5분 완료',
    '교육 효과 측정지 — QR로 사전/사후 인식 변화 측정'
  ];
  items.forEach(function(item, i) {
    html += '<p style="margin:4px 0;font-size:14px;">✅ ' + item + '</p>';
  });
  html += '</div>';

  // 레퍼런스
  html += '<p style="margin:0 0 20px;font-size:13px;color:#555;background:#fff8e1;padding:10px 14px;border-radius:4px;">📌 전국 104개 보건소 + 한화큐셀·GC녹십자 등 도입</p>';

  // 가격
  html += '<div style="border:2px solid #1a237e;border-radius:6px;padding:14px 20px;margin:0 0 20px;text-align:center;">';
  html += '<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a237e;">💰 패치 100매 + 자료 6종 = 65만원</p>';
  html += '<p style="margin:0;font-size:13px;color:#666;">(패치 단품 대비 +15만원으로 교육 풀셋 제공)</p>';
  html += '</div>';

  // CTA
  html += '<p style="margin:0 0 8px;">👉 <a href="https://aps7.net/f1" style="color:#1a237e;font-weight:700;">키트 상세 보기: aps7.net/f1</a></p>';
  html += '<p style="margin:0 0 20px;">👉 <strong>견적서 또는 샘플 1부 무료 발송</strong>: 이 메일에 답장 부탁드립니다.</p>';
  html += '<p style="margin:0 0 4px;font-size:13px;color:#888;">' + instName + '에 소중한 인연이 이어지길 바랍니다.</p>';
  html += '<p style="margin:0;font-size:13px;">감사합니다.</p>';
  html += '</div>';

  // 푸터
  html += '<div style="background:#f8f8f8;border:1px solid #e0e0e0;border-top:none;padding:14px 28px;border-radius:0 0 8px 8px;">';
  html += '<p style="margin:0;font-size:12px;color:#888;">APS 알쓰패치솔루션 · 📞 1544-5291 · 🌐 aps7.net</p>';
  html += '<p style="margin:4px 0 0;font-size:11px;color:#bbb;">수신 거부를 원하시면 답장으로 알려주세요.</p>';
  html += '</div>';
  html += '</div>';

  return html;
}

// ─── 3. 카카오·전화 발송 대상 시트 출력 ──────────────
// 이메일 없는 기관 목록 → 'F1출시_카카오발송' 시트에 기록
// 대표님이 이 시트를 보며 카카오톡 수동 발송
function f1ExportKakaoList() {
  var institutions = f1FetchTargets_();
  var rows = [];

  institutions.forEach(function(inst) {
    var email = f1GetEmail_(inst);
    if (email) return; // 이메일 있는 곳은 제외 (이메일로 발송됨)

    var m = inst.metadata || {};
    var contact = m.contact_name || '';
    var phone   = m.contact_phone || m.contact_mobile || '';
    var address = m.address || '';

    rows.push([
      inst.id,
      inst.name,
      inst.purchase_stage,
      contact,
      phone,
      address,
      '', // 발송 완료 여부 (대표님이 직접 체크)
      ''  // 비고
    ]);
  });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = 'F1출시_카카오발송';
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(sheetName);

  sheet.appendRow(['기관ID', '기관명', '퍼널단계', '담당자명', '전화번호', '주소', '발송완료', '비고']);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#1a237e').setFontColor('white');
  sheet.setFrozenRows(1);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
    // 발송완료 컬럼 체크박스
    sheet.getRange(2, 7, rows.length, 1).insertCheckboxes();
  }

  // 카카오 카피 참조용 별도 시트
  var copySheet = ss.getSheetByName('F1_카카오카피');
  if (!copySheet) {
    copySheet = ss.insertSheet('F1_카카오카피');
    copySheet.getRange('A1').setValue('카카오 발송 문구 (300자 이내)');
    copySheet.getRange('A1').setFontWeight('bold');
    copySheet.getRange('A2').setValue(
      '[알쓸패치 교육 키트 출시]\n\n{담당자명} 선생님, APS입니다.\n\n' +
      '"패치 체험 후 교육을 어떻게 이어가야 할까?"\n' +
      '이 고민을 해결하는 F1 금주 교육 키트를 출시했습니다.\n\n' +
      '✅ 절주 목표 워크시트\n' +
      '✅ 폭음 위험 인포그래픽\n' +
      '✅ 행동변화 가이드 PPT\n' +
      '✅ 상담 참조카드\n' +
      '✅ 교육자료 활용 가이드\n' +
      '✅ 교육 효과 측정지 (QR)\n\n' +
      '📌 전국 104개 보건소 + 한화큐셀·GC녹십자 등 도입\n\n' +
      '패치 100매 + 자료 6종 = 65만원\n' +
      '견적서 또는 샘플 1부 무료 발송 → 답장 부탁드립니다.\n\n' +
      'APS 알쓰패치솔루션 | 1544-5291'
    );
    copySheet.setColumnWidth(1, 400);
    copySheet.getRange('A2').setWrap(true);
  }

  var msg = '카카오 발송 대상: ' + rows.length + '건\n「F1출시_카카오발송」시트를 확인하세요.\n카피는 「F1_카카오카피」시트 참조.';
  Logger.log('[F1Launch] ' + msg);
  SpreadsheetApp.getUi().alert('✅ ' + msg);
}

// ─── 4. 비즈뿌리오 업로드용 CSV 생성 ─────────────────
// 152개소의 전화번호·치환변수를 CSV 포맷으로 시트에 출력
// 출력 컬럼: 수신번호 | 기관명 | 담당자명 | 퍼널단계 | 기관ID
// 비즈뿌리오 업로드 시: 수신번호 컬럼 + 치환변수 컬럼 매핑
function f1ExportPpurioCSV() {
  var institutions = f1FetchTargets_();
  var rows = [];
  var noPhone = 0;

  institutions.forEach(function(inst) {
    var m = inst.metadata || {};
    var phone = f1NormalizePhone_(m.contact_mobile || m.contact_phone || '');
    if (!phone) {
      noPhone++;
      return;
    }
    var contact = m.contact_name || '담당자';
    rows.push([
      phone,
      inst.name,
      contact,
      inst.purchase_stage,
      inst.id
    ]);
  });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = 'F1출시_비즈뿌리오업로드';
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(sheetName);

  sheet.appendRow(['수신번호', '기관명', '담당자명', '퍼널단계', '기관ID']);
  sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#fbc02d');
  sheet.setFrozenRows(1);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }

  var msg = '비즈뿌리오 업로드 CSV 생성 완료\n' +
            '발송 가능: ' + rows.length + '건\n' +
            '전화번호 없음: ' + noPhone + '건\n\n' +
            '「F1출시_비즈뿌리오업로드」 시트를 CSV로 내보내기 →\n' +
            '비즈뿌리오 업로드 (수신번호 컬럼 + 치환변수 매핑)';
  Logger.log('[F1Launch] ' + msg);
  SpreadsheetApp.getUi().alert('✅ ' + msg);
}

// ─── 전화번호 정규화 ─────────────────────────────────
// 010-1234-5678 → 01012345678
// +82 10-1234-5678 → 01012345678
function f1NormalizePhone_(phone) {
  if (!phone) return '';
  var s = String(phone).replace(/[^0-9+]/g, '');
  if (s.indexOf('+82') === 0) s = '0' + s.substring(3);
  if (s.indexOf('82') === 0 && s.length >= 11) s = '0' + s.substring(2);
  // 11자리 (010…) 또는 지역번호 포함 10자리만 유효
  if (s.length < 9 || s.length > 11) return '';
  return s;
}

// ─── 중복 발송 방지 체크 ──────────────────────────────
function f1AlreadySent_(instId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(F1_LOG_SHEET_NAME);
  if (!logSheet) return false;

  var data = logSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(instId) && data[i][5] === 'SENT') return true;
  }
  return false;
}

// ─── 발송 로그 기록 ───────────────────────────────────
function f1WriteLog_(rows) {
  if (!rows.length) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(F1_LOG_SHEET_NAME);

  if (!logSheet) {
    logSheet = ss.insertSheet(F1_LOG_SHEET_NAME);
    logSheet.appendRow(['발송일시', '기관ID', '기관명', '퍼널단계', '이메일', '결과', '비고']);
    logSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    logSheet.setFrozenRows(1);
  }

  rows.forEach(function(row) { logSheet.appendRow(row); });
  Logger.log('[F1Launch] 로그 기록: ' + rows.length + '건');
}
