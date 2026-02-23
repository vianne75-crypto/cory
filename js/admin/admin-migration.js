// ============================================
// data.js → Supabase 마이그레이션
// ============================================

function migLog(msg, type = '') {
  const log = document.getElementById('migrationLog');
  log.classList.add('visible');
  const span = type ? `<span class="log-${type}">${msg}</span>` : msg;
  log.innerHTML += span + '\n';
  log.scrollTop = log.scrollHeight;
}

// Step 1: 기관 데이터 이관
async function migrateInstitutions() {
  const status = document.getElementById('migStatus1');
  status.textContent = '진행 중...';
  status.className = 'step-status progress';
  migLog('=== 기관 데이터 이관 시작 ===', 'info');

  try {
    // data.js의 institutionData 사용
    if (typeof institutionData === 'undefined' || !institutionData.length) {
      throw new Error('institutionData가 없습니다. data.js를 확인하세요.');
    }

    migLog(`data.js에서 ${institutionData.length}개 기관 발견`);

    // 기존 데이터 확인
    const { count } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true });

    if (count > 0) {
      migLog(`주의: DB에 이미 ${count}개 기관이 존재합니다`, 'error');
      if (!confirm(`DB에 이미 ${count}개 기관이 있습니다. 계속 진행하시겠습니까? (중복 가능)`)) {
        status.textContent = '취소됨';
        status.className = 'step-status error';
        return;
      }
    }

    // snake_case로 변환하여 삽입
    const records = institutionData.map(d => ({
      name: d.name,
      type: d.type,
      region: d.region,
      district: d.district || null,
      lat: d.lat,
      lng: d.lng,
      products: d.products || [],
      purchase_cycle: d.purchaseCycle || '-',
      purchase_volume: d.purchaseVolume || 0,
      purchase_amount: d.purchaseAmount || 0,
      purchase_stage: d.purchaseStage || '인지',
      last_purchase_date: d.lastPurchaseDate || '-',
      consult_count: d.consultCount || 0,
      last_consult_date: d.lastConsultDate || null
    }));

    // 500개씩 배치 삽입
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase.from('institutions').insert(batch);

      if (error) {
        migLog(`배치 ${Math.floor(i / batchSize) + 1} 오류: ${error.message}`, 'error');
        throw error;
      }

      inserted += batch.length;
      migLog(`${inserted}/${records.length} 삽입 완료`);
    }

    migLog(`기관 이관 완료: ${inserted}개`, 'success');
    status.textContent = `완료 (${inserted}개)`;
    status.className = 'step-status success';

    // 기관 캐시 새로고침
    loadInstitutions();

  } catch (err) {
    migLog(`오류: ${err.message}`, 'error');
    status.textContent = '실패';
    status.className = 'step-status error';
  }
}

// Step 2: 상담내역 CSV 업로드
async function handleCsvUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const status = document.getElementById('migStatus2');
  status.textContent = '파싱 중...';
  status.className = 'step-status progress';
  migLog('=== 상담내역 CSV 업로드 시작 ===', 'info');
  migLog(`파일: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`);

  try {
    const text = await file.text();
    const lines = text.split('\n');
    migLog(`총 ${lines.length}행 읽기 완료`);

    // CSV 파싱 (헤더: 날짜,태그,대상,내용,MD)
    const records = [];
    let currentRecord = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // 날짜로 시작하는 행 = 새 레코드
      const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2}),/);
      if (dateMatch) {
        if (currentRecord) records.push(currentRecord);

        // CSV 파싱 (큰따옴표 내 쉼표 고려)
        const parts = parseCSVLine(line);
        const tags = (parts[1] || '').split('/').map(t => t.replace(/[\[\]]/g, '').trim()).filter(Boolean);

        currentRecord = {
          date: parts[0] || null,
          tags: tags,
          raw_institution_name: (parts[2] || '').trim() || null,
          content: (parts[3] || '').trim(),
          md_name: (parts[4] || '').trim() || null,
          matched: false
        };
      } else if (currentRecord) {
        // 멀티라인 내용 이어붙이기
        currentRecord.content += '\n' + line;
      }
    }
    if (currentRecord) records.push(currentRecord);

    migLog(`${records.length}건 상담 레코드 파싱 완료`);

    // 기관명 매칭
    if (instCache.length === 0) await loadInstitutions();

    let matchCount = 0;
    const unmatchedRecords = [];
    const consultRecords = [];

    for (const rec of records) {
      const instName = rec.raw_institution_name;
      let matchedInst = null;

      if (instName) {
        // 간단한 매칭
        matchedInst = instCache.find(d => d.name === instName) ||
          instCache.find(d => d.name.includes(instName) || instName.includes(d.name));
      }

      if (matchedInst) {
        consultRecords.push({
          ...rec,
          institution_id: matchedInst.id,
          matched: true
        });
        matchCount++;
      } else {
        consultRecords.push({ ...rec, institution_id: null, matched: false });

        // 미매칭 큐에도 추가
        if (instName) {
          const best = findBestMatch ? findBestMatch(instName, instCache) : null;
          unmatchedRecords.push({
            date: rec.date,
            tags: rec.tags,
            content: rec.content,
            md_name: rec.md_name,
            raw_institution_name: instName,
            suggested_institution_id: best ? best.inst.id : null,
            suggestion_score: best ? best.score : null,
            resolved: false
          });
        }
      }
    }

    migLog(`매칭: ${matchCount}/${records.length} (${((matchCount / records.length) * 100).toFixed(1)}%)`);

    // 배치 삽입: 상담내역
    status.textContent = '업로드 중...';
    const batchSize = 500;
    let uploadedConsult = 0;

    for (let i = 0; i < consultRecords.length; i += batchSize) {
      const batch = consultRecords.slice(i, i + batchSize);
      const { error } = await supabase.from('consultations').insert(batch);
      if (error) {
        migLog(`상담 배치 오류: ${error.message}`, 'error');
        // 계속 진행
      }
      uploadedConsult += batch.length;
      if (uploadedConsult % 2000 === 0) {
        migLog(`상담: ${uploadedConsult}/${consultRecords.length} 업로드`);
      }
    }

    migLog(`상담내역 ${uploadedConsult}건 업로드 완료`, 'success');

    // 배치 삽입: 미매칭
    if (unmatchedRecords.length > 0) {
      let uploadedUnmatched = 0;
      for (let i = 0; i < unmatchedRecords.length; i += batchSize) {
        const batch = unmatchedRecords.slice(i, i + batchSize);
        const { error } = await supabase.from('unmatched_consultations').insert(batch);
        if (error) {
          migLog(`미매칭 배치 오류: ${error.message}`, 'error');
        }
        uploadedUnmatched += batch.length;
      }
      migLog(`미매칭 ${uploadedUnmatched}건 업로드 완료`, 'info');
    }

    status.textContent = `완료 (${records.length}건)`;
    status.className = 'step-status success';
    showToast('상담내역 업로드 완료', 'success');

  } catch (err) {
    migLog(`오류: ${err.message}`, 'error');
    status.textContent = '실패';
    status.className = 'step-status error';
  }

  // 파일 입력 초기화
  event.target.value = '';
}

// CSV 라인 파서 (큰따옴표 고려)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
