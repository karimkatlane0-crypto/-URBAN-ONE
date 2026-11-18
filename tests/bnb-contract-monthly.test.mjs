import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateBnbContract} from '../packages/bnb/contract-gates.mjs';
const timestamp = '2026-10-18T09:00:00.000Z';
const att = (reference, x={}) => ({verified:true,reference,source:'test-backend',verifiedAt:timestamp,...x});
const agreement = {reference:'agreement-1',currency:'EUR',signed:true,allowedActions:['monthly_subscription','direct_booking_commission'],monthlyFeeCents:9900,directCommissionBps:500};
const proofs = {signedAgreement:att('agreement-1'),authorizedProperty:att('property-1'),taxAndRefundTerms:att('terms-1')};
const assess = (action,extras={},terms={}) => evaluateBnbContract({action,agreement:{...agreement,...terms},proofs:{...proofs,...extras},now:'2026-10-18T12:00:00.000Z'});
test('only signed contract with verified property can pass early gates',()=>{
  assert.equal(assess('monthly_subscription',{authorizedProperty:null}).reason,'PROPERTY_PERMISSION_MISSING');
  assert.equal(assess('monthly_subscription',{signedAgreement:att('other')}).reason,'SIGNED_AGREEMENT_NOT_VERIFIED');
  assert.equal(assess('monthly_subscription',{}, {signed:false}).decision,'BLOCKED');
});
test('monthly service requires matching Stripe recurring price and payer mandate',()=>{
  const invoice={customerMandate:att('consent-1',{agreementReference:'agreement-1'}),stripePrice:att('price-1',{currency:'EUR',interval:'month',amountCents:9900})};
  assert.equal(assess('monthly_subscription').reason,'CUSTOMER_AUTOPAY_MANDATE_MISSING');
  assert.equal(assess('monthly_subscription',{...invoice,stripePrice:att('price-2',{currency:'EUR',interval:'month',amountCents:10000})}).reason,'STRIPE_RECURRING_PRICE_NOT_VERIFIED');
  const r=assess('monthly_subscription',invoice);
  assert.equal(r.decision,'READY_FOR_HUMAN_REVIEW');
  assert.equal(r.proposedAmountCents,9900);
  assert.equal(r.externalActionPerformed,false);
});
test('OTA reservation is not eligible for a direct-booking fee',()=>{
  const direct=att('res-1',{channel:'booking_com',paymentReference:'pay-1',paidAccommodationCents:20000});
  const r=assess('direct_booking_commission',{reservation:direct,payment:att('pay-1',{status:'succeeded'}),attribution:att('attr-1',{reservationReference:'res-1'})});
  assert.equal(r.reason,'OTA_COMMISSION_NOT_AUTHORIZED');
});
test('verified direct booking produces a fee suggestion without charging anyone',()=>{
  const direct=att('res-1',{channel:'direct',paymentReference:'pay-1',paidAccommodationCents:20000});
  const pp={reservation:direct,payment:att('pay-1',{status:'succeeded'}),attribution:att('attr-1',{reservationReference:'res-1'})};
  assert.equal(assess('direct_booking_commission',{...pp,payment:null}).reason,'PAYMENT_NOT_VERIFIED');
  const r=assess('direct_booking_commission',pp);
  assert.equal(r.proposedAmountCents,1000);
  assert.equal(r.externalActionPerformed,false);
});