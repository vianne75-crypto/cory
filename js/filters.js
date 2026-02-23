// 광역시도 필터 옵션 채우기
function populateRegionFilter() {
  const regions = [...new Set(institutionData.map(d => d.region))].sort();
  const select = document.getElementById('filterRegion');
  regions.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    select.appendChild(opt);
  });
}

// 시/군/구 드롭다운 업데이트 (광역시도 선택에 연동)
function updateDistrictFilter() {
  const selectedRegion = document.getElementById('filterRegion').value;
  const select = document.getElementById('filterDistrict');
  const currentValue = select.value;

  // 기존 옵션 제거
  select.innerHTML = '<option value="all">전체</option>';

  // 선택된 광역시도에 해당하는 시/군/구 목록
  let source = institutionData;
  if (selectedRegion !== 'all') {
    source = institutionData.filter(d => d.region === selectedRegion);
  }
  const districts = [...new Set(source.map(d => d.district))].sort();

  districts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
  });

  // 이전 선택값이 여전히 목록에 있으면 유지
  if (districts.includes(currentValue)) {
    select.value = currentValue;
  } else {
    select.value = 'all';
  }
}

// 구매기간 날짜 범위 초기화 (기본: 최근 1년)
function initDateFilter() {
  setDateRange('1y');
}

// 날짜 범위 설정
function setDateRange(range) {
  const today = new Date();
  const dates = institutionData
    .map(d => d.lastPurchaseDate)
    .filter(d => d && d !== '-')
    .sort();
  const maxDate = dates.length > 0 ? dates[dates.length - 1] : today.toISOString().slice(0, 10);
  const minDate = dates.length > 0 ? dates[0] : today.toISOString().slice(0, 10);

  let from, to;
  if (range === '1y') {
    to = maxDate;
    const d = new Date(maxDate);
    d.setFullYear(d.getFullYear() - 1);
    from = d.toISOString().slice(0, 10);
  } else if (range === '2y') {
    to = maxDate;
    const d = new Date(maxDate);
    d.setFullYear(d.getFullYear() - 2);
    from = d.toISOString().slice(0, 10);
  } else if (range === 'prev') {
    const lastYear = new Date(maxDate).getFullYear() - 1;
    from = `${lastYear}-01-01`;
    to = `${lastYear}-12-31`;
  } else {
    from = minDate;
    to = maxDate;
  }

  document.getElementById('filterDateFrom').value = from;
  document.getElementById('filterDateTo').value = to;

  // 활성 버튼 표시
  document.querySelectorAll('.date-quick-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === range);
  });
}

// 빠른 기간 선택 바인딩
function bindDateQuickBtns() {
  document.querySelectorAll('.date-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setDateRange(btn.dataset.range);
      applyFilters();
    });
  });

  // 수동 날짜 변경 시 활성 버튼 해제
  document.getElementById('filterDateFrom').addEventListener('change', clearDateQuickActive);
  document.getElementById('filterDateTo').addEventListener('change', clearDateQuickActive);
}

function clearDateQuickActive() {
  document.querySelectorAll('.date-quick-btn').forEach(btn => btn.classList.remove('active'));
}

// 전체 선택/해제 토글 바인딩
function bindFilterToggles() {
  document.querySelectorAll('.filter-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetClass = toggle.dataset.target;
      const checkboxes = document.querySelectorAll(`.${targetClass}`);
      const allChecked = [...checkboxes].every(cb => cb.checked);

      checkboxes.forEach(cb => cb.checked = !allChecked);
      toggle.textContent = allChecked ? '전체선택' : '전체해제';
      applyFilters();
    });
  });

  // 개별 체크박스 변경 시 토글 버튼 텍스트 동기화
  document.querySelectorAll('.filter-type, .filter-stage, .filter-product').forEach(cb => {
    cb.addEventListener('change', () => {
      updateToggleLabels();
    });
  });
}

// 토글 버튼 텍스트 동기화
function updateToggleLabels() {
  document.querySelectorAll('.filter-toggle').forEach(toggle => {
    const targetClass = toggle.dataset.target;
    const checkboxes = document.querySelectorAll(`.${targetClass}`);
    const allChecked = [...checkboxes].every(cb => cb.checked);
    toggle.textContent = allChecked ? '전체해제' : '전체선택';
  });
}

// 필터 이벤트 바인딩
function bindFilterEvents() {
  document.querySelectorAll('.filter-type, .filter-stage, .filter-product').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
  document.getElementById('filterRegion').addEventListener('change', () => {
    updateDistrictFilter();
    applyFilters();
    const region = document.getElementById('filterRegion').value;
    zoomToRegion(region);
  });
  document.getElementById('filterDistrict').addEventListener('change', () => {
    applyFilters();
    const region = document.getElementById('filterRegion').value;
    const district = document.getElementById('filterDistrict').value;
    zoomToDistrict(region, district);
  });
  document.getElementById('filterDateFrom').addEventListener('change', applyFilters);
  document.getElementById('filterDateTo').addEventListener('change', applyFilters);
  document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

// 필터 적용
function applyFilters() {
  const selectedTypes = [...document.querySelectorAll('.filter-type:checked')].map(cb => cb.value);
  const selectedStages = [...document.querySelectorAll('.filter-stage:checked')].map(cb => cb.value);
  const selectedProducts = [...document.querySelectorAll('.filter-product:checked')].map(cb => cb.value);
  const selectedRegion = document.getElementById('filterRegion').value;
  const selectedDistrict = document.getElementById('filterDistrict').value;
  const dateFrom = document.getElementById('filterDateFrom').value;
  const dateTo = document.getElementById('filterDateTo').value;

  filteredData = institutionData.filter(d => {
    if (!selectedTypes.includes(d.type)) return false;
    if (!selectedStages.includes(d.purchaseStage)) return false;
    if (!d.products.some(p => selectedProducts.includes(p))) return false;
    if (selectedRegion !== 'all' && d.region !== selectedRegion) return false;
    if (selectedDistrict !== 'all' && d.district !== selectedDistrict) return false;
    if (dateFrom && d.lastPurchaseDate && d.lastPurchaseDate !== '-' && d.lastPurchaseDate < dateFrom) return false;
    if (dateTo && d.lastPurchaseDate && d.lastPurchaseDate !== '-' && d.lastPurchaseDate > dateTo) return false;
    return true;
  });

  updateDashboard();
}

// 필터 초기화
function resetFilters() {
  document.querySelectorAll('.filter-type, .filter-stage, .filter-product').forEach(cb => cb.checked = true);
  document.getElementById('filterRegion').value = 'all';
  updateDistrictFilter();
  document.getElementById('filterDistrict').value = 'all';
  setDateRange('1y');
  applyFilters();
  zoomToRegion('all');
  updateToggleLabels();
}
