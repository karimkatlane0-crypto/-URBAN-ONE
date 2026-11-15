import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {clearLocalWorkspace} from '../src/local-privacy.js';

test('local erasure removes current account copies without deleting other accounts or settings',()=>{
 const a='a'.repeat(64),b='b'.repeat(64),data=new Map([
  ['seva.workspace.v2.'+a,'private A'],['seva.goal-relay.v2.'+a,'sync A'],['seva.goal-relay.conflict-backup.'+a,'backup A'],
  ['seva.goal-crm-links.v1.'+a,JSON.stringify({version:1,links:[{goalId:'synthetic-goal-a',contactId:'synthetic-contact-a'}]})],
  ['seva.crm-refresh.v1.'+a,JSON.stringify({revision:4,at:'2026-11-12T18:00:00.000Z'})],
  ['seva.workspace.v2.'+b,'private B'],['seva.goal-relay.v2.'+b,'sync B'],
  ['seva.goal-crm-links.v1.'+b,JSON.stringify({version:1,links:[{goalId:'synthetic-goal-b',contactId:'synthetic-contact-b'}]})],
  ['seva.crm-refresh.v1.'+b,JSON.stringify({revision:7,at:'2026-11-12T18:01:00.000Z'})],
  ['seva.workspace.v1','owner legacy'],['other-app','keep']
 ]);
 const otherLinks=data.get('seva.goal-crm-links.v1.'+b);
 clearLocalWorkspace({removeItem:k=>data.delete(k)},{scope:a,isOwner:false});
 for(const prefix of ['seva.workspace.v2.','seva.goal-relay.v2.','seva.goal-relay.conflict-backup.','seva.goal-crm-links.v1.','seva.crm-refresh.v1.'])assert.equal(data.has(prefix+a),false);
 assert.equal(data.size,6);assert.equal(data.get('seva.workspace.v2.'+b),'private B');assert.equal(data.get('seva.goal-relay.v2.'+b),'sync B');
 assert.equal(JSON.parse(data.get('seva.crm-refresh.v1.'+b)).revision,7);
 assert.equal(data.get('seva.goal-crm-links.v1.'+b),otherLinks);assert.equal(data.get('seva.workspace.v1'),'owner legacy');assert.equal(data.get('other-app'),'keep');
});
test('owner erasure prevents deleted legacy records from being imported again',()=>{
 const scope='c'.repeat(64),data=new Map([['seva.workspace.v1','old'],['seva.workspace.v2.'+scope,'new']]);
 clearLocalWorkspace({removeItem:k=>data.delete(k)},{scope,isOwner:true});
 assert.equal(data.size,0);
});
test('invalid local erasure session performs no deletions',()=>{
 let calls=0;const storage={removeItem:()=>calls++};
 for(const session of [null,{scope:''},{scope:'a'.repeat(63)},{scope:'../another-account',isOwner:true}])assert.throws(()=>clearLocalWorkspace(storage,session));
 assert.equal(calls,0);
});
test('public legal and partner documents render both languages without granting workspace access',async()=>{
 for(const path of ['/global','/ristoranti','/fiducia','/amazon','/join','/support','/growth','/network','/payments','/sports','/creators','/campaigns','/students','/alerts','/broadcast','/terms','/privacy','/cookies','/partners','/developers','/press']){
  for(const lang of ['it','en']){
   const r=await worker.fetch(new Request('https://seva.test'+path+'?lang='+lang),{});assert.equal(r.status,200);
   const text=await r.text();assert.ok(text.includes('<html lang="'+lang+'">'));assert.ok(text.includes('karimkatlane0@gmail.com'));assert.ok(!text.includes('SEVA_SESSION'));
   assert.match(r.headers.get('Content-Security-Policy'),/connect-src 'self'/);
  }
 }
 const injected=await (await worker.fetch(new Request('https://seva.test/privacy?lang=%3Cscript%3E'),{})).text();assert.ok(injected.includes('<html lang="it">'));assert.ok(!injected.includes('<html lang="<script>'));
 assert.equal((await worker.fetch(new Request('https://seva.test/privacy',{method:'POST'}),{})).status,405);
 assert.equal((await worker.fetch(new Request('https://seva.test/app'),{})).status,302);
 assert.equal((await worker.fetch(new Request('https://seva.test/api/inquiries'),{})).status,401);
});
test('public downloads contain readable notice and full links; sitemap excludes private paths',async()=>{
 const r=await worker.fetch(new Request('https://seva.test/privacy?lang=en&format=txt'),{});
 assert.match(r.headers.get('Content-Type'),/text\/plain/);assert.match(r.headers.get('Content-Disposition'),/attachment/);
 const txt=await r.text();assert.ok(txt.startsWith('Privacy notice'));assert.ok(txt.includes('https://seva.karimkatlane0.chatgpt.site/app?section=contact'));assert.ok(!txt.includes('<table>'));
 const xml=await (await worker.fetch(new Request('https://seva.test/sitemap.xml'),{})).text();assert.equal((xml.match(/<url>/g)||[]).length,97);assert.ok(xml.includes('/rapporto?lang=en'));assert.ok(xml.includes('/sme?lang=en'));assert.ok(xml.includes('/social?lang=en'));assert.equal((xml.match(/<loc>https:\/\/seva\.karimkatlane0\.chatgpt\.site\/ristoranti(?:\?lang=en)?<\/loc>/g)||[]).length,2);assert.ok(xml.includes('/titans?lang=en'));assert.ok(!xml.includes('/identita?lang=en'));assert.ok(xml.includes('/cms?lang=en'));assert.ok(xml.includes('/acquista?lang=en'));assert.ok(!xml.includes('/checkout/'));assert.ok(xml.includes('/invite?lang=en'));assert.ok(xml.includes('/connections?lang=en'));assert.ok(!xml.includes('/app'));assert.ok(!xml.includes('/api/'));assert.ok(xml.includes('/terms?lang=en'));assert.ok(xml.includes('/global?lang=en'));assert.ok(xml.includes('/aura?lang=en'));assert.ok(xml.includes('/listen?lang=en'));assert.ok(xml.includes('/onboarding?lang=en'));assert.ok(xml.includes('/kkubera/cataloghi'));assert.ok(xml.includes('/music'));assert.ok(!xml.includes('/kkubera/cataloghi?lang=en'));assert.ok(!xml.includes('/music?lang=en'));assert.ok(xml.includes('/onboarding/competenze?lang=en'));assert.ok(xml.includes('/territorio'));assert.ok(!xml.includes('/territorio?lang=en'));
 const facts=await (await worker.fetch(new Request('https://seva.test/llms.txt'),{})).text();assert.ok(facts.includes('one-time agreed-service payment links at EUR 50 and EUR 500 are available'));assert.ok(facts.includes('Entry subscriptions unavailable'));assert.ok(facts.includes('no live attribution or automatic payouts'));
});
test('the first-step promotion is public, bilingual and does not imply a paid offer',async()=>{
 const it=await (await worker.fetch(new Request('https://seva.test/join'),{})).text();
 assert.match(it,/SETTIMANA DEL PRIMO PASSO/);assert.match(it,/3 al 9 novembre 2026/);assert.match(it,/Non è richiesta una carta/);
 const en=await (await worker.fetch(new Request('https://seva.test/join?lang=en'),{})).text();
 assert.match(en,/FIRST STEP WEEK/);assert.match(en,/3 to 9 November 2026/);assert.match(en,/No card is required/);
 for(const html of [it,en]){assert.match(html,/\/app\?section=home/);assert.ok(!html.includes('Buy now'));assert.ok(!html.includes('Acquista ora'));}
});
