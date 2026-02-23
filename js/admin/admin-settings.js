// ============================================
// 설정 관리
// ============================================

let settingsCache = {};

async function loadSettings() {
  // 관리자 목록
  const { data: admins } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: true });

  renderAdminUsers(admins || []);

  // 설정값
  const { data: settings } = await supabase
    .from('settings')
    .select('*');

  settingsCache = {};
  (settings || []).forEach(s => { settingsCache[s.key] = s.value; });

  renderRegionTargets();
  renderStageMap();
}

// 관리자 목록 렌더링
function renderAdminUsers(admins) {
  const container = document.getElementById('adminUsersList');
  container.innerHTML = admins.map(a => `
    <div class="admin-user-item">
      <span>${a.email} ${a.name ? '(' + a.name + ')' : ''}</span>
      <button class="btn btn-danger btn-sm" onclick="removeAdminUser(${a.id}, '${a.email}')">삭제</button>
    </div>
  `).join('');
}

// 관리자 추가
async function addAdminUser() {
  const email = document.getElementById('newAdminEmail').value.trim();
  const name = document.getElementById('newAdminName').value.trim();
  if (!email) {
    showToast('이메일을 입력하세요.', 'error');
    return;
  }

  const { error } = await supabase.from('admin_users').insert({ email, name });
  if (error) {
    showToast('추가 실패: ' + error.message, 'error');
    return;
  }

  document.getElementById('newAdminEmail').value = '';
  document.getElementById('newAdminName').value = '';
  showToast('관리자 추가 완료', 'success');
  loadSettings();
}

// 관리자 삭제
async function removeAdminUser(id, email) {
  if (currentUser && currentUser.email === email) {
    showToast('자기 자신은 삭제할 수 없습니다.', 'error');
    return;
  }
  if (!confirm(`"${email}" 관리자를 삭제하시겠습니까?`)) return;

  const { error } = await supabase.from('admin_users').delete().eq('id', id);
  if (error) {
    showToast('삭제 실패: ' + error.message, 'error');
    return;
  }

  showToast('관리자 삭제 완료', 'success');
  loadSettings();
}

// 지역별 대상기관 수 렌더링
function renderRegionTargets() {
  const targets = settingsCache.region_targets || REGION_TOTAL_TARGETS || {};
  const container = document.getElementById('regionTargetsEditor');

  const regions = Object.keys(targets).sort();
  container.innerHTML = regions.map(r => `
    <div class="region-target-item">
      <label>${r}</label>
      <input type="number" data-region="${r}" value="${targets[r]}" min="0">
    </div>
  `).join('');
}

// 지역 대상기관 수 저장
async function saveRegionTargets() {
  const inputs = document.querySelectorAll('#regionTargetsEditor input[data-region]');
  const targets = {};
  inputs.forEach(input => {
    targets[input.dataset.region] = parseInt(input.value) || 0;
  });

  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'region_targets', value: targets, updated_at: new Date().toISOString() });

  if (error) {
    showToast('저장 실패: ' + error.message, 'error');
    return;
  }

  showToast('지역 대상기관 수 저장 완료', 'success');
}

// 상담태그 → 구매단계 매핑 렌더링
function renderStageMap() {
  const stageMap = settingsCache.stage_map || {
    '문의': '관심', '견적': '고려', '시안': '고려', '샘플': '고려', '수주': '고려'
  };
  const container = document.getElementById('stageMapEditor');
  const stages = ['인지', '관심', '고려', '구매', '만족', '추천'];

  container.innerHTML = Object.entries(stageMap).map(([tag, stage]) => `
    <div class="stage-map-item">
      <span class="tag-name">[${tag}]</span>
      <span>→</span>
      <select data-tag="${tag}" class="input" style="width:auto;">
        ${stages.map(s => `<option value="${s}" ${s === stage ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
  `).join('');
}

// 상담태그 매핑 저장
async function saveStageMap() {
  const selects = document.querySelectorAll('#stageMapEditor select[data-tag]');
  const stageMap = {};
  selects.forEach(sel => {
    stageMap[sel.dataset.tag] = sel.value;
  });

  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'stage_map', value: stageMap, updated_at: new Date().toISOString() });

  if (error) {
    showToast('저장 실패: ' + error.message, 'error');
    return;
  }

  showToast('태그 매핑 저장 완료', 'success');
}
