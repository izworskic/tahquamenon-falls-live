import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inferVisitPreferences, inferMinutes, sanitizeClientState, deterministicResult, oidcToken } from '../api/visit-plan.js';

assert.deepEqual(inferVisitPreferences('My 77-year-old mom uses a walker and we want lunch', []), ['easy','food']);
assert.deepEqual(inferVisitPreferences('Two kids, we want photos and a hike', []), ['kids','hike','photo']);
assert.deepEqual(inferVisitPreferences('My mom and I have three hours', []), []);
assert.equal(inferMinutes('We have about 2 hours before dinner', 180), 120);
assert.equal(inferMinutes('Half day please', 180), 300);

const clean = sanitizeClientState({ query:'My 77-year-old grandma, two kids, 90 minutes', minutes:480, preferences:['photo','bogus'] });
assert.equal(clean.minutes, 90);
assert(clean.preferences.includes('easy'));
assert(clean.preferences.includes('kids'));
assert(clean.preferences.includes('photo'));
assert(!clean.preferences.includes('bogus'));
assert.equal(deterministicResult(clean).engine, 'deterministic');
assert.equal(oidcToken({headers:{'x-vercel-oidc-token':'abc123'}}), 'abc123');

const html = await readFile(new URL('../public/tahquamenon-falls/index.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../public/assets/tahquamenon-falls.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../public/assets/tahquamenon-falls.css', import.meta.url), 'utf8');
const plannerApi = await readFile(new URL('../api/visit-plan.js', import.meta.url), 'utf8');
assert(html.includes('Plan the Tahquamenon day you actually have.'), 'Visit-first hero missing');
assert(!html.includes('Worth going right now?'), 'Old go/no-go framing must stay removed');
assert(!html.includes('score-orb'), 'Old waterfall score must stay removed');
assert(html.includes('xcski.chrisizworski.com'), 'XC cross-link missing');
assert(html.includes('FAQPage'), 'FAQ structured data missing');
assert(html.includes('1,100-foot accessible boardwalk'), 'Accessibility search content missing');
assert(html.includes('3.8-mile Giant Pines Loop'), 'Winter ski content missing');
assert(js.includes('tahquamenon.visit.v2'), 'Local-first planner state missing');
assert(js.includes('/api/visit-plan'), 'Structured visitor-intent endpoint missing');
assert(js.includes('IntersectionObserver'), 'Lazy map loading missing');
assert(css.includes('@media(max-width:660px)'), 'Mobile layout gate missing');
assert(plannerApi.includes('agentbase-registry.vercel.app/api/harness'), 'Shared harness route missing');
assert(plannerApi.includes('x-vercel-oidc-token'), 'Vercel OIDC caller auth missing');
assert(!plannerApi.includes('api.typesafe.ai'), 'Tool project must not call TypeSafe directly');
assert(!plannerApi.includes('TYPESAFE_API_KEY'), 'Tool project must not receive the shared JEV key');
console.log('Tahquamenon visit-engine rebuild checks passed');
