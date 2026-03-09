// ============================================
// 기관 CRUD
// ============================================

let instCache = [];
let instFiltered = [];
let instPage = 1;

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

// 검색 + 필터
function searchInstitutions() { filterInstitutions(); }

function filterInstitutions() {
  const search = (document.getElementById('instSearch').value || '').trim().toLowerCase();
  const typeFilter = document.getElementById('instTypeFilter').value;
  const regionFilter = document.getElementById('instRegionFilter').value;
  const stageFilter = document.getElementById('instStageFilter').value;

  instFiltered = instCache.filter(d => {
    if (search && !d.name.toLowerCase().includes(search)) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (regionFilter !== 'all' && d.region !== regionFilter) return false;
    if (stageFilter !== 'all' && d.purchase_stage !== stageFilter) return false;
    return true;
  });

  instPage = 1;
  renderInstStats();
  renderInstTable();
}

// 통계
function renderInstStats() {
  const total = instFiltered.length;
  const purchased = instFiltered.filter(d => ['구매', '만족', '추천'].includes(d.purchase_stage)).length;
  const amount = instFiltered.reduce((s, d) => s + (d.purchase_amount || 0), 0);
  const withConsult = instFiltered.filter(d => d.consult_count > 0).length;

  document.getElementById('instStats').innerHTML = `
    <div class="stat-card"><span class="label">표시 기관</span><span class="value">${total}</span></div>
    <div class="stat-card"><span class="label">구매완료</span><span class="value" style="color:#4CAF50">${purchased}</span></div>
    <div class="stat-card"><span class="label">납품액 합계</span><span class="value">${adminFormatCurrency(amount)}</span></div>
    <div class="stat-card"><span class="label">상담기록 보유</span><span class="value">${withConsult}</span></div>
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
    thead.innerHTML = '<th>ID</th><th>기관명</th><th>지역</th><th>구매단계</th><th>납품액</th><th>구매량</th><th>DM발송</th><th>담당자</th><th>최근구매일</th><th>관리</th>';
  } else {
    thead.innerHTML = '<th>ID</th><th>기관명</th><th>기관유형</th><th>지역</th><th>구매단계</th><th>납품액</th><th>구매량</th><th>상담횟수</th><th>최근구매일</th><th>관리</th>';
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
      if (dmTarget === 'Y' && dmSent === 'Y') { dmLabel = '발송완료'; dmColor = '#4CAF50'; }
      else if (dmTarget === 'Y') { dmLabel = '미발송'; dmColor = '#FF9800'; }
      else if (dmTarget === 'N') { dmLabel = '제외(기구매)'; dmColor = '#2196F3'; }
      else { dmLabel = '미등록'; dmColor = '#999'; }
      const contact = meta.contact_name || meta.contact_phone || '-';

      return `<tr>
        <td>${d.id}</td>
        <td><strong>${d.name}</strong></td>
        <td>${d.region}</td>
        <td><span class="stage-badge" style="background:${stageColor}">${d.purchase_stage}</span></td>
        <td>${adminFormatCurrency(d.purchase_amount || 0)}</td>
        <td>${(d.purchase_volume || 0).toLocaleString()}</td>
        <td><span style="color:${dmColor};font-weight:600;font-size:0.82rem;">${dmLabel}</span></td>
        <td style="font-size:0.82rem;">${contact}</td>
        <td>${d.last_purchase_date || '-'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="editInstitution(${d.id})">수정</button>
          <button class="btn btn-danger btn-sm" onclick="deleteInstitution(${d.id}, '${d.name.replace(/'/g, "\\'")}')">삭제</button>
        </td>
      </tr>`;
    }

    return `<tr>
      <td>${d.id}</td>
      <td><strong>${d.name}</strong></td>
      <td>${d.type}</td>
      <td>${d.region}</td>
      <td><span class="stage-badge" style="background:${stageColor}">${d.purchase_stage}</span></td>
      <td>${adminFormatCurrency(d.purchase_amount || 0)}</td>
      <td>${(d.purchase_volume || 0).toLocaleString()}</td>
      <td>${d.consult_count || 0}</td>
      <td>${d.last_purchase_date || '-'}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editInstitution(${d.id})">수정</button>
        <button class="btn btn-danger btn-sm" onclick="deleteInstitution(${d.id}, '${d.name.replace(/'/g, "\\'")}')">삭제</button>
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
  document.getElementById('editInstLat').value = '';
  document.getElementById('editInstLng').value = '';
  document.getElementById('editInstAmount').value = '0';
  document.getElementById('editInstVolume').value = '0';
  document.getElementById('editInstProd1').checked = false;
  document.getElementById('editInstProd2').checked = false;

  // 지역 옵션 채우기
  const regionSelect = document.getElementById('editInstRegion');
  const regions = Object.keys(REGION_TOTAL_TARGETS || {}).sort();
  regionSelect.innerHTML = regions.map(r => `<option value="${r}">${r}</option>`).join('');

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
  document.getElementById('editInstLat').value = inst.lat || '';
  document.getElementById('editInstLng').value = inst.lng || '';
  document.getElementById('editInstAmount').value = inst.purchase_amount || 0;
  document.getElementById('editInstVolume').value = inst.purchase_volume || 0;
  document.getElementById('editInstProd1').checked = (inst.products || []).includes('알쓰패치');
  document.getElementById('editInstProd2').checked = (inst.products || []).includes('노담패치');

  const regionSelect = document.getElementById('editInstRegion');
  const regions = Object.keys(REGION_TOTAL_TARGETS || {}).sort();
  regionSelect.innerHTML = regions.map(r => `<option value="${r}" ${r === inst.region ? 'selected' : ''}>${r}</option>`).join('');

  document.getElementById('instModal').classList.add('active');
}

function closeInstModal() {
  document.getElementById('instModal').classList.remove('active');
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

  const record = {
    name,
    type: document.getElementById('editInstType').value,
    region: document.getElementById('editInstRegion').value,
    district: document.getElementById('editInstDistrict').value || null,
    lat: parseFloat(document.getElementById('editInstLat').value) || null,
    lng: parseFloat(document.getElementById('editInstLng').value) || null,
    purchase_stage: document.getElementById('editInstStage').value,
    purchase_amount: parseFloat(document.getElementById('editInstAmount').value) || 0,
    purchase_volume: parseInt(document.getElementById('editInstVolume').value) || 0,
    products
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
