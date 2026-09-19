const FALL_PERSONAS = new Set(['fall_color','scenic_road_trip','photography','destination_explorer']);
const WINTER_PERSONAS = new Set(['winter_xc']);

function prefSet(value) {
  if (value instanceof Set) return value;
  return new Set(Array.isArray(value) ? value : []);
}
function clampScore(value) { return Math.max(0, Math.min(100, Math.round(value))); }
export function plannedMinutes(plan) {
  return (plan?.stops || []).reduce((sum, stop) => sum + (Number(stop?.minutes) || 0), 0);
}
export function hasStop(plan, id) {
  return Boolean((plan?.stops || []).some(stop => stop?.id === id));
}
export function fallPhaseStrength(fall) {
  if (!fall?.active || !fall?.available) return 0;
  if (fall.phase === 'peak') return 100;
  if (fall.phase === 'rising') return Math.max(35, Math.min(95, Number(fall.pct) || 60));
  if (fall.phase === 'falling') return Math.max(20, Math.min(90, Number(fall.pct) || 55));
  if (fall.phase === 'green') return 20;
  return 10;
}
function explicitIntentFit(plan, ctx) {
  const prefs = prefSet(ctx.prefs);
  let score = 82;
  if (prefs.has('easy')) score += hasStop(plan,'river-trail') ? -45 : hasStop(plan,'upper-boardwalk') ? 14 : 4;
  if (prefs.has('kids')) score += plan.order?.startsWith('Lower') || hasStop(plan,'island-bridge') ? 10 : 2;
  if (prefs.has('hike')) score += hasStop(plan,'river-trail') ? 14 : -4;
  if (prefs.has('photo')) score += (hasStop(plan,'rivermouth-sunset') || plan.seasonalEmphasis === 'fall-color') ? 10 : 1;
  if (prefs.has('food')) score += hasStop(plan,'brewery') ? 10 : -4;
  if (prefs.has('winter')) score += hasStop(plan,'winter-trail-system') ? 14 : -25;
  if (ctx.intent === 'fall-color') score += plan.seasonalEmphasis === 'fall-color' ? 12 : -6;
  if (ctx.intent === 'xc') score += hasStop(plan,'winter-trail-system') ? 12 : -8;
  return clampScore(score);
}
function timeFit(plan, ctx) {
  const used = plannedMinutes(plan);
  const budget = Math.max(1, Number(ctx.minutes) || 180);
  if (used > budget) return 0;
  const utilization = used / budget;
  if (utilization >= .55 && utilization <= .92) return 100;
  if (utilization > .92) return 88;
  return clampScore(65 + utilization * 45);
}
function seasonalPayoff(plan, ctx) {
  const fall = ctx.seasonal?.modules?.fall;
  const winter = ctx.seasonal?.modules?.winter;
  if (fall?.active && fall?.available) {
    const strength = fallPhaseStrength(fall);
    const bonus = plan.seasonalEmphasis === 'fall-color' ? 12 : 0;
    return clampScore(35 + strength * .55 + bonus);
  }
  if (winter?.active || prefSet(ctx.prefs).has('winter')) return hasStop(plan,'winter-trail-system') ? 92 : 35;
  return 62;
}
function liveConditionFit(ctx) {
  const live = ctx.live || {};
  const alerts = Array.isArray(live.alerts) ? live.alerts.length : 0;
  if (live.alertStatus?.verified === false) return 55;
  if (alerts) return 60;
  const rain = Number(live.weather?.precipChance);
  if (Number.isFinite(rain) && rain >= 60) return 62;
  return 88;
}
function accessibilityFit(plan, ctx) {
  const prefs = prefSet(ctx.prefs);
  if (!prefs.has('easy')) return 88;
  if (hasStop(plan,'river-trail')) return 15;
  return hasStop(plan,'upper-boardwalk') || hasStop(plan,'upper-falls') ? 100 : 75;
}
function groupFit(plan, ctx) {
  const prefs = prefSet(ctx.prefs);
  if (prefs.has('kids')) return plan.order?.startsWith('Lower') || hasStop(plan,'island-bridge') ? 96 : 76;
  return 86;
}
function routeEfficiency(plan) {
  const ids = (plan?.stops || []).map(stop => stop.id);
  let score = 90;
  const duplicateCount = ids.length - new Set(ids).size;
  score -= duplicateCount * 18;
  return clampScore(score);
}
function signatureExperience(plan) {
  return hasStop(plan,'upper-falls') ? 100 : 45;
}
function networkOpportunity(plan, ctx) {
  if (plan?.optionalExtension?.id === 'm123-paradise') return 100;
  if (ctx.seasonal?.modules?.fall?.active && plan.seasonalEmphasis === 'fall-color') return 92;
  if ((ctx.seasonal?.modules?.winter?.active || prefSet(ctx.prefs).has('winter')) && hasStop(plan,'winter-trail-system')) return 92;
  return 68;
}
export function itineraryValue(plan, ctx = {}) {
  const components = {
    explicitIntentFit: explicitIntentFit(plan,ctx),
    timeFit: timeFit(plan,ctx),
    seasonalPayoff: seasonalPayoff(plan,ctx),
    liveConditionFit: liveConditionFit(ctx),
    accessibilityFit: accessibilityFit(plan,ctx),
    groupFit: groupFit(plan,ctx),
    routeEfficiency: routeEfficiency(plan),
    signatureExperience: signatureExperience(plan),
    networkOpportunity: networkOpportunity(plan,ctx)
  };
  const score =
    .25*components.explicitIntentFit +
    .18*components.timeFit +
    .14*components.seasonalPayoff +
    .10*components.liveConditionFit +
    .10*components.accessibilityFit +
    .08*components.groupFit +
    .06*components.routeEfficiency +
    .05*components.signatureExperience +
    .04*components.networkOpportunity;
  return { score:clampScore(score), components, plannedMinutes:plannedMinutes(plan) };
}
export function visitorValue(plan, ctx = {}) {
  const i = itineraryValue(plan,ctx);
  const decisionUsefulness = clampScore((i.components.explicitIntentFit+i.components.timeFit)/2);
  const itineraryFit = clampScore((i.components.timeFit+i.components.routeEfficiency+i.components.signatureExperience)/3);
  const seasonalRelevance = i.components.seasonalPayoff;
  const liveContextValue = i.components.liveConditionFit;
  const accessibilityFamilyValue = clampScore((i.components.accessibilityFit+i.components.groupFit)/2);
  const networkValue = i.components.networkOpportunity;
  const explainability = plan?.seasonalReason ? 95 : 84;
  return clampScore(
    .25*decisionUsefulness +
    .20*itineraryFit +
    .15*seasonalRelevance +
    .10*liveContextValue +
    .10*accessibilityFamilyValue +
    .10*networkValue +
    .10*explainability
  );
}
export function growthValue(plan, ctx = {}) {
  const seasonal = ctx.seasonal?.modules?.fall?.active || ctx.seasonal?.modules?.winter?.active;
  const querySatisfaction = explicitIntentFit(plan,ctx);
  const originalUtility = clampScore((timeFit(plan,ctx)+signatureExperience(plan))/2);
  const internalEntityGraph = seasonal ? 92 : 78;
  const serpClickPromise = seasonal ? 88 : 82;
  const engagementDepth = clampScore(72 + Math.min(18,(plan?.stops || []).length*3));
  const performance = 96;
  const structuredDataQuality = 92;
  return clampScore(
    .25*querySatisfaction +
    .20*originalUtility +
    .15*internalEntityGraph +
    .15*serpClickPromise +
    .10*engagementDepth +
    .10*performance +
    .05*structuredDataQuality
  );
}
export function totalProductValue(plan, ctx = {}) {
  const visitor = visitorValue(plan,ctx);
  const growth = growthValue(plan,ctx);
  return { visitor, growth, total:clampScore(.65*visitor+.35*growth), itinerary:itineraryValue(plan,ctx) };
}
function clonePlan(plan) {
  return { ...plan, stops:(plan?.stops || []).map(stop => ({...stop})) };
}
function enhanceFallStops(plan, fall, ctx) {
  const out = clonePlan(plan);
  const strong = fallPhaseStrength(fall) >= 72;
  out.seasonalEmphasis = 'fall-color';
  out.seasonalReason = fall.label ? `${fall.label} in the eastern U.P. makes the wooded portions of this itinerary more valuable.` : 'Fall color is active in the eastern U.P.';
  out.stops = out.stops.map(stop => {
    if (stop.id === 'upper-falls') return { ...stop, tag:strong ? 'Upper Falls · fall color' : stop.tag, text:`${stop.text} ${strong ? 'Give the gorge and hardwood backdrop extra time while color is strong.' : 'Use the gorge backdrop as your quickest read on how the season is developing.'}` };
    if (stop.id === 'lower-falls') return { ...stop, tag:strong ? 'Lower Falls · fall color' : stop.tag, text:`${stop.text} ${strong ? 'The island and multiple cascades add more foliage angles than a single overlook.' : 'The island and river corridor give you a broader mix of hardwood and water views.'}` };
    if (stop.id === 'river-trail') return { ...stop, tag:'Fall-color hike', text:`${stop.text} ${strong ? 'During strong color this is the highest-payoff way to spend trail time in the park.' : 'As color builds, the river corridor gains value relative to a generic forest walk.'}` };
    if (stop.id === 'upper-boardwalk' && prefSet(ctx.prefs).has('easy')) return { ...stop, tag:'Accessible fall view', text:`${stop.text} This is the low-effort way to pair the signature waterfall with seasonal color.` };
    return stop;
  });
  return out;
}
function fallExtensionCandidate(plan, fall, ctx) {
  const persona = ctx.persona || '';
  const prefs = prefSet(ctx.prefs);
  const interested = ctx.intent === 'fall-color' || FALL_PERSONAS.has(persona) || prefs.has('photo');
  if (!interested || Number(ctx.minutes) < 300 || !fall?.active || !fall?.available) return null;
  return {
    ...clonePlan(plan),
    seasonalEmphasis:'fall-color',
    seasonalReason:'The visitor has enough time and explicit fall/scenic interest to make the drive between park areas part of the experience.',
    optionalExtension:{
      id:'m123-paradise',
      title:'Optional extra-time fall extension',
      text:'If you still have comfortable daylight after the falls, continue the M-123 / Paradise corridor instead of adding another marginal park stop. Use the dedicated fall-color page for the current regional read before committing.',
      href:'https://chrisizworski.com/fall-color/tahquamenon-falls-fall-color/'
    }
  };
}
export function applySeasonalIntelligence(basePlan, ctx = {}) {
  let best = clonePlan(basePlan);
  const fall = ctx.seasonal?.modules?.fall;
  const winter = ctx.seasonal?.modules?.winter;
  if (fall?.active && fall?.available) best = enhanceFallStops(best,fall,ctx);
  if ((winter?.active || prefSet(ctx.prefs).has('winter') || WINTER_PERSONAS.has(ctx.persona)) && hasStop(best,'winter-trail-system')) {
    best.seasonalEmphasis='winter-xc';
    best.seasonalReason='Winter recreation is an explicit visitor priority; snow and grooming still require local verification.';
  }

  const candidates=[best];
  const fallExtension=fallExtensionCandidate(best,fall,ctx);
  if (fallExtension) candidates.push(fallExtension);

  const feasible=candidates.filter(plan => plannedMinutes(plan) <= Math.max(30,Number(ctx.minutes)||180));
  const pool=feasible.length?feasible:[best];
  let winner=pool[0], winnerValue=totalProductValue(pool[0],ctx);
  for(const candidate of pool.slice(1)){
    const value=totalProductValue(candidate,ctx);
    if(value.total>winnerValue.total){ winner=candidate; winnerValue=value; }
  }
  return { ...winner, value:winnerValue };
}
