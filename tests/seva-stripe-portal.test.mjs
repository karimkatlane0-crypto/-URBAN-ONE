import test from 'node:test';
import assert from 'node:assert/strict';
import {ownedStripeCustomer,portalGate} from '../apps/seva-enterprise/stripe-portal.mjs';
test('customer lookup is scoped to authenticated owner',()=>{
 const db={prepare:()=>({all:(a,b)=>{assert.equal(a,'owner-1');assert.equal(b,'owner-1');return [{customer:'cus_TEST123'}];}})};
 assert.equal(ownedStripeCustomer(db,'owner-1'),'cus_TEST123');
 assert.throws(()=>ownedStripeCustomer(db,''),{status:401});
});
test('ambiguous customers fail closed',()=>{
 const db={prepare:()=>({all:()=>[{customer:'cus_TEST123'},{customer:'cus_OTHER123'}]})};
 assert.throws(()=>ownedStripeCustomer(db,'owner'),{status:409});
});
test('LIVE key is refused even if flag is enabled',()=>{
 assert.throws(()=>portalGate({SEVA_STRIPE_TEST_PORTAL_ENABLED:'true',STRIPE_SECRET_KEY:'sk_live_fake',SEVA_PUBLIC_URL:'https://example.test'},'cus_TEST123'),{status:503});
});
test('TEST portal validates origin and customer',()=>{
 const env={SEVA_STRIPE_TEST_PORTAL_ENABLED:'true',STRIPE_SECRET_KEY:'sk_test_fake',SEVA_PUBLIC_URL:'https://example.test'};
 assert.deepEqual(portalGate(env,'cus_TEST123'),{customer:'cus_TEST123',return_url:'https://example.test/'});
 assert.throws(()=>portalGate({...env,SEVA_PUBLIC_URL:'http://example.test'},'cus_TEST123'),{status:503});
});
