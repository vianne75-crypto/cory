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

  if (action === 'report') {
    return getReport(since);
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

// ─── 통합 리포트 반환 ───
// 주문 집계 요약 + 기관별 구매 현황
function getReport(since) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_ORDERS);

  if (!sheet || sheet.getLastRow() <= 1) {
    return ContentService.createTextOutput(
      JSON.stringify({
        generated_at: new Date().toISOString(),
        summary: { total_orders: 0, total_amount: 0, total_volume: 0 },
        by_month: [],
        by_goods: [],
        by_institution: []
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);

  // 헤더 인덱스 맵
  var idx = {};
  for (var h = 0; h < headers.length; h++) {
    idx[headers[h]] = h;
  }

  // 집계용 맵
  var monthMap = {};
  var goodsMap = {};
  var instMap = {};
  var totalOrders = 0, totalAmount = 0, totalVolume = 0;

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];

    // since 필터
    var regTime = String(row[idx['reg_time']] || '').slice(0, 10);
    if (since && regTime && regTime < since) continue;

    var goodsName = String(row[idx['goods_name']] || '').trim();
    var saleCnt   = parseInt(row[idx['sale_cnt']]) || 0;
    var salePrice = parseFloat(row[idx['sale_price']]) || 0;
    var lineAmt   = saleCnt * salePrice;
    var buyerName = String(row[idx['j_name']] || row[idx['s_name']] || '').trim();
    var month     = regTime.slice(0, 7); // YYYY-MM

    if (!goodsName && !buyerName) continue;

    totalOrders++;
    totalAmount += lineAmt;
    totalVolume += saleCnt;

    // 월별 집계
    if (month) {
      if (!monthMap[month]) monthMap[month] = { month: month, orders: 0, amount: 0, volume: 0 };
      monthMap[month].orders++;
      monthMap[month].amount += lineAmt;
      monthMap[month].volume += saleCnt;
    }

    // 상품별 집계
    if (goodsName) {
      if (!goodsMap[goodsName]) goodsMap[goodsName] = { goods_name: goodsName, orders: 0, amount: 0, volume: 0 };
      goodsMap[goodsName].orders++;
      goodsMap[goodsName].amount += lineAmt;
      goodsMap[goodsName].volume += saleCnt;
    }

    // 기관별 집계 (주문자명 기준)
    if (buyerName) {
      if (!instMap[buyerName]) {
        instMap[buyerName] = {
          buyer_name: buyerName,
          orders: 0,
          amount: 0,
          volume: 0,
          last_purchase_date: ''
        };
      }
      instMap[buyerName].orders++;
      instMap[buyerName].amount += lineAmt;
      instMap[buyerName].volume += saleCnt;
      if (regTime > instMap[buyerName].last_purchase_date) {
        instMap[buyerName].last_purchase_date = regTime;
      }
    }
  }

  // 정렬: 월 오름차순, 상품/기관 금액 내림차순
  var byMonth = Object.values(monthMap).sort(function(a, b) { return a.month < b.month ? -1 : 1; });
  var byGoods = Object.values(goodsMap).sort(function(a, b) { return b.amount - a.amount; });
  var byInst  = Object.values(instMap).sort(function(a, b) { return b.amount - a.amount; });

  return ContentService.createTextOutput(
    JSON.stringify({
      generated_at: new Date().toISOString(),
      since: since || null,
      summary: {
        total_orders: totalOrders,
        total_amount: totalAmount,
        total_volume: totalVolume
      },
      by_month: byMonth,
      by_goods: byGoods,
      by_institution: byInst
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
