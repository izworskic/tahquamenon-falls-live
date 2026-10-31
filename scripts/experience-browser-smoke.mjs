import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, resolve, join, sep } from 'node:path';
import { chromium } from 'playwright';

const publicDir = resolve('public');
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(publicDir, '.' + pathname);
    if (pathname.endsWith('/')) file = join(file, 'index.html');
    if (!file.startsWith(publicDir + sep)) { res.writeHead(403); res.end(); return; }
    const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
    const bytes = await readFile(file);
    res.writeHead(200, {'Content-Type':mime[extname(file)]||'application/octet-stream'});
    res.end(bytes);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(ok => server.listen(0,'127.0.0.1',ok));
const origin = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({headless:true});
const failures = [];
try {
  await mkdir('artifacts',{recursive:true});
  for (const width of [390, 1440]) {
    const context = await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror',e=>{errors.push(e.message);console.error('[browser pageerror]',e.message);});
    page.on('console',msg=>{if(msg.type()==='error')console.error('[browser console]',msg.text().slice(0,550));});
    page.on('response',resp=>{if(resp.url().includes('/assets/')&&resp.status()>=400)console.error('[browser asset error]',resp.status(),resp.url());});
    await page.route('**/api/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"unavailable"}'}));
    await page.goto(origin + '/tahquamenon-falls/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#experienceChooser').waitFor({state:'visible'});
    await page.waitForTimeout(1400);
    console.log('[browser init]', width, JSON.stringify(await page.evaluate(()=>({path:document.querySelector('#experiencePlanPath')?.innerHTML?.slice(0,200),answer:document.querySelector('#answerTitle')?.textContent,script:[...document.scripts].filter(x=>x.type==='module').map(x=>x.src)}))), 'errors=',errors);
    await page.screenshot({path:'artifacts/experience-tahquamenon-init-'+width+'.png',fullPage:false,animations:'disabled'});
    await page.waitForFunction(()=>document.querySelectorAll('#experiencePlanPath button').length>0,{},{timeout:6000});
    await page.locator('#timeChoices button[data-minutes="45"]').click();
    await page.waitForFunction(()=>!document.querySelector('#experiencePlanPath')?.textContent.includes('Lower Falls'));
    assert.equal(await page.locator('#experiencePlanPath button[data-experience-plan-stop="lower-falls"]').count(),0,'45-minute plan should not contain Lower');
    await page.locator('#timeChoices button[data-minutes="180"]').click();
    await page.waitForFunction(()=>document.querySelector('#experiencePlanPath')?.textContent.includes('Lower Falls'));
    assert.equal(await page.locator('#experiencePlanPath button[data-experience-plan-stop="lower-falls"]').count(),1);
    await page.locator('[data-experience-place="lower-falls"]').click();
    await page.waitForFunction(()=>document.querySelector('#placeTitle')?.textContent==='Lower Falls');
    assert.equal(await page.locator('[data-experience-place="lower-falls"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#experiencePanelPhotoCredit').innerText(),/Joe Passe/);
    await page.locator('[data-experience-place="island-bridge"]').click();
    await page.waitForFunction(()=>/Ronald A/.test(document.querySelector('#placeTitle')?.textContent||''));
    await page.locator('#addPlaceButton').click();
    assert.equal(await page.locator('#experiencePlanPath button[data-experience-plan-stop="island-bridge"]').count(),1);
    await page.locator('#filterRow button[data-filter="trail"]').click();
    await page.locator('#experienceBrowse summary').click();
    await page.locator('#experienceStopList [data-experience-stop="river-trail"]').click();
    await page.waitForFunction(()=>/River Trail/.test(document.querySelector('#placeTitle')?.textContent||''));
    assert.equal(await page.locator('#filterRow button[data-filter="trail"]').getAttribute('class'),'active','Choosing a trail within the active filter should keep that filter');
    await page.locator('[data-experience-place="upper-falls"]').click();
    await page.waitForFunction(()=>document.querySelector('#placeTitle')?.textContent==='Upper Falls');
    assert.equal(await page.locator('#filterRow button[data-filter="all"]').getAttribute('class'),'active','Choosing Upper Falls from a trail-only filter must restore All');
    const dims = await page.evaluate(()=>({window:innerWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(dims.scroll<=dims.window+1, 'Horizontal overflow at '+width+': '+JSON.stringify(dims));
    assert.deepEqual(errors,[],'page errors at '+width);
    await page.screenshot({path:'artifacts/experience-tahquamenon-'+width+'.png',fullPage:true,animations:'disabled'});
    await context.close();
  }
  const noJs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:800}});
  const staticPage=await noJs.newPage();
  await staticPage.goto(origin+'/tahquamenon-falls/');
  assert.ok(await staticPage.locator('#experienceStopList a[href*="michigan.gov"]').count()>=3,'Static DNR fallback links needed');
  assert.ok(await staticPage.locator('.experience-photo-credit').count()===3,'Photo credits must be in static HTML');
  await noJs.close();

  const offline=await browser.newContext({viewport:{width:390,height:800}});
  await offline.route('**/unpkg.com/**',route=>route.abort());
  const broken=await offline.newPage();
  await broken.route('**/api/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await broken.goto(origin+'/tahquamenon-falls/',{waitUntil:'domcontentloaded'});
  await broken.locator('[data-experience-place="lower-falls"]').click();
  await broken.waitForFunction(()=>document.querySelector('#placeTitle')?.textContent==='Lower Falls');
  await broken.waitForFunction(()=>Boolean(document.querySelector('.experience-map-fallback')),{timeout:15000});
  assert.ok(await broken.locator('#placeLink[href^="https://"]').count()===1,'Official source must survive blocked map library');
  assert.ok(await broken.locator('#parkMap').evaluate(el=>el.getBoundingClientRect().height < 150), 'A failed map must collapse to a compact notice');
  await broken.screenshot({path:'artifacts/experience-tahquamenon-map-fallback.png',fullPage:true,animations:'disabled'});
  await offline.close();
  console.log('Experience browser smoke passed: 390/1440px, plan causality, photo/map selection, stop-list filter, add stop, no-JS and map-CDN failure.');
} catch (error) {
  failures.push(String(error.stack || error));
  throw error;
} finally {
  await browser.close();
  await new Promise(ok=>server.close(ok));
}
