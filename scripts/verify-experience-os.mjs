import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { plannedExperiences, featuredStatuses, FEATURED } from '../public/assets/tahquamenon-experience.js';

const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [html,css,app,places,experience] = await Promise.all([
  read('public/tahquamenon-falls/index.html'),
  read('public/assets/tahquamenon-experience.css'),
  read('public/assets/tahquamenon-falls.js'),
  read('public/tahquamenon-falls/data/places.js'),
  read('public/assets/tahquamenon-experience.js')
]);
assert.equal(FEATURED.length,3);
const testPlaces=[{id:'upper-boardwalk',name:'Upper Falls Boardwalk'},{id:'upper-falls',name:'Upper Falls'},{id:'lower-falls',name:'Lower Falls'},{id:'island-bridge',name:'Island Bridge'}];
const short=plannedExperiences({stops:[{id:'upper-boardwalk'},{id:'upper-falls'},{id:'upper-falls'}]},testPlaces);
const long=plannedExperiences({stops:[{id:'upper-falls'},{id:'lower-falls'},{id:'island-bridge'},{id:'bogus'}]},testPlaces);
assert.deepEqual(short.map(p=>p.id),['upper-boardwalk','upper-falls']);
assert.deepEqual(long.map(p=>p.id),['upper-falls','lower-falls','island-bridge']);
assert.deepEqual(featuredStatuses({stops:[{id:'upper-falls'}]},testPlaces).map(p=>p.inPlan),[true,false,false]);
for(const id of ['experienceChooser','experiencePlanPath','experienceStopList','experiencePanelPhoto','experienceBrowse','experiencePlanSummary']){
 assert(html.includes('id="'+id+'"'), 'Missing progressive UI landmark '+id);
}
for(const id of ['upper-falls','lower-falls','island-bridge'])assert(html.includes('data-experience-place="'+id+'"'));
for(const term of ['Wfgc','Joe Passe','Notorious4life','public domain','CC BY-SA 2.0','CC0'])assert(html.includes(term));
assert(html.includes('https://chrisizworski.com/tahquamenon-falls/'), 'Canonical must stay unchanged');
assert(html.includes('https://chrisizworski.com/#person'), 'Person graph must stay unchanged');
assert(html.includes('FAQPage'), 'FAQ schema must be retained');
assert(html.includes('id="planTimeline"'), 'Existing itinerary must remain');
assert(html.includes('id="parkMap"'), 'Original map remains authoritative');
assert(html.includes('id="seasonContext"'), 'Existing seasonal intelligence remains');
assert(app.includes("import { createExperience }"),'Experience bridge must load');
assert(app.includes('experience?.renderPlan(plan, state.minutes)'), 'Plan must synchronize');
assert(app.includes('experience?.select(place)'), 'Map selection must synchronize');
assert(app.includes('showMapFallback'), 'Map must have a visible fallback');
assert(app.includes('tiles.on(\'tileerror\''), 'Map must report unloaded tiles');
assert(places.includes('no walking or snowshoeing'), 'Groomed ski tracks cannot be advertised as a walking path');
assert(places.includes('Do not rely on road walking as a fallback'), 'Shuttle caveat missing');
assert(!places.includes('Open to hiking/snowshoeing'), 'Old contradicted ski advice returned');
assert(experience.includes('https://commons.wikimedia.org/'), 'Original photo provenance must remain');
assert(css.includes('@media(max-width:600px)'), 'Phone layout required');
assert(css.includes(':focus-visible'), 'Keyboard-visible focus required');
assert(!css.includes('display:none!important'), 'Do not hide content from browsers');
console.log('EXPERIENCE_OS Tahquamenon static, provenance, truth and state-model checks passed.');
