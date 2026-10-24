import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const liveLink='https://buy.stripe.com/7sYbJ351fghgei7auSb7y05';
const disabledPsd2Link='https://buy.stripe.com/9B65kF9hv6GG4HxcD0b7y02';

for(const lang of ['it','en','de','fr','es']){
  test('B2B '+lang+' offers agreed-service Stripe LIVE checkout with clear separation',()=>{
    const page=read('apps/web/europe-'+lang+'.html');
    assert.ok(page.includes('id="stripe-payment"'));
    assert.ok(page.includes(liveLink));
    assert.match(page,/rel="noopener noreferrer"/);
    assert.ok(!page.includes(disabledPsd2Link));
    assert.ok(!/\bIT[0-9]{2}[A-Z][0-9]{22}\b/i.test(page),'no full Italian bank coordinates');
  });
}
test('URBAN ONE app home links to agreed-service checkout but not PSD2 subscription',()=>{
  const page=read('apps/web/index.html');
  assert.ok(page.includes(liveLink));
  assert.ok(!page.includes(disabledPsd2Link));
  assert.ok(page.includes('riferimento del contratto'));
  assert.ok(page.includes('non attiva automaticamente PSD2'));
});
test('B2B sales copy does not present Stripe payment as automatic entitlement',()=>{
  const docs=read('docs/URBAN_ONE_B2B_SERVICE_OFFERS.md');
  assert.match(docs,/contratto/);
  assert.match(docs,/Stripe/);
  assert.match(docs,/webhook/i);
});
