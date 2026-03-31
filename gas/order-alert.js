/**
 * order-alert.js — X5 P1 신규 주문 알림 자동화
 * 작성: SAGE 슬기 (FLUX X5) | 2026-03-27
 *
 * 방법: Google Apps Script 10분 트리거
 * 트리거: 시간 기반 → 10분마다 실행 → checkNewOrders()
 *
 * 배포 방법:
 * 1. Apps Script 편집기(script.google.com)에서 이 파일을 추가
 * 2. checkNewOrders() 함수 선택 → 트리거 추가 → 시간 기반 → 10분마다
 * 3. SUPABASE_URL, SUPABASE_KEY, ALERT_EMAIL 상수 수정 후 저장
 *
 * 의존성: 없음 (UrlFetchApp, GmailApp — GAS 기본 내장)
 */

// ─── 설정 ───────────────────────────────────────────────────────────────────

var SUPABASE_URL = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co';
var SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');
  // ⚠️ Apps Script 속성 서비스에 'SUPABASE_KEY' 등록 필요
  // 설정 방법: 편집기 → 프로젝트 설정 → 스크립트 속성 → SUPABASE_KEY 추가

var ALERT_EMAIL   = 'vianne75@gmail.com'; // 대표 이메일 — X5 P1 긴급 배포 2026-03-27
var ALERT_SMS_KEY = PropertiesService.getScriptProperties().getProperty('SMS_API_KEY');
  // 선택: 문자 발송 API 키 (coolsms 등)

// 마지막 확인 시각을 저장할 속성 키
var LAST_CHECK_KEY = 'ORDER_ALERT_LAST_CHECK';

// ─── 메인 함수 (트리거 대상) ────────────────────────────────────────────────

/**
 * 10분마다 실행. Supabase orders 테이블에서 마지막 확인 이후
 * 신규 등록된 주문을 조회하여 알림 발송.
 */
function checkNewOrders() {
  var props = PropertiesService.getScriptProperties();
  var lastCheck = props.getProperty(LAST_CHECK_KEY);
  var now = new Date();

  // 처음 실행 시 10분 전 기준으로 초기화
  if (!lastCheck) {
    lastCheck = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  }

  // Supabase에서 신규 주문 조회
  // reg_time > lastCheck 이고 아직 미매칭(matched=false) 또는 신규 모두 포함
  var url = SUPABASE_URL
    + '/rest/v1/orders'
    + '?reg_time=gt.' + encodeURIComponent(lastCheck)
    + '&select=order_idx,reg_time,option_user,goods_name,sale_price,sale_cnt,matched,institution_id'
    + '&order=reg_time.asc';

  var response;
  try {
    response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('[order-alert] Supabase 조회 오류: ' + e.message);
    return;
  }

  if (response.getResponseCode() !== 200) {
    Logger.log('[order-alert] HTTP 오류: ' + response.getResponseCode());
    return;
  }

  var orders = JSON.parse(response.getContentText());

  if (orders.length === 0) {
    Logger.log('[order-alert] 신규 주문 없음 (' + lastCheck + ' 이후)');
    props.setProperty(LAST_CHECK_KEY, now.toISOString());
    return;
  }

  // 중복 order_idx 통합 (상품별 1행이므로 같은 주문이 여러 행일 수 있음)
  var orderMap = {};
  for (var i = 0; i < orders.length; i++) {
    var o = orders[i];
    var key = o.order_idx || ('nokey_' + i);
    if (!orderMap[key]) {
      orderMap[key] = {
        order_idx: o.order_idx,
        reg_time:  o.reg_time,
        buyer:     o.option_user,
        matched:   o.matched,
        items:     [],
        total:     0
      };
    }
    var qty   = parseInt(o.sale_cnt) || 0;
    var price = parseFloat(o.sale_price) || 0;
    orderMap[key].items.push(o.goods_name + ' ' + qty + '개');
    orderMap[key].total += price * qty;
  }

  var orderList = Object.values(orderMap);
  Logger.log('[order-alert] 신규 주문 ' + orderList.length + '건 감지');

  // 알림 메시지 구성
  var lines = ['[APS] 신규 주문 ' + orderList.length + '건\n'];
  for (var j = 0; j < orderList.length; j++) {
    var ord = orderList[j];
    var matchStr = ord.matched ? '✅ CRM 매칭' : '⚠️ 미매칭';
    var timeStr  = ord.reg_time ? ord.reg_time.slice(0, 16).replace('T', ' ') : '-';
    lines.push(
      '주문 #' + (ord.order_idx || '?') + ' | '
      + timeStr + ' | '
      + (ord.buyer || '구매자 미확인') + '\n'
      + '  ' + ord.items.join(', ') + '\n'
      + '  총 ' + ord.total.toLocaleString() + '원 | ' + matchStr
    );
  }
  var message = lines.join('\n\n');

  // 이메일 발송 (설정된 경우)
  if (ALERT_EMAIL) {
    GmailApp.sendEmail(
      ALERT_EMAIL,
      '[APS] 신규 주문 ' + orderList.length + '건 — 확인 필요',
      message
    );
    Logger.log('[order-alert] 이메일 발송 완료 → ' + ALERT_EMAIL);
  }

  // 마지막 확인 시각 업데이트
  props.setProperty(LAST_CHECK_KEY, now.toISOString());
  Logger.log('[order-alert] 완료. 다음 기준시각: ' + now.toISOString());
}

// ─── 트리거 등록 헬퍼 (최초 1회 수동 실행) ─────────────────────────────────

/**
 * 이 함수를 한 번 수동 실행하면 10분 트리거가 자동 등록됨.
 * Apps Script 편집기에서 setupTrigger() 선택 후 실행.
 */
function setupTrigger() {
  // 기존 트리거 삭제 (중복 방지)
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkNewOrders') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // 10분마다 실행 트리거 등록
  ScriptApp.newTrigger('checkNewOrders')
    .timeBased()
    .everyMinutes(10)
    .create();
  Logger.log('checkNewOrders 트리거 등록 완료 (10분마다)');
}

// ─── 테스트용 ────────────────────────────────────────────────────────────────

/**
 * 수동 테스트 — 최근 1시간 내 주문 조회 확인.
 * Apps Script 편집기에서 testAlert() 선택 후 실행.
 */
function testAlert() {
  var props = PropertiesService.getScriptProperties();
  var oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  props.setProperty(LAST_CHECK_KEY, oneHourAgo);
  Logger.log('테스트: 기준시각을 1시간 전으로 설정 후 checkNewOrders() 실행');
  checkNewOrders();
}
