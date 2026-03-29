/**
 * aps-order Worker — 애니빌드 주문 처리 전용
 *
 * 역할: 애니빌드 webhook 수신 → GAS(Google Sheets) + Supabase DB 동시 저장
 * URL:  aps-order.vianne75.workers.dev
 *
 * 환경변수 (Cloudflare Dashboard → Worker → Settings → Variables):
 *   GAS_URL       = https://script.google.com/macros/s/...생략.../exec
 *   SUPABASE_URL  = https://rvqkoiqjjhlrgqitnxwt.supabase.co
 *   SUPABASE_KEY  = eyJ... (service_role key)
 *
 * ⚠️  이 Worker는 주문 처리만 담당합니다.
 *     HC 동기화 / QR / 교육허브 → aps-webhook Worker 유지
 */

export default {
  async fetch(request, env) {
    const GAS_URL = env.GAS_URL || 'https://script.google.com/macros/s/AKfycbzg6DkY-6OyYZXZ46zxCqpPqXohj4vIxg6Trcb-XEADmvjTad1nIDcPYl130FF7CUhVHQ/exec';
    const SUPABASE_URL = env.SUPABASE_URL || '';
    const SUPABASE_KEY = env.SUPABASE_KEY || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    if (request.method === 'GET') {
      const url = new URL(request.url);
      if (url.pathname === '/version') {
        return jsonResponse({ worker: 'aps-order', version: '2026-03-29', deployed: new Date().toISOString() });
      }
      return new Response('aps-order Worker', { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    if (request.method === 'POST') {
      const body = await request.text();

      // GAS 전달 + Supabase 저장 병렬 실행
      const results = await Promise.allSettled([
        // 1) GAS (Google Sheets)
        fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body,
          redirect: 'follow'
        }).then(r => r.text()),

        // 2) Supabase
        SUPABASE_URL && SUPABASE_KEY
          ? saveToSupabase(body, SUPABASE_URL, SUPABASE_KEY)
          : Promise.resolve({ skipped: true })
      ]);

      const gasResult   = results[0].status === 'fulfilled' ? results[0].value : results[0].reason?.message;
      const supaResult  = results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason?.message };

      return new Response(JSON.stringify({ gas: gasResult, supabase: supaResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response('aps-order Worker', { status: 200 });
  }
};

// ─── 응답 헬퍼 ───
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

// ─── 유효 세그먼트 판별 ───
// 기관 suffix가 있으면 유효 기관명으로 판단
const INST_SUFFIXES = [
  '보건소','보건지소','보건진료소','건강증진',
  '대학교','대학','고등학교','중학교','초등학교','학교','대학원',
  '병원','의원','클리닉','센터','지원센터','복지센터','건강센터',
  '공사','공단','재단','협회','학회','연구원','연구소',
  '제약','바이오','헬스',
  '구청','시청','군청','청','부대','경찰','소방','군부대',
  '주식회사','(주)','㈜','회사','기업',
  '기관','복지관','요양원','어린이집'
];
const INST_SUFFIX_RE = new RegExp('(' + INST_SUFFIXES.join('|') + ')');

// 개인 이름 패턴: 2~4자 순수 한글 (공백 없음)
const PERSONAL_NAME_RE = /^[가-힣]{2,4}$/;

// 블랙리스트 키워드
const BLACKLIST_KEYWORDS = ['클라우드리뷰', '체험단', '리뷰어', '블로거'];

function isValidInstitution(name) {
  if (!name || name.length < 2) return false;
  if (BLACKLIST_KEYWORDS.some(b => name.includes(b))) return false;
  if (PERSONAL_NAME_RE.test(name)) return false; // 순수 개인 이름
  if (INST_SUFFIX_RE.test(name)) return true;    // 기관 suffix 포함
  if (name.length >= 6) return true;             // 6자 이상은 기관으로 간주
  return false;
}

// ─── option_user에서 기관명 파싱 ───
function parseInstName(optionUser) {
  if (!optionUser) return '';
  const s = optionUser.replace(/<br\s*\/?>/gi, '\n');
  const m1 = s.match(/사용처명[^:：\n]*[:：]\s*([^\n]+)/);
  if (m1 && m1[1].trim()) return m1[1].trim();
  const m2 = s.match(/인쇄기관명[^:：\n]*[:：]\s*([^\n]+)/);
  if (m2 && m2[1].trim()) return m2[1].trim();
  const clean = s.replace(/<[^>]+>/g, '').trim();
  const firstLine = clean.split('\n').map(l => l.trim()).find(l => l);
  return firstLine || clean;
}

// ─── 기관명 정제 (중복 제거, 부서명 제거) ───
function normalizeInstName(raw) {
  if (!raw) return '';
  const tokens = raw.trim().split(/\s+/);
  // 중복 단어: "일동제약 일동제약" → "일동제약"
  if (tokens.length >= 2 && tokens[0] === tokens[1]) return tokens[0];
  // 부가정보 제거: "현대자동차 울산공장" → "현대자동차"
  const sm = raw.match(/^(.+?)\s+\S*(기지본부|지사|지점|공장|사업부|사업소|본부|지부|사무소|연구동|부서|팀)$/);
  if (sm) return sm[1];
  return raw.trim();
}

// ─── 주소에서 광역시·도 추출 ───
const REGION_MAP = {
  '서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시', '인천': '인천광역시',
  '광주': '광주광역시', '대전': '대전광역시', '울산': '울산광역시', '세종': '세종특별자치시',
  '경기': '경기도', '강원': '강원특별자치도', '충북': '충청북도', '충남': '충청남도',
  '전북': '전북특별자치도', '전남': '전라남도', '경북': '경상북도', '경남': '경상남도', '제주': '제주특별자치도'
};
function extractRegion(addr) {
  if (!addr) return '';
  const m = addr.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
  return m ? m[1] : '';
}

// ─── Supabase 저장 ───
async function saveToSupabase(rawBody, supabaseUrl, supabaseKey) {
  try {
    const params = new URLSearchParams(rawBody);
    const jsonStr = params.get('json_data') || rawBody;
    const payload = JSON.parse(jsonStr);

    if (!payload.goods_info) {
      return await updateOrderStatus(payload, supabaseUrl, supabaseKey);
    } else {
      return await insertNewOrder(payload, supabaseUrl, supabaseKey);
    }
  } catch (err) {
    return { error: err.message };
  }
}

// ─── 신규 주문 저장 ───
async function insertNewOrder(data, supabaseUrl, supabaseKey) {
  let goodsInfo = data.goods_info || [];

  // reg_time 변환
  let regTime = '';
  if (data.reg_time !== null && data.reg_time !== undefined && data.reg_time !== '') {
    const raw = String(data.reg_time).trim();
    if (/^\d+$/.test(raw)) {
      const len = raw.length;
      let ts = parseInt(raw);
      if (len === 8 && ts >= 20000101 && ts <= 21001231) {
        regTime = `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)} 00:00:00`;
      } else {
        if (ts > 9999999999) ts = Math.floor(ts / 1000);
        regTime = new Date(ts * 1000).toISOString().replace('T', ' ').slice(0, 19);
      }
    } else if (/^\d{4}[-/]/.test(raw)) {
      regTime = raw.replace(/\//g, '-');
    } else {
      regTime = raw;
    }
  }
  if (!regTime) {
    regTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  // 중복 체크
  const orderIdx = String(data.order_idx || '').trim();
  if (orderIdx) {
    const existing = await supaFetch(supabaseUrl, supabaseKey,
      `/rest/v1/orders?order_idx=eq.${encodeURIComponent(orderIdx)}&select=id,goods_name`,
      'GET'
    );
    if (existing && existing.length > 0) {
      const existingGoodsSet = new Set(existing.map(r => r.goods_name || ''));
      goodsInfo = goodsInfo.filter(item => !existingGoodsSet.has(item.goods_name || ''));
      if (goodsInfo.length === 0) {
        return { skipped: true, reason: 'duplicate', order_idx: orderIdx };
      }
    }
  }

  // 기관 매칭
  const rawName = parseInstName((goodsInfo[0] && goodsInfo[0].option_user) || '');
  const buyerName = rawName || (data.j_name || data.s_name || '').trim();
  let institutionId = null;

  // 유효 세그먼트(기관)일 때만 매칭 시도
  if (isValidInstitution(buyerName)) {
    const normalized = normalizeInstName(buyerName);

    // [1순위] 원본 기관명 부분 일치
    const r1 = await supaFetch(supabaseUrl, supabaseKey,
      `/rest/v1/institutions?name=ilike.*${encodeURIComponent(buyerName)}*&select=id,name&limit=2`,
      'GET'
    );
    if (r1 && r1.length === 1) institutionId = r1[0].id;

    // [2순위] 정제된 기관명 재시도 (부서명 제거 후)
    if (!institutionId && normalized !== buyerName) {
      const r2 = await supaFetch(supabaseUrl, supabaseKey,
        `/rest/v1/institutions?name=ilike.*${encodeURIComponent(normalized)}*&select=id,name&limit=2`,
        'GET'
      );
      if (r2 && r2.length === 1) institutionId = r2[0].id;
    }
  }

  // [3순위] 주소 역추적 (기관명 유효 여부 무관 — 주소에 기관명 포함 시)
  if (!institutionId && data.addr) {
    const addrRegion = extractRegion(data.addr);
    const r3 = await supaFetch(supabaseUrl, supabaseKey,
      `/rest/v1/institutions?select=id,name,region&limit=1500`,
      'GET'
    );
    if (r3) {
      const candidates = r3.filter(i => i.name.length >= 4 && data.addr.includes(i.name));
      if (candidates.length === 1) {
        institutionId = candidates[0].id;
      } else if (candidates.length > 1 && addrRegion) {
        const regional = candidates.filter(i => (i.region || '').startsWith(REGION_MAP[addrRegion] || addrRegion));
        if (regional.length === 1) institutionId = regional[0].id;
      }
    }
  }

  // 주문 레코드 생성 (상품별 1행)
  const baseRecord = {
    order_idx:      data.order_idx || '',
    reg_time:       regTime,
    state_subject:  data.state_subject || data.state || '',
    addr:           data.addr || '',
    memlv:          data.memlv || '',
    mem_id:         (data.mem_id || '').trim(),
    zipcode:        (data.zipcode || '').trim(),
    institution_id: institutionId,
    matched:        !!institutionId
  };

  const records = [];
  if (goodsInfo.length > 0) {
    for (const item of goodsInfo) {
      records.push({
        ...baseRecord,
        option_user: item.option_user || data.j_name || '',
        goods_name:  item.goods_name || '',
        sale_price:  parseFloat(item.sale_price) || 0,
        sale_cnt:    parseInt(item.sale_cnt) || 0,
      });
    }
  } else {
    records.push({
      ...baseRecord,
      option_user: data.j_name || '',
      goods_name:  '',
      sale_price:  parseFloat(data.app_price) || 0,
      sale_cnt:    0,
    });
  }

  await supaFetch(supabaseUrl, supabaseKey, '/rest/v1/orders', 'POST', records);

  if (institutionId) {
    const totalAmount = records.reduce((s, r) => s + (r.sale_price * r.sale_cnt), 0);
    await updateInstitutionOnOrder(supabaseUrl, supabaseKey, institutionId, totalAmount);
  }

  return { success: true, count: records.length, matched: !!institutionId };
}

// ─── 주문 상태 변경 ───
async function updateOrderStatus(data, supabaseUrl, supabaseKey) {
  if (!data.order_idx) return { error: 'no order_idx' };

  await supaFetch(supabaseUrl, supabaseKey,
    `/rest/v1/orders?order_idx=eq.${encodeURIComponent(data.order_idx)}`,
    'PATCH',
    { state_subject: data.state_subject || data.state || '' }
  );

  return { success: true, order_idx: data.order_idx, updated: true };
}

// ─── 기관 구매정보 업데이트 ───
async function updateInstitutionOnOrder(supabaseUrl, supabaseKey, instId, addAmount) {
  const inst = await supaFetch(supabaseUrl, supabaseKey,
    `/rest/v1/institutions?id=eq.${instId}&select=purchase_amount,purchase_stage`,
    'GET'
  );
  if (!inst || inst.length === 0) return;

  const current = inst[0];
  const newAmount = (current.purchase_amount || 0) + addAmount;

  const stages = ['인지', '관심', '고려', '구매', '활용', '재구매', '파트너'];
  const currentIdx = stages.indexOf(current.purchase_stage || '인지');
  const purchaseIdx = stages.indexOf('구매');
  const newStage = currentIdx < purchaseIdx ? '구매' : current.purchase_stage;

  await supaFetch(supabaseUrl, supabaseKey,
    `/rest/v1/institutions?id=eq.${instId}`,
    'PATCH',
    {
      purchase_amount:    newAmount,
      purchase_stage:     newStage,
      last_purchase_date: new Date().toISOString().slice(0, 10)
    }
  );
}

// ─── Supabase REST API 헬퍼 ───
async function supaFetch(supabaseUrl, supabaseKey, path, method, body) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
  };

  const options = { method, headers };
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${supabaseUrl}${path}`, options);

  if (method === 'DELETE') return { status: response.status };
  if (method === 'GET' || (method === 'POST' && headers.Prefer.includes('return'))) {
    return await response.json();
  }

  return { status: response.status };
}
