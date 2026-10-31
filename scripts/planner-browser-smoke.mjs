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

  const plannerScript = await page.locator('script[src*="tahquamenon-falls.js"]').getAttribute('src');
  console.log('plannerScript=', plannerScript);
  console.log('pageErrorsBeforeClick=', JSON.stringify(pageErrors));
  const time45 = page.locator('#timeChoices button[data-minutes="45"]');
  await time45.click();
  console.log('time45ClassAfterClick=', await time45.getAttribute('class'));
  console.log('pageErrorsAfterClick=', JSON.stringify(pageErrors));
  assert.equal(await time45.evaluate(el => el.classList.contains('active')), true);
  assert.match(await page.locator('#answerTitle').innerText(), /Upper Falls visit/i);

  // This runs on the PUBLIC canonical domain: the hub must proxy the imported
  // EXPERIENCE_OS JS/CSS as well as the original planner assets.
  await page.locator('#experienceChooser').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#experiencePlanPath [data-experience-plan-stop="lower-falls"]').count(),0,
    '45-minute visit should not include Lower Falls in the connected stop strip');
  for (const asset of ['tahquamenon-experience.js','tahquamenon-experience.css']) {
    const destination=new URL('/assets/'+asset,url).href;
    const response=await page.request.get(destination);
    assert.equal(response.status(),200,'public hub must serve '+asset);
  }

  const kids = page.locator('#preferenceChoices button[data-pref="kids"]');
  await kids.click();
  assert.equal(await kids.evaluate(el => el.classList.contains('active')), true);

  const time180 = page.locator('#timeChoices button[data-minutes="180"]');
  await time180.click();
  await page.locator('#buildPlanButton').click();
  await page.waitForFunction(() => /Lower first/i.test(document.querySelector('#answerTitle')?.textContent || ''));
  assert.match(await page.locator('#answerTitle').innerText(), /Lower first/i);
  assert.equal(await page.locator('#experiencePlanPath [data-experience-plan-stop="lower-falls"]').count(),1,
    '3-hour visit should include Lower Falls in connected stop strip');
  const lower=page.locator('#experienceChooser [data-experience-place="lower-falls"]');
  await lower.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('#placeTitle')?.textContent==='Lower Falls',{},{timeout:15000});
  assert.equal(await lower.getAttribute('aria-pressed'),'true','photo select must synchronize');
  assert.match(await page.locator('#experiencePanelPhotoCredit').innerText(),/Joe Passe/);
  assert.match(await page.locator('#placeLink').getAttribute('href'),/^https:\/\//);
  console.log('experiencePublicPhotoSelection= ok');

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
  console.log('Tahquamenon public planner and EXPERIENCE_OS browser smoke passed');
} finally {
  await browser.close();
}
