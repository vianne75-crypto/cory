// ─── 애니빌드 쇼핑몰 동기화 모듈 ───
// Google Apps Script Web App을 통해 주문 데이터를 가져와 대시보드에 반영

// ★ 배포 후 아래 URL을 실제 Google Apps Script Web App URL로 교체
const GAS_WEB_APP_URL = 'https://aps-webhook.vianne75.workers.dev';
const GAS_API_KEY = '52b8fc2a5de7cf289fe7729a547f5b2d';

// localStorage 키
const SYNC_STORAGE_KEY = 'cory_last_sync';
const SYNC_ORDERS_KEY = 'cory_synced_orders'; // 중복 방지용

// ─── 주소 → 지역/시군구 파싱 ───
const REGION_MAP = {
  '서울특별시': '서울특별시', '서울': '서울특별시',
  '부산광역시': '부산광역시', '부산': '부산광역시',
  '대구광역시': '대구광역시', '대구': '대구광역시',
  '인천광역시': '인천광역시', '인천': '인천광역시',
  '광주광역시': '광주광역시', '광주': '광주광역시',
  '대전광역시': '대전광역시', '대전': '대전광역시',
  '울산광역시': '울산광역시', '울산': '울산광역시',
  '세종특별자치시': '세종특별자치시', '세종': '세종특별자치시',
  '경기도': '경기도', '경기': '경기도',
  '강원특별자치도': '강원특별자치도', '강원도': '강원특별자치도', '강원': '강원특별자치도',
  '충청북도': '충청북도', '충북': '충청북도',
  '충청남도': '충청남도', '충남': '충청남도',
  '전북특별자치도': '전북특별자치도', '전라북도': '전북특별자치도', '전북': '전북특별자치도',
  '전라남도': '전라남도', '전남': '전라남도',
  '경상북도': '경상북도', '경북': '경상북도',
  '경상남도': '경상남도', '경남': '경상남도',
  '제주특별자치도': '제주특별자치도', '제주': '제주특별자치도'
};

const METRO_CITIES = new Set([
  '서울특별시', '부산광역시', '대구광역시', '인천광역시',
  '광주광역시', '대전광역시', '울산광역시'
]);

function parseAddress(addr) {
  if (!addr || !addr.trim()) return { region: null, district: null };
  const parts = addr.trim().split(/\s+/);
  if (!parts.length) return { region: null, district: null };

  // 첫 토큰으로 region 매핑
  let region = REGION_MAP[parts[0]] || null;

  // 정확 매핑 실패 시 접두사 매칭
  if (!region) {
    for (const [key, val] of Object.entries(REGION_MAP)) {
      if (parts[0].startsWith(key)) { region = val; break; }
    }
  }
  if (!region) return { region: null, district: null };

  let district = null;

  // 광역시: 두 번째 토큰이 구/군
  if (METRO_CITIES.has(region)) {
    if (parts.length > 1 && (parts[1].endsWith('구') || parts[1].endsWith('군'))) {
      district = parts[1];
    }
  } else if (region === '세종특별자치시') {
    district = '세종시';
  } else {
    // 도: 두 번째 토큰이 시/군
    if (parts.length > 1) {
      if (parts[1].endsWith('시') || parts[1].endsWith('군')) {
        district = parts[1];
      } else if (parts.length > 2 && (parts[2].endsWith('시') || parts[2].endsWith('군'))) {
        district = parts[1].endsWith('시') || parts[1].endsWith('군') ? parts[1] : parts[2];
      }
    }
  }

  return { region, district };
}

// ─── 기관유형 키워드 매핑 ───
const INST_TYPE_KEYWORDS = {
  '보건소': '보건소',
  '보건지소': '보건소',
  '보건의료원': '보건소',
  '정신건강': '전문기관',
  '중독관리': '전문기관',
  '중독이음': '전문기관',
  '자살예방': '전문기관',
  '금연지원': '금연지원센터',
  '금연상담': '금연지원센터',
  '건강증진': '광역시도 건강증진부서',
  '대학교': '전공교육',
  '대학': '교육기관',
  '소방': '군/경/소방',
  '경찰': '군/경/소방',
  '의무대': '군/경/소방',
  '군부대': '군/경/소방',
  '복지': '복지기관'
};

// ─── 기관명 매칭 ───
function matchInstitution(optionUser, addr) {
  const name = (optionUser || '').trim();
  if (!name) return null;

  // 1순위: 정확한 이름 매칭
  const exact = institutionData.find(d => d.name === name);
  if (exact) return exact;

  // 2순위: 부분 문자열 매칭 (포함 관계)
  const substringMatches = institutionData.filter(d =>
    d.name.includes(name) || name.includes(d.name)
  );
  if (substringMatches.length === 1) return substringMatches[0];

  // 주소에서 region/district 추출
  const { region, district } = parseAddress(addr);

  // 부분 매칭이 여러 건이면 region으로 좁힘
  if (substringMatches.length > 1 && region) {
    const regionFiltered = substringMatches.filter(d => d.region === region);
    if (regionFiltered.length === 1) return regionFiltered[0];
    if (regionFiltered.length > 1 && district) {
      const distFiltered = regionFiltered.filter(d => d.district === district);
      if (distFiltered.length === 1) return distFiltered[0];
    }
  }

  // 3순위: region + district + 기관유형 키워드로 좁힘
  if (region) {
    let candidates = institutionData.filter(d => d.region === region);
    if (district) {
      const distCandidates = candidates.filter(d => d.district === district);
      if (distCandidates.length > 0) candidates = distCandidates;
    }

    // 기관유형 키워드 감지
    let detectedType = null;
    for (const [keyword, type] of Object.entries(INST_TYPE_KEYWORDS)) {
      if (name.includes(keyword)) {
        detectedType = type;
        break;
      }
    }

    if (detectedType) {
      const typedCandidates = candidates.filter(d => d.type === detectedType);
      if (typedCandidates.length === 1) return typedCandidates[0];
      if (typedCandidates.length > 1) {
        const best = findBestFuzzyMatch(name, typedCandidates);
        if (best) return best;
      }
    }

    // 키워드 없어도 region+district 후보 중 퍼지 매칭
    if (candidates.length > 0 && candidates.length <= 20) {
      const best = findBestFuzzyMatch(name, candidates);
      if (best) return best;
    }
  }

  // 4순위: 전체 데이터에서 퍼지 매칭 (비용이 크므로 이름이 긴 경우만)
  if (name.length >= 4) {
    const best = findBestFuzzyMatch(name, institutionData);
    if (best) return best;
  }

  return null;
}

// Levenshtein 거리 계산
function levenshtein(a, b) {
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

function findBestFuzzyMatch(name, candidates) {
  let bestDist = Infinity;
  let bestMatch = null;
  // 허용 거리: 이름 길이의 30% 이내, 최소 2
  const threshold = Math.max(2, Math.floor(name.length * 0.3));

  for (const c of candidates) {
    const dist = levenshtein(name, c.name);
    if (dist < bestDist && dist <= threshold) {
      bestDist = dist;
      bestMatch = c;
    }
  }
  return bestMatch;
}

// ─── 상품명 감지 ───
function detectProducts(goodsName) {
  if (!goodsName) return ['알쓰패치'];
  const products = [];
  if (goodsName.includes('알쓰') || goodsName.includes('음주') || goodsName.includes('절주')) {
    products.push('알쓰패치');
  }
  if (goodsName.includes('노담') || goodsName.includes('금연') || goodsName.includes('흡연')) {
    products.push('노담패치');
  }
  return products.length > 0 ? products : ['알쓰패치'];
}

// ─── Google Apps Script에서 주문 데이터 가져오기 ───
async function fetchWebhookOrders(since) {
  const url = new URL(GAS_WEB_APP_URL);
  url.searchParams.set('key', GAS_API_KEY);
  url.searchParams.set('action', 'orders');
  if (since) url.searchParams.set('since', since);

  const response = await fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow'
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.orders || [];
}

// ─── 주문 데이터를 institutionData에 병합 ───
function mergeOrdersIntoData(orders) {
  // 이미 동기화된 주문번호 기록 (중복 방지)
  const syncedSet = new Set(
    JSON.parse(localStorage.getItem(SYNC_ORDERS_KEY) || '[]')
  );

  // 취소/환불 제외 + 중복 제외
  const validOrders = orders.filter(o => {
    const state = String(o.state_subject || '');
    if (state.includes('취소') || state.includes('환불')) return false;
    // order_idx + goods_name으로 중복 체크
    const key = o.order_idx + '_' + (o.goods_name || '');
    if (syncedSet.has(key)) return false;
    syncedSet.add(key);
    return true;
  });

  if (validOrders.length === 0) {
    return { matched: 0, newEntries: 0, total: 0 };
  }

  // option_user + addr 기준으로 그룹핑
  const groups = {};
  for (const order of validOrders) {
    const optUser = (order.option_user || '').trim();
    const addr = (order.addr || '').trim();
    const key = optUser + '|' + addr;
    if (!groups[key]) groups[key] = [];
    groups[key].push(order);
  }

  let matchCount = 0;
  const newEntries = [];

  for (const [key, groupOrders] of Object.entries(groups)) {
    const optionUser = (groupOrders[0].option_user || '').trim();
    const addr = (groupOrders[0].addr || '').trim();

    const matched = matchInstitution(optionUser, addr);

    if (matched) {
      // 기존 기관 업데이트
      let addAmount = 0;
      let addVolume = 0;
      let latestDate = matched.lastPurchaseDate || '';
      const allProducts = new Set(matched.products || []);

      for (const order of groupOrders) {
        const price = parseFloat(order.sale_price) || 0;
        const cnt = parseInt(order.sale_cnt) || 0;
        addAmount += price * cnt;
        addVolume += cnt;

        const orderDate = String(order.reg_time || '').slice(0, 10);
        if (orderDate && (orderDate > latestDate || latestDate === '-')) {
          latestDate = orderDate;
        }
        detectProducts(order.goods_name).forEach(p => allProducts.add(p));
      }

      matched.purchaseAmount += addAmount;
      matched.purchaseVolume += addVolume;
      if (latestDate && latestDate !== '-') matched.lastPurchaseDate = latestDate;
      matched.products = [...allProducts];

      // 구매단계 승격
      if (['인지', '관심', '고려'].includes(matched.purchaseStage)) {
        matched.purchaseStage = '구매';
      }

      // 구매주기 업데이트
      if (matched.purchaseCycle === '-') matched.purchaseCycle = '단건';

      matchCount++;
    } else {
      // 미매칭 → 신규 기관 생성
      const { region, district } = parseAddress(addr);
      if (!region) continue;

      let addAmount = 0;
      let addVolume = 0;
      let latestDate = '';
      const allProducts = new Set();

      for (const order of groupOrders) {
        const price = parseFloat(order.sale_price) || 0;
        const cnt = parseInt(order.sale_cnt) || 0;
        addAmount += price * cnt;
        addVolume += cnt;
        const d = String(order.reg_time || '').slice(0, 10);
        if (d > latestDate) latestDate = d;
        detectProducts(order.goods_name).forEach(p => allProducts.add(p));
      }

      // 기관유형 결정
      let instType = '공공기관(기타)';
      const displayName = optionUser || '신규기관';
      for (const [kw, type] of Object.entries(INST_TYPE_KEYWORDS)) {
        if (displayName.includes(kw)) { instType = type; break; }
      }

      // 좌표 (지역 중심 + 랜덤 오프셋)
      const center = REGION_CENTERS[region] || [36.5, 127.5];

      newEntries.push({
        id: institutionData.length + newEntries.length + 1,
        name: displayName,
        type: instType,
        region: region,
        district: district || region,
        lat: center[0] + (Math.random() - 0.5) * 0.02,
        lng: center[1] + (Math.random() - 0.5) * 0.02,
        products: [...allProducts],
        purchaseCycle: '단건',
        purchaseVolume: addVolume,
        purchaseAmount: addAmount,
        purchaseStage: '구매',
        lastPurchaseDate: latestDate
      });
    }
  }

  // 신규 기관을 institutionData에 추가
  newEntries.forEach(e => institutionData.push(e));

  // 동기화된 주문번호 저장
  localStorage.setItem(SYNC_ORDERS_KEY, JSON.stringify([...syncedSet]));

  return {
    matched: matchCount,
    newEntries: newEntries.length,
    total: validOrders.length
  };
}

// ─── 동기화 버튼 클릭 핸들러 ───
async function syncFromWebhook() {
  const btn = document.getElementById('syncBtn');
  const status = document.getElementById('syncStatus');

  btn.disabled = true;
  btn.textContent = '동기화 중...';
  status.textContent = '';
  status.className = 'sync-status';

  try {
    // 마지막 동기화 이후 데이터만 가져오기
    const lastSync = localStorage.getItem(SYNC_STORAGE_KEY) || '';
    const orders = await fetchWebhookOrders(lastSync);

    if (orders.length === 0) {
      status.textContent = '새로운 주문이 없습니다.';
      status.className = 'sync-status sync-info';
    } else {
      const result = mergeOrdersIntoData(orders);

      // 마지막 동기화 시간 저장
      localStorage.setItem(SYNC_STORAGE_KEY,
        new Date().toISOString().slice(0, 10));

      // 필터 재적용 → 대시보드 전체 갱신
      applyFilters();

      status.textContent =
        `${result.total}건 동기화 (매칭 ${result.matched}, 신규 ${result.newEntries})`;
      status.className = 'sync-status sync-success';
    }
  } catch (err) {
    console.error('동기화 오류:', err);
    status.textContent = '동기화 실패: ' + err.message;
    status.className = 'sync-status sync-error';
  } finally {
    btn.disabled = false;
    btn.textContent = '불러오기';
  }
}

// ─── 동기화 초기화 (개발/테스트용) ───
function resetSyncHistory() {
  localStorage.removeItem(SYNC_STORAGE_KEY);
  localStorage.removeItem(SYNC_ORDERS_KEY);
  console.log('동기화 이력이 초기화되었습니다.');
}
