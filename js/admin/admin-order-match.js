// ============================================
// 주문 스마트 매칭 (memlv + 주소 + 이름 + 상품)
// ============================================

let orderMatchCache = [];     // 미매칭 주문
let orderMatchPage = 1;
let memlvClassification = null; // { institutional: [...], individual: [...] }
const ORDER_MATCH_PAGE_SIZE = 20;

// ─── 등급 분류 설정 로드/저장 ───

async function loadMemlvClassification() {
  const { data } = await supabase.from('settings')
    .select('value').eq('key', 'memlv_classification').single();
  if (data) {
    memlvClassification = data.value;
  } else {
    memlvClassification = { institutional: [], individual: [] };
  }
  return memlvClassification;
}

async function saveMemlvClassification() {
  const { error } = await supabase.from('settings')
    .upsert({ key: 'memlv_classification', value: memlvClassification });
  if (error) showToast('등급 설정 저장 실패: ' + error.message, 'error');
}

// ─── option_user에서 기관명 파싱 ───
// 패턴: <br>사용처명(필수) : 기관명<br>... 또는 <br>인쇄기관명 : 기관명 또는 plain text

function parseInstName(optionUser) {
  if (!optionUser) return '';
  const s = optionUser.replace(/<br\s*\/?>/gi, '\n');
  // 사용처명 추출
  const m1 = s.match(/사용처명[^:：\n]*[:：]\s*([^\n]+)/);
  if (m1 && m1[1].trim()) return m1[1].trim();
  // 인쇄기관명 추출
  const m2 = s.match(/인쇄기관명[^:：\n]*[:：]\s*([^\n]+)/);
  if (m2 && m2[1].trim()) return m2[1].trim();
  // HTML 태그 제거 후 첫 번째 비어있지 않은 줄
  const clean = s.replace(/<[^>]+>/g, '').trim();
  const firstLine = clean.split('\n').map(l => l.trim()).find(l => l);
  return firstLine || clean;
}

// ─── 스마트 매칭 엔진 ───

function smartMatchOrder(order, institutions) {
  if (!institutions || institutions.length === 0) return null;

  const memId     = (order.mem_id     || '').trim();
  const zipcode   = (order.zipcode    || '').trim();
  const buyerName = parseInstName(order.option_user || '');
  const addr      = (order.addr       || '').trim();
  const goodsName = (order.goods_name || '').trim();
  const memlv     = (order.memlv      || '').trim();

  // 회원등급이 개인이면 매칭 제외
  if (memlvClassification && memlvClassification.individual.length > 0) {
    if (memlvClassification.individual.includes(memlv)) {
      return { inst: null, score: 0, reason: 'individual_grade', memlv };
    }
  }

  // [1순위] wco_mem_id 정확 매칭 → 즉시 확정 (score 1.0)
  if (memId) {
    const hit = institutions.find(i => i.metadata && i.metadata.wco_mem_id === memId);
    if (hit) return { inst: hit, score: 1.0, reason: 'mem_id' };
  }

  // [2순위] 우편번호 단독 매칭 → 1건일 때만 확정 (score 0.9)
  if (zipcode) {
    const hits = institutions.filter(i => i.metadata && i.metadata.zipcode === zipcode);
    if (hits.length === 1) return { inst: hits[0], score: 0.9, reason: 'zipcode' };
  }

  // [3순위] 복합 점수 매칭 (이름 + 주소 + 등급 + 상품)
  const addrInfo = typeof uploadParseAddress === 'function'
    ? uploadParseAddress(addr)
    : { region: null, district: null };

  let bestMatch = null;
  let bestScore = 0;

  for (const inst of institutions) {
    let score = 0;

    // 이름 매칭 (0.4)
    const nameScore = calcNameScore(buyerName, inst.name);
    score += nameScore * 0.4;

    // 주소 매칭 (0.35) — addr ↔ metadata.address 직접 비교 추가
    let addrScore = calcAddrScore(addrInfo, addr, inst);
    if (inst.metadata && inst.metadata.address && addr) {
      if (addr === inst.metadata.address) addrScore = Math.max(addrScore, 1.0);
      else if (addr.includes(inst.metadata.address) || inst.metadata.address.includes(addr))
        addrScore = Math.max(addrScore, 0.85);
    }
    score += addrScore * 0.35;

    // 회원등급 (0.15)
    score += calcGradeScore(memlv) * 0.15;

    // 상품 키워드 (0.1)
    score += calcProductScore(goodsName) * 0.1;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = inst;
    }
  }

  if (!bestMatch || bestScore < 0.3) return null;
  return { inst: bestMatch, score: bestScore, reason: 'fuzzy' };
}

// 이름 점수 계산
function calcNameScore(buyerName, instName) {
  if (!buyerName) return 0;

  // 정확 매칭
  if (buyerName === instName) return 1.0;

  // 부분 문자열
  if (instName.includes(buyerName) || buyerName.includes(instName)) return 0.7;

  // 레벤슈타인
  if (typeof levenshteinDist === 'function') {
    const dist = levenshteinDist(buyerName, instName);
    const maxLen = Math.max(buyerName.length, instName.length);
    if (maxLen > 0 && dist <= Math.max(2, Math.floor(maxLen * 0.3))) {
      return Math.max(0, 1 - (dist / maxLen));
    }
  }

  return 0;
}

// 주소 점수 계산
function calcAddrScore(addrInfo, rawAddr, inst) {
  if (!addrInfo.region) return 0;
  let score = 0;

  // 같은 지역
  if (addrInfo.region === inst.region) {
    score = 0.5;
    // 같은 구
    if (addrInfo.district && inst.district && addrInfo.district === inst.district) {
      score = 0.8;
    }
  }

  // 주소에 기관명 포함
  if (rawAddr && inst.name) {
    const shortName = inst.name.replace(/보건소|센터|병원|대학교?|학교/g, '').trim();
    if (shortName.length >= 2 && rawAddr.includes(shortName)) {
      score = Math.max(score, 0.9);
    }
    if (rawAddr.includes(inst.name)) {
      score = 1.0;
    }
  }

  return score;
}

// 회원등급 점수 계산
function calcGradeScore(memlv) {
  if (!memlv || !memlvClassification) return 0.5; // 분류 없으면 중립

  if (memlvClassification.institutional.includes(memlv)) return 1.0;
  if (memlvClassification.individual.includes(memlv)) return 0;

  return 0.5; // 미분류
}

// 상품 유형 점수 계산
function calcProductScore(goodsName) {
  if (!goodsName) return 0.5;

  const instKeywords = ['납품', '보건소', '키트', '센터', '관공서', '공단', '기관', '홍보'];
  const personalKeywords = ['체험', '개인', '선물', '답례'];

  const lower = goodsName;
  if (instKeywords.some(kw => lower.includes(kw))) return 1.0;
  if (personalKeywords.some(kw => lower.includes(kw))) return 0.2;

  return 0.5;
}

// ─── 주문 매칭 패널 ───

function showOrderMatchPanel() {
  const panel = document.getElementById('orderMatchPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function autoMatchOrders() {
  const log = document.getElementById('orderMatchLog');
  log.innerHTML = '';
  log.classList.add('visible');
  log.innerHTML += '주문 매칭 시작...\n';

  // 등급 분류 로드
  await loadMemlvClassification();

  // 기관 캐시 로드
  if (instCache.length === 0) await loadInstitutions();

  // 미매칭 주문 로드
  log.innerHTML += '미매칭 주문 조회 중...\n';
  const { data: orders, error } = await supabase.from('orders')
    .select('*')
    .eq('matched', false)
    .order('reg_time', { ascending: false })
    .limit(5000);

  if (error) {
    log.innerHTML += `<span class="log-error">주문 조회 실패: ${error.message}</span>\n`;
    return;
  }

  if (!orders || orders.length === 0) {
    log.innerHTML += '<span class="log-success">미매칭 주문이 없습니다.</span>\n';
    return;
  }

  log.innerHTML += `미매칭 주문: ${orders.length}건\n`;

  // 등급 분류가 없으면 memlv 값 스캔
  const allMemlvs = [...new Set(orders.map(o => o.memlv).filter(Boolean))];
  if (allMemlvs.length > 0 && memlvClassification.institutional.length === 0 && memlvClassification.individual.length === 0) {
    log.innerHTML += `\n<span class="log-info">회원등급 종류 ${allMemlvs.length}개 감지: ${allMemlvs.join(', ')}</span>\n`;
    log.innerHTML += '<span class="log-info">등급 분류를 먼저 설정하세요. (등급 설정 버튼)</span>\n';
    orderMatchCache = orders;
    renderMemlvConfig(allMemlvs);
    renderOrderMatchTable();
    updateOrderMatchStats(orders, []);
    return;
  }

  // 스마트 매칭 실행
  let autoMatched = 0;
  let needsReview = 0;
  let noMatch = 0;
  let individual = 0;
  const reviewList = [];

  for (const order of orders) {
    const result = smartMatchOrder(order, instCache);

    if (result && result.reason === 'individual_grade') {
      individual++;
      continue;
    }

    if (result && result.score >= 0.7) {
      // 자동 매칭
      await supabase.from('orders')
        .update({ institution_id: result.inst.id, matched: true })
        .eq('id', order.id);
      autoMatched++;
    } else if (result && result.score >= 0.4) {
      // 수동 확인 필요
      reviewList.push({ order, suggestion: result });
      needsReview++;
    } else {
      noMatch++;
    }
  }

  // 결과 출력
  log.innerHTML += `\n<span class="log-success">매칭 완료:</span>\n`;
  log.innerHTML += `  자동 매칭: ${autoMatched}건\n`;
  log.innerHTML += `  수동 확인: ${needsReview}건\n`;
  log.innerHTML += `  매칭 불가: ${noMatch}건\n`;
  if (individual > 0) log.innerHTML += `  개인 등급: ${individual}건 (기관 아님)\n`;

  // 미매칭 주문 캐시 업데이트 (수동 확인 + 매칭 불가)
  orderMatchCache = orders.filter(o => {
    const r = smartMatchOrder(o, instCache);
    return !r || r.score < 0.7;
  });

  updateOrderMatchStats(orders, reviewList);
  renderOrderMatchTable();
  showToast(`자동 매칭 ${autoMatched}건 완료`, 'success');
  log.scrollTop = log.scrollHeight;
}

function updateOrderMatchStats(allOrders, reviewList) {
  const stats = document.getElementById('orderMatchStats');
  if (!stats) return;

  const matched = allOrders.filter(o => o.matched).length;
  const unmatched = allOrders.length - matched;

  stats.innerHTML = `
    <div class="stat-card"><span class="label">전체 주문</span><span class="value">${allOrders.length}</span></div>
    <div class="stat-card"><span class="label">미매칭</span><span class="value" style="color:${unmatched ? '#F44336' : '#4CAF50'}">${unmatched}</span></div>
    <div class="stat-card"><span class="label">확인 필요</span><span class="value" style="color:${reviewList.length ? '#FF9800' : '#4CAF50'}">${reviewList.length}</span></div>
  `;
}

// ─── 미매칭 주문 테이블 ───

function renderOrderMatchTable() {
  const tbody = document.getElementById('orderMatchBody');
  if (!tbody) return;

  const totalPages = Math.max(1, Math.ceil(orderMatchCache.length / ORDER_MATCH_PAGE_SIZE));
  if (orderMatchPage > totalPages) orderMatchPage = totalPages;

  const start = (orderMatchPage - 1) * ORDER_MATCH_PAGE_SIZE;
  const pageData = orderMatchCache.slice(start, start + ORDER_MATCH_PAGE_SIZE);

  tbody.innerHTML = pageData.map(order => {
    const result = smartMatchOrder(order, instCache);
    const reasonLabel = { mem_id: '🔑회원ID', zipcode: '📮우편번호', fuzzy: '🔍유사도' };
    const suggested = result && result.inst
      ? `${result.inst.name} <span class="match-score">${reasonLabel[result.reason]||''} ${(result.score * 100).toFixed(0)}%</span>`
      : (result && result.reason === 'individual_grade'
        ? '<span class="match-individual">개인</span>'
        : '-');

    return `<tr>
      <td>${order.reg_time || '-'}</td>
      <td class="truncate">${order.option_user || '-'}</td>
      <td class="truncate">${order.addr || '-'}</td>
      <td>${order.goods_name || '-'}</td>
      <td>${order.memlv || '-'}</td>
      <td>${suggested}</td>
      <td>
        ${result && result.inst ? `<button class="btn btn-secondary btn-sm" onclick="acceptOrderMatch(${order.id}, ${result.inst.id})">수락</button>` : ''}
        <button class="btn btn-primary btn-sm" onclick="openOrderMatchModal(${order.id})">매칭</button>
        <button class="btn btn-sm" onclick="markOrderIndividual(${order.id})" title="개인 주문 표시">개인</button>
      </td>
    </tr>`;
  }).join('');

  renderPagination('orderMatchPagination', orderMatchPage, totalPages, 'goOrderMatchPage');

  document.getElementById('orderMatchTableWrap').style.display =
    orderMatchCache.length > 0 ? 'block' : 'none';
}

function goOrderMatchPage(page) {
  orderMatchPage = page;
  renderOrderMatchTable();
}

// ─── 주문 매칭 액션 ───

async function acceptOrderMatch(orderId, institutionId) {
  const { error } = await supabase.from('orders')
    .update({ institution_id: institutionId, matched: true, manual_match: true })
    .eq('id', orderId);

  if (error) {
    showToast('매칭 실패: ' + error.message, 'error');
    return;
  }

  orderMatchCache = orderMatchCache.filter(o => o.id !== orderId);
  renderOrderMatchTable();
  showToast('매칭 완료', 'success');
}

async function markOrderIndividual(orderId) {
  // institution_id = null, matched = true (개인 주문으로 확정)
  const { error } = await supabase.from('orders')
    .update({ institution_id: null, matched: true, manual_match: true })
    .eq('id', orderId);

  if (error) {
    showToast('처리 실패: ' + error.message, 'error');
    return;
  }

  orderMatchCache = orderMatchCache.filter(o => o.id !== orderId);
  renderOrderMatchTable();
  showToast('개인 주문으로 처리', 'info');
}

// ─── 매칭 모달 (기관 검색) ───

let currentOrderMatchId = null;

function openOrderMatchModal(orderId) {
  currentOrderMatchId = orderId;
  const order = orderMatchCache.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('orderMatchInfo').innerHTML = `
    <p><strong>주문자:</strong> ${order.option_user || '-'}</p>
    <p><strong>주소:</strong> ${order.addr || '-'}</p>
    <p><strong>상품:</strong> ${order.goods_name || '-'} | <strong>등급:</strong> ${order.memlv || '-'}</p>
    <p><strong>일시:</strong> ${order.reg_time || '-'} | <strong>상태:</strong> ${order.state_subject || '-'}</p>
  `;

  // 검색 초기값: 파싱된 기관명
  const searchInit = parseInstName(order.option_user || '');
  document.getElementById('orderMatchSearch').value = searchInit;
  searchOrderMatchCandidates();
  document.getElementById('orderMatchModal').style.display = 'flex';
}

function closeOrderMatchModal() {
  document.getElementById('orderMatchModal').style.display = 'none';
  currentOrderMatchId = null;
}

function searchOrderMatchCandidates() {
  const search = (document.getElementById('orderMatchSearch').value || '').trim().toLowerCase();
  const container = document.getElementById('orderMatchCandidates');

  if (!search) {
    container.innerHTML = '<p style="color:#888; padding:12px;">검색어를 입력하세요</p>';
    return;
  }

  // 이름 검색 + 주소 기반 지역 필터
  let candidates = instCache.filter(d =>
    d.name.toLowerCase().includes(search) ||
    search.includes(d.name.toLowerCase())
  );

  // 검색 결과 없으면 주소에서 지역 추출하여 해당 지역 기관 표시
  if (candidates.length === 0 && currentOrderMatchId) {
    const order = orderMatchCache.find(o => o.id === currentOrderMatchId);
    if (order && order.addr) {
      const addrInfo = typeof uploadParseAddress === 'function'
        ? uploadParseAddress(order.addr)
        : { region: null, district: null };
      if (addrInfo.region) {
        candidates = instCache.filter(d => d.region === addrInfo.region);
        if (addrInfo.district) {
          const districtCands = candidates.filter(d => d.district === addrInfo.district);
          if (districtCands.length > 0) candidates = districtCands;
        }
      }
    }
  }

  candidates = candidates.slice(0, 30);

  if (candidates.length === 0) {
    container.innerHTML = '<p style="color:#888; padding:12px;">결과 없음</p>';
    return;
  }

  container.innerHTML = candidates.map(d => `
    <div class="match-candidate" onclick="confirmOrderMatch(${d.id})">
      <div>
        <span class="name">${d.name}</span>
        <span class="detail">${d.type} | ${d.region}${d.district ? ' ' + d.district : ''}</span>
      </div>
    </div>
  `).join('');
}

async function confirmOrderMatch(institutionId) {
  if (!currentOrderMatchId) return;
  await acceptOrderMatch(currentOrderMatchId, institutionId);
  closeOrderMatchModal();
}

// ─── 등급 분류 설정 UI ───

function renderMemlvConfig(allMemlvs) {
  const container = document.getElementById('memlvConfigArea');
  if (!container) return;

  if (!allMemlvs || allMemlvs.length === 0) {
    container.innerHTML = '<p style="color:#888;">등급 데이터가 없습니다.</p>';
    container.style.display = 'block';
    return;
  }

  container.innerHTML = `
    <div class="memlv-config">
      <h4>회원등급 분류</h4>
      <p class="config-desc">각 등급을 기관/개인으로 분류하세요. 미분류는 중립(0.5)으로 처리됩니다.</p>
      <table class="data-table">
        <thead><tr><th>등급</th><th>기관</th><th>개인</th><th>미분류</th></tr></thead>
        <tbody>
          ${allMemlvs.map(lv => {
            const isInst = memlvClassification.institutional.includes(lv);
            const isIndiv = memlvClassification.individual.includes(lv);
            const isNone = !isInst && !isIndiv;
            return `<tr>
              <td><strong>${lv}</strong></td>
              <td><input type="radio" name="memlv_${lv}" value="institutional" ${isInst ? 'checked' : ''}></td>
              <td><input type="radio" name="memlv_${lv}" value="individual" ${isIndiv ? 'checked' : ''}></td>
              <td><input type="radio" name="memlv_${lv}" value="none" ${isNone ? 'checked' : ''}></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <button class="btn btn-primary" onclick="saveMemlvConfig()">등급 분류 저장</button>
    </div>
  `;
  container.style.display = 'block';
}

async function saveMemlvConfig() {
  const radios = document.querySelectorAll('#memlvConfigArea input[type="radio"]:checked');
  memlvClassification = { institutional: [], individual: [] };

  radios.forEach(r => {
    const lv = r.name.replace('memlv_', '');
    if (r.value === 'institutional') memlvClassification.institutional.push(lv);
    else if (r.value === 'individual') memlvClassification.individual.push(lv);
  });

  await saveMemlvClassification();
  showToast('등급 분류 저장 완료', 'success');

  const log = document.getElementById('orderMatchLog');
  log.innerHTML += `<span class="log-success">등급 분류 저장: 기관 ${memlvClassification.institutional.length}개, 개인 ${memlvClassification.individual.length}개</span>\n`;
}

// ─── 전체 주문 재매칭 ───

async function reMatchAllOrders() {
  if (!confirm('수동 확정된 매칭은 보호됩니다. 나머지 주문을 재분석하시겠습니까?')) return;

  const log = document.getElementById('orderMatchLog');
  log.innerHTML = '전체 재매칭 시작...\n';
  log.classList.add('visible');

  await loadMemlvClassification();
  if (instCache.length === 0) await loadInstitutions();

  // 모든 주문 로드
  const { data: orders, error } = await supabase.from('orders')
    .select('*')
    .order('reg_time', { ascending: false })
    .limit(10000);

  if (error || !orders) {
    log.innerHTML += `<span class="log-error">주문 조회 실패</span>\n`;
    return;
  }

  // manual_match 보호
  const protected_ = orders.filter(o => o.manual_match);
  const targets = orders.filter(o => !o.manual_match);

  log.innerHTML += `전체 주문: ${orders.length}건 (수동 확정 ${protected_.length}건 보호)\n`;

  let autoMatched = 0, needsReview = 0, noMatch = 0, individual = 0;

  for (const order of targets) {
    const result = smartMatchOrder(order, instCache);

    if (result && result.reason === 'individual_grade') {
      await supabase.from('orders')
        .update({ institution_id: null, matched: true })
        .eq('id', order.id);
      individual++;
    } else if (result && result.score >= 0.7) {
      await supabase.from('orders')
        .update({ institution_id: result.inst.id, matched: true })
        .eq('id', order.id);
      autoMatched++;
    } else if (result && result.score >= 0.4) {
      await supabase.from('orders')
        .update({ institution_id: null, matched: false })
        .eq('id', order.id);
      needsReview++;
    } else {
      await supabase.from('orders')
        .update({ institution_id: null, matched: false })
        .eq('id', order.id);
      noMatch++;
    }
  }

  log.innerHTML += `\n<span class="log-success">재매칭 완료:</span>\n`;
  log.innerHTML += `  수동 확정 보호: ${protected_.length}건\n`;
  log.innerHTML += `  자동 매칭: ${autoMatched}건\n`;
  log.innerHTML += `  수동 확인: ${needsReview}건\n`;
  log.innerHTML += `  매칭 불가: ${noMatch}건\n`;
  log.innerHTML += `  개인 등급: ${individual}건\n`;

  // 미매칭 캐시 갱신 (manual_match 제외)
  orderMatchCache = targets.filter(o => {
    const r = smartMatchOrder(o, instCache);
    return !r || (r.score < 0.7 && r.reason !== 'individual_grade');
  });

  renderOrderMatchTable();
  showToast(`재매칭 완료: 자동 ${autoMatched}건 (보호 ${protected_.length}건)`, 'success');
  log.scrollTop = log.scrollHeight;
}

// ─── 등급 설정 버튼 ───

async function showMemlvSetup() {
  await loadMemlvClassification();

  // 기존 주문에서 모든 memlv 값 스캔
  const { data: orders } = await supabase.from('orders')
    .select('memlv')
    .not('memlv', 'is', null)
    .not('memlv', 'eq', '')
    .limit(10000);

  const allMemlvs = [...new Set((orders || []).map(o => o.memlv).filter(Boolean))];
  renderMemlvConfig(allMemlvs);
}
