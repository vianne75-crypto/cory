// ── 그룹 정의 ──
const TABLE_GROUPS = [
  {
    key: 'elite',
    label: '앱스마스터·프로',
    color: '#7b1fa2',
    icon: '⭐',
    match: d => eliteInstIds.has(d.id)
  },
  {
    key: 'hc',
    label: '대학보건센터',
    color: '#00897b',
    icon: '🎓',
    match: d => d.type === '대학보건관리자'
  },
  {
    key: 'clinic',
    label: '보건소',
    color: '#1976d2',
    icon: '🏥',
    match: d => d.type === '보건소'
  },
  {
    key: 'pro',
    label: '전문기관',
    color: '#6a1b9a',
    icon: '🔬',
    match: d => ['전문기관', '금연지원센터'].includes(d.type)
  },
  {
    key: 'edu',
    label: '전공교육',
    color: '#c62828',
    icon: '📚',
    match: d => ['전공교육', '교육기관'].includes(d.type)
  },
  {
    key: 'etc',
    label: '기타',
    color: '#78909c',
    icon: '📋',
    match: () => true  // 위에서 미분류된 기관 전부
  }
];

// 테이블 정렬 상태
let currentSort = { key: null, asc: true };
let groupOpen = { elite: true, hc: true, clinic: true, pro: false, edu: false, etc: false };

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

// 중요도 점수 계산 (퍼널에도 사용)
function calcImportanceScore(d, maxAmount, maxConsult) {
  const STAGE_SCORE = { '인지': 0, '관심': 1, '고려': 2, '구매': 3, '활용': 4, '재구매': 5, '파트너': 6 };
  const amountScore = maxAmount > 0 ? (d.purchaseAmount / maxAmount) * 50 : 0;
  const stageScore = ((STAGE_SCORE[d.purchaseStage] || 0) / 6) * 30;
  const consultScore = maxConsult > 0 ? ((d.consultCount || 0) / maxConsult) * 20 : 0;
  return amountScore + stageScore + consultScore;
}

// 그룹별 기관 분배 (한 기관은 첫 매칭 그룹에만)
function groupInstitutions(data) {
  const result = {};
  TABLE_GROUPS.forEach(g => result[g.key] = []);
  const assigned = new Set();

  TABLE_GROUPS.forEach(g => {
    data.forEach(d => {
      if (!assigned.has(d.id) && g.match(d)) {
        result[g.key].push(d);
        assigned.add(d.id);
      }
    });
  });

  return result;
}

// 행 렌더링
function renderRow(d) {
  const stageColor = STAGE_COLORS[d.purchaseStage] || '#ccc';
  return `<tr>
    <td>${d.name}</td>
    <td>${d.type}</td>
    <td>${d.region} ${d.district || ''}</td>
    <td><span class="stage-badge" style="background:${stageColor}">${d.purchaseStage}</span></td>
    <td>${(d.purchaseVolume || 0).toLocaleString()}개</td>
    <td>${formatCurrency(d.purchaseAmount)}</td>
    <td>${d.purchaseCycle || '-'}</td>
    <td>${d.lastPurchaseDate || '-'}</td>
    <td>${d.consultCount || 0}</td>
    <td>${d.lastConsultDate || '-'}</td>
  </tr>`;
}

// 테이블 렌더링 (그룹화)
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

  const groups = groupInstitutions(sorted);
  let html = '';

  TABLE_GROUPS.forEach(g => {
    const items = groups[g.key];
    const isOpen = groupOpen[g.key] !== false;
    const purchased = items.filter(d =>
      ['구매','활용','재구매','파트너'].includes(d.purchaseStage)).length;

    html += `
      <tr class="group-header-row" onclick="toggleGroup('${g.key}')" data-group="${g.key}">
        <td colspan="10">
          <span class="group-icon">${isOpen ? '▼' : '▶'}</span>
          <span class="group-icon-badge" style="background:${g.color}">${g.icon}</span>
          <strong>${g.label}</strong>
          <span class="group-count">${items.length}개</span>
          <span class="group-purchased">(구매 ${purchased}개)</span>
        </td>
      </tr>
    `;

    if (isOpen) {
      if (items.length === 0) {
        html += `<tr class="group-empty-row" data-group-body="${g.key}">
          <td colspan="10" style="color:#bbb;text-align:center;padding:12px">해당 기관 없음</td>
        </tr>`;
      } else {
        html += items.map(d =>
          `<tr data-group-body="${g.key}">${renderRow(d).replace('<tr>', '')}`
        ).join('');
      }
    }
  });

  tbody.innerHTML = html;
}

// 그룹 토글
function toggleGroup(key) {
  groupOpen[key] = !groupOpen[key];
  renderTable();
}

// TOP5 (퍼널에서 참조용 — 기관목록 탭에서는 제거됨)
function renderTop5() { /* 그룹화로 대체 */ }

// 하이라이트
function highlightInstitution(name) {
  document.querySelectorAll('#tableBody tr[data-group-body]').forEach(row => {
    row.classList.remove('top5-highlight');
    if (row.cells[0] && row.cells[0].textContent === name) {
      row.classList.add('top5-highlight');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}
