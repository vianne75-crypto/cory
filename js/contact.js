// ─── 이달 접촉 필요 뷰 ───
// 윙백서클 8단계 타이밍 기준으로 이번 달 접촉 대상 기관을 자동 분류
// 마지막 접촉일(상담+구매 중 최신) 기준 오름차순 정렬 — 오래된 순 = 가장 긴급

const WINBACK_RULES = [
  {
    id: 'wb1',
    label: '① 해피콜 (D+3~5)',
    desc: '구매 후 4일 전후 — 현장 반응 해석 지원',
    agent: 'BOND 가온',
    minDays: 3, maxDays: 5,
    basis: 'lastPurchaseDate',
    color: '#1976D2',
    stages: ['구매', '활용', '재구매', '파트너']
  },
  {
    id: 'wb2',
    label: '② 효과측정 (D+12~16)',
    desc: '구매 후 14일 전후 — 교육 효과 확인·콘텐츠 제공',
    agent: 'FORGE 벼리 + BOND',
    minDays: 12, maxDays: 16,
    basis: 'lastPurchaseDate',
    color: '#388E3C',
    stages: ['구매', '활용', '재구매', '파트너']
  },
  {
    id: 'wb3',
    label: '③ 콘텐츠 제공 (D+27~33)',
    desc: '구매 후 30일 전후 — 활용→재구매 전환 핵심 타이밍',
    agent: 'BOND 가온',
    minDays: 27, maxDays: 33,
    basis: 'lastPurchaseDate',
    color: '#7B1FA2',
    stages: ['구매', '활용', '재구매', '파트너']
  },
  {
    id: 'wb4',
    label: '④ 보상 제공 (D+55~65)',
    desc: '구매 후 60일 전후 — 재구매 프로모션·인센티브',
    agent: 'PULSE 다온',
    minDays: 55, maxDays: 65,
    basis: 'lastPurchaseDate',
    color: '#F57C00',
    stages: ['구매', '활용', '재구매', '파트너']
  },
  {
    id: 'wb6',
    label: '⑥ 이탈 감지 (+7~9개월)',
    desc: '마지막 구매 8개월 전후 — 조기 경보·재구매 의향 확인',
    agent: 'PULSE 다온',
    minDays: 210, maxDays: 270,
    basis: 'lastPurchaseDate',
    color: '#E53935',
    stages: ['구매', '활용', '재구매', '파트너']
  },
  {
    id: 'wb7',
    label: '⑦ 재활성화 (+12~14개월)',
    desc: '마지막 구매 13개월 전후 — F6 이탈 복원 트리거',
    agent: 'PULSE 다온',
    minDays: 360, maxDays: 420,
    basis: 'lastPurchaseDate',
    color: '#BF360C',
    stages: ['구매', '활용', '재구매', '파트너']
  },
  {
    id: 'prospect',
    label: '🔥 전환 임박 (상담 활발)',
    desc: '고려 단계 + 최근 30일 내 상담 있음 — 지금이 클로징 타이밍',
    agent: 'PULSE 다온',
    basis: 'consult',
    color: '#00796B',
    stages: ['관심', '고려']
  }
];

function daysBetween(dateStr, refDate) {
  if (!dateStr || dateStr === '-') return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.floor((refDate - d) / (1000 * 60 * 60 * 24));
}

// 마지막 접촉일: 상담일·구매일 중 최신
function lastContactDate(inst) {
  const dates = [inst.lastConsultDate, inst.lastPurchaseDate]
    .filter(d => d && d !== '-' && !isNaN(new Date(d)));
  if (!dates.length) return null;
  return dates.reduce((a, b) => new Date(a) > new Date(b) ? a : b);
}

// 미접촉 긴급도 색상 (일수 기준)
function urgencyColor(days) {
  if (days === null) return '#9e9e9e';
  if (days <= 30)  return '#43a047';
  if (days <= 90)  return '#fb8c00';
  if (days <= 180) return '#e53935';
  return '#880e4f';
}

function getContactTargets() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results = [];

  institutionData.forEach(inst => {
    const purchaseDays = daysBetween(inst.lastPurchaseDate, today);
    const consultDays  = daysBetween(inst.lastConsultDate, today);

    WINBACK_RULES.forEach(rule => {
      if (!rule.stages.includes(inst.purchaseStage)) return;

      if (rule.basis === 'lastPurchaseDate') {
        if (purchaseDays === null) return;
        if (purchaseDays >= rule.minDays && purchaseDays <= rule.maxDays) {
          results.push({ inst, rule, days: purchaseDays });
        }
      } else if (rule.basis === 'consult') {
        if (consultDays !== null && consultDays <= 30) {
          results.push({ inst, rule, days: consultDays });
        }
      }
    });
  });

  return results;
}

function renderContactView() {
  const targets = getContactTargets();
  const container = document.getElementById('contactContent');
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 탭 배지 업데이트
  const badge = document.getElementById('contactBadge');
  if (badge) badge.textContent = targets.length || '';

  if (targets.length === 0) {
    container.innerHTML = `
      <div class="contact-empty">
        <p>이번 달 접촉 필요 기관이 없습니다.</p>
        <p class="contact-empty-sub">구매 기록이 있는 기관이 윙백서클 타이밍에 도달하면 여기에 표시됩니다.</p>
      </div>`;
    return;
  }

  // 규칙별 그룹핑
  const grouped = {};
  WINBACK_RULES.forEach(r => { grouped[r.id] = []; });
  targets.forEach(t => grouped[t.rule.id].push(t));

  const now = new Date().toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  let html = `
    <div class="contact-summary">
      총 <strong>${targets.length}개 기관</strong>이 접촉 대상입니다.
      <span class="contact-updated">기준: ${now}</span>
    </div>`;

  WINBACK_RULES.forEach(rule => {
    const group = grouped[rule.id];
    if (!group.length) return;

    // ★ 마지막 접촉일 기준 오름차순 정렬 (오래된 순 = 가장 긴급)
    group.sort((a, b) => {
      const da = lastContactDate(a.inst);
      const db = lastContactDate(b.inst);
      if (!da && !db) return 0;
      if (!da) return -1; // 접촉 없음 → 최상단
      if (!db) return 1;
      return new Date(da) - new Date(db);
    });

    html += `
      <div class="contact-group">
        <div class="contact-group-header" style="border-left:4px solid ${rule.color}">
          <span class="contact-group-label" style="color:${rule.color}">${rule.label}</span>
          <span class="contact-group-count">${group.length}개</span>
          <span class="contact-group-desc">${rule.desc}</span>
          <span class="contact-group-agent">담당: ${rule.agent}</span>
        </div>
        <div class="table-wrapper">
          <table class="contact-table">
            <thead>
              <tr>
                <th>기관명</th>
                <th>유형</th>
                <th>지역</th>
                <th>구매단계</th>
                <th>납품액</th>
                <th>마지막접촉 ▲</th>
                <th>미접촉</th>
                <th>윙백타이밍</th>
                <th>상담</th>
              </tr>
            </thead>
            <tbody>
              ${group.map(({ inst, rule: r, days }) => {
                const stageColor = STAGE_COLORS[inst.purchaseStage] || '#ccc';
                const lcd = lastContactDate(inst);
                const noContactDays = lcd ? daysBetween(lcd, today) : null;
                const urgColor = urgencyColor(noContactDays);
                const noContactLabel = noContactDays === null
                  ? '미접촉'
                  : `${noContactDays}일`;
                const winbackLabel = r.basis === 'consult'
                  ? `상담 ${days}일 전`
                  : `구매 ${days}일 경과`;
                return `<tr>
                  <td>
                    <span class="contact-inst-link" onclick="goToInstitution('${inst.name.replace(/'/g, "\\'")}')" title="기관 목록에서 보기">
                      ${inst.name}
                    </span>
                  </td>
                  <td>${inst.type}</td>
                  <td>${inst.region} ${inst.district || ''}</td>
                  <td><span class="stage-badge" style="background:${stageColor}">${inst.purchaseStage}</span></td>
                  <td>${formatCurrency(inst.purchaseAmount)}</td>
                  <td class="contact-date-cell">${lcd || '<span class="no-contact-badge">없음</span>'}</td>
                  <td><span class="days-badge" style="background:${urgColor}">${noContactLabel}</span></td>
                  <td><span class="days-badge" style="background:${r.color}">${winbackLabel}</span></td>
                  <td>${inst.consultCount || 0}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

// 기관 목록 탭으로 이동 + 하이라이트
function goToInstitution(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const listBtn = document.querySelector('[data-tab="tab-list"]');
  if (listBtn) listBtn.classList.add('active');
  document.getElementById('tab-list').classList.add('active');

  // 전체 그룹 열기 + 필터 초기화
  TABLE_GROUPS.forEach(g => groupOpen[g.key] = true);
  activeGroupFilter = 'all';
  renderTable();

  setTimeout(() => highlightInstitution(name), 100);
}
