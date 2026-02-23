// 공유 상태
let filteredData = [...institutionData];

// Supabase 캐시에서 데이터 로드 시도
async function loadFromSupabase() {
  try {
    if (SUPABASE_URL === 'https://YOUR_PROJECT.supabase.co') return false;

    const { data, error } = await supabase
      .from('dashboard_cache')
      .select('data')
      .eq('id', 1)
      .single();

    if (error || !data || !data.data) return false;

    const cacheData = data.data;
    if (cacheData.institutions && cacheData.institutions.length > 0) {
      // institutionData 교체
      institutionData.length = 0;
      cacheData.institutions.forEach(d => institutionData.push(d));

      // 지역 대상기관 수 업데이트
      if (cacheData.regionTargets) {
        Object.assign(REGION_TOTAL_TARGETS, cacheData.regionTargets);
      }

      filteredData = [...institutionData];
      console.log(`Supabase 캐시 로드: ${institutionData.length}개 기관`);
      return true;
    }
  } catch (e) {
    console.log('Supabase 캐시 로드 실패, data.js 폴백 사용:', e.message);
  }
  return false;
}

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // Supabase 캐시에서 로드 시도 (실패 시 data.js 폴백)
  await loadFromSupabase();

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
