import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareFabrickMockAis,prepareFabrickMockPis} from '../packages/finance/fabrick-psd2-mock.mjs';
const ais={mode:'mock',syntheticAccountTag:'MOCK_DEMO_ACCOUNT',consentSimulated:true};
const pis={mode:'mock',amountCents:12000,currency:'EUR',syntheticBeneficiaryTag:'MOCK_HOTEL',
  payerConsentSimulated:true,humanApprovalSimulated:true,scaSimulated:true};
test('AIS/PIS are disabled unless explicitly MOCK mode, including live requests',()=>{
  assert.throws(()=>prepareFabrickMockAis(),/FABRICK_PROVIDER_DISABLED/);
  assert.throws(()=>prepareFabrickMockPis({...pis,mode:'live'}),/FABRICK_PROVIDER_DISABLED/);
});
test('AIS mock requires synthetic account and simulated consent',()=>{
  assert.throws(()=>prepareFabrickMockAis({...ais,consentSimulated:false}),/MOCK_AIS_CONSENT_REQUIRED/);
  assert.throws(()=>prepareFabrickMockAis({...ais,syntheticAccountTag:'IT00REALACCOUNT'}),/SYNTHETIC_ACCOUNT_REQUIRED/);
  const r=prepareFabrickMockAis(ais);
  assert.equal(r.realBankDataRead,false);
  assert.equal(r.providerCalls,0);
});
test('PIS mock requires synthetic beneficiary, positive amount, consent, approval and mock SCA',()=>{
  assert.throws(()=>prepareFabrickMockPis({...pis,amountCents:-1}),/INVALID_MOCK_PIS_AMOUNT/);
  assert.throws(()=>prepareFabrickMockPis({...pis,syntheticBeneficiaryTag:'IT00REALACCOUNT'}),/SYNTHETIC_BENEFICIARY_REQUIRED/);
  assert.throws(()=>prepareFabrickMockPis({...pis,payerConsentSimulated:false}),/MOCK_PAYER_CONSENT_REQUIRED/);
  assert.throws(()=>prepareFabrickMockPis({...pis,humanApprovalSimulated:false}),/MOCK_HUMAN_APPROVAL_REQUIRED/);
  assert.throws(()=>prepareFabrickMockPis({...pis,scaSimulated:false}),/MOCK_SCA_REQUIRED/);
  const r=prepareFabrickMockPis(pis);
  assert.equal(r.state,'MOCK_PREPARED_NOT_EXECUTED');
  assert.equal(r.bankPaymentExecuted,false);
  assert.equal(r.providerCalls,0);
  assert.equal(r.moneyMovedCents,0);
});
test('PIS mock rejects unsupported currency and unsafe integer amounts',()=>{
  assert.throws(()=>prepareFabrickMockPis({...pis,currency:'USD'}),/UNSUPPORTED_MOCK_CURRENCY/);
  assert.throws(()=>prepareFabrickMockPis({...pis,amountCents:Number.MAX_SAFE_INTEGER+1}),/INVALID_MOCK_PIS_AMOUNT/);
});
