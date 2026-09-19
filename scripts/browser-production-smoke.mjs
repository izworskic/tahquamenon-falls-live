import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const url = process.argv[2] || 'https://chrisizworski.com/tahquamenon-falls/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.message || error)));

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#buildPlanButton', { state: 'visible', timeout: 15000 });

  const time45 = page.locator('#timeChoices button[data-minutes="45"]');
  await time45.click();
  await page.waitForFunction(() => document.querySelector('#timeChoices button[data-minutes="45"]')?.classList.contains('active'));
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
    return el && el.textContent && !/Updating/i.test(el.textContent);
  }, { timeout: 15000 });

  const status = (await page.locator('#jevStatus').innerText()).trim();
  assert.ok(status.length > 0, 'Customize result must be visible');
  assert.equal(await page.locator('#timeChoices button[data-minutes="90"]').evaluate(el => el.classList.contains('active')), true);
  assert.equal(await page.locator('#preferenceChoices button[data-pref="food"]').evaluate(el => el.classList.contains('active')), true);

  assert.deepEqual(pageErrors, [], 'Browser page errors: ' + pageErrors.join(' | '));
  console.log('Tahquamenon browser planner smoke passed');
} finally {
  await browser.close();
}
