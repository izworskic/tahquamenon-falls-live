import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = process.argv[2] || 'https://chrisizworski.com/tahquamenon-falls/';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.message || error)));

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#buildPlanButton', { state: 'visible', timeout: 15000 });

  const time45 = page.locator('#timeChoices button[data-minutes="45"]');
  await time45.click();
  assert.equal(await time45.evaluate(el => el.classList.contains('active')), true);
  assert.match(await page.locator('#answerTitle').innerText(), /Upper Falls visit/i);

  const kids = page.locator('#preferenceChoices button[data-pref="kids"]');
  await kids.click();
  assert.equal(await kids.evaluate(el => el.classList.contains('active')), true);

  const time180 = page.locator('#timeChoices button[data-minutes="180"]');
  await time180.click();
  await page.locator('#buildPlanButton').click();
  await page.waitForFunction(() => /Lower first/i.test(document.querySelector('#answerTitle')?.textContent || ''));
  assert.match(await page.locator('#answerTitle').innerText(), /Lower first/i);

  await page.locator('#customPlan summary').click();
  await page.locator('#situationInput').fill('90 minutes, want lunch');
  await page.locator('#customPlanSubmit').click();
  await page.waitForFunction(() => {
    const el = document.querySelector('#jevStatus');
    return Boolean(el?.textContent && !/Updating/i.test(el.textContent));
  }, { timeout: 15000 });

  assert.equal(await page.locator('#timeChoices button[data-minutes="90"]').evaluate(el => el.classList.contains('active')), true);
  assert.equal(await page.locator('#preferenceChoices button[data-pref="food"]').evaluate(el => el.classList.contains('active')), true);

  assert.deepEqual(pageErrors, [], 'Browser page errors: ' + pageErrors.join(' | '));
  console.log('Tahquamenon live planner browser smoke passed');
} finally {
  await browser.close();
}
