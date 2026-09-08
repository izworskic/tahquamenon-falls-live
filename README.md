# Tahquamenon Falls Live

A Michigan Outdoors Now flagship field tool for **Tahquamenon Falls State Park**. It combines the useful part of the existing waterfall decision engine (one clear answer) with the interaction model of the Soo Locks tool (live map + click-through operational detail), then makes both more site-specific.

## Product thesis

Tahquamenon is not one attraction. It is a nearly 50,000-acre park with two major falls areas, 35+ miles of trails, campgrounds, paddling access, an island bridge, concessions, a brewery and a river mouth on Lake Superior. The product therefore answers two questions:

1. **How good is Tahquamenon right now?**
2. **Given the conditions and the time I have, what should I actually do?**

The first answer is a transparent live score. The second is an interactive park map and time-based visit planner.

## Release benchmark — 100 points

| Dimension | Weight | Release standard |
|---|---:|---|
| Decision usefulness | 15 | First viewport answers whether conditions are worth the trip and why. |
| Live data depth + freshness | 15 | USGS, NWS and weather fallback normalized; visible freshness and source health. |
| Interactive map + POIs | 15 | Mobile-friendly map with real click targets for falls, trails, campgrounds, food, access, paddling and photo points. |
| Tahquamenon-specific depth | 10 | No generic waterfall copy; park-specific routes, facilities and site facts. |
| Explainability + provenance | 10 | Every score component and source is inspectable. Forecast rain never masquerades as current flow. |
| Mobile UX | 10 | Useful at ~390px width with no desktop-only interaction. |
| Reliability + fallbacks | 10 | Partial API failure does not break the page or fabricate a flow score. |
| Accessibility | 5 | Semantic controls, keyboard map markers, dialog labels, reduced-motion support and strong contrast. |
| Performance | 5 | Static front end, single normalized live endpoint, 5-minute edge cache. |
| Visual identity | 5 | Michigan / cedar / tannin visual language; not generic dashboard styling. |
| **Total** | **100** | **Release gate: 92/100** |

### Hard vetoes

A release fails even above 92 if any of these is true:

- A current waterfall score is shown without a fresh observed USGS discharge.
- Forecast precipitation is added to the *current* river-flow score.
- A live source fails silently or stale data is presented as current.
- The map is not usable on a phone.
- A trail line or POI is presented as survey-grade navigation when it is only a planning aid.

## Engine v2

### What changed from the old waterfall engine

The reusable idea was good: synthesize flow and visitability into one decision. The old implementation, however, treated the existence of a stream gauge more like a small bonus than a truly quantitative flow signal, while recent/forecast rain could contribute heavily to “flow.” That made the current-waterfall answer too weather-driven.

Tahquamenon v2 reverses the hierarchy:

- **Observed USGS discharge is primary.**
- The discharge is compared with **USGS daily percentiles for the same calendar date**, so seasonal context is preserved.
- Forecast precipitation is kept in a **Next 24 Hours** outlook only.
- NWS/Open-Meteo drive trail comfort, photography and safety, not fake river flow.
- If USGS is unavailable, the tool can still describe weather but does **not** claim a current waterfall-flow score.

### Current score weights

- 46% observed river experience
- 24% trail comfort
- 18% photography conditions
- 12% safety

Severe NWS hazards cap the total score. Source failure lowers confidence.

## Live data

### USGS

**Station 04045500 — Tahquamenon River near Paradise, Michigan**

- Parameter 00060: discharge, cfs
- Parameter 00065: gage height, ft
- Parameter 00045: precipitation, in (temporary recent-period series per USGS)
- Daily historical statistics/percentiles from the USGS Statistics Service

The station is roughly 0.6 mile upstream of Upper Falls, making it a direct river-power signal.

### National Weather Service

- Hourly forecast for the Upper Falls point
- Short forecast, temperature, wind, precipitation probability
- Active alerts for the point

### Open-Meteo

Used as a weather fallback and for fields that are convenient to normalize consistently:

- Cloud cover
- 24-hour forecast precipitation accumulation
- Sunrise / sunset
- Apparent temperature

The app labels its role; it is not used to invent USGS hydrology.

## Park database

Curated POIs currently include:

- Upper Falls
- New Upper Falls accessible boardwalk
- Tahquamenon Falls Brewery & Pub / Camp 33
- Fact Shack
- Lower Falls
- Ronald A. Olson Island Bridge
- Lower Falls Café & Gift Shop
- Portage and Hemlock campground loops
- River Trail / North Country Trail corridor
- Clark Lake trail junction
- Lower Falls canoe/kayak launch
- Rivermouth campground and boat access
- Rivermouth sunset viewpoint

The data source is primarily Michigan DNR plus official concession/operator pages. Markers are for planning, not backcountry navigation.

## Architecture

This repository deliberately avoids an always-on Replit runtime and avoids a heavy app framework. As of the hub-integration migration, files live where Vercel's rewrite from chrisizworski.com expects them, matching the isle-royale-outdoors pattern:

```text
public/tahquamenon-falls/index.html   Static UI / SEO shell, served at /tahquamenon-falls/
public/tahquamenon-falls/data/places.js  Curated Tahquamenon POI database
public/assets/tahquamenon-falls.js    Live UI, map, filters, planner, share/deep links
public/assets/tahquamenon-falls.css   Responsive Michigan visual system (imports css/*.css)
public/assets/css/*.css               Taste system: base, content, field, responsive
public/robots.txt                     Allow-all (real crawl traffic flows through the hub)
api/tahquamenon-falls.js              Vercel serverless normalization + score engine
vercel.json                           Function config, cache header, API noindex
package.json                          Syntax-check command only
```

Canonical public URL is https://chrisizworski.com/tahquamenon-falls/, proxied there via rewrites
in the chrisizworski-com hub repo's vercel.json (the same pattern used for /isle-royale-map/).
This project's own tahquamenon-falls-live-94is.vercel.app domain still serves the same bytes at
/tahquamenon-falls/ (Vercel needs a live origin to proxy to), but the page's own canonical/og:url
tags always point at the chrisizworski.com URL, so that is the one that should get indexed and
linked to.

The only front-end runtime dependency is Leaflet loaded from a public CDN. OpenStreetMap supplies map tiles. The Vercel function uses Node's native `fetch` and needs no npm dependencies.

## Local checks

```bash
npm run check
cd public && python3 -m http.server 8080
# then open http://localhost:8080/tahquamenon-falls/
```

The static server renders the page and map. `/api/live` requires Vercel dev or deployment because it is a Vercel serverless function.

## Production verification checklist

- `/api/live` returns HTTP 200 and includes `river.cfs`, `decision.score`, `sourceHealth`.
- USGS observation timestamp is visible and fresh.
- Current-day USGS percentile is populated when the stats service is healthy.
- NWS alert card changes when active alerts are returned.
- Filter chips add/remove map categories.
- `?place=upper-falls` deep-links and centers the selected point.
- 90-minute / half-day / full-day / hiker plans render and copy correctly.
- 390px mobile viewport has no horizontal page scroll.
- Turning off USGS causes no current river score claim.
- Turning off NWS keeps the page usable through Open-Meteo.

## Research references

- Michigan DNR — Tahquamenon Falls State Park
- Michigan DNR — Lower Falls Hiking Trails map (2025)
- USGS Water Data — station 04045500
- USGS Water Services — Statistics Service
- National Weather Service API
- Tahquamenon Falls Brewery & Pub official site
- Lower Tahquamenon Falls concession official site
