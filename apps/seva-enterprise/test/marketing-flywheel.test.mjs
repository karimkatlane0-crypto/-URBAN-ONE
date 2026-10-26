import test from 'node:test';
import assert from 'node:assert/strict';
import {previewFundedMarketingPurchase as p} from '../marketing-flywheel.mjs';
const ok={purchaseCents:10000,verifiedMerchantBudgetCents:10000,exclusiveAllocatedCents:10000,contractCapCents:10000,customerMarketingContributionCents:0,
  purchaseCompleted:true,paymentConfirmed:true,partnerAgreementActive:true,customerTermsAccepted:true,partnerConfirmed:true,
  deliveryVerified:true,refundWindowCleared:true,budgetProvenReserved:true,
  partnerAgreementRef:'contract-test-001',fundingReceiptRef:'reserve-test-001'};
test('Double Flywheel preview: 100% external funding is POSSIBLE but never guaranteed or paid',()=>{
 const r=p(ok);
 assert.equal(r.potentialBenefitCents,10000);
 assert.equal(r.potentialNetAfterSettlementCents,0);
 assert.equal(r.potentiallyZeroNetCostAfterVerifiedSettlement,true);
 assert.equal(r.customerDueAtCheckoutCents,10000);
 assert.equal(r.guaranteedFreePurchase,false);
 assert.equal(r.confirmedCashbackPaidCents,0);
 assert.equal(r.payoutExecuted,false);
});
test('Double Flywheel: cannot use customer marketing contribution as partner funds',()=>{
 const r=p({...ok,verifiedMerchantBudgetCents:0,exclusiveAllocatedCents:0,customerMarketingContributionCents:10000});
 assert.equal(r.potentialBenefitCents,0);
 assert.equal(r.potentialNetAfterSettlementCents,10000);
});
test('Double Flywheel: contract cap and exclusive allocated budget prevent double spending',()=>{
 const r=p({...ok,exclusiveAllocatedCents:3500,contractCapCents:3000});
 assert.equal(r.potentialBenefitCents,3000);
 assert.equal(r.potentialNetAfterSettlementCents,7000);
});
test('Double Flywheel: incomplete cart and unpaid order produce zero candidate benefit',()=>{
 for(const field of ['purchaseCompleted','paymentConfirmed','deliveryVerified']){
  const r=p({...ok,[field]:false});
  assert.equal(r.potentialBenefitCents,0,field);
  assert.equal(r.customerDueAtCheckoutCents,10000);
 }
});
test('Double Flywheel: absent buyer agreement, partner approval or reserved funds always BLOCK',()=>{
 for(const field of ['partnerAgreementActive','customerTermsAccepted','partnerConfirmed','refundWindowCleared','budgetProvenReserved']){
  const r=p({...ok,[field]:false});
  assert.equal(r.status,'BLOCKED_FUNDING_OR_TERMS',field);
  assert.equal(r.potentialBenefitCents,0,field);
 }
});
test('Double Flywheel: malformed contract and receipt references cannot confer benefit',()=>{
 for(const field of ['partnerAgreementRef','fundingReceiptRef']){
  assert.equal(p({...ok,[field]:''}).potentialBenefitCents,0);
 }
});
test('Double Flywheel: integer money constraints and no overbroad claims',()=>{
 for(const v of [-1,2.4,Number.POSITIVE_INFINITY,1e12])assert.throws(()=>p({...ok,exclusiveAllocatedCents:v}));
 assert.equal(p({...ok,purchaseCents:0}).potentiallyZeroNetCostAfterVerifiedSettlement,false);
});
