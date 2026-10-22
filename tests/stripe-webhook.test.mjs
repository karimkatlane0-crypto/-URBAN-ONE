import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {classifyStripeEvent,handleStripeWebhook,verifyStripeSignature} from '../services/api/stripe-webhook.mjs';

const secret='whsec_test_secret';
const now=1_800_000_000;
const payload=Buffer.from(JSON.stringify({id:'evt_123',type:'invoice.paid'}));
const signature=createHmac('sha256',secret).update(String(now)).update('.').update(payload).digest('hex');
const header=`t=${now},v1=${signature}`;

test('accepts a valid Stripe signature',()=>{
  assert.equal(verifyStripeSignature({payload,signatureHeader:header,secret,now}),true);
});

test('rejects an invalid Stripe signature',()=>{
  assert.throws(()=>verifyStripeSignature({payload,signatureHeader:`t=${now},v1=00`,secret,now}),/STRIPE_SIGNATURE_INVALID/);
});

test('rejects a stale Stripe signature',()=>{
  assert.throws(()=>verifyStripeSignature({payload,signatureHeader:header,secret,now:now+301}),/STRIPE_SIGNATURE_STALE/);
});

test('classifies subscription lifecycle events',()=>{
  assert.equal(classifyStripeEvent('checkout.session.completed'),'VERIFY_SUBSCRIPTION_BEFORE_GRANT');
  assert.equal(classifyStripeEvent('invoice.paid'),'CONTINUE_ENTITLEMENT');
  assert.equal(classifyStripeEvent('invoice.payment_failed'),'PAYMENT_RECOVERY');
  assert.equal(classifyStripeEvent('customer.subscription.updated'),'SYNC_SUBSCRIPTION');
  assert.equal(classifyStripeEvent('customer.subscription.deleted'),'REVOKE_ENTITLEMENT');
  assert.equal(classifyStripeEvent('payment_intent.succeeded'),'VERIFY_ONE_TIME_PAYMENT_BEFORE_FULFILLMENT');
  assert.equal(classifyStripeEvent('payment_intent.payment_failed'),'PAYMENT_FAILURE_REVIEW');
  assert.equal(classifyStripeEvent('checkout.session.async_payment_failed'),'PAYMENT_FAILURE_REVIEW');
  assert.equal(classifyStripeEvent('charge.refunded'),'PAYMENT_ADJUSTMENT_REVIEW');
  assert.equal(classifyStripeEvent('charge.dispute.created'),'PAYMENT_ADJUSTMENT_REVIEW');
  assert.equal(classifyStripeEvent('customer.created'),'IGNORE');
});

test('webhook handler returns a verified event envelope',()=>{
  const result=handleStripeWebhook({rawBody:payload,headers:{'stripe-signature':header},env:{STRIPE_WEBHOOK_SECRET:secret},now});
  assert.equal(result.status,200);
  assert.equal(result.body.received,true);
  assert.equal(result.body.eventId,'evt_123');
  assert.equal(result.body.action,'CONTINUE_ENTITLEMENT');
  assert.equal(result.body.paymentVerified,false);
  assert.equal(result.body.fulfillmentAuthorized,false);
});


test('rejects malformed HMAC encodings instead of accepting a decoded prefix',()=>{
  for(const malformed of [signature+'zz',signature+'0',signature+'00',signature+'=zz',signature.slice(0,-1),signature.slice(0,-2)+'xx']){
    assert.throws(()=>verifyStripeSignature({payload,signatureHeader:`t=${now},v1=${malformed}`,secret,now}),/STRIPE_SIGNATURE_INVALID/);
  }
  // Secret rotation may include more than one v1; any strictly valid match is accepted.
  assert.equal(verifyStripeSignature({payload,signatureHeader:`t=${now},v1=malformed,v1=${signature}`,secret,now}),true);
});

test('rejects invalid clock and tolerance values that could bypass freshness checks',()=>{
  for(const clock of [NaN,Infinity,-Infinity,-1,String(now)]){
    assert.throws(()=>verifyStripeSignature({payload,signatureHeader:header,secret,now:clock}),/STRIPE_SIGNATURE_TIME_INVALID/);
  }
  for(const toleranceSeconds of [NaN,Infinity,-Infinity,-1,'300']){
    assert.throws(()=>verifyStripeSignature({payload,signatureHeader:header,secret,now,toleranceSeconds}),/STRIPE_SIGNATURE_TIME_INVALID/);
  }
  assert.equal(verifyStripeSignature({payload,signatureHeader:header,secret,now,toleranceSeconds:0}),true);
  assert.throws(()=>verifyStripeSignature({payload,signatureHeader:header,secret,now:now+1,toleranceSeconds:0}),/STRIPE_SIGNATURE_STALE/);
});

test('requires exactly one canonical safe integer timestamp',()=>{
  for(const timestamp of ['', 'NaN', 'Infinity', '-1', `${now}.0`, `${now}=extra`, `0${now}`, '9007199254740992', `${now},t=${now}`]){
    assert.throws(()=>verifyStripeSignature({payload,signatureHeader:`t=${timestamp},v1=${signature}`,secret,now}),/STRIPE_SIGNATURE_INVALID/);
  }
});
