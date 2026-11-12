/**
 * URBAN ONE — purely offline Fabrick AIS/PIS simulation.
 * No bank APIs, account data, payment initiation, SDK or network access.
 * Client-provided booleans are synthetic fixtures only, NOT production authorization.
 */
function requireMock(mode){if(mode!=='mock')throw new Error('FABRICK_PROVIDER_DISABLED');}
export function prepareFabrickMockAis({
  mode='disabled',syntheticAccountTag='',consentSimulated=false
}={}){
  requireMock(mode);
  if(!/^MOCK_[A-Z0-9_]{3,40}$/.test(syntheticAccountTag))
    throw new Error('SYNTHETIC_ACCOUNT_REQUIRED');
  if(!consentSimulated)throw new Error('MOCK_AIS_CONSENT_REQUIRED');
  return Object.freeze({
    provider:'fabrick',service:'AIS',environment:'MOCK_ONLY',
    state:'MOCK_CONSENT_PREPARED_NOT_CONNECTED',syntheticAccountTag,
    realBankDataRead:false,providerCalls:0
  });
}
export function prepareFabrickMockPis({
  mode='disabled',amountCents,currency='EUR',syntheticBeneficiaryTag='',
  payerConsentSimulated=false,humanApprovalSimulated=false,scaSimulated=false
}={}){
  requireMock(mode);
  if(!Number.isSafeInteger(amountCents)||amountCents<=0)
    throw new Error('INVALID_MOCK_PIS_AMOUNT');
  if(currency!=='EUR')throw new Error('UNSUPPORTED_MOCK_CURRENCY');
  if(!/^MOCK_[A-Z0-9_]{3,40}$/.test(syntheticBeneficiaryTag))
    throw new Error('SYNTHETIC_BENEFICIARY_REQUIRED');
  if(!payerConsentSimulated)throw new Error('MOCK_PAYER_CONSENT_REQUIRED');
  if(!humanApprovalSimulated)throw new Error('MOCK_HUMAN_APPROVAL_REQUIRED');
  if(!scaSimulated)throw new Error('MOCK_SCA_REQUIRED');
  return Object.freeze({
    provider:'fabrick',service:'PIS',environment:'MOCK_ONLY',
    state:'MOCK_PREPARED_NOT_EXECUTED',amountCents,currency,syntheticBeneficiaryTag,
    bankPaymentExecuted:false,providerCalls:0,moneyMovedCents:0
  });
}
