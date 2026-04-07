/**
 * 기관 중복 후보 추출 (#32 D6)
 * 실행: node scripts/find-duplicate-institutions.js
 *
 * 전략:
 * 1. 정규화된 이름이 같은 기관 (공백·특수문자 제거)
 * 2. 정확히 같은 이름이지만 다른 region/district (동명 다른 지역)
 * 3. Levenshtein 거리 1~2 + 같은 region (오타 의심)
 *
 * 출력: cory/D6_중복후보_검토.md
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://rvqkoiqjjhlrgqitnxwt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LhUYFVbX3M_8zbiBzaLgZQ_MSOfc1TU';

async function supaFetch(p) {
  const r = await fetch(`${SUPABASE_URL}${p}`, { headers: { 'apikey': SUPABASE_KEY } });
  return r.json();
}

// 이름 정규화
function normalize(name) {
  if (!name) return '';
  return name
    .replace(/\s+/g, '')
    .replace(/[()（）\[\]【】\-_·•．.,'"]/g, '')
    .replace(/주식회사|주\)|\(주\)|학교법인/g, '')
    .toLowerCase();
}

// Levenshtein 거리
function leven(a, b) {
  if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

async function main() {
  console.log('=== 기관 중복 후보 추출 ===\n');

  // 전체 기관 로드
  let institutions = [];
  let offset = 0;
  while (true) {
    const page = await supaFetch(`/rest/v1/institutions?select=id,name,type,region,district,purchase_amount,purchase_stage,last_purchase_date,consult_count&limit=1000&offset=${offset}`);
    if (!page || page.length === 0) break;
    institutions = institutions.concat(page);
    if (page.length < 1000) break;
    offset += 1000;
  }
  console.log(`총 ${institutions.length}개 기관 로드\n`);

  // 1. 정규화된 이름이 같은 그룹
  const normMap = {};
  for (const inst of institutions) {
    const key = normalize(inst.name);
    if (!key || key.length < 2) continue;
    if (!normMap[key]) normMap[key] = [];
    normMap[key].push(inst);
  }

  const exactDupes = []; // 정확 동명 (정규화 후)
  const sameNameDifferentRegion = []; // 동명 다른지역 (의심 — 진짜 다를 수도)
  const trueDupes = []; // 동명 같은지역 (강력 중복)

  for (const [key, group] of Object.entries(normMap)) {
    if (group.length < 2) continue;

    // 같은 region+district로 그룹핑
    const regionMap = {};
    for (const i of group) {
      const rk = `${i.region || ''}|${i.district || ''}`;
      if (!regionMap[rk]) regionMap[rk] = [];
      regionMap[rk].push(i);
    }

    for (const [rk, regionGroup] of Object.entries(regionMap)) {
      if (regionGroup.length >= 2) {
        trueDupes.push({ key, group: regionGroup, region: rk });
      }
    }

    if (Object.keys(regionMap).length >= 2) {
      sameNameDifferentRegion.push({ key, group });
    }
    exactDupes.push({ key, group });
  }

  // 2. Levenshtein 1 + 같은 region+district+type (엄격한 오타 의심)
  const typoSuspects = [];
  const seen = new Set();
  for (let i = 0; i < institutions.length; i++) {
    for (let j = i + 1; j < institutions.length; j++) {
      const a = institutions[i], b = institutions[j];
      if (!a.name || !b.name) continue;
      if (Math.abs(a.name.length - b.name.length) > 1) continue;
      if (a.region !== b.region) continue;
      if (a.district !== b.district) continue;  // 같은 시군구
      if (a.type !== b.type) continue;  // 같은 유형
      if (a.name.length < 5) continue;  // 짧은 이름은 false positive 多
      // 정규화 후 동일하면 이미 1번에 잡힘
      if (normalize(a.name) === normalize(b.name)) continue;

      const dist = leven(a.name, b.name);
      if (dist === 1) {
        const k = [a.id, b.id].sort().join('-');
        if (seen.has(k)) continue;
        seen.add(k);
        typoSuspects.push({ a, b, dist });
      }
    }
  }

  console.log(`✓ 강력 중복 (정규화 동명 + 동지역): ${trueDupes.length}그룹`);
  console.log(`✓ 동명 다른지역 (검토 필요): ${sameNameDifferentRegion.length}그룹`);
  console.log(`✓ 오타 의심 (Lev 1~2 + 동지역): ${typoSuspects.length}쌍\n`);

  // 마크다운 보고서 생성
  const out = [];
  out.push('---');
  out.push('title: D6 기관 중복 후보 검토');
  out.push('date: 2026-04-06');
  out.push('type: report');
  out.push('agent: PULSE');
  out.push('status: draft');
  out.push('tags: [데이터품질, 중복제거, INBOX#32]');
  out.push('---');
  out.push('');
  out.push('# D6 기관 중복 후보 검토');
  out.push('');
  out.push(`> 자동 추출 결과 (${institutions.length}개 기관 스캔)`);
  out.push('> **대표 검토 후 병합 결정** — 자동 병합 금지');
  out.push('');
  out.push('## 요약');
  out.push('');
  out.push('| 카테고리 | 건수 | 처리 방향 |');
  out.push('|----------|------|----------|');
  out.push(`| 🔴 강력 중복 (동명+동지역) | ${trueDupes.length}그룹 | **즉시 병합 검토** |`);
  out.push(`| 🟡 동명 다른지역 | ${sameNameDifferentRegion.length}그룹 | **개별 확인** (진짜 다를 수도) |`);
  out.push(`| 🟢 오타 의심 (Lev 1~2) | ${typoSuspects.length}쌍 | 이름 통일 검토 |`);
  out.push('');

  // 강력 중복
  out.push('## 🔴 강력 중복 — 즉시 병합 검토');
  out.push('');
  out.push('> 정규화된 이름 동일 + 같은 region/district');
  out.push('> 병합 시 가장 풍부한 데이터를 가진 기관을 master로 선택');
  out.push('');

  if (trueDupes.length === 0) {
    out.push('✅ 강력 중복 없음');
    out.push('');
  } else {
    for (const { key, group, region } of trueDupes) {
      out.push(`### ${group[0].name} (${region.replace('|', ' ')})`);
      out.push('');
      out.push('| ID | 이름 | 유형 | 지역 | 시군구 | 단계 | 납품액 | 상담 | 최근구매 |');
      out.push('|-----|------|------|------|--------|------|--------|------|----------|');
      group.sort((a, b) => (b.purchase_amount || 0) - (a.purchase_amount || 0));
      for (const i of group) {
        out.push(`| ${i.id} | ${i.name} | ${i.type || '-'} | ${i.region || '-'} | ${i.district || '-'} | ${i.purchase_stage || '-'} | ${(i.purchase_amount || 0).toLocaleString()} | ${i.consult_count || 0} | ${i.last_purchase_date || '-'} |`);
      }
      out.push('');
      out.push(`**권장 master**: ID ${group[0].id} (납품액 최대)`);
      out.push('');
    }
  }

  // 동명 다른지역
  out.push('## 🟡 동명 다른지역 — 개별 확인');
  out.push('');
  out.push('> 같은 이름이지만 다른 지역 — 진짜 다른 기관일 수도 있음 (예: 서구보건소는 광주·인천·대전 모두 존재)');
  out.push('');

  if (sameNameDifferentRegion.length === 0) {
    out.push('✅ 동명 다른지역 없음');
    out.push('');
  } else {
    out.push('| 그룹 | 기관 수 | ID 목록 | 지역 분포 |');
    out.push('|------|---------|---------|----------|');
    for (const { key, group } of sameNameDifferentRegion.slice(0, 50)) {
      const regions = [...new Set(group.map(i => `${i.region || '?'} ${i.district || ''}`.trim()))].join(', ');
      const ids = group.map(i => i.id).join(', ');
      out.push(`| ${group[0].name} | ${group.length} | ${ids} | ${regions} |`);
    }
    if (sameNameDifferentRegion.length > 50) {
      out.push(`| ... | ... | ... | (총 ${sameNameDifferentRegion.length}그룹, 상위 50건만 표시) |`);
    }
    out.push('');
  }

  // 오타 의심
  out.push('## 🟢 오타 의심 — Lev 거리 1~2 + 동지역');
  out.push('');
  out.push('> 매우 유사한 이름. 오타 또는 약칭 차이일 가능성');
  out.push('');

  if (typoSuspects.length === 0) {
    out.push('✅ 오타 의심 없음');
    out.push('');
  } else {
    out.push('| ID-A | 이름A | ID-B | 이름B | 거리 | 지역 |');
    out.push('|------|-------|------|-------|------|------|');
    typoSuspects.sort((a, b) => a.dist - b.dist);
    for (const { a, b, dist } of typoSuspects.slice(0, 100)) {
      out.push(`| ${a.id} | ${a.name} | ${b.id} | ${b.name} | ${dist} | ${a.region || '-'} ${a.district || ''} |`);
    }
    if (typoSuspects.length > 100) {
      out.push(`| ... | ... | ... | ... | ... | (총 ${typoSuspects.length}쌍, 상위 100건만) |`);
    }
    out.push('');
  }

  out.push('---');
  out.push('');
  out.push('## 병합 프로토콜');
  out.push('');
  out.push('1. **master 선정**: 납품액 최대 → 상담횟수 최대 → 가장 오래된 ID');
  out.push('2. **데이터 이관**: master의 metadata에 다른 ID 정보 병합 (담당자·연락처·DM이력 등)');
  out.push('3. **참조 무결성**:');
  out.push('   - `consultations.institution_id` → master ID로 UPDATE');
  out.push('   - `orders.institution_id` → master ID로 UPDATE');
  out.push('4. **삭제**: 비-master 기관 DELETE');
  out.push('5. **검증**: 병합 후 master의 purchase_amount·consult_count 재계산');
  out.push('');
  out.push('## 관련 문서');
  out.push('');
  out.push('- [[INBOX]] #32 cory 데이터 품질 개선');
  out.push('- [[scripts/rematch-consultations.js]] — 매칭 로직 (병합 후 재실행 필요)');

  const outPath = path.join(__dirname, '..', 'D6_중복후보_검토.md');
  fs.writeFileSync(outPath, out.join('\n'), 'utf8');
  console.log(`📄 보고서 생성: ${outPath}`);
  console.log(`\n=== 처리 권장 ===`);
  console.log(`1. ${outPath} 검토`);
  console.log(`2. 강력 중복 ${trueDupes.length}그룹 우선 병합`);
  console.log(`3. 동명 다른지역 ${sameNameDifferentRegion.length}그룹 개별 확인`);
}

main().catch(console.error);
