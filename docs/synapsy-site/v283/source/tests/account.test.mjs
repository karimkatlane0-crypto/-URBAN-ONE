import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAccount,validateAccountProfile,renderAccountPage} from '../src/account.js';
import {browserIdentity} from '../src/identity.js';
import {renderBankTransfer,SEVA_PAYMENT_CENTER} from '../src/payment-center.js';
import {renderSkebbySenderGuide} from '../src/skebby-status.js';
import {openBillingDatabase} from './helpers/billing-sqlite.mjs';
import worker from '../worker/index.js';

const profile={displayName:'Persona sintetica',contactEmail:'person@example.test',country:'it',kind:'person',revision:0,privacyAcknowledged:true};
async function request(owner='account-a',method='GET',body,extra={}){
 const scope=(await browserIdentity({id:owner})).scope;
 return new Request('https://seva.test/api/account',{method,headers:{'oai-authenticated-user-id':owner,'oai-authenticated-user-email':'person@example.test','X-SEVA-Workspace':scope,origin:'https://seva.test','content-type':'application/json',...extra},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
}

test('account profile validates known fields without accepting authority, bank or login claims',()=>{
 assert.equal(validateAccountProfile(profile).country,'IT');
 for(const input of [{...profile,ownerId:'other'},{...profile,spidVerified:true},{...profile,iban:'IT123'},{...profile,privacyAcknowledged:false},{...profile,displayName:'<script>bad</script>'},{...profile,contactEmail:'bad'},{...profile,country:'Italy'},{...profile,revision:0.5},{...profile,kind:'admin'}])assert.throws(()=>validateAccountProfile(input));
 assert.equal(validateAccountProfile({...profile,contactEmail:'',country:''}).contactEmail,'');
});

test('account routes enforce authentication, scope and same-origin writes before SQL',async()=>{
 const DB={prepare(){throw Error('must not reach storage');}};
 assert.equal((await handleAccount(new Request('https://seva.test/api/account'),{DB})).status,401);
 assert.equal((await handleAccount(await request('a','GET',undefined,{'X-SEVA-Workspace':'other'}),{DB})).status,409);
 assert.equal((await handleAccount(await request('a','PUT',profile,{origin:'https://other.test'}),{DB})).status,403);
 assert.equal((await handleAccount(await request('a','PUT',profile,{'sec-fetch-site':'cross-site'}),{DB})).status,403);
 assert.equal((await handleAccount(await request('a','POST',profile),{DB})).status,405);
});

test('profiles persist across reads and remain separated between two accounts',async()=>{
 const db=openBillingDatabase(':memory:',{migrate:true});try{
  const created=await handleAccount(await request('a','PUT',profile),db);assert.equal(created.status,200);
  const a=(await created.json()).profile;assert.equal(a.revision,1);assert.equal(a.country,'IT');assert.equal(a.identityVerified,false);assert.equal(a.contactEmailVerified,false);
  assert.deepEqual((await (await handleAccount(await request('a'),db)).json()).profile,a);
  assert.equal((await (await handleAccount(await request('b'),db)).json()).profile,null);
  const changed=(await (await handleAccount(await request('a','PUT',{...profile,profileId:a.id,revision:1,displayName:'Nuovo nome'}),db)).json()).profile;
  assert.equal(changed.id,a.id);assert.equal(changed.revision,2);assert.equal(changed.displayName,'Nuovo nome');
  assert.equal((await handleAccount(await request('a','PUT',{...profile,profileId:a.id,revision:1}),db)).status,409);
  assert.equal((await (await handleAccount(await request('a'),db)).json()).profile.displayName,'Nuovo nome');
 }finally{db.close();}
});

test('competing creates produce one profile and stale deletion cannot remove another revision',async()=>{
 const db=openBillingDatabase(':memory:',{migrate:true});try{
  const responses=await Promise.all([request('a','PUT',profile),request('a','PUT',profile)].map(async r=>handleAccount(await r,db)));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  await handleAccount(await request('b','PUT',{...profile,displayName:'Secondo utente'}),db);
  const profileId=(await (await handleAccount(await request('a'),db)).json()).profile.id;
  assert.equal((await handleAccount(await request('a','DELETE',{revision:2,profileId}),db)).status,409);
  assert.equal((await handleAccount(await request('a','DELETE',{revision:1,profileId}),db)).status,200);
  assert.equal((await (await handleAccount(await request('a'),db)).json()).profile,null);
  assert.equal((await (await handleAccount(await request('b'),db)).json()).profile.displayName,'Secondo utente');
 }finally{db.close();}
});

test('malformed, extra-field and oversized bodies never create a profile',async()=>{
 const db=openBillingDatabase(':memory:',{migrate:true});try{
  for(const body of ['{bad','x'.repeat(4097),{...profile,ownerId:'b'}])assert((await handleAccount(await request('a','PUT',body),db)).status>=400);
  assert.equal((await handleAccount(await request('a','PUT',profile,{'content-type':'text/plain'}),db)).status,415);
  assert.equal((await (await handleAccount(await request('a'),db)).json()).profile,null);
 }finally{db.close();}
});

test('compiled registration route preserves native login and private identity is escaped',async()=>{
 const publicResponse=await worker.fetch(new Request('https://seva.test/account?lang=en'));
 assert.equal(publicResponse.status,200);const html=await publicResponse.text();
 assert.match(html,/Continue with email/);assert.match(html,/return_to=%2Faccount%3Flang%3Den/);assert(!html.includes('id="accountProfile"'));
 assert.equal(publicResponse.headers.get('x-robots-tag'),'noindex, nofollow');
 const redirect=await worker.fetch(new Request('https://seva.test/register?lang=en'));assert.equal(redirect.headers.get('location'),'/account?lang=en');
 const session=await browserIdentity({id:'a'}),privateHTML=renderAccountPage('','it',session,'<script>unsafe</script>');
 assert(!privateHTML.includes('<script>unsafe</script>'));assert(privateHTML.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
 for(const script of privateHTML.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Function(script[1]));
 const db=openBillingDatabase(':memory:',{migrate:true});try{assert.equal((await worker.fetch(await request('a','PUT',profile),db)).status,200);}finally{db.close();}
});

test('email alone creates a minimal profile and email edits preserve earlier optional details',async()=>{
 const db=openBillingDatabase(':memory:',{migrate:true});try{
  const emailOnly={contactEmail:'only@example.test',revision:0,privacyAcknowledged:true};
  const created=await handleAccount(await request('minimal','PUT',emailOnly),db);assert.equal(created.status,200);
  const p=(await created.json()).profile;
  assert.equal(p.contactEmail,'only@example.test');for(const key of ['displayName','country','kind'])assert.equal(Object.hasOwn(p,key),false);
  await handleAccount(await request('legacy','PUT',profile),db);
  const profileId=(await (await handleAccount(await request('legacy'),db)).json()).profile.id;
  const updated=(await (await handleAccount(await request('legacy','PUT',{...emailOnly,revision:1,profileId}),db)).json()).profile;
  assert.equal(updated.displayName,profile.displayName);assert.equal(updated.country,'IT');assert.equal(updated.kind,'person');assert.equal(updated.contactEmail,'only@example.test');
  const html=renderAccountPage('','it',await browserIdentity({id:'minimal'}),'only@example.test');
  assert.match(html,/name="contactEmail"/);for(const key of ['displayName','country','kind','phone','organization','payoutMethod'])assert(html.includes('name="'+key+'"'));
  const unsafe=renderAccountPage('','it',await browserIdentity({id:'minimal'}),'</script><script>bad()</script>');
  assert(!unsafe.includes('<script>bad()'));
  for(const script of unsafe.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Function(script[1]));
 }finally{db.close();}
});

test('bank details validate mathematically and sender guide does not invent an assigned number',()=>{
 const iban=SEVA_PAYMENT_CENTER.bankTransfer.iban;
 const digits=(iban.slice(4)+iban.slice(0,4)).replace(/[A-Z]/g,c=>String(c.charCodeAt(0)-55));
 assert.equal(BigInt(digits)%97n,1n);assert.equal(iban.length,27);
 const bank=renderBankTransfer();assert.match(bank,/BNLIITRR/);assert.match(bank,/non verifica il conto/);assert.equal(SEVA_PAYMENT_CENTER.bankTransfer.accountOwnershipVerified,false);
 const guide=renderSkebbySenderGuide();assert.match(guide,/non può essere usato come mittente/);assert.match(guide,/proposta da registrare/);assert.match(guide,/non incassa percentuali/);
});
