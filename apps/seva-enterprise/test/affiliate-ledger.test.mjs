import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../core.mjs';
import {evaluateAffiliateOpportunity,createAffiliateLedger} from '../affiliate-ledger.mjs';

const complete={stage:'completed',purchaseCents:10000,partnerApprovedCommissionCents:100,
 partnerAgreementActive:true,termsAcceptedByAuthorizedParties:true,trackingAuthorized:true,
 partnerConfirmed:true,refundWindowCleared:true,partnerAgreementRef:'contract-test-1',
 partnerReceiptRef:'partner-invoice-confirmed-test'};
function setup(){
 const store=createStore();
 const first=store.register('first@example.invalid','LongSyntheticStrongPassword-001');
 const second=store.register('second@example.invalid','LongSyntheticStrongPassword-002');
 return {store,first,second,ledger:createAffiliateLedger(store)};
}
test('G3 affiliate: abandoned basket always earns zero and never charges customer',()=>{
 const x=evaluateAffiliateOpportunity({...complete,stage:'abandoned'});
 assert.equal(x.commissionRecognizedCents,0);
 assert.equal(x.customerChargedCents,0);
 assert.equal(x.status,'NOT_EARNED_INCOMPLETE');
 assert.equal(x.transferExecuted,false);
});
test('G3 affiliate: started checkout and paid-not-fulfilled do not accrue a fee',()=>{
 for(const stage of ['initiated','paid']){
  const x=evaluateAffiliateOpportunity({...complete,stage});
  assert.equal(x.commissionRecognizedCents,0);
  assert.equal(x.commissionPaidCents,0);
 }
});
test('G3 affiliate: merchant agreement and explicit approved commission required',()=>{
 for(const missing of ['partnerAgreementActive','termsAcceptedByAuthorizedParties','trackingAuthorized','partnerConfirmed','refundWindowCleared','partnerAgreementRef','partnerReceiptRef']){
  const x=evaluateAffiliateOpportunity({...complete,[missing]:false});
  assert.equal(x.status,'BLOCKED_AGREEMENT_OR_EVIDENCE',missing);
 }
 assert.equal(evaluateAffiliateOpportunity({...complete,partnerApprovedCommissionCents:0}).commissionRecognizedCents,0);
});
test('G3 affiliate: completed verified sale is only a manual reconciliation candidate',()=>{
 const x=evaluateAffiliateOpportunity(complete);
 assert.equal(x.status,'ELIGIBLE_FOR_MANUAL_RECONCILIATION');
 assert.equal(x.commissionRecognizedCents,100);
 assert.equal(x.commissionPaidCents,0);
 assert.equal(x.transferExecuted,false);
 assert.equal(x.eligibleForAutomaticPayout,false);
});
test('G3 affiliate: refunds, disputes and cancellation reduce candidate to zero',()=>{
 for(const stage of ['refunded','disputed','canceled']){
  const x=evaluateAffiliateOpportunity({...complete,stage});
  assert.equal(x.commissionRecognizedCents,0);
  assert.equal(x.status,'REVERSED_OR_DISPUTED');
 }
});
test('G3 affiliate: reject invalid or excessive amounts',()=>{
 for(const amount of [-1,1.4,10001,1e12])
  assert.throws(()=>evaluateAffiliateOpportunity({...complete,partnerApprovedCommissionCents:amount}));
 assert.throws(()=>evaluateAffiliateOpportunity({...complete,stage:'unknown'}));
});
test('G3 affiliate: partner events are idempotent and scoped per authenticated owner',()=>{
 const {first,second,ledger}=setup();
 const a=ledger.record(first.id,'partner-A','order-1','evt-1',complete);
 assert.equal(a.duplicate,false);
 assert.equal(ledger.record(first.id,'partner-A','order-1','evt-1',complete).duplicate,true);
 assert.equal(ledger.list(first.id).length,1);
 assert.equal(ledger.list(second.id).length,0);
 ledger.record(second.id,'partner-A','order-1','evt-1',{...complete,stage:'abandoned'});
 assert.equal(ledger.list(second.id)[0].commissionCandidateCents,0);
 assert.equal(ledger.list(first.id)[0].commissionCandidateCents,100);
});
test('G3 affiliate: subsequent refund reverses candidate and prevents old completed replay',()=>{
 const {first,ledger}=setup();
 ledger.record(first.id,'partner-A','order-1','evt-1',complete);
 ledger.record(first.id,'partner-A','order-1','evt-refunded',{...complete,stage:'refunded'});
 assert.equal(ledger.list(first.id)[0].commissionCandidateCents,0);
 assert.equal(ledger.list(first.id)[0].status,'REVERSED_OR_DISPUTED');
 assert.throws(()=>ledger.record(first.id,'partner-A','order-1','evt-late',complete),/Reversal is final/);
});
test('G3 affiliate: forged or missing owner identity is rejected',()=>{
 const {first,ledger}=setup();
 assert.throws(()=>ledger.record('unknown','partner-A','order-1','evt-1',complete),/Authenticated owner/);
 assert.throws(()=>ledger.record(first.id,'partner-A','order-1','!invalid',complete),/Invalid event/);
});
