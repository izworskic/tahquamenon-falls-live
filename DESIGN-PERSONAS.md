# Tahquamenon Falls Live — Persona-driven redesign

## Product objective
Make the tool feel like Tahquamenon first and software second. Live data should answer a visitor decision rather than become the visual identity of the page.

## Research signals
Research included the Michigan DNR Tahquamenon Falls State Park page and visitor guide, recent 2026 visitor reviews, family River Trail discussion, and current outdoor-planning product patterns.

Repeated visitor needs:
- First-time visitors often have 1–4 hours and need to choose Upper Falls, Lower Falls, or both.
- Visitors repeatedly ask how much walking is involved and whether older adults, children, strollers, wheelchairs, or injured companions can manage the experience.
- The new Upper Falls accessible boardwalk improves access but lengthens the approach, so expectations matter.
- The River Trail is a logistics decision: 5.1 miles one way, roughly three hours, with shuttle/vehicle planning required.
- Families often combine the falls with the brewery, food, restrooms, and a practical meet-up plan.
- Campers care about Lower Falls, Rivermouth, paddling, fishing and sunset more than a single waterfall score.
- Photographers care about river power, cloud cover, precipitation, light and sunset together.

## Persona simulations

### First-time road-tripper
**Question:** Do we do both falls, and where do we start?
**Old friction:** The score and technical dimensions arrive before the Upper-vs-Lower decision.
**New path:** First-time card → half-day plan → Upper first → Lower + island → food stop. A visual Upper/Lower comparison answers the question before the map.

### Family / accessibility-first visitor
**Question:** What can everyone actually do?
**Old friction:** Accessibility was scattered across map POIs.
**New path:** Easy + accessible card → short-visit plan + access-filtered map. Larger type and tap targets reduce mobile friction.

### River Trail hiker
**Question:** How hard is this and how do I get back?
**Old friction:** Hiker logistics were visually subordinate to the dashboard.
**New path:** River Trail card shows 5.1 miles one way and transport logistics before the click, then routes to the hiker plan and trail map.

### Photographer / fall-color visitor
**Question:** Is the flow/light window worth the drive right now?
**Old friction:** Photo score was one equal telemetry box.
**New path:** Best photos card → photo-filtered map + full-day plan, with flow/cloud/sunset visible as one decision.

### Camper / repeat visitor
**Question:** What should we do around camp today?
**Old friction:** Campground and Rivermouth context was buried inside the map.
**New path:** Camping card → campground-filtered map and full-day itinerary.

## Visual system
- **Destination before dashboard:** real waterfall photography in the hero; score becomes a field card rather than the page identity.
- **Typography:** Source Serif 4 for place/editorial hierarchy, Source Sans 3 for decisions and controls.
- **Color:** warm paper, deep evergreen, Tahquamenon tannin orange and foam/cream. Reduced near-black fintech styling.
- **Imagery:** real Creative Commons Tahquamenon photography from Wikimedia Commons, visibly credited.
- **Interaction order:** worth going → kind of visit → Upper vs Lower → live conditions → map → itinerary → methodology.

## Release gates
- First-time visitor understands Upper vs Lower without opening the map.
- Mobility-limited visitor reaches a useful path in one tap.
- River Trail visitor sees one-way distance and transport warning before committing.
- Photographer reaches flow/light/sunset intelligence in one tap.
- Camper reaches campground/Rivermouth context in one tap.
- No current waterfall score appears without fresh USGS discharge.
- No stale river state is visually presented as live.
- Mobile controls do not require precision tapping.
- Real photography is credited and never presented as a live camera view.
