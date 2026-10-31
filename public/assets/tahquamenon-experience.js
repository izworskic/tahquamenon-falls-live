// EXPERIENCE_OS_V1: connected visitor choices. No routing or live-access inference.
export const FEATURED = Object.freeze([
  {id:'upper-falls',name:'Upper Falls',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tahquamenon_Falls_-_Autumn.JPG?width=720',page:'https://commons.wikimedia.org/wiki/File:Tahquamenon_Falls_-_Autumn.JPG',credit:'Wfgc · public domain'},
  {id:'lower-falls',name:'Lower Falls',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lower_Tahquamenon_Falls.jpg?width=720',page:'https://commons.wikimedia.org/wiki/File:Lower_Tahquamenon_Falls.jpg',credit:'Joe Passe · CC BY-SA 2.0'},
  {id:'island-bridge',name:'Island Bridge',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tahquamenon_Falls_State_Park_bridge.jpg?width=720',page:'https://commons.wikimedia.org/wiki/File:Tahquamenon_Falls_State_Park_bridge.jpg',credit:'Notorious4life · CC0'}
]);
export const FEATURES = Object.freeze(Object.fromEntries(FEATURED.map(item=>[item.id,item])));
export function plannedExperiences(plan,places){
 const known=new Map(places.map(p=>[p.id,p]));const seen=new Set();
 return (Array.isArray(plan?.stops)?plan.stops:[]).filter(s=>s&&known.has(s.id)&&!seen.has(s.id)&&seen.add(s.id)).map(s=>({id:s.id,name:known.get(s.id).name,tag:s.tag||'Plan stop'}));
}
export function featuredStatuses(plan,places){const selected=new Set(plannedExperiences(plan,places).map(s=>s.id));return FEATURED.map(x=>({id:x.id,inPlan:selected.has(x.id)}));}
