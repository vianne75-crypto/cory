/**
 * 애니빌드 상담내역 → Supabase 동기화 스크립트
 *
 * 사용법: 애니빌드 관리자 페이지 로그인 후 브라우저 콘솔(F12)에서 실행
 * 또는 관리자 페이지에서 "스크립트 복사" 버튼 클릭 후 콘솔에 붙여넣기
 *
 * 증분 동기화: 최근 N페이지만 스크래핑 (기본 30페이지 ≈ 최근 ~900건)
 */
(async function() {
  const WORKER_URL = 'https://aps-webhook.vianne75.workers.dev/sync-consultations';
  const PAGES_TO_SYNC = 5;  // 동기화할 페이지 수 (1페이지 ≈ 30건)
  const BATCH_SIZE = 200;   // Supabase 전송 배치 크기

  const allRows = [];
  let errorCount = 0;

  console.log('=== 상담내역 동기화 시작 ===');
  console.log(`최근 ${PAGES_TO_SYNC}페이지 스크래핑...`);

  for (let page = 1; page <= PAGES_TO_SYNC; page++) {
    try {
      const url = '/admin/sub_sale/sangdam_list.htm?ajax_yn=0&page=' + page;
      const resp = await fetch(url, { credentials: 'same-origin' });
      const html = await resp.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const table = doc.querySelector('table.rg-hover') || doc.querySelectorAll('table')[1];
      if (!table) continue;

      const rows = table.querySelectorAll('tr');
      for (let i = 1; i < rows.length; i++) {
        const tr = rows[i];
        const th = tr.querySelector('th');
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 3) {
          allRows.push({
            date: th ? th.textContent.trim() : '',
            md: tds[0] ? tds[0].textContent.trim() : '',
            consultant: tds[1] ? tds[1].textContent.trim() : '',
            content: tds[2] ? tds[2].textContent.trim() : ''
          });
        }
      }

      if (page % 10 === 0 || page === PAGES_TO_SYNC) {
        console.log(`진행: ${page}/${PAGES_TO_SYNC} (${Math.round(page/PAGES_TO_SYNC*100)}%) - 수집: ${allRows.length}건`);
      }

      await new Promise(r => setTimeout(r, 80));

    } catch (err) {
      console.error('페이지 ' + page + ' 오류:', err.message);
      errorCount++;
      if (errorCount > 10) { console.error('오류 과다, 중단'); break; }
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`스크래핑 완료: ${allRows.length}건 수집`);

  if (allRows.length === 0) {
    console.log('수집된 데이터 없음. 종료.');
    return;
  }

  // Supabase로 전송 (배치)
  console.log('Supabase 전송 시작...');
  let totalSent = 0;

  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE);

    try {
      const resp = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      });
      const result = await resp.json();

      if (result.success) {
        totalSent += result.inserted || batch.length;
        console.log(`배치 ${Math.floor(i/BATCH_SIZE)+1}: ${result.inserted || batch.length}건 저장, 매칭: ${result.matched || 0}건`);
      } else {
        console.error('배치 오류:', result.error);
      }
    } catch (err) {
      console.error('전송 오류:', err.message);
    }
  }

  console.log('=== 동기화 완료 ===');
  console.log(`총 ${totalSent}건 저장`);
  console.log('관리자 페이지에서 결과를 확인하세요.');
})();
