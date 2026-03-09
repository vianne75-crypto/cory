// ============================================
// HC (대학보건관리자) Google Sheet ↔ Supabase 동기화
// ============================================

const HC_SHEET_ID = '1wdfX6X_PcKKwQBiD3x2uungtqyyMhsewsX0buOAHst4';
const HC_SHEET_GID = '1088038092';
const HC_WORKER_URL = 'https://aps-webhook.vianne75.workers.dev';

const HC_REGION_MAP = {
  '서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시',
  '인천': '인천광역시', '광주': '광주광역시', '대전': '대전광역시',
  '울산': '울산광역시', '세종': '세종특별자치시', '경기': '경기도',
  '강원': '강원특별자치도', '충북': '충청북도', '충남': '충청남도',
  '전북': '전북특별자치도', '전남': '전라남도', '경북': '경상북도',
  '경남': '경상남도', '제주': '제주특별자치도',
};

const STAGE_PRIORITY = { '인지': 0, '관심': 1, '고려': 2, '구매': 3, '만족': 4, '추천': 5 };

// ─── CSV 파싱 ───

function hcParseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  const headers = hcParseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = hcParseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function hcParseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── 주소에서 시군구 추출 ───
function hcParseDistrict(addr) {
  if (!addr) return null;
  const parts = addr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const d = parts[1];
    if (d.endsWith('시') || d.endsWith('군') || d.endsWith('구')) return d;
  }
  return null;
}

// ─── Google Sheet CSV 가져오기 (Worker 프록시 경유) ───
async function fetchHcSheetCSV(gid) {
  const targetGid = gid || HC_SHEET_GID;
  const url = `${HC_WORKER_URL}/fetch-sheet?id=${HC_SHEET_ID}&gid=${targetGid}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`시트 가져오기 실패 (${resp.status}): ${errText}`);
  }
  return await resp.text();
}

// ─── 시트 행 → institution 레코드 변환 ───
function transformHcRow(row) {
  const name = (row['학교명'] || '').trim();
  if (!name) return null;

  const regionShort = (row['소재지역'] || '').trim();
  const region = HC_REGION_MAP[regionShort] || '';
  const addr = (row['주소'] || '').trim();
  const district = hcParseDistrict(addr);

  const hasPurchase = (row['알쓰패치구매이력'] || '').trim() === 'Y';
  const totalQty = parseInt(row['총구매수량'] || '0') || 0;
  const purchaseStage = (hasPurchase && totalQty > 0) ? '구매' : '관심';

  return {
    name,
    type: '대학보건관리자',
    region,
    district,
    purchase_stage: purchaseStage,
    purchase_amount: hasPurchase ? totalQty * 800 : 0,
    purchase_volume: totalQty,
    products: hasPurchase ? ['알쓰패치'] : [],
    last_purchase_date: (row['최근구매일'] || '').trim() || '-',
    metadata: {
      school_type: row['학교유형'] || '',
      category: row['구분'] || '',
      target_dept: row['타겟부서'] || '',
      proposal_point: row['제안포인트'] || '',
      contact_name: row['담당자명'] || '',
      contact_phone: row['건강센터연락처'] || '',
      recipient: row['수신자'] || '',
      utm_code: row['UTM고유번호'] || '',
      website: row['추출url'] || '',
      postal_code: row['우편번호'] || '',
      address: addr,
      address2: row['주소2'] || '',
      dm_sent: row['DM발송여부'] || '',
      dm_target: row['DM발송대상'] || '',
      priority: row['우선순위'] || '',
      note: row['비고'] || '',
    }
  };
}

// ─── HC 동기화 메인 ───
async function syncHcInstitutions() {
  const log = document.getElementById('hcSyncLog');
  if (log) log.textContent = '';
  hcLog('HC 동기화 시작...');

  try {
    // 1. Google Sheet CSV 가져오기
    hcLog('Google Sheet 데이터 가져오는 중...');
    const csvText = await fetchHcSheetCSV();
    const rows = hcParseCSV(csvText);
    hcLog(`시트 로드 완료: ${rows.length}건`);

    // 2. DM 발송대상 필터
    const dmTargets = rows.filter(r => (r['DM발송대상'] || '').trim() === 'Y');
    hcLog(`DM 발송대상: ${dmTargets.length}건`);

    // 3. 변환
    const newRecords = dmTargets.map(transformHcRow).filter(Boolean);
    hcLog(`변환 완료: ${newRecords.length}건`);

    // 4. 기존 HC 기관 로드
    const { data: existing, error: fetchErr } = await supabase
      .from('institutions')
      .select('id, name, purchase_stage, purchase_amount, purchase_volume, metadata')
      .eq('type', '대학보건관리자');

    if (fetchErr) throw new Error(`기존 데이터 조회 실패: ${fetchErr.message}`);

    const existingMap = {};
    (existing || []).forEach(inst => { existingMap[inst.name] = inst; });
    hcLog(`기존 HC 기관: ${existing?.length || 0}건`);

    // 5. 분류: 신규 / 업데이트 / 변경없음
    const toInsert = [];
    const toUpdate = [];
    let unchanged = 0;

    for (const rec of newRecords) {
      const ex = existingMap[rec.name];
      if (!ex) {
        toInsert.push(rec);
      } else {
        const changes = {};
        if (rec.region && rec.region !== ex.region) changes.region = rec.region;
        if (rec.district && rec.district !== ex.district) changes.district = rec.district;

        // 구매 정보: 상위 방향으로만
        const curP = STAGE_PRIORITY[ex.purchase_stage || '인지'] || 0;
        const newP = STAGE_PRIORITY[rec.purchase_stage] || 0;
        if (newP > curP) changes.purchase_stage = rec.purchase_stage;
        if ((rec.purchase_amount || 0) > (ex.purchase_amount || 0)) changes.purchase_amount = rec.purchase_amount;
        if ((rec.purchase_volume || 0) > (ex.purchase_volume || 0)) changes.purchase_volume = rec.purchase_volume;
        if (rec.products.length > 0) changes.products = rec.products;
        if (rec.last_purchase_date && rec.last_purchase_date !== '-') changes.last_purchase_date = rec.last_purchase_date;

        // metadata: 항상 머지 (시트가 최신)
        changes.metadata = { ...(ex.metadata || {}), ...rec.metadata };

        // metadata 외에도 변경사항이 있는지 체크
        const hasRealChanges = Object.keys(changes).some(k => k !== 'metadata');
        const metadataChanged = JSON.stringify(changes.metadata) !== JSON.stringify(ex.metadata || {});

        if (hasRealChanges || metadataChanged) {
          toUpdate.push({ id: ex.id, ...changes });
        } else {
          unchanged++;
        }
      }
    }

    hcLog(`분류: 신규 ${toInsert.length}건, 업데이트 ${toUpdate.length}건, 변경없음 ${unchanged}건`);

    // 6. 삽입
    let insertedCount = 0;
    if (toInsert.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error: insErr } = await supabase.from('institutions').insert(batch);
        if (insErr) {
          hcLog(`삽입 오류 (배치 ${Math.floor(i / batchSize) + 1}): ${insErr.message}`, 'error');
        } else {
          insertedCount += batch.length;
          hcLog(`삽입: ${batch.length}건`);
        }
      }
    }

    // 7. 업데이트
    let updatedCount = 0;
    for (const upd of toUpdate) {
      const id = upd.id;
      delete upd.id;
      const { error: updErr } = await supabase.from('institutions').update(upd).eq('id', id);
      if (updErr) {
        hcLog(`업데이트 오류 (ID:${id}): ${updErr.message}`, 'error');
      } else {
        updatedCount++;
      }
    }

    // 8. 마지막 동기화 시간 저장
    await supabase.from('settings').upsert({
      key: 'hc_last_sync',
      value: {
        time: new Date().toISOString(),
        inserted: insertedCount,
        updated: updatedCount,
        total: newRecords.length,
        source: 'admin'
      }
    });

    hcLog(`동기화 완료: 신규 ${insertedCount}건, 업데이트 ${updatedCount}건, 변경없음 ${unchanged}건`, 'success');
    await loadHcSyncStats();
    if (typeof loadInstitutions === 'function') loadInstitutions();

  } catch (err) {
    hcLog(`오류: ${err.message}`, 'error');
  }
}

// ─── 별도 탭 동기화 (QR스캔/샘플신청) ───
async function syncHcResponseTab(gid, tabName) {
  hcLog(`${tabName} 탭 동기화 시작...`);

  try {
    const csvText = await fetchHcSheetCSV(gid);
    const rows = hcParseCSV(csvText);
    hcLog(`${tabName}: ${rows.length}건 로드`);

    if (rows.length === 0) {
      hcLog(`${tabName}: 데이터 없음`);
      return;
    }

    // UTM코드 또는 학교명으로 기관 매칭 → purchase_stage 업데이트
    const { data: hcInsts } = await supabase
      .from('institutions')
      .select('id, name, purchase_stage, metadata')
      .eq('type', '대학보건관리자');

    // UTM코드 → 기관 맵
    const utmMap = {};
    const nameMap = {};
    (hcInsts || []).forEach(inst => {
      nameMap[inst.name] = inst;
      const utm = inst.metadata?.utm_code;
      if (utm) utmMap[utm] = inst;
    });

    let updatedCount = 0;
    for (const row of rows) {
      // UTM코드 또는 학교명으로 매칭
      const utm = (row['UTM고유번호'] || row['UTM코드'] || row['utm'] || '').trim();
      const schoolName = (row['학교명'] || row['기관명'] || '').trim();

      const inst = (utm && utmMap[utm]) || (schoolName && nameMap[schoolName]);
      if (!inst) continue;

      // 단계 결정: QR스캔 → 고려, 샘플신청 → 고려
      const actionType = (row['유형'] || row['액션'] || tabName || '').trim();
      let newStage = '고려';
      if (actionType.includes('구매') || actionType.includes('주문')) newStage = '구매';

      const curP = STAGE_PRIORITY[inst.purchase_stage || '인지'] || 0;
      const newP = STAGE_PRIORITY[newStage] || 0;

      if (newP > curP) {
        const { error } = await supabase
          .from('institutions')
          .update({ purchase_stage: newStage })
          .eq('id', inst.id);
        if (!error) updatedCount++;
      }
    }

    hcLog(`${tabName}: ${updatedCount}건 단계 업데이트`, 'success');
  } catch (err) {
    hcLog(`${tabName} 오류: ${err.message}`, 'error');
  }
}

// ─── UI ───

function showHcSyncPanel() {
  const panel = document.getElementById('hcSyncPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display !== 'none') loadHcSyncStats();
}

function hcLog(msg, type = '') {
  const log = document.getElementById('hcSyncLog');
  if (!log) { console.log('[HC]', msg); return; }
  const prefix = type === 'error' ? '[오류] ' : type === 'success' ? '[완료] ' : '> ';
  log.textContent += prefix + msg + '\n';
  log.scrollTop = log.scrollHeight;
}

async function loadHcSyncStats() {
  const statsEl = document.getElementById('hcSyncStats');
  if (!statsEl) return;

  try {
    const { data: syncInfo } = await supabase
      .from('settings').select('value').eq('key', 'hc_last_sync').single();
    const lastSync = syncInfo?.value?.time
      ? new Date(syncInfo.value.time).toLocaleString('ko-KR')
      : '-';
    const lastSource = syncInfo?.value?.source || '-';

    const { count: hcCount } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true })
      .eq('type', '대학보건관리자');

    const { count: purchaseCount } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true })
      .eq('type', '대학보건관리자')
      .eq('purchase_stage', '구매');

    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-num">${hcCount || 0}</div><div class="stat-label">HC 기관 수</div></div>
      <div class="stat-card"><div class="stat-num">${purchaseCount || 0}</div><div class="stat-label">구매 기관</div></div>
      <div class="stat-card"><div class="stat-num">${lastSync}</div><div class="stat-label">마지막 동기화 (${lastSource})</div></div>
    `;
  } catch (err) {
    statsEl.innerHTML = `<div class="stat-card"><div class="stat-label">통계 로드 실패</div></div>`;
  }
}

// ─── 별도 탭 GID 설정 관리 ───

async function showHcTabConfig() {
  const area = document.getElementById('hcTabConfigArea');
  if (!area) return;
  area.style.display = area.style.display === 'none' ? 'block' : 'none';

  // 현재 설정 로드
  const { data } = await supabase.from('settings').select('value').eq('key', 'hc_tab_config').single();
  const config = data?.value || { qr_gid: '', sample_gid: '' };

  area.innerHTML = `
    <div style="margin:8px 0;">
      <label style="display:block;margin-bottom:4px;font-size:0.82rem;">QR스캔 탭 GID:</label>
      <input type="text" id="hcQrGid" class="filter-input" value="${config.qr_gid || ''}"
        placeholder="예: 123456789" style="width:200px;">
    </div>
    <div style="margin:8px 0;">
      <label style="display:block;margin-bottom:4px;font-size:0.82rem;">샘플신청 탭 GID:</label>
      <input type="text" id="hcSampleGid" class="filter-input" value="${config.sample_gid || ''}"
        placeholder="예: 987654321" style="width:200px;">
    </div>
    <button class="btn btn-sm btn-primary" onclick="saveHcTabConfig()">저장</button>
    <p class="upload-hint" style="margin-top:8px;">
      Google Sheet URL에서 gid= 뒤의 숫자가 탭 GID입니다.<br>
      예: ...edit?gid=<strong>1088038092</strong>#gid=1088038092
    </p>
  `;
}

async function saveHcTabConfig() {
  const qrGid = document.getElementById('hcQrGid')?.value?.trim() || '';
  const sampleGid = document.getElementById('hcSampleGid')?.value?.trim() || '';

  await supabase.from('settings').upsert({
    key: 'hc_tab_config',
    value: { qr_gid: qrGid, sample_gid: sampleGid }
  });

  hcLog('탭 GID 설정 저장 완료', 'success');
}

// ─── 전체 동기화 (메인 + QR + 샘플) ───
async function syncHcAll() {
  // 1. 메인 HC 데이터 동기화
  await syncHcInstitutions();

  // 2. QR/샘플 탭 동기화 (설정된 경우)
  const { data } = await supabase.from('settings').select('value').eq('key', 'hc_tab_config').single();
  const config = data?.value || {};

  if (config.qr_gid) {
    await syncHcResponseTab(config.qr_gid, 'QR스캔');
  }
  if (config.sample_gid) {
    await syncHcResponseTab(config.sample_gid, '샘플신청');
  }

  hcLog('전체 동기화 완료', 'success');
}
