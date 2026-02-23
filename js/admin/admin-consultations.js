// ============================================
// 상담내역 관리
// ============================================

let consultCache = [];
let consultFiltered = [];
let consultPage = 1;

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

function filterConsultations() {
  const search = (document.getElementById('consultSearch').value || '').trim().toLowerCase();
  const mdFilter = document.getElementById('consultMdFilter').value;
  const matchFilter = document.getElementById('consultMatchFilter').value;

  consultFiltered = consultCache.filter(d => {
    if (search) {
      const matchName = (d.raw_institution_name || '').toLowerCase().includes(search);
      const matchContent = (d.content || '').toLowerCase().includes(search);
      if (!matchName && !matchContent) return false;
    }
    if (mdFilter !== 'all' && d.md_name !== mdFilter) return false;
    if (matchFilter === 'matched' && !d.matched) return false;
    if (matchFilter === 'unmatched' && d.matched) return false;
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

  document.getElementById('consultStats').innerHTML = `
    <div class="stat-card"><span class="label">전체</span><span class="value">${total}</span></div>
    <div class="stat-card"><span class="label">매칭됨</span><span class="value" style="color:#4CAF50">${matched}</span></div>
    <div class="stat-card"><span class="label">미매칭</span><span class="value" style="color:#F44336">${unmatched}</span></div>
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
    const instName = d.institutions ? d.institutions.name : '-';
    const matchClass = d.matched ? 'matched' : 'unmatched';
    const matchText = d.matched ? '매칭' : '미매칭';
    const content = (d.content || '').substring(0, 80) + ((d.content || '').length > 80 ? '...' : '');

    return `<tr>
      <td>${d.date || '-'}</td>
      <td>${d.md_name || '-'}</td>
      <td class="truncate">${d.raw_institution_name || '-'}</td>
      <td><span class="match-badge ${matchClass}">${matchText}</span> ${instName}</td>
      <td>${tags}</td>
      <td class="truncate">${content}</td>
    </tr>`;
  }).join('');

  renderPagination('consultPagination', consultPage, totalPages, 'goConsultPage');
}

function goConsultPage(page) {
  consultPage = page;
  renderConsultTable();
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
