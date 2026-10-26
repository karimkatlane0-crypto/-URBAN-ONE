import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore,verifyStripeSignature,signedStripeHeader} from '../core.mjs';

const paid=(id,session,subscription='sub_one',type='checkout.session.completed')=>({
  id,type,data:{object:{id:session,mode:'subscription',payment_status:'paid',customer:'cus_seva',subscription}}
});
const notPaid=(id,session)=>({
  id,type:'checkout.session.completed',data:{object:{id:session,mode:'subscription',payment_status:'unpaid',subscription:'sub_one'}}
});
const bootstrap=()=>{
  const s=createStore();
  const u=s.register('seva-buyer@example.com','SafeTestPassword-12345');
  s.recordCheckout(u.id,'cs_seva_one');
  return {s,u};
};
test('signed webhook verifies payload and rejects a tampered receipt',()=>{
 const body=JSON.stringify(paid('evt_one','cs_seva_one'));
 const secret='whsec_synthetic_only';
 assert.equal(verifyStripeSignature(body,signedStripeHeader(body,secret),secret),true);
 assert.equal(verifyStripeSignature(body+'tampered',signedStripeHeader(body,secret),secret),false);
});
test('unpaid Checkout never grants customer entitlement',()=>{
 const {s,u}=bootstrap();
 assert.equal(s.processStripeEvent(notPaid('evt_unpaid','cs_seva_one')),'recorded');
 assert.equal(s.hasAccess(u.id),false);
});
test('asynchronous paid confirmation later grants only owner of tracked Checkout',()=>{
 const {s,u}=bootstrap();
 s.processStripeEvent(notPaid('evt_unpaid','cs_seva_one'));
 assert.equal(s.processStripeEvent(paid('evt_async','cs_seva_one','sub_one','checkout.session.async_payment_succeeded')),'enabled');
 assert.equal(s.hasAccess(u.id),true);
 assert.equal(s.processStripeEvent(paid('evt_async','cs_seva_one','sub_one','checkout.session.async_payment_succeeded')),'duplicate');
});
test('asynchronous paid event for unknown checkout is rejected',()=>{
 const {s,u}=bootstrap();
 assert.throws(()=>s.processStripeEvent(paid('evt_fake','cs_not_registered','sub_intruder','checkout.session.async_payment_succeeded')),/Checkout owner mismatch/);
 assert.equal(s.hasAccess(u.id),false);
});
test('paid checkout missing subscription id does not grant entitlement',()=>{
 const {s,u}=bootstrap();
 const event=paid('evt_missing','cs_seva_one');delete event.data.object.subscription;
 assert.throws(()=>s.processStripeEvent(event),/subscription ID/);
 assert.equal(s.hasAccess(u.id),false);
});
test('invoice.paid new-schema parent.subscription_details renews an existing entitlement',()=>{
 const {s,u}=bootstrap();
 s.processStripeEvent(paid('evt_initial','cs_seva_one'));
 s.processStripeEvent({id:'evt_fail',type:'invoice.payment_failed',data:{object:{parent:{subscription_details:{subscription:'sub_one'}}}}});
 assert.equal(s.hasAccess(u.id),false);
 const response=s.processStripeEvent({id:'evt_recover',type:'invoice.paid',data:{object:{parent:{subscription_details:{subscription:'sub_one'}}}}});
 assert.equal(response,'enabled');
 assert.equal(s.hasAccess(u.id),true);
});
test('subscription update active alone cannot restore access after payment failure',()=>{
 const {s,u}=bootstrap();
 s.processStripeEvent(paid('evt_initial','cs_seva_one'));
 s.processStripeEvent({id:'evt_fail',type:'invoice.payment_failed',data:{object:{subscription:'sub_one'}}});
 assert.equal(s.hasAccess(u.id),false);
 assert.equal(s.processStripeEvent({id:'evt_update',type:'customer.subscription.updated',data:{object:{id:'sub_one',status:'active'}}}),'recorded');
 assert.equal(s.hasAccess(u.id),false);
});
test('new subscription survives late cancellation from OLD subscription',()=>{
 const {s,u}=bootstrap();
 s.processStripeEvent(paid('evt_initial','cs_seva_one'));
 s.recordCheckout(u.id,'cs_seva_two');
 s.processStripeEvent(paid('evt_new','cs_seva_two','sub_two'));
 assert.equal(s.hasAccess(u.id),true);
 assert.equal(s.processStripeEvent({id:'evt_old_cancel',type:'customer.subscription.deleted',data:{object:{id:'sub_one'}}}),'recorded');
 assert.equal(s.hasAccess(u.id),true);
});
test('current subscription cancellation disables access; duplicate cancellation does not repeat',()=>{
 const {s,u}=bootstrap();
 s.processStripeEvent(paid('evt_initial','cs_seva_one'));
 const event={id:'evt_cancel',type:'customer.subscription.deleted',data:{object:{id:'sub_one'}}};
 assert.equal(s.processStripeEvent(event),'disabled');
 assert.equal(s.hasAccess(u.id),false);
 assert.equal(s.processStripeEvent(event),'duplicate');
});
test('unrecognized provider events remain recorded without granting access',()=>{
 const {s,u}=bootstrap();
 assert.equal(s.processStripeEvent({id:'evt_info',type:'checkout.session.async_payment_failed',data:{object:{id:'cs_seva_one'}}}),'recorded');
 assert.equal(s.hasAccess(u.id),false);
});
