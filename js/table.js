// 테이블 정렬 상태
let currentSort = { key: null, asc: true };

// 테이블 정렬 이벤트 바인딩
function bindTableSort() {
  document.querySelectorAll('#institutionTable th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (currentSort.key === key) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort.key = key;
        currentSort.asc = true;
      }
      renderTable();
    });
  });
}

// 중요도 점수 계산
function calcImportanceScore(d, maxAmount, maxConsult) {
  const STAGE_SCORE = { '인지': 0, '관심': 1, '고려': 2, '구매': 3, '활용': 4, '재구매': 5, '파트너': 6 };
  const amountScore = maxAmount > 0 ? (d.purchaseAmount / maxAmount) * 50 : 0;
  const stageScore = ((STAGE_SCORE[d.purchaseStage] || 0) / 6) * 30;
  const consultScore = maxConsult > 0 ? (d.consultCount / maxConsult) * 20 : 0;
  return amountScore + stageScore + consultScore;
}

// TOP 5 렌더링
function renderTop5() {
  const container = document.getElementById('top5Cards');
  if (!container || filteredData.length === 0) return;

  const maxAmount = Math.max(...filteredData.map(d => d.purchaseAmount), 1);
  const maxConsult = Math.max(...filteredData.map(d => d.consultCount || 0), 1);

  const top5 = [...filteredData]
    .map(d => ({ ...d, _score: calcImportanceScore(d, maxAmount, maxConsult) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5);

  const RANK_COLORS = ['#f5a623', '#9b9b9b', '#cd7f32', '#4a90d9', '#4a90d9'];

  container.innerHTML = top5.map((d, i) => {
    const stageColor = STAGE_COLORS[d.purchaseStage] || '#ccc';
    const typeColor = (INSTITUTION_TYPES[d.type] || {}).color || '#999';
    return `
      <div class="top5-card" onclick="highlightInstitution('${d.name}')">
        <div class="top5-rank" style="color:${RANK_COLORS[i]}">
          ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
        </div>
        <div class="top5-type-dot" style="background:${typeColor}" title="${d.type}"></div>
        <div class="top5-info">
          <div class="top5-name">${d.name}</div>
          <div class="top5-meta">${d.region} · ${d.type}</div>
        </div>
        <div class="top5-stats">
          <span class="stage-badge" style="background:${stageColor}">${d.purchaseStage}</span>
          <div class="top5-amount">${formatCurrency(d.purchaseAmount)}</div>
          <div class="top5-consult">상담 ${d.consultCount || 0}회</div>
        </div>
        <div class="top5-score" title="중요도 점수">${d._score.toFixed(0)}점</div>
      </div>
    `;
  }).join('');
}

// 기관명 하이라이트 (테이블 스크롤)
function highlightInstitution(name) {
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    row.classList.remove('top5-highlight');
    if (row.cells[0] && row.cells[0].textContent === name) {
      row.classList.add('top5-highlight');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

// 테이블 렌더링
function renderTable() {
  const tbody = document.getElementById('tableBody');
  let sorted = [...filteredData];

  if (currentSort.key) {
    sorted.sort((a, b) => {
      let va = a[currentSort.key];
      let vb = b[currentSort.key];
      if (typeof va === 'number') return currentSort.asc ? va - vb : vb - va;
      va = va || '';
      vb = vb || '';
      return currentSort.asc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }

  tbody.innerHTML = sorted.map(d => {
    const stageColor = STAGE_COLORS[d.purchaseStage] || '#ccc';
    return `<tr>
      <td>${d.name}</td>
      <td>${d.type}</td>
      <td>${d.region} ${d.district}</td>
      <td><span class="stage-badge" style="background:${stageColor}">${d.purchaseStage}</span></td>
      <td>${d.purchaseVolume.toLocaleString()}개</td>
      <td>${formatCurrency(d.purchaseAmount)}</td>
      <td>${d.purchaseCycle}</td>
      <td>${d.lastPurchaseDate || '-'}</td>
      <td>${d.consultCount || 0}</td>
      <td>${d.lastConsultDate || '-'}</td>
    </tr>`;
  }).join('');
}
