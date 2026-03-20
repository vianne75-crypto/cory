// ============================================
// 퍼널 시각화
// ============================================

function renderFunnel() {
  if (!filteredData || filteredData.length === 0) return;

  const total = filteredData.length;

  // 단계별 집계
  const stages = PURCHASE_STAGES.map(stage => {
    const insts = filteredData.filter(d => d.purchaseStage === stage);
    return {
      stage,
      count: insts.length,
      pct: total > 0 ? (insts.length / total * 100) : 0,
      amount: insts.reduce((s, d) => s + d.purchaseAmount, 0),
      color: STAGE_COLORS[stage]
    };
  });

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  // ── KPI 요약 ──
  const pipeline = stages.filter(s => ['인지','관심','고려'].includes(s.stage))
    .reduce((s, d) => s + d.count, 0);
  const converted = stages.filter(s => ['구매','활용','재구매','파트너'].includes(s.stage))
    .reduce((s, d) => s + d.count, 0);
  const convRate = total > 0 ? (converted / total * 100).toFixed(1) : 0;
  const totalRevenue = stages.reduce((s, d) => s + d.amount, 0);
  const repeatCount = stages.filter(s => ['재구매','파트너'].includes(s.stage))
    .reduce((s, d) => s + d.count, 0);

  document.getElementById('funnelKpi').innerHTML = `
    <div class="funnel-kpi-card">
      <div class="fkpi-label">전체 기관</div>
      <div class="fkpi-value">${total.toLocaleString()}</div>
      <div class="fkpi-sub">CRM 등록</div>
    </div>
    <div class="funnel-kpi-card">
      <div class="fkpi-label">파이프라인</div>
      <div class="fkpi-value" style="color:#ffb74d">${pipeline.toLocaleString()}</div>
      <div class="fkpi-sub">인지·관심·고려</div>
    </div>
    <div class="funnel-kpi-card">
      <div class="fkpi-label">구매 전환율</div>
      <div class="fkpi-value" style="color:#4fc3f7">${convRate}%</div>
      <div class="fkpi-sub">${converted}개 구매이상</div>
    </div>
    <div class="funnel-kpi-card">
      <div class="fkpi-label">재구매·파트너</div>
      <div class="fkpi-value" style="color:#66bb6a">${repeatCount.toLocaleString()}</div>
      <div class="fkpi-sub">충성 고객</div>
    </div>
    <div class="funnel-kpi-card">
      <div class="fkpi-label">누적 납품액</div>
      <div class="fkpi-value" style="color:#ab47bc">${formatCurrency(totalRevenue)}</div>
      <div class="fkpi-sub">구매기관 합산</div>
    </div>
  `;

  // ── 비주얼 퍼널 ──
  const divider = `<div class="funnel-divider">인지→구매 퍼널 ─────────────────── 구매→충성 퍼널</div>`;
  const dividerIdx = 3; // '구매' 앞에 구분선

  let visualHtml = '';
  stages.forEach((s, i) => {
    const widthPct = maxCount > 0 ? Math.max(18, Math.round((s.count / maxCount) * 100)) : 18;
    const conv = (i > 0 && stages[i-1].count > 0)
      ? (s.count / stages[i-1].count * 100).toFixed(0)
      : null;

    if (i === dividerIdx) {
      visualHtml += `<div class="funnel-sep-line"><span>구매 전환</span></div>`;
    }

    visualHtml += `
      <div class="funnel-row" data-stage="${s.stage}" onclick="filterByStage('${s.stage}')">
        <div class="funnel-bar-wrap">
          <div class="funnel-bar-bg" style="width:${widthPct}%;background:${s.color}">
            <span class="funnel-bar-label">${s.stage}</span>
            <span class="funnel-bar-count">${s.count}개</span>
          </div>
          <span class="funnel-bar-pct">${s.pct.toFixed(1)}%</span>
        </div>
        ${conv !== null ? `<div class="funnel-conv-arrow">↓ ${conv}%</div>` : ''}
      </div>
    `;
  });

  document.getElementById('funnelVisual').innerHTML = visualHtml;

  // ── 테이블 ──
  let tableHtml = '';
  stages.forEach((s, i) => {
    const conv = (i > 0 && stages[i-1].count > 0)
      ? (s.count / stages[i-1].count * 100).toFixed(1) + '%'
      : '—';
    const isBottom = ['구매','활용','재구매','파트너'].includes(s.stage);
    tableHtml += `
      <tr class="${isBottom ? 'funnel-tr-converted' : ''}"
          style="cursor:pointer" onclick="filterByStage('${s.stage}')">
        <td>
          <span class="funnel-stage-dot" style="background:${s.color}"></span>
          ${s.stage}
        </td>
        <td><strong>${s.count}</strong></td>
        <td>${s.pct.toFixed(1)}%</td>
        <td style="color:${conv === '—' ? '#999' : '#4fc3f7'}">${conv}</td>
        <td>${s.amount > 0 ? formatCurrency(s.amount) : '—'}</td>
      </tr>
    `;
  });

  document.getElementById('funnelTableBody').innerHTML = tableHtml;

  // ── 세그먼트 요약 ──
  const typeBreakdown = {};
  filteredData.filter(d => ['구매','활용','재구매','파트너'].includes(d.purchaseStage))
    .forEach(d => {
      typeBreakdown[d.type] = (typeBreakdown[d.type] || 0) + 1;
    });
  const topTypes = Object.entries(typeBreakdown)
    .sort((a, b) => b[1] - a[1]).slice(0, 5);

  document.getElementById('funnelSegmentSummary').innerHTML = `
    <div class="funnel-seg-title">구매 기관 유형 TOP 5</div>
    ${topTypes.map(([type, cnt]) => `
      <div class="funnel-seg-row">
        <span class="funnel-seg-dot" style="background:${(INSTITUTION_TYPES[type] || {}).color || '#999'}"></span>
        <span class="funnel-seg-name">${type}</span>
        <span class="funnel-seg-cnt">${cnt}개</span>
      </div>
    `).join('')}
  `;
}

// 퍼널 스테이지 클릭 → 기관목록 탭으로 이동 + 필터
function filterByStage(stage) {
  // 기관목록 탭 활성화
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const listBtn = document.querySelector('[data-tab="tab-list"]');
  if (listBtn) listBtn.classList.add('active');
  document.getElementById('tab-list').classList.add('active');

  // 해당 단계 필터 체크박스만 활성화
  document.querySelectorAll('.filter-stage').forEach(cb => {
    cb.checked = cb.value === stage;
  });
  applyFilters();
}
