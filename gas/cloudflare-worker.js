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
