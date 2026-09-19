# Tahquamenon Visit Engine — release benchmark

The product is no longer a waterfall-flow dashboard. Its primary job is to help a visitor who is already considering or making a Tahquamenon trip use their available time well.

## 100-point benchmark

- 20 — First-screen decision value: time available + visitor needs produces an immediately understandable plan.
- 15 — Itinerary usefulness: realistic sequencing, travel/stop time, Upper/Lower order, and clear skip logic.
- 10 — Accessibility/family usefulness: mobility and kid constraints materially change the route.
- 10 — Live context integrity: weather, river, daylight and NWS hazards adjust the visit without pretending to decide whether the park is worth visiting.
- 10 — Search usefulness: crawlable answers for visit length, Upper vs Lower, accessibility, River Trail, kids, food and winter.
- 10 — Winter value: Tahquamenon XC skiing is treated as a first-class seasonal use case and cross-links to the Michigan XC network.
- 10 — Map-plan integration: map points can be inspected and added to the current itinerary.
- 5 — Local-first continuity: time, preferences and custom stops persist on the device.
- 5 — Performance/mobile: no blocking Leaflet load; useful first screen at 390px width.
- 5 — Explainability/provenance: stable facts remain deterministic and official-source links are easy to reach.

Release gate: 92/100.

## Hard vetoes

- A generic “worth going?” waterfall score returns to the first screen.
- JEV is allowed to invent park facts, hours, closures, accessibility, trail lengths, shuttle operation or safety state.
- NWS alert failure is presented as “no hazards.”
- River flow is presented as the reason to visit or not visit.
- The winter section lacks a working link to the Michigan XC tool.
- The page requires the interactive map or JEV endpoint to be useful.
- The mobile first screen is dominated by a huge banner before the planner controls.
