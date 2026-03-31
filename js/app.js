// 공유 상태
let filteredData = [...institutionData];
let eliteInstIds = new Set(); // 앱스마스터·프로 기관 ID (memlv=스카우트/마스터)

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

// 앱스마스터·프로 기관 ID 로드 (memlv=스카우트/마스터)
async function loadEliteInstIds() {
  try {
    if (SUPABASE_URL === 'https://YOUR_PROJECT.supabase.co') return;
    const { data } = await supabase
      .from('orders')
      .select('institution_id')
      .in('memlv', ['스카우트', '마스터'])
      .not('institution_id', 'is', null);
    if (data) data.forEach(r => eliteInstIds.add(r.institution_id));
  } catch (e) { /* 무시 */ }
}

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // Supabase 캐시에서 로드 시도 (실패 시 data.js 폴백)
  await loadFromSupabase();
  await loadEliteInstIds();

  // 세그먼트 필드 자동 설정 (P0-C)
  institutionData.forEach(d => {
    if (!d.segment) d.segment = getSegment(d.name, d.type);
  });
  filteredData = [...institutionData];

  initMap();
  populateRegionFilter();
  initDateFilter();
  bindFilterEvents();
  bindFilterToggles();
  bindDateQuickBtns();
  bindTableSort();
  bindTabs();
  bindRepurchaseCard();
  updateDashboard();
});

// 재구매율 카드 클릭 → 재구매·파트너 필터링 (P0-A)
function bindRepurchaseCard() {
  const card = document.getElementById('repurchaseCard');
  if (!card) return;
  card.addEventListener('click', () => {
    document.querySelectorAll('.filter-stage').forEach(cb => {
      cb.checked = ['재구매', '파트너'].includes(cb.value);
    });
    applyFilters();
    // 퍼널/목록 탭으로 이동
    const listTab = document.querySelector('.tab-btn[data-tab="tab-list"]');
    if (listTab) listTab.click();
  });
}

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

// 재구매율 계산 (P0-A)
function calcRepurchaseRate(data) {
  const purchased = data.filter(d => ['구매', '활용', '재구매', '파트너'].includes(d.purchaseStage));
  const repurchased = data.filter(d => ['재구매', '파트너'].includes(d.purchaseStage));
  if (purchased.length === 0) return { rate: 0, repurchased: 0, purchased: 0 };
  return {
    rate: (repurchased.length / purchased.length * 100).toFixed(1),
    repurchased: repurchased.length,
    purchased: purchased.length
  };
}

// 요약 카드 업데이트
function updateSummaryCards() {
  const totalInst = filteredData.length;
  const totalAmt = filteredData.reduce((s, d) => s + d.purchaseAmount, 0);
  const totalVol = filteredData.reduce((s, d) => s + d.purchaseVolume, 0);
  const purchased = filteredData.filter(d => ['구매', '활용', '재구매', '파트너'].includes(d.purchaseStage)).length;
  const rr = calcRepurchaseRate(filteredData);
  const gaugeWidth = Math.min(parseFloat(rr.rate) / 25 * 100, 100).toFixed(0);

  document.getElementById('totalInstitutions').textContent = totalInst + '개';
  document.getElementById('totalAmount').textContent = formatCurrency(totalAmt);
  document.getElementById('totalVolume').textContent = totalVol.toLocaleString() + '개';
  document.getElementById('purchasedCount').textContent = purchased + '개';

  const rrEl = document.getElementById('repurchaseRate');
  if (rrEl) {
    rrEl.textContent = rr.rate + '%';
    const gauge = document.getElementById('repurchaseGauge');
    if (gauge) gauge.style.width = gaugeWidth + '%';
    const rrSub = document.getElementById('repurchaseSub');
    if (rrSub) rrSub.textContent = '재구매(' + rr.repurchased + ') / 구매기관(' + rr.purchased + ')';
  }
}

// 전체 대시보드 업데이트
function updateDashboard() {
  updateSummaryCards();
  updateMarkers();
  updateRegionMarkers();
  updateGeoJsonStyle();
  updateCharts();
  renderFunnel();
  renderTop5();
  renderProspects();
  renderShareTable();
  renderTable();
  updateInfoPanel();
  renderContactView();
}
