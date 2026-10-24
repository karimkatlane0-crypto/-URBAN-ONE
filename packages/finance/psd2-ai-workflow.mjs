// PSD2 AI assistance is a non-executing, deterministic policy layer.
// Live bank data, LLM providers, Stripe payments and PIS execution are out of scope.
// Do not pass secrets, real bank account details, or personal data to this module.
import {simulateFabrickAis} from '../integrations/fabrick-offline-mock.mjs';

const MOCK_REF=/^mock-[a-zA-Z0-9_-]{1,64}$/;
const OBSERVATION_SOURCE='synthetic_fixture';

function assertMockTenant(tenantId){
  if(typeof tenantId!=='string'||!MOCK_REF.test(tenantId)){
    throw new Error('PSD2_AI_MOCK_TENANT_REQUIRED');
  }
}
function assertMockParty(value){
  return typeof value==='string'&&MOCK_REF.test(value);
}
function base(intent,tenantId){
  return {
    intent,tenantId,mode:'sandbox_mock',simulation:true,
    decisionEngine:'deterministic_policy_only_no_llm',
    aiModelCalled:false,bankProviderCalled:false,stripeApiCalled:false,
    moneyMoved:false,bankRedirect:false,bankConsentGranted:false,
    automaticallyPaid:false,productionAuthorized:false
  };
}

// This function *plans* governed AI work. It never calls a payment/bank/AI provider.
// Only synthetic fixtures may enter this interface; real consent and credentials
// belong in a separately authenticated, provider-certified backend.
export function planPsd2AiWorkflow({
  mode='disabled',intent,tenantId,consent,now,payment
}={}){
  if(mode!=='sandbox_mock')throw new Error('PSD2_AI_LIVE_NOT_ENABLED');
  assertMockTenant(tenantId);
  if(intent==='ais_insights'){
    // Delegates mock-scoped tenant, consent, purpose and expiry verification.
    const snapshot=simulateFabrickAis({mode,tenantId,consent,now});
    const incoming=snapshot.transactions
      .filter(item=>item.amountCents>0)
      .reduce((sum,item)=>sum+item.amountCents,0);
    const outgoing=snapshot.transactions
      .filter(item=>item.amountCents<0)
      .reduce((sum,item)=>sum+Math.abs(item.amountCents),0);
    return {
      ...base(intent,tenantId),state:'synthetic_analysis_ready',
      source:OBSERVATION_SOURCE,
      summary:{accountCount:snapshot.accounts.length,transactionCount:snapshot.transactions.length,
        incomingCents:incoming,outgoingCents:outgoing,currency:'EUR'},
      suggestedActions:[
        'review_synthetic_cashflow',
        'review_anomaly_rules',
        'request_real_ais_only_after_provider_onboarding_and_bank_consent'
      ],
      entitlementGranted:false
    };
  }
  if(intent==='pis_draft'){
    const p=payment;
    if(!p||!Number.isSafeInteger(p.amountCents)||p.amountCents<1||
      p.amountCents>100000000||p.currency!=='EUR'||
      !assertMockParty(p.beneficiaryId)||!assertMockParty(p.payerId)||
      p.beneficiaryId===p.payerId){
      throw new Error('PSD2_AI_MOCK_PAYMENT_INVALID');
    }
    // Ignore humanApproved, scaReceipt or permission flags supplied by any AI.
    // Bank/PISP execution requires a separate authenticated human/bank flow.
    return {
      ...base(intent,tenantId),state:'draft_awaiting_human_review',
      payment:{amountCents:p.amountCents,currency:'EUR',
        beneficiaryId:p.beneficiaryId,payerId:p.payerId},
      humanApprovalRequired:true,bankSCARequired:true,
      beneficiaryOnboardingRequired:true,bankExecutionAllowed:false,
      suggestedActions:[
        'verify_real_beneficiary_in_authorized_provider',
        'obtain_independent_human_approval',
        'complete_bank_or_provider_sca',
        'verify_final_provider_status_before_any_settlement_claim'
      ]
    };
  }
  if(intent==='stripe_receipts'){
    return {
      ...base(intent,tenantId),state:'provider_evidence_required',
      reconciliationPerformed:false,paymentVerified:false,
      suggestedActions:[
        'fetch_authoritative_stripe_checkout_payment_status',
        'validate_signed_stripe_webhook_and_idempotency',
        'reconcile_real_payment_to_accepted_customer_agreement',
        'grant_software_access_only_after_server_side_entitlement_verification'
      ],
      note:'This workflow does not retrieve or alter Stripe funds, subscriptions or payout accounts.'
    };
  }
  throw new Error('PSD2_AI_INTENT_NOT_SUPPORTED');
}
