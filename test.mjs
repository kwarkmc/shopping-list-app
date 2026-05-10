import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE_URL = `file:///${join(__dirname, 'index.html').replace(/\\/g, '/')}`;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

// localStorage를 비워서 깨끗한 상태로 시작
await page.goto(FILE_URL);
await page.evaluate(() => localStorage.removeItem('shopping-list'));
await page.reload();

// ──────────────────────────────────────────
console.log('\n📋 [1] 초기 상태 확인');
// ──────────────────────────────────────────
const emptyMsg = await page.locator('#empty').isVisible();
assert(emptyMsg, '빈 리스트 안내 메시지가 보인다');

const itemCount = await page.locator('#list li').count();
assert(itemCount === 0, '리스트 아이템이 0개이다');

// ──────────────────────────────────────────
console.log('\n➕ [2] 아이템 추가 — 버튼 클릭');
// ──────────────────────────────────────────
await page.fill('#itemInput', '우유');
await page.click('button:has-text("추가")');

const afterAdd1 = await page.locator('#list li').count();
assert(afterAdd1 === 1, '아이템 1개가 추가됐다');

const text1 = await page.locator('#list li .item-text').first().textContent();
assert(text1 === '우유', '추가된 아이템 텍스트가 "우유"이다');

const inputCleared = await page.inputValue('#itemInput');
assert(inputCleared === '', '추가 후 입력창이 비워진다');

// ──────────────────────────────────────────
console.log('\n➕ [3] 아이템 추가 — Enter 키');
// ──────────────────────────────────────────
await page.fill('#itemInput', '달걀');
await page.press('#itemInput', 'Enter');

const afterAdd2 = await page.locator('#list li').count();
assert(afterAdd2 === 2, 'Enter 키로 아이템이 추가돼 총 2개이다');

// ──────────────────────────────────────────
console.log('\n🚫 [4] 빈 값 추가 방지');
// ──────────────────────────────────────────
await page.fill('#itemInput', '   ');
await page.click('button:has-text("추가")');
const afterBlank = await page.locator('#list li').count();
assert(afterBlank === 2, '공백만 입력해도 아이템이 추가되지 않는다');

// ──────────────────────────────────────────
console.log('\n✅ [5] 아이템 체크');
// ──────────────────────────────────────────
const checkbox = page.locator('#list li').first().locator('input[type="checkbox"]');
await checkbox.check();

const isChecked = await checkbox.isChecked();
assert(isChecked, '첫 번째 아이템 체크박스가 체크됐다');

const hasStrike = await page.locator('#list li.checked').count();
assert(hasStrike === 1, '체크된 아이템에 취소선 클래스가 적용됐다');

const summary = await page.locator('#summary').textContent();
assert(summary === '1 / 2 완료', `진행 상황 카운트가 "1 / 2 완료"이다 (실제: "${summary}")`);

// ──────────────────────────────────────────
console.log('\n🔄 [6] 아이템 체크 해제');
// ──────────────────────────────────────────
await checkbox.uncheck();
const isUnchecked = !(await checkbox.isChecked());
assert(isUnchecked, '체크박스를 다시 클릭하면 체크가 해제된다');

const summaryAfterUncheck = await page.locator('#summary').textContent();
assert(summaryAfterUncheck === '0 / 2 완료', `카운트가 "0 / 2 완료"로 돌아온다 (실제: "${summaryAfterUncheck}")`);

// ──────────────────────────────────────────
console.log('\n🗑️ [7] 아이템 삭제');
// ──────────────────────────────────────────
await page.locator('#list li').first().locator('.delete-btn').click();

const afterDelete = await page.locator('#list li').count();
assert(afterDelete === 1, '첫 번째 아이템 삭제 후 1개만 남는다');

const remainingText = await page.locator('#list li .item-text').first().textContent();
assert(remainingText === '달걀', '남은 아이템이 "달걀"이다');

// ──────────────────────────────────────────
console.log('\n💾 [8] localStorage 저장 및 새로고침 후 유지');
// ──────────────────────────────────────────
await page.reload();
const afterReload = await page.locator('#list li').count();
assert(afterReload === 1, '새로고침 후에도 아이템이 유지된다 (localStorage)');

const reloadedText = await page.locator('#list li .item-text').first().textContent();
assert(reloadedText === '달걀', '새로고침 후 "달걀" 아이템이 그대로 남아있다');

// ──────────────────────────────────────────
console.log('\n🗑️ [9] 마지막 아이템 삭제 후 빈 상태 복귀');
// ──────────────────────────────────────────
await page.locator('#list li').first().locator('.delete-btn').click();
const finalEmpty = await page.locator('#empty').isVisible();
assert(finalEmpty, '모든 아이템 삭제 후 빈 리스트 메시지가 다시 보인다');

const finalCount = await page.locator('#list li').count();
assert(finalCount === 0, '최종 아이템 수가 0이다');

// ──────────────────────────────────────────
await browser.close();

console.log(`\n${'─'.repeat(44)}`);
console.log(`결과: ${passed + failed}개 테스트 중 ✅ ${passed}개 통과, ❌ ${failed}개 실패`);
console.log('─'.repeat(44));

if (failed > 0) process.exit(1);