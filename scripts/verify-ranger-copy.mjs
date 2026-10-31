import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [html,placesJs,planner,css]=await Promise.all([
 read('public/tahquamenon-falls/index.html'),
 read('public/tahquamenon-falls/data/places.js'),
 read('public/assets/tahquamenon-falls.js'),
 read('public/assets/tahquamenon-experience.css')
]);
const data={window:{}};
vm.runInNewContext(placesJs,data,{timeout:1000});
const places=data.window.TAHQUAMENON_PLACES;
assert.equal(places.length,17,'All original park locations must remain');
for(const p of places){
 assert.ok(p.description?.split(/\s+/).length>=35,p.id+' needs a substantial, useful park explanation');
 assert.ok(p.description?.split(/\s+/).length<=135,p.id+' should remain scannable in a map panel');
 assert.ok(p.kicker?.length>=9,p.id+' needs a meaningful label');
 assert.ok(/^https:\/\//.test(p.url),p.id+' must keep source link');
}
assert.ok(places.find(x=>x.id==='upper-boardwalk').description.includes('1,100-foot accessible boardwalk'),'Boardwalk description retained');
assert.ok(places.find(x=>x.id==='river-trail').description.includes('5.1-mile River Trail'),'Route context retained');
assert.ok(places.find(x=>x.id==='river-trail').description.includes('M-123'),'Unsafe roadside alternative must be explicit');
assert.ok(places.find(x=>x.id==='winter-trail-system').description.includes('no walking or snowshoeing'),'Ski track warning must remain');
const stories=[...html.matchAll(/<article class="ranger-story">([\s\S]*?)<\/article>/g)].map(x=>x[1]);
assert.equal(stories.length,4,'Four interpretive chapters are required');
for(const story of stories){
 const text=story.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 assert.ok(text.split(/\s+/).length>=65,'Field notes must explain the place, not add filler');
 assert.ok(text.split(/\s+/).length<=175,'Ranger chapter should remain readable');
 assert.match(story,/https:\/\/www\.michigan\.gov|href="#upperLower"/,'Field notes must cite official park details or local choices');
}
for(const word of ['natural tannins','old-growth forest','Ronald A. Olson Island Bridge','designated wading areas','groomed ski tracks']){
 assert.ok(html.includes(word)||placesJs.includes(word),'Missing grounded visitor guidance: '+word);
}
assert.match(html,/id="rangerNotes"/);
assert.match(html,/id="experienceChooser"/);
assert.match(html,/id="parkMap"/);
assert.match(html,/id="planTimeline"/);
assert.match(html,/https:\/\/chrisizworski\.com\/#person/);
assert.match(html,/<link rel="canonical" href="https:\/\/chrisizworski\.com\/tahquamenon-falls\/">/);
assert.match(html,/<script type="application\/ld\+json">/);
const jsonld=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(jsonld,'Expected canonical JSON-LD block');
assert.doesNotThrow(()=>JSON.parse(jsonld),'Structured data must parse strictly');
assert.ok(planner.includes('function corePlan()'));
assert.match(planner,/No new constraint found\./);
assert.match(planner,/Upper Falls discharge/);
assert.match(planner,/NWS hazard feed is not verified/);
assert.match(css,/\.ranger-notes-grid/);
assert.match(css,/\.guide-section \.guide-grid p\{font-size:14px/,'Guide prose must be readable, not 10px');
assert.ok(!html.includes('Official Michigan DNR ranger'),'Do not impersonate park staff');
console.log('Tahquamenon ranger voice, source, SEO and accessibility-copy contracts passed.');
