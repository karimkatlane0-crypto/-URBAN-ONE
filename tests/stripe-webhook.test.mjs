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
