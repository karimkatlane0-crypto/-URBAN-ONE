import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {premiumPageView,renderPremiumPage} from '../src/premium-page.js';
import {premiumOfferCatalog} from '../src/premium-model.js';

const scope='a'.repeat(64),ownId='prc_'+'a'.repeat(32),otherId='prc_'+'b'.repeat(32),requestId='prr_'+'c'.repeat(32);
const createdAt='2026-11-15T12:00:00.000Z',expiresAt='2030-02-13T12:00:00.000Z';
const card=(id=ownId)=>({id,sector:'property',intent:'buy',country:'IT',city:'Trieste',budgetBand:'10000_100000',horizon:'three_months',expiresAt,source:'self_declared'});
const candidate=()=>({...card(),revision:2,firstName:'Persona',lastName:'Di prova',phone:'+390401234567',marketing:{email:false,whatsapp:true,messenger:false},published:true,expiresAt,createdAt,updatedAt:createdAt,withdrawn:false,expired:false,phoneVerified:false});
const request=(status='requested',candidateId=ownId)=>({id:requestId,revision:1,candidateId,professionalName:'Operatore di prova',company:'Studio di prova',purpose:'property',status,expired:false,createdAt,expiresAt,approvedAt:null,paymentStatus:'unpaid',amountCents:100,currency:'eur',contact:null,chargeEnabled:false,accessEnabled:false});
const workspace=(overrides={})=>({schema:'synapsy-premium-workspace',version:1,scope,candidate:candidate(),incoming:[],outgoing:[],automaticMessages:false,automaticCharges:false,checkedAt:createdAt,...overrides});
const catalog=(rows=[card(otherId)])=>({schema:'synapsy-premium-catalog',version:1,scope,candidates:rows,totalReturned:rows.length,noTotal:true,checkedAt:createdAt});
const flush=async()=>{await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));};

function harness({auth=true,en=false}={}){
 const html=renderPremiumPage(auth?{scope,id:'PRIVATE_ACCOUNT',email:'PRIVATE_EMAIL',token:'PRIVATE_TOKEN'}:null,en?'en':'it'),nodes=new Map(),calls=[],events=new Map(),timers=[];let sequence=0;
 class Element{
  constructor(tag='div',id=''){this.tagName=tag.toUpperCase();this.id=id;this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.children=[];this.dataset={};this.attributes={};this._text='';this.valid=true;}
  set textContent(x){this._text=String(x??'');this.children=[];}get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
  set innerHTML(_x){throw Error('Dynamic HTML is not allowed');}
  append(...items){this.children.push(...items);}replaceChildren(...items){this._text='';this.children=items;}
  setAttribute(name,value){this.attributes[name]=value;}getAttribute(name){return this.attributes[name];}
  reportValidity(){return this.valid;}focus(){this.focused=true;}
 }
 for(const match of html.matchAll(/<(input|select|button|form|div|section|main|p)[^>]*\bid="([^"]+)"[^>]*>/g)){
  const node=new Element(match[1],match[2]);node.hidden=/\shidden(?:\s|>)/.test(match[0]);node.disabled=/\sdisabled(?:\s|>)/.test(match[0]);nodes.set(match[2],node);
 }
 const document={getElementById:id=>nodes.get(id)||null,createElement:tag=>new Element(tag)};
 const window={addEventListener:(name,fn)=>events.set(name,fn),location:{reload(){window.reloaded=true;}}};
 const context=vm.createContext({document,window,Date,Intl,URLSearchParams,AbortController,crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){},fetch:(path,options)=>new Promise((resolve,reject)=>calls.push({path,options,resolve,reject}))});
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];vm.runInContext(script,context);
 const element=id=>{const node=nodes.get(id);assert(node,'Missing element '+id);return node;};
 const complete=async(index,value,status=200)=>{calls[index].resolve(value instanceof Response?value:Response.json(value,{status}));await flush();};
 const prime=async(value=workspace())=>{await complete(0,premiumOfferCatalog());if(auth)await complete(1,value);};
 const all=(node)=>[node,...node.children.flatMap(all)];
 return {html,calls,events,element,complete,prime,all,nodes,window,privateText:()=>['pp-incoming','pp-outgoing','pp-results','pp-selected','pp-candidate-state'].map(id=>element(id).textContent).join(' '),values:()=>[...nodes.values()].map(x=>x.value).join(' ')};
}

test('Premium renders complete Italian and English pages, safe session scope and explicit inactive pricing',()=>{
 for(const lang of ['it','en']){
  const html=renderPremiumPage({scope,id:'PRIVATE_ACCOUNT',email:'PRIVATE_EMAIL',secret:'PRIVATE_SECRET'},lang);
  assert.match(html,new RegExp('<html lang="'+lang+'"'));
  assert.match(html,/name="robots" content="noindex"/);assert.match(html,/aria-live="polite"/);assert.match(html,/prefers-reduced-motion/);
  assert.match(html,/1 €/);assert.match(html,/200 €/);assert.doesNotMatch(html,/PRIVATE_ACCOUNT|PRIVATE_EMAIL|PRIVATE_SECRET|localStorage|sessionStorage|\.innerHTML\s*=|sendBeacon/);
  assert.doesNotMatch(html,/200\s*€\s*\/\s*mese|€200\s*\/\s*month/);
  assert.doesNotThrow(()=>new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]));
  for(const href of ['/privacy','/support','/cookies','/connections','/connections/telecom','/payments'])assert(html.includes('href="'+href+'"'));
 }
 assert.match(renderPremiumPage(null,'en'),/billing period to be defined/);
 assert.match(renderPremiumPage(),/periodicità da definire/);
 assert.match(renderPremiumPage(),/id="pp-revoke-marketing"/);
});

test('workspace projection removes identifiers and unrelated private fields and rejects any contact disclosure',()=>{
 const input=workspace();input.accountId='PRIVATE_ACCOUNT';input.candidate.token='PRIVATE_TOKEN';input.incoming=[request()];input.incoming[0].operatorEmail='PRIVATE_EMAIL';
 const view=premiumPageView(input,'workspace',scope),raw=JSON.stringify(view);
 assert.equal(view.candidate.firstName,'Persona');assert.equal(view.candidate.phoneVerified,false);assert.doesNotMatch(raw,/PRIVATE_|operatorEmail|accountId/);
 input.incoming[0].contact={phone:'+390401234567'};assert.throws(()=>premiumPageView(input,'workspace',scope),/non verificabile/);
});

test('public card projection never includes name, phone or CRM notes; results must be bounded and coherent',()=>{
 const input=catalog([{...card(otherId),firstName:'PRIVATE_NAME',phone:'PRIVATE_PHONE',notes:'PRIVATE_NOTE'}]);
 const view=premiumPageView(input,'catalog',scope);assert.equal(view.totalReturned,1);assert.doesNotMatch(JSON.stringify(view),/PRIVATE_|firstName|phone|notes/);
 for(const changed of [{...input,totalReturned:2},{...input,noTotal:false},catalog(Array.from({length:51},()=>card(otherId))),catalog([card(otherId),card(otherId)]),catalog([{...card(otherId),city:'Via Roma 123'}])])assert.throws(()=>premiumPageView(changed,'catalog',scope));
 assert.throws(()=>premiumPageView({...input,scope:'b'.repeat(64)},'catalog',scope),error=>error.code==='workspace_changed');
});

test('offer projection cannot silently activate charging, contact access billing, or an invented period',()=>{
 assert.deepEqual(premiumPageView(premiumOfferCatalog(),'offers'),{consultationCents:100,subscriptionCents:20000,interval:null,chargeEnabled:false});
 for(const edit of [x=>x.subscription.interval='month',x=>x.subscription.chargeEnabled=true,x=>x.consultation.chargeEnabled=true,x=>x.consultation.amountCents=1000]){const offer=premiumOfferCatalog();edit(offer);assert.throws(()=>premiumPageView(offer,'offers'));}
});

test('withdrawn and expired candidates do not restore old personal data even if sent by a stale backend',()=>{
 const retired={...candidate(),published:false,withdrawn:true,expired:true};
 const view=premiumPageView(workspace({candidate:retired}),'workspace',scope);
 assert.equal(view.candidate.firstName,'');assert.equal(view.candidate.lastName,'');assert.equal(view.candidate.phone,'');assert.equal(view.candidate.city,'');assert.deepEqual(view.candidate.marketing,{email:false,whatsapp:false,messenger:false});
 assert.throws(()=>premiumPageView(workspace({candidate:{...retired,published:true}}),'workspace',scope));
});

test('unsupported verification claims, bad request linkage and unexpected automatic actions fail closed',()=>{
 for(const edit of [x=>x.candidate.phoneVerified=true,x=>x.automaticMessages=true,x=>x.automaticCharges=true,x=>x.incoming=[request('requested',otherId)],x=>x.incoming=[{...request(),accessEnabled:true}]]){const value=workspace();edit(value);assert.throws(()=>premiumPageView(value,'workspace',scope));}
});

test('signed-out page only requests public offers and never reads a private account or catalog',async()=>{
 const b=harness({auth:false});await b.prime();
 assert.equal(b.calls.length,1);assert.equal(b.calls[0].path,'/api/premium/offers');assert.equal(b.calls[0].options.headers['X-SEVA-Workspace'],undefined);
 assert.equal(b.element('pp-workspace').hidden,true);assert.equal(b.element('pp-gate').hidden,false);assert.equal(b.element('pp-save').disabled,true);
});

test('initial private read is scoped and uses no cache; candidate data is restored only in the own form',async()=>{
 const b=harness();await b.prime();assert.equal(b.calls.length,2);
 const {path,options}=b.calls[1];assert.equal(path,'/api/premium');assert.equal(options.method,'GET');assert.equal(options.headers['X-SEVA-Workspace'],scope);assert.equal(options.cache,'no-store');assert.equal(options.credentials,'same-origin');assert.equal(options.redirect,'error');
 assert.equal(b.element('pp-firstName').value,'Persona');assert.equal(b.element('pp-phone').value,'+390401234567');assert.equal(b.element('pp-service').checked,false);
 assert.equal(b.element('pp-marketing-whatsapp').checked,true);assert.equal(b.element('pp-workspace').hidden,false);assert.equal(b.element('pp-results').children.length,0);
});

test('sector changes expose only compatible intents in the candidate form and catalog filters',async()=>{
 const b=harness();await b.prime();
 assert.deepEqual(b.element('pp-intent').children.map(x=>x.value),['buy','rent','sell','mandate']);
 b.element('pp-sector').value='bnb';b.element('pp-sector').onchange();assert.equal(b.element('pp-intent').value,'stay');assert.deepEqual(b.element('pp-intent').children.map(x=>x.value),['stay','mandate']);
 b.element('pp-sector').value='property';b.element('pp-sector').onchange();assert.equal(b.element('pp-intent').value,'buy');
 b.element('pp-filter-intent').value='buy';b.element('pp-filter-sector').value='bnb';b.element('pp-filter-sector').onchange();assert.equal(b.element('pp-filter-intent').value,'');assert.deepEqual(b.element('pp-filter-intent').children.map(x=>x.value),['','stay','mandate']);
 b.element('pp-filter-sector').value='';b.element('pp-filter-sector').onchange();assert.equal(b.element('pp-filter-intent').children.length,6);
});

test('restoring a B&B card preserves its valid intent and distinguishes card and request retention',async()=>{
 const b=harness();await b.prime(workspace({candidate:{...candidate(),sector:'bnb',intent:'stay'}}));assert.equal(b.element('pp-sector').value,'bnb');assert.equal(b.element('pp-intent').value,'stay');
 assert.match(b.html,/cronologia, compresi nome e società/);assert.match(b.html,/fino a 90 giorni dalla creazione/);assert.match(renderPremiumPage(null,'en'),/Requests become invalid within 30 days/);assert.match(renderPremiumPage(null,'en'),/retained for up to 90 days after creation/);
});

test('saving requires a fresh affirmative service choice and sends only the defined candidate fields',async()=>{
 const b=harness();await b.prime();await b.element('pp-form').onsubmit({preventDefault(){}});assert.equal(b.calls.length,2);
 b.element('pp-service').checked=true;b.element('pp-listed').checked=true;b.element('pp-marketing-whatsapp').checked=false;
 const action=b.element('pp-form').onsubmit({preventDefault(){}});assert.equal(b.calls.length,3);const body=JSON.parse(b.calls[2].options.body);
 assert.equal(body.action,'save_candidate');assert.equal(body.revision,2);assert.equal(body.serviceConsent,true);assert.equal(body.listed,true);assert.deepEqual(body.marketing,{email:false,whatsapp:false,messenger:false});assert.match(body.operationId,/^[a-f0-9-]{36}$/);
 assert.equal(b.calls[2].options.headers['X-SEVA-Workspace'],scope);assert.equal(b.calls[2].options.headers['Content-Type'],'application/json');assert.equal(b.calls[2].options.method,'POST');
 assert.deepEqual(Object.keys(body).sort(),['action','revision','firstName','lastName','phone','sector','intent','country','city','budgetBand','horizon','listed','serviceConsent','marketing','operationId'].sort());
 await b.complete(2,workspace({candidate:{...candidate(),revision:3,marketing:body.marketing}}));await action;assert.equal(b.element('pp-service').checked,false);assert.match(b.element('pp-status').textContent,/salvata/);
});

test('catalog search is explicit and a request names the professional without unlocking or charging for a contact',async()=>{
 const b=harness();await b.prime(workspace({candidate:null}));b.element('pp-filter-city').value='Trieste';b.element('pp-filter-country').value='IT';
 const search=b.element('pp-search-form').onsubmit({preventDefault(){}});assert.equal(b.calls.length,3);assert.equal(b.calls[2].options.method,'GET');assert.match(b.calls[2].path,/^\/api\/premium\/catalog\?/);assert.match(b.calls[2].path,/city=Trieste/);
 await b.complete(2,catalog());await search;
 assert.match(b.element('pp-results-status').textContent,/1 schede restituite/);assert.doesNotMatch(b.element('pp-results').textContent,/PRIVATE_|telefono|Persona/);
 const choose=b.all(b.element('pp-results')).find(x=>x.tagName==='BUTTON');await choose.onclick();assert.equal(b.element('pp-request-panel').hidden,false);
 b.element('pp-professionalName').value='Operatore di prova';b.element('pp-company').value='Studio di prova';
 const send=b.element('pp-request-form').onsubmit({preventDefault(){}}),body=JSON.parse(b.calls[3].options.body);
 assert.equal(body.action,'request_consultation');assert.equal(body.candidateId,otherId);assert.equal(body.professionalName,'Operatore di prova');assert.equal(body.company,'Studio di prova');assert.equal(body.purpose,'property');assert.equal(body.phone,undefined);
 await b.complete(3,workspace({candidate:null,outgoing:[request('requested',otherId)]}));await send;
 assert.match(b.element('pp-outgoing').textContent,/Nessun addebito/);assert.equal(b.element('pp-request-panel').hidden,true);
 assert(b.calls.every(x=>!/^\/api\/premium\/(checkout|contact)/.test(x.path)));
});

test('named-recipient approval requires its own checkbox, not marketing or cookie choices',async()=>{
 const b=harness();await b.prime(workspace({incoming:[request()]}));
 const controls=b.all(b.element('pp-incoming')),check=controls.find(x=>x.tagName==='INPUT'),approve=controls.find(x=>x.tagName==='BUTTON'&&/autorizzazione/.test(x.textContent));
 assert.equal(approve.disabled,true);await approve.onclick();assert.equal(b.calls.length,2);
 check.checked=true;check.onchange();assert.equal(approve.disabled,false);const save=approve.onclick(),body=JSON.parse(b.calls[2].options.body);
 assert.deepEqual({...body,operationId:undefined},{action:'approve',requestId,revision:1,consent:true,operationId:undefined});
 await b.complete(2,workspace({incoming:[{...request('approved'),revision:2}]}));await save;
 assert.match(b.element('pp-incoming').textContent,/Autorizzazione registrata/);assert.match(b.element('pp-incoming').textContent,/recapito resta riservato/);assert.doesNotMatch(b.element('pp-incoming').textContent,/\+390401234567/);
});

test('marketing can be withdrawn independently without withdrawing the candidate card',async()=>{
 const b=harness();await b.prime();const saving=b.element('pp-revoke-marketing').onclick(),body=JSON.parse(b.calls[2].options.body);
 assert.equal(body.action,'revoke_marketing');assert.equal(body.revision,2);assert.deepEqual(Object.keys(body).sort(),['action','operationId','revision']);
 await b.complete(2,workspace({candidate:{...candidate(),revision:3,marketing:{email:false,whatsapp:false,messenger:false}}}));await saving;
 assert.equal(b.element('pp-firstName').value,'Persona');assert.equal(b.element('pp-marketing-whatsapp').checked,false);assert.equal(b.element('pp-listed').checked,true);
});

test('withdrawal clears the form and retains the server revision for a possible new application',async()=>{
 const b=harness();await b.prime();const saving=b.element('pp-withdraw').onclick();assert.equal(JSON.parse(b.calls[2].options.body).action,'withdraw');
 const retired={...candidate(),revision:3,firstName:'',lastName:'',phone:'',city:'',published:false,withdrawn:true,expired:true,marketing:{email:false,whatsapp:false,messenger:false}};
 await b.complete(2,workspace({candidate:retired}));await saving;
 assert.equal(b.element('pp-firstName').value,'');assert.equal(b.element('pp-phone').value,'');assert.equal(b.element('pp-marketing-whatsapp').checked,false);assert.match(b.element('pp-candidate-state').textContent,/ritirata o scaduta/);
});

for(const status of [401,403,409])test(`non-JSON ${status} response removes private values, cards and pending operations before parsing`,async()=>{
 const b=harness();await b.prime(workspace({incoming:[request()]}));b.element('pp-professionalName').value='PRIVATE_DRAFT';
 const refresh=b.element('pp-refresh').onclick();await b.complete(2,new Response('<html>Sign in</html>',{status,headers:{'Content-Type':'text/html'}}));await refresh;
 assert.equal(b.element('pp-workspace').hidden,true);assert.equal(b.element('pp-gate').hidden,false);assert.equal(b.element('pp-firstName').value,'');assert.equal(b.element('pp-phone').value,'');assert.equal(b.element('pp-professionalName').value,'');assert.equal(b.element('pp-incoming').textContent,'');assert.equal(b.element('pp-retry').hidden,true);
 await b.element('pp-refresh').onclick();assert.equal(b.calls.length,3);
});

test('a changed scope or malformed authenticated success fails closed without partially painting private data',async()=>{
 for(const value of [workspace({scope:'b'.repeat(64)}),workspace({incoming:[{...request(),contact:{phone:'PRIVATE_PHONE'}}]})]){
  const b=harness();await b.complete(0,premiumOfferCatalog());await b.complete(1,value);assert.equal(b.element('pp-workspace').hidden,true);assert.equal(b.element('pp-firstName').value,'');assert.equal(b.element('pp-incoming').textContent,'');
 }
});

test('a non-JSON 200 account response is not treated as an empty successful workspace',async()=>{
 const b=harness();await b.complete(0,premiumOfferCatalog());await b.complete(1,new Response('<html>Login</html>',{headers:{'Content-Type':'text/html'}}));
 assert.equal(b.element('pp-workspace').hidden,true);assert.match(b.element('pp-status').textContent,/verificare/);
});

test('ambiguous mutation retries the same operation and content, with no second action while pending',async()=>{
 const b=harness();await b.prime();const saving=b.element('pp-revoke-marketing').onclick();b.calls[2].reject(Error('network'));await saving;await flush();
 assert.equal(b.element('pp-retry').hidden,false);const original=b.calls[2].options.body;await b.element('pp-withdraw').onclick();assert.equal(b.calls.length,3);
 const retry=b.element('pp-retry').onclick();assert.equal(b.calls[3].options.body,original);await b.complete(3,workspace({candidate:{...candidate(),revision:3,marketing:{email:false,whatsapp:false,messenger:false}}}));await retry;
 assert.equal(b.element('pp-retry').hidden,true);assert.equal(b.element('pp-firstName').value,'Persona');
});

for(const event of ['pagehide','seva:session-changed'])test(`${event} clears private state and rejects late account callbacks even if abort is ignored`,async()=>{
 const b=harness();await b.complete(0,premiumOfferCatalog());b.element('pp-firstName').value='PRIVATE_UNSAVED';b.events.get(event)({});
 await b.complete(1,workspace({incoming:[request()]}));assert.equal(b.element('pp-firstName').value,'');assert.equal(b.element('pp-phone').value,'');assert.equal(b.element('pp-incoming').textContent,'');assert.equal(b.element('pp-workspace').hidden,true);assert.equal(b.calls[1].options.signal.aborted,true);
});

test('late catalog response after pagehide cannot repopulate results or professional fields',async()=>{
 const b=harness();await b.prime();const searching=b.element('pp-search-form').onsubmit({preventDefault(){}});b.events.get('pagehide')({});await b.complete(2,catalog());await searching;
 assert.equal(b.element('pp-results').textContent,'');assert.equal(b.element('pp-selected').textContent,'');assert.equal(b.element('pp-professionalName').value,'');assert.equal(b.element('pp-workspace').hidden,true);
});

test('a browser-cache restoration reloads instead of reviving a private screen',async()=>{
 const b=harness();await b.prime();b.events.get('pagehide')({});b.events.get('pageshow')({persisted:true});assert.equal(b.window.reloaded,true);assert.equal(b.element('pp-workspace').hidden,true);
});
