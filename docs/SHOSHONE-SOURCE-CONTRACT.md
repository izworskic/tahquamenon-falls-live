# Shoshone Falls Live — Source Contract

## Nonnegotiable source semantics

### Tier 1 — waterfall truth

A numeric value may be labeled **waterfall flow / flow over Shoshone Falls** only when its source definition is verified to measure physical spill over the falls, not total project discharge, downstream river discharge, powerhouse discharge, or another proxy.

Current status: **not yet verified for runtime use.**

Idaho Power's AQUARIUS portal publicly exposes a saved chart titled **Shoshone Falls Discharge Hydrograph**. The public product must not silently translate that label into "water over the falls" until the dataset metadata/measurement point is confirmed.

### Tier 2 — downstream river context

USGS **13090500 — Snake River near Twin Falls, Idaho** is useful current/historical river context downstream of Shoshone Falls. It is **not** the waterfall spill measurement.

Rules:

- label it downstream context;
- expose observation age;
- consider it stale after 120 minutes for a current decision;
- never let a newer weather observation refresh its status;
- never substitute it for waterfall spill when the waterfall source is unavailable.

### Tier 3 — Milner / upstream operations

USGS **13088000 — Snake River near Milner, Idaho** has important historical records, but its continuous record is historical rather than a dependable modern current feed for this product.

For current Milner/operational context, prefer Idaho Power or another explicitly current operational source after its API/feed contract is verified.

Until then the public tool links to the official Idaho Power portal and does not publish a pseudo-live Milner number.

### Tier 4 — visual verification

City of Twin Falls official Shoshone Falls live stream:

https://www.youtube.com/watch?v=PS0N6ZlbiqQ

This is visual evidence. It must never be converted by JEV into an invented CFS value.

### Tier 5 — weather/light

NWS and Open-Meteo support:

- temperature;
- wind;
- precipitation context;
- cloud cover;
- daylight;
- practical viewing and photography windows.

They do **not** prove current waterfall flow.

## JEV boundary

JEV receives only closed deterministic candidate windows. It may rank them for practical visitor value.

JEV may not:

- invent or edit hydrologic values;
- reinterpret a source's physical meaning;
- turn downstream flow into waterfall spill;
- turn missing data into a favorable condition;
- invent releases, closures, hours or hazards.

If JEV fails, is low-confidence, or selects an invalid candidate, deterministic ranking wins.

## Required normalized provenance

Every future numeric hydrologic source should expose:

- value
- unit
- observed_at
- retrieved_at
- source_name
- source_url
- measurement_type
- physical_location
- semantic_role
- freshness_minutes
- freshness_state
- provisional/reviewed state
- confidence

Source meaning is part of the data contract, not UI copy.
