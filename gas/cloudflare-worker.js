/**
 * Cloudflare Worker - 애니빌드 → Google Apps Script + Supabase 동시 저장
 *
 * 애니빌드 webhook 수신 → GAS(Google Sheets) + Supabase DB 동시 저장
 *
 * 환경변수 설정 (Cloudflare Dashboard → Worker → Settings → Variables):
 *   GAS_URL       = https://script.google.com/macros/s/...생략.../exec
 *   SUPABASE_URL  = https://YOUR_PROJECT.supabase.co
 *   SUPABASE_KEY  = eyJ... (service_role key, anon key 아님!)
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

    // GET: 데이터 조회 (GAS 프록시)
    if (request.method === 'GET') {
      const url = new URL(request.url);
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

      const gasResult = results[0].status === 'fulfilled' ? results[0].value : results[0].reason?.message;
      const supaResult = results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason?.message };

      return new Response(JSON.stringify({
        gas: gasResult,
        supabase: supaResult
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
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
  const STAGE_PRIORITY = { '인지': 0, '관심': 1, '고려': 2, '구매': 3, '만족': 4, '추천': 5 };

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

// ─── Supabase 저장 ───
async function saveToSupabase(rawBody, supabaseUrl, supabaseKey) {
  try {
    // json_data 파라미터 추출 (URL-encoded body)
    const params = new URLSearchParams(rawBody);
    const jsonStr = params.get('json_data') || rawBody;
    const payload = JSON.parse(jsonStr);

    // 주문상태변경 vs 신규주문 구분
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
  const goodsInfo = data.goods_info || [];

  // reg_time 변환
  let regTime = '';
  if (data.reg_time) {
    let ts = parseInt(data.reg_time);
    if (ts > 9999999999) ts = Math.floor(ts / 1000);
    if (ts > 0) {
      regTime = new Date(ts * 1000).toISOString().replace('T', ' ').slice(0, 19);
    } else {
      regTime = String(data.reg_time);
    }
  }

  // 중복 체크
  const existing = await supaFetch(supabaseUrl, supabaseKey,
    `/rest/v1/orders?order_idx=eq.${encodeURIComponent(data.order_idx || '')}&select=id`,
    'GET'
  );

  if (existing && existing.length > 0) {
    return { skipped: true, reason: 'duplicate', order_idx: data.order_idx };
  }

  // 주문자명으로 기관 매칭 시도
  const buyerName = (data.j_name || data.s_name || '').trim();
  let institutionId = null;

  if (buyerName) {
    const matchResult = await supaFetch(supabaseUrl, supabaseKey,
      `/rest/v1/institutions?name=ilike.*${encodeURIComponent(buyerName)}*&select=id,name&limit=1`,
      'GET'
    );
    if (matchResult && matchResult.length > 0) {
      institutionId = matchResult[0].id;
    }
  }

  // 주문 레코드 생성 (상품별 1행)
  const records = [];

  if (goodsInfo.length > 0) {
    for (const item of goodsInfo) {
      records.push({
        order_idx: data.order_idx || '',
        reg_time: regTime,
        state_subject: data.state_subject || data.state || '',
        option_user: item.option_user || data.j_name || '',
        addr: data.addr || '',
        goods_name: item.goods_name || '',
        sale_price: parseFloat(item.sale_price) || 0,
        sale_cnt: parseInt(item.sale_cnt) || 0,
        institution_id: institutionId,
        matched: !!institutionId
      });
    }
  } else {
    records.push({
      order_idx: data.order_idx || '',
      reg_time: regTime,
      state_subject: data.state_subject || data.state || '',
      option_user: data.j_name || '',
      addr: data.addr || '',
      goods_name: '',
      sale_price: parseFloat(data.app_price) || 0,
      sale_cnt: 0,
      institution_id: institutionId,
      matched: !!institutionId
    });
  }

  // 주문 삽입
  const insertResult = await supaFetch(supabaseUrl, supabaseKey,
    '/rest/v1/orders',
    'POST',
    records
  );

  // 매칭된 기관이 있으면 구매금액/단계 업데이트
  if (institutionId) {
    const totalAmount = records.reduce((s, r) => s + (r.sale_price * r.sale_cnt), 0);
    await updateInstitutionOnOrder(supabaseUrl, supabaseKey, institutionId, totalAmount);
  }

  return { success: true, count: records.length, matched: !!institutionId };
}

// ─── 주문 상태 변경 ───
async function updateOrderStatus(data, supabaseUrl, supabaseKey) {
  if (!data.order_idx) return { error: 'no order_idx' };

  const result = await supaFetch(supabaseUrl, supabaseKey,
    `/rest/v1/orders?order_idx=eq.${encodeURIComponent(data.order_idx)}`,
    'PATCH',
    { state_subject: data.state_subject || data.state || '' }
  );

  return { success: true, order_idx: data.order_idx, updated: true };
}

// ─── 기관 구매정보 업데이트 ───
async function updateInstitutionOnOrder(supabaseUrl, supabaseKey, instId, addAmount) {
  // 현재 기관 정보 조회
  const inst = await supaFetch(supabaseUrl, supabaseKey,
    `/rest/v1/institutions?id=eq.${instId}&select=purchase_amount,purchase_stage`,
    'GET'
  );

  if (!inst || inst.length === 0) return;

  const current = inst[0];
  const newAmount = (current.purchase_amount || 0) + addAmount;

  // 구매 단계 업그레이드 (현재가 구매 미만이면 구매로)
  const stages = ['인지', '관심', '고려', '구매', '만족', '추천'];
  const currentIdx = stages.indexOf(current.purchase_stage || '인지');
  const purchaseIdx = stages.indexOf('구매');
  const newStage = currentIdx < purchaseIdx ? '구매' : current.purchase_stage;

  const today = new Date().toISOString().slice(0, 10);

  await supaFetch(supabaseUrl, supabaseKey,
    `/rest/v1/institutions?id=eq.${instId}`,
    'PATCH',
    {
      purchase_amount: newAmount,
      purchase_stage: newStage,
      last_purchase_date: today
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

  if (method === 'GET' || (method === 'POST' && headers.Prefer.includes('return'))) {
    return await response.json();
  }

  return { status: response.status };
}
