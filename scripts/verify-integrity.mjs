import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseUsgsSeries, scoreWeather, buildDecision } from '../api/tahquamenon-falls.js';

const usgsPayload = {
  value: {
    timeSeries: [
      {
        variable: { variableCode: [{ value: '00060' }] },
        values: [{ value: [{ value: '725', dateTime: '2026-09-19T12:00:00.000-04:00' }] }]
      },
      {
        variable: { variableCode: [{ value: '00065' }] },
        values: [{ value: [{ value: '4.12', dateTime: '2026-09-19T13:30:00.000-04:00' }] }]
      }
    ]
  }
};

const river = parseUsgsSeries(usgsPayload);
assert.equal(river.cfs, 725);
assert.equal(river.gageHeightFt, 4.12);
assert.equal(river.observedAt, '2026-09-19T12:00:00.000-04:00');
assert.equal(river.dischargeObservedAt, '2026-09-19T12:00:00.000-04:00');
assert.equal(river.stageObservedAt, '2026-09-19T13:30:00.000-04:00');

const unverifiedSafety = scoreWeather({ tempF: 62, windMph: 5, precipChance: 0, cloudCover: 45 }, [], false);
assert.equal(unverifiedSafety.safety, 70, 'Unverified alert feed must not be treated as clear');

const verifiedSafety = scoreWeather({ tempF: 62, windMph: 5, precipChance: 0, cloudCover: 45 }, [], true);
assert.equal(verifiedSafety.safety, 96);

const decision = buildDecision({
  river: { cfs: 725, observedAt: new Date().toISOString() },
  stats: { p05: 180, p25: 300, median: 500, p75: 800, p95: 1300 },
  weather: { tempF: 62, windMph: 5, precipChance: 10, cloudCover: 45, qpf24In: 0.1 },
  alerts: [],
  sourceHealth: { usgs: true, nws: true, nwsAlerts: false, openMeteo: true }
});
assert(decision.reasons.some(reason => /could not be verified/i.test(reason)), 'Decision must disclose unverified hazard status');
assert(decision.confidence < 100, 'Unverified alert feed must reduce confidence');

const app = await readFile(new URL('../public/assets/tahquamenon-falls.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../public/tahquamenon-falls/index.html', import.meta.url), 'utf8');
assert(app.includes("tahquamenon.visit.v1"), 'Visit plan persistence key missing');
assert(app.includes('IntersectionObserver'), 'Lazy map observer missing');
assert(app.includes('data-remove-stop'), 'Editable saved-stop control missing');
assert(!html.includes('src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"'), 'Leaflet must not block initial HTML parse');

console.log('Tahquamenon integrity checks passed');
