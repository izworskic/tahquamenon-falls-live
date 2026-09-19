# Shoshone Falls Live — Release Benchmark

Release gate: **94/100 minimum and zero hard vetoes.**

This benchmark applies to the `/shoshone-falls/` product surface hosted from this repository. Tahquamenon remains a separate product and its own benchmark still applies.

## Product job

Within one mobile viewport, a visitor arriving from a query such as **“Is Shoshone Falls flowing today?”** should understand:

1. whether exact waterfall spill is verified;
2. what trustworthy live context exists;
3. whether the visit is reasonable for their travel commitment;
4. the best practical viewing/light window;
5. where to verify the actual visual state.

The tool must prefer **unknown** over a precise but semantically wrong number.

## 100-point benchmark

| Dimension | Weight | Release requirement |
|---|---:|---|
| First-screen decision value | 18 | Decision, travel commitment, waterfall truth state and verification path are visible immediately. |
| Hydrologic truth | 15 | Downstream Snake River context is never labeled waterfall spill; stale observations are never labeled live. |
| Experience translation | 13 | Source data becomes visitor meaning without claiming unsupported direct flow. |
| Outlook value | 10 | Practical upcoming windows are ranked while weather is kept separate from waterfall-flow prediction. |
| Persona / travel-cost fit | 10 | Nearby, <1 hr, 1–2 hr and dedicated-trip contexts materially change the recommendation. |
| Bounded JEV value | 8 | JEV can rank only deterministic candidate windows, is server-only, and fails soft. |
| Visual evidence | 7 | Official live camera is prominent; non-live imagery is explicitly labeled. |
| Photo / rainbow intelligence | 5 | Light/cloud window is useful; mist/rainbow is never guaranteed without visual evidence. |
| Visit planning | 4 | 30 min, 1 hr, 2 hr and half-day plans remain realistic. |
| Regional network | 3 | Dierkes/Perrine/Thousand Springs handoffs are contextual, not generic footer spam. |
| Search / information architecture | 3 | Crawlable page directly answers the core search intent and source/method questions. |
| Performance | 2 | Map and heavy embeds are lazy/progressive and mobile first. |
| Accessibility | 2 | Semantic controls, labels, skip link, aria-live and reduced-motion behavior are preserved. |

## Hard vetoes

A release fails regardless of numeric score if any of these is true:

- USGS 13090500 is called Shoshone Falls waterfall flow.
- USGS 13088000 is presented as a current continuous Milner live feed.
- An estimated or proxy value is presented as measured waterfall spill.
- A stale observation is presented as live/current.
- Missing direct flow becomes 0 CFS.
- Weather/rain is used as current waterfall flow.
- JEV can invent or change CFS, source semantics, releases, park facts, closures or safety facts.
- JEV is required for the core page to function.
- Harness/JEV credentials appear in browser code.
- A static photograph is presented as a live camera.
- The official camera/player is mislabeled.
- The first mobile viewport is dominated by a decorative hero before the decision.
- GA4 `G-Y5D2V2W7HN` is missing.
- AdSense publisher metadata `ca-pub-8222782620788075` is missing.
- The canonical URL is not `https://chrisizworski.com/shoshone-falls/`.
- The mobile layout introduces horizontal page scroll.

## Current truth boundary

The Idaho Power public AQUARIUS portal exposes a saved **Shoshone Falls Discharge Hydrograph**, but the current release does **not** equate that field with physical spill over the falls until its measurement semantics are verified. This is intentional.

USGS 13090500 remains useful as **downstream Snake River context**. USGS 13088000 at Milner has historical significance but does not provide the modern continuous live feed needed for a current-state claim.

The City of Twin Falls official live stream therefore remains first-class visual evidence in the current product.
