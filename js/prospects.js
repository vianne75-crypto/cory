// 예상고객 리스트 렌더링
// 구매단계가 인지/관심/고려인 기관 = 예상고객
function renderProspects() {
  const tbody = document.getElementById('prospectBody');
  const prospects = filteredData.filter(d =>
    ['인지', '관심', '고려'].includes(d.purchaseStage)
  );

  document.getElementById('prospectCount').textContent = prospects.length + '개';

  // 구매 가능성 높은 순서: 고려 > 관심 > 인지, 같은 단계 내에서는 상담횟수 많은 순
  const stageOrder = { '고려': 0, '관심': 1, '인지': 2 };
  prospects.sort((a, b) => {
    const stageDiff = stageOrder[a.purchaseStage] - stageOrder[b.purchaseStage];
    if (stageDiff !== 0) return stageDiff;
    return (b.consultCount || 0) - (a.consultCount || 0);
  });

  tbody.innerHTML = prospects.map(d => {
    const stageColor = STAGE_COLORS[d.purchaseStage] || '#ccc';
    const typeInfo = INSTITUTION_TYPES[d.type] || { color: '#999' };
    const priority = d.purchaseStage === '고려' ? '높음' : d.purchaseStage === '관심' ? '중간' : '낮음';
    const priorityClass = d.purchaseStage === '고려' ? 'priority-high' : d.purchaseStage === '관심' ? 'priority-mid' : 'priority-low';

    return `<tr>
      <td><span class="priority-dot ${priorityClass}"></span>${priority}</td>
      <td>${d.name}</td>
      <td><span style="color:${typeInfo.color}; font-weight:600;">${d.type}</span></td>
      <td>${d.region}</td>
      <td><span class="stage-badge" style="background:${stageColor}">${d.purchaseStage}</span></td>
      <td>${d.products.join(', ')}</td>
      <td>${formatCurrency(d.purchaseAmount)}</td>
      <td>${d.consultCount || 0}</td>
      <td>${d.lastConsultDate || '-'}</td>
    </tr>`;
  }).join('');
}

// 지역별 점유율 테이블 렌더링
function renderShareTable() {
  const tbody = document.getElementById('shareBody');
  const regions = Object.keys(REGION_TOTAL_TARGETS).sort();

  const rows = regions.map(region => {
    const total = REGION_TOTAL_TARGETS[region];
    const allInRegion = institutionData.filter(d => d.region === region);
    const purchased = allInRegion.filter(d => ['구매', '만족', '추천'].includes(d.purchaseStage)).length;
    const prospects = allInRegion.filter(d => ['인지', '관심', '고려'].includes(d.purchaseStage)).length;
    const untouched = total - allInRegion.length;
    const sharePercent = total > 0 ? ((purchased / total) * 100).toFixed(1) : '0.0';
    const contactPercent = total > 0 ? ((allInRegion.length / total) * 100).toFixed(1) : '0.0';

    return {
      region, total, purchased, prospects, untouched,
      sharePercent: parseFloat(sharePercent),
      contactPercent: parseFloat(contactPercent)
    };
  });

  // 점유율 높은 순 정렬
  rows.sort((a, b) => b.sharePercent - a.sharePercent);

  tbody.innerHTML = rows.map(r => {
    const barWidth = Math.max(r.sharePercent, 2);
    const barColor = r.sharePercent >= 50 ? '#4CAF50' : r.sharePercent >= 25 ? '#FF9800' : '#F44336';

    return `<tr>
      <td>${r.region}</td>
      <td>${r.total}개</td>
      <td>${r.purchased}개</td>
      <td>${r.prospects}개</td>
      <td>${r.untouched}개</td>
      <td>
        <div class="share-bar-wrap">
          <div class="share-bar" style="width:${barWidth}%; background:${barColor}"></div>
          <span class="share-pct">${r.sharePercent}%</span>
        </div>
      </td>
      <td>${r.contactPercent}%</td>
    </tr>`;
  }).join('');
}
