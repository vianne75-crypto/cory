/**
 * aps-webhook Worker — HC 동기화 / QR 추적 / 교육허브 프록시 전용
 *
 * 역할:
 *   GET /*               → GAS 프록시 (QR 스캔 / 교육허브) ← 절대 건드리지 않음
 *   GET /fetch-sheet     → Google Sheets CSV 프록시
 *   POST /sync-hc-institutions → HC 기관 동기화
 *   POST /sync-consultations   → 상담내역 동기화
 *   POST /record-shipment      → HC 샘플 발송 기록
 *
 * ⚠️  애니빌드 주문 처리(POST /*)는 aps-order Worker로 분리됨
 *     애니빌드 webhook URL → aps-order.vianne75.workers.dev
 *
 * 환경변수 (Cloudflare Dashboard → Worker → Settings → Variables):
 *   GAS_URL       = https://script.google.com/macros/s/...생략.../exec
 *   SUPABASE_URL  = https://rvqkoiqjjhlrgqitnxwt.supabase.co
 *   SUPABASE_KEY  = eyJ... (service_role key)
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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // GET: 라우팅
    if (request.method === 'GET') {
      const url = new URL(request.url);

      if (url.pathname === '/version') {
        return jsonResponse({ version: '2026-03-20-stage9-shipment', deployed: new Date().toISOString() });
      }

      // 대리점 사업자정보 조회 (사외비 — key 검증 필수). 웹훅 반영 확인·팝빌 발행용.
      if (url.pathname === '/dealer-business') {
        if (url.searchParams.get('key') !== '52b8fc2a5de7cf289fe7729a547f5b2d') {
          return jsonResponse({ error: 'unauthorized' }, 401);
        }
        if (!SUPABASE_URL || !SUPABASE_KEY) return jsonResponse({ error: 'Supabase not configured' }, 500);
        const memId = url.searchParams.get('mem_id');
        // mem_id 지정 시 해당 건, 아니면 최근 수정순 20건(웹훅 반영 확인용)
        const q = memId
          ? `/rest/v1/dealer_business_info?mem_id=eq.${encodeURIComponent(memId)}&select=*`
          : `/rest/v1/dealer_business_info?select=mem_id,memlv,company_name,business_no,ceo_name,email,updated_at&order=updated_at.desc&limit=20`;
        const rows = await supaFetch(SUPABASE_URL, SUPABASE_KEY, q, 'GET');
        const cnt = await supaFetch(SUPABASE_URL, SUPABASE_KEY, '/rest/v1/dealer_business_info?select=mem_id', 'GET');
        return jsonResponse({ total: Array.isArray(cnt) ? cnt.length : null, rows });
      }

      if (url.pathname === '/fetch-sheet') {
        const sheetId = url.searchParams.get('id');
        const gid = url.searchParams.get('gid') || '0';
        if (!sheetId) return jsonResponse({ error: 'id parameter required' }, 400);

        try {
          const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
          const resp = await fetch(csvUrl, { redirect: 'follow' });
          if (!resp.ok) throw new Error(`Sheet fetch failed: ${resp.status}`);
          const text = await resp.text();
          return new Response(text, {
            status: 200,
            headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (err) {
          return jsonResponse({ error: err.message }, 500);
        }
      }

      // 기존 GAS 프록시
      const gasUrl = new URL(GAS_URL);
      for (const [key, value] of url.searchParams) {
        gasUrl.searchParams.set(key, value);
      }

      const gasResponse = await fetch(gasUrl.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      const body = await gasResponse.text();
      // GAS가 JSON 대신 HTML(인증/에러 페이지)을 반환하면 application/json으로
      // 위장 통과시키지 않는다 — 클라이언트의 "Unexpected token '<'" 혼란 방지.
      // 주원인: env.GAS_URL이 죽은/구 배포를 가리킬 때 발생.
      if (body.trimStart().startsWith('<')) {
        return jsonResponse({
          error: 'GAS_NON_JSON',
          message: 'GAS 웹앱이 JSON 대신 HTML을 반환했습니다. Cloudflare env.GAS_URL 배포 URL/권한 또는 GAS 재배포를 확인하세요.',
          gas_url_tail: GAS_URL.slice(-12)
        }, 502);
      }
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // POST: 라우팅
    if (request.method === 'POST') {
      const url = new URL(request.url);
      const body = await request.text();

      // HC 기관 동기화 엔드포인트
      if (url.pathname === '/sync-hc-institutions') {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
          return jsonResponse({ error: 'Supabase not configured' }, 500);
        }
        try {
          const records = JSON.parse(body);
          const result = await syncHcInstitutions(records, SUPABASE_URL, SUPABASE_KEY);
          return jsonResponse(result);
        } catch (err) {
          return jsonResponse({ error: err.message }, 500);
        }
      }

      // 상담내역 동기화 엔드포인트
      if (url.pathname === '/sync-consultations') {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
          return jsonResponse({ error: 'Supabase not configured' }, 500);
        }
        try {
          const records = JSON.parse(body);
          const result = await syncConsultations(records, SUPABASE_URL, SUPABASE_KEY);
          return jsonResponse(result);
        } catch (err) {
          return jsonResponse({ error: err.message }, 500);
        }
      }

      // 주문 관리자 메모 동기화 엔드포인트 (경로 A — wcolive 주문목록 스크래핑)
      if (url.pathname === '/sync-order-memos') {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
          return jsonResponse({ error: 'Supabase not configured' }, 500);
        }
        try {
          const records = JSON.parse(body);
          const result = await syncOrderMemos(records, SUPABASE_URL, SUPABASE_KEY);
          return jsonResponse(result);
        } catch (err) {
          return jsonResponse({ error: err.message }, 500);
        }
      }

      // 애니빌드 회원가입 Push Webhook — 신규 대리점 사업자번호 자동 수집
      // (가입시 정보전송 샘플: json_data 파라미터, 애니빌드 서버 IP만 허용, 응답은 'OK'만)
      if (url.pathname === '/anybuild-member') {
        const ip = request.headers.get('CF-Connecting-IP') || '';
        const ALLOW = ['121.125.73.', '218.237.67.', '221.139.49.'];
        if (!ALLOW.some(p => ip.startsWith(p))) {
          return new Response('Access blocked', { status: 403 });
        }
        try {
          const params = new URLSearchParams(body);
          let raw = params.get('json_data') || body;
          raw = raw.replace(/\\(.)/g, '$1'); // stripslashes 유사
          const m = JSON.parse(raw);
          const rec = buildDealerRecord(m);
          if (rec) await upsertDealerRecords([rec], SUPABASE_URL, SUPABASE_KEY);
        } catch (err) { /* 수신 확인 우선 — 실패해도 재전송 폭주 방지 위해 OK 반환. 누락분은 스크래퍼 폴백 */ }
        return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }

      // 대리점 사업자정보 백필 (스크래퍼 1회 — 기존 회원 mem_list.htm 추출분)
      if (url.pathname === '/sync-dealer-business') {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
          return jsonResponse({ error: 'Supabase not configured' }, 500);
        }
        try {
          const records = JSON.parse(body);
          const GRADE_CODE = { '유통회원': '1100', 'APS대리점': '1400', '대리점': '3000' };
          // 전 레코드를 한 번에 벌크 upsert (fetch 1번 — subrequest 한도 회피)
          const recs = records.map(r => buildDealerRecord({
            mem_id: r.mem_id, memlv: GRADE_CODE[r.grade] || r.grade,
            sangho: r.company, name: r.name, biz_num: r.business_no,
            email: r.email, addr1: r.addr
          })).filter(Boolean);
          const { upserted } = await upsertDealerRecords(recs, SUPABASE_URL, SUPABASE_KEY);
          return jsonResponse({ success: true, total: records.length, upserted, skipped: records.length - upserted });
        } catch (err) {
          return jsonResponse({ error: err.message }, 500);
        }
      }

      // HC 샘플 발송 기록 엔드포인트
      if (url.pathname === '/record-shipment') {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
          return jsonResponse({ error: 'Supabase not configured' }, 500);
        }
        try {
          const data = JSON.parse(body);
          if (data.secret !== 'aps2026hc') return jsonResponse({ error: 'unauthorized' }, 401);
          const { utm_code, shipped_date, tracking_number, carrier } = data;
          if (!utm_code) return jsonResponse({ error: 'utm_code required' }, 400);
          const result = await recordShipment({ utm_code, shipped_date, tracking_number, carrier }, SUPABASE_URL, SUPABASE_KEY);
          return jsonResponse(result);
        } catch (err) {
          return jsonResponse({ error: err.message }, 500);
        }
      }

      // 주문 처리는 aps-order Worker로 이전됨
      return jsonResponse({ error: 'Order processing moved to aps-order Worker' }, 404);
    }

    return new Response('APS Webhook Proxy', { status: 200 });
  }
};

// ─── 응답 헬퍼 ───
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

// ─── 상담내역 동기화 ───
async function syncConsultations(records, supabaseUrl, supabaseKey) {
  if (!Array.isArray(records) || records.length === 0) {
    return { error: 'no records' };
  }

  // 기관 목록 로드 (매칭용)
  const institutions = await supaFetch(supabaseUrl, supabaseKey,
    '/rest/v1/institutions?select=id,name&limit=5000', 'GET'
  );

  // 태그 → 구매단계 매핑
  const TAG_STAGE_MAP = {
    '문의': '관심', '업체문의': '관심', '딜러문의': '관심', '단가문의': '관심', '구매문의': '관심',
    '견적': '고려', '견적서': '고려', '시안': '고려', '참고시안': '고려', '수정시안': '고려',
    '샘플': '고려', '샘플요청': '고려', '단가표': '고려',
    '수주': '고려', '긴급수주': '고려', '수주예정': '고려', '카드결제': '고려'
  };
  const STAGE_PRIORITY = { '인지': 0, '관심': 1, '고려': 2, '구매': 3, '활용': 4, '재구매': 5, '파트너': 6 };

  let inserted = 0, skipped = 0, matched = 0;
  const instUpdates = {}; // 기관별 업데이트 집계

  // 배치 처리 (200건씩)
  const batchSize = 200;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const consultRows = [];

    for (const rec of batch) {
      // 태그 추출
      const rawTags = (rec.content || '').match(/\[([^\]]+)\]/g) || [];
      const tags = rawTags.map(t => t.replace(/[\[\]]/g, '').trim()).filter(Boolean);

      // 기관 매칭
      const consultant = (rec.consultant || '').trim();
      let instId = null;
      if (consultant && institutions) {
        const inst = institutions.find(d => d.name === consultant) ||
          institutions.find(d => d.name.includes(consultant) || consultant.includes(d.name));
        if (inst) {
          instId = inst.id;
          matched++;

          // 기관별 상담 집계
          if (!instUpdates[instId]) {
            instUpdates[instId] = { count: 0, lastDate: '', maxStage: '관심' };
          }
          instUpdates[instId].count++;
          if (rec.date > instUpdates[instId].lastDate) {
            instUpdates[instId].lastDate = rec.date;
          }
          for (const tag of tags) {
            const stage = TAG_STAGE_MAP[tag];
            if (stage && STAGE_PRIORITY[stage] > STAGE_PRIORITY[instUpdates[instId].maxStage]) {
              instUpdates[instId].maxStage = stage;
            }
          }
        }
      }

      consultRows.push({
        date: rec.date || null,
        tags: tags,
        content: rec.content || '',
        md_name: rec.md || null,
        raw_institution_name: consultant || null,
        institution_id: instId,
        matched: !!instId
      });
    }

    // 배치 삽입
    const result = await supaFetch(supabaseUrl, supabaseKey,
      '/rest/v1/consultations', 'POST', consultRows
    );

    if (result && result.length) {
      inserted += result.length;
    } else {
      inserted += consultRows.length;
    }
  }

  // 매칭된 기관들의 상담횟수/단계 업데이트
  for (const [instId, update] of Object.entries(instUpdates)) {
    const inst = await supaFetch(supabaseUrl, supabaseKey,
      `/rest/v1/institutions?id=eq.${instId}&select=consult_count,last_consult_date,purchase_stage`,
      'GET'
    );
    if (!inst || inst.length === 0) continue;

    const current = inst[0];
    const newCount = (current.consult_count || 0) + update.count;
    const newDate = update.lastDate > (current.last_consult_date || '') ? update.lastDate : current.last_consult_date;

    const patch = { consult_count: newCount, last_consult_date: newDate };

    // 단계 업그레이드 (현재보다 높으면)
    const currentPriority = STAGE_PRIORITY[current.purchase_stage || '인지'] || 0;
    const newPriority = STAGE_PRIORITY[update.maxStage] || 0;
    if (newPriority > currentPriority) {
      patch.purchase_stage = update.maxStage;
    }

    await supaFetch(supabaseUrl, supabaseKey,
      `/rest/v1/institutions?id=eq.${instId}`, 'PATCH', patch
    );
  }

  return {
    success: true,
    total: records.length,
    inserted,
    matched,
    institutionsUpdated: Object.keys(instUpdates).length
  };
}

// ─── 대리점 사업자정보 (webhook·백필 공용) ───
// 대리점 등급(1100 유통회원·1400 APS대리점·3000 대리점)만 대상. 아니면 null.
function buildDealerRecord(m) {
  const DEALER = ['1100', '1400', '3000'];
  const memId = String(m.mem_id || '').trim();
  const memlv = String(m.memlv || '').trim();
  if (!memId || !DEALER.includes(memlv)) return null;
  return {
    mem_id:       memId,
    memlv:        memlv,
    company_name: (m.sangho || '').trim(),
    business_no:  String(m.biz_num || '').trim(),
    ceo_name:     (m.name || '').trim(),
    address:      [m.addr1, m.addr2].filter(Boolean).join(' ').trim(),
    email:        (m.email || '').trim(),
    updated_at:   new Date().toISOString()
  };
}

// 벌크 upsert — 여러 레코드를 fetch 1번으로 (subrequest 한도 회피). mem_id 병합.
async function upsertDealerRecords(records, supabaseUrl, supabaseKey) {
  // 배치 내 mem_id 중복 제거(뒤엣것 유지) — ON CONFLICT 이중영향 방지
  const byId = {};
  for (const r of records) if (r) byId[r.mem_id] = r;
  const uniq = Object.values(byId);
  if (uniq.length === 0) return { upserted: 0 };

  const res = await fetch(`${supabaseUrl}/rest/v1/dealer_business_info?on_conflict=mem_id`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(uniq)
  });
  if (res.status >= 400) throw new Error(`supabase ${res.status}: ${(await res.text()).slice(0,200)}`);
  return { upserted: uniq.length };
}

// ─── 주문 관리자 메모 동기화 (경로 A) ───
// records = [{ order_idx, memo }]. wcolive 주문목록에서 긁은 관리자 메모를
// orders.memo_raw 에 order_idx 기준으로 기록. 파싱은 cory 관리자 "메모 파싱"
// 버튼(admin-memo-parser.js)이 단일 소스로 담당 → memo_parsed=false 로 리셋.
async function syncOrderMemos(records, supabaseUrl, supabaseKey) {
  if (!Array.isArray(records) || records.length === 0) {
    return { error: 'no records' };
  }

  let updated = 0, skipped = 0, notFound = 0;

  for (const rec of records) {
    const orderIdx = String(rec.order_idx || '').trim();
    const memo = (rec.memo || '').trim();
    if (!orderIdx || !memo) { skipped++; continue; }

    // order_idx 로 해당 주문(상품별 여러 행)의 memo_raw 일괄 갱신 + 파싱 리셋
    const res = await supaFetch(supabaseUrl, supabaseKey,
      `/rest/v1/orders?order_idx=eq.${encodeURIComponent(orderIdx)}`,
      'PATCH',
      { memo_raw: memo, memo_parsed: false }
    );

    // return=minimal → status 204. 매칭 행 없으면 notFound 추정 불가하므로 updated로 집계.
    if (res && (res.status === 204 || res.status === 200)) {
      updated++;
    } else {
      notFound++;
    }
  }

  return { success: true, total: records.length, updated, skipped, notFound };
}

// ─── HC 기관 동기화 (GAS → Worker → Supabase) ───
async function syncHcInstitutions(records, supabaseUrl, supabaseKey) {
  if (!Array.isArray(records) || records.length === 0) {
    return { error: 'no records' };
  }

  // 기존 HC 기관 로드
  const existing = await supaFetch(supabaseUrl, supabaseKey,
    `/rest/v1/institutions?type=eq.${encodeURIComponent('대학보건센터')}&select=id,name,purchase_stage,purchase_amount,purchase_volume,metadata`,
    'GET'
  );

  // utm_code 기준 매칭 (이름 변경 시에도 안전)
  const utmMap = {};
  const nameMap = {};
  (existing || []).forEach(inst => {
    const utm = (inst.metadata || {}).utm_code;
    if (utm) utmMap[utm] = inst;
    nameMap[inst.name] = inst;
  });

  const STAGE_PRIORITY = { '인지': 0, '관심': 1, '고려': 2, '구매': 3, '활용': 4, '재구매': 5, '파트너': 6 };
  const toInsert = [];
  const toUpdate = [];
  let unchanged = 0;

  for (const rec of records) {
    if (!rec.name) continue;
    const recUtm = (rec.metadata || {}).utm_code;
    const ex = (recUtm && utmMap[recUtm]) || nameMap[rec.name];

    if (!ex) {
      toInsert.push(rec);
    } else {
      const changes = {};
      if (rec.name && rec.name !== ex.name) changes.name = rec.name;
      if (rec.region && rec.region !== ex.region) changes.region = rec.region;
      if (rec.district) changes.district = rec.district;

      // 구매 정보: 상위 방향으로만 업데이트
      const curP = STAGE_PRIORITY[ex.purchase_stage || '인지'] || 0;
      const newP = STAGE_PRIORITY[rec.purchase_stage] || 0;
      if (newP > curP) changes.purchase_stage = rec.purchase_stage;
      if ((rec.purchase_amount || 0) > (ex.purchase_amount || 0)) changes.purchase_amount = rec.purchase_amount;
      if ((rec.purchase_volume || 0) > (ex.purchase_volume || 0)) changes.purchase_volume = rec.purchase_volume;
      if (rec.products && rec.products.length > 0) changes.products = rec.products;
      if (rec.last_purchase_date && rec.last_purchase_date !== '-') changes.last_purchase_date = rec.last_purchase_date;
      // CRM 전용 필드(status, scoring, change_log 등) 보존: 기존 metadata 머지
      if (rec.metadata) {
        changes.metadata = { ...(ex.metadata || {}), ...rec.metadata };
      }

      if (Object.keys(changes).length > 0) {
        toUpdate.push({ id: ex.id, ...changes });
      } else {
        unchanged++;
      }
    }
  }

  // 배치 삽입
  let inserted = 0;
  const batchSize = 50;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const result = await supaFetch(supabaseUrl, supabaseKey, '/rest/v1/institutions', 'POST', batch);
    if (result && !result.error) inserted += batch.length;
  }

  // 개별 업데이트
  let updated = 0;
  for (const upd of toUpdate) {
    const id = upd.id;
    delete upd.id;
    const result = await supaFetch(supabaseUrl, supabaseKey,
      `/rest/v1/institutions?id=eq.${id}`, 'PATCH', upd
    );
    if (result && !result.error) updated++;
  }

  // 마지막 동기화 시간 저장
  await supaFetch(supabaseUrl, supabaseKey, '/rest/v1/settings?key=eq.hc_last_sync', 'DELETE');
  await supaFetch(supabaseUrl, supabaseKey, '/rest/v1/settings', 'POST', {
    key: 'hc_last_sync',
    value: { time: new Date().toISOString(), inserted, updated, total: records.length, source: 'gas' }
  });

  return { success: true, total: records.length, inserted, updated, unchanged };
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

// ─── HC 샘플 발송 기록 ───
async function recordShipment({ utm_code, shipped_date, tracking_number, carrier }, supabaseUrl, supabaseKey) {
  if (!utm_code) return { error: 'utm_code required' };

  // 기관 조회 (utm_code로 매칭)
  const getResp = await fetch(
    `${supabaseUrl}/rest/v1/institutions?select=id,metadata&type=eq.대학보건센터`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!getResp.ok) return { error: `Supabase fetch failed: ${getResp.status}` };
  const insts = await getResp.json();

  const target = insts.find(inst => {
    const meta = inst.metadata || {};
    return (meta.utm_code || '').toLowerCase() === utm_code.toLowerCase();
  });

  if (!target) return { error: `utm_code not found: ${utm_code}` };

  // metadata 병합
  const meta = { ...(target.metadata || {}) };
  if (shipped_date) meta.sample_shipped_date = shipped_date;
  if (tracking_number) meta.sample_tracking_number = tracking_number;
  if (carrier) meta.sample_carrier = carrier;
  meta.sample_updated_at = new Date().toISOString();

  // 업데이트
  const patchResp = await fetch(
    `${supabaseUrl}/rest/v1/institutions?id=eq.${target.id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ metadata: meta })
    }
  );

  if (!patchResp.ok) {
    const errText = await patchResp.text();
    return { error: `Supabase update failed: ${patchResp.status} ${errText}` };
  }

  return {
    result: 'ok',
    id: target.id,
    utm_code,
    shipped_date,
    tracking_number,
    carrier
  };
}
