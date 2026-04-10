// ============================================
// X5 P3+ 메모 파싱 엔진 — 주문 상태 자동 추론
// ============================================

/**
 * 메모 약어 사전 (대표 표준)
 *
 * 결제:
 *   MMDD 카드결제 / 카드  → payment_method='카드', payment_confirmed=false (카드사 정산 별도)
 *   MMDD 입완             → payment_confirmed=true, payment_method='이체'
 *
 * 세금계산서:
 *   MMDD 전세(발행)?      → invoice_issued=true
 *
 * 인쇄 접수:
 *   MMDD (당)?스접 (매수)? → print_type='스티커', print_rush=당, print_qty=매수
 *   MMDD (당)?배접        → print_type='배너', print_rush=당
 *   MMDD (당)?현접        → print_type='현수막', print_rush=당
 *
 * 기타:
 *   보관 / 전량보관 / 전량 보관 / 보관중 → on_hold=true
 *   금변 금액             → amount_changed 로그
 */

// 메모 한 줄을 파싱하여 구조화된 객체 반환
function parseMemo(memo) {
  if (!memo || typeof memo !== 'string') return null;

  const result = {
    payment_method: null,
    payment_confirmed: null,
    payment_date: null,
    invoice_issued: null,
    invoice_date: null,
    print_type: null,
    print_rush: null,
    print_received: null,
    print_date: null,
    print_qty: null,
    on_hold: null,
    events: [],        // 파싱된 모든 이벤트 로그
    unparsed: []       // 파싱 실패 토큰
  };

  const raw = memo.replace(/<br\s*\/?>/gi, ' ').replace(/\n/g, ' ').trim();
  if (!raw) return null;

  // ─── 결제 ───
  // 카드결제 (MMDD 카드결제 / MMDD카드결제 / 카드결제)
  const cardMatch = raw.match(/(\d{4})\s*카드결제/);
  if (cardMatch) {
    result.payment_method = '카드';
    result.payment_confirmed = false; // 카드사 정산 별도 확인 필요
    result.payment_date = mmddToDate(cardMatch[1]);
    result.events.push({ type: 'card_payment', date: result.payment_date, raw: cardMatch[0] });
  } else if (/카드결제/.test(raw)) {
    result.payment_method = '카드';
    result.payment_confirmed = false;
    result.events.push({ type: 'card_payment', date: null, raw: '카드결제 (날짜 없음)' });
  }

  // 입금완료 (MMDD 입완 / MMDD입완)
  const depositMatch = raw.match(/(\d{4})\s*입완/);
  if (depositMatch) {
    result.payment_method = result.payment_method || '이체';
    result.payment_confirmed = true;
    result.payment_date = mmddToDate(depositMatch[1]);
    result.events.push({ type: 'deposit_confirmed', date: result.payment_date, raw: depositMatch[0] });
  } else if (/입완/.test(raw)) {
    result.payment_method = result.payment_method || '이체';
    result.payment_confirmed = true;
    result.events.push({ type: 'deposit_confirmed', date: null, raw: '입완 (날짜 없음)' });
  }

  // ─── 세금계산서 ───
  const invoiceMatch = raw.match(/(\d{4})\s*전세(?:발행)?/);
  if (invoiceMatch) {
    result.invoice_issued = true;
    result.invoice_date = mmddToDate(invoiceMatch[1]);
    result.events.push({ type: 'invoice_issued', date: result.invoice_date, raw: invoiceMatch[0] });
  } else if (/전세/.test(raw)) {
    result.invoice_issued = true;
    result.events.push({ type: 'invoice_issued', date: null, raw: '전세 (날짜 없음)' });
  }

  // ─── 인쇄 접수 ───
  // 스티커: (당)스접 (매수)?
  const stickerMatch = raw.match(/(\d{4})\s*(당)?스접\s*(?:\(?(\d+)(?:개|매)?(?:\s*함)?\)?)?/);
  if (stickerMatch) {
    result.print_type = '스티커';
    result.print_rush = !!stickerMatch[2];
    result.print_received = true;
    result.print_date = mmddToDate(stickerMatch[1]);
    if (stickerMatch[3]) result.print_qty = parseInt(stickerMatch[3]);
    result.events.push({ type: 'print_received', subtype: '스티커', rush: result.print_rush, date: result.print_date, qty: result.print_qty, raw: stickerMatch[0] });
  }

  // 배너: (당)배접
  const bannerMatch = raw.match(/(\d{4})\s*(당)?배접/);
  if (bannerMatch) {
    result.print_type = result.print_type ? result.print_type + '+배너' : '배너';
    result.print_rush = result.print_rush || !!bannerMatch[2];
    result.print_received = true;
    result.print_date = result.print_date || mmddToDate(bannerMatch[1]);
    result.events.push({ type: 'print_received', subtype: '배너', rush: !!bannerMatch[2], date: mmddToDate(bannerMatch[1]), raw: bannerMatch[0] });
  }

  // 현수막: (당)현접
  const curtainMatch = raw.match(/(\d{4})\s*(당)?현접/);
  if (curtainMatch) {
    result.print_type = result.print_type ? result.print_type + '+현수막' : '현수막';
    result.print_rush = result.print_rush || !!curtainMatch[2];
    result.print_received = true;
    result.print_date = result.print_date || mmddToDate(curtainMatch[1]);
    result.events.push({ type: 'print_received', subtype: '현수막', rush: !!curtainMatch[2], date: mmddToDate(curtainMatch[1]), raw: curtainMatch[0] });
  }

  // ─── 보류 ───
  if (/전량\s*보관|보관중|보관/.test(raw)) {
    result.on_hold = true;
    result.events.push({ type: 'on_hold', raw: raw.match(/전량\s*보관|보관중|보관/)[0] });
  }

  // ─── 금액 변경 ───
  const amtMatch = raw.match(/금[액변]\s*변?경?\s*([\d,]+)\s*원?/);
  if (amtMatch) {
    result.events.push({ type: 'amount_changed', amount: parseInt(amtMatch[1].replace(/,/g, '')), raw: amtMatch[0] });
  }

  // ─── 카드 승인번호 (4자리 × 4 패턴) ───
  const cardNoMatch = raw.match(/(\d{4})\s+(\d{4})\s+(\d{4})\s+(\d{4})\s+(\d{2}\/\d{2})/);
  if (cardNoMatch) {
    result.events.push({
      type: 'card_info',
      card_no: `${cardNoMatch[1]} ${cardNoMatch[2]} ${cardNoMatch[3]} ${cardNoMatch[4]}`,
      card_exp: cardNoMatch[5],
      raw: cardNoMatch[0]
    });
  }

  // 이벤트가 하나도 없으면 파싱 실패
  if (result.events.length === 0) {
    result.unparsed.push(raw);
  }

  return result;
}

// MMDD → YYYY/MM/DD (주문일 기준 연도 추정)
function mmddToDate(mmdd, refYear) {
  if (!mmdd || mmdd.length !== 4) return null;
  const mm = mmdd.substring(0, 2);
  const dd = mmdd.substring(2, 4);
  // 현재 연도 기준 (1~12월 매핑)
  const year = refYear || new Date().getFullYear();
  return `${year}/${mm}/${dd}`;
}

// 주문의 reg_time에서 연도 추출
function getOrderYear(regTime) {
  if (!regTime) return new Date().getFullYear();
  const m = String(regTime).match(/^(\d{4})/);
  return m ? parseInt(m[1]) : new Date().getFullYear();
}

// 파싱 결과를 Supabase UPDATE용 객체로 변환
function parsedToUpdateObj(parsed) {
  if (!parsed) return null;

  const obj = { memo_parsed: true };

  if (parsed.payment_method !== null) obj.payment_method = parsed.payment_method;
  if (parsed.payment_confirmed !== null) obj.payment_confirmed = parsed.payment_confirmed;
  if (parsed.payment_date !== null) obj.payment_date = parsed.payment_date;
  if (parsed.invoice_issued !== null) obj.invoice_issued = parsed.invoice_issued;
  if (parsed.invoice_date !== null) obj.invoice_date = parsed.invoice_date;
  if (parsed.print_type !== null) obj.print_type = parsed.print_type;
  if (parsed.print_rush !== null) obj.print_rush = parsed.print_rush;
  if (parsed.print_received !== null) obj.print_received = parsed.print_received;
  if (parsed.print_date !== null) obj.print_date = parsed.print_date;
  if (parsed.print_qty !== null) obj.print_qty = parsed.print_qty;
  if (parsed.on_hold !== null) obj.on_hold = parsed.on_hold;

  return obj;
}

// admin에서 호출: 전체 주문 메모 일괄 파싱 (backfill)
async function backfillMemos() {
  const log = document.getElementById('orderSyncStatus');
  if (log) log.textContent = '메모 파싱 중...';

  const { data: orders, error } = await supabase.from('orders')
    .select('id, memo_raw, reg_time, memo_parsed')
    .not('memo_raw', 'is', null)
    .order('id', { ascending: true })
    .limit(5000);

  if (error) {
    showToast('메모 로드 실패: ' + error.message, 'error');
    return;
  }

  let parsed = 0, failed = 0, skipped = 0;

  for (const order of orders) {
    if (!order.memo_raw || !order.memo_raw.trim()) { skipped++; continue; }

    const refYear = getOrderYear(order.reg_time);
    const result = parseMemo(order.memo_raw);

    if (!result || result.events.length === 0) {
      failed++;
      continue;
    }

    // MMDD 연도 보정
    if (result.payment_date) result.payment_date = mmddToDate(result.payment_date.replace(/\//g, '').slice(-4), refYear);
    if (result.invoice_date) result.invoice_date = mmddToDate(result.invoice_date.replace(/\//g, '').slice(-4), refYear);
    if (result.print_date) result.print_date = mmddToDate(result.print_date.replace(/\//g, '').slice(-4), refYear);

    const updateObj = parsedToUpdateObj(result);
    if (updateObj) {
      await supabase.from('orders').update(updateObj).eq('id', order.id);
      parsed++;
    }
  }

  const msg = `메모 파싱 완료: ${parsed}건 성공, ${failed}건 실패, ${skipped}건 스킵`;
  if (log) log.textContent = msg;
  showToast(msg, parsed > 0 ? 'success' : 'info');

  // 주문 테이블 새로고침
  loadOrders();
}

// 단일 주문 메모 파싱 (신규 동기화 시 호출)
function parseAndApplyMemo(order) {
  if (!order.memo_raw) return null;
  const refYear = getOrderYear(order.reg_time);
  const result = parseMemo(order.memo_raw);
  if (!result) return null;

  // 연도 보정
  ['payment_date', 'invoice_date', 'print_date'].forEach(key => {
    if (result[key]) {
      const mmdd = result[key].replace(/\//g, '').slice(-4);
      result[key] = mmddToDate(mmdd, refYear);
    }
  });

  return parsedToUpdateObj(result);
}
