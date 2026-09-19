import assert from 'node:assert/strict';
import { inferVisitPreferences, inferIntentSignals, inferMinutes, sanitizeClientState, deterministicResult } from '../api/visit-plan.js';
import { baseSeason, normalizeFall, winterModule } from '../api/tahquamenon-seasonal-context.js';
import { applySeasonalIntelligence, plannedMinutes, itineraryValue, visitorValue, growthValue, totalProductValue } from '../public/assets/tahquamenon-seasonal.js';

const fallPayload = {
  updated:'2026-09-19T16:00:00.000Z',
  inSeason:true,
  regions:[{
    id:'eup', label:'Approaching peak', phase:'rising', pct:78,
    peakWindow:'Oct 1 to Oct 9', weatherFeel:'mixed skies, highs near 60',
    drive:'M-123 through the Tahquamenon country',
    hike:"The river trail between Tahquamenon's upper and lower falls",
    source:{drivers:['regional climatology','recent weather']}
  }]
};
const fall = normalizeFall(fallPayload,'fall-color',new Date('2026-09-19T20:00:00.000Z'));
assert.equal(fall.active,true);
assert.equal(fall.available,true);
assert.equal(fall.phase,'rising');
assert.match(fall.basis,/Modeled eastern U\.P\./);
assert.equal(baseSeason(new Date('2026-09-19T16:00:00-04:00')),'fall');
assert.equal(baseSeason(new Date('2027-01-15T12:00:00-05:00')),'winter');
assert.equal(winterModule('xc',new Date('2026-09-19T16:00:00-04:00')).active,true);

assert.deepEqual(inferVisitPreferences('Two kids, photos and a hike',[]),['kids','hike','photo']);
const road = inferIntentSignals('Full day fall color road trip through M-123 and Paradise',480,['photo']);
assert.equal(road.fallColor,true);
assert.equal(road.scenicRoadTrip,true);
assert.equal(road.destinationExplorer,true);
assert.equal(road.seasonalInterest,'fall_color');
const quiet = inferIntentSignals('We are camping and want fewer people',300,[]);
assert.equal(quiet.camper,true);
assert.equal(quiet.crowdAvoidance,true);
assert.equal(inferVisitPreferences('My mom and I have three hours',[]).includes('easy'),false);

const parsed = sanitizeClientState({query:'Two kids, 77-year-old mom with a walker, fall color photos, lunch, 2 hours',minutes:480,preferences:[]});
assert.equal(parsed.minutes,120);
for (const pref of ['kids','easy','photo','food']) assert(parsed.preferences.includes(pref));
assert.equal(parsed.signals.fallColor,true);
const fallback = deterministicResult(parsed);
assert.equal(fallback.persona,'accessibility');
assert.equal(fallback.seasonalInterest,'fall_color');

const core = {
  title:'Upper first, then Lower',
  summary:'Core visit',
  order:'Upper → Lower',
  walking:'Moderate',
  stops:[
    {id:'upper-falls',minutes:55,title:'Upper',text:'Signature falls',tag:'Upper'},
    {id:'lower-falls',minutes:55,title:'Lower',text:'Explore',tag:'Lower'}
  ]
};
const seasonal = {season:'fall',modules:{fall,winter:{active:false,available:true}}};
const enhanced = applySeasonalIntelligence(core,{minutes:180,prefs:new Set(['photo']),intent:'fall-color',persona:'fall_color',seasonal,live:{alertStatus:{verified:true},alerts:[]}});
assert.equal(enhanced.seasonalEmphasis,'fall-color');
assert(plannedMinutes(enhanced) <= 180);
assert.match(enhanced.stops[0].text,/gorge/i);
assert(itineraryValue(enhanced,{minutes:180,prefs:new Set(['photo']),intent:'fall-color',persona:'fall_color',seasonal}).score >= 70);

const easyPlan = {
  title:'Easy visit',summary:'',order:'Upper only',walking:'Easy',
  stops:[
    {id:'upper-boardwalk',minutes:15,title:'Boardwalk',text:'Accessible',tag:'Easy'},
    {id:'upper-falls',minutes:40,title:'Falls',text:'View',tag:'Falls'}
  ]
};
const easyEnhanced=applySeasonalIntelligence(easyPlan,{minutes:90,prefs:new Set(['easy']),intent:'fall-color',persona:'accessibility',seasonal});
assert(!easyEnhanced.stops.some(s=>s.id==='river-trail'));
assert.match(easyEnhanced.stops[0].text,/low-effort/i);

const longEnhanced=applySeasonalIntelligence(core,{minutes:480,prefs:new Set(['photo']),intent:'fall-color',persona:'scenic_road_trip',seasonal});
assert(longEnhanced.optionalExtension);
assert.equal(longEnhanced.optionalExtension.id,'m123-paradise');
assert(plannedMinutes(longEnhanced)<=480);

const values=totalProductValue(enhanced,{minutes:180,prefs:new Set(['photo']),intent:'fall-color',persona:'fall_color',seasonal});
assert(values.visitor>=70);
assert(values.growth>=70);
assert(values.total>=70);
assert.equal(visitorValue(enhanced,{minutes:180,prefs:new Set(['photo']),intent:'fall-color',persona:'fall_color',seasonal}),values.visitor);
assert.equal(growthValue(enhanced,{minutes:180,prefs:new Set(['photo']),intent:'fall-color',persona:'fall_color',seasonal}),values.growth);

assert.equal(inferMinutes('half day',180),300);
console.log('Tahquamenon seasonal persona/value tests passed');
