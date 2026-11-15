import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import worker from '../worker/index.js';
import {ecommercePaymentOptions} from '../src/ecommerce-api.js';

const call=(path,method='GET')=>worker.fetch(new Request('https://seva.test'+path,{method}));

test('services hub presents free use and partner scope before agreed payment',async()=>{
 for(const lang of ['it','en']){
  const response=await call('/servizi?lang='+lang);
  assert.equal(response.status,200);
  const html=await response.text();
  for(const anchor of ['onboarding-partner','cms','commerce','servizi-concordati'])assert(html.includes('id="'+anchor+'"'));
  assert(html.includes('href="/app?section=business"'));
  assert(html.includes('href="/cms'+(lang==='en'?'?lang=en':'')+'#editor"'));
  assert(html.includes('href="/acquista'+(lang==='en'?'?lang=en':'')+'"'));
  assert(!html.includes('href="/checkout/servizio-'));
  assert(!html.includes('href="https://buy.stripe.com/'));
 }
 assert.equal((await call('/servizi','POST')).status,405);
 assert.equal(await (await call('/servizi','HEAD')).text(),'');
 const options=ecommercePaymentOptions();
 assert.equal(options.servicePage,'https://seva.karimkatlane0.chatgpt.site/servizi');
 assert.equal(options.freeToolsRequirePayment,false);
 assert.equal(options.priorAgreementRequired,true);
 assert.equal(options.liveProviderQuery,false);
});

test('purchase links cannot change recipient, price or redirect through query parameters',async()=>{
 for(const amount of [50,500]){
  const expected=ecommercePaymentOptions().options.find(o=>o.amountCents===amount*100).url;
  for(const method of ['GET','HEAD']){
   const response=await call('/checkout/servizio-'+amount+'?url=https://attacker.test&amount=1&success=true',method);
   assert.equal(response.status,302);
   assert.equal(response.headers.get('Location'),expected);
   assert.equal(response.headers.get('Cache-Control'),'no-store');
   assert.equal(await response.text(),'');
  }
  assert.equal((await call('/checkout/servizio-'+amount,'POST')).status,405);
 }
 assert.equal((await call('/checkout/servizio-250')).status,404);
});

test('purchase page works publicly in both languages and separates paid services from pending CMS',async()=>{
 for(const lang of ['it','en']){
  const response=await call('/acquista?lang='+lang);assert.equal(response.status,200);
  const html=await response.text();
  for(const amount of [50,500])assert(html.includes('href="/checkout/servizio-'+amount+'"'));
  assert(html.includes(lang==='it'?'checkout Stripe dell’abbonamento CMS rimane disabilitato':'CMS Stripe subscription checkout remains disabled'));
  const cmsSection=html.match(/<section id="cms"[\s\S]*?<\/section>/)[0];
  assert.equal(cmsSection.match(/<a class="btn" href="([^"]+)"/)[1],'/checkout/bonifico?service=cms');
  assert(html.includes(lang==='it'?'non si attiva automaticamente':'not activated automatically'));
  assert(html.includes('href="/app?section=business&amp;offer=cms"'));
  assert(html.includes('id="purchaseShareHtml"'));
  for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))if(!script.includes('function bindCookiePreferences')&&!script.includes('function bindSevaExperience'))assert(!script.includes('fetch('));
  for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Script(script));
 }
 assert.equal((await call('/acquista','POST')).status,405);
 assert.equal(await (await call('/acquista','HEAD')).text(),'');
 for(const route of ['/buy','/checkout'])assert.equal((await call(route+'?lang=en&url=https://attacker.test')).headers.get('Location'),'/acquista?lang=en');
});

test('every sitemap page exposes a service-first link without needing scripts',async()=>{
 const sitemap=await (await call('/sitemap.xml')).text();
 const paths=[...new Set([...sitemap.matchAll(/<loc>https:\/\/[^/]+([^<]+)<\/loc>/g)].map(m=>m[1]))];
 assert(paths.includes('/acquista'));assert(paths.includes('/acquista?lang=en'));
 for(const path of paths){
  const html=await (await call(path)).text();
  const links=[...html.matchAll(/<a\b[^>]*data-seva-purchase-link[^>]*>/g)];
  assert.equal(links.length,1,path);
  const href=links[0][0].match(/\bhref="([^"]+)"/)?.[1];
  assert.equal(href,'/servizi'+((new URL(path,'https://seva.test').searchParams.get('lang')||'it')!=='it'?'?lang=en':''),path);
  assert.equal((html.match(/data-seva-purchase-link/g)||[]).length,1,path);
 }
});

test('CMS request keeps the chosen offer through sign-in',async()=>{
 const response=await call('/app?section=business&offer=cms');
 assert.equal(response.status,302);
 const target=new URL(response.headers.get('Location'),'https://seva.test');
 assert.equal(target.searchParams.get('return_to'),'/app?section=business&offer=cms');
 const malicious=await call('/app?section=business&offer=https://attacker.test');
 assert(!malicious.headers.get('Location').includes('attacker'));
});

test('totem offer and voice draft return paths survive sign-in without forwarding other private parameters',async()=>{
 for(const [path,expected] of [['/app?section=business&offer=totem&private=SECRET','/app?section=business&offer=totem'],['/app?section=contact&from=senses&private=SECRET','/app?section=contact&from=senses']]){
  const response=await call(path);assert.equal(response.status,302);
  const target=new URL(response.headers.get('location'),'https://seva.test');assert.equal(target.searchParams.get('return_to'),expected);
 }
});

test('Enterprise assistance preserves only its approved offer through sign-in and rejects ambiguous selectors',async()=>{
 const result=await call('/app?section=business&offer=enterprise-onboarding&site=PRIVATE&amount=1');
 assert.equal(result.status,302);
 assert.equal(new URL(result.headers.get('location'),'https://seva.test').searchParams.get('return_to'),'/app?section=business&offer=enterprise-onboarding');
 for(const query of ['offer=enterprise-onboarding&offer=cms','offer=enterprise-onboarding&offer=enterprise-onboarding']){
  const response=await call('/app?section=business&'+query);
  assert.equal(new URL(response.headers.get('location'),'https://seva.test').searchParams.get('return_to'),'/app?section=business');
 }
});
