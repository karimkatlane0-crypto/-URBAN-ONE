import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateBnbContract} from '../packages/bnb/contract-gates.mjs';
const stamp='2026-10-18T08:00:00.000Z';
const att=(reference,extra={})=>({verified:true,reference,source:'verified-test-backend',verifiedAt:stamp,...extra});
const agreement={reference:'contract-1',signed:true,currency:'EUR',allowedActions:['network_pass_host_settlement','optional_service_commission'],hostSettlementCents:12000,serviceCommissionBps:1000};
const common={signedAgreement:att('contract-1'),authorizedProperty:att('property-1'),taxAndRefundTerms:att('terms-1')};
const decide=(action,more={},terms={})=>evaluateBnbContract({action,now:'2026-10-18T12:00:00.000Z',agreement:{...agreement,...terms},proofs:{...common,...more}});
test('settlement requires verified stay and connected recipient',()=>{
  const items={
    reservation:att('reservation-1',{channel:'network_pass',membershipPaymentReference:'paid-1'}),
    memberPayment:att('paid-1',{status:'succeeded'}),
    completedStay:att('checkout-1',{reservationReference:'reservation-1'}),
    connectRecipient:att('recipient-1',{payoutsEnabled:true,propertyReference:'property-1'}),
    reconciliation:att('ledger-1',{noRefundOrDispute:true,eligibleFundsCents:12000})
  };
  assert.equal(decide('network_pass_host_settlement',items,{hostSettlementCents:13000}).reason,'SETTLEMENT_AMOUNT_EXCEEDS_ELIGIBLE_FUNDS');
  assert.equal(decide('network_pass_host_settlement',{...items,connectRecipient:null}).reason,'HOST_PAYOUT_RECIPIENT_NOT_VERIFIED');
  assert.equal(decide('network_pass_host_settlement',{...items,reconciliation:att('ledger-2',{noRefundOrDispute:false,eligibleFundsCents:12000})}).reason,'SETTLEMENT_RECONCILIATION_MISSING');
  const r=decide('network_pass_host_settlement',items);
  assert.equal(r.decision,'READY_FOR_HUMAN_REVIEW');
  assert.equal(r.proposedAmountCents,12000);
  assert.equal(r.externalActionPerformed,false);
});
test('optional services require consumer choice, payment and fulfillment',()=>{
  const service=att('service-1',{fulfilled:true,paidCents:5000,paymentReference:'pay-1'});
  assert.equal(decide('optional_service_commission',{service}).reason,'OPTIONAL_PURCHASE_NOT_AUTHORIZED');
  const result=decide('optional_service_commission',{service,guestPurchaseConsent:att('choice-1',{serviceReference:'service-1'}),payment:att('pay-1',{status:'succeeded'})});
  assert.equal(result.proposedAmountCents,500);
  assert.equal(result.externalActionPerformed,false);
});
