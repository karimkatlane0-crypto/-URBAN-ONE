import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {ACCOUNT_HUB_TOOLS,bindAccountHub,renderAccountHub} from '../src/account-hub.js';
import {browserIdentity} from '../src/identity.js';
import {bindAccountProfile} from '../src/account.js';
import worker from '../worker/index.js';

test('account hub exposes working paths before profile registration and preserves private sign-in destinations',async()=>{
 for(const lang of ['it','en']){
  const response=await worker.fetch(new Request('https://seva.test/account?lang='+lang));
  const html=await response.text();assert.equal(response.status,200);
  assert(!html.includes('id="accountProfile"'));
  assert(html.includes('id="account-hub"'));assert(html.includes('id="accountInstall"'));
  assert.equal((html.match(/data-account-tool=/g)||[]).length,ACCOUNT_HUB_TOOLS.length);
  const hub=renderAccountHub(lang);
  const links=[...hub.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
  for(const href of links.filter(h=>!h.startsWith('#'))){
   const r=await worker.fetch(new Request('https://seva.test'+href));
   assert([200,302,308].includes(r.status),href+' '+r.status);
   if(href.startsWith('/app?')){
    assert.equal(r.status,302);
    assert.equal(new URL(r.headers.get('location'),'https://seva.test').searchParams.get('return_to'),href);
   }
  }
  assert(links.includes(lang==='en'?'/automation?lang=en':'/automation'));
  assert(links.includes('/app?section=execution'));
  for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Script(script));
 }
});

test('hub is available with an authenticated account even when profile storage is unavailable',async()=>{
 const identity={id:'hub-test-account',email:'synthetic@example.test'};
 const session=await browserIdentity(identity);
 const headers={'oai-authenticated-user-id':identity.id,'oai-authenticated-user-email':identity.email,'X-SEVA-Workspace':session.scope};
 const account=await worker.fetch(new Request('https://seva.test/account',{headers}));
 const html=await account.text();assert.equal(account.status,200);
 assert(html.includes('id="accountProfile"'));
 assert(html.includes('id="account-hub"'));
 assert(!html.includes('Statistiche del sito'));
 assert.equal((await worker.fetch(new Request('https://seva.test/api/account',{headers}))).status,503);
 assert(html.indexOf('id="accountProfile"')<html.indexOf('id="account-hub"'));
 assert(html.includes('<details><summary>Strumenti e percorsi</summary>'));
 for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Script(script));
});

test('search handles accents, multiple terms, empty results and reset without fetching private data',()=>{
 const cards=ACCOUNT_HUB_TOOLS.map(t=>({textContent:t.it.join(' '),hidden:false}));
 const controls={
  '#accountToolSearch':{value:'',listeners:{},addEventListener(event,fn){this.listeners[event]=fn;},focus(){this.focused=true;}},
  '#accountToolReset':{listeners:{},addEventListener(event,fn){this.listeners[event]=fn;}},
  '#accountToolCount':{textContent:''},'#accountToolEmpty':{hidden:true}
 };
 const originalDocument=globalThis.document;
 globalThis.document={getElementById:()=>({querySelector:id=>controls[id],querySelectorAll:()=>cards})};
 try{
  bindAccountHub(false);
  const search=controls['#accountToolSearch'],reset=controls['#accountToolReset'];
  search.value='DÉCISIONI';search.listeners.input();
  assert.deepEqual(cards.filter(c=>!c.hidden).map(c=>c.textContent.split(' ')[0]),['Decisioni']);
  search.value='AI fonti';search.listeners.input();assert.equal(cards.filter(c=>!c.hidden).length,1);
  search.value='zzzz-no-result';search.listeners.input();assert.equal(controls['#accountToolEmpty'].hidden,false);
  assert.equal(controls['#accountToolCount'].textContent,'0 di '+ACCOUNT_HUB_TOOLS.length+' percorsi');
  reset.listeners.click();assert.equal(cards.filter(c=>!c.hidden).length,ACCOUNT_HUB_TOOLS.length);assert(search.focused);assert.equal(search.value,'');
  assert.equal(controls['#accountToolEmpty'].hidden,true);
 }finally{globalThis.document=originalDocument;}
});

test('hub navigation uses existing sections and describes traversal without unsupported URL presets',()=>{
 for(const lang of ['it','en']){
  const html=renderAccountHub(lang,true);
  assert(html.includes('href="#account-profile"'));
  assert(!/[?&](strategy|direction|order)=/.test(html));
  assert(!html.includes('onclick='));
  assert(html.includes(lang==='en'?'Depth':'Profondità'));
  assert(html.includes(lang==='en'?'Backward':'A ritroso'));
  assert(html.includes(lang==='en'?'In your personal workspace':'Nel tuo spazio personale'));
 }
});

test('profile reads and same-page anchors do not block navigation; writes and unsaved exits remain protected',async()=>{
 const original={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch,confirm:globalThis.confirm};
 const make=()=>({value:'',disabled:false,textContent:'',listeners:{},addEventListener(event,fn){this.listeners[event]=fn;}});
 const fields=Object.fromEntries(['contactEmail','displayName','phone','country','city','organization','kind','payoutMethod','beneficiary','iban','bankName','privacyAcknowledged'].map(k=>[k,make()]));
 fields.privacyAcknowledged.checked=false;
 const form=make();form.elements={namedItem:key=>fields[key]};
 const nodes={accountProfile:form,accountFields:make(),accountStatus:make(),accountReload:make(),accountExport:make(),accountDelete:make(),accountId:make(),accountBankFields:make(),accountIban:fields.iban,accountShowIban:make(),accountLoginEmail:make()};
 const docEvents={},winEvents={};let complete,confirmCalls=0;
 const click=href=>{let prevented=false;docEvents.click({target:{closest:()=>({target:'',getAttribute:()=>href})},preventDefault(){prevented=true;}});return prevented;};
 globalThis.document={getElementById:id=>nodes[id],addEventListener:(event,fn)=>{docEvents[event]=fn;}};
 globalThis.window={addEventListener:(event,fn)=>{winEvents[event]=fn;}};
 globalThis.fetch=()=>new Promise(resolve=>{complete=resolve;});
 globalThis.confirm=()=>{confirmCalls++;return false;};
 try{
  bindAccountProfile({scope:'scope-test'},false);
  assert.equal(click('/automation'),false,'pending read must not trap account navigation');
  let unloading=false;winEvents.beforeunload({preventDefault(){unloading=true;}});assert.equal(unloading,false);
  complete(Response.json({scope:'scope-test',profile:null}));
  await new Promise(resolve=>setImmediate(resolve));
  fields.contactEmail.value='new@example.test';form.listeners.input();
  assert.equal(click('#account-profile'),false);assert.equal(confirmCalls,0);
  assert.equal(click('/automation'),true);assert.equal(confirmCalls,1);
  const saving=form.listeners.submit({preventDefault(){}});
  assert.equal(click('/automation'),true,'pending write must remain guarded');
  assert.equal(click('#account-profile'),false);
  complete(Response.json({code:'storage_unavailable'},{status:503}));await saving;
  assert.equal(fields.contactEmail.value,'new@example.test','failed write preserves draft');
  assert.equal(click('/automation'),true);
 }finally{Object.assign(globalThis,original);}
});
