import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {handleAccount,validateAccountProfile,validateAccountPayout,ACCOUNT_IBAN_LENGTHS,bindAccountProfile,renderAccountPage} from '../src/account.js';
import {browserIdentity} from '../src/identity.js';
import {openBillingDatabase} from './helpers/billing-sqlite.mjs';
const details={method:'sepa',beneficiary:'Persona sintetica',iban:'DE89370400440532013000',bankName:'Banca di prova'};
const full={contactEmail:'profile@example.test',displayName:'Persona sintetica',phone:'+49 151 2345 6789',city:'Berlino',country:'de',organization:'Università di prova',kind:'student',payout:details,privacyAcknowledged:true,revision:0};
async function req(owner,method='GET',body,headers={}){const scope=(await browserIdentity({id:owner})).scope;return new Request('https://seva.test/api/account',{method,headers:{'oai-authenticated-user-id':owner,'X-SEVA-Workspace':scope,origin:'https://seva.test','content-type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});}
test('private receiving details check IBAN syntax and checksum without claims of bank ownership',()=>{
 assert.equal(Object.keys(ACCOUNT_IBAN_LENGTHS).length,41);
 assert.deepEqual(validateAccountPayout({...details,iban:'de89 3704 0044 0532 0130 00'}),details);
 for(const payout of [{...details,iban:'DE00370400440532013000'},{...details,iban:'ZZ89370400440532013000'},{...details,iban:'DE893704004405320130000'},{...details,beneficiary:''},{...details,ownershipVerified:true},{...details,currency:'USD'},{...details,method:'wallet'},{method:'none',iban:details.iban}])assert.throws(()=>validateAccountPayout(payout));
 assert.deepEqual(validateAccountPayout({method:'none'}),{method:'none'});
 const p=validateAccountProfile(full);assert.equal(p.phone,'+4915123456789');assert.equal(p.country,'DE');
 for(const v of [{...full,phone:'123'},{...full,phone:'javascript:alert(1)'},{...full,organization:'<b>wrong</b>'},{...full,ownerId:'foreign'},{...full,payoutVerified:true}])assert.throws(()=>validateAccountProfile(v));
});
test('receiving details persist only in the same account and omitted fields preserve previous data',async()=>{
 const db=openBillingDatabase(':memory:',{migrate:true});try{
  const response=await handleAccount(await req('person-a','PUT',full),db);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');
  const p=(await response.json()).profile;assert.deepEqual(p.payout,details);assert.equal(p.payoutOwnershipVerified,false);assert.equal(p.payoutProviderConnected,false);assert.equal(p.phoneVerified,false);
  assert.equal((await (await handleAccount(await req('person-b'),db)).json()).profile,null);
  const edited=(await (await handleAccount(await req('person-a','PUT',{contactEmail:'changed@example.test',privacyAcknowledged:true,revision:1,profileId:p.id}),db)).json()).profile;
  assert.deepEqual(edited.payout,details);assert.equal(edited.phone,p.phone);assert.equal(edited.organization,full.organization);
  const otherScope=(await browserIdentity({id:'person-b'})).scope;
  assert.equal((await handleAccount(await req('person-a','PUT',{...full,revision:2},{'X-SEVA-Workspace':otherScope}),db)).status,409);
  assert.equal((await handleAccount(await req('person-a','PUT',{...full,revision:2},{origin:'https://other.test'}),db)).status,403);
 }finally{db.close();}
});
test('clear and delete remove bank fields while concurrent updates respect account revision',async()=>{
 const db=openBillingDatabase(':memory:',{migrate:true});try{
  await handleAccount(await req('person-a','PUT',full),db);
  const profileId=(await (await handleAccount(await req('person-a'),db)).json()).profile.id;
  const clear={contactEmail:full.contactEmail,profileId,revision:1,privacyAcknowledged:true,payout:{method:'none'}};
  const races=await Promise.all([handleAccount(await req('person-a','PUT',clear),db),handleAccount(await req('person-a','PUT',clear),db)]);assert.deepEqual(races.map(x=>x.status).sort(),[200,409]);
  const p=(await (await handleAccount(await req('person-a'),db)).json()).profile;assert.deepEqual(p.payout,{method:'none'});assert(!JSON.stringify(p).includes(details.iban));assert.equal(p.displayName,full.displayName);
  assert.equal((await handleAccount(await req('person-a','DELETE',{revision:1,profileId}),db)).status,409);
  assert.equal((await handleAccount(await req('person-a','DELETE',{revision:2,profileId}),db)).status,200);
  assert.equal((await (await handleAccount(await req('person-a'),db)).json()).profile,null);
 }finally{db.close();}
});
test('a deleted and recreated profile rejects stale updates and deletes even at the same revision',async()=>{
 const db=openBillingDatabase(':memory:',{migrate:true});try{
  const old=(await (await handleAccount(await req('person-a','PUT',full),db)).json()).profile;
  assert.equal((await handleAccount(await req('person-a','DELETE',{revision:1,profileId:old.id}),db)).status,200);
  const fresh=(await (await handleAccount(await req('person-a','PUT',{...full,displayName:'New profile',payout:{method:'none'}}),db)).json()).profile;
  assert.notEqual(fresh.id,old.id);assert.equal(fresh.revision,old.revision);
  assert.equal((await handleAccount(await req('person-a','PUT',{...full,revision:1,profileId:old.id}),db)).status,409);
  assert.equal((await handleAccount(await req('person-a','DELETE',{revision:1,profileId:old.id}),db)).status,409);
  assert.equal((await handleAccount(await req('person-a','PUT',{...full,revision:1}),db)).status,409);
  assert.equal((await handleAccount(await req('person-a','DELETE',{revision:1}),db)).status,409);
  const current=(await (await handleAccount(await req('person-a'),db)).json()).profile;
  assert.equal(current.id,fresh.id);assert.equal(current.revision,1);assert.equal(current.displayName,'New profile');assert.deepEqual(current.payout,{method:'none'});
 }finally{db.close();}
});
test('registration is bilingual, private and exposes only optional receiving instructions',()=>{
 for(const lang of ['it','en']){const html=renderAccountPage('',lang,{scope:'a'.repeat(64)},'owner@example.test');assert.match(html,/type="password"[^>]*name="iban"|name="iban"[^>]*type="password"/);assert.match(html,/noindex,nofollow/);assert(!html.includes(details.iban));assert.match(html,/name="payoutMethod"/);assert.doesNotMatch(html,/localStorage|sessionStorage|api\.stripe|sendBeacon/);for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new vm.Script(m[1]));}
 assert(!renderAccountPage('','it',null).includes('id="accountProfile"'));
});
const flush=async()=>{await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));};
function harness(){
 const calls=[],events=new Map(),nodes=new Map(),fields=new Map(),downloads=[];
 class El{constructor(){this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.type='password';this.textContent='';this.handlers=new Map();}addEventListener(name,fn){this.handlers.set(name,fn);}reset(){for(const f of fields.values()){f.value='';f.checked=false;}}}
 for(const key of ['contactEmail','displayName','phone','country','city','organization','kind','payoutMethod','beneficiary','iban','bankName','privacyAcknowledged'])fields.set(key,new El());
 for(const id of ['accountProfile','accountFields','accountStatus','accountReload','accountExport','accountDelete','accountBankFields','accountIban','accountShowIban','accountLoginEmail','accountId'])nodes.set(id,new El());
 nodes.set('accountIban',fields.get('iban'));nodes.get('accountProfile').elements={namedItem:key=>fields.get(key)};nodes.get('accountLoginEmail').textContent='owner@example.test';
 const window={addEventListener:(k,v)=>events.set(k,v),location:{reload(){window.reloaded=true;}}};const document={getElementById:id=>nodes.get(id),addEventListener(){},createElement:()=>({click(){downloads.push(this.href);}})};
 const context=vm.createContext({document,window,fetch:(path,options)=>new Promise((resolve,reject)=>calls.push({path,options,resolve,reject})),AbortController,setTimeout:()=>1,clearTimeout(){},confirm:()=>true,URL,Blob});
 const api=vm.runInContext('('+bindAccountProfile.toString()+')({scope:"account-scope"},false)',context);
 const complete=async(i,body,status=200)=>{calls[i].resolve(body instanceof Response?body:Response.json(body,{status}));await flush();};
 const profile={id:'SEVA-test',revision:1,noticeVersion:'2026-11-15',contactEmail:'private@example.test',displayName:'Private Name',phone:'+4915123456789',country:'DE',city:'Berlino',organization:'Uni',kind:'student',payout:details};
 return {api,calls,events,nodes,fields,window,complete,profile,downloads,privateValues:()=>[...fields.values()].map(x=>x.value).join(' ')};
}
for(const status of [401,403,409,200])test('account erases private fields before accepting non-JSON response '+status,async()=>{
 const b=harness();await b.complete(0,{scope:'account-scope',profile:b.profile});assert(b.privateValues().includes(details.iban));
 const pending=b.api.load();await b.complete(1,new Response('<html>Sign in</html>',{status,headers:{'content-type':'text/html'}}));await pending;
 assert(!b.privateValues().includes(details.iban));assert(!b.privateValues().includes('private@example.test'));assert.equal(b.nodes.get('accountFields').disabled,true);assert.equal(b.nodes.get('accountLoginEmail').textContent,'');
});
test('null, array and primitive JSON responses invalidate private account data',async()=>{
 for(const status of [200,409])for(const body of [null,[],42,'invalid']){
  const b=harness();await b.complete(0,{scope:'account-scope',profile:b.profile});
  const pending=b.api.load();await b.complete(1,body,status);await pending;
  assert(!b.privateValues().includes(details.iban));assert.equal(b.nodes.get('accountFields').disabled,true);assert.equal(b.nodes.get('accountExport').disabled,true);
 }
});
test('export and IBAN reveal revalidate the current session and profile before exposing data',async()=>{
 for(const control of ['accountExport','accountShowIban'])for(const failure of ['auth','scope','generation','revision']){
  const b=harness();await b.complete(0,{scope:'account-scope',profile:b.profile});
  const pending=b.nodes.get(control).handlers.get('click')();assert.equal(b.calls[1].options.method,'GET');
  assert.equal(b.downloads.length,0);assert.equal(b.fields.get('iban').type,'password');
  if(failure==='auth')await b.complete(1,{code:'authentication_required'},401);
  if(failure==='scope')await b.complete(1,{scope:'other-scope',profile:b.profile});
  if(failure==='generation')await b.complete(1,{scope:'account-scope',profile:{...b.profile,id:'SEVA-new-generation'}});
  if(failure==='revision')await b.complete(1,{scope:'account-scope',profile:{...b.profile,revision:2}});
  await pending;assert.equal(b.downloads.length,0);assert.equal(b.fields.get('iban').type,'password');
  if(failure!=='revision')assert(!b.privateValues().includes(details.iban));
 }
 const b=harness();await b.complete(0,{scope:'account-scope',profile:b.profile});
 const reveal=b.nodes.get('accountShowIban').handlers.get('click')();await b.complete(1,{scope:'account-scope',profile:b.profile});await reveal;assert.equal(b.fields.get('iban').type,'text');
 const download=b.nodes.get('accountExport').handlers.get('click')();assert.equal(b.downloads.length,0);await b.complete(2,{scope:'account-scope',profile:b.profile});await download;assert.equal(b.downloads.length,1);
});
test('late account reply cannot restore bank data after session change or pagehide',async()=>{
 for(const event of ['seva:session-changed','pagehide']){const b=harness();b.events.get(event)();await b.complete(0,{scope:'account-scope',profile:b.profile});assert(!b.privateValues().includes(details.iban));assert.equal(b.nodes.get('accountFields').disabled,true);assert.equal(b.nodes.get('accountExport').disabled,true);}
});
test('revision conflict preserves the owner draft while scope conflict clears it',async()=>{
 const b=harness();await b.complete(0,{scope:'account-scope',profile:b.profile});b.fields.get('city').value='Trieste';b.nodes.get('accountProfile').handlers.get('input')();
 const send=b.nodes.get('accountProfile').handlers.get('submit')({preventDefault(){}});await b.complete(1,{code:'revision_conflict'},409);await send;assert.equal(b.fields.get('city').value,'Trieste');assert.equal(b.nodes.get('accountFields').disabled,false);
 const again=b.nodes.get('accountProfile').handlers.get('submit')({preventDefault(){}});await b.complete(2,{code:'workspace_changed'},409);await again;assert.equal(b.fields.get('city').value,'');assert.equal(b.nodes.get('accountFields').disabled,true);
});
