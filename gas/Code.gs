/**
 * 애니빌드 쇼핑몰 Webhook 수신 → Google Sheet 저장
 *
 * 사용법:
 * 1. Google Sheet 생성
 * 2. 확장 프로그램 → Apps Script 열기
 * 3. 이 코드를 편집기에 붙여넣기
 * 4. 배포 → 새 배포 → 웹 앱 → "모든 사용자" 접근 허용
 * 5. 배포 URL을 애니빌드 관리자 webhook에 등록
 */

// ─── 설정 ───
const API_KEY = '52b8fc2a5de7cf289fe7729a547f5b2d';
const SHEET_ORDERS = '주문내역';
const SHEET_STATUS = '상태변경';

// ─── Webhook 수신 (POST) ───
function doPost(e) {
  try {
    // json_data 파라미터 파싱 (애니빌드 전송 방식)
    var jsonStr = '';
    if (e.parameter && e.parameter.json_data) {
      jsonStr = e.parameter.json_data;
    } else if (e.postData && e.postData.contents) {
      jsonStr = e.postData.contents;
    }

    if (!jsonStr) {
      return makeResponse({ success: false, error: 'No data received' });
    }

    var payload = JSON.parse(jsonStr);

    // 주문상태변경 vs 주문접수 구분
    // 상태변경은 goods_info가 없음
    if (!payload.goods_info) {
      return handleStatusChange(payload);
    } else {
      return handleNewOrder(payload);
    }

  } catch (err) {
    return makeResponse({ success: false, error: err.message });
  }
}

// ─── 신규 주문 처리 ───
function handleNewOrder(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_ORDERS);

  // 시트 없으면 생성 + 헤더
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ORDERS);
    sheet.appendRow([
      'order_idx', 'reg_time', 'state', 'state_subject',
      'j_name', 's_name', 'addr', 'zipcode',
      'app_price', 'move_price', 'approval_type',
      'goods_name', 'sale_cnt', 'sale_price', 't_price',
      'option_user', 'option_m_str', 'user_code', 'goods_idx',
      'mem_id', 'memlv'
    ]);
    // 헤더 서식
    sheet.getRange(1, 1, 1, 21).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // 주문 일시 변환 (timestamp → 날짜)
  var regTime = '';
  if (data.reg_time) {
    var ts = parseInt(data.reg_time);
    if (ts > 9999999999) ts = Math.floor(ts / 1000); // ms → s
    if (ts > 0) {
      var d = new Date(ts * 1000);
      regTime = Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    } else {
      regTime = String(data.reg_time);
    }
  }

  // goods_info 배열 플래트닝 (상품별 1행)
  var goodsInfo = data.goods_info || [];
  var rows = [];

  for (var i = 0; i < goodsInfo.length; i++) {
    var item = goodsInfo[i];
    rows.push([
      data.order_idx || '',
      regTime,
      data.state || '',
      data.state_subject || '',
      data.j_name || '',
      data.s_name || '',
      data.addr || '',
      data.zipcode || '',
      parseFloat(data.app_price) || 0,
      parseFloat(data.move_price) || 0,
      data.approval_type || '',
      item.goods_name || '',
      parseInt(item.sale_cnt) || 0,
      parseFloat(item.sale_price) || 0,
      parseFloat(item.t_price) || 0,
      item.option_user || '',
      item.option_m_str || '',
      item.user_code || '',
      item.goods_idx || '',
      data.mem_id || '',
      data.memlv || ''
    ]);
  }

  // 상품 없는 주문도 기본 행 저장
  if (rows.length === 0) {
    rows.push([
      data.order_idx || '',
      regTime,
      data.state || '',
      data.state_subject || '',
      data.j_name || '',
      data.s_name || '',
      data.addr || '',
      data.zipcode || '',
      parseFloat(data.app_price) || 0,
      parseFloat(data.move_price) || 0,
      data.approval_type || '',
      '', 0, 0, 0, '', '', '', '',
      data.mem_id || '',
      data.memlv || ''
    ]);
  }

  // 시트에 일괄 추가
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length)
    .setValues(rows);

  return makeResponse({ success: true, count: rows.length });
}

// ─── 주문 상태 변경 처리 ───
function handleStatusChange(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 주문내역 시트에서 해당 주문번호 행 업데이트
  var orderSheet = ss.getSheetByName(SHEET_ORDERS);
  if (orderSheet && orderSheet.getLastRow() > 1) {
    var orderData = orderSheet.getDataRange().getValues();
    var updated = 0;

    for (var i = 1; i < orderData.length; i++) {
      if (String(orderData[i][0]) === String(data.order_idx)) {
        orderSheet.getRange(i + 1, 3).setValue(data.state || '');
        orderSheet.getRange(i + 1, 4).setValue(data.state_subject || '');
        updated++;
      }
    }
  }

  // 상태변경 로그 시트에도 기록
  var statusSheet = ss.getSheetByName(SHEET_STATUS);
  if (!statusSheet) {
    statusSheet = ss.insertSheet(SHEET_STATUS);
    statusSheet.appendRow([
      'order_idx', 'state', 'state_subject', 'reg_date',
      'mem_id', 'approval_type', 'app_price', 'logged_at'
    ]);
    statusSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    statusSheet.setFrozenRows(1);
  }

  statusSheet.appendRow([
    data.order_idx || '',
    data.state || '',
    data.state_subject || '',
    data.reg_date || '',
    data.mem_id || '',
    data.approval_type || '',
    data.app_price || '',
    new Date()
  ]);

  return makeResponse({ success: true, updated: updated || 0 });
}

// ─── 응답 헬퍼 ───
function makeResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
