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

function renderOrderStats() {
  const total = orderCache.length;
  const matched = orderCache.filter(d => d.matched).length;
  const totalAmount = orderCache.reduce((s, d) => s + (d.sale_price || 0) * (d.sale_cnt || 0), 0);

  document.getElementById('orderStats').innerHTML = `
    <div class="stat-card"><span class="label">전체 주문</span><span class="value">${total}</span></div>
    <div class="stat-card"><span class="label">매칭됨</span><span class="value" style="color:#4CAF50">${matched}</span></div>
    <div class="stat-card"><span class="label">미매칭</span><span class="value" style="color:#F44336">${total - matched}</span></div>
    <div class="stat-card"><span class="label">총 금액</span><span class="value">${adminFormatCurrency(totalAmount)}</span></div>
  `;
}

function renderOrderTable() {
  const totalPages = Math.max(1, Math.ceil(orderCache.length / PAGE_SIZE));
  if (orderPage > totalPages) orderPage = totalPages;

  const start = (orderPage - 1) * PAGE_SIZE;
  const pageData = orderCache.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('orderBody');
  tbody.innerHTML = pageData.map(d => {
    const instName = d.institutions ? d.institutions.name : '-';
    const amount = ((d.sale_price || 0) * (d.sale_cnt || 0));
    const matchClass = d.matched ? 'matched' : 'unmatched';
    const matchText = d.matched ? '매칭' : '미매칭';

    return `<tr>
      <td>${d.order_idx || '-'}</td>
      <td>${d.option_user || '-'}</td>
      <td class="truncate">${d.goods_name || '-'}</td>
      <td>${d.sale_cnt || 0}</td>
      <td>${adminFormatCurrency(amount)}</td>
      <td class="truncate">${d.addr || '-'}</td>
      <td><span class="match-badge ${matchClass}">${matchText}</span> ${instName}</td>
      <td>${d.state_subject || '-'}</td>
      <td>${(d.reg_time || '').substring(0, 10)}</td>
    </tr>`;
  }).join('');

  renderPagination('orderPagination', orderPage, totalPages, 'goOrderPage');
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

      // 간단한 이름 매칭
      let matchedInst = null;
      if (optUser && instCache.length > 0) {
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
