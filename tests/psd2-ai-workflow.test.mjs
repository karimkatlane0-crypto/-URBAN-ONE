import test from 'node:test';
import assert from 'node:assert/strict';
import {planPsd2AiWorkflow} from '../packages/finance/psd2-ai-workflow.mjs';

const common={mode:'sandbox_mock',tenantId:'mock-business-1',
  consent:{state:'active',tenantId:'mock-business-1',scopes:['ais:read'],
    expiresAt:'2027-01-01T00:00:00Z'},
  now:'2026-10-24T12:00:00Z'};
const mockPayment={amountCents:2500,currency:'EUR',
  payerId:'mock-payer-1',beneficiaryId:'mock-host-1'};

test('PSD2 AI assistant defaults to disabled and rejects live mode',()=>{
  assert.throws(()=>planPsd2AiWorkflow(),/PSD2_AI_LIVE_NOT_ENABLED/);
  assert.throws(()=>planPsd2AiWorkflow({...common,mode:'live',intent:'ais_insights'}),/PSD2_AI_LIVE_NOT_ENABLED/);
  assert.throws(()=>planPsd2AiWorkflow({...common,mode:'sandbox',intent:'ais_insights'}),/PSD2_AI_LIVE_NOT_ENABLED/);
});
test('AIS AI analysis is mock-only and no model/provider is called',()=>{
  const x=planPsd2AiWorkflow({...common,intent:'ais_insights'});
  assert.equal(x.state,'synthetic_analysis_ready');
  assert.equal(x.source,'synthetic_fixture');
  assert.equal(x.summary.accountCount,1);
  assert.equal(x.summary.incomingCents,1500);
  assert.equal(x.decisionEngine,'deterministic_policy_only_no_llm');
  assert.equal(x.aiModelCalled,false);
  assert.equal(x.bankProviderCalled,false);
  assert.equal(x.moneyMoved,false);
  assert.equal(x.entitlementGranted,false);
});
test('AIS denies cross-tenant, expired, revoked or missing consents',()=>{
  assert.throws(()=>planPsd2AiWorkflow({...common,intent:'ais_insights',
    consent:{...common.consent,tenantId:'mock-other'}}),/TENANT_INVALID/);
  assert.throws(()=>planPsd2AiWorkflow({...common,intent:'ais_insights',
    consent:{...common.consent,state:'revoked'}}),/CONSENT_SCOPE/);
  assert.throws(()=>planPsd2AiWorkflow({...common,intent:'ais_insights',
    now:'2028-01-01T00:00:00Z'}),/EXPIRED/);
  assert.throws(()=>planPsd2AiWorkflow({...common,intent:'ais_insights',
    consent:undefined}),/CONSENT_SCOPE/);
});
test('PIS draft never authorizes payment even if a model claims approval',()=>{
  const x=planPsd2AiWorkflow({...common,intent:'pis_draft',
    payment:{...mockPayment,humanApproved:true,scaReceipt:'mock-forged'}});
  assert.equal(x.state,'draft_awaiting_human_review');
  assert.equal(x.humanApprovalRequired,true);
  assert.equal(x.bankSCARequired,true);
  assert.equal(x.bankExecutionAllowed,false);
  assert.equal(x.bankProviderCalled,false);
  assert.equal(x.moneyMoved,false);
  assert.equal(x.automaticallyPaid,false);
});
test('PIS rejects nonmock parties, same party, invalid amount/currency',()=>{
  for(const payment of [
    {...mockPayment,beneficiaryId:'not-a-mock-beneficiary-id'},
    {...mockPayment,payerId:'mock-host-1'},
    {...mockPayment,amountCents:0},
    {...mockPayment,amountCents:0.5},
    {...mockPayment,currency:'USD'},null
  ]){
    assert.throws(()=>planPsd2AiWorkflow({...common,intent:'pis_draft',payment}),
      /PSD2_AI_MOCK_PAYMENT_INVALID/);
  }
});
test('Stripe reconciliation is a plan, never an invented incoming payment',()=>{
  const x=planPsd2AiWorkflow({...common,intent:'stripe_receipts'});
  assert.equal(x.state,'provider_evidence_required');
  assert.equal(x.paymentVerified,false);
  assert.equal(x.reconciliationPerformed,false);
  assert.equal(x.stripeApiCalled,false);
  assert.equal(x.moneyMoved,false);
});
test('Policy rejects unexpected intents and tenant identifiers',()=>{
  assert.throws(()=>planPsd2AiWorkflow({...common,intent:'withdraw'}),/NOT_SUPPORTED/);
  assert.throws(()=>planPsd2AiWorkflow({...common,tenantId:'real-bank-123',intent:'stripe_receipts'}),/MOCK_TENANT_REQUIRED/);
});
