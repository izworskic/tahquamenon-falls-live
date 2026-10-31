# Tahquamenon Falls: ranger-style interpretive voice
**Review date:** 2026-10-31 · **Canonical:** https://chrisizworski.com/tahquamenon-falls/  
**Status:** Editorial revision in the authoritative Tahquamenon source repository. This is **independent interpretation**, not a claim of being an official Michigan DNR ranger.

## What the visitor should feel
A knowledgeable state park interpreter knows the forest, the river, the practical visitor paths and the difference between a beautiful scene and safe access. The voice should show the visitor *what to notice*, *why it is that way*, and *how to enjoy it*, without false certainty or tourist-board superlatives.

**Voice formula:** See it → understand it → choose what to do.  
**Example:** “At Upper Falls, watch where the tannin-dark river spills over the ledge and churns into pale foam. The accessible boardwalk brings you through old-growth forest on the approach; you need not descend the steep gorge stairs to experience the falls.”

Avoid sales language, generic “hidden gem” adjectives, mechanical “maximize your trip” language, AI-like declarative score chatter and dramatic claims about wildlife encounters or current access. Do not use first-person park-employee claims or put invented quotations in a ranger's mouth. Speak naturally, in plain language, with grounded sensory detail and clear safety/season distinctions.

## Source checks
- [Michigan DNR official park page](https://www.michigan.gov/recsearch/parks/tahquamenonfalls): nearly 50,000 acres; river tannins from upstream swamps, foam from soft turbulent water, more than 200-foot Upper Falls ledge; 1,100-foot accessible boardwalk and old-growth forest; Lower Falls about 4 miles downstream; Ronald A. Olson Island Bridge; wildlife examples; winter trails and shuttle safety; access and facilities.
- [Michigan DNR visitor education](https://www.michigan.gov/dnr/places/v-centers/tahquamenon): Upper Falls around 50 feet tall, Lower Falls viewpoints and bridge, accessible alternatives; gorge steps are a separate more demanding walk; designated wading only.
- [DNR recreation accessibility](https://www.michigan.gov/dnr/about/accessibility/trails): accessible upper walkway and island bridge, but no guarantee of present conditions.
- Existing verified in-repo official trail map sources underpin the 5.1-mile point-to-point River Trail; always re-check before promising shuttle trips or winter travel.

### What does not follow from those sources
- Tannins alone do not prove potable, safe or unpolluted water. We say color *by itself* is not an indicator of muddy or polluted water, not that the river is safe to drink.
- Archival photographs do not describe today's access or weather.
- The official accessible route does not make the steep gorge staircase accessible.
- Public wildlife presence does not predict sightings.
- A winter ski-loop listing does not establish fresh grooming or permission to walk on tracks.
- The existence of a seasonal shuttle does not guarantee a ride on a date.
- A map point does not establish safe road/trail navigation.
- The JEV shared harness is an optional adaptive-planning enhancement; the core itinerary remains deterministic and available.

## Editorial structure and limits

| Surface | Treatment | Reason |
| --- | --- | --- |
| Hero | 29-word, location-specific invitation; familiar `h1` preserved | Protect the first-screen planner and established SEO tests |
| Time-sensitive itinerary | Specific, concise prose per recommendation with the real stops and constraints | Changing time/priority still changes decisions, not just styling |
| Three photographic choices | Ranger-style descriptions that explain the distinct experiences | The visitor understands *why* Upper and Lower differ |
| 17 map destinations | 35–135 words of source-aware place context per destination | Field-guide language stays attached to actual mapped stops |
| “Read the Landscape” section | Four short chapters on water, forest, river behavior, and wildlife, each with a source or local link | A durable interpretive layer after the map, before live conditions |
| Practical guide + winter + FAQ | Clear walking, accessibility, shuttle, family and winter guidance | Practical answers remain scannable |
| Accessibility and mobile | 14px+ paragraphs, readable 2/1-column chapters, reduced motion and keyboard | Better copy is useless if too small or hidden |

## Verification and acceptance

`npm run verify` includes `scripts/verify-ranger-copy.mjs` to check editorial substance, source links, 17 POI descriptions and critical safety statements without altering canonical, Person JSON-LD or the existing visitor plan. Playwright additionally checks four viewport widths, font size, chapter dimensions, no overflow, keyboard and failure behavior.

**After release:** inspect actual public HTML and mobile render, not only the extracted tool origin. Report any broken content, unexpected styling or outdated access claims before calling the work finished.

## Reusable lesson for EXPERIENCE_OS_V1

Interpretation is an interaction ingredient, not just a section to append. When a visitor selects a destination, the text should explain what they are looking at, what changes from the last stop, what practical choices it implies and what remains uncertain. Keep short answers at the top and layer the deeper landscape explanation into the journey. This pattern may benefit Sleeping Giant, Pukaskwa, Porcupine Mountains and Lake Superior Provincial Park, but exact writing must be verified for each place.
