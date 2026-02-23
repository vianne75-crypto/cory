// ============================================
// 미매칭 상담 매칭
// ============================================

let unmatchedCache = [];
let unmatchedPage = 1;
let currentMatchId = null;

async function loadUnmatched() {
  const { data, error } = await supabase
    .from('unmatched_consultations')
    .select('*, institutions:suggested_institution_id(name, region, type)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    showToast('미매칭 로드 실패: ' + error.message, 'error');
    return;
  }

  unmatchedCache = data || [];
  document.getElementById('unmatchedCount').textContent = unmatchedCache.length + '건';
  renderUnmatchedTable();
}

function renderUnmatchedTable() {
  const totalPages = Math.max(1, Math.ceil(unmatchedCache.length / PAGE_SIZE));
  if (unmatchedPage > totalPages) unmatchedPage = totalPages;

  const start = (unmatchedPage - 1) * PAGE_SIZE;
  const pageData = unmatchedCache.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('unmatchedBody');
  tbody.innerHTML = pageData.map(d => {
    const tags = (d.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join('');
    const suggested = d.institutions
      ? `${d.institutions.name} (${d.institutions.region})`
      : '-';
    const score = d.suggestion_score
      ? (d.suggestion_score * 100).toFixed(0) + '%'
      : '-';

    return `<tr>
      <td>${d.date || '-'}</td>
      <td>${d.md_name || '-'}</td>
      <td class="truncate">${d.raw_institution_name || '-'}</td>
      <td>${tags}</td>
      <td>${suggested}</td>
      <td>${score}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="openMatchModal(${d.id})">매칭</button>
        ${d.suggested_institution_id ? `<button class="btn btn-secondary btn-sm" onclick="acceptSuggestion(${d.id}, ${d.suggested_institution_id})">수락</button>` : ''}
      </td>
    </tr>`;
  }).join('');

  renderPagination('unmatchedPagination', unmatchedPage, totalPages, 'goUnmatchedPage');
}

function goUnmatchedPage(page) {
  unmatchedPage = page;
  renderUnmatchedTable();
}

// 자동 매칭 (Levenshtein 기반)
async function autoMatchAll() {
  if (instCache.length === 0) await loadInstitutions();

  let matchCount = 0;
  const updates = [];

  for (const item of unmatchedCache) {
    const name = (item.raw_institution_name || '').trim();
    if (!name) continue;

    const best = findBestMatch(name, instCache);
    if (best) {
      updates.push({
        id: item.id,
        suggested_institution_id: best.inst.id,
        suggestion_score: best.score
      });
      matchCount++;
    }
  }

  // 배치 업데이트
  for (const u of updates) {
    await supabase
      .from('unmatched_consultations')
      .update({
        suggested_institution_id: u.suggested_institution_id,
        suggestion_score: u.suggestion_score
      })
      .eq('id', u.id);
  }

  showToast(`${matchCount}건 자동 매칭 추천 완료`, 'success');
  loadUnmatched();
}

// 퍼지 매칭
function findBestMatch(name, institutions) {
  let bestDist = Infinity;
  let bestInst = null;

  // 1. 정확 매칭
  const exact = institutions.find(d => d.name === name);
  if (exact) return { inst: exact, score: 1.0 };

  // 2. 부분 문자열
  const subs = institutions.filter(d => d.name.includes(name) || name.includes(d.name));
  if (subs.length === 1) return { inst: subs[0], score: 0.9 };

  // 3. Levenshtein
  const threshold = Math.max(2, Math.floor(name.length * 0.3));
  for (const inst of institutions) {
    const dist = levenshteinDist(name, inst.name);
    if (dist < bestDist && dist <= threshold) {
      bestDist = dist;
      bestInst = inst;
    }
  }

  if (bestInst) {
    const maxLen = Math.max(name.length, bestInst.name.length);
    const score = 1 - (bestDist / maxLen);
    return { inst: bestInst, score };
  }

  return null;
}

// Levenshtein 거리
function levenshteinDist(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
      );
    }
  }
  return dp[m][n];
}

// 매칭 모달
function openMatchModal(unmatchedId) {
  currentMatchId = unmatchedId;
  const item = unmatchedCache.find(d => d.id === unmatchedId);
  if (!item) return;

  document.getElementById('matchInfo').innerHTML = `
    <p><strong>기관명(원본):</strong> ${item.raw_institution_name || '-'}</p>
    <p><strong>날짜:</strong> ${item.date || '-'} | <strong>MD:</strong> ${item.md_name || '-'}</p>
    <p><strong>태그:</strong> ${(item.tags || []).join(', ')}</p>
    <p><strong>내용:</strong> ${(item.content || '').substring(0, 200)}</p>
  `;

  document.getElementById('matchSearchInput').value = item.raw_institution_name || '';
  searchMatchCandidates();
  document.getElementById('matchModal').classList.add('active');
}

function closeMatchModal() {
  document.getElementById('matchModal').classList.remove('active');
  currentMatchId = null;
}

// 매칭 후보 검색
function searchMatchCandidates() {
  const search = (document.getElementById('matchSearchInput').value || '').trim().toLowerCase();
  const container = document.getElementById('matchCandidates');

  if (!search) {
    container.innerHTML = '<p style="color:#888; padding:12px;">검색어를 입력하세요</p>';
    return;
  }

  // instCache에서 검색
  const candidates = instCache.filter(d =>
    d.name.toLowerCase().includes(search) ||
    search.includes(d.name.toLowerCase())
  ).slice(0, 20);

  if (candidates.length === 0) {
    container.innerHTML = '<p style="color:#888; padding:12px;">결과 없음</p>';
    return;
  }

  container.innerHTML = candidates.map(d => `
    <div class="match-candidate" onclick="selectMatch(${d.id})">
      <div>
        <span class="name">${d.name}</span>
        <span class="detail">${d.type} | ${d.region}</span>
      </div>
    </div>
  `).join('');
}

// 매칭 확정
async function selectMatch(institutionId) {
  if (!currentMatchId) return;

  const { error } = await supabase
    .from('unmatched_consultations')
    .update({
      resolved: true,
      resolved_institution_id: institutionId
    })
    .eq('id', currentMatchId);

  if (error) {
    showToast('매칭 실패: ' + error.message, 'error');
    return;
  }

  // 해당 기관의 상담횟수 증가
  const inst = instCache.find(d => d.id === institutionId);
  if (inst) {
    await supabase
      .from('institutions')
      .update({
        consult_count: (inst.consult_count || 0) + 1
      })
      .eq('id', institutionId);
  }

  closeMatchModal();
  showToast('매칭 완료', 'success');
  loadUnmatched();
}

// 추천 수락
async function acceptSuggestion(unmatchedId, institutionId) {
  currentMatchId = unmatchedId;
  await selectMatch(institutionId);
}

// 무시
async function dismissUnmatched() {
  if (!currentMatchId) return;

  const { error } = await supabase
    .from('unmatched_consultations')
    .update({ resolved: true })
    .eq('id', currentMatchId);

  if (error) {
    showToast('처리 실패: ' + error.message, 'error');
    return;
  }

  closeMatchModal();
  showToast('미매칭 무시 처리 완료', 'info');
  loadUnmatched();
}
