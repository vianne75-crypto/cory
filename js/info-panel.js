// 오른쪽 정보 패널 업데이트

// TOP 5 지역 + 최근 구매 업데이트
function updateInfoPanel() {
  updateTopRegions();
  updateRecentPurchases();
  updateActiveConsultations();
}

// TOP 5 지역 (납품액 기준)
function updateTopRegions() {
  const regionMap = {};
  filteredData.forEach(d => {
    if (!regionMap[d.region]) regionMap[d.region] = 0;
    regionMap[d.region] += d.purchaseAmount;
  });

  const sorted = Object.entries(regionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('infoTopRegions');
  if (sorted.length === 0) {
    container.innerHTML = '<p class="info-hint">데이터 없음</p>';
    return;
  }

  container.innerHTML = sorted.map((r, i) => `
    <div class="info-top-item">
      <span class="rank">${i + 1}</span>
      <span class="name">${r[0]}</span>
      <span class="amount">${formatCurrency(r[1])}</span>
    </div>
  `).join('');
}

// 최근 구매 기관
function updateRecentPurchases() {
  const recent = [...filteredData]
    .filter(d => d.lastPurchaseDate && d.lastPurchaseDate !== '-')
    .sort((a, b) => b.lastPurchaseDate.localeCompare(a.lastPurchaseDate))
    .slice(0, 5);

  const container = document.getElementById('infoRecentPurchases');
  if (recent.length === 0) {
    container.innerHTML = '<p class="info-hint">데이터 없음</p>';
    return;
  }

  container.innerHTML = recent.map(d => `
    <div class="info-recent-item">
      <span class="inst-name">${d.name}</span>
      <span class="inst-detail">${d.region} | ${d.lastPurchaseDate} | ${formatCurrency(d.purchaseAmount)}</span>
    </div>
  `).join('');
}

// 상담 활발 기관 (상담횟수 TOP 5)
function updateActiveConsultations() {
  const active = [...filteredData]
    .filter(d => d.consultCount > 0)
    .sort((a, b) => b.consultCount - a.consultCount)
    .slice(0, 5);

  const container = document.getElementById('infoActiveConsults');
  if (!container) return;

  if (active.length === 0) {
    container.innerHTML = '<p class="info-hint">상담 기록 없음</p>';
    return;
  }

  container.innerHTML = active.map(d => `
    <div class="info-recent-item">
      <span class="inst-name">${d.name}</span>
      <span class="inst-detail">${d.consultCount}건 | ${d.lastConsultDate || '-'} | <span class="stage-badge stage-sm" style="background:${STAGE_COLORS[d.purchaseStage] || '#ccc'}">${d.purchaseStage}</span></span>
    </div>
  `).join('');
}

// 지역 선택 시 정보 패널 업데이트
function updateInfoRegionSummary(regionName) {
  const container = document.getElementById('infoRegionSummary');
  const total = REGION_TOTAL_TARGETS[regionName] || 0;
  const allInRegion = filteredData.filter(d => d.region === regionName);
  const purchased = allInRegion.filter(d => ['구매', '만족', '추천'].includes(d.purchaseStage));
  const amount = allInRegion.reduce((sum, d) => sum + d.purchaseAmount, 0);
  const volume = allInRegion.reduce((sum, d) => sum + d.purchaseVolume, 0);
  const notPurchased = total - purchased.length;
  const sharePercent = total > 0 ? ((purchased.length / total) * 100).toFixed(1) : '0.0';

  container.innerHTML = `
    <div class="info-region-card">
      <h4>${regionName}</h4>
      <div class="info-region-stats">
        <div class="info-stat-item">
          <span class="label">대상기관</span>
          <span class="value">${total}</span>
        </div>
        <div class="info-stat-item">
          <span class="label">구매기관</span>
          <span class="value" style="color:#4CAF50;">${purchased.length}</span>
        </div>
        <div class="info-stat-item">
          <span class="label">미구매</span>
          <span class="value" style="color:#F44336;">${notPurchased}</span>
        </div>
        <div class="info-stat-item">
          <span class="label">점유율</span>
          <span class="value" style="color:#1a237e;">${sharePercent}%</span>
        </div>
        <div class="info-stat-item">
          <span class="label">납품액</span>
          <span class="value">${formatCurrency(amount)}</span>
        </div>
        <div class="info-stat-item">
          <span class="label">구매량</span>
          <span class="value">${volume.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;
}
