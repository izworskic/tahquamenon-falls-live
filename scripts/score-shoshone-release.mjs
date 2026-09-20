import fs from 'node:fs';

const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('public/shoshone-falls/index.html');
const css=read('public/assets/shoshone-falls.css');
const js=read('public/assets/shoshone-falls.js');
const api=read('api/shoshone-falls.js');

const dimensions={
  firstScreen:{weight:18,pass:/id="decision-card"/.test(html)&&/data-travel="special"/.test(html)&&/flow-status/.test(html)},
  hydrologicTruth:{weight:15,pass:/directVerified:false,cfs:null/.test(api)&&/downstream context; not waterfall spill/.test(api)&&/r\.fresh/.test(js)&&!/getUsgs\(MILNER_SITE\)/.test(api)},
  experienceTranslation:{weight:13,pass:/class="regime-scale"/.test(html)&&/riverSignal/.test(api)&&/Reference points only/i.test(html)},
  outlook:{weight:10,pass:/candidateWindows/.test(api)&&/bestWindow/.test(api)&&/does not predict waterfall flow/.test(html+js+api)},
  personaTravel:{weight:10,pass:['nearby','under1','one2','special'].every(x=>html.includes('data-travel="'+x+'"'))&&/travel===/.test(api)},
  jev:{weight:8,pass:/getVercelOidcToken/.test(api)&&/rankWindowWithJev/.test(api)&&/confidence/.test(api)&&/injection_dependency/.test(api)},
  visualEvidence:{weight:7,pass:/-Y7P-WfeXuE/.test(html+api)&&/not (the )?live view/i.test(html)},
  photography:{weight:5,pass:/class="photo-intel"/.test(html)&&/id="photo-window"/.test(html)&&/rainbowStatus/.test(api)&&/mist/.test(api.toLowerCase())},
  planning:{weight:4,pass:['data-time="30"','data-time="60"','data-time="120"','data-time="240"'].every(x=>html.includes(x))},
  regionalNetwork:{weight:3,pass:['Dierkes Lake','Perrine Bridge','Thousand Springs'].every(x=>html.includes(x))},
  searchIA:{weight:3,pass:/Shoshone Falls today/i.test(html)&&/Is it worth your drive/i.test(html)&&/https:\/\/chrisizworski\.com\/shoshone-falls\//.test(html)&&/application\/ld\+json/.test(html)},
  performance:{weight:2,pass:/loading="lazy"/.test(html)&&/load-map/.test(html)&&/leaflet/i.test(js)},
  accessibility:{weight:2,pass:/class="skip"/.test(html)&&/aria-live/.test(html)&&/prefers-reduced-motion/.test(css)}
};

const hardVetoes={
  directProxyMasquerade:!/directVerified:false,cfs:null/.test(api),
  milnerPseudoLive:/getUsgs\(MILNER_SITE\)/.test(api),
  staleShownLive:!/r\.fresh/.test(js),
  browserHarnessSecret:/HARNESS_ACCESS_KEY|VERCEL_OIDC_TOKEN|TYPESAFE/i.test(js),
  fakeCamera:!/-Y7P-WfeXuE/.test(html),
  canonicalBroken:!/href="https:\/\/chrisizworski\.com\/shoshone-falls\/"|content="https:\/\/chrisizworski\.com\/shoshone-falls\/"/.test(html),
  analyticsMissing:!/G-Y5D2V2W7HN/.test(html),
  adsenseMetadataMissing:!/ca-pub-8222782620788075/.test(html),
  mobileContractMissing:!/@media\(max-width:(?:620|760|860)px\)/.test(css)
};

const score=Object.values(dimensions).reduce((s,d)=>s+(d.pass?d.weight:0),0);
const failedDimensions=Object.entries(dimensions).filter(([,d])=>!d.pass).map(([k,d])=>({name:k,weight:d.weight}));
const activeVetoes=Object.entries(hardVetoes).filter(([,v])=>v).map(([k])=>k);
const report={generatedAt:new Date().toISOString(),score,target:94,pass:score>=94&&!activeVetoes.length,dimensions,failedDimensions,hardVetoes,activeVetoes,truthBoundary:'Exact waterfall CFS remains intentionally unpublished until the Idaho Power Shoshone dataset semantics are verified.'};
fs.mkdirSync(new URL('../reports/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../reports/shoshone-scorecard.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(!report.pass) process.exit(1);
