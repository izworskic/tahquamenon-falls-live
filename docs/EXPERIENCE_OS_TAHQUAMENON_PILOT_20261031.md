# Tahquamenon EXPERIENCE_OS_V1 Pilot — visitor-experience research and decision brief
Checked 2026-10-31. Owner: izworskic/tahquamenon-falls-live. Canonical: https://chrisizworski.com/tahquamenon-falls/

## Stage 0: Current experience and preservation

Current source: static server-rendered HTML + Leaflet/OSM lazy-loaded map, 17 curated POIs, existing five visit-length choices, six preference choices, current-season planner, optional intent interpretation, live USGS/NWS/weather/season context, local saved user stops, Person + WebPage + FAQ JSON-LD. Public route is proxied through chrisizworski-com. Maintain both existing APIs, canonical, byline, advertising loader, local state key, season and person contracts and all prior tests.

Current fragmentation: time/preferences alter timeline, map markers alter details, and compare-photo cards scroll to map, but there is no always-usable **photo → selected place → plan status → map → official park information** journey. The map is unusable without CDN or tiles; no prominent non-map list exists. Avoid a full framework rewrite, generic hero/gallery, misleading road routes, and invented travel times.

## Primary visitor questions

1. If I have 45, 90, or 180 minutes, which stops realistically fit?
2. Is Upper Falls, Lower Falls, or the island bridge the best experience for this group?
3. Where does that stop sit in the park and what is the authoritative access information?
4. If the map fails or cell service is poor, can I still act on my plan?

North Star: visitors move from time-and-interest choice to **an evidenced stop**, not just a map animation.

## Credible external experience references

| Reference | Observed mechanism | Adaptation and limit |
| --- | --- | --- |
| NPS App (official NPS): https://www.nps.gov/subjects/digital/nps-apps.htm | Interpretive narrative combined with practical amenity/visitor context | Short sense-of-place caption next to source-linked stop info, **no offline-availability claim** |
| AllTrails trail preview documentation: https://support.alltrails.com/hc/en-us/articles/37212870983700-Trail-previews-on-trail-pages | Trail selection updates route context/elevation preview | Map and stop selection synchronized, **no proprietary trail geometry, pretend elevation, or unsupported routing** |
| GOV.UK principles: https://www.gov.uk/guidance/government-design-principles | Consistent not uniform, start with needs, iterate | Preserve underlying planner, build original photo-first journey |

## Authoritative Michigan evidence

- Official park: https://www.michigan.gov/recsearch/parks/tahquamenonfalls — Upper Falls accessible 1,100-ft boardwalk and viewing platforms; Lower Falls accessible viewing and Ronald A. Olson Island Bridge; cross-country groomed ski trails are for skiing, **not snowshoe walking**; seasonal shuttle requires verification; permit/closure conditions not inferred.
- Official visitor guide PDF (2025): https://www.michigan.gov/dnr/-/media/Project/Websites/dnr/Documents/Education/visitorcenters/TFSP2025Visitor.pdf — 5.1 mi challenging River Trail, point-to-point, verify shuttle, no walking M-123. Historical guide: verify current state before live status.
- Official Lower Falls hiking map: https://www.michigan.gov/recsearch/-/media/Project/Websites/recsearch/documents/MapsT-Z/tahquamenon_hiking_trail_map.pdf — bridge access, island trail 0.5 mi, parking areas, River Trail, boardwalks. The map is a **planning map, not current opening/parking guarantee**.
- Images independently identified at exact places:
  - Upper Falls: Wfgc, public domain, https://commons.wikimedia.org/wiki/File:Tahquamenon_Falls_-_Autumn.JPG
  - Lower Falls: Joe Passe, CC BY-SA 2.0, https://commons.wikimedia.org/wiki/File:Lower_Tahquamenon_Falls.jpg
  - Island pedestrian bridge: Notorious4life, CC0, https://commons.wikimedia.org/wiki/File:Tahquamenon_Falls_State_Park_bridge.jpg
 All are archival visual context, **not photographs of current access or conditions**. Link credit and applicable license; remote Commons thumbnails used with sized URLs.

## Two design alternatives

**A. Rebuild as a full-screen terrain/map app.** Attractive rich maps, route highlights and replay. Rejected: unverified full route geometries and basemap dependencies, high rendering cost, displaces the existing planner/SEO HTML; not justified.

**B. Connected falls experience (selected).** Keep existing instant planner. Add a compact, source-backed, photo-led set of three key experiences (Upper, Lower, island bridge) directly with the map; they synchronize with the existing information panel and selected map marker. Make plan stops actionable with clear show-details actions; show a readable secondary browser for all 17 POIs and static source links when JS/CDN/tiles fail. Small JS/CSS progressive enhancement: no new framework, no new API, no new route.

## Interaction contract / pattern IDs

| Change | Meaningful response | Safe fallback and test |
| --- | --- | --- |
| Visitor selects 45m vs 3hr | Existing core itinerary changes and the connected plan-stop navigation updates | HTML still gives guidance; check 45m excludes Lower and 3hr includes Lower |
| Visitor selects an illustrated place | Matching official-info panel, selected-card highlight and marker state; map focuses when available | If map/CDN fails, info panel and official external links still work |
| Visitor selects map marker | Photo card and place panel synchronize without changing itinerary | Keyboard stop list; no map geometry used as directions |
| User browses full stop list or category filter | Selection shows details and keeps map/filter state consistent | Static official links in the no-JS list |
| User adds an extra stop | Existing saved itinerary changes, chosen stop appears in route and action state | No duplicate custom stops; original local-storage behavior preserved |

## UX and truth constraints

- Compact, image-led chooser, not another giant hero. Source credits visible. Photos do not imply live status or access.
- Mobile 360/390px: stacked card gallery, 44px interactive targets, readable destination panel, no horizontal layout overflow, visible focus. Desktop: three-card comparison across map.
- No route lines, arbitrary safety/confidence score, drive-time guarantees, or new parking pins.
- Accessible native buttons, live status with restraint, reduced motion and no JS external links. Map failure must not strand the visitor.
- Keep existing OSM/Leaflet provider; improving fallback is lower-risk than introducing MapLibre or requiring a CARTO key.
- No changes to ad loader, analytics schema, APIs, seasonal data contracts, canonical, and Person identity.

## Acceptance (before merge)

- Original `npm run verify` green in owning repo.
- At 390px and desktop, actual browser asserts 45/180 change stop list, photo → detail and map selection, keyboard support and fallback under blocked Leaflet/tiles, no horizontal scroll and no page errors.
- Photo links and licenses reviewed, zero new user tracking and zero unsafe access inference.
- Github Actions PR smoke job green; inspect screenshot artifacts when available; honest scores only after real render.
- DNR river trail warning and XC walking distinction continue to appear; no unreviewed changes to other tools.

## Follow-up / learning record

The pilot validates P02 map↔card, P06 proof panel, P07 narrative/photo→map and P10 alternatives after failure. Record tested results in the repo and later in central EXPERIENCE_OS_V1. No claim of increased engagement or Google traffic until measured after release.
