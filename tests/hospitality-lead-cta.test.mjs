import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const target='https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/39';
test('public B&B pilot issue is linked from all 5 localized offers',()=>{
 for(const lang of ['it','en','de','fr','es']){
  const page=read('apps/web/hospitality-'+lang+'.html');
  assert.ok(page.includes(target),lang);
  assert.ok(page.includes('rel="noopener noreferrer"'),lang);
 }
 for(const p of ['README.md','apps/web/index.html','press/TRAVEL_24H_SOCIAL_POSTS_2026.md'])
   assert.ok(read(p).includes(target),p);
});
test('CJ publisher activation stays separate from Booking advertiser and commissions',()=>{
 const brief=read('docs/BOOKING_CJ_PUBLISHER_APPLICATION_2026.md');
 assert.match(brief,/CJ_PUBLISHER_ACTIVE_BY_PROVIDER_EMAIL_2026_10_23/);
 assert.match(brief,/BOOKING_ADVERTISER_APPLICATION_STATUS_UNKNOWN/);
 assert.match(brief,/NO_AFFILIATE_ID_VERIFIED/);
 assert.match(brief,/CJ_PAYOUT_CONFIGURATION_NOT_VERIFIED/);
 assert.match(brief,/Demand API Managed Affiliate needs a separate Booking partner contract/);
 assert.match(brief,/Connectivity Partner enrollment is separately paused/);
 assert.match(brief,/completed booking/);
 assert.match(brief,/https:\/\/www\.booking\.com\/affiliate-program\/v2\/index\.it\.html/);
 assert.doesNotMatch(brief, /sk_live_|whsec_|\bIT\d{2}[A-Z]\d{10}[A-Z0-9]{12}\b/i);
});
