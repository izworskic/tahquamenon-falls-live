import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html=await readFile(new URL('../public/tahquamenon-falls/index.html',import.meta.url),'utf8');
const js=await readFile(new URL('../public/assets/tahquamenon-falls.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/assets/tahquamenon-falls.css',import.meta.url),'utf8');
const seasonal=await readFile(new URL('../public/assets/tahquamenon-seasonal.js',import.meta.url),'utf8');
const seasonalApi=await readFile(new URL('../api/tahquamenon-seasonal-context.js',import.meta.url),'utf8');
const plannerApi=await readFile(new URL('../api/visit-plan.js',import.meta.url),'utf8');
const smoke=await readFile(new URL('../.github/workflows/production-smoke.yml',import.meta.url),'utf8');

const score={};
score.firstScreenUtility =
  html.includes('Plan the Tahquamenon day you actually have.') &&
  html.includes('id="plannerCard"') &&
  html.indexOf('id="plannerCard"') < html.indexOf('id="seasonContext"') &&
  !html.includes('Worth going right now?') ? 15 : 0;

score.personaIntentQuality =
  ['fall_color','scenic_road_trip','crowd_avoidance','camper','destination_explorer','winter_xc'].every(x=>plannerApi.includes(x)) &&
  plannerApi.includes('deterministicResult') &&
  plannerApi.includes('shared-harness-jev') ? 15 : 0;

score.seasonalIntelligence =
  seasonalApi.includes('api/fall-color?view=snapshot') &&
  seasonalApi.includes('modules:{fall,winter,spring,summer}') &&
  js.includes('loadSeasonal()') ? 15 : 0;

score.itineraryQuality =
  seasonal.includes('plannedMinutes(plan)') &&
  seasonal.includes('accessibilityFit') &&
  seasonal.includes("hasStop(plan,'river-trail')") &&
  seasonal.includes('applySeasonalIntelligence') ? 15 : 0;

score.fallNetworkIntegration =
  seasonalApi.includes('shared Michigan fall-color engine') &&
  seasonal.includes('fall-color') &&
  html.includes('seasonLink') ? 10 : 0;

score.xcNetworkIntegration =
  html.includes('xcski.chrisizworski.com') &&
  seasonalApi.includes('straits-eastern-up') &&
  seasonalApi.includes('grooming status must be verified locally') ? 7 : 0;

score.liveIntegrity =
  js.includes('NWS hazard feed is not verified') &&
  js.includes('Upper Falls discharge') &&
  seasonalApi.includes('sourceHealth:{fallColor:fallStatus}') ? 7 : 0;

score.searchArchitecture =
  html.includes('FAQPage') &&
  html.includes('canonical') &&
  seasonalApi.includes('fall-color/tahquamenon-falls-fall-color') ? 5 : 0;

score.mobilePerformance =
  css.includes('@media(max-width:760px)') &&
  js.includes('IntersectionObserver') &&
  !html.includes('react') &&
  !html.includes('vue') ? 5 : 0;

score.reliabilityFallback =
  js.includes("fall:{active:false,available:false}") &&
  plannerApi.includes("harness.result || deterministicResult(s)") &&
  smoke.includes('api/tahquamenon-seasonal-context') &&
  smoke.includes('https://chrisizworski.com/api/visit-plan') ? 5 : 0;

const vetoes=[];
if(seasonalApi.includes('peakStart')) vetoes.push('duplicated fall timing model');
if(/Worth going right now\?|score-orb/.test(html)) vetoes.push('go/no-go waterfall framing returned');
if(plannerApi.includes('api.typesafe.ai')||plannerApi.includes('TYPESAFE_API_KEY')) vetoes.push('direct JEV secret/call in public tool');
if(!plannerApi.includes('deterministicResult')) vetoes.push('JEV required for core planning');
if(!js.includes('NWS hazard feed is not verified')) vetoes.push('NWS degraded-state guard missing');
if(!seasonalApi.includes('not a direct leaf-count observation')) vetoes.push('modeled fall stage provenance missing');
if(!seasonalApi.includes('grooming status must be verified locally')) vetoes.push('XC grooming boundary missing');
if(!smoke.includes('Plain canonical Tahquamenon URL')) vetoes.push('plain canonical production smoke missing');

const total=Object.values(score).reduce((a,b)=>a+b,0);
const max=100;
console.log(JSON.stringify({score,total,max,vetoes},null,2));
assert.equal(vetoes.length,0,'Hard vetoes: '+vetoes.join(', '));
assert(total>=94,`Seasonal release score ${total}/${max} is below 94`);
console.log(`Tahquamenon seasonal release benchmark: ${total}/${max} — PASS`);
