// ============================================
// 상담내역 관리
// ============================================

let consultCache = [];
let consultFiltered = [];
let consultPage = 1;

async function loadConsultations() {
  const { data, error } = await supabase
    .from('consultations')
    .select('*, institutions(name)')
    .order('date', { ascending: false })
    .limit(5000);

  if (error) {
    showToast('상담 로드 실패: ' + error.message, 'error');
    return;
  }

  consultCache = data || [];
  populateConsultFilters();
  filterConsultations();
}

function populateConsultFilters() {
  const mds = [...new Set(consultCache.map(d => d.md_name).filter(Boolean))].sort();
  const mdSelect = document.getElementById('consultMdFilter');
  mdSelect.innerHTML = '<option value="all">전체 MD</option>' +
    mds.map(m => `<option value="${m}">${m}</option>`).join('');
}

function searchConsultations() { filterConsultations(); }

function filterConsultations() {
  const search = (document.getElementById('consultSearch').value || '').trim().toLowerCase();
  const mdFilter = document.getElementById('consultMdFilter').value;
  const matchFilter = document.getElementById('consultMatchFilter').value;

  consultFiltered = consultCache.filter(d => {
    if (search) {
      const matchName = (d.raw_institution_name || '').toLowerCase().includes(search);
      const matchContent = (d.content || '').toLowerCase().includes(search);
      if (!matchName && !matchContent) return false;
    }
    if (mdFilter !== 'all' && d.md_name !== mdFilter) return false;
    if (matchFilter === 'matched' && !d.matched) return false;
    if (matchFilter === 'unmatched' && d.matched) return false;
    return true;
  });

  consultPage = 1;
  renderConsultStats();
  renderConsultTable();
}

function renderConsultStats() {
  const total = consultFiltered.length;
  const matched = consultFiltered.filter(d => d.matched).length;
  const unmatched = total - matched;

  document.getElementById('consultStats').innerHTML = `
    <div class="stat-card"><span class="label">전체</span><span class="value">${total}</span></div>
    <div class="stat-card"><span class="label">매칭됨</span><span class="value" style="color:#4CAF50">${matched}</span></div>
    <div class="stat-card"><span class="label">미매칭</span><span class="value" style="color:#F44336">${unmatched}</span></div>
  `;
}

function renderConsultTable() {
  const totalPages = Math.max(1, Math.ceil(consultFiltered.length / PAGE_SIZE));
  if (consultPage > totalPages) consultPage = totalPages;

  const start = (consultPage - 1) * PAGE_SIZE;
  const pageData = consultFiltered.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('consultBody');
  tbody.innerHTML = pageData.map(d => {
    const tags = (d.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join('');
    const instName = d.institutions ? d.institutions.name : '-';
    const matchClass = d.matched ? 'matched' : 'unmatched';
    const matchText = d.matched ? '매칭' : '미매칭';
    const content = (d.content || '').substring(0, 80) + ((d.content || '').length > 80 ? '...' : '');

    return `<tr>
      <td>${d.date || '-'}</td>
      <td>${d.md_name || '-'}</td>
      <td class="truncate">${d.raw_institution_name || '-'}</td>
      <td><span class="match-badge ${matchClass}">${matchText}</span> ${instName}</td>
      <td>${tags}</td>
      <td class="truncate">${content}</td>
    </tr>`;
  }).join('');

  renderPagination('consultPagination', consultPage, totalPages, 'goConsultPage');
}

function goConsultPage(page) {
  consultPage = page;
  renderConsultTable();
}
