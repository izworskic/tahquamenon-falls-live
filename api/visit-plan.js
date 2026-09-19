const ALLOWED_PREFS = new Set(['kids','easy','hike','photo','food','winter']);
const TYPE_SAFE_URL = 'https://api.typesafe.ai/v1/systemone';

function clampText(value, max = 700) { return String(value || '').trim().slice(0, max); }
function nearestMinutes(value, fallback = 180) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(30, Math.min(600, Math.round(n)));
}

function inferMinutes(text, fallback = 180) {
  const hour = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
  if (hour) return nearestMinutes(Number(hour[1]) * 60, fallback);
  const min = text.match(/(\d+)\s*(?:minutes?|mins?)/i);
  if (min) return nearestMinutes(Number(min[1]), fallback);
  if (/half\s*day/i.test(text)) return 300;
  if (/full\s*day|all\s*day/i.test(text)) return 480;
  return fallback;
}

function inferVisitPreferences(query, initial = []) {
  const text = clampText(query).toLowerCase();
  const prefs = new Set((Array.isArray(initial) ? initial : []).filter(x => ALLOWED_PREFS.has(x)));
  if (/kid|child|children|toddler|baby|family/.test(text)) prefs.add('kids');
  if (/mom|dad|parent|grand|wheelchair|walker|mobility|accessible|stairs|easy|bad knee|knee|limited walking/.test(text)) prefs.add('easy');
  if (/hike|hiking|trail|miles|long walk|river trail/.test(text)) prefs.add('hike');
  if (/photo|camera|photograph|sunset|sunrise|light/.test(text)) prefs.add('photo');
  if (/lunch|dinner|food|eat|brewery|beer|meal/.test(text)) prefs.add('food');
  if (/winter|ski|skiing|snowshoe|snow|groom/.test(text)) prefs.add('winter');
  return [...prefs];
}

function sanitizeClientState(body = {}) {
  const query = clampText(body.query);
  const minutes = inferMinutes(query, nearestMinutes(body.minutes, 180));
  const preferences = inferVisitPreferences(query, body.preferences);
  const live = body.live && typeof body.live === 'object' ? {
    weather: body.live.weather && typeof body.live.weather === 'object' ? {
      tempF: Number.isFinite(Number(body.live.weather.tempF)) ? Number(body.live.weather.tempF) : null,
      windMph: Number.isFinite(Number(body.live.weather.windMph)) ? Number(body.live.weather.windMph) : null,
      precipChance: Number.isFinite(Number(body.live.weather.precipChance)) ? Number(body.live.weather.precipChance) : null
    } : null,
    activeAlerts: Array.isArray(body.live.alerts) ? body.live.alerts.slice(0,5).map(a => clampText(a?.event,100)).filter(Boolean) : [],
    alertsVerified: body.live.alertStatus?.verified === true
  } : null;
  return { query, minutes, preferences, live };
}

function deterministicResult(s) {
  return { engine: 'deterministic', confidence: 1, minutes: s.minutes, preferences: s.preferences, focus: s.preferences.includes('winter') ? 'winter_ski' : s.preferences.includes('easy') ? 'accessibility' : s.preferences.includes('kids') ? 'kids' : s.preferences.includes('hike') ? 'hiking' : s.preferences.includes('photo') ? 'photography' : s.preferences.includes('food') ? 'food' : 'first_visit' };
}

async function askJev(s) {
  const key = process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY;
  if (!key || !s.query) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const payload = {
      state: {
        visitor_request: s.query,
        stated_time_minutes: s.minutes,
        explicit_preferences: s.preferences,
        live_context: s.live,
        stable_park_facts: {
          upper_falls: 'signature waterfall; fastest high-value stop; accessible boardwalk and viewpoints; brewery nearby',
          lower_falls: 'multiple cascades; island bridge; more exploratory; good for families and longer visits',
          river_trail: '5.1 miles one way; roots, hills and stairs; seasonal shuttle must be verified',
          winter: 'Upper Falls area has 1-mile Lantern Loop and 3.8-mile Giant Pines Loop groomed for cross-country skiing when conditions allow'
        }
      },
      model: 'jev-latest',
      questions: {
        primary_focus: {
          type: 'choice',
          instructions: 'Choose the single visitor priority that should most strongly shape a Tahquamenon Falls itinerary. Do not invent park facts.',
          criteria: {
            first_visit: 'General first-time visitor who mainly wants the core Tahquamenon experience',
            accessibility: 'Mobility, stairs, easy walking, older adult, wheelchair, walker or low-stress access is the dominant need',
            kids: 'Children, toddlers or family movement/engagement is the dominant need',
            hiking: 'Meaningful trail mileage or a challenging hike is the dominant need',
            photography: 'Light, views, camera opportunities or sunset is the dominant need',
            food: 'Meals, brewery or food timing is the dominant need',
            winter_ski: 'Cross-country skiing, snowshoeing or winter recreation is the dominant need'
          }
        },
        needs_easy_route: {
          type: 'noul',
          instructions: 'The visitor request indicates that an easy, accessible, low-stair or mobility-aware route should be prioritized.'
        },
        kids_priority: {
          type: 'noul',
          instructions: 'The request indicates that keeping children engaged should materially affect the itinerary.'
        },
        active_hiking: {
          type: 'noul',
          instructions: 'The visitor wants meaningful hiking rather than only short viewpoint walks.'
        }
      }
    };
    const res = await fetch(TYPE_SAFE_URL, { method:'POST', headers:{ Authorization:`Bearer ${key}`,'Content-Type':'application/json' }, body:JSON.stringify(payload), signal:controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const focus = data?.answers?.primary_focus?.choice;
    const confidence = Number(data?.answers?.primary_focus?.confidence) || 0;
    if (!focus || confidence < 0.52) return null;
    const prefs = new Set(s.preferences);
    const focusMap = { accessibility:'easy', kids:'kids', hiking:'hike', photography:'photo', food:'food', winter_ski:'winter' };
    if (focusMap[focus]) prefs.add(focusMap[focus]);
    if (Number(data?.answers?.needs_easy_route?.noul) >= 0.65) prefs.add('easy');
    if (Number(data?.answers?.kids_priority?.noul) >= 0.65) prefs.add('kids');
    if (Number(data?.answers?.active_hiking?.noul) >= 0.65) prefs.add('hike');
    return { engine:'jev', confidence, model:data.model || 'jev-latest', minutes:s.minutes, preferences:[...prefs].filter(x => ALLOWED_PREFS.has(x)), focus };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  const s = sanitizeClientState(req.body || {});
  if (!s.query) return res.status(400).json({ error:'A visitor situation is required.' });
  const jev = await askJev(s);
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json(jev || deterministicResult(s));
}

export { inferVisitPreferences, inferMinutes, sanitizeClientState, deterministicResult };
