import { applySeasonalIntelligence, plannedMinutes, totalProductValue } from '/assets/tahquamenon-seasonal.js?v=seasonal-20260919-v1';
const STORAGE_KEY = 'tahquamenon.visit.v2';
const API_URL = '/api/tahquamenon-falls';
const PLAN_API_URL = '/api/visit-plan';
const SEASONAL_API_URL = '/api/tahquamenon-seasonal-context';
const DNR_URL = 'https://www.michigan.gov/recsearch/parks/tahquamenonfalls';

const state = {
  minutes: 180,
  prefs: new Set(),
  live: null,
  customStops: [],
  activeFilter: 'all',
  selectedPlace: null,
  map: null,
  markers: [],
  mapPromise: null,
  inferred: null,
  seasonal: null,
  intent: ['fall-color','xc'].includes(new URLSearchParams(location.search).get('intent')) ? new URLSearchParams(location.search).get('intent') : null,
  persona: null
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const places = () => Array.isArray(window.TAHQUAMENON_PLACES) ? window.TAHQUAMENON_PLACES : [];

function track(name, params = {}) {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  } catch {}
}

function safeIntentFromUrl() {
  const value = new URLSearchParams(location.search).get('intent');
  return ['fall-color','xc'].includes(value) ? value : null;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ minutes: state.minutes, prefs: [...state.prefs], customStops: state.customStops }));
  } catch {}
}

function restoreState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if ([45,90,180,300,480].includes(raw.minutes)) state.minutes = raw.minutes;
    if (Array.isArray(raw.prefs)) state.prefs = new Set(raw.prefs.filter(Boolean));
    if (Array.isArray(raw.customStops)) state.customStops = raw.customStops.filter(id => places().some(p => p.id === id));
  } catch {}
}

function formatMinutes(total) {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const min = total % 60;
  return min ? `${hours} hr ${min} min` : `${hours} hr`;
}

function stop(id, minutes, title, text, tag = '') { return { id, minutes, title, text, tag }; }

function corePlan() {
  const m = state.minutes;
  const p = state.prefs;
  const winter = p.has('winter');
  const easy = p.has('easy');
  const kids = p.has('kids');
  const hike = p.has('hike');
  const photo = p.has('photo');
  const food = p.has('food');

  if (winter) {
    const ski = [
      stop('upper-falls', 35, 'Start with the Upper Falls winter view', 'Use the short, high-value waterfall stop first while everyone is warm and fresh.', 'Upper Falls'),
      stop('winter-trail-system', m <= 90 ? 45 : 90, m <= 90 ? 'Ski the Lantern Loop' : 'Ski Lantern + part or all of Giant Pines', m <= 90 ? 'The 1-mile Lantern Loop is the cleanest fit for a short winter visit.' : 'The groomed Upper Falls network includes the 1-mile Lantern Loop and 3.8-mile Giant Pines Loop. Verify current grooming before driving.', 'Cross-country ski')
    ];
    if (m >= 180) ski.push(stop('lower-falls', 45, 'Add Lower Falls if roads and daylight cooperate', 'The winter contrast between the two falls areas is worth the extra drive when conditions are comfortable.', 'Lower Falls'));
    return { title: 'Make it a winter falls + ski day.', summary: 'Use the Upper Falls as your anchor, then let snow conditions decide how much of the groomed network you ski.', order: 'Upper → ski trails', walking: 'Winter', stops: ski };
  }

  if (m <= 45) return {
    title: 'Make this an Upper Falls visit.',
    summary: 'Do one thing well. The signature waterfall gives you the biggest return for a short stop.',
    order: 'Upper only', walking: easy ? 'Easy' : 'Light',
    stops: [stop('upper-boardwalk', 10, 'Park at Upper Falls and take the accessible approach', 'Use the boardwalk and paved route toward the main viewing area.', 'Upper Falls'), stop('upper-falls', 30, 'Spend your time at the main overlooks', 'Do not burn a short visit driving between areas. Get the signature view and leave satisfied.', 'Best use of 45 min')]
  };

  if (m <= 90) {
    const s = [stop('upper-boardwalk', 15, 'Start at Upper Falls', 'Take the accessible boardwalk/paved approach and settle into the park before chasing extra stops.', 'Upper Falls'), stop('upper-falls', 40, easy ? 'Use the accessible viewpoints' : 'See the brink, then choose one more overlook', easy ? 'Skip unnecessary stairs and use the new boardwalk plus accessible viewpoints.' : 'If legs and time are good, add another viewpoint. Do not turn this into a speed run.', 'Signature stop')];
    if (food) s.push(stop('brewery', 30, 'Use the brewery as your finish', 'It is already in the Upper Falls area, so food does not cost another drive.', 'Food'));
    else s.push(stop('fact-shack', 10, 'Use the remaining minutes locally', 'Fact Shack or a relaxed walk is a better use of the margin than driving to Lower Falls and rushing it.', 'No rush'));
    return { title: 'Stay at Upper Falls and do it properly.', summary: 'Ninety minutes is enough for a good Upper Falls visit, but not enough to make both areas feel relaxed.', order: 'Upper only', walking: easy ? 'Easy' : 'Light', stops: s };
  }

  const first = kids ? 'lower' : 'upper';
  const steps = [];
  if (first === 'upper') {
    steps.push(stop('upper-falls', easy ? 45 : 55, 'Start at Upper Falls', easy ? 'Use the accessible boardwalk and main viewing platforms.' : 'Get the signature waterfall first, then decide whether an extra overlook is worth the stairs.', 'Signature view'));
    if (food) steps.push(stop('brewery', 45, 'Eat without leaving the route', 'The brewery is in the Upper Falls area, so lunch fits cleanly before the drive to Lower Falls.', 'Food'));
    steps.push(stop('lower-falls', 55, 'Drive 4 miles to Lower Falls', kids ? 'Give kids the more interactive half of the visit: bridge, island and multiple cascades.' : 'Slow the pace here. Lower Falls rewards wandering more than one viewpoint.', 'Lower Falls'));
  } else {
    steps.push(stop('lower-falls', 70, 'Start at Lower Falls', 'Let kids move first: island access, bridge, boardwalks and multiple cascades make this the more interactive stop.', 'Kid-friendly start'));
    steps.push(stop('upper-falls', 50, 'Finish with the big waterfall', 'End with the park signature so the day builds toward the classic view.', 'Upper Falls'));
    if (food) steps.push(stop('brewery', 40, 'Finish with food at Upper Falls', 'No additional drive required.', 'Food'));
  }

  if (m >= 300) {
    if (hike && !easy) steps.splice(1, 0, stop('river-trail', 150, 'Use the River Trail for the active part of the day', 'The trail is about 5.1 miles one way and hikes harder than its mileage. Confirm seasonal shuttle timing before relying on a one-way hike.', 'Serious hike'));
    else steps.splice(first === 'upper' ? steps.length : 1, 0, stop('island-bridge', 35, 'Walk onto the Lower Falls island', 'The bridge and island turn Lower Falls from a quick overlook into an experience.', 'Worth the extra time'));
  }

  if (m >= 480 && photo) steps.push(stop('rivermouth-sunset', 60, 'Save Rivermouth for the light', 'If sunset timing works, finish where the river meets Lake Superior for a different photo environment.', 'Photo finish'));
  else if (m >= 480 && !hike) steps.push(stop('clark-lake-trail', 70, 'Add a quieter trail', 'Trade a little waterfall crowding for forest and a backcountry feel.', 'Quiet extra'));

  return {
    title: first === 'lower' ? 'Lower first, then finish at Upper Falls.' : 'Upper first, then give Lower Falls more room.',
    summary: kids ? 'With kids, the island and multiple cascades make Lower Falls the better place to spend the larger block of time.' : 'See the signature waterfall early, then use the rest of the visit for the more exploratory Lower Falls area.',
    order: first === 'lower' ? 'Lower → Upper' : 'Upper → Lower',
    walking: easy ? 'Easy' : hike ? 'Active' : 'Moderate',
    stops: steps
  };
}

function basePlan() {
  const core = corePlan();
  return applySeasonalIntelligence(core, {
    minutes: state.minutes,
    prefs: state.prefs,
    intent: state.intent,
    persona: state.persona,
    seasonal: state.seasonal,
    live: state.live
  });
}

function liveNote(plan) {
  const d = state.live;
  if (!d) return 'Live weather, river, daylight and hazard context is still loading. The itinerary itself does not depend on a waterfall score.';
  const notes = [];
  if (plan?.seasonalReason) notes.push(plan.seasonalReason);
  const temp = Number(d.weather?.tempF);
  const wind = Number(d.weather?.windMph);
  const rain = Number(d.weather?.precipChance);
  if (Number.isFinite(temp)) {
    if (temp >= 82) notes.push(`${Math.round(temp)}°F: put longer walking earlier and use Lower Falls water/forest shade as the day heats up.`);
    else if (temp <= 36) notes.push(`${Math.round(temp)}°F: keep stops tighter and treat wet boardwalks or stairs cautiously.`);
    else notes.push(`${Math.round(temp)}°F: comfortable temperature for the planned walking.`);
  }
  if (Number.isFinite(wind) && wind >= 20) notes.push(`${Math.round(wind)} mph wind: exposed overlooks may feel much colder.`);
  if (Number.isFinite(rain) && rain >= 55) notes.push(`${Math.round(rain)}% precipitation chance: prioritize the signature stops before optional trails.`);
  if (d.alertStatus?.verified === false) notes.push('NWS hazard feed is not verified right now; check the official forecast before committing to long trails or river access.');
  else if (Array.isArray(d.alerts) && d.alerts.length) notes.push(`${d.alerts.length} active NWS alert${d.alerts.length === 1 ? '' : 's'}: review before using exposed trails or water access.`);
  const flow = Number(d.river?.cfs);
  if (Number.isFinite(flow)) notes.push(`Upper Falls discharge is ${Math.round(flow).toLocaleString()} cfs. That changes spray and visual force, not whether the park is worth visiting.`);
  return notes.join(' ') || 'Live conditions are not forcing a change to this itinerary.';
}

function renderPlan() {
  const plan = basePlan();
  const custom = state.customStops.map(id => places().find(p => p.id === id)).filter(Boolean);
  custom.forEach(p => plan.stops.push(stop(p.id, 20, p.name, p.description, 'Added by you')));
  $('#answerTitle').textContent = plan.title;
  $('#answerSummary').textContent = plan.summary;
  const planned = plannedMinutes(plan);
  $('#planDuration').textContent = planned <= state.minutes ? `~${formatMinutes(planned)} planned` : `Over by ${formatMinutes(planned-state.minutes)}`;
  $('#fallsOrder').textContent = plan.order;
  $('#walkingLevel').textContent = plan.walking;
  $('#planTimeline').innerHTML = plan.stops.map((s, idx) => `<li data-stop="${s.id}"><span class="time">${s.tag || `STOP ${idx + 1}`} · ~${formatMinutes(s.minutes)}</span><h3>${s.title}</h3><p>${s.text}</p>${state.customStops.includes(s.id) ? `<button class="remove-stop" data-remove-stop="${s.id}" type="button">Remove from plan</button>` : ''}</li>`).join('');
  $('#liveAdjustment').innerHTML = `<strong>Live adjustment</strong><p>${liveNote(plan)}</p>`;
  renderSeasonExtension(plan);
  $$('.remove-stop').forEach(btn => btn.addEventListener('click', () => { state.customStops = state.customStops.filter(id => id !== btn.dataset.removeStop); saveState(); renderPlan(); }));
  saveState();
}

function syncControls() {
  $$('#timeChoices button').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.minutes) === state.minutes));
  $$('#preferenceChoices button').forEach(btn => btn.classList.toggle('active', state.prefs.has(btn.dataset.pref)));
}

function seasonalHeadline(fall) {
  if (!fall?.available) return 'Fall-color intelligence is temporarily unavailable.';
  if (fall.phase === 'peak') return 'Color is at or near peak across the eastern U.P.';
  if (fall.phase === 'rising') return Number(fall.pct) >= 75 ? 'Color is getting close to peak.' : 'Color is building across the eastern U.P.';
  if (fall.phase === 'falling') return 'Peak color is beginning to fade.';
  if (fall.phase === 'green') return 'The eastern U.P. is still mostly green.';
  return fall.label || 'Fall color is active.';
}

function renderSeasonExtension(plan) {
  const box = $('#seasonExtension');
  if (!box) return;
  if (plan?.optionalExtension) {
    box.hidden = false;
    $('#seasonExtensionTitle').textContent = plan.optionalExtension.title;
    $('#seasonExtensionText').textContent = plan.optionalExtension.text;
  } else {
    box.hidden = true;
    $('#seasonExtensionTitle').textContent = '';
    $('#seasonExtensionText').textContent = '';
  }
}

function renderSeasonal() {
  const surface = $('#seasonContext');
  if (!surface || !state.seasonal?.modules) return;
  const { fall, winter } = state.seasonal.modules;
  let module = null, kind = null;
  if (fall?.active) { module = fall; kind = 'fall'; }
  else if (winter?.active) { module = winter; kind = 'winter'; }
  if (!module) {
    surface.hidden = true;
    return;
  }

  surface.hidden = false;
  if (kind === 'fall') {
    $('#seasonKicker').textContent = `FALL COLOR · ${module.available ? String(module.label || 'ACTIVE').toUpperCase() : 'CHECK UNAVAILABLE'}`;
    $('#seasonHeadline').textContent = seasonalHeadline(module);
    const pieces = [];
    if (module.peakWindow) pieces.push(`Typical model peak window: ${module.peakWindow}.`);
    if (module.weatherFeel) pieces.push(module.weatherFeel + '.');
    pieces.push(module.basis || 'Seasonal model context.');
    $('#seasonDetail').textContent = pieces.join(' ');
    $('#seasonLink').href = module.href || 'https://chrisizworski.com/fall-color/tahquamenon-falls-fall-color/';
    $('#seasonLink').textContent = "See today's Tahquamenon color →";
    $('#seasonLink').dataset.seasonLink = 'fall';
    track('season_module_visible',{season:'fall',phase:module.phase||'unknown',available:module.available===true});
  } else {
    $('#seasonKicker').textContent = 'WINTER / XC';
    $('#seasonHeadline').textContent = 'Use regional snow intelligence, then verify Tahquamenon grooming locally.';
    $('#seasonDetail').textContent = module.basis || 'Winter planning available.';
    $('#seasonLink').href = module.href || 'https://xcski.chrisizworski.com/regions/straits-eastern-up/';
    $('#seasonLink').textContent = 'Check Straits + Eastern UP XC conditions →';
    $('#seasonLink').dataset.seasonLink = 'xc';
    track('season_module_visible',{season:'winter',available:module.available===true});
  }
}

async function loadSeasonal() {
  const intent = safeIntentFromUrl();
  if (intent) state.intent = intent;
  try {
    const query = state.intent ? `?intent=${encodeURIComponent(state.intent)}` : '';
    const res = await fetch(SEASONAL_API_URL + query, { headers:{ Accept:'application/json' } });
    if (!res.ok) throw new Error(`Seasonal API ${res.status}`);
    state.seasonal = await res.json();
    renderSeasonal();
    renderPlan();
  } catch {
    state.seasonal = { modules:{ fall:{active:false,available:false}, winter:{active:state.intent==='xc',available:false} } };
    renderSeasonal();
  }
}

async function loadLive() {
  try {
    const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Live API ${res.status}`);
    state.live = await res.json();
    renderLive();
    renderPlan();
  } catch {
    $('#livePill').className = 'live-pill warn';
    $('#livePill strong').textContent = 'Live context unavailable';
    $('#liveAdjustment').innerHTML = '<strong>Live adjustment unavailable</strong><p>The visit planner still works from stable park geography and visitor priorities. Verify current DNR and NWS conditions before you go.</p>';
  }
}

function renderLive() {
  const d = state.live || {};
  const w = d.weather || {};
  const river = d.river || {};
  const daylight = d.daylight || {};
  $('#livePill').className = `live-pill ${d.alertStatus?.verified ? 'ok' : 'warn'}`;
  $('#livePill strong').textContent = d.alertStatus?.verified ? 'Live context verified' : 'Live context partly verified';

  const temp = Number(w.tempF);
  $('#weatherValue').textContent = Number.isFinite(temp) ? `${Math.round(temp)}°F` : 'Unavailable';
  $('#weatherText').textContent = [w.shortForecast, Number.isFinite(Number(w.windMph)) ? `${Math.round(Number(w.windMph))} mph wind` : null].filter(Boolean).join(' · ') || 'Verify current forecast.';

  const cfs = Number(river.cfs);
  $('#riverValue').textContent = Number.isFinite(cfs) ? `${Math.round(cfs).toLocaleString()} cfs` : 'Unavailable';
  $('#riverText').textContent = Number.isFinite(cfs) ? `${d.decision?.flowContext || 'Observed flow'} · useful for spray and visual force, not a go/no-go score.` : 'Fresh USGS discharge is not available.';

  if (daylight.sunset) {
    const sunset = new Date(daylight.sunset);
    $('#daylightValue').textContent = sunset.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Detroit' });
    $('#daylightText').textContent = 'Sunset in the park · use remaining light for optional trails and Rivermouth photos.';
  } else {
    $('#daylightValue').textContent = 'Unavailable';
    $('#daylightText').textContent = 'Check local sunset if arriving late.';
  }

  const hazardCard = $('#hazardCard');
  if (d.alertStatus?.verified === false) {
    $('#hazardValue').textContent = 'Not verified';
    $('#hazardText').textContent = 'Check official NWS alerts before long hikes or water access.';
    hazardCard.classList.add('warning');
  } else if (Array.isArray(d.alerts) && d.alerts.length) {
    $('#hazardValue').textContent = `${d.alerts.length} active`;
    $('#hazardText').textContent = d.alerts.map(a => a.event).filter(Boolean).join(' · ');
    hazardCard.classList.add('warning');
  } else {
    $('#hazardValue').textContent = 'None active';
    $('#hazardText').textContent = 'NWS alert feed checked for the park point.';
    hazardCard.classList.remove('warning');
  }
}

function applyInferred(result) {
  const prefs = result?.preferences || [];
  prefs.forEach(pref => state.prefs.add(pref));
  if (Number.isFinite(Number(result?.minutes))) {
    state.minutes = Math.max(30, Math.min(600, Math.round(Number(result.minutes))));
  }
  state.inferred = result;
  if (result?.persona || result?.focus) state.persona = result.persona || result.focus;
  if (!state.intent && result?.seasonalInterest === 'fall_color') state.intent = 'fall-color';
  if (!state.intent && result?.seasonalInterest === 'winter_xc') state.intent = 'xc';
  track('persona_inferred',{persona:state.persona||'none',seasonal_interest:result?.seasonalInterest||'none',engine:result?.engine||'fallback'});
  syncControls();
  renderSeasonal();
  renderPlan();
}

function preferenceLabel(pref) {
  return ({ kids:'Kids', easy:'Easy access', hike:'Hiking', photo:'Photos', food:'Food', winter:'Winter / ski' })[pref] || pref;
}

function appliedPlanSummary(result, before) {
  const parts = [];
  const minutes = Number(result?.minutes);
  if (Number.isFinite(minutes) && minutes !== before.minutes) parts.push(formatMinutes(minutes));
  const newPrefs = (result?.preferences || []).filter(pref => !before.prefs.has(pref));
  newPrefs.forEach(pref => parts.push(preferenceLabel(pref)));
  return parts;
}

async function adaptSituation(text) {
  const status = $('#jevStatus');
  const submit = $('#customPlanSubmit');
  const before = { minutes: state.minutes, prefs: new Set(state.prefs) };
  status.dataset.state = 'working';
  status.textContent = 'Updating your plan…';
  submit.disabled = true;
  submit.textContent = 'Updating…';

  let result;
  try {
    const body = { query: text, minutes: state.minutes, preferences: [...state.prefs], live: state.live ? { weather: state.live.weather, alerts: state.live.alerts, alertStatus: state.live.alertStatus, daylight: state.live.daylight } : null };
    const res = await fetch(PLAN_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Planner ${res.status}`);
    result = await res.json();
  } catch {
    const t = text.toLowerCase();
    const prefs = [];
    if (/wheelchair|walker|mobility|stairs|accessible|limited walking|bad knee|bad knees|cane|older adult|senior|elderly|\b(?:7\d|8\d|9\d)\s*(?:-|\s)?years?\s*(?:-|\s)?old\b/.test(t)) prefs.push('easy');
    if (/kid|child|toddler|baby/.test(t)) prefs.push('kids');
    if (/photo|camera|sunset/.test(t)) prefs.push('photo');
    if (/hike|trail|miles/.test(t)) prefs.push('hike');
    if (/lunch|dinner|food|eat|brew/.test(t)) prefs.push('food');
    if (/ski|winter|snow/.test(t)) prefs.push('winter');
    const hourMatch = t.match(/(\d+(?:\.\d+)?)\s*(hour|hr)/);
    const minuteMatch = t.match(/(\d+)\s*(minute|min)/);
    const fallIntent = /fall color|foliage|leaf|leaves|autumn/.test(t);
    const roadTrip = /road trip|scenic drive|m-123|paradise|whitefish/.test(t);
    const crowd = /avoid crowds|quiet|less crowded|fewer people/.test(t);
    result = {
      preferences: prefs,
      minutes: hourMatch ? Math.round(Number(hourMatch[1]) * 60) : minuteMatch ? Number(minuteMatch[1]) : state.minutes,
      persona: roadTrip ? 'scenic_road_trip' : crowd ? 'crowd_avoidance' : fallIntent ? 'fall_color' : null,
      seasonalInterest: fallIntent ? 'fall_color' : prefs.includes('winter') ? 'winter_xc' : null
    };
  }

  applyInferred(result);
  const applied = appliedPlanSummary(result, before);
  if (applied.length) {
    status.dataset.state = 'applied';
    status.textContent = `Updated: ${applied.join(' · ')}`;
    track('customize_apply',{changed:true,persona:state.persona||'none'});
  } else {
    status.dataset.state = 'nochange';
    status.textContent = 'No new constraint found. Add a time limit, mobility need, kids, food, hiking, photos, fall color, a scenic drive, or winter plans.';
    track('customize_apply',{changed:false,persona:state.persona||'none'});
  }
  submit.disabled = false;
  submit.textContent = 'Update plan';
}

function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (state.mapPromise) return state.mapPromise;
  state.mapPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; css.dataset.leaflet = '1'; document.head.append(css);
    }
    const js = document.createElement('script'); js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; js.async = true; js.onload = resolve; js.onerror = reject; document.head.append(js);
  });
  return state.mapPromise;
}

async function ensureMap() {
  if (state.map) return state.map;
  await loadLeaflet();
  const el = $('#parkMap'); el.innerHTML = '';
  state.map = L.map(el, { scrollWheelZoom: false }).setView([46.59, -85.20], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
  renderMarkers();
  return state.map;
}

function markerColor(category) {
  return ({falls:'#a75c2b',trail:'#325e46',access:'#506d83',food:'#8a542e',camp:'#61744e',paddle:'#3f7181',photo:'#906b33',info:'#555'})[category] || '#555';
}

function renderMarkers() {
  if (!state.map) return;
  state.markers.forEach(m => m.remove()); state.markers = [];
  places().filter(p => state.activeFilter === 'all' || p.category === state.activeFilter).forEach(p => {
    const marker = L.circleMarker([p.lat,p.lng], { radius: 8, color:'#fff', weight:2, fillColor:markerColor(p.category), fillOpacity:.95 }).addTo(state.map);
    marker.bindTooltip(p.name, { direction:'top' }); marker.on('click', () => selectPlace(p, false)); marker._placeId = p.id; state.markers.push(marker);
  });
}

async function selectPlace(place, fly = true) {
  state.selectedPlace = place;
  $('#placeKicker').textContent = String(place.kicker || place.category || 'Park stop').toUpperCase();
  $('#placeTitle').textContent = place.name;
  $('#placeDescription').textContent = place.description;
  $('#placeFacts').innerHTML = (place.facts || []).map(f => `<span>${f}</span>`).join('');
  $('#placeLink').href = place.url || DNR_URL;
  $('#placeLink').textContent = place.action || 'Official details ↗';
  $('#addPlaceButton').disabled = state.customStops.includes(place.id);
  $('#addPlaceButton').textContent = state.customStops.includes(place.id) ? 'Already in plan' : 'Add to plan';
  if (fly) { const map = await ensureMap(); map.flyTo([place.lat,place.lng], Math.max(map.getZoom(),13), {duration:.7}); }
}

function setupMap() {
  const target = $('#parkMap');
  if (!('IntersectionObserver' in window)) { ensureMap().catch(() => target.textContent = 'Interactive map unavailable.'); return; }
  const obs = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { obs.disconnect(); ensureMap().catch(() => target.textContent = 'Interactive map unavailable.'); } }, { rootMargin: '350px' });
  obs.observe(target);
}

function copyPlan() {
  const plan = basePlan();
  const lines = [`Tahquamenon Falls plan · ${formatMinutes(state.minutes)}`, plan.title, '', ...plan.stops.map((s,i) => `${i+1}. ${s.title} — ${s.text}`), '', liveNote(plan), '', 'https://chrisizworski.com/tahquamenon-falls/'];
  navigator.clipboard?.writeText(lines.join('\n')).then(() => { $('#copyPlanButton').textContent = 'Copied'; setTimeout(() => $('#copyPlanButton').textContent = 'Copy plan', 1300); }).catch(() => {});
}

function bind() {
  $('#customPlan')?.addEventListener('toggle', e => { if (e.currentTarget.open) track('customize_open'); });
  $$('#timeChoices button').forEach(btn => btn.addEventListener('click', () => { state.minutes = Number(btn.dataset.minutes); track('planner_time_select',{minutes:state.minutes}); syncControls(); renderPlan(); }));
  $$('#preferenceChoices button').forEach(btn => btn.addEventListener('click', () => { const pref = btn.dataset.pref; state.prefs.has(pref) ? state.prefs.delete(pref) : state.prefs.add(pref); track('priority_select',{priority:pref,active:state.prefs.has(pref)}); syncControls(); renderPlan(); }));
  $('#buildPlanButton').addEventListener('click', () => { const plan=basePlan(); track('planner_build',{minutes:state.minutes,persona:state.persona||'none',season:state.seasonal?.season||'unknown',value:totalProductValue(plan,{minutes:state.minutes,prefs:state.prefs,intent:state.intent,persona:state.persona,seasonal:state.seasonal,live:state.live}).total}); renderPlan(); $('#answerSection').scrollIntoView({behavior:'smooth',block:'start'}); });
  $('#situationForm').addEventListener('submit', e => { e.preventDefault(); const text = $('#situationInput').value.trim(); if (text) adaptSituation(text); });
  $('#copyPlanButton').addEventListener('click', () => { track('copy_plan',{minutes:state.minutes}); copyPlan(); });
  $('#shareButton').addEventListener('click', async () => { try { if (navigator.share) await navigator.share({title:document.title,url:location.href}); else await navigator.clipboard.writeText(location.href); } catch {} });
  $$('[data-scroll]').forEach(btn => btn.addEventListener('click', () => document.querySelector(btn.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));
  $$('#filterRow button').forEach(btn => btn.addEventListener('click', async () => { state.activeFilter = btn.dataset.filter; $$('#filterRow button').forEach(x => x.classList.toggle('active', x === btn)); await ensureMap(); renderMarkers(); }));
  $('#addPlaceButton').addEventListener('click', () => { const p = state.selectedPlace; if (!p || state.customStops.includes(p.id)) return; state.customStops.push(p.id); track('map_stop_add',{stop_id:p.id}); saveState(); renderPlan(); selectPlace(p,false); });
  $$('[data-place-id]').forEach(btn => btn.addEventListener('click', async () => { const p = places().find(x => x.id === btn.dataset.placeId); if (!p) return; $('#mapSection').scrollIntoView({behavior:'smooth'}); await ensureMap(); selectPlace(p,true); }));
  $('#seasonLink')?.addEventListener('click', () => {
    const kind=$('#seasonLink').dataset.seasonLink;
    track(kind==='xc'?'xc_detail_click':'fall_color_detail_click',{placement:'season_context'});
  });
}

restoreState();
syncControls();
bind();
renderPlan();
setupMap();
loadSeasonal();
loadLive();
