import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker from '../worker/index.js';

test('B&B calendar is an empty public tool in Italian and English, with no-store device privacy',async()=>{
 for(const language of ['it','en']){
  const response=await worker.fetch(new Request('https://synapsy.test/kkubera/booking?lang='+language),{});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
  assert.equal(response.headers.get('Permissions-Policy'),'geolocation=(), camera=(), microphone=()');
  const html=await response.text();
  assert(html.includes('<html lang="'+language+'"'));
  assert(html.includes('https://admin.booking.com/'));
  assert(html.includes('https://connect.booking.com/'));
  for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(script[1].trim())new vm.Script(script[1]);
 }
});

test('calendar page never accepts remote calendar writes or consumes supplied private feed URLs',async()=>{
 const denied=await worker.fetch(new Request('https://synapsy.test/kkubera/booking',{method:'POST',body:'BEGIN:VCALENDAR'}),{});
 assert.equal(denied.status,405);assert.equal(denied.headers.get('Allow'),'GET, HEAD');
 const head=await worker.fetch(new Request('https://synapsy.test/kkubera/booking',{method:'HEAD'}),{});
 assert.equal(head.status,200);assert.equal(await head.text(),'');
 const html=await (await worker.fetch(new Request('https://synapsy.test/kkubera/booking?feed=https%3A%2F%2Fprivate.invalid%2FSECRET_TEST&unit=GUEST_TEST'),{})).text();
 assert(!html.includes('SECRET_TEST'));assert(!html.includes('GUEST_TEST'));
});

test('calendar is discoverable with a platform canonical, not the unpaid custom domain',async()=>{
 const response=await worker.fetch(new Request('https://synapsy.test/sitemap.xml'),{}),xml=await response.text();
 assert(xml.includes('https://seva.karimkatlane0.chatgpt.site/kkubera/booking'));
 const html=await (await worker.fetch(new Request('https://synapsy.test/kkubera/booking?lang=en'),{})).text();
 assert(html.includes('https://seva.karimkatlane0.chatgpt.site/kkubera/booking?lang=en'));
 assert(!html.includes('sevaintelligencestudio.com'));
});
