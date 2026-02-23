(async function() {
  const TOTAL_PAGES = 641;
  const allRows = [];
  let errorCount = 0;

  console.log('상담내역 추출 시작... 총 ' + TOTAL_PAGES + '페이지');

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    try {
      const url = '/admin/sub_sale/sangdam_list.htm?ajax_yn=0&page=' + page;
      const resp = await fetch(url, { credentials: 'same-origin' });
      const html = await resp.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // rg-hover 클래스 테이블의 데이터 행
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
            content: tds[2] ? tds[2].textContent.trim() : '',
            salesType: tds[3] ? tds[3].textContent.trim() : ''
          });
        }
      }

      if (page % 50 === 0 || page === TOTAL_PAGES) {
        console.log('진행: ' + page + '/' + TOTAL_PAGES + ' (' + Math.round(page/TOTAL_PAGES*100) + '%) - 수집: ' + allRows.length + '건');
      }

      await new Promise(r => setTimeout(r, 80));

    } catch (err) {
      console.error('페이지 ' + page + ' 오류:', err.message);
      errorCount++;
      if (errorCount > 20) { console.error('중단'); break; }
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('추출 완료! 총 ' + allRows.length + '건');

  // CSV 다운로드
  const BOM = '\uFEFF';
  let csv = BOM + '작성일,MD,상담자,내용,관련매출\n';
  for (const row of allRows) {
    csv += '"' + row.date + '","' + row.md + '","' + row.consultant + '","' + (row.content||'').replace(/"/g,'""') + '","' + (row.salesType||'').replace(/"/g,'""') + '"\n';
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sangdam_all.csv';
  a.click();
  console.log('CSV 다운로드 완료!');
})();
