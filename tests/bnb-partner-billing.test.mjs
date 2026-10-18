import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTNER_BILLING_PRODUCTS,quoteBnbPartnerBilling} from '../packages/bnb/partner-billing.mjs';

const signed={
  status:'signed',signedAgreementRef:'contract-001',signedOn:'2026-10-17',
  partnerId:'property-001',effectiveFrom:'2026-10-01',currency:'eur',
  monthlyFeeCents:4900,commissionBps:500,
  stripeCustomerId:'cus_Example',stripeCustomerProviderVerified:true,
  stripeCustomerEvidenceRef:'provider-read-001',
  billingApproved:true,billingApprovalRef:'approval-001'
};
const verified={
  externalEventId:'reservation-001',kind:'direct_booking',
  completedOn:'2026-10-17',status:'completed',
  providerVerified:true,providerEvidenceRef:'pms-event-001',
  paymentVerified:true,commissionApprovedByContract:true,
  channel:'direct',refunded:false,disputed:false,commissionBaseCents:12000
};
test('B&B B2B products are distinct and initially inactive',()=>{
  assert.notEqual(PARTNER_BILLING_PRODUCTS.monthly,PARTNER_BILLING_PRODUCTS.commission);
  assert.equal(PARTNER_BILLING_PRODUCTS.status,'INACTIVE_PENDING_CONTRACT');
});
test('unsigned partners cannot be billed even with events and verified customer',()=>{
  const result=quoteBnbPartnerBilling({agreement:{...signed,status:'pending'},period:'2026-10',events:[verified]});
  assert.equal(result.status,'BLOCKED');
  assert.equal(result.subtotalCents,0);
  assert.equal(result.readyForInvoice,false);
  assert.equal(result.chargesCreated,0);
  assert.ok(result.gates.includes('SIGNED_PARTNER_CONTRACT_REQUIRED'));
});
test('billing approval is independently required',()=>{
  const r=quoteBnbPartnerBilling({agreement:{...signed,billingApproved:false},period:'2026-10',events:[verified]});
  assert.ok(r.gates.includes('EXPLICIT_BILLING_APPROVAL_REQUIRED'));
  assert.equal(r.subtotalCents,0);
});
test('price and rate must be explicitly configured',()=>{
  const r=quoteBnbPartnerBilling({agreement:{...signed,commissionBps:undefined},period:'2026-10',events:[verified]});
  assert.equal(r.status,'BLOCKED');
  assert.ok(r.gates.includes('AGREED_COMMISSION_RATE_REQUIRED'));
});
test('verified completed direct booking contributes commission in cents but does not invoice',()=>{
  const r=quoteBnbPartnerBilling({agreement:signed,period:'2026-10',events:[verified]});
  assert.equal(r.status,'PROPOSAL_ONLY');
  assert.equal(r.monthlyFeeCents,4900);
  assert.equal(r.commissionCents,600);
  assert.equal(r.subtotalCents,5500);
  assert.equal(r.eligibleEvents.length,1);
  assert.equal(r.readyForInvoice,false);
  assert.equal(r.invoiceCreated,false);
});
test('Booking.com/OTA reservations are not billed by default',()=>{
  const r=quoteBnbPartnerBilling({agreement:signed,period:'2026-10',events:[{...verified,channel:'booking.com'}]});
  assert.equal(r.subtotalCents,4900);
  assert.equal(r.eligibleEvents.length,0);
  assert.equal(r.excludedEvents[0].reason,'OTA_BOOKING_EXCLUDED_BY_DEFAULT');
});
test('unverified and refunded services cannot produce commission',()=>{
  const r=quoteBnbPartnerBilling({agreement:signed,period:'2026-10',events:[
    {...verified,externalEventId:'a',kind:'optional_service',paymentVerified:false},
    {...verified,externalEventId:'b',kind:'optional_service',refunded:true}
  ]});
  assert.equal(r.commissionCents,0);
  assert.equal(r.excludedEvents.length,2);
});
test('prevent same source event twice and skip durable-ledger billed IDs',()=>{
  const e2={...verified,externalEventId:'reservation-002'};
  const r=quoteBnbPartnerBilling({agreement:signed,period:'2026-10',
    events:[verified,verified,e2],alreadyInvoicedEventIds:['reservation-002']});
  assert.equal(r.eligibleEvents.length,1);
  assert.equal(r.excludedEvents.length,2);
  assert.equal(r.commissionCents,600);
});
test('invalid period and massive event arrays are rejected',()=>{
  assert.throws(()=>quoteBnbPartnerBilling({agreement:signed,period:'bad'}),/INVALID_BILLING_PERIOD/);
  assert.throws(()=>quoteBnbPartnerBilling({agreement:signed,period:'2026-10',events:{}}),/INVALID_EVENTS/);
});
