import test from 'node:test';
import assert from 'node:assert/strict';
import {ENTERPRISE_OFFER,assessEnterpriseOffer} from '../packages/enterprise/global-offer.mjs';

test('Price is EUR 1,000,000 for negotiation, not a charge or checkout',()=>{
  assert.equal(ENTERPRISE_OFFER.requestedLicenseFeeCents,100_000_000);
  assert.equal(ENTERPRISE_OFFER.currency,'EUR');
  assert.equal(ENTERPRISE_OFFER.automatedBilling,false);
  assert.equal(ENTERPRISE_OFFER.checkOut,false);
});
test('No source attestation means all seven enterprise gates remain open',()=>{
  const s=assessEnterpriseOffer();
  assert.equal(s.status,'DUE_DILIGENCE_INCOMPLETE');
  assert.equal(s.blocked.length,7);
  assert.equal(s.paymentCollected,false);
  assert.equal(s.publicStorePublished,false);
  assert.equal(s.bankPaymentInitiated,false);
  assert.equal(s.industrialActuationPerformed,false);
});
test('Bare booleans and weak receipts cannot attest regulated live status',()=>{
  const s=assessEnterpriseOffer({rightsClearance:{verified:true,independentEvidenceRef:'123'}});
  assert.ok(s.blocked.includes('PROPRIETARY_IP_RIGHTS_NOT_VERIFIED'));
});
test('Even all valid attestations only allow human commercial review',()=>{
  const e={};
  for(const key of ['rightsClearance','iconRights','aiProvider','bankingProvider',
    'securityAudit','customerDemo','enterpriseTerms'])
    e[key]={verified:true,independentEvidenceRef:'provider-audit-trace'};
  const s=assessEnterpriseOffer(e);
  assert.equal(s.status,'READY_FOR_HUMAN_COMMERCIAL_REVIEW');
  assert.equal(s.contractExecuted,false);
  assert.equal(s.softwareDeploymentPerformed,false);
  assert.equal(s.aiProviderCallPerformed,false);
  assert.equal(s.bankDataAccessPerformed,false);
});
