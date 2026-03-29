/**
 * 미매칭 주문 자동 소급 매칭
 * 실행: node scripts/rematch-orders.js
 */

const SUPABASE_URL = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU';

async function supaFetch(path, method, body) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}${path}`, options);
  if (method === 'GET') return res.json();
  return { status: res.status };
}

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
const PERSONAL_NAME_RE = /^[가-힣]{2,4}$/;
const BLACKLIST_KEYWORDS = ['클라우드리뷰', '체험단', '리뷰어', '블로거'];

function isValidInstitution(name) {
  if (!name || name.length < 2) return false;
  if (BLACKLIST_KEYWORDS.some(b => name.includes(b))) return false;
  if (PERSONAL_NAME_RE.test(name)) return false;
  if (INST_SUFFIX_RE.test(name)) return true;
  if (name.length >= 6) return true;
  return false;
}

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

function normalizeInstName(raw) {
  if (!raw) return '';
  const tokens = raw.trim().split(/\s+/);
  if (tokens.length >= 2 && tokens[0] === tokens[1]) return tokens[0];
  // 공백+부가정보 제거: "현대자동차 울산공장" → "현대자동차"
  const sm = raw.match(/^(.+?)\s+\S*(기지본부|지사|지점|공장|사업부|사업소|본부|지부|사무소|연구소|연구원|부서|팀)$/);
  if (sm) return sm[1];
  return raw.trim();
}

// 주소에서 광역시/도 추출
function extractRegion(addr) {
  if (!addr) return '';
  const m = addr.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
  return m ? m[1] : '';
}

// region 필드 매핑
const REGION_MAP = {
  '서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시', '인천': '인천광역시',
  '광주': '광주광역시', '대전': '대전광역시', '울산': '울산광역시', '세종': '세종특별자치시',
  '경기': '경기도', '강원': '강원특별자치도', '충북': '충청북도', '충남': '충청남도',
  '전북': '전북특별자치도', '전남': '전라남도', '경북': '경상북도', '경남': '경상남도', '제주': '제주특별자치도'
};

async function main() {
  console.log('기관 목록 로드 중...');
  let institutions = [];
  let instOffset = 0;
  while (true) {
    const page = await supaFetch(`/rest/v1/institutions?select=id,name,region&limit=1000&offset=${instOffset}`, 'GET');
    if (!page || page.length === 0) break;
    institutions = institutions.concat(page);
    if (page.length < 1000) break;
    instOffset += 1000;
  }
  console.log(`기관 ${institutions.length}건 로드 완료`);

  // 미매칭 주문 전체 로드 (페이지네이션)
  let allOrders = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const page = await supaFetch(
      `/rest/v1/orders?matched=eq.false&select=id,option_user,addr&limit=${pageSize}&offset=${offset}`,
      'GET'
    );
    if (!page || page.length === 0) break;
    allOrders = allOrders.concat(page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  console.log(`미매칭 주문 ${allOrders.length}건`);

  let matched = 0, skipped = 0;

  for (const order of allOrders) {
    const rawName = parseInstName(order.option_user || '');
    const normalized = normalizeInstName(rawName);
    let institutionId = null;

    // [1·2순위] 유효 기관명이면 이름 매칭
    if (isValidInstitution(rawName)) {
      const h1 = institutions.filter(i =>
        i.name.length >= 4 && (i.name === rawName || i.name.includes(rawName) || rawName.includes(i.name))
      );
      if (h1.length === 1) institutionId = h1[0].id;

      if (!institutionId && normalized !== rawName) {
        const h2 = institutions.filter(i =>
          i.name.length >= 4 && (i.name === normalized || i.name.includes(normalized) || normalized.includes(i.name))
        );
        if (h2.length === 1) institutionId = h2[0].id;
      }
    }

    // [3순위] 주소 역추적 (지역 필터 포함)
    if (!institutionId && order.addr) {
      const addrShort = extractRegion(order.addr);
      const addrFull = REGION_MAP[addrShort] || '';
      const candidates = institutions.filter(i => i.name.length >= 4 && order.addr.includes(i.name));
      if (candidates.length === 1) {
        institutionId = candidates[0].id;
      } else if (candidates.length > 1 && addrFull) {
        const regional = candidates.filter(i => (i.region || '').startsWith(addrFull));
        if (regional.length === 1) institutionId = regional[0].id;
      }
    }

    if (institutionId) {
      await supaFetch(
        `/rest/v1/orders?id=eq.${order.id}`,
        'PATCH',
        { institution_id: institutionId, matched: true }
      );
      matched++;
      if (matched % 50 === 0) console.log(`  진행 중: ${matched}건 매칭 완료...`);
    } else {
      skipped++;
    }
  }

  console.log(`\n완료: 매칭 ${matched}건 / 미매칭 ${skipped}건`);
}

main().catch(console.error);
