/**
 * 미매칭 상담 자동 매칭 + 중복 제거 + 줄임말 사전
 * 실행: node scripts/rematch-consultations.js
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

// ─── 줄임말 사전 ───
const ABBREVIATIONS = {
  '성동고당': '성동구고혈압당뇨병등록교육센터',
  '일터정신': '일터정신건강증진학회',
  '부산중독': '부산중독관리통합지원센터',
  '대구중독': '대구중독관리통합지원센터',
  '인천중독': '인천중독관리통합지원센터',
  '광주중독': '광주중독관리통합지원센터',
  '대전중독': '대전중독관리통합지원센터',
  '울산중독': '울산중독관리통합지원센터',
  '전주중독': '전주시중독관리통합지원센터',
  '세종문화': '세종문화회관',
  '장흥정신': '장흥군정신건강복지센터',
  '경남정신': '경상남도광역정신건강복지센터',
};

// 구/군 → 보건소 자동 추론 패턴
const GU_TO_BOGUNSO_RE = /^(강남|강동|강북|강서|관악|광진|구로|금천|노원|도봉|동대문|동작|마포|서대문|서초|성동|성북|송파|양천|영등포|용산|은평|종로|중|중랑|연수|남동|부평|계양|미추홀|서|동|남|북|수영|사하|사상|해운대|부산진|금정|연제|동래|기장|수성|달서|달성|중|남|유성|대덕|서|동|광산|울주|덕양|일산동|일산서|수정|중원|분당|처인|기흥|수지|장안|권선|팔달|영통|상당|서원|흥덕|청원|동남|서북|완산|덕진|상록|단원)구$/;

// 시군 → 보건소 추론
const SIGUN_TO_BOGUNSO_RE = /^(춘천|원주|강릉|동해|태백|속초|삼척|홍천|횡성|영월|평창|정선|철원|화천|양구|인제|고성|양양|수원|성남|의정부|안양|부천|광명|평택|동두천|안산|고양|과천|구리|남양주|오산|시흥|군포|의왕|하남|용인|파주|이천|안성|김포|화성|광주|양주|포천|여주|연천|가평|양평|청주|충주|제천|보은|옥천|영동|증평|진천|괴산|음성|단양|천안|공주|보령|아산|서산|논산|계룡|당진|금산|부여|서천|청양|홍성|예산|태안|전주|군산|익산|정읍|남원|김제|완주|진안|무주|장수|임실|순창|고창|부안|목포|여수|순천|나주|광양|담양|곡성|구례|고흥|보성|화순|장흥|강진|해남|영암|무안|함평|영광|장성|완도|진도|신안|포항|경주|김천|안동|구미|영주|영천|상주|문경|경산|군위|의성|청송|영양|영덕|청도|고령|성주|칠곡|예천|봉화|울진|울릉|창원|진주|통영|사천|김해|밀양|거제|양산|의령|함안|창녕|고성|남해|하동|산청|함양|거창|합천|제주|서귀포)(시|군)$/;

function expandAbbreviations(text) {
  let expanded = text;
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    if (expanded.includes(abbr)) {
      expanded = expanded.replace(abbr, full);
    }
  }
  return expanded;
}

function inferBogunso(text) {
  // "동대문구" → "동대문구보건소" 추론
  const guMatch = text.match(/([가-힣]+구)\s/);
  if (guMatch && GU_TO_BOGUNSO_RE.test(guMatch[1])) {
    return guMatch[1] + '보건소';
  }
  const sigunMatch = text.match(/([가-힣]+(?:시|군))\s/);
  if (sigunMatch && SIGUN_TO_BOGUNSO_RE.test(sigunMatch[1])) {
    return sigunMatch[1] + '보건소';
  }
  return null;
}

async function main() {
  // ═══ STEP 1: 중복 제거 ═══
  console.log('=== STEP 1: 중복 제거 ===');
  let allConsults = [];
  let offset = 0;
  while (true) {
    const page = await supaFetch(
      `/rest/v1/consultations?select=id,date,content&order=id.asc&limit=1000&offset=${offset}`, 'GET'
    );
    if (!page || page.length === 0) break;
    allConsults = allConsults.concat(page);
    if (page.length < 1000) break;
    offset += 1000;
  }

  const seen = {};
  const dupeIds = [];
  for (const c of allConsults) {
    const key = (c.date || '') + '|' + (c.content || '').substring(0, 80);
    if (seen[key]) {
      dupeIds.push(c.id);
    } else {
      seen[key] = c.id;
    }
  }

  if (dupeIds.length > 0) {
    // 50건씩 배치 삭제
    for (let i = 0; i < dupeIds.length; i += 50) {
      const batch = dupeIds.slice(i, i + 50);
      const ids = batch.join(',');
      await supaFetch(`/rest/v1/consultations?id=in.(${ids})`, 'DELETE');
    }
    console.log(`중복 ${dupeIds.length}건 삭제 완료`);
  } else {
    console.log('중복 없음');
  }

  // ═══ STEP 2: 기관 로드 ═══
  console.log('\n=== STEP 2: 기관 매칭 ===');
  let institutions = [];
  offset = 0;
  while (true) {
    const page = await supaFetch(`/rest/v1/institutions?select=id,name&limit=1000&offset=${offset}`, 'GET');
    if (!page || page.length === 0) break;
    institutions = institutions.concat(page);
    if (page.length < 1000) break;
    offset += 1000;
  }
  console.log(`기관 ${institutions.length}건 로드`);

  // 이름→ID 맵 (공백 제거 버전도)
  const nameMap = {};
  const noSpaceMap = {};
  for (const inst of institutions) {
    nameMap[inst.name] = inst.id;
    noSpaceMap[inst.name.replace(/\s/g, '')] = inst.id;
  }

  // 정렬: 긴 이름 우선
  const sortedInsts = [...institutions].sort((a, b) => b.name.length - a.name.length);

  // ═══ STEP 3: 미매칭 상담 매칭 ═══
  let unmatched = [];
  offset = 0;
  while (true) {
    const page = await supaFetch(
      `/rest/v1/consultations?matched=eq.false&select=id,content,tags&limit=1000&offset=${offset}`, 'GET'
    );
    if (!page || page.length === 0) break;
    unmatched = unmatched.concat(page);
    if (page.length < 1000) break;
    offset += 1000;
  }
  console.log(`미매칭 상담 ${unmatched.length}건\n`);

  let matched = 0, skipped = 0;
  const newInstitutions = {}; // 미등록 기관 감지

  for (const c of unmatched) {
    const rawText = (c.content || '') + ' ' + ((c.tags || []).join(' '));
    if (!rawText.trim()) { skipped++; continue; }

    // 줄임말 확장
    const text = expandAbbreviations(rawText);
    const textNoSpace = text.replace(/\s/g, '');

    let matchedId = null;

    // [매칭 1] 정확 매칭 (긴 이름 우선)
    for (const inst of sortedInsts) {
      if (inst.name.length < 3) continue;
      if (text.includes(inst.name) || textNoSpace.includes(inst.name.replace(/\s/g, ''))) {
        matchedId = inst.id;
        break;
      }
    }

    // [매칭 2] 구/시군 → 보건소 추론
    if (!matchedId) {
      const inferred = inferBogunso(text + ' ');
      if (inferred && nameMap[inferred]) {
        matchedId = nameMap[inferred];
      }
    }

    // [매칭 3] 공백 제거 후 부분 매칭
    if (!matchedId) {
      for (const inst of sortedInsts) {
        if (inst.name.length < 4) continue;
        const instNoSpace = inst.name.replace(/\s/g, '');
        if (textNoSpace.includes(instNoSpace)) {
          matchedId = inst.id;
          break;
        }
      }
    }

    if (matchedId) {
      await supaFetch(
        `/rest/v1/consultations?id=eq.${c.id}`,
        'PATCH',
        { institution_id: matchedId, matched: true }
      );
      matched++;
      if (matched % 20 === 0) console.log(`  매칭 진행: ${matched}건...`);
    } else {
      skipped++;
      // 기관명 후보 추출 (태그 내 기관명 패턴)
      const instPattern = rawText.match(/(?:^|\s|[\[,])([가-힣]{2,}(?:보건소|센터|대학교|대학|학교|병원|의원|공사|공단|재단|협회|학회|제약|건설))/);
      if (instPattern) {
        const name = instPattern[1];
        newInstitutions[name] = (newInstitutions[name] || 0) + 1;
      }
    }
  }

  console.log(`\n=== 결과 ===`);
  console.log(`중복 삭제: ${dupeIds.length}건`);
  console.log(`매칭 완료: ${matched}건`);
  console.log(`미매칭 잔여: ${skipped}건`);

  if (Object.keys(newInstitutions).length > 0) {
    console.log(`\n=== 미등록 기관 후보 (DB에 없음) ===`);
    const sorted = Object.entries(newInstitutions).sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sorted.slice(0, 20)) {
      console.log(`  ${count}건  ${name}`);
    }
  }

  // ═══ STEP 4: 미등록 기관 자동 등록 (#30 SAGE 승인 2026-04-01) ═══
  if (Object.keys(newInstitutions).length > 0) {
    console.log(`\n=== STEP 4: 미등록 기관 자동 등록 ===`);
    const SYSTEM_NAMES = ['root', 'key9039', 'iron96', 'adot', '테스트기관', 'admin', 'test'];
    const registered = [];

    for (const [name] of Object.entries(newInstitutions)) {
      if (SYSTEM_NAMES.includes(name) || name.length < 3) continue;
      // 이미 등록됐는지 재확인
      if (nameMap[name]) continue;

      const type = inferInstitutionType(name);
      const region = '미분류';

      const newInst = {
        name,
        type,
        region,
        purchase_stage: '관심',
        sourced_by: 'consult_discovery',
        metadata: { needs_wcolive_check: true, auto_registered: new Date().toISOString() }
      };

      const res = await supaFetch('/rest/v1/institutions', 'POST', newInst);
      if (res.status === 201) {
        registered.push({ name, type });
        // nameMap 갱신 (후속 매칭용)
        const created = await supaFetch(`/rest/v1/institutions?name=eq.${encodeURIComponent(name)}&select=id,name`, 'GET');
        if (created && created.length > 0) {
          nameMap[name] = created[0].id;
          noSpaceMap[name.replace(/\s/g, '')] = created[0].id;
        }
      }
    }

    if (registered.length > 0) {
      console.log(`✅ 자동 등록 ${registered.length}건:`);
      for (const r of registered) {
        console.log(`  ${r.name} (${r.type})`);
      }

      // 등록된 기관에 대해 미매칭 상담 재매칭 시도
      console.log('\n=== STEP 5: 신규 등록 기관 재매칭 ===');
      let rematched = 0;
      const stillUnmatched = await supaFetch(
        '/rest/v1/consultations?matched=eq.false&select=id,content,tags&limit=1000', 'GET'
      );
      for (const c of (stillUnmatched || [])) {
        const rawText = (c.content || '') + ' ' + ((c.tags || []).join(' '));
        const text = expandAbbreviations(rawText);
        for (const r of registered) {
          if (text.includes(r.name)) {
            const instId = nameMap[r.name];
            if (instId) {
              await supaFetch(`/rest/v1/consultations?id=eq.${c.id}`, 'PATCH', { institution_id: instId, matched: true });
              rematched++;
              break;
            }
          }
        }
      }
      console.log(`재매칭: ${rematched}건`);
    } else {
      console.log('자동 등록 대상 없음');
    }
  }
}

// 기관명 suffix 기반 type 추론 (M2)
function inferInstitutionType(name) {
  if (/보건소$/.test(name)) return '보건소';
  if (/중독관리|정신건강|알코올/.test(name)) return '전문기관';
  if (/금연지원센터/.test(name)) return '금연지원센터';
  if (/대학교|대학$/.test(name)) return '교육기관';
  if (/초등학교|중학교|고등학교|중고$/.test(name)) return '초중고';
  if (/병원$|의원$/.test(name)) return '군/경/소방';
  if (/공단|공사$/.test(name)) return '공공기관(기타)';
  if (/학회|협회|재단/.test(name)) return '강사·대행사';
  if (/건설|제약|기업|주식회사/.test(name)) return '사업장';
  return '미분류';
}

main().catch(console.error);
