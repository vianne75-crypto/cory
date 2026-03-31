// ============================================
// 상담내역 관리
// ============================================

let consultCache = [];
let consultFiltered = [];
let consultPage = 1;
let consultTodayMode = false;

async function loadConsultations() {
  const { data, error } = await supabase
    .from('consultations')
    .select('*, institutions(name)')
    .order('date', { ascending: false })
    .limit(5000);


  if (error) {
    showToast('상담 로드 실패: ' + error.message, 'error');
    return;
  }

  consultCache = data || [];
  populateConsultFilters();
  filterConsultations();
}

function populateConsultFilters() {
  const mds = [...new Set(consultCache.map(d => d.md_name).filter(Boolean))].sort();
  const mdSelect = document.getElementById('consultMdFilter');
  mdSelect.innerHTML = '<option value="all">전체 MD</option>' +
    mds.map(m => `<option value="${m}">${m}</option>`).join('');
}

function searchConsultations() { filterConsultations(); }

function filterTodayFollowups() {
  consultTodayMode = !consultTodayMode;
  const btn = document.getElementById('todayFollowupBtn');
  if (btn) btn.style.background = consultTodayMode ? '#e65100' : '';
  filterConsultations();
}

function filterConsultations() {
  const today = new Date().toISOString().slice(0, 10);
  const search = (document.getElementById('consultSearch').value || '').trim().toLowerCase();
  const mdFilter = document.getElementById('consultMdFilter').value;
  const matchFilter = document.getElementById('consultMatchFilter').value;
  const sourceFilter = document.getElementById('consultSourceFilter')?.value || 'all';

  consultFiltered = consultCache.filter(d => {
    if (consultTodayMode && d.next_followup_date !== today) return false;
    if (search) {
      const instName = d.institutions ? d.institutions.name : '';
      const matchName = (d.raw_institution_name || instName).toLowerCase().includes(search);
      const matchContent = (d.content || '').toLowerCase().includes(search);
      const matchPerson = (d.contact_person || '').toLowerCase().includes(search);
      if (!matchName && !matchContent && !matchPerson) return false;
    }
    if (mdFilter !== 'all' && d.md_name !== mdFilter) return false;
    if (matchFilter === 'matched' && !d.matched) return false;
    if (matchFilter === 'unmatched' && d.matched) return false;
    if (sourceFilter !== 'all' && (d.source || '애니빌드') !== sourceFilter) return false;
    return true;
  });

  consultPage = 1;
  renderConsultStats();
  renderConsultTable();
}

function renderConsultStats() {
  const total = consultFiltered.length;
  const matched = consultFiltered.filter(d => d.matched).length;
  const unmatched = total - matched;
  const followups = consultFiltered.filter(d => d.source === '팔로업').length;
  const pending = consultFiltered.filter(d => d.next_followup_date && d.next_followup_date >= new Date().toISOString().slice(0,10)).length;

  document.getElementById('consultStats').innerHTML = `
    <div class="stat-card"><span class="label">전체</span><span class="value">${total}</span></div>
    <div class="stat-card"><span class="label">매칭됨</span><span class="value" style="color:#4CAF50">${matched}</span></div>
    <div class="stat-card"><span class="label">미매칭</span><span class="value" style="color:#F44336">${unmatched}</span></div>
    <div class="stat-card"><span class="label">팔로업</span><span class="value" style="color:#1976D2">${followups}</span></div>
    <div class="stat-card"><span class="label">팔로업 예정</span><span class="value" style="color:#F57C00">${pending}</span></div>
  `;
}

function renderConsultTable() {
  const totalPages = Math.max(1, Math.ceil(consultFiltered.length / PAGE_SIZE));
  if (consultPage > totalPages) consultPage = totalPages;

  const start = (consultPage - 1) * PAGE_SIZE;
  const pageData = consultFiltered.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('consultBody');
  tbody.innerHTML = pageData.map(d => {
    const tags = (d.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join('');
    const instName = d.institutions ? d.institutions.name : (d.raw_institution_name || '-');
    const matchClass = d.matched ? 'matched' : 'unmatched';
    const matchText = d.matched ? '매칭' : '미매칭';
    const content = (d.content || '').substring(0, 60) + ((d.content || '').length > 60 ? '...' : '');
    const source = d.source || '애니빌드';
    const sourceColor = source === '팔로업' ? '#1976D2' : '#757575';
    const resultBadge = d.result
      ? `<span class="tag-badge" style="background:${d.result==='통화성공'?'#e8f5e9':'#fff3e0'};color:${d.result==='통화성공'?'#2e7d32':'#e65100'}">${d.result}</span>`
      : '';
    const nextDate = d.next_followup_date
      ? `<span style="color:#F57C00;font-size:0.82rem">→ ${d.next_followup_date}</span>` : '';

    const instClick = d.institution_id
      ? `onclick="openInstConsultModal(${d.institution_id},'${instName.replace(/'/g, "\\'")}')" style="color:#1976D2;cursor:pointer;text-decoration:underline"`
      : '';

    return `<tr>
      <td>${d.date || '-'}</td>
      <td><span style="color:${sourceColor};font-size:0.8rem">${source}</span><br>${d.md_name || d.contact_person || '-'}</td>
      <td class="truncate" ${instClick}>${instName}</td>
      <td>${resultBadge} ${tags}</td>
      <td class="truncate">${content}</td>
      <td>${nextDate}</td>
    </tr>`;
  }).join('');

  renderPagination('consultPagination', consultPage, totalPages, 'goConsultPage');
}

function goConsultPage(page) {
  consultPage = page;
  renderConsultTable();
}

// ─── 팔로업 직접 입력 ───

function openFollowupModal(instId, instName) {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('followupInstId').value = instId || '';
  document.getElementById('followupInstSearch').value = instName || '';
  document.getElementById('followupDate').value = today;
  document.getElementById('followupContactType').value = '전화';
  document.getElementById('followupResult').value = '';
  document.getElementById('followupPerson').value = '';
  document.getElementById('followupCampaign').value = '';
  document.getElementById('followupMemo').value = '';
  document.getElementById('followupNextDate').value = '';
  document.getElementById('followupModal').style.display = 'flex';
}

function closeFollowupModal() {
  document.getElementById('followupModal').style.display = 'none';
}

async function searchFollowupInst() {
  const q = document.getElementById('followupInstSearch').value.trim();
  if (!q) return;
  const { data } = await supabase.from('institutions').select('id,name').ilike('name', `%${q}%`).limit(10);
  const list = document.getElementById('followupInstList');
  list.innerHTML = (data || []).map(i =>
    `<div class="inst-suggest" onclick="selectFollowupInst(${i.id},'${i.name.replace(/'/g,"\\'")}')">` +
    `${i.name}</div>`
  ).join('');
}

function selectFollowupInst(id, name) {
  document.getElementById('followupInstId').value = id;
  document.getElementById('followupInstSearch').value = name;
  document.getElementById('followupInstList').innerHTML = '';
}

async function saveFollowup() {
  const instId = document.getElementById('followupInstId').value;
  const date = document.getElementById('followupDate').value;
  const contactType = document.getElementById('followupContactType').value;
  const result = document.getElementById('followupResult').value;
  const person = document.getElementById('followupPerson').value.trim();
  const campaign = document.getElementById('followupCampaign').value.trim();
  const memo = document.getElementById('followupMemo').value.trim();
  const nextDate = document.getElementById('followupNextDate').value || null;

  if (!date) { showToast('접촉일시는 필수입니다.', 'error'); return; }

  const record = {
    source: '팔로업',
    date,
    contact_type: contactType,
    result: result || null,
    contact_person: person || null,
    campaign: campaign || null,
    content: memo || null,
    next_followup_date: nextDate,
    matched: !!instId,
    institution_id: instId ? parseInt(instId) : null,
    raw_institution_name: document.getElementById('followupInstSearch').value.trim() || null,
  };

  const { error } = await supabase.from('consultations').insert([record]);
  if (error) { showToast('저장 실패: ' + error.message, 'error'); return; }

  // 기관 consult_count 업데이트
  if (instId) {
    await supabase.rpc('increment_consult_count', { inst_id: parseInt(instId) })
      .catch(() => {}); // rpc 없으면 무시
  }

  showToast('팔로업 기록 저장 완료', 'success');
  closeFollowupModal();
  await loadConsultations();
}

// ─── 상담 동기화 ───
function showSyncPanel() {
  const panel = document.getElementById('syncPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') {
    updateSyncScript();
  }
}

function updateSyncScript() {
  const pages = document.getElementById('syncPages').value || 5;
  const script = `(async function(){const W='https://aps-webhook.vianne75.workers.dev/sync-consultations';const P=${pages};const B=200;const a=[];let e=0;console.log('=== 상담내역 동기화 시작 ('+P+'페이지) ===');for(let p=1;p<=P;p++){try{const r=await fetch('/admin/sub_sale/sangdam_list.htm?ajax_yn=0&page='+p,{credentials:'same-origin'});const h=await r.text();const d=new DOMParser().parseFromString(h,'text/html');const t=d.querySelector('table.rg-hover')||d.querySelectorAll('table')[1];if(!t)continue;const rows=t.querySelectorAll('tr');for(let i=1;i<rows.length;i++){const tr=rows[i];const th=tr.querySelector('th');const tds=tr.querySelectorAll('td');if(tds.length>=3)a.push({date:th?th.textContent.trim():'',md:tds[0]?tds[0].textContent.trim():'',consultant:tds[1]?tds[1].textContent.trim():'',content:tds[2]?tds[2].textContent.trim():''})}if(p%10===0||p===P)console.log(p+'/'+P+' ('+Math.round(p/P*100)+'%) - '+a.length+'건');await new Promise(r=>setTimeout(r,80))}catch(err){console.error('p'+p+':'+err.message);e++;if(e>10)break;await new Promise(r=>setTimeout(r,500))}}console.log('스크래핑 완료: '+a.length+'건');if(!a.length)return;let s=0;for(let i=0;i<a.length;i+=B){const b=a.slice(i,i+B);try{const r=await fetch(W,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const j=await r.json();if(j.success){s+=j.inserted||b.length;console.log('배치'+(Math.floor(i/B)+1)+': '+j.inserted+'건, 매칭:'+j.matched+'건')}else console.error(j.error)}catch(err){console.error(err.message)}}console.log('=== 완료: '+s+'건 저장 ===')})();`;
  document.getElementById('syncScriptCode').textContent = script;
}

function copySyncScript() {
  updateSyncScript();
  const script = document.getElementById('syncScriptCode').textContent;
  navigator.clipboard.writeText(script).then(() => {
    showToast('스크립트가 클립보드에 복사되었습니다.', 'success');
  });
}
