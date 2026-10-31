# EXPERIENCE_OS_V1 — Tahquamenon pilot release review

Reviewed: 2026-10-31. Scope: `/tahquamenon-falls/` in `izworskic/tahquamenon-falls-live`, canonical served at https://chrisizworski.com/tahquamenon-falls/. This is a **pre-merge QA record**, updated live-deployment evidence is required after release.

## Intent and selected design

The user originally chose Tahquamenon as the first full EXPERIENCE_OS_V1 application while Porcupine Mountains development continues independently. The visitor need is a source-backed, spatially coherent plan that changes with time and activity preferences.

We rejected a heavy rewrite / full-screen 3D approach and built a connected, progressive enhancement: real licensed Upper Falls, Lower Falls and Island Bridge photographs → source-backed place details → existing Leaflet/OSM markers and map → existing dynamic itinerary. The 17 POIs remain available through a browse list and official links even when the map fails. The photo/map experience now follows the main itinerary before other supporting information.

Original products preserved: canonical, FAQ/Person schema, byline, ads code, USGS/NWS and seasonal API models, original five duration options and six preference options, custom stop storage, Michigan winter tool links. No React, Redis or new map provider.

## DNR and photo source verification

- Official DNR park/access page: https://www.michigan.gov/recsearch/parks/tahquamenonfalls
- DNR Lower Falls hiking map: https://www.michigan.gov/recsearch/-/media/Project/Websites/recsearch/documents/MapsT-Z/tahquamenon_hiking_trail_map.pdf
- DNR visitor guide: https://www.michigan.gov/dnr/-/media/Project/Websites/dnr/Documents/Education/visitorcenters/TFSP2025Visitor.pdf
- Upper Falls photo: Wfgc, public domain; https://commons.wikimedia.org/wiki/File:Tahquamenon_Falls_-_Autumn.JPG
- Lower Falls photo: Joe Passe, CC BY-SA 2.0; https://commons.wikimedia.org/wiki/File:Lower_Tahquamenon_Falls.jpg
- Park bridge photo: Notorious4life, CC0; https://commons.wikimedia.org/wiki/File:Tahquamenon_Falls_State_Park_bridge.jpg

Caveat: images show historic scenery, **not current park conditions**. We explicitly corrected an existing POI error claiming groomed ski tracks were open for walking or snowshoeing and removed a fixed seasonal shuttle promise. The 5.1-mile River Trail is not an everyday stroll between parking areas or permission to walk on M-123.

## Automated and rendered evidence

- Owner release verification: **success** on PR branch (https://github.com/izworskic/tahquamenon-falls-live/actions/runs/41207601542). Includes existing integrity, SEO/Person, seasonal and experience contract suite.
- Browser QA: **success** on PR branch (https://github.com/izworskic/tahquamenon-falls-live/actions/runs/41207601493). Playwright Chromium performs real input changes and screenshot captures at 360, 390, 768, 1440 px. Screenshots attached to that workflow run.
- Visitor scenarios covered: 45-minute Upper-only vs 3-hour Upper+Lower plan, keyboard-driven Lower Falls image selection, Island Bridge custom stop added to plan, category filter behavior, keyboard opening of source-linked stop browser, reduced motion, HTML without JavaScript, blocked Leaflet CDN, and collapsed failed map notice under 150 px.
- Actual map tiles, marked park points and selected stop details visibly rendered in screenshots. Full screenshots visually inspected at 360/390/768/desktop; selected archival photos rendered, no observed horizontal overflow.
- Map failure gracefully degrades to a compact official-link path rather than a 430px blank screen.

## Internal rubric (subjective release evaluation, not a user study)

| Category | Weight | Score / 5 | Evidence |
| --- | ---: | ---: | --- |
| Visitor decision | 25 | 5 | 45/180 time changes meaningful itinerary, typed plan items |
| Distinct experience | 15 | 4 | Three genuine photo-led destinations + dynamic coherent map; existing comparison cards remain |
| Causal interaction | 15 | 5 | Synchronized photo, selected map marker, plan route, full stop browser |
| Source truth/provenance | 15 | 4 | DNR, archive credits, no invented route/availability; not all source dates are real-time |
| Photo/visual quality | 10 | 5 | Actual responsive images/screenshots, compact cards, readable interpreted descriptions |
| Mobile/accessibility | 10 | 4 | 360/390/768/desktop, keyboard Enter, no-JS, focus, reduced motion; manual screen-reader audit not performed |
| Performance/resilience | 5 | 4 | Lazy map, compact failed-CDN fallback, no framework added; field CWV and device latency not measured |
| Site integrity | 5 | 5 | Existing repo verification passed, canonical/Person/ads/backend unchanged |

**Total: 91/100 (internal rubric).** This reflects implementation and observed browser behavior, **not** measured visitor success, accessibility certification, Core Web Vitals field percentiles, or search-traffic growth.

All evaluated categories >=4/5; verified PR CI checks were green. Production smoke and final current deployment status must be checked **after** merge, before marking release complete. Do not present this 91 as an independent usability-study score.

## Important open evidence limits

- There is no field p75 LCP/INP/CLS baseline, post-launch GSC experiment, actual user interview, accessibility assistive-technology study or signal that conversion improved. These are not claimed.
- Remote Wikimedia thumbnail availability is not guaranteed; selected panel photo hides during load or failure, and source credit stays with the original linked cards.
- Park, bridge, trail, ski and shuttle status must continue to be verified with Michigan DNR/actual operators.
- The 17 marked points are not a public-road routing graph; no geographic ETA was generated.

## Reusable EXPERIENCE_OS_V1 discoveries

1. **P02 + P07 + P06:** A photo-led stop selection that updates a verified detail panel and the existing map provides a coherent interaction without migrating to React.
2. **A01/A04:** Placing the new explorer after the plan, *before* secondary comparisons and conditions, makes it part of the user's decision sequence instead of a decorative appendix.
3. **A05:** Visible fallback is not sufficient if the map leaves 430px of empty space. Collapse failure into a short source-linked notice and keep all 17 places accessible in native HTML.
4. **New anti-pattern:** a CSS `grid-template-columns:1fr` with long horizontally scrollable quick links can expand the page's min-content width on 360px devices; use `minmax(0,1fr)`, `min-width:0`, and actual horizontal-overflow browser assertions.
5. **New process lesson:** static syntax and unit tests missed `$().forEach` browser runtime errors; browser interaction QA before merge detected and eliminated them.

## First post-release improvement

Observe real visitor interactions (planner build → destination select → official link/map), compare the device experience with actual field traffic and performance before justifying additional React, D3, MapLibre or 3D. Reuse the photo/plan/map coordinator only where source-backed spatial choices genuinely add value.
