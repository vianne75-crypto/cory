// ============================================
// 데이터 정리 (이름 정제 + 중복 병합)
// ============================================

// ─── 이름 정리 함수 (clean_data.py 포팅) ───

function cleanInstitutionNameJS(name) {
  // 배송 메모/주문 메모 제거
  name = name.replace(/\s*\/\s*스티커.*$/, '');
  name = name.replace(/\s*\/\s*메일.*$/, '');
  name = name.replace(/「.*?」.*$/, '');
  name = name.replace(/\s*문구넣어서.*$/, '');
  name = name.replace(/\(보건소로고\)/, '');

  // 전화번호 포함 → 기관명 추출 (주소+기관+담당자+전화)
  if (/T\.\d{2,4}-\d{3,4}-\d{4}/.test(name) || /\d{3}-\d{3,4}-\d{4}/.test(name)) {
    const instMatch = name.match(/((?:[가-힣]+(?:보건소|센터|병원|대학교?|학교|복지관|지원센터))[가-힣]*)/);
    if (instMatch) name = instMatch[1];
  }

  // 주소 패턴 제거: "도/시 시/군/구 읍/면/동 로/길 번호" + 기관명
  const addrInstMatch = name.match(/^(?:[가-힣]+(?:도|시|군|구)\s+){1,3}(?:[가-힣]+(?:읍|면|동|로|길)\s*\d*\s+)*((?:[가-힣]+(?:보건소|센터|병원|대학교?))[가-힣]*)/);
  if (addrInstMatch) name = addrInstMatch[1];

  // 캠페인/납품 설명 제거: "기관명 + 연도/캠페인/홍보/물품/납품..."
  name = name.replace(/\s+\d{4}년\s*캠페인.*$/, '');
  name = name.replace(/\s+캠페인.*$/, '');
  name = name.replace(/\s+홍보\s*물품.*$/, '');
  name = name.replace(/\s+물품\s*납품.*$/, '');
  name = name.replace(/\s+납품$/, '');
  name = name.replace(/\s+포장불가$/, '');
  name = name.replace(/\s+키트\s*제작$/, '');

  // "->기관명으로 납품" 패턴
  const arrowMatch = name.match(/->(.+?)(?:으로|에)\s*납품/);
  if (arrowMatch) name = arrowMatch[1];

  // "보건소 납품" 같은 일반 기술 → 그대로 (기관명 아님이지만 수동 확인 필요)

  // 공급업체 패턴: "업체명(기관명)" → 기관명
  const supplierPatterns = [
    /^성은약품\((.+?)\)$/,
    /^기프트수림\((.+?)\)$/,
    /^엠앤엠디자인\((.+?)\)$/,
    /^다원인쇄\((.+?)\)$/,
    /^삼성씨앤씨\((.+?)\)$/,
    /^판촉사랑\((.+?)\)$/,
  ];
  for (const pat of supplierPatterns) {
    const m = name.match(pat);
    if (m) { name = m[1]; break; }
  }

  // "판촉사랑->기관명으로 납품" 패턴
  if (name.startsWith('판촉사랑')) {
    const m2 = name.match(/판촉사랑\s*-?>?\s*(.+?)(?:으로|에)?\s*납품?/);
    if (m2) name = m2[1];
  }

  const instKeywords = ['보건소', '센터', '복지', '대학', '학교', '사단', '의무대',
    '사업단', '지원단', '병원', '증진', '건강', '금연', '중독', '소방', '경찰', '군부대', '교육'];

  // 패턴 A: "담당자이름(기관명)"
  let m = name.match(/^([가-힣]{2,4})\((.+?)\)$/);
  if (m) {
    const [, person, org] = m;
    if (instKeywords.some(kw => org.includes(kw))) name = org;
  }

  // 패턴 B: "기관명(담당자이름)"
  m = name.match(/^(.+?)\(([가-힣]{2,4})\)$/);
  if (m) {
    const [, org, person] = m;
    if (org.length > 3) name = org;
  }

  // 패턴 C: "기관명(담당자이름선생님/님)"
  m = name.match(/^(.+?)\(([가-힣]{2,4}(?:선생님|님|담당))\)$/);
  if (m) name = m[1];

  // 패턴 D: "담당자(기관명 세부정보)"
  m = name.match(/^([가-힣]{2,4})\((.+?보건소.*?)\)$/);
  if (m) name = m[2];
  m = name.match(/^([가-힣]{2,4})\((.+?센터.*?)\)$/);
  if (m) name = m[2];
  m = name.match(/^([가-힣]{2,4})\((.+?금연.*?)\)$/);
  if (m) name = m[2];

  // 남은 괄호 - 기관명 뒤 담당자 이름
  m = name.match(/^(.{4,}?)\(([가-힣]{2,4})\)$/);
  if (m && instKeywords.some(kw => m[1].includes(kw))) {
    name = m[1];
  }

  // 뒤에 붙은 담당자/부서 제거 (기관명 뒤 개인 이름+전화번호)
  name = name.replace(/\s+[가-힣]{2,4}\s+T\.?\d[\d-]+$/, '');
  name = name.replace(/\s+[가-힣]{2,4}\s+\d{2,3}-\d{3,4}-\d{4}$/, '');

  return name.trim().replace(/\s+/g, ' ');
}

function normalizeNameJS(name) {
  let n = name.trim().replace(/\s+/g, '');
  n = n.replace(/금연클리닉$/, '');
  n = n.replace(/건강증진과$/, '');
  n = n.replace(/건강증진팀$/, '');
  return n;
}

// ─── 패널 토글 ───

function showCleanupPanel() {
  const panel = document.getElementById('cleanupPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// ─── 데이터 분석 ───

let cleanupDirtyNames = [];
let cleanupDuplicates = [];

async function analyzeDataQuality() {
  const log = document.getElementById('cleanupLog');
  const stats = document.getElementById('cleanupStats');
  log.innerHTML = '';
  log.classList.add('visible');

  if (instCache.length === 0) await loadInstitutions();

  log.innerHTML += '분석 중...\n';

  // 1. 이름 정리 대상
  cleanupDirtyNames = [];
  for (const inst of instCache) {
    const cleaned = cleanInstitutionNameJS(inst.name);
    if (cleaned !== inst.name) {
      cleanupDirtyNames.push({ inst, cleaned });
    }
  }

  // 2. 중복 그룹
  const nameGroups = {};
  for (const inst of instCache) {
    const key = normalizeNameJS(inst.name) + '|' + inst.region;
    if (!nameGroups[key]) nameGroups[key] = [];
    nameGroups[key].push(inst);
  }
  cleanupDuplicates = Object.values(nameGroups).filter(g => g.length > 1);

  // 3. 근접 중복 (같은 지역 내 레벤슈타인 거리 ≤ 3)
  const nearDupes = [];
  const byRegion = {};
  for (const inst of instCache) {
    if (!byRegion[inst.region]) byRegion[inst.region] = [];
    byRegion[inst.region].push(inst);
  }
  for (const [region, group] of Object.entries(byRegion)) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const n1 = normalizeNameJS(group[i].name);
        const n2 = normalizeNameJS(group[j].name);
        if (n1 === n2) continue; // 정확한 중복은 위에서 처리
        if (typeof levenshteinDist === 'function' && Math.abs(n1.length - n2.length) <= 2) {
          const dist = levenshteinDist(n1, n2);
          if (dist > 0 && dist <= 2 && dist / Math.max(n1.length, n2.length) < 0.3) {
            nearDupes.push({ a: group[i], b: group[j], dist });
          }
        }
      }
    }
  }

  // 통계 표시
  stats.innerHTML = `
    <div class="stat-card"><span class="label">이름 정리 대상</span><span class="value" style="color:${cleanupDirtyNames.length ? '#F44336' : '#4CAF50'}">${cleanupDirtyNames.length}</span></div>
    <div class="stat-card"><span class="label">중복 그룹</span><span class="value" style="color:${cleanupDuplicates.length ? '#FF9800' : '#4CAF50'}">${cleanupDuplicates.length}</span></div>
    <div class="stat-card"><span class="label">유사 이름</span><span class="value" style="color:${nearDupes.length ? '#FF9800' : '#4CAF50'}">${nearDupes.length}</span></div>
  `;

  // 로그 출력
  if (cleanupDirtyNames.length > 0) {
    log.innerHTML += `\n<span class="log-info">이름 정리 대상 ${cleanupDirtyNames.length}건:</span>\n`;
    cleanupDirtyNames.slice(0, 10).forEach(d => {
      log.innerHTML += `  "${d.inst.name}" → "${d.cleaned}"\n`;
    });
    if (cleanupDirtyNames.length > 10) log.innerHTML += `  ... 외 ${cleanupDirtyNames.length - 10}건\n`;
  }

  if (cleanupDuplicates.length > 0) {
    log.innerHTML += `\n<span class="log-info">중복 그룹 ${cleanupDuplicates.length}개:</span>\n`;
    cleanupDuplicates.forEach(g => {
      log.innerHTML += `  [${g[0].region}] "${g[0].name}" x${g.length} (ID: ${g.map(d => d.id).join(', ')})\n`;
    });
  }

  if (nearDupes.length > 0) {
    log.innerHTML += `\n<span class="log-info">유사 이름 ${nearDupes.length}쌍:</span>\n`;
    nearDupes.slice(0, 10).forEach(d => {
      log.innerHTML += `  "${d.a.name}" ↔ "${d.b.name}" (거리:${d.dist})\n`;
    });
  }

  // 버튼 활성화
  document.getElementById('cleanNamesBtn').disabled = cleanupDirtyNames.length === 0;
  document.getElementById('showDupesBtn').disabled = cleanupDuplicates.length === 0;

  log.innerHTML += '\n<span class="log-success">분석 완료</span>\n';
  log.scrollTop = log.scrollHeight;
}

// ─── 이름 일괄 정리 ───

async function cleanAllNames() {
  if (cleanupDirtyNames.length === 0) return;
  if (!confirm(`${cleanupDirtyNames.length}개 기관명을 정리하시겠습니까?`)) return;

  const log = document.getElementById('cleanupLog');
  log.innerHTML += '\n이름 정리 시작...\n';

  let updated = 0;
  for (const d of cleanupDirtyNames) {
    const { error } = await supabase.from('institutions')
      .update({ name: d.cleaned })
      .eq('id', d.inst.id);

    if (error) {
      log.innerHTML += `<span class="log-error">  오류: ${d.inst.name} - ${error.message}</span>\n`;
    } else {
      updated++;
    }
  }

  log.innerHTML += `<span class="log-success">이름 정리 완료: ${updated}건 업데이트</span>\n`;
  showToast(`${updated}개 기관명 정리 완료`, 'success');
  loadInstitutions();
  cleanupDirtyNames = [];
  document.getElementById('cleanNamesBtn').disabled = true;
}

// ─── 중복 병합 ───

function showDuplicatesModal() {
  if (cleanupDuplicates.length === 0) return;

  const container = document.getElementById('dupeGroups');
  const STAGE_ORDER = { '인지': 0, '관심': 1, '고려': 2, '구매': 3, '만족': 4, '추천': 5 };

  container.innerHTML = cleanupDuplicates.map((group, gi) => {
    // 기본 유지 대상: 구매금액이 가장 큰 레코드
    const bestIdx = group.reduce((bi, d, i) =>
      (d.purchase_amount || 0) > (group[bi].purchase_amount || 0) ? i : bi, 0);

    return `
      <div class="dupe-group">
        <div class="dupe-group-header">${group[0].name} (${group[0].region}) - ${group.length}건</div>
        ${group.map((d, di) => `
          <div class="dupe-item">
            <input type="radio" name="dupe_${gi}" value="${d.id}" class="dupe-keep-radio"
              ${di === bestIdx ? 'checked' : ''} data-group="${gi}">
            <span>ID:${d.id} | ${d.name} | ${d.purchase_stage} | ${(d.purchase_amount || 0).toLocaleString()}원 | 상담${d.consult_count || 0}회</span>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');

  document.getElementById('dupeModal').style.display = 'flex';
}

function closeDupeModal() {
  document.getElementById('dupeModal').style.display = 'none';
}

async function mergeAllDuplicates() {
  if (!confirm(`${cleanupDuplicates.length}개 중복 그룹을 병합하시겠습니까?`)) return;

  const log = document.getElementById('cleanupLog');
  const STAGE_ORDER = { '인지': 0, '관심': 1, '고려': 2, '구매': 3, '만족': 4, '추천': 5 };
  let totalMerged = 0;

  for (let gi = 0; gi < cleanupDuplicates.length; gi++) {
    const group = cleanupDuplicates[gi];
    const selectedRadio = document.querySelector(`input[name="dupe_${gi}"]:checked`);
    const keepId = selectedRadio ? parseInt(selectedRadio.value) : group[0].id;
    const deleteIds = group.filter(d => d.id !== keepId).map(d => d.id);

    // 병합 데이터 계산
    const merged = {
      purchase_amount: group.reduce((s, d) => s + (d.purchase_amount || 0), 0),
      purchase_volume: group.reduce((s, d) => s + (d.purchase_volume || 0), 0),
      consult_count: group.reduce((s, d) => s + (d.consult_count || 0), 0),
      products: [...new Set(group.flatMap(d => d.products || []))],
    };

    // 최고 구매단계
    const bestStage = group.reduce((best, d) =>
      (STAGE_ORDER[d.purchase_stage] || 0) > (STAGE_ORDER[best] || 0) ? d.purchase_stage : best,
      '인지');
    merged.purchase_stage = bestStage;

    // 최근 구매일
    const dates = group.map(d => d.last_purchase_date).filter(d => d && d !== '-');
    if (dates.length > 0) merged.last_purchase_date = dates.sort().pop();

    // 최근 상담일
    const cDates = group.map(d => d.last_consult_date).filter(Boolean);
    if (cDates.length > 0) merged.last_consult_date = cDates.sort().pop();

    // 유지 레코드 업데이트
    await supabase.from('institutions').update(merged).eq('id', keepId);

    // 삭제 대상의 consultations FK 이전
    for (const delId of deleteIds) {
      await supabase.from('consultations')
        .update({ institution_id: keepId })
        .eq('institution_id', delId);
    }

    // 삭제 대상 기관 삭제
    for (const delId of deleteIds) {
      await supabase.from('institutions').delete().eq('id', delId);
    }

    totalMerged += deleteIds.length;
    log.innerHTML += `  병합: "${group[0].name}" (${group.length}→1, 삭제 ${deleteIds.length}건)\n`;
  }

  log.innerHTML += `<span class="log-success">병합 완료: ${totalMerged}건 삭제</span>\n`;
  log.scrollTop = log.scrollHeight;
  showToast(`${totalMerged}개 중복 기관 병합 완료`, 'success');
  closeDupeModal();
  loadInstitutions();
  cleanupDuplicates = [];
  document.getElementById('showDupesBtn').disabled = true;
}
