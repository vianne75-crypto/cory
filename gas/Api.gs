/**
 * 대시보드용 데이터 API (GET)
 *
 * 호출 예시:
 * GET {배포URL}?key=API_KEY&action=orders
 * GET {배포URL}?key=API_KEY&action=orders&since=2026-01-01
 */

// ─── 대시보드 데이터 조회 (GET) ───
function doGet(e) {
  // API Key 검증
  var key = e.parameter.key || '';
  if (key !== API_KEY) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: 'Unauthorized' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var action = e.parameter.action || 'orders';
  var since = e.parameter.since || '';

  if (action === 'orders') {
    return getOrders(since);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ error: 'Unknown action' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ─── 주문 데이터 반환 ───
function getOrders(since) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_ORDERS);

  if (!sheet || sheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(
      JSON.stringify({ orders: [], total: 0 })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);

  var orders = [];
  for (var i = 0; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }

    // since 필터 (reg_time 기준)
    if (since && obj.reg_time) {
      var orderDate = String(obj.reg_time).slice(0, 10);
      if (orderDate < since) continue;
    }

    orders.push(obj);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ orders: orders, total: orders.length })
  ).setMimeType(ContentService.MimeType.JSON);
}
