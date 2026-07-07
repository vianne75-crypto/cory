// ============================================
// aps-lead Cloudflare Worker
// 목적: KISS 2026 신청 폼 백엔드 (다채널 리드 통합의 첫 실전)
// 작성: 2026-07-02 (FLUX)
// 배포: wrangler deploy (별도 Worker, 기존 aps-webhook과 격리)
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Access-Control-Max-Age': '86400',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  ...CORS_HEADERS,
};

// 필수 필드 화이트리스트
const REQUIRED_FIELDS = ['name', 'phone', 'institution_name', 'privacy_agreed'];
const MAX_FIELD_LENGTH = { name: 50, phone: 20, institution_name: 200, address: 500, email: 100 };

// utm 등 자유 입력값 안전 절단 (스키마 초과로 인한 500 예방)
function trim50(v) {
  if (v === null || v === undefined) return null;
  return String(v).slice(0, 50);
}

// 비식별 조인 키용 salt — 하드코딩 폴백 제거, 미설정 시 명시적 실패(fail-closed)
function privacySalt(env) {
  const s = env.PRIVACY_HASH_SALT || env.IP_SALT;
  if (!s) throw new Error('salt not configured');
  return s;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/kiss-submit'    && request.method === 'POST') return await kissSubmit(request, env);
      if (path === '/kiss-counter'   && request.method === 'GET')  return await kissCounter(env);
      if (path === '/kiss-diagnosis' && request.method === 'POST') return await kissDiagnosis(request, env);
      if (path === '/kiss-flywheel'  && request.method === 'POST') return await kissFlywheel(request, env);
      if (path === '/alth-lead'      && request.method === 'POST') return await althLead(request, env);
      if (path === '/kiss-admin-list'      && request.method === 'GET') return await kissAdminList(request, env);
      if (path === '/kiss-admin-diagnosis' && request.method === 'GET') return await kissAdminDiagnosis(request, env);
      if (path === '/kiss-admin-process'   && request.method === 'POST') return await kissAdminProcess(request, env);
      if (path === '/health'         && request.method === 'GET')  return jsonResponse({ status: 'ok', worker: 'aps-lead' });

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (err) {
      // 상세는 로그에만. 클라이언트에는 일반 메시지(내부 오류 문자열 누출 차단).
      console.error('Worker error:', err.message, err.stack);
      return jsonResponse({ error: 'Internal error' }, 500);
    }
  },
};

// ─────────────────────────────────────────────
// POST /kiss-submit — 신청 저장
// ─────────────────────────────────────────────
async function kissSubmit(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return jsonResponse({ error: 'Invalid JSON' }, 400);

  // 1. 필수 필드 검증
  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) return jsonResponse({ error: `Missing field: ${field}` }, 400);
  }
  if (!body.privacy_agreed) return jsonResponse({ error: '개인정보 동의 필수' }, 400);

  // 2. 필드 길이 제한 (DoS 방어)
  for (const [field, max] of Object.entries(MAX_FIELD_LENGTH)) {
    if (body[field] && String(body[field]).length > max) {
      return jsonResponse({ error: `${field} too long` }, 400);
    }
  }

  // 3. 전화번호 정규화
  const phone = normalizePhone(body.phone);
  if (!phone) return jsonResponse({ error: 'Invalid phone' }, 400);

  // 4. IP 해시 (감사) + 비식별 ref_key (설문 조인용). IP 없으면 sentinel로 fail-closed.
  const ip = request.headers.get('CF-Connecting-IP') || 'noip';
  const ipHash = await sha256(ip + (env.IP_SALT || 'kiss2026'));
  const refKey = await sha256(phone + privacySalt(env));
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 300);

  // 5. 중복 차단 (fail-closed): ① 동일 IP 5분 ② 동일 전화 24h — IP 로테이션 우회 방어
  const dupIp = await supabaseFetch(env,
    `/rest/v1/kiss_signups?ip_hash=eq.${ipHash}&created_at=gte.${new Date(Date.now() - 300000).toISOString()}&select=id&limit=1`,
    'GET'
  );
  if (dupIp && dupIp.length > 0) {
    return jsonResponse({ error: '이미 신청하셨습니다 (5분 후 재시도)' }, 429);
  }
  const dupPhone = await supabaseFetch(env,
    `/rest/v1/kiss_signups?phone=eq.${encodeURIComponent(phone)}&created_at=gte.${new Date(Date.now() - 86400000).toISOString()}&select=id&limit=1`,
    'GET'
  );
  if (dupPhone && dupPhone.length > 0) {
    return jsonResponse({ error: '이미 신청된 연락처입니다' }, 429);
  }

  // 6. 카운터 마감 체크 (일별 캡·remaining 기반)
  const counter = await getCounterState(env);
  if (counter.status === 'closed' || counter.remaining <= 0) {
    return jsonResponse({ error: '오늘 체험팩 마감', ...counter }, 410);
  }

  // 8. 저장 페이로드 구성
  //    ★ 민감정보 비수집 정책(대표 결정 2026-07-05): quiz_answer(음주 관련 응답)는
  //      프론트가 보내더라도 저장하지 않는다 → 파이프라인에 민감정보 0건.
  //      BOND §23 별도 동의 요건을 "비수집"으로 충족.
  const nowIso = new Date().toISOString();
  const record = {
    name:             String(body.name).trim(),
    phone:            phone,
    institution_name: String(body.institution_name).trim(),
    address:          body.address ? String(body.address).trim() : null,
    email:            body.email ? String(body.email).trim().toLowerCase() : null,
    quiz_answer:      null,   // 비수집 (민감정보 정책)
    privacy_agreed:   true,
    privacy_agreed_at: nowIso,
    marketing_agreed: !!body.marketing_agreed,
    ref_key:          refKey,
    utm_source:   trim50(body.utm_source),
    utm_medium:   trim50(body.utm_medium),
    utm_campaign: trim50(body.utm_campaign),
    utm_content:  trim50(body.utm_content),
    ip_hash:      ipHash,
    user_agent:   userAgent,
  };

  // 9. Supabase INSERT
  const inserted = await supabaseFetch(env, '/rest/v1/kiss_signups?select=id', 'POST', record);
  if (!inserted || !inserted[0]) {
    return jsonResponse({ error: 'DB insert failed' }, 500);
  }
  const signupId = inserted[0].id;

  // 10. 기관 자동 매칭 (best-effort, 실패해도 신청은 성공)
  ctx_matchInstitution(env, signupId, record);

  // 11. 응답 (카운터 즉시 갱신)
  const updatedCounter = await getCounterState(env);
  return jsonResponse({
    success: true,
    id: signupId,
    counter: updatedCounter,
  });
}

// ─────────────────────────────────────────────
// POST /kiss-diagnosis — 청중 진단 6문항 저장
// ─────────────────────────────────────────────
async function kissDiagnosis(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return jsonResponse({ error: 'Invalid JSON' }, 400);

  // 비식별 조인 키: phone → SHA-256(phone + salt). phone 원본은 저장하지 않음.
  let refKey = null;
  if (body.ref_key) {
    refKey = String(body.ref_key).slice(0, 64);   // 프론트가 이미 산출한 경우
  } else if (body.ref_phone) {
    const p = normalizePhone(body.ref_phone);
    if (p) refKey = await sha256(p + privacySalt(env));
  }

  // q2_channels는 text 컬럼 → 배열이면 콤마 결합
  const q2 = body.q2_channels;
  const q2Text = Array.isArray(q2) ? q2.join(',') : (q2 || null);

  // 실제 kiss_diagnosis 컬럼명(PIXEL 스키마)에 맞춤. 두 키 이름 모두 수용.
  const record = {
    ref_key:       refKey,
    q1_attendance: trim50(body.q1_attendance || body.q1_repeat),
    q2_channels:   q2Text ? String(q2Text).slice(0, 200) : null,
    q2_channels_etc: body.q2_channels_etc ? String(body.q2_channels_etc).trim().slice(0, 100) : null,  // '기타' 자유입력 (PIXEL 7/7)
    q3_public:     trim50(body.q3_public     || body.q3_public_use),
    q4_cjm:        trim50(body.q4_cjm),
    q5_usage:      trim50(body.q5_usage      || body.q5_adoption),
    q6_flywheel:   trim50(body.q6_flywheel),
    utm_source:    trim50(body.utm_source),
    utm_medium:    trim50(body.utm_medium),
    utm_campaign:  trim50(body.utm_campaign),
    utm_content:   trim50(body.utm_content),
  };

  // 빈 응답 가드: q1~q6 모두 비면 저장 안 함(대시보드 카운트 오염 방지)
  const hasAnswer = [record.q1_attendance, record.q2_channels, record.q2_channels_etc, record.q3_public,
    record.q4_cjm, record.q5_usage, record.q6_flywheel].some(v => v !== null && v !== '');
  if (!hasAnswer) return jsonResponse({ error: 'No answers provided' }, 400);

  const inserted = await supabaseFetch(env, '/rest/v1/kiss_diagnosis?select=id', 'POST', record);
  if (!inserted || !inserted[0]) {
    return jsonResponse({ error: 'DB insert failed' }, 500);
  }

  return jsonResponse({ success: true, id: inserted[0].id });
}

// ─────────────────────────────────────────────
// POST /kiss-flywheel — 완료화면 경로 선택(구매의향 신호) 저장
//   choice: 'direct'(직접구매·핫리드) | 'public'(공공경로) | 'inquiry'(보건기관 문의)
// ─────────────────────────────────────────────
async function kissFlywheel(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return jsonResponse({ error: 'Invalid JSON' }, 400);

  const choiceRaw = String(body.choice || '').toLowerCase();
  const ALLOWED = ['direct', 'public', 'inquiry'];
  if (!ALLOWED.includes(choiceRaw)) {
    return jsonResponse({ error: 'Invalid choice' }, 400);
  }

  // 비식별 조인 키 (원본 전화 저장 안 함)
  let refKey = null;
  if (body.ref_key) {
    refKey = String(body.ref_key).slice(0, 64);
  } else if (body.ref_phone) {
    const p = normalizePhone(body.ref_phone);
    if (p) refKey = await sha256(p + privacySalt(env));
  }

  const record = {
    ref_key:      refKey,
    choice:       choiceRaw,
    utm_source:   trim50(body.utm_source),
    utm_medium:   trim50(body.utm_medium),
    utm_campaign: trim50(body.utm_campaign),
    utm_content:  trim50(body.utm_content),
  };

  const inserted = await supabaseFetch(env, '/rest/v1/kiss_flywheel?select=id', 'POST', record);
  if (!inserted || !inserted[0]) {
    return jsonResponse({ error: 'DB insert failed' }, 500);
  }
  return jsonResponse({ success: true, id: inserted[0].id });
}

// ─────────────────────────────────────────────
// POST /alth-lead — alth 공용 랜딩(B2G/B2B) 문의 리드 저장
//   track: 'public'(보건기관) | 'workplace'(사업장). PULSE 전화 후속관리.
//   ※ B2G/B2B 문의 = 연락 동의(privacy_agreed) 기반 → 전화 평문 저장
//     (KISS 대중 신청과 달리 후속 연락이 목적. 민감정보 없음).
// ─────────────────────────────────────────────
const ALTH_TRACKS = ['public', 'workplace'];
const ALTH_MAX = { institution: 200, name: 50, phone: 20, message: 2000, page: 200 };

async function althLead(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return jsonResponse({ error: 'Invalid JSON' }, 400);

  // 1. 필수 검증
  if (!ALTH_TRACKS.includes(String(body.track))) return jsonResponse({ error: 'Invalid track' }, 400);
  for (const f of ['institution', 'name', 'phone']) {
    if (!body[f] || !String(body[f]).trim()) return jsonResponse({ error: `Missing field: ${f}` }, 400);
  }
  if (!body.privacy_agreed) return jsonResponse({ error: '개인정보 동의 필수' }, 400);

  // 2. 길이 제한 (DoS 방어)
  for (const [f, max] of Object.entries(ALTH_MAX)) {
    if (body[f] && String(body[f]).length > max) return jsonResponse({ error: `${f} too long` }, 400);
  }

  // 3. 전화 정규화
  const phone = normalizePhone(body.phone);
  if (!phone) return jsonResponse({ error: 'Invalid phone' }, 400);

  // 4. 감사용 IP 해시
  const ip = request.headers.get('CF-Connecting-IP') || 'noip';
  const ipHash = await sha256(ip + (env.IP_SALT || 'kiss2026'));
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 300);

  // 5. 남용 방지 — fail-OPEN(조회 장애 시 리드 유실 방지, 리드 확보 우선):
  //    ① 동일 IP 10분 10건 초과 → 429 플러딩 차단  ② 동일 전화 10분 내 재접수 → idempotent 성공(하드블록 안 함)
  //    ※ 서비스키 기반 오픈 write이므로 IP 스로틀로 대량 유입 상한을 둔다(kissSubmit 계층 방어 준용).
  try {
    const since10m = new Date(Date.now() - 600000).toISOString();
    const ipRecent = await supabaseFetch(env,
      `/rest/v1/alth_leads?ip_hash=eq.${ipHash}&created_at=gte.${since10m}&select=id`, 'GET');
    if (Array.isArray(ipRecent) && ipRecent.length >= 10) {
      return jsonResponse({ error: '잠시 후 다시 시도해 주세요' }, 429);
    }
    const dupPhone = await supabaseFetch(env,
      `/rest/v1/alth_leads?phone=eq.${encodeURIComponent(phone)}&created_at=gte.${since10m}&select=id&limit=1`, 'GET');
    if (Array.isArray(dupPhone) && dupPhone.length > 0) {
      return jsonResponse({ success: true, id: dupPhone[0].id, duplicate: true });
    }
  } catch (err) {
    // 조회 장애는 리드 유실보다 낫지 않다 → 중복/스로틀 검사만 건너뛰고 저장은 진행(fail-open)
    console.error('alth-lead dedup check failed (fail-open):', err.message);
  }

  // 6. 저장
  const record = {
    track:          String(body.track),
    institution:    String(body.institution).trim(),
    name:           String(body.name).trim(),
    phone:          phone,
    message:        body.message ? String(body.message).trim() : null,
    privacy_agreed: true,
    privacy_agreed_at: new Date().toISOString(),
    page:           body.page ? String(body.page).slice(0, 200) : null,
    utm_source:   trim50(body.utm_source),
    utm_medium:   trim50(body.utm_medium),
    utm_campaign: trim50(body.utm_campaign),
    utm_content:  trim50(body.utm_content),
    ip_hash:      ipHash,
    user_agent:   userAgent,
    status:       'new',
  };

  const inserted = await supabaseFetch(env, '/rest/v1/alth_leads?select=id', 'POST', record);
  if (!inserted || !inserted[0]) return jsonResponse({ error: 'DB insert failed' }, 500);
  const leadId = inserted[0].id;

  // 7. 기관 자동 매칭 (best-effort, 실패해도 접수는 성공)
  await ctx_matchAlthInstitution(env, leadId, record.institution);

  return jsonResponse({ success: true, id: leadId });
}

// alth 리드 기관 자동 매칭 (유일 일치 시에만 연결)
async function ctx_matchAlthInstitution(env, leadId, institutionName) {
  try {
    if (!institutionName || institutionName.length < 3) return;
    const q = encodeURIComponent(`*${likeSafe(institutionName)}*`);
    const insts = await supabaseFetch(env,
      `/rest/v1/institutions?name=ilike.${q}&select=id,name&limit=2`, 'GET');
    if (insts && insts.length === 1) {
      await supabaseFetch(env, `/rest/v1/alth_leads?id=eq.${leadId}`, 'PATCH', {
        matched_institution_id: insts[0].id,
        processed_note: `auto-match: ${insts[0].name}`,
      });
    }
  } catch (err) {
    console.error('matchAlthInstitution error:', err.message);
  }
}

// ─────────────────────────────────────────────
// GET /kiss-counter — 카운터 조회
// ─────────────────────────────────────────────
async function kissCounter(env) {
  const counter = await getCounterState(env);
  return jsonResponse(counter);
}

// ─────────────────────────────────────────────
// 관리자 조회 엔드포인트 — PII(kiss_signups·kiss_diagnosis)는 anon RLS 차단 →
//   시크릿 헤더 X-Admin-Key(= env.ADMIN_KEY) 검증 후 service_role로 조회.
//   ※ ADMIN_KEY 미설정 시 항상 401(fail-closed). 대표: wrangler secret put ADMIN_KEY
// ─────────────────────────────────────────────
function checkAdmin(request, env) {
  const key = request.headers.get('X-Admin-Key');
  return !!(env.ADMIN_KEY && key && key === env.ADMIN_KEY);
}

async function kissAdminList(request, env) {
  if (!checkAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit')) || 500, 1000);
  const rows = await supabaseFetch(env,
    `/rest/v1/kiss_signups?select=*,institutions(name)&order=created_at.desc&limit=${limit}`, 'GET');
  return jsonResponse(rows || []);
}

async function kissAdminDiagnosis(request, env) {
  if (!checkAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit')) || 500, 1000);
  const rows = await supabaseFetch(env,
    `/rest/v1/kiss_diagnosis?select=*&order=created_at.desc&limit=${limit}`, 'GET');
  return jsonResponse(rows || []);
}

// POST /kiss-admin-process — 신청 처리완료 토글 (관리자)
async function kissAdminProcess(request, env) {
  if (!checkAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);
  const body = await request.json().catch(() => null);
  if (!body || body.id === undefined || body.id === null) return jsonResponse({ error: 'Missing id' }, 400);
  const patch = body.processed
    ? { processed: true, processed_at: new Date().toISOString() }
    : { processed: false, processed_at: null };
  await supabaseFetch(env, `/rest/v1/kiss_signups?id=eq.${encodeURIComponent(body.id)}`, 'PATCH', patch);
  return jsonResponse({ success: true });
}

// KST(UTC+9) 오늘 날짜 문자열 (YYYY-MM-DD)
function kstTodayStr() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
// KST 오늘 00:00의 UTC ISO (당일 신청 필터용)
function kstTodayStartUtc() {
  return new Date(kstTodayStr() + 'T00:00:00+09:00').toISOString();
}

// ─────────────────────────────────────────────
// 카운터 상태 조회 — 일별 캡·시딩·리셋 (대표 확정 B안 2026-07-05)
//   "하루 100팩 한정 · 오늘 남은 체험팩 XX개" 손실회피 프레임.
//   매일 자정(KST) 리셋. 일별 시딩(소진 offset)으로 희소성 연출.
// ─────────────────────────────────────────────
async function getCounterState(env) {
  const today = kstTodayStr();
  const todayStart = kstTodayStartUtc();

  const [config, count] = await Promise.all([
    supabaseFetch(env, '/rest/v1/settings?key=eq.kiss_counter&select=value', 'GET'),
    supabaseFetch(env, `/rest/v1/kiss_signups?select=id&created_at=gte.${encodeURIComponent(todayStart)}`, 'GET'),
  ]);

  const cfg = (config && config[0] && config[0].value) || {};
  const cap = cfg.cap_per_day || cfg.max || 100;          // 하루 캡
  const seed = (cfg.seeds && cfg.seeds[today]) || 0;       // 일별 시딩 offset
  const realToday = Array.isArray(count) ? count.length : 0;
  const taken = seed + realToday;                          // 오늘 소진 = 시딩 + 실신청
  const remaining = Math.max(0, cap - taken);
  const isLastDay = !!(cfg.last_day && today === cfg.last_day);

  // 마감임박 상태 (남은 기준): 0 마감 · ≤5 곧마감 · ≤20 마감임박 · else open
  let status = 'open';
  if (cfg.closed || remaining <= 0) status = 'closed';
  else if (remaining <= 5) status = 'ending';
  else if (remaining <= 20) status = 'low';

  return {
    date: today,
    cap,
    taken,
    remaining,
    status,
    is_last_day: isLastDay,
    // 하위호환 (구 필드)
    current: taken,
    max: cap,
  };
}

// ─────────────────────────────────────────────
// 기관 자동 매칭 (fire-and-forget)
// ─────────────────────────────────────────────
async function ctx_matchInstitution(env, signupId, record) {
  try {
    const name = record.institution_name;
    if (!name || name.length < 3) return;

    // 기관명 부분 일치 시도 (LIKE 메타문자 제거)
    const q = encodeURIComponent(`*${likeSafe(name)}*`);
    const insts = await supabaseFetch(env,
      `/rest/v1/institutions?name=ilike.${q}&select=id,name&limit=2`,
      'GET'
    );

    if (insts && insts.length === 1) {
      await supabaseFetch(env,
        `/rest/v1/kiss_signups?id=eq.${signupId}`,
        'PATCH',
        {
          matched_institution_id: insts[0].id,
          processed: true,
          processed_at: new Date().toISOString(),
          processed_note: `auto: ${insts[0].name}`,
        }
      );
    }
  } catch (err) {
    console.error('matchInstitution error:', err.message);
  }
}

// ─────────────────────────────────────────────
// Supabase REST helper
// ─────────────────────────────────────────────
async function supabaseFetch(env, path, method, body) {
  const url = env.SUPABASE_URL + path;
  const headers = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);

  if (!response.ok && response.status >= 400) {
    const text = await response.text();
    console.error(`Supabase ${method} ${path} ${response.status}: ${text}`);
    throw new Error(`Supabase error ${response.status}`);
  }

  if (method === 'GET' || method === 'POST') {
    return await response.json();
  }
  return { status: response.status };
}

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
// LIKE 메타문자(%, _, \) 제거 — ilike 패턴에 사용자 입력 삽입 시 광범위/의도외 매칭 방지
function likeSafe(s) {
  return String(s || '').replace(/[%_\\]/g, '');
}

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  if (digits.length < 9 || digits.length > 11) return null;
  if (digits.length === 11) return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
  return digits;
}

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
