const FALL_SNAPSHOT_URL = process.env.FALL_SNAPSHOT_URL || 'https://chrisizworski.com/api/fall-color?view=snapshot';

function etDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Detroit',month:'numeric',day:'numeric'}).formatToParts(now);
  return Object.fromEntries(parts.filter(p=>p.type==='month'||p.type==='day').map(p=>[p.type,Number(p.value)]));
}
function inWindow(month,day,startMonth,startDay,endMonth,endDay){
  const value=month*100+day, start=startMonth*100+startDay, end=endMonth*100+endDay;
  return value>=start && value<=end;
}
function baseSeason(now = new Date()) {
  const {month,day}=etDateParts(now);
  if(inWindow(month,day,8,20,11,15)) return 'fall';
  if(month===12 || month<=3) return 'winter';
  if(month===4 || month===5) return 'spring';
  return 'summer';
}
function intentFrom(req){
  const raw=Array.isArray(req?.query?.intent)?req.query.intent[0]:req?.query?.intent;
  const value=String(raw||'').toLowerCase();
  return ['fall-color','xc'].includes(value)?value:null;
}
function safeDate(value){
  const t=Date.parse(value||'');
  return Number.isFinite(t)?new Date(t).toISOString():null;
}
function normalizeFall(payload,intent,now = new Date()){
  const region=(payload?.regions||[]).find(r=>r?.id==='eup');
  const updated=safeDate(payload?.updated);
  const ageHours=updated?Math.max(0,(now.getTime()-Date.parse(updated))/36e5):null;
  const fresh=Number.isFinite(ageHours) && ageHours<=30;
  const inSeason=payload?.inSeason===true || baseSeason(now)==='fall' || intent==='fall-color';
  if(!region) return {
    active:inSeason, available:false, fresh:false, relevance:intent==='fall-color'?0.75:0.35,
    label:'Fall color context unavailable', phase:null, pct:null, peakWindow:null, updatedAt:updated,
    basis:'The shared fall-color model is unavailable, so no foliage stage is being inferred here.',
    href:'https://chrisizworski.com/fall-color/tahquamenon-falls-fall-color/'
  };
  const phase=String(region.phase||'');
  const pct=Number.isFinite(Number(region.pct))?Number(region.pct):null;
  const phaseWeight=phase==='peak'?1:phase==='rising'?.82:phase==='falling'?.7:phase==='green'?.3:.2;
  const relevance=Math.min(1,phaseWeight+(intent==='fall-color'?.15:0));
  return {
    active:inSeason, available:true, fresh, relevance,
    label:region.label||'Fall color active', phase, pct,
    peakWindow:region.peakWindow||null, weatherFeel:region.weatherFeel||null,
    updatedAt:updated, drivers:Array.isArray(region.source?.drivers)?region.source.drivers:[],
    basis:'Modeled eastern U.P. seasonal stage from the existing Michigan fall-color engine; not a direct leaf-count observation.',
    drive:region.drive||null, hike:region.hike||null,
    href:'https://chrisizworski.com/fall-color/tahquamenon-falls-fall-color/'
  };
}
function winterModule(intent,now = new Date()){
  const active=baseSeason(now)==='winter'||intent==='xc';
  return {
    active, available:true, relevance:intent==='xc'?1:active?.8:.15,
    label:active?'Winter / XC season':'Winter planning available',
    basis:'Park trail facts plus current Tahquamenon weather; grooming status must be verified locally.',
    href:'https://xcski.chrisizworski.com/regions/straits-eastern-up/'
  };
}
async function fetchFallSnapshot(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const response=await fetch(FALL_SNAPSHOT_URL,{headers:{accept:'application/json','user-agent':'Tahquamenon-Seasonal-Planner/1.0'},signal:controller.signal});
    if(!response.ok) throw new Error(`fall snapshot ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const intent=intentFrom(req);
  let fallPayload=null, fallStatus='ok';
  try{ fallPayload=await fetchFallSnapshot(); if(fallPayload?.error) fallStatus='degraded'; }
  catch(error){ fallStatus=error?.name==='AbortError'?'timeout':'unavailable'; }
  const now=new Date();
  const season=baseSeason(now);
  const fall=normalizeFall(fallPayload,intent,now);
  const winter=winterModule(intent,now);
  const spring={active:season==='spring',available:true,relevance:season==='spring'?.72:.1,label:'Spring waterfall season',basis:'Tahquamenon live weather and river context become more important in spring; trail conditions still require local verification.'};
  const summer={active:season==='summer',available:true,relevance:season==='summer'?.72:.1,label:'Summer park season',basis:'Long daylight, both falls, island access, hiking, food and water-oriented activities shape the summer visit.'};
  res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=7200');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  return res.status(200).json({
    schemaVersion:1,
    generatedAt:now.toISOString(),
    season,intent,
    sourceHealth:{fallColor:fallStatus},
    modules:{fall,winter,spring,summer}
  });
}

export { etDateParts, baseSeason, normalizeFall, winterModule, intentFrom };
