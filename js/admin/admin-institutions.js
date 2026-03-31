// ============================================
// 기관 CRUD
// ============================================

let instCache = [];
let instFiltered = [];
let instPage = 1;
let instSearchIds = null; // null=일반검색, Set=주문번호·태그 검색 결과

// 기관 목록 로드 (1000행 제한 우회: 페이지네이션)
async function loadInstitutions() {
  let allData = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      showToast('기관 로드 실패: ' + error.message, 'error');
      return;
    }

    allData = allData.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  instCache = allData;
  populateInstFilters();
  filterInstitutions();
}

// 필터 옵션 채우기
function populateInstFilters() {
  const types = [...new Set(instCache.map(d => d.type))].sort();
  const regions = [...new Set(instCache.map(d => d.region))].sort();

  const typeSelect = document.getElementById('instTypeFilter');
  typeSelect.innerHTML = '<option value="all">전체 유형</option>' +
    types.map(t => `<option value="${t}">${t}</option>`).join('');

  const regionSelect = document.getElementById('instRegionFilter');
  regionSelect.innerHTML = '<option value="all">전체 지역</option>' +
    regions.map(r => `<option value="${r}">${r}</option>`).join('');
}

// 검색 + 필터 (G1: 주문번호, G2: #태그, 기본: 기관명·담당자 등)
async function searchInstitutions() {
  const search = (document.getElementById('instSearch').value || '').trim();

  // G1: 주문번호 — 6자리 이상 숫자
  if (/^\d{6,}$/.test(search)) {
    await _applyOrderSearch(search);
    return;
  }

  // G2: 태그 검색 — #태그
  if (search.startsWith('#') && search.length > 1) {
    await _applyTagSearch(search.slice(1).trim());
    return;
  }

  // 기본 검색: 오버라이드 해제
  instSearchIds = null;
  filterInstitutions();
}

// G1: 주문번호 → 기관 역추적
async function _applyOrderSearch(orderIdx) {
  const { data } = await supabase
    .from('orders')
    .select('institution_id')
    .eq('order_idx', orderIdx)
    .eq('matched', true)
    .limit(1);

  const instId = data?.[0]?.institution_id;
  if (!instId) {
    showToast(`주문 ${orderIdx}: 매칭 기관 없음`, 'error');
    instSearchIds = new Set();
  } else {
    instSearchIds = new Set([instId]);
  }
  _applySearchIds();
}

// G2: #태그 → 상담내역 기반 기관 목록
async function _applyTagSearch(tag) {
  const { data } = await supabase
    .from('consultations')
    .select('institution_id')
    .contains('tags', [tag])
    .not('institution_id', 'is', null);

  if (!data || data.length === 0) {
    showToast(`#${tag}: 해당 기관 없음`, 'error');
    instSearchIds = new Set();
  } else {
    instSearchIds = new Set(data.map(r => r.institution_id));
    showToast(`#${tag} → ${instSearchIds.size}개 기관`, 'success');
  }
  _applySearchIds();
}

// G1/G2 결과 적용 (필터 드롭다운과 조합)
function _applySearchIds() {
  const typeFilter = document.getElementById('instTypeFilter').value;
  const regionFilter = document.getElementById('instRegionFilter').value;
  const stageFilter = document.getElementById('instStageFilter').value;
  const eduFilter = document.getElementById('instEduFilter') ? document.getElementById('instEduFilter').value : 'all';

  instFiltered = instCache.filter(d => {
    if (!instSearchIds.has(d.id)) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (regionFilter !== 'all' && d.region !== regionFilter) return false;
    if (stageFilter !== 'all' && d.purchase_stage !== stageFilter) return false;
    if (eduFilter !== 'all' && getEduLevel(d) !== parseInt(eduFilter)) return false;
    return true;
  });

  instPage = 1;
  renderInstStats();
  renderInstTable();
}

// 기관 통합 검색 — 기관명·시군구·담당자명·연락처·UTM코드
function matchesSearch(d, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const meta = d.metadata || {};
  const targets = [
    d.name,
    d.district,
    meta.contact_name,
    meta.contact_phone,
    meta.utm_code,
  ].filter(Boolean).map(v => String(v).toLowerCase());
  return targets.some(t => t.includes(q));
}

let instNewInflowMode = false;

function filterNewInflows() {
  instNewInflowMode = !instNewInflowMode;
  instSearchIds = null;
  const btn = document.getElementById('newInflowBtn');
  if (btn) btn.style.background = instNewInflowMode ? '#e65100' : '';
  filterInstitutions();
}

function filterInstitutions() {
  // G1/G2 오버라이드 활성 시: 드롭다운 필터만 재적용
  if (instSearchIds !== null) {
    _applySearchIds();
    return;
  }

  const search = (document.getElementById('instSearch').value || '').trim();
  const typeFilter = document.getElementById('instTypeFilter').value;
  const regionFilter = document.getElementById('instRegionFilter').value;
  const stageFilter = document.getElementById('instStageFilter').value;
  const eduFilter = document.getElementById('instEduFilter') ? document.getElementById('instEduFilter').value : 'all';

  const NEW_INFLOW_SOURCES = ['hc_dm_qr','hc_dm_sample','hunter_manual','campaign_dm','consult_discovery'];
  const NEW_INFLOW_STAGES = ['인지','관심','고려'];

  instFiltered = instCache.filter(d => {
    if (instNewInflowMode) {
      if (!NEW_INFLOW_SOURCES.includes(d.sourced_by)) return false;
      if (!NEW_INFLOW_STAGES.includes(d.purchase_stage)) return false;
    }
    if (!matchesSearch(d, search)) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (regionFilter !== 'all' && d.region !== regionFilter) return false;
    if (stageFilter !== 'all' && d.purchase_stage !== stageFilter) return false;
    if (eduFilter !== 'all' && getEduLevel(d) !== parseInt(eduFilter)) return false;
    return true;
  });

  instPage = 1;
  renderInstStats();
  renderInstTable();
}

// 교육 도입 수준 헬퍼
const EDU_LEVEL_ICONS = ['⚪', '🔵', '🟡', '🟠', '🟢'];
const EDU_LEVEL_LABELS = ['미확인', '패치단품', '교육자료', '시각물', '성과보고서'];

function getEduLevel(d) {
  return parseInt((d.metadata || {}).edu_adoption_level) || 0;
}

function renderEduBadge(level) {
  const icon = EDU_LEVEL_ICONS[level] || '⚪';
  const label = EDU_LEVEL_LABELS[level] || '미확인';
  return `<span title="Lv.${level} ${label}" style="font-size:0.82rem;">${icon} Lv.${level}</span>`;
}

// 통계
function renderInstStats() {
  const total = instFiltered.length;
  const purchased = instFiltered.filter(d => ['구매', '만족', '추천'].includes(d.purchase_stage)).length;
  const amount = instFiltered.reduce((s, d) => s + (d.purchase_amount || 0), 0);
  const withConsult = instFiltered.filter(d => d.consult_count > 0).length;

  // 교육 도입 수준 분포
  const eduCounts = [0, 0, 0, 0, 0];
  instFiltered.forEach(d => { eduCounts[getEduLevel(d)]++; });
  const edu2plus = eduCounts[2] + eduCounts[3] + eduCounts[4];

  document.getElementById('instStats').innerHTML = `
    <div class="stat-card"><span class="label">표시 기관</span><span class="value">${total}</span></div>
    <div class="stat-card"><span class="label">구매완료</span><span class="value" style="color:#4CAF50">${purchased}</span></div>
    <div class="stat-card"><span class="label">납품액 합계</span><span class="value">${adminFormatCurrency(amount)}</span></div>
    <div class="stat-card"><span class="label">상담기록 보유</span><span class="value">${withConsult}</span></div>
    <div class="stat-card" title="⚪미확인:${eduCounts[0]} 🔵패치:${eduCounts[1]} 🟡교육자료:${eduCounts[2]} 🟠시각물:${eduCounts[3]} 🟢성과보고서:${eduCounts[4]}">
      <span class="label">교육도입 Lv.2+</span>
      <span class="value" style="color:#FF9800">${edu2plus}</span>
    </div>
  `;
}

// 테이블 렌더링
function renderInstTable() {
  const totalPages = Math.max(1, Math.ceil(instFiltered.length / PAGE_SIZE));
  if (instPage > totalPages) instPage = totalPages;

  const start = (instPage - 1) * PAGE_SIZE;
  const pageData = instFiltered.slice(start, start + PAGE_SIZE);

  // 대학보건관리자 필터 시 DM 컬럼 표시
  const typeFilter = document.getElementById('instTypeFilter').value;
  const isHC = typeFilter === '대학보건관리자';

  // 헤더 동적 변경
  const thead = document.querySelector('#instTable thead tr');
  if (isHC) {
    thead.innerHTML = '<th>ID</th><th>기관명</th><th>지역</th><th>구매단계</th><th>교육도입</th><th>납품액</th><th>구매량</th><th>DM발송</th><th>담당자</th><th>최근구매일</th><th>관리</th>';
  } else {
    thead.innerHTML = '<th>ID</th><th>기관명</th><th>기관유형</th><th>지역</th><th>구매단계</th><th>교육도입</th><th>납품액</th><th>구매량</th><th>상담횟수</th><th>최근구매일</th><th>관리</th>';
  }

  const searchQuery = (document.getElementById('instSearch').value || '').trim().toLowerCase();

  function highlight(text) {
    if (!searchQuery || !text) return text || '';
    const idx = String(text).toLowerCase().indexOf(searchQuery);
    if (idx === -1) return text;
    return String(text).slice(0, idx) +
      `<mark style="background:#fff59d;padding:0">${String(text).slice(idx, idx + searchQuery.length)}</mark>` +
      String(text).slice(idx + searchQuery.length);
  }

  const tbody = document.getElementById('instBody');
  tbody.innerHTML = pageData.map(d => {
    const stageColor = ADMIN_STAGE_COLORS[d.purchase_stage] || '#ccc';

    if (isHC) {
      const meta = d.metadata || {};
      const dmTarget = meta.dm_target || '';
      const dmSent = meta.dm_sent || '';
      let dmLabel = '-';
      let dmColor = '#999';
      if (dmSent) { dmLabel = dmSent.length > 10 ? new Date(dmSent).toLocaleDateString('ko-KR') : dmSent; dmColor = '#4CAF50'; }
      else if (dmTarget === 'Y') { dmLabel = '미발송'; dmColor = '#FF9800'; }
      else { dmLabel = '-'; dmColor = '#999'; }
      const contact = highlight(meta.contact_name) || highlight(meta.contact_phone) || '-';

      return `<tr>
        <td>${d.id}</td>
        <td><strong>${highlight(d.name)}</strong>${d.district ? `<br><small style="color:#999">${highlight(d.district)}</small>` : ''}</td>
        <td>${d.region}</td>
        <td><span class="stage-badge" style="background:${stageColor}">${d.purchase_stage}</span></td>
        <td>${renderEduBadge(getEduLevel(d))}</td>
        <td>${adminFormatCurrency(d.purchase_amount || 0)}</td>
        <td>${(d.purchase_volume || 0).toLocaleString()}</td>
        <td><span style="color:${dmColor};font-weight:600;font-size:0.82rem;">${dmLabel}</span></td>
        <td style="font-size:0.82rem;">${contact}</td>
        <td>${d.last_purchase_date || '-'}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="openInstConsultModal(${d.id},'${d.name.replace(/'/g, "\\'")}')">상담</button>
          <button class="btn btn-secondary btn-sm" onclick="editInstitution(${d.id})">수정</button>
        </td>
      </tr>`;
    }

    return `<tr>
      <td>${d.id}</td>
      <td><strong>${highlight(d.name)}</strong>${d.district ? `<br><small style="color:#999">${highlight(d.district)}</small>` : ''}</td>
      <td>${d.type}</td>
      <td>${d.region}</td>
      <td><span class="stage-badge" style="background:${stageColor}">${d.purchase_stage}</span></td>
      <td>${renderEduBadge(getEduLevel(d))}</td>
      <td>${adminFormatCurrency(d.purchase_amount || 0)}</td>
      <td>${(d.purchase_volume || 0).toLocaleString()}</td>
      <td><a href="#" onclick="openInstConsultModal(${d.id},'${d.name.replace(/'/g, "\\'")}');return false" style="color:#1976D2;text-decoration:underline;cursor:pointer">${d.consult_count || 0}</a></td>
      <td>${d.last_purchase_date || '-'}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="openInstConsultModal(${d.id},'${d.name.replace(/'/g, "\\'")}')">상담</button>
        <button class="btn btn-secondary btn-sm" onclick="editInstitution(${d.id})">수정</button>
      </td>
    </tr>`;
  }).join('');

  renderPagination('instPagination', instPage, totalPages, 'goInstPage');
}

function goInstPage(page) {
  instPage = page;
  renderInstTable();
}

// 기관 추가 모달
function showAddInstitutionModal() {
  document.getElementById('instModalTitle').textContent = '기관 추가';
  document.getElementById('editInstId').value = '';
  document.getElementById('editInstName').value = '';
  document.getElementById('editInstType').value = '보건소';
  document.getElementById('editInstStage').value = '인지';
  document.getElementById('editInstDistrict').value = '';
  document.getElementById('editInstAddress').value = '';
  document.getElementById('editInstAddressDetail').value = '';
  document.getElementById('editInstRecipient').value = '';
  document.getElementById('editInstZipcode').value = '';
  document.getElementById('editInstWcoMemId').value = '';
  document.getElementById('editInstAmount').value = '0';
  document.getElementById('editInstVolume').value = '0';
  document.getElementById('editInstProd1').checked = false;
  document.getElementById('editInstProd2').checked = false;
  document.getElementById('editInstEduLevel').value = '0';

  // 지역 옵션 채우기
  const regionSelect = document.getElementById('editInstRegion');
  const regions = Object.keys(REGION_TOTAL_TARGETS || {}).sort();
  regionSelect.innerHTML = regions.map(r => `<option value="${r}">${r}</option>`).join('');

  document.getElementById('instModalTabs').style.display = 'none';
  switchInstTab('info');
  document.getElementById('instModal').classList.add('active');
}

// 기관 수정 모달
function editInstitution(id) {
  const inst = instCache.find(d => d.id === id);
  if (!inst) return;

  document.getElementById('instModalTitle').textContent = '기관 수정';
  document.getElementById('editInstId').value = inst.id;
  document.getElementById('editInstName').value = inst.name;
  document.getElementById('editInstType').value = inst.type;
  document.getElementById('editInstStage').value = inst.purchase_stage;
  document.getElementById('editInstDistrict').value = inst.district || '';
  document.getElementById('editInstAddress').value = (inst.metadata && inst.metadata.address) || '';
  document.getElementById('editInstAddressDetail').value = (inst.metadata && inst.metadata.address_detail) || '';
  document.getElementById('editInstRecipient').value = (inst.metadata && inst.metadata.recipient) || '';
  document.getElementById('editInstZipcode').value = (inst.metadata && inst.metadata.zipcode) || '';
  document.getElementById('editInstWcoMemId').value = (inst.metadata && inst.metadata.wco_mem_id) || '';
  const hon = (inst.metadata && inst.metadata.honorific) || '귀하';
  const honEl = document.querySelector(`input[name="honorific"][value="${hon}"]`);
  if (honEl) honEl.checked = true;
  document.getElementById('editInstAmount').value = inst.purchase_amount || 0;
  document.getElementById('editInstVolume').value = inst.purchase_volume || 0;
  document.getElementById('editInstProd1').checked = (inst.products || []).includes('알쓰패치');
  document.getElementById('editInstProd2').checked = (inst.products || []).includes('노담패치');
  document.getElementById('editInstEduLevel').value = String(getEduLevel(inst));

  const regionSelect = document.getElementById('editInstRegion');
  const regions = Object.keys(REGION_TOTAL_TARGETS || {}).sort();
  regionSelect.innerHTML = regions.map(r => `<option value="${r}" ${r === inst.region ? 'selected' : ''}>${r}</option>`).join('');

  document.getElementById('instModal').classList.add('active');
  // 탭 표시 + 기본정보 탭으로 초기화
  document.getElementById('instModalTabs').style.display = 'block';
  switchInstTab('info');
  loadInstHistory(inst.id);
}

function closeInstModal() {
  document.getElementById('instModal').classList.remove('active');
}

// ── 기관 상세 탭 ──────────────────────────────────────────
function switchInstTab(tab) {
  // 탭 버튼 active 토글
  document.querySelectorAll('#instModalTabs .inst-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('instTabInfo').style.display    = tab === 'info'     ? '' : 'none';
  document.getElementById('instTabConsults').style.display = tab === 'consults' ? '' : 'none';
  document.getElementById('instTabOrders').style.display   = tab === 'orders'   ? '' : 'none';
  // 저장 버튼은 기본정보 탭에서만 표시
  document.getElementById('instModalFoot').style.display = tab === 'info' ? '' : 'none';
}

async function loadInstHistory(instId) {
  const [consultRes, orderRes] = await Promise.all([
    supabase.from('consultations')
      .select('id, date, content, tags, md_name')
      .eq('institution_id', instId)
      .order('date', { ascending: false })
      .limit(50),
    supabase.from('orders')
      .select('id, order_idx, goods_name, sale_price, sale_cnt, reg_time, state_subject, option_user, addr')
      .eq('institution_id', instId)
      .order('reg_time', { ascending: false })
      .limit(100),
  ]);

  const orders = orderRes.data || [];

  // 주소 자동 채우기: 비어있으면 가장 최근 주문의 addr 사용
  const addrEl = document.getElementById('editInstAddress');
  if (addrEl && !addrEl.value.trim() && orders.length) {
    const firstAddr = orders.find(o => o.addr)?.addr || '';
    if (firstAddr) addrEl.value = firstAddr;
  }

  renderInstConsults(consultRes.data || [], consultRes.error);
  renderInstOrders(orders);
}

function renderInstConsults(rows, error) {
  const el = document.getElementById('instDetailConsults');
  if (error) {
    el.innerHTML = `<p class="inst-history-empty" style="color:#c62828;">조회 오류: ${error.message}<br><small>Supabase 콘솔에서 consultations anon SELECT 정책 확인 필요</small></p>`;
    return;
  }
  if (!rows.length) {
    el.innerHTML = '<p class="inst-history-empty">상담 내역이 없습니다.</p>';
    return;
  }
  el.innerHTML = rows.map(r => {
    const date = r.date ? String(r.date).slice(0, 10) : '날짜미상';
    const tags = (r.tags || []).map(t => `<span class="inst-history-tag">${t}</span>`).join('');
    const md   = r.md_name ? `<span class="card-meta">담당: ${r.md_name}</span>` : '';
    return `<div class="inst-history-card">
      <div class="card-date">${date}</div>
      <div class="card-body">${(r.content || '').replace(/</g,'&lt;')}</div>
      ${tags ? `<div class="card-tags">${tags}</div>` : ''}
      ${md}
    </div>`;
  }).join('');
}

function _parseRegTime(val) {
  if (!val) return '날짜미상';
  const s = String(val);
  // YYYYMMDD
  if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  // Unix ms (13자리)
  if (/^\d{13}$/.test(s)) return new Date(Number(s)).toISOString().slice(0, 10);
  // Unix s (10자리)
  if (/^\d{10}$/.test(s)) return new Date(Number(s) * 1000).toISOString().slice(0, 10);
  // ISO 문자열
  return s.slice(0, 10);
}

function renderInstOrders(rows) {
  const el = document.getElementById('instDetailOrders');
  if (!rows.length) {
    el.innerHTML = '<p class="inst-history-empty">납품 이력이 없습니다.</p>';
    return;
  }
  el.innerHTML = rows.map(r => {
    const date    = _parseRegTime(r.reg_time);
    const price   = r.sale_price ? Number(r.sale_price).toLocaleString() + '원' : '-';
    const cnt     = r.sale_cnt ? r.sale_cnt + '개' : '';
    const stateBg = { '배송완료': '#e8f5e9', '입금대기': '#fff8e1', '배송대기': '#e3f2fd', '취소': '#fce4ec' };
    const stateCl = { '배송완료': '#2e7d32', '입금대기': '#f57f17', '배송대기': '#1565c0', '취소': '#c62828' };
    const st = r.state_subject || '';
    const stateBadge = st
      ? `<span style="background:${stateBg[st]||'#f3f4f6'};color:${stateCl[st]||'#555'};font-size:0.75rem;padding:2px 8px;border-radius:10px;font-weight:600;">${st}</span>`
      : '';
    const rows2 = [
      r.option_user ? `<tr><td>주문자</td><td>${r.option_user}</td></tr>` : '',
      r.addr        ? `<tr><td>배송지</td><td>${r.addr}</td></tr>` : '',
    ].filter(Boolean).join('');
    return `<div class="inst-history-card" style="padding:14px 16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:700;color:#1a237e;font-size:0.92rem;">${r.goods_name || '(상품명 없음)'}</span>
        ${stateBadge}
      </div>
      <table style="width:100%;font-size:0.81rem;color:#555;border-collapse:collapse;">
        <tr><td style="width:56px;color:#888;padding:2px 0;">주문번호</td><td>#${r.order_idx || '-'}</td></tr>
        <tr><td style="color:#888;padding:2px 0;">주문일</td><td>${date}</td></tr>
        <tr><td style="color:#888;padding:2px 0;">금액</td><td><strong style="color:#333;">${price}</strong> · ${cnt}</td></tr>
        ${rows2}
      </table>
    </div>`;
  }).join('');
}

// ─── 기관 상담내역 모달 ───

async function openInstConsultModal(instId, instName) {
  const modal = document.getElementById('instConsultModal');
  document.getElementById('icmTitle').textContent = instName;
  document.getElementById('icmInstId').value = instId;
  document.getElementById('icmInstName').value = instName;
  document.getElementById('icmHistory').innerHTML = '<p style="color:#999;text-align:center;padding:24px 0">로딩 중...</p>';
  document.getElementById('icmInfo').innerHTML = '';
  // 입력 폼 초기화
  document.getElementById('icmDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('icmContactType').value = '전화';
  document.getElementById('icmResult').value = '';
  document.getElementById('icmPerson').value = '';
  document.getElementById('icmNextDate').value = '';
  document.getElementById('icmMemo').value = '';
  modal.style.display = 'flex';

  // 기관 정보 + 상담 이력 + 주문 이력 동시 조회
  const [instRes, consultRes, orderRes] = await Promise.all([
    supabase.from('institutions').select('*').eq('id', instId).single(),
    supabase.from('consultations')
      .select('id, date, content, tags, md_name, source, contact_type, result, contact_person, next_followup_date, campaign')
      .eq('institution_id', instId)
      .order('date', { ascending: false })
      .limit(50),
    supabase.from('orders')
      .select('id, order_idx, goods_name, sale_price, sale_cnt, reg_time, state_subject, option_user, addr')
      .eq('institution_id', instId)
      .order('reg_time', { ascending: false })
      .limit(20),
  ]);

  // 기관 정보 카드
  const inst = instRes.data;
  if (inst) {
    const m = inst.metadata || {};
    const phone = m.contact_phone || '';
    const mobile = m.contact_mobile || '';
    const contact = m.contact_name || '';
    const address = m.address || '';
    const address2 = m.address2 || '';
    const zipcode = m.postal_code || '';
    const sample = m.sample_shipped_date
      ? `📦 ${m.sample_shipped_date} 발송 (${m.sample_carrier || ''} ${m.sample_tracking_number || ''})`
      : (m.sample_requested ? '📦 샘플 신청 (미발송)' : '');
    const stage = inst.purchase_stage || '';
    const stageColor = ADMIN_STAGE_COLORS[stage] || '#ccc';

    // 교육 도입 수준
    const eduLevel = getEduLevel(inst);
    const eduLabels = ['—', '패치 구매', '교육자료 활용', '시각물 활용', '성과보고서'];
    const eduText = eduLabels[eduLevel] || '—';

    // 마지막 접촉일 계산
    const consultRows = consultRes.data || [];
    const lastContactDate = consultRows.length ? consultRows[0].date : null;
    const today = new Date().toISOString().slice(0, 10);
    let contactDays = '';
    if (lastContactDate) {
      const diff = Math.floor((new Date(today) - new Date(lastContactDate)) / 86400000);
      contactDays = diff === 0 ? '오늘' : `D+${diff}`;
    }

    // 리드 경로
    const leadSrcMap = { 'hc_dm_qr': 'HC DM → QR', 'hc_dm_sample': 'HC DM → 샘플신청', 'hunter_manual': 'HUNTER 수동', 'campaign_dm': '캠페인 DM', 'consult_discovery': '상담 발견', 'order_discovery': '주문 발견' };
    const leadSrc = inst.sourced_by ? (leadSrcMap[inst.sourced_by] || inst.sourced_by) : '';
    const dmCampaign = m.dm_campaign || '';
    const utmCode = m.utm_code || '';
    const leadGrade = m.lead_grade || '';

    // 메모
    const note = m.note || m.edu_adoption_note || '';

    // 담당자명 자동 채우기
    if (contact) document.getElementById('icmPerson').value = contact;

    document.getElementById('icmInfo').innerHTML = `
      <div style="padding:12px 16px;background:#f8f9fa;border-radius:8px;margin:0 24px 8px;font-size:0.85rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <span class="stage-badge" style="background:${stageColor};margin-right:6px">${stage}</span>
            <strong>${inst.type || ''}</strong>
            ${eduLevel ? ` · 교육도입 <strong>${eduText}</strong>` : ''}
          </div>
          <div style="text-align:right;color:#555">
            ${inst.purchase_amount ? '납품 <strong>' + Number(inst.purchase_amount).toLocaleString() + '원</strong>' : ''}
            ${inst.purchase_volume ? ' · ' + inst.purchase_volume + '개' : ''}
          </div>
        </div>
        ${contact || phone || mobile ? `<div style="margin-bottom:4px;">👤 <strong>${contact}</strong> ${phone ? '<a href="tel:' + phone + '" style="color:#1976D2;font-weight:600">' + phone + '</a>' : ''} ${mobile ? '<a href="tel:' + mobile + '" style="color:#1976D2;font-weight:600">' + mobile + '</a>' : ''}</div>` : ''}
        ${address ? `<div style="margin-bottom:4px;">📍 ${zipcode ? '[' + zipcode + '] ' : ''}${address}${address2 ? ' ' + address2 : ''}</div>` : ''}
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:0.82rem;">
          ${leadSrc ? `<span>🔗 ${leadSrc}${utmCode ? ' (' + utmCode + ')' : ''}${leadGrade ? ' · ' + leadGrade : ''}</span>` : ''}
          ${dmCampaign ? `<span>📨 ${dmCampaign}</span>` : ''}
          ${sample ? `<span>${sample}</span>` : ''}
          ${lastContactDate ? `<span>📞 마지막 접촉 ${lastContactDate} <strong style="color:${contactDays.startsWith('D+') && parseInt(contactDays.slice(2)) > 14 ? '#c62828' : '#555'}">(${contactDays})</strong></span>` : '<span style="color:#c62828">📞 접촉 이력 없음</span>'}
          ${inst.last_purchase_date ? `<span>🛒 최근구매 ${inst.last_purchase_date}</span>` : ''}
        </div>
        <div style="margin-top:6px;display:flex;align-items:center;gap:6px;">
          <span style="font-size:0.82rem;color:#888;">📝 메모:</span>
          <input type="text" id="icmNote" class="input" value="${(note || '').replace(/"/g, '&quot;')}" placeholder="예) 9월 예산편성 확인, 담당자 변경됨" style="flex:1;font-size:0.82rem;padding:4px 8px;">
          <button class="btn btn-secondary btn-sm" onclick="saveInstNote(${instId})" style="white-space:nowrap">저장</button>
        </div>
      </div>
    `;
  }

  // 주문 이력 + 상담 이력 통합 타임라인
  const consultRows = consultRes.data || [];
  const orders = orderRes.data || [];

  let historyHtml = '';

  // 주문 이력 섹션
  if (orders.length) {
    historyHtml += `<div style="padding:8px 0;border-bottom:2px solid #e3f2fd;">
      <strong style="color:#1565c0;font-size:0.82rem;">🛒 주문 이력 (${orders.length}건)</strong>
    </div>`;
    historyHtml += orders.map(r => {
      const date = _parseRegTime(r.reg_time);
      const price = r.sale_price ? Number(r.sale_price).toLocaleString() + '원' : '-';
      const cnt = r.sale_cnt ? r.sale_cnt + '개' : '';
      const st = r.state_subject || '';
      const stColors = { '배송완료': '#2e7d32', '입금대기': '#f57f17', '배송대기': '#1565c0', '취소': '#c62828' };
      return `<div style="padding:6px 0;border-bottom:1px solid #f5f5f5;display:flex;justify-content:space-between;align-items:center;font-size:0.83rem;">
        <div><strong>${date}</strong> · ${(r.goods_name || '').substring(0, 30)}${r.option_user ? ' (' + r.option_user + ')' : ''}</div>
        <div style="text-align:right"><strong>${price}</strong> ${cnt} ${st ? `<span style="color:${stColors[st] || '#555'};font-weight:600">${st}</span>` : ''}</div>
      </div>`;
    }).join('');
  }

  // 상담 이력 섹션
  historyHtml += `<div style="padding:8px 0;border-bottom:2px solid #e8f5e9;margin-top:${orders.length ? '12px' : '0'};">
    <strong style="color:#2e7d32;font-size:0.82rem;">💬 상담 이력 (${consultRows.length}건)</strong>
  </div>`;

  if (!consultRows.length) {
    historyHtml += '<p style="color:#999;text-align:center;padding:16px 0;font-size:0.85rem;">상담 내역이 없습니다.</p>';
  } else {
    historyHtml += consultRows.map(r => {
      const date = r.date ? String(r.date).slice(0, 10) : '';
      const tags = (r.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join('');
      const src = r.source || '애니빌드';
      const srcColor = src === '팔로업' ? '#1976D2' : '#757575';
      const resultBadge = r.result
        ? `<span class="tag-badge" style="background:${r.result === '통화성공' || r.result === '구매전환' ? '#e8f5e9' : '#fff3e0'};color:${r.result === '통화성공' || r.result === '구매전환' ? '#2e7d32' : '#e65100'}">${r.result}</span>`
        : '';
      const nextDate = r.next_followup_date
        ? `<span style="color:#F57C00;font-size:0.8rem">→ 다음: ${r.next_followup_date}</span>` : '';
      const person = r.contact_person ? `<span style="color:#555;font-size:0.8rem">👤 ${r.contact_person}</span>` : '';
      const contactType = r.contact_type ? `<span style="color:#888;font-size:0.78rem">[${r.contact_type}]</span>` : '';

      return `<div style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <strong style="font-size:0.85rem">${date}</strong>
          <span style="color:${srcColor};font-size:0.78rem">${src}</span>
          ${contactType}
          ${resultBadge}
          ${person}
        </div>
        <div style="font-size:0.85rem;color:#333;margin-bottom:4px;">${(r.content || '').replace(/</g, '&lt;')}</div>
        <div style="display:flex;gap:6px;align-items:center;">${tags} ${nextDate}</div>
      </div>`;
    }).join('');
  }

  document.getElementById('icmHistory').innerHTML = historyHtml;
}

async function saveInstNote(instId) {
  const note = document.getElementById('icmNote').value.trim();
  // 기존 metadata 가져와서 note만 업데이트
  const { data } = await supabase.from('institutions').select('metadata').eq('id', instId).single();
  const meta = data?.metadata || {};
  meta.note = note;
  const { error } = await supabase.from('institutions').update({ metadata: meta }).eq('id', instId);
  if (error) { showToast('메모 저장 실패: ' + error.message, 'error'); return; }
  showToast('메모 저장 완료', 'success');
}

function closeInstConsultModal() {
  document.getElementById('instConsultModal').style.display = 'none';
}

function icmAutoNextDate() {
  const result = document.getElementById('icmResult').value;
  const nextEl = document.getElementById('icmNextDate');
  if (nextEl.value) return; // 이미 입력했으면 건드리지 않음
  const today = new Date();
  const rules = { '통화성공': 14, '부재': 2, '연결불가': 7, '이메일발송': 3 };
  if (rules[result]) {
    today.setDate(today.getDate() + rules[result]);
    nextEl.value = today.toISOString().slice(0, 10);
  } else if (result === '거절') {
    nextEl.value = '';
  }
}

async function saveInstConsult() {
  const instId = document.getElementById('icmInstId').value;
  const instName = document.getElementById('icmInstName').value;
  const date = document.getElementById('icmDate').value;
  const contactType = document.getElementById('icmContactType').value;
  const result = document.getElementById('icmResult').value;
  const person = document.getElementById('icmPerson').value.trim();
  const nextDate = document.getElementById('icmNextDate').value || null;
  const memo = document.getElementById('icmMemo').value.trim();

  if (!date) { showToast('접촉일은 필수입니다.', 'error'); return; }

  const record = {
    source: '팔로업',
    date,
    contact_type: contactType,
    result: result || null,
    contact_person: person || null,
    content: memo || null,
    next_followup_date: nextDate,
    matched: true,
    institution_id: parseInt(instId),
    raw_institution_name: instName,
  };

  const { error } = await supabase.from('consultations').insert([record]);
  if (error) { showToast('저장 실패: ' + error.message, 'error'); return; }

  showToast('상담 기록 저장 완료', 'success');
  // 새로고침 — 이력 다시 로드
  openInstConsultModal(parseInt(instId), instName);
  // 기관 목록도 갱신
  loadConsultations().catch(() => {});
}

// 다음 우편번호 검색
function openAddressSearch() {
  new daum.Postcode({
    oncomplete: function(data) {
      document.getElementById('editInstAddress').value = data.roadAddress || data.jibunAddress;
      document.getElementById('editInstZipcode').value = data.zonecode;
    }
  }).open();
}

// 우편라벨 출력
function printPostLabel() {
  const name      = document.getElementById('editInstName').value.trim();
  const address   = document.getElementById('editInstAddress').value.trim();
  const detail    = document.getElementById('editInstAddressDetail').value.trim();
  const recipient = document.getElementById('editInstRecipient').value.trim();
  const zipcode   = document.getElementById('editInstZipcode').value.trim();
  const honorific = document.querySelector('input[name="honorific"]:checked')?.value || '';

  if (!name || !address) {
    showToast('기관명과 주소를 입력하세요. (주소검색 버튼 이용)', 'error');
    return;
  }

  const toName = recipient ? `${recipient}${honorific ? ' ' + honorific : ''}` : name;

  // 폼텍 LQ-3117 기준: A4, 2열×8행=16칸, 라벨 1개당 99×42mm
  const labelHTML = `
    <div class="lbl-inner">
      <div class="lbl-from">보내는 분 : APS 주식회사</div>
      <div class="lbl-name">${name}${recipient ? '<br><span style="font-size:9pt;">' + toName + '</span>' : ''}</div>
      <div class="lbl-addr">${address}${detail ? '<br>' + detail : ''}</div>
      ${zipcode ? `<div class="lbl-zip">${zipcode}</div>` : ''}
    </div>`;

  const cells = Array.from({ length: 16 }, (_, i) =>
    `<div class="lbl-cell">${i === 0 ? labelHTML : ''}</div>`
  ).join('');

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>우편라벨 — ${name}</title>
    <style>
      @page { size: A4 portrait; margin: 13mm 4.5mm 13mm 4.5mm; }
      @media print { .no-print { display:none; } body { background:#fff; padding:0; } }
      * { box-sizing: border-box; }
      body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; background: #eee; padding: 16px; }
      .sheet {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: repeat(8, 42.3mm);
        width: 201mm;
        background: #fff;
      }
      .lbl-cell {
        width: 100%;
        height: 42.3mm;
        border: 0.4px dashed #bbb;
        position: relative;
        overflow: hidden;
      }
      .lbl-inner {
        padding: 5px 8px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .lbl-from  { font-size: 7pt; color: #888; }
      .lbl-name  { font-size: 10pt; font-weight: 700; color: #1a237e; margin-top: 2px; }
      .lbl-addr  { font-size: 8.5pt; color: #333; line-height: 1.5; flex: 1; margin-top: 3px; }
      .lbl-zip   { font-size: 11pt; font-weight: 900; color: #000; text-align: right; letter-spacing: 2px; }
      button { margin: 14px 0; padding: 9px 28px; font-size: 0.9rem; cursor: pointer; border: none; background: #1a237e; color: #fff; border-radius: 6px; }
    </style>
  </head><body>
    <button class="no-print" onclick="window.print()">🖨 인쇄 (A4 폼텍 16칸)</button>
    <div class="sheet">${cells}</div>
  </body></html>`);
  win.document.close();
}

// 기관 저장
async function saveInstitution() {
  const id = document.getElementById('editInstId').value;
  const name = document.getElementById('editInstName').value.trim();
  if (!name) {
    showToast('기관명을 입력하세요.', 'error');
    return;
  }

  const products = [];
  if (document.getElementById('editInstProd1').checked) products.push('알쓰패치');
  if (document.getElementById('editInstProd2').checked) products.push('노담패치');

  const eduLevel = parseInt(document.getElementById('editInstEduLevel').value) || 0;
  // 기존 metadata 보존 후 edu_adoption 필드 업데이트
  const existingInst = id ? instCache.find(d => d.id === parseInt(id)) : null;
  const existingMeta = (existingInst && existingInst.metadata) ? { ...existingInst.metadata } : {};
  existingMeta.edu_adoption_level = eduLevel;
  existingMeta.edu_adoption_updated = new Date().toISOString().slice(0, 10);
  const addrVal = document.getElementById('editInstAddress').value.trim();
  if (addrVal) existingMeta.address = addrVal;
  const addrDetail = document.getElementById('editInstAddressDetail').value.trim();
  if (addrDetail) existingMeta.address_detail = addrDetail;
  const recipient = document.getElementById('editInstRecipient').value.trim();
  if (recipient) existingMeta.recipient = recipient;
  const zipcode = document.getElementById('editInstZipcode').value.trim();
  if (zipcode) existingMeta.zipcode = zipcode;
  const honorific = document.querySelector('input[name="honorific"]:checked')?.value || '귀하';
  existingMeta.honorific = honorific;
  const wcoMemId = document.getElementById('editInstWcoMemId').value.trim();
  if (wcoMemId) existingMeta.wco_mem_id = wcoMemId;

  const record = {
    name,
    type: document.getElementById('editInstType').value,
    region: document.getElementById('editInstRegion').value,
    district: document.getElementById('editInstDistrict').value || null,
    purchase_stage: document.getElementById('editInstStage').value,
    purchase_amount: parseFloat(document.getElementById('editInstAmount').value) || 0,
    purchase_volume: parseInt(document.getElementById('editInstVolume').value) || 0,
    products,
    metadata: existingMeta
  };

  let error;
  if (id) {
    ({ error } = await supabase.from('institutions').update(record).eq('id', parseInt(id)));
  } else {
    ({ error } = await supabase.from('institutions').insert(record));
  }

  if (error) {
    showToast('저장 실패: ' + error.message, 'error');
    return;
  }

  closeInstModal();
  showToast(id ? '기관 수정 완료' : '기관 추가 완료', 'success');
  loadInstitutions();
}

// 기관 삭제
async function deleteInstitution(id, name) {
  if (!confirm(`"${name}" 기관을 삭제하시겠습니까?`)) return;

  const { error } = await supabase.from('institutions').delete().eq('id', id);
  if (error) {
    showToast('삭제 실패: ' + error.message, 'error');
    return;
  }

  showToast('기관 삭제 완료', 'success');
  loadInstitutions();
}

// ─── 교육도입수준 초기 배치 (X2) ───
// 구매 이력 기반으로 edu_adoption_level이 없는 기관에 초기값 설정
// Lv.3: 재구매·파트너·만족·추천 / Lv.2: 구매+500개↑ / Lv.1: 구매 / Lv.0: 그 외(null 유지)
async function runEduAdoptionBatch() {
  const targets = instCache.filter(d => {
    const level = (d.metadata || {}).edu_adoption_level;
    return level === undefined || level === null || level === '';
  });

  if (targets.length === 0) {
    showToast('모든 기관에 이미 교육도입수준이 설정되어 있습니다.', 'success');
    return;
  }

  // Lv.1 이상 대상만 필터 (Lv.0은 null과 동일 — 업데이트 불필요)
  const toUpdate = targets
    .map(inst => {
      const stage = inst.purchase_stage;
      const volume = inst.purchase_volume || 0;
      let level = 0;
      if (['재구매', '파트너', '만족', '추천'].includes(stage)) level = 3;
      else if (stage === '구매' && volume >= 500) level = 2;
      else if (stage === '구매') level = 1;
      return { inst, level };
    })
    .filter(({ level }) => level > 0);

  if (toUpdate.length === 0) {
    showToast('초기 배치 대상 없음 (구매 기관 없음)', 'success');
    return;
  }

  if (!confirm(`교육도입수준 초기 배치를 실행합니다.\n\n대상: ${toUpdate.length}건 (Lv.1~3)\n구매 이력 기반 추정값입니다.\n\n계속하시겠습니까?`)) return;

  let updated = 0, failed = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const { inst, level } of toUpdate) {
    const newMeta = {
      ...(inst.metadata || {}),
      edu_adoption_level: level,
      edu_adoption_updated: today,
      edu_adoption_note: '초기 배치 (구매 이력 기반 추정)',
    };

    const { error } = await supabase
      .from('institutions')
      .update({ metadata: newMeta })
      .eq('id', inst.id);

    if (error) { failed++; }
    else { updated++; }

    if ((updated + failed) % 30 === 0) {
      showToast(`진행 중... ${updated + failed}/${toUpdate.length}건`, 'success');
    }
  }

  showToast(
    `교육도입 초기 배치 완료: ${updated}건 설정, ${failed > 0 ? failed + '건 실패' : '오류 없음'}`,
    failed > 0 ? 'error' : 'success'
  );
  await loadInstitutions();
}
