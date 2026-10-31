# Tahquamenon Falls Live — agent operating rules

Authoritative product source is this repository, **not** deployment mirrors in chrisizworski-com. Canonical public URL: https://chrisizworski.com/tahquamenon-falls/. It is proxied to this repository's Vercel origin.

## Automatically consult EXPERIENCE_OS_V1

Before new interactive features, significant redesign, or visitor-experience changes, read the central source-of-truth playbook:
https://github.com/izworskic/chrisizworski-com/tree/main/design-systems/experience-os-v1

Start with its AGENTS.md, EXPERIENCE_LIFECYCLE.md, INTERACTION_PATTERN_LIBRARY.md, QA_SCORECARD.md and evidence/photography/technology standards; also use FIELD_GUIDE_V1 and JOURNEY_ATLAS_V1 where relevant. Research current external references, write a brief, make interaction respond meaningfully to the visitor, test it visually on mobile and desktop, and save lessons. Minor bug fixes need relevant standards only. If the central repo is inaccessible, disclose that and do not claim that you read it.

## Local hard gates

- Keep current client/source separation: `public/tahquamenon-falls/index.html`, `public/assets/`, `public/tahquamenon-falls/data/places.js`, and existing `api/`.
- Preserve existing season, NWS, USGS, fallback and JEV intent contracts. Never manufacture current water flow, hazard verification, a route, trail access, a shuttle schedule or an opening.
- Map points are planning cues, **not routing or survey-quality coordinates**. Use actual rendered tiles and a readable official-link fallback.
- Preserve canonical URL, JSON-LD Person `https://chrisizworski.com/#person`, byline, AdSense loader, GA4 and unchanged route ownership; never add Redis or an unreviewed UI framework.
- Photos require exact-place identification, dated rights and linked credit; archival photographs are not live conditions.
- Before PR or merge: `npm run verify` green. For substantial UX changes also run the Playwright browser smoke on multiple devices and no-map/no-JS conditions, including full screenshot review. Do not merge red CI.
- Update `docs/EXPERIENCE_OS_TAHQUAMENON_PILOT_20261031.md` with implementation and actual results; do not fabricate 90/100.
