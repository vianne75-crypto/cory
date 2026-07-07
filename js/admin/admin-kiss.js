// ============================================
// KISS 2026 리드 관리 (kiss_signups + kiss_diagnosis)
// ============================================

let kissCache = [];
let kissPage = 1;
let kissMode = 'signups'; // signups | diagnosis
let kissDiagnosisCache = [];

// ─── 관리자 조회: PII 테이블(kiss_signups·kiss_diagnosis)은 anon RLS 차단 →
//     aps-lead Worker 시크릿 엔드포인트(X-Admin-Key)로 조회. 키는 세션에 1회 입력·보관. ───
const KISS_ADMIN_BASE = 'https://aps-lead.vianne75.workers.dev';

function kissAdminKey() {
  let k = sessionStorage.getItem('kissAdminKey');
  if (!k) {
    k = (prompt('KISS 리드 조회 관리자 키를 입력하세요 (세션 1회):') || '').trim();
    if (k) sessionStorage.setItem('kissAdminKey', k);
  }
  return k;
}

async function kissAdminFetch(path) {
  const key = kissAdminKey();
  if (!key) return { data: null, error: { message: '관리자 키가 필요합니다' } };
  try {
    const res = await fetch(KISS_ADMIN_BASE + path, { headers: { 'X-Admin-Key': key } });
    if (res.status === 401) {
      sessionStorage.removeItem('kissAdminKey');   // 잘못된 키 → 재입력 유도
      return { data: null, error: { message: '관리자 키가 올바르지 않습니다 (재시도)' } };
    }
    if (!res.ok) return { data: null, error: { message: 'HTTP ' + res.status } };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}

async function loadKissSignups() {
  kissMode = 'signups';
  const statusEl = document.getElementById('kissSyncStatus');
  if (statusEl) statusEl.textContent = '로드 중...';

  const { data, error } = await kissAdminFetch('/kiss-admin-list?limit=500');

  if (error) {
    showToast('KISS 리드 로드 실패: ' + error.message, 'error');
    if (statusEl) statusEl.textContent = '로드 실패';
    return;
  }

  kissCache = data || [];
  renderKissStats();
  renderKissTable();
  if (statusEl) statusEl.textContent = `${kissCache.length}건 로드됨`;
}

async function loadKissDiagnosis() {
  kissMode = 'diagnosis';
  const statusEl = document.getElementById('kissSyncStatus');
  if (statusEl) statusEl.textContent = '진단 응답 로드 중...';

  const { data, error } = await kissAdminFetch('/kiss-admin-diagnosis?limit=500');

  if (error) {
    showToast('진단 응답 로드 실패: ' + error.message, 'error');
    if (statusEl) statusEl.textContent = '로드 실패';
    return;
  }

  kissDiagnosisCache = data || [];
  renderKissDiagnosisStats();
  renderKissDiagnosisTable();
  if (statusEl) statusEl.textContent = `${kissDiagnosisCache.length}건 진단 응답`;
}

function renderKissStats() {
  const total = kissCache.length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = kissCache.filter(d => (d.created_at || '').slice(0, 10) === today).length;
  const matched = kissCache.filter(d => d.matched_institution_id).length;
  const processed = kissCache.filter(d => d.processed).length;
  const marketing = kissCache.filter(d => d.marketing_agreed).length;
  const withEmail = kissCache.filter(d => d.email).length;

  const el = document.getElementById('kissStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card"><span class="label">전체 신청</span><span class="value">${total}</span></div>
    <div class="stat-card"><span class="label">오늘</span><span class="value" style="color:#4CAF50">${todayCount}</span></div>
    <div class="stat-card"><span class="label">기관 매칭</span><span class="value" style="color:#4CAF50">${matched}</span><span style="font-size:11px;color:#888">${total ? Math.round(100*matched/total) : 0}%</span></div>
    <div class="stat-card"><span class="label">처리됨</span><span class="value">${processed}</span></div>
    <div class="stat-card"><span class="label">마케팅 동의</span><span class="value" style="color:#1976D2">${marketing}</span></div>
    <div class="stat-card"><span class="label">이메일 보유</span><span class="value">${withEmail}</span></div>
  `;
}

function renderKissTable() {
  const total = kissCache.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (kissPage > totalPages) kissPage = totalPages;
  const start = (kissPage - 1) * PAGE_SIZE;
  const pageData = kissCache.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('kissBody');
  if (!tbody) return;

  // 열 헤더 복귀 (진단 뷰 → 신청 뷰 전환 시)
  const thead = document.querySelector('#kissTable thead tr');
  if (thead) {
    thead.innerHTML = `
      <th>ID</th><th>이름</th><th>연락처</th><th>기관</th><th>이메일</th>
      <th>주소</th><th>매칭</th><th>처리</th><th>UTM</th><th>신청 시각</th>
    `;
  }

  tbody.innerHTML = pageData.map(d => {
    const inst = d.institutions ? d.institutions.name : (d.institution_name || '-');
    const matchBadge = d.matched_institution_id
      ? `<span class="match-badge matched">✓ 매칭</span>`
      : `<span class="match-badge unmatched">미매칭</span>`;
    const processedBadge = d.processed
      ? `<span style="color:#4CAF50;font-size:11px;">✅ ${(d.processed_at || '').slice(0,10)}</span>`
      : `<button class="btn btn-sm" style="background:#607D8B;color:#fff;font-size:11px;padding:2px 8px;" onclick="toggleKissProcessed(${d.id}, true)">처리 완료</button>`;
    const utm = [d.utm_source, d.utm_medium, d.utm_content].filter(Boolean).join('/') || '-';
    const created = (d.created_at || '').replace('T', ' ').slice(0, 19);
    const email = d.email || '-';
    const marketing = d.marketing_agreed ? ' 📧' : '';

    return `<tr>
      <td>${d.id}</td>
      <td><strong>${escapeHtml(d.name)}</strong>${marketing}</td>
      <td>${escapeHtml(d.phone || '-')}</td>
      <td>${escapeHtml(d.institution_name || '-')}<br><small style="color:#888">${escapeHtml(inst)}</small></td>
      <td>${escapeHtml(email)}</td>
      <td><small>${escapeHtml(d.address || '-')}</small></td>
      <td>${matchBadge}</td>
      <td>${processedBadge}</td>
      <td><small>${escapeHtml(utm)}</small></td>
      <td><small>${escapeHtml(created)}</small></td>
    </tr>`;
  }).join('');

  renderPagination('kissPagination', kissPage, totalPages, 'goKissPage');
}

function renderKissDiagnosisStats() {
  const total = kissDiagnosisCache.length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = kissDiagnosisCache.filter(d => (d.created_at || '').slice(0, 10) === today).length;
  const linkedToSignup = kissDiagnosisCache.filter(d => d.ref_key).length;

  const el = document.getElementById('kissStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card"><span class="label">진단 응답</span><span class="value">${total}</span></div>
    <div class="stat-card"><span class="label">오늘</span><span class="value" style="color:#4CAF50">${todayCount}</span></div>
    <div class="stat-card"><span class="label">신청 연결</span><span class="value">${linkedToSignup}</span><span style="font-size:11px;color:#888">${total ? Math.round(100*linkedToSignup/total) : 0}%</span></div>
  `;
}

function renderKissDiagnosisTable() {
  const total = kissDiagnosisCache.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (kissPage > totalPages) kissPage = totalPages;
  const start = (kissPage - 1) * PAGE_SIZE;
  const pageData = kissDiagnosisCache.slice(start, start + PAGE_SIZE);

  const thead = document.querySelector('#kissTable thead tr');
  if (thead) {
    thead.innerHTML = `
      <th>ID</th><th>연결(ref_key)</th>
      <th>Q1 참석반복</th><th>Q2 채널</th><th>Q3 공공활용</th>
      <th>Q4 CJM</th><th>Q5 도입활용</th><th>Q6 플라이휠 의향</th>
      <th>응답 시각</th>
    `;
  }

  const tbody = document.getElementById('kissBody');
  if (!tbody) return;
  tbody.innerHTML = pageData.map(d => {
    const created = (d.created_at || '').replace('T', ' ').slice(0, 19);
    // ref_key = salt SHA-256 비식별 조인키 (원본 전화 아님)
    const ref = d.ref_key ? `<span style="color:#4CAF50">✓ ${escapeHtml(String(d.ref_key).slice(0, 12))}…</span>` : `<span style="color:#999">-</span>`;
    return `<tr>
      <td>${d.id}</td>
      <td>${ref}</td>
      <td><small>${escapeHtml(d.q1_attendance || '-')}</small></td>
      <td><small>${escapeHtml(Array.isArray(d.q2_channels) ? d.q2_channels.join(',') : (d.q2_channels || '-'))}${d.q2_channels_etc ? ' / 기타: ' + escapeHtml(d.q2_channels_etc) : ''}</small></td>
      <td><small>${escapeHtml(d.q3_public || '-')}</small></td>
      <td><small>${escapeHtml(d.q4_cjm || '-')}</small></td>
      <td><small>${escapeHtml(d.q5_usage || '-')}</small></td>
      <td><small>${escapeHtml(d.q6_flywheel || '-')}</small></td>
      <td><small>${escapeHtml(created)}</small></td>
    </tr>`;
  }).join('');

  renderPagination('kissPagination', kissPage, totalPages, 'goKissPage');
}

async function toggleKissProcessed(id, processed) {
  // kiss_signups 쓰기도 anon RLS 차단 → Worker 시크릿 엔드포인트 경유
  const key = kissAdminKey();
  if (!key) { showToast('관리자 키가 필요합니다', 'error'); return; }
  try {
    const res = await fetch(KISS_ADMIN_BASE + '/kiss-admin-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify({ id, processed }),
    });
    if (res.status === 401) { sessionStorage.removeItem('kissAdminKey'); showToast('관리자 키 오류 (재시도)', 'error'); return; }
    if (!res.ok) { showToast('처리 상태 변경 실패: HTTP ' + res.status, 'error'); return; }
  } catch (e) {
    showToast('처리 상태 변경 실패: ' + e.message, 'error');
    return;
  }

  const item = kissCache.find(k => k.id === id);
  if (item) {
    item.processed = processed;
    item.processed_at = processed ? new Date().toISOString() : null;
  }
  renderKissStats();
  renderKissTable();
  showToast(processed ? '처리 완료 표시' : '처리 취소', 'success');
}

function goKissPage(page) {
  kissPage = page;
  if (kissMode === 'diagnosis') renderKissDiagnosisTable();
  else renderKissTable();
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 탭 활성화 시 자동 로드
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.currentTarget.dataset.tab === 'tab-kiss' && kissCache.length === 0) {
        loadKissSignups();
      }
    });
  });
});
