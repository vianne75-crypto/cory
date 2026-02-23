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
