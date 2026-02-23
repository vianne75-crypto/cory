// 공유 상태
let filteredData = [...institutionData];

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  populateRegionFilter();
  initDateFilter();
  bindFilterEvents();
  bindFilterToggles();
  bindDateQuickBtns();
  bindTableSort();
  bindTabs();
  updateDashboard();
});

// 탭 전환
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      // 지도 탭 전환 시 사이즈 갱신
      if (btn.dataset.tab === 'tab-map' && map) {
        setTimeout(() => map.invalidateSize(), 100);
      }
    });
  });
}

// 요약 카드 업데이트
function updateSummaryCards() {
  const totalInst = filteredData.length;
  const totalAmt = filteredData.reduce((s, d) => s + d.purchaseAmount, 0);
  const totalVol = filteredData.reduce((s, d) => s + d.purchaseVolume, 0);
  const purchased = filteredData.filter(d => ['구매', '만족', '추천'].includes(d.purchaseStage)).length;

  document.getElementById('totalInstitutions').textContent = totalInst + '개';
  document.getElementById('totalAmount').textContent = formatCurrency(totalAmt);
  document.getElementById('totalVolume').textContent = totalVol.toLocaleString() + '개';
  document.getElementById('purchasedCount').textContent = purchased + '개';
}

// 전체 대시보드 업데이트
function updateDashboard() {
  updateSummaryCards();
  updateMarkers();
  updateRegionMarkers();
  updateGeoJsonStyle();
  updateCharts();
  renderProspects();
  renderShareTable();
  renderTable();
  updateInfoPanel();
}
