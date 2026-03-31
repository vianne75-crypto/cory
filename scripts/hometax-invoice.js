/**
 * 홈택스 전자세금계산서 자동 발행 스크립트
 *
 * 사용법:
 *   node scripts/hometax-invoice.js
 *
 * 설치 (최초 1회):
 *   npm install playwright
 *   npx playwright install chromium
 *
 * 흐름:
 *   1. 홈택스 로그인 페이지 자동 오픈
 *   2. 사용자가 공동인증서로 로그인 (수동)
 *   3. 로그인 감지 후 건별발급 페이지 이동 + 자동 입력
 *   4. 발급 전 미리보기 → 사용자 최종 확인 후 발급
 */

const { chromium } = require('playwright');
const readline = require('readline');

// ─── 발행 정보 (여기만 수정) ─────────────────────────
const INVOICE = {
  date: '20260324',           // 작성일자 YYYYMMDD
  receiver: {
    type: 'non-business',     // 'business' | 'non-business' (비사업자/고유번호)
    regNo: '505-83-00264',    // 사업자번호 또는 고유번호
    name: '경주시보건소',
    ceo: '진병철',
    addr: '경상북도 경주시 양정로 300(동천동)'
  },
  items: [
    {
      month: '03',
      day: '24',
      name: 'APS알쓰패치',
      spec: '',
      qty: 500,
      unitPrice: 1909,
      supplyAmt: 954545,
      taxAmt: 95455
    }
  ],
  type: '청구',               // '영수' | '청구'
  memo: '주문번호 137565'
};
// ──────────────────────────────────────────────────────

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer); });
  });
}

async function main() {
  console.log('\n[홈택스 세금계산서 자동 발행]');
  console.log('브라우저를 열겠습니다. 공동인증서로 로그인해 주세요.\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. 홈택스 로그인 페이지
  await page.goto('https://www.hometax.go.kr', { waitUntil: 'domcontentloaded' });
  console.log('홈택스 접속 완료. 공동인증서로 로그인해 주세요.');
  await askUser('로그인 완료 후 Enter를 누르세요...');

  // 2. 건별발급 페이지 이동
  console.log('\n건별발급 페이지로 이동 중...');
  try {
    await page.goto(
      'https://www.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/UTESFPBP02.xml',
      { waitUntil: 'domcontentloaded', timeout: 15000 }
    );
  } catch (e) {
    console.log('직접 이동 실패. 메뉴에서 이동해 주세요: 조회/발급 → 전자세금계산서 → 발급 → 건별발급');
    await askUser('건별발급 페이지 열린 후 Enter를 누르세요...');
  }

  await wait(3000);
  console.log('\n홈택스 WebSquare UI 자동 입력 시작...');

  // 3. 작성일자 입력
  try {
    // WebSquare 날짜 필드 탐색 (id 패턴 기반)
    const dateInput = page.locator('input[id*="wdate"], input[id*="Date"], input[placeholder*="작성일"]').first();
    if (await dateInput.isVisible({ timeout: 3000 })) {
      await dateInput.fill(INVOICE.date);
      console.log('✓ 작성일자 입력');
    }
  } catch (e) {
    console.log('⚠ 작성일자 자동 입력 실패 → 수동 입력 필요:', INVOICE.date);
  }

  await wait(1000);

  // 4. 고유번호/사업자번호 입력
  try {
    // 비사업자 탭 클릭
    const nonBizTab = page.locator('text=사업자 외, text=비사업자').first();
    if (await nonBizTab.isVisible({ timeout: 2000 })) {
      await nonBizTab.click();
      console.log('✓ 비사업자 탭 선택');
      await wait(500);
    }

    // 등록번호 입력
    const regInput = page.locator('input[id*="reg"], input[id*="Reg"], input[placeholder*="등록번호"]').first();
    if (await regInput.isVisible({ timeout: 2000 })) {
      await regInput.fill(INVOICE.receiver.regNo.replace(/-/g, ''));
      console.log('✓ 고유번호 입력:', INVOICE.receiver.regNo);
      // 조회 버튼 클릭
      await page.keyboard.press('Enter');
      await wait(1500);
    }
  } catch (e) {
    console.log('⚠ 등록번호 자동 입력 실패 → 수동 입력 필요:', INVOICE.receiver.regNo);
  }

  // 5. 대표자 확인 및 수정
  try {
    const ceoInput = page.locator('input[id*="ceo"], input[id*="Ceo"], input[placeholder*="대표자"]').first();
    if (await ceoInput.isVisible({ timeout: 2000 })) {
      const currentVal = await ceoInput.inputValue();
      if (currentVal !== INVOICE.receiver.ceo) {
        await ceoInput.fill(INVOICE.receiver.ceo);
        console.log('✓ 대표자 수정:', currentVal, '→', INVOICE.receiver.ceo);
      } else {
        console.log('✓ 대표자 확인:', INVOICE.receiver.ceo);
      }
    }
  } catch (e) {
    console.log('⚠ 대표자 확인 실패 → 직접 확인 필요:', INVOICE.receiver.ceo);
  }

  await wait(1000);

  // 6. 품목 입력
  for (let i = 0; i < INVOICE.items.length; i++) {
    const item = INVOICE.items[i];
    console.log(`\n품목 ${i + 1} 입력 중: ${item.name}`);

    const fields = [
      { pattern: 'month, Month', value: item.month, label: '월' },
      { pattern: 'day, Day', value: item.day, label: '일' },
      { pattern: 'itemNm, goodsNm, ItemNm', value: item.name, label: '품목명' },
      { pattern: 'qty, Qty, quantity', value: String(item.qty), label: '수량' },
      { pattern: 'unitPrice, UnitPrice', value: String(item.unitPrice), label: '단가' },
      { pattern: 'supAmt, SupAmt, supplyAmt', value: String(item.supplyAmt), label: '공급가액' },
      { pattern: 'taxAmt, TaxAmt', value: String(item.taxAmt), label: '세액' },
    ];

    for (const field of fields) {
      try {
        const patterns = field.pattern.split(', ');
        let input = null;
        for (const p of patterns) {
          const loc = page.locator(`input[id*="${p}"]`).first();
          if (await loc.isVisible({ timeout: 500 })) { input = loc; break; }
        }
        if (input) {
          await input.fill(field.value);
          console.log(`  ✓ ${field.label}: ${field.value}`);
          await wait(200);
        }
      } catch (e) {
        console.log(`  ⚠ ${field.label} 자동 입력 실패 → 수동: ${field.value}`);
      }
    }
  }

  // 7. 영수/청구 선택
  try {
    const typeLabel = page.locator(`text=${INVOICE.type}`).first();
    if (await typeLabel.isVisible({ timeout: 2000 })) {
      await typeLabel.click();
      console.log('\n✓ 청구/영수 선택:', INVOICE.type);
    }
  } catch (e) {
    console.log('⚠ 청구/영수 자동 선택 실패 →', INVOICE.type, '직접 선택 필요');
  }

  // 8. 비고 입력
  try {
    const memoInput = page.locator('input[id*="memo"], textarea[id*="memo"], input[placeholder*="비고"]').first();
    if (await memoInput.isVisible({ timeout: 2000 })) {
      await memoInput.fill(INVOICE.memo);
      console.log('✓ 비고 입력:', INVOICE.memo);
    }
  } catch (e) {
    console.log('⚠ 비고 자동 입력 실패 →', INVOICE.memo);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('자동 입력 완료. 화면을 확인하신 후 발급 버튼을 눌러주세요.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await askUser('발급 완료 후 Enter를 누르면 브라우저가 닫힙니다...');
  await browser.close();
  console.log('완료. 홈택스에서 발행 내역을 확인하세요.');
}

main().catch(err => {
  console.error('오류 발생:', err.message);
  process.exit(1);
});
