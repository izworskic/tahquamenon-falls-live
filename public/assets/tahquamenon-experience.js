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

const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
export function createExperience({places,choosePlace}){
 const root=document.querySelector('#experienceChooser');
 const path=document.querySelector('#experiencePlanPath');
 const summary=document.querySelector('#experiencePlanSummary');
 const list=document.querySelector('#experienceStopList');
 const photo=document.querySelector('#experiencePanelPhoto');
 const image=document.querySelector('#experiencePanelPhotoImage');
 const credit=document.querySelector('#experiencePanelPhotoCredit');
 if(!root||!path||!summary||!list)return {renderPlan(){},select(){},filter(){}};
 const known=new Map(places.map(p=>[p.id,p]));
 let selected=null;
 const inspect=(id)=>{if(known.has(id))choosePlace(id,{scroll:true,fly:true});};
 function select(place){
  if(!place)return;
  selected=place.id;
  root.querySelectorAll('[data-experience-place]').forEach(b=>{
   const active=b.dataset.experiencePlace===selected;
   b.setAttribute('aria-pressed',String(active));
   b.closest('.experience-card')?.classList.toggle('is-selected',active);
  });
  for(const b of list.querySelectorAll('[data-experience-stop]')){
   const active=b.dataset.experienceStop===selected;
   b.setAttribute('aria-current',String(active));b.classList.toggle('is-selected',active);
  }
  for(const b of path.querySelectorAll('[data-experience-plan-stop]'))b.setAttribute('aria-current',String(b.dataset.experiencePlanStop===selected));
  const feature=FEATURES[selected];
  if(photo&&image&&credit){
   if(feature){
    photo.hidden=true;
    image.alt=feature.name+' at Tahquamenon Falls State Park, archival image (not live conditions).';
    credit.href=feature.page;
    credit.textContent='Photo: '+feature.credit+' · archival';
    image.onload=()=>{if(selected===feature.id)photo.hidden=false;};
    image.onerror=()=>{if(selected===feature.id)photo.hidden=true;};
    image.src=feature.image;
    if(image.complete&&image.naturalWidth>0)photo.hidden=false;
   }else{
    photo.hidden=true;
    image.onload=null;image.onerror=null;image.removeAttribute('src');
   }
  }
 }
 function renderPlan(plan,minutes){
  const steps=plannedExperiences(plan,places);
  path.replaceChildren();
  for(let i=0;i<steps.length;i++){
   const step=steps[i],b=make('button','experience-plan-step');
   b.type='button';b.dataset.experiencePlanStop=step.id;
   b.setAttribute('aria-label','Inspect plan stop '+(i+1)+': '+step.name);
   b.setAttribute('aria-current',String(step.id===selected));
   b.append(make('span','experience-plan-number',String(i+1)),make('span','experience-plan-name',step.name));
   b.addEventListener('click',()=>inspect(step.id));path.append(b);
  }
  const duration=minutes<=45?'short stop':minutes<=90?'focused visit':minutes<=180?'three-hour visit':'longer park day';
  summary.textContent=steps.length?'Your '+duration+': '+steps.map(s=>s.name).join(' → ')+'. Choose a stop for map context and its official source.':'Choose a visit length above to build your route.';
  const ids=new Set(steps.map(s=>s.id));
  root.querySelectorAll('[data-experience-card]').forEach(card=>{
   const inPlan=ids.has(card.dataset.experienceCard);
   card.classList.toggle('is-in-plan',inPlan);
   const label=card.querySelector('[data-experience-card-status]');
   if(label)label.textContent=inPlan?'In your plan':'Explore as an alternative';
  });
 }
 function renderList(category='all'){
  const eligible=places.filter(p=>category==='all'||p.category===category);
  list.replaceChildren();
  for(const p of eligible){
   const li=make('li','experience-stop-item'),button=make('button','experience-stop-button',p.name),link=make('a','experience-stop-source','Details');
   button.type='button';button.dataset.experienceStop=p.id;
   button.setAttribute('aria-current',String(p.id===selected));
   button.addEventListener('click',()=>inspect(p.id));
   const url=String(p.url||'');
   link.href=url.startsWith('https://')?url:'https://www.michigan.gov/recsearch/parks/tahquamenonfalls';
   link.target='_blank';link.rel='noopener noreferrer';
   link.setAttribute('aria-label','Source information for '+p.name);
   li.append(button,link);list.append(li);
  }
  if(!eligible.length)list.append(make('li','experience-stop-empty','No stops match this filter. Choose All.'));
 }
 root.querySelectorAll('[data-experience-place]').forEach(b=>b.addEventListener('click',()=>inspect(b.dataset.experiencePlace)));
 renderList();
 return {renderPlan,select,filter:renderList};
}
