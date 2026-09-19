# Tahquamenon Seasonal Destination Intelligence — Release Benchmark

Release gate: **94/100 minimum and zero hard vetoes.**

## 100-point benchmark

| Area | Points | Release requirement |
|---|---:|---|
| First-screen utility | 15 | Compact approved planner remains the first decision surface; no seasonal hero or card wall. |
| Persona / intent quality | 15 | Combined intents work; hidden personas improve ranking; deterministic fallback remains useful. |
| Seasonal intelligence | 15 | Fall consumes the shared Michigan engine; winter remains trustworthy; spring/summer degrade cleanly. |
| Itinerary quality | 15 | Planned activity minutes never exceed the selected visit window; no filler; accessibility protected. |
| Fall network integration | 10 | Shared snapshot consumed; reciprocal fall-page handoff; no duplicated fall model. |
| XC network integration | 8 | Contextual Eastern UP XC handoff; no unsupported Tahquamenon grooming claim. |
| Live-data integrity | 7 | USGS/NWS/weather behavior preserved; fall source health explicit. |
| Search / content architecture | 5 | Planner owns trip execution; fall page owns foliage depth; canonical unchanged. |
| Mobile / performance | 5 | Seasonal fetch is progressive; map stays lazy; no framework added. |
| Reliability / fallback | 5 | JEV, fall feed and seasonal context all fail soft. |

## Hard vetoes

- Duplicated fall-color model inside this repository.
- Modeled fall stage presented as an observed leaf count.
- JEV generating factual park, trail, safety, hours or grooming claims.
- Shared JEV harness becoming required for core planning.
- Any generated core itinerary exceeding the selected time budget.
- Accessibility persona routed to River Trail.
- NWS failure rendered as "no hazards."
- Stale seasonal data silently presented as current.
- Tahquamenon grooming status claimed without a direct reliable source.
- Seasonal context becoming a giant dashboard section.
- New visible persona button wall.
- Large editorial hero returning.
- Generic footer-only cross-pollination replacing contextual handoffs.
- Canonical production proxy not tested.

## Value functions

Itinerary value:

```text
0.25 explicit_intent_fit
+ 0.18 time_fit
+ 0.14 seasonal_payoff
+ 0.10 live_condition_fit
+ 0.10 accessibility_fit
+ 0.08 group_fit
+ 0.06 route_efficiency
+ 0.05 signature_experience
+ 0.04 network_opportunity
```

Product value:

```text
TOTAL_PRODUCT_VALUE =
  0.65 * VISITOR_VALUE
+ 0.35 * GROWTH_VALUE
```

Visitor value has priority over growth value whenever they conflict.
