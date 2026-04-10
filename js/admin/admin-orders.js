// ============================================
// 주문 모니터링
// ============================================

// reg_time 파싱 (YYYYMMDD·Unix timestamp·날짜 문자열 모두 처리)
function parseRegTime(raw) {
  if (!raw && raw !== 0) return '';
  const s = String(raw).trim();
  if (/^\d+$/.test(s)) {
    const len = s.length;
    const ts = parseInt(s);
    if (len === 8 && ts >= 20000101 && ts <= 21001231) {
      return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
    }
    const sec = ts > 9999999999 ? Math.floor(ts / 1000) : ts;
    return new Date(sec * 1000).toISOString().slice(0, 10);
  }
  if (/^\d{4}[-/]/.test(s)) return s.replace(/\//g, '-').slice(0, 10);
  return s.slice(0, 10);
}

let orderCache = [];
let orderPage = 1;

async function loadOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, institutions(name)')
    .order('reg_time', { ascending: false })
    .limit(2000);

  if (error) {
    showToast('주문 로드 실패: ' + error.message, 'error');
    return;
  }

  orderCache = data || [];
  renderOrderStats();
  renderOrderTable();
}

let orderFilter = 'all'; // all | unpaid | paid

function setOrderFilter(filter) {
  orderFilter = filter;
  orderPage = 1;
  renderOrderStats();
  renderOrderTable();
}

function getFilteredOrders() {
  if (orderFilter === 'unpaid') return orderCache.filter(d => d.state_subject === '입금대기');
  if (orderFilter === 'paid') return orderCache.filter(d => d.payment_confirmed);
  if (orderFilter === 'no_invoice') return orderCache.filter(d => d.payment_confirmed && !d.invoice_issued);
  return orderCache;
}

function renderOrderStats() {
  const total = orderCache.length;
  const matched = orderCache.filter(d => d.matched).length;
  const totalAmount = orderCache.reduce((s, d) => s + (d.sale_price || 0) * (d.sale_cnt || 0), 0);
  const unpaid = orderCache.filter(d => d.state_subject === '입금대기').length;
  const unpaidAmount = orderCache.filter(d => d.state_subject === '입금대기')
    .reduce((s, d) => s + (d.sale_price || 0) * (d.sale_cnt || 0), 0);

  document.getElementById('orderStats').innerHTML = `
    <div class="stat-card" style="cursor:pointer" onclick="setOrderFilter('all')"><span class="label">전체 주문</span><span class="value">${total}</span></div>
    <div class="stat-card"><span class="label">매칭됨</span><span class="value" style="color:#4CAF50">${matched}</span></div>
    <div class="stat-card"><span class="label">미매칭</span><span class="value" style="color:#F44336">${total - matched}</span></div>
    <div class="stat-card"><span class="label">총 금액</span><span class="value">${adminFormatCurrency(totalAmount)}</span></div>
    <div class="stat-card" style="cursor:pointer;${orderFilter==='unpaid'?'border:2px solid #F44336':''}" onclick="setOrderFilter(orderFilter==='unpaid'?'all':'unpaid')">
      <span class="label">💰 미수금</span>
      <span class="value" style="color:#F44336">${unpaid}건</span>
      <span style="font-size:11px;color:#888">${adminFormatCurrency(unpaidAmount)}</span>
    </div>
    <div class="stat-card" style="cursor:pointer;${orderFilter==='no_invoice'?'border:2px solid #FF9800':''}" onclick="setOrderFilter(orderFilter==='no_invoice'?'all':'no_invoice')">
      <span class="label">📄 전세 미발행</span>
      <span class="value" style="color:#FF9800">${orderCache.filter(d => d.payment_confirmed && !d.invoice_issued).length}건</span>
    </div>
    <div class="stat-card">
      <span class="label">🖨️ 인쇄접수</span>
      <span class="value" style="color:#1976D2">${orderCache.filter(d => d.print_received).length}건</span>
    </div>
  `;
}

function renderOrderTable() {
  const filtered = getFilteredOrders();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (orderPage > totalPages) orderPage = totalPages;

  const start = (orderPage - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('orderBody');
  tbody.innerHTML = pageData.map(d => {
    const instName = d.institutions ? d.institutions.name : '-';
    const amount = ((d.sale_price || 0) * (d.sale_cnt || 0));
    const matchClass = d.matched ? 'matched' : 'unmatched';
    const matchText = d.matched ? '매칭' : '미매칭';

    // 입금 상태 표시 (P3)
    const isUnpaid = d.state_subject === '입금대기';
    const isPaid = d.payment_confirmed;
    let paymentBadge = '';
    if (isUnpaid && !isPaid) {
      paymentBadge = `<button class="btn btn-sm" style="background:#F44336;color:#fff;font-size:11px;padding:2px 8px;" onclick="confirmPayment(${d.id}, '${d.order_idx}')">입금확인</button>`;
    } else if (isPaid) {
      paymentBadge = `<span style="color:#4CAF50;font-size:11px;">✅ ${d.payment_date || '확인'}</span>`;
    }

    // 입금대기 행 하이라이트
    const rowStyle = isUnpaid && !isPaid ? 'background:#FFF3E0;' : '';

    // 인쇄 접수 뱃지 (P3+)
    let printBadge = '-';
    if (d.print_received) {
      const rushTag = d.print_rush ? '⚡' : '';
      const qtyTag = d.print_qty ? ` ${d.print_qty}매` : '';
      printBadge = `<span style="color:#1976D2;font-size:11px;">${rushTag}${d.print_type || '접수'}${qtyTag}</span>`;
    }

    // 세금계산서 뱃지 (P3+)
    let invoiceBadge = '-';
    if (d.invoice_issued) {
      invoiceBadge = `<span style="color:#4CAF50;font-size:11px;">✅ ${d.invoice_date || '발행'}</span>`;
    }

    return `<tr style="${rowStyle}">
      <td>${d.order_idx || '-'}</td>
      <td>${d.option_user || '-'}</td>
      <td class="truncate">${d.goods_name || '-'}</td>
      <td>${d.sale_cnt || 0}</td>
      <td>${adminFormatCurrency(amount)}</td>
      <td><span class="match-badge ${matchClass}">${matchText}</span> ${instName}</td>
      <td>${paymentBadge || (d.payment_method === '카드' ? '<span style="color:#FF9800;font-size:11px;">💳카드(미정산)</span>' : '-')}</td>
      <td>${printBadge}</td>
      <td>${invoiceBadge}</td>
      <td>${d.state_subject || '-'}</td>
      <td>${(d.reg_time || '').substring(0, 10)}</td>
    </tr>`;
  }).join('');

  renderPagination('orderPagination', orderPage, totalPages, 'goOrderPage');
}

// 입금 확인 처리 (X5 P3)
async function confirmPayment(orderId, orderIdx) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

  const { error } = await supabase.from('orders')
    .update({ payment_confirmed: true, payment_date: today, state_subject: '발송대기' })
    .eq('id', orderId);

  if (error) {
    showToast('입금 확인 실패: ' + error.message, 'error');
    return;
  }

  // 캐시 업데이트
  const order = orderCache.find(o => o.id === orderId);
  if (order) {
    order.payment_confirmed = true;
    order.payment_date = today;
    order.state_subject = '발송대기';
  }

  renderOrderStats();
  renderOrderTable();
  showToast(`주문 ${orderIdx} 입금 확인 완료 → 발송대기`, 'success');
}

function goOrderPage(page) {
  orderPage = page;
  renderOrderTable();
}

// 주문 동기화 (기존 webhook에서 가져오기)
async function syncOrders() {
  const statusEl = document.getElementById('orderSyncStatus');
  statusEl.textContent = '동기화 중...';

  try {
    const url = new URL('https://aps-webhook.vianne75.workers.dev');
    url.searchParams.set('key', '52b8fc2a5de7cf289fe7729a547f5b2d');
    url.searchParams.set('action', 'orders');

    const response = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      statusEl.textContent = '새 주문 없음';
      return;
    }

    // 기존 order_idx + goods_name 조합 확인 (중복 방지)
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('order_idx, goods_name');
    const existingSet = new Set(
      (existingOrders || []).map(o => `${o.order_idx || ''}|${o.goods_name || ''}`)
    );

    // 새 주문만 필터 (취소/환불 제외 + 중복 제외)
    const newOrders = orders.filter(o => {
      const state = String(o.state_subject || '');
      if (state.includes('취소') || state.includes('환불')) return false;
      const key = `${o.order_idx || ''}|${o.goods_name || ''}`;
      if (existingSet.has(key)) return false;
      return true;
    });

    if (newOrders.length === 0) {
      statusEl.textContent = '새 주문 없음 (이미 동기화됨)';
      return;
    }

    // 기관 매칭 후 저장
    let matchCount = 0;
    const records = [];

    for (const order of newOrders) {
      const optUser = (order.option_user || '').trim();
      const addr = (order.addr || '').trim();

      // 스마트 매칭 엔진 적용 (X5 P2)
      let matchedInst = null;
      if (instCache.length > 0 && typeof smartMatchOrder === 'function') {
        const result = smartMatchOrder(order, instCache);
        if (result && result.inst && result.score >= 0.7) {
          matchedInst = result.inst;
        }
      }
      // 폴백: 단순 이름 매칭
      if (!matchedInst && optUser && instCache.length > 0) {
        matchedInst = instCache.find(d => d.name === optUser) ||
          instCache.find(d => d.name.includes(optUser) || optUser.includes(d.name));
      }

      records.push({
        order_idx: order.order_idx,
        option_user: optUser,
        addr: addr,
        goods_name: order.goods_name || '',
        sale_price: parseFloat(order.sale_price) || 0,
        sale_cnt: parseInt(order.sale_cnt) || 0,
        state_subject: order.state_subject || '',
        reg_time: parseRegTime(order.reg_time),
        matched: !!matchedInst,
        institution_id: matchedInst ? matchedInst.id : null
      });

      if (matchedInst) matchCount++;
    }

    // 배치 삽입 (500개씩)
    for (let i = 0; i < records.length; i += 500) {
      const batch = records.slice(i, i + 500);
      const { error } = await supabase.from('orders').insert(batch);
      if (error) throw error;
    }

    statusEl.textContent = `${newOrders.length}건 동기화 (매칭 ${matchCount})`;
    showToast(`${newOrders.length}건 주문 동기화 완료`, 'success');
    loadOrders();

  } catch (err) {
    statusEl.textContent = '동기화 실패: ' + err.message;
    showToast('주문 동기화 실패', 'error');
  }
}
