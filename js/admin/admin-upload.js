// ============================================
// 데이터 업로드 (Excel / CSV / Google Sheets → Supabase)
// ============================================

// 파싱된 데이터 임시 저장
let parsedOrderData = [];
let parsedConsultData = [];
let parsedGsheetsData = [];
let parsedInstBulkData = [];

// ─── 공통 유틸 ───

function uploadLog(msg, type = '') {
  const log = document.getElementById('uploadLog');
  log.classList.add('visible');
  const span = type ? `<span class="log-${type}">${msg}</span>` : msg;
  log.innerHTML += span + '\n';
  log.scrollTop = log.scrollHeight;
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
}

// 엑셀 파일 → JSON 배열
async function parseExcelFile(file) {
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

// CSV 파일 → 행 배열 (멀티라인 고려)
function parseCSVText(text) {
  const lines = text.split('\n');
  const records = [];
  let currentRecord = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2}),/);
    if (dateMatch) {
      if (currentRecord) records.push(currentRecord);
      const parts = csvLineParse(line);
      const tags = (parts[1] || '').split('/').map(t => t.replace(/[\[\]]/g, '').trim()).filter(Boolean);
      currentRecord = {
        date: parts[0] || null,
        tags: tags,
        raw_institution_name: (parts[2] || '').trim() || null,
        content: (parts[3] || '').trim(),
        md_name: (parts[4] || '').trim() || null
      };
    } else if (currentRecord) {
      currentRecord.content += '\n' + line;
    }
  }
  if (currentRecord) records.push(currentRecord);
  return records;
}

function csvLineParse(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += ch;
  }
  result.push(current);
  return result;
}

// 프리뷰 테이블 생성
function makePreviewTable(rows, maxRows = 5) {
  if (!rows || rows.length === 0) return '<p style="color:#888">데이터 없음</p>';
  const keys = Object.keys(rows[0]);
  const displayRows = rows.slice(0, maxRows);
  let html = `<p style="font-size:0.82rem;color:#555;margin-bottom:6px;">총 <strong>${rows.length}</strong>행 (처음 ${maxRows}행 미리보기)</p>`;
  html += '<div style="overflow-x:auto"><table class="preview-table"><thead><tr>';
  keys.forEach(k => { html += `<th>${k}</th>`; });
  html += '</tr></thead><tbody>';
  displayRows.forEach(row => {
    html += '<tr>';
    keys.forEach(k => {
      let v = row[k];
      if (typeof v === 'string' && v.length > 40) v = v.substring(0, 40) + '...';
      html += `<td>${v ?? ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

// ─── 주소 → 지역 매핑 (sync.js 로직 재사용) ───

const UPLOAD_REGION_MAP = {
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

function uploadParseAddress(addr) {
  if (!addr || !addr.trim()) return { region: null, district: null };
  const parts = addr.trim().split(/\s+/);
  let region = UPLOAD_REGION_MAP[parts[0]] || null;
  if (!region) {
    for (const [key, val] of Object.entries(UPLOAD_REGION_MAP)) {
      if (parts[0].startsWith(key)) { region = val; break; }
    }
  }
  if (!region) return { region: null, district: null };
  let district = null;
  if (parts.length > 1) {
    if (parts[1].endsWith('시') || parts[1].endsWith('군') || parts[1].endsWith('구')) {
      district = parts[1];
    }
  }
  return { region, district };
}

// 상품명 감지
function uploadDetectProducts(goodsName) {
  if (!goodsName) return ['알쓰패치'];
  const products = [];
  if (goodsName.includes('알쓰') || goodsName.includes('음주') || goodsName.includes('절주')) products.push('알쓰패치');
  if (goodsName.includes('노담') || goodsName.includes('금연') || goodsName.includes('흡연')) products.push('노담패치');
  return products.length > 0 ? products : ['알쓰패치'];
}

// ═══════════════════════════════════════════
// 1. 주문 데이터 (Excel) 업로드
// ═══════════════════════════════════════════

function handleOrderDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processOrderFile(file);
}

function handleOrderUpload(e) {
  const file = e.target.files[0];
  if (file) processOrderFile(file);
  e.target.value = '';
}

async function processOrderFile(file) {
  const preview = document.getElementById('orderPreview');
  const btn = document.getElementById('orderUploadBtn');

  try {
    preview.innerHTML = '<p>파싱 중...</p>';
    let rows;

    if (file.name.endsWith('.csv')) {
      const text = await readFileAsText(file);
      const lines = text.split('\n').filter(l => l.trim());
      const headers = csvLineParse(lines[0]);
      rows = lines.slice(1).map(line => {
        const vals = csvLineParse(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
        return obj;
      });
    } else {
      rows = await parseExcelFile(file);
    }

    parsedOrderData = rows;
    preview.innerHTML = makePreviewTable(rows);
    btn.disabled = false;
    uploadLog(`주문 파일 로드: ${file.name} (${rows.length}행)`, 'info');

  } catch (err) {
    preview.innerHTML = `<p style="color:#F44336">파싱 오류: ${err.message}</p>`;
    btn.disabled = true;
  }
}

async function processOrderUpload() {
  if (parsedOrderData.length === 0) return;
  const btn = document.getElementById('orderUploadBtn');
  const status = document.getElementById('orderUploadStatus');
  btn.disabled = true;
  status.textContent = '처리 중...';

  const mergeMode = document.getElementById('orderMergeMode').checked;
  const addNew = document.getElementById('orderAddNew').checked;

  try {
    if (instCache.length === 0) await loadInstitutions();

    // 컬럼명 자동 감지
    const sample = parsedOrderData[0];
    const keys = Object.keys(sample);
    const nameCol = keys.find(k => /주문자|기관|업체|option_user/i.test(k)) || keys[0];
    const addrCol = keys.find(k => /주소|addr/i.test(k));
    const goodsCol = keys.find(k => /상품|품목|goods/i.test(k));
    const priceCol = keys.find(k => /단가|가격|금액|price/i.test(k));
    const qtyCol = keys.find(k => /수량|cnt|qty/i.test(k));
    const dateCol = keys.find(k => /날짜|일자|일시|date|reg_time/i.test(k));
    const orderIdCol = keys.find(k => /주문번호|order_idx|번호/i.test(k));
    const stateCol = keys.find(k => /상태|state/i.test(k));

    uploadLog(`컬럼 매핑: 주문자=${nameCol}, 주소=${addrCol}, 상품=${goodsCol}, 금액=${priceCol}, 수량=${qtyCol}`, 'info');

    let matchCount = 0, newCount = 0, skipCount = 0;
    const orderRecords = [];
    const instUpdates = {};

    for (const row of parsedOrderData) {
      const optUser = String(row[nameCol] || '').trim();
      const addr = addrCol ? String(row[addrCol] || '').trim() : '';
      const goods = goodsCol ? String(row[goodsCol] || '') : '';
      const price = parseFloat(row[priceCol]) || 0;
      const qty = parseInt(row[qtyCol]) || 0;
      const date = dateCol ? String(row[dateCol] || '').substring(0, 10) : '';
      const orderId = orderIdCol ? String(row[orderIdCol] || '') : '';
      const state = stateCol ? String(row[stateCol] || '') : '';

      if (state.includes('취소') || state.includes('환불')) { skipCount++; continue; }

      // 기관 매칭
      let matchedInst = null;
      if (mergeMode && optUser) {
        matchedInst = instCache.find(d => d.name === optUser);
        if (!matchedInst) matchedInst = instCache.find(d => d.name.includes(optUser) || optUser.includes(d.name));
      }

      // 주문 레코드 저장
      orderRecords.push({
        order_idx: orderId,
        option_user: optUser,
        addr: addr,
        goods_name: goods,
        sale_price: price,
        sale_cnt: qty,
        state_subject: state,
        reg_time: date,
        matched: !!matchedInst,
        institution_id: matchedInst ? matchedInst.id : null
      });

      const amount = price * qty;

      if (matchedInst) {
        // 기관 데이터 집계
        if (!instUpdates[matchedInst.id]) {
          instUpdates[matchedInst.id] = {
            addAmount: 0, addVolume: 0, latestDate: matchedInst.last_purchase_date || '',
            products: new Set(matchedInst.products || [])
          };
        }
        const u = instUpdates[matchedInst.id];
        u.addAmount += amount;
        u.addVolume += qty;
        if (date && (date > u.latestDate || u.latestDate === '-')) u.latestDate = date;
        uploadDetectProducts(goods).forEach(p => u.products.add(p));
        matchCount++;

      } else if (addNew && optUser) {
        newCount++;
      }
    }

    // DB 저장: 주문
    uploadLog(`주문 ${orderRecords.length}건 저장 중...`);
    for (let i = 0; i < orderRecords.length; i += 500) {
      const batch = orderRecords.slice(i, i + 500);
      const { error } = await supabase.from('orders').insert(batch);
      if (error) uploadLog(`주문 배치 오류: ${error.message}`, 'error');
    }

    // DB 업데이트: 매칭된 기관
    for (const [idStr, u] of Object.entries(instUpdates)) {
      const id = parseInt(idStr);
      const inst = instCache.find(d => d.id === id);
      if (!inst) continue;

      const updateData = {
        purchase_amount: (inst.purchase_amount || 0) + u.addAmount,
        purchase_volume: (inst.purchase_volume || 0) + u.addVolume,
        products: [...u.products]
      };
      if (u.latestDate && u.latestDate !== '-') updateData.last_purchase_date = u.latestDate;
      if (['인지', '관심', '고려'].includes(inst.purchase_stage)) updateData.purchase_stage = '구매';

      await supabase.from('institutions').update(updateData).eq('id', id);
    }

    const result = `완료: 주문 ${orderRecords.length}건, 매칭 ${matchCount}, 취소제외 ${skipCount}`;
    status.textContent = result;
    uploadLog(result, 'success');
    showToast('주문 데이터 업로드 완료', 'success');
    loadInstitutions();

  } catch (err) {
    status.textContent = '오류: ' + err.message;
    uploadLog('오류: ' + err.message, 'error');
    showToast('업로드 실패', 'error');
  } finally {
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════
// 2. 상담내역 (CSV) 업로드
// ═══════════════════════════════════════════

function handleConsultDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processConsultFile(file);
}

function handleConsultUpload(e) {
  const file = e.target.files[0];
  if (file) processConsultFile(file);
  e.target.value = '';
}

async function processConsultFile(file) {
  const preview = document.getElementById('consultPreview');
  const btn = document.getElementById('consultUploadBtn');

  try {
    preview.innerHTML = '<p>파싱 중...</p>';
    const text = await readFileAsText(file);
    const records = parseCSVText(text);

    parsedConsultData = records;
    const previewRows = records.slice(0, 5).map(r => ({
      날짜: r.date, MD: r.md_name, 대상: r.raw_institution_name,
      태그: (r.tags || []).join(', '), 내용: (r.content || '').substring(0, 50)
    }));
    preview.innerHTML = makePreviewTable(previewRows);
    preview.innerHTML = `<p style="font-size:0.82rem;color:#555;margin-bottom:6px;">총 <strong>${records.length}</strong>건 파싱 완료</p>` + preview.innerHTML;
    btn.disabled = false;
    uploadLog(`상담 CSV 로드: ${file.name} (${records.length}건)`, 'info');

  } catch (err) {
    preview.innerHTML = `<p style="color:#F44336">파싱 오류: ${err.message}</p>`;
    btn.disabled = true;
  }
}

async function processConsultUpload() {
  if (parsedConsultData.length === 0) return;
  const btn = document.getElementById('consultUploadBtn');
  const status = document.getElementById('consultUploadStatus');
  btn.disabled = true;
  status.textContent = '처리 중...';

  const updateStage = document.getElementById('consultUpdateStage').checked;

  try {
    if (instCache.length === 0) await loadInstitutions();

    const TAG_STAGE_MAP = { '문의': '관심', '견적': '고려', '시안': '고려', '샘플': '고려', '수주': '고려', '카드결제': '고려' };
    const STAGE_ORDER = { '인지': 0, '관심': 1, '고려': 2, '구매': 3, '만족': 4, '추천': 5 };

    let matchCount = 0;
    const consultRecords = [];
    const unmatchedRecords = [];
    const instConsultMap = {}; // institutionId → { count, latestDate, bestStage }

    for (const rec of parsedConsultData) {
      const instName = rec.raw_institution_name;
      let matchedInst = null;

      if (instName) {
        matchedInst = instCache.find(d => d.name === instName);
        if (!matchedInst) matchedInst = instCache.find(d => d.name.includes(instName) || instName.includes(d.name));
      }

      if (matchedInst) {
        consultRecords.push({ ...rec, institution_id: matchedInst.id, matched: true });
        matchCount++;

        // 집계
        if (!instConsultMap[matchedInst.id]) {
          instConsultMap[matchedInst.id] = { count: 0, latestDate: '', bestStage: null };
        }
        const m = instConsultMap[matchedInst.id];
        m.count++;
        if (rec.date && rec.date > m.latestDate) m.latestDate = rec.date;

        // 태그 → 구매단계
        if (updateStage && rec.tags) {
          for (const tag of rec.tags) {
            const mapped = TAG_STAGE_MAP[tag];
            if (mapped && (!m.bestStage || STAGE_ORDER[mapped] > STAGE_ORDER[m.bestStage])) {
              m.bestStage = mapped;
            }
          }
        }
      } else {
        consultRecords.push({ ...rec, institution_id: null, matched: false });
        if (instName) {
          unmatchedRecords.push({
            date: rec.date, tags: rec.tags, content: rec.content,
            md_name: rec.md_name, raw_institution_name: instName,
            resolved: false
          });
        }
      }
    }

    // DB 저장: 상담내역
    uploadLog(`상담 ${consultRecords.length}건 저장 중...`);
    for (let i = 0; i < consultRecords.length; i += 500) {
      const batch = consultRecords.slice(i, i + 500);
      const { error } = await supabase.from('consultations').insert(batch);
      if (error) uploadLog(`상담 배치 오류: ${error.message}`, 'error');
    }

    // DB 저장: 미매칭
    if (unmatchedRecords.length > 0) {
      for (let i = 0; i < unmatchedRecords.length; i += 500) {
        const batch = unmatchedRecords.slice(i, i + 500);
        await supabase.from('unmatched_consultations').insert(batch);
      }
      uploadLog(`미매칭 ${unmatchedRecords.length}건 저장`, 'info');
    }

    // 기관 상담 정보 업데이트
    for (const [idStr, m] of Object.entries(instConsultMap)) {
      const id = parseInt(idStr);
      const inst = instCache.find(d => d.id === id);
      if (!inst) continue;

      const updateData = {
        consult_count: (inst.consult_count || 0) + m.count
      };
      if (m.latestDate) updateData.last_consult_date = m.latestDate;

      // 구매단계 승격 (현재보다 높은 경우만)
      if (updateStage && m.bestStage) {
        const currentOrder = STAGE_ORDER[inst.purchase_stage] || 0;
        const newOrder = STAGE_ORDER[m.bestStage] || 0;
        if (newOrder > currentOrder) updateData.purchase_stage = m.bestStage;
      }

      await supabase.from('institutions').update(updateData).eq('id', id);
    }

    const result = `완료: ${consultRecords.length}건 (매칭 ${matchCount}, 미매칭 ${unmatchedRecords.length})`;
    status.textContent = result;
    uploadLog(result, 'success');
    showToast('상담내역 업로드 완료', 'success');
    loadInstitutions();

  } catch (err) {
    status.textContent = '오류: ' + err.message;
    uploadLog('오류: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════
// 3. Google Sheets 가져오기
// ═══════════════════════════════════════════

async function fetchGoogleSheets() {
  const urlInput = document.getElementById('gsheetsUrl').value.trim();
  const preview = document.getElementById('gsheetsPreview');
  const btn = document.getElementById('gsheetsUploadBtn');

  if (!urlInput) { showToast('URL을 입력하세요', 'error'); return; }

  try {
    preview.innerHTML = '<p>불러오는 중...</p>';

    // Google Sheets URL → CSV export URL 변환
    let csvUrl = urlInput;
    const match = urlInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const sheetId = match[1];
      // gid 추출 (있으면)
      const gidMatch = urlInput.match(/gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }

    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status} - 공개 설정을 확인하세요`);
    const text = await response.text();

    // CSV 파싱
    const lines = text.split('\n').filter(l => l.trim());
    const headers = csvLineParse(lines[0]);
    const rows = lines.slice(1).map(line => {
      const vals = csvLineParse(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
      return obj;
    });

    parsedGsheetsData = rows;
    preview.innerHTML = makePreviewTable(rows);
    btn.disabled = false;
    uploadLog(`Google Sheets 로드: ${rows.length}행`, 'info');

  } catch (err) {
    preview.innerHTML = `<p style="color:#F44336">오류: ${err.message}</p>`;
    btn.disabled = true;
    uploadLog('Google Sheets 오류: ' + err.message, 'error');
  }
}

async function processGsheetsUpload() {
  if (parsedGsheetsData.length === 0) return;
  const type = document.getElementById('gsheetsType').value;

  if (type === 'orders') {
    parsedOrderData = parsedGsheetsData;
    await processOrderUpload();
  } else if (type === 'consultations') {
    // 시트 데이터를 상담 형식으로 변환
    const sample = parsedGsheetsData[0];
    const keys = Object.keys(sample);
    const dateCol = keys.find(k => /날짜|작성일|date/i.test(k));
    const tagCol = keys.find(k => /태그|tag/i.test(k));
    const nameCol = keys.find(k => /대상|기관|name/i.test(k));
    const contentCol = keys.find(k => /내용|content/i.test(k));
    const mdCol = keys.find(k => /MD|md|담당/i.test(k));

    parsedConsultData = parsedGsheetsData.map(row => ({
      date: row[dateCol] || null,
      tags: (row[tagCol] || '').split('/').map(t => t.replace(/[\[\]]/g, '').trim()).filter(Boolean),
      raw_institution_name: row[nameCol] || null,
      content: row[contentCol] || '',
      md_name: row[mdCol] || null
    }));
    await processConsultUpload();
  } else if (type === 'institutions') {
    parsedInstBulkData = parsedGsheetsData;
    document.querySelector('input[name="instMode"][value="file"]').checked = true;
    await processInstBulkUpload();
  }
}

// ═══════════════════════════════════════════
// 4. 기관 데이터 일괄 업로드
// ═══════════════════════════════════════════

function handleInstDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processInstBulkFile(file);
}

function handleInstBulkUpload(e) {
  const file = e.target.files[0];
  if (file) processInstBulkFile(file);
  e.target.value = '';
}

async function processInstBulkFile(file) {
  const preview = document.getElementById('instBulkPreview');
  const btn = document.getElementById('instBulkBtn');

  try {
    preview.innerHTML = '<p>파싱 중...</p>';
    let rows;

    if (file.name.endsWith('.csv')) {
      const text = await readFileAsText(file);
      const lines = text.split('\n').filter(l => l.trim());
      const headers = csvLineParse(lines[0]);
      rows = lines.slice(1).map(line => {
        const vals = csvLineParse(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
        return obj;
      });
    } else {
      rows = await parseExcelFile(file);
    }

    parsedInstBulkData = rows;
    preview.innerHTML = makePreviewTable(rows);
    btn.disabled = false;
    uploadLog(`기관 파일 로드: ${file.name} (${rows.length}행)`, 'info');

  } catch (err) {
    preview.innerHTML = `<p style="color:#F44336">파싱 오류: ${err.message}</p>`;
    btn.disabled = true;
  }
}

async function processInstBulkUpload() {
  const mode = document.querySelector('input[name="instMode"]:checked').value;
  const btn = document.getElementById('instBulkBtn');
  const status = document.getElementById('instBulkStatus');
  btn.disabled = true;
  status.textContent = '처리 중...';

  try {
    let records = [];

    if (mode === 'datajs') {
      // data.js에서 가져오기
      if (typeof institutionData === 'undefined' || !institutionData.length) {
        throw new Error('institutionData가 없습니다.');
      }

      // 기존 데이터 확인
      const { count } = await supabase.from('institutions').select('*', { count: 'exact', head: true });
      if (count > 0 && !confirm(`DB에 이미 ${count}개 기관이 있습니다. 계속하시겠습니까?`)) {
        status.textContent = '취소됨';
        btn.disabled = false;
        return;
      }

      records = institutionData.map(d => ({
        name: d.name, type: d.type, region: d.region, district: d.district || null,
        lat: d.lat, lng: d.lng, products: d.products || [],
        purchase_cycle: d.purchaseCycle || '-', purchase_volume: d.purchaseVolume || 0,
        purchase_amount: d.purchaseAmount || 0, purchase_stage: d.purchaseStage || '인지',
        last_purchase_date: d.lastPurchaseDate || '-',
        consult_count: d.consultCount || 0, last_consult_date: d.lastConsultDate || null
      }));

      uploadLog(`data.js에서 ${records.length}개 기관 로드`, 'info');

    } else {
      // 파일에서 가져오기
      if (parsedInstBulkData.length === 0) { showToast('파일을 먼저 선택하세요', 'error'); btn.disabled = false; return; }

      const sample = parsedInstBulkData[0];
      const keys = Object.keys(sample);
      const nameCol = keys.find(k => /기관명|name|이름/i.test(k)) || keys[0];
      const typeCol = keys.find(k => /유형|type|기관유형/i.test(k));
      const regionCol = keys.find(k => /지역|region|광역/i.test(k));
      const distCol = keys.find(k => /시군구|district|구군/i.test(k));
      const latCol = keys.find(k => /위도|lat/i.test(k));
      const lngCol = keys.find(k => /경도|lng|lon/i.test(k));

      uploadLog(`컬럼 매핑: 기관명=${nameCol}, 유형=${typeCol}, 지역=${regionCol}`, 'info');

      records = parsedInstBulkData.map(row => ({
        name: String(row[nameCol] || '').trim(),
        type: typeCol ? String(row[typeCol] || '보건소').trim() : '보건소',
        region: regionCol ? String(row[regionCol] || '').trim() : '',
        district: distCol ? String(row[distCol] || '').trim() || null : null,
        lat: latCol ? parseFloat(row[latCol]) || null : null,
        lng: lngCol ? parseFloat(row[lngCol]) || null : null,
        products: [], purchase_cycle: '-', purchase_volume: 0,
        purchase_amount: 0, purchase_stage: '인지',
        last_purchase_date: '-', consult_count: 0
      })).filter(r => r.name);
    }

    // 배치 삽입
    let inserted = 0;
    for (let i = 0; i < records.length; i += 500) {
      const batch = records.slice(i, i + 500);
      const { error } = await supabase.from('institutions').insert(batch);
      if (error) { uploadLog(`배치 오류: ${error.message}`, 'error'); throw error; }
      inserted += batch.length;
      uploadLog(`${inserted}/${records.length} 삽입 완료`);
    }

    status.textContent = `완료: ${inserted}개 기관 등록`;
    uploadLog(`기관 등록 완료: ${inserted}개`, 'success');
    showToast('기관 데이터 업로드 완료', 'success');
    loadInstitutions();

  } catch (err) {
    status.textContent = '오류: ' + err.message;
    uploadLog('오류: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}
