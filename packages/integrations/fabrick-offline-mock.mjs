// No Fabrick SDK, endpoint, OAuth, bank data or real payment may be used here.
// These deterministic samples are NOT proof of onboarding or PSD2 authorization.
export const FABRICK_OFFLINE_STATE='SANDBOX_MOCK_ONLY';

function offline(mode){
  if(mode!=='sandbox_mock')throw new Error('FABRICK_PROVIDER_NOT_ENABLED');
}
function mockRef(ref){
  return typeof ref==='string'&&/^mock-[a-zA-Z0-9_-]{1,64}$/.test(ref);
}
function tenant(value){
  if(!mockRef(value))throw new Error('MOCK_TENANT_ID_REQUIRED');
}
function consentCheck({tenantId,consent,now}){
  if(!consent||consent.state!=='active'||consent.tenantId!==tenantId||
      !Array.isArray(consent.scopes)||!consent.scopes.includes('ais:read')) {
    throw new Error('AIS_CONSENT_SCOPE_OR_TENANT_INVALID');
  }
  const expiry=Date.parse(consent.expiresAt??'');
  const observed=Date.parse(now??'');
  if(!Number.isFinite(expiry)||!Number.isFinite(observed)||expiry<=observed){
    throw new Error('AIS_CONSENT_EXPIRED_OR_TIME_INVALID');
  }
}
export function simulateFabrickAis({mode='disabled',tenantId,consent,now}={}){
  offline(mode);
  tenant(tenantId);
  consentCheck({tenantId,consent,now});
  return {
    provider:'fabrick',mode:'sandbox_mock',simulation:true,providerCalled:false,
    status:'MOCK_AIS_ONLY_NOT_BANK_DATA',consentReference:'mock-consent',
    accounts:[{id:'mock-account',currency:'EUR',balanceCents:12000,source:'synthetic_fixture'}],
    transactions:[{id:'mock-txn',amountCents:1500,currency:'EUR',source:'synthetic_fixture'}]
  };
}
export function simulateFabrickPis({mode='disabled',tenantId,amountCents,currency='EUR',
  beneficiaryId,payerId,humanApproved=false,scaMode='absent'}={}){
  offline(mode);
  tenant(tenantId);
  if(!mockRef(beneficiaryId)||!mockRef(payerId)||beneficiaryId===payerId)
    throw new Error('MOCK_PARTIES_REQUIRED');
  if(!Number.isSafeInteger(amountCents)||amountCents<1||amountCents>100000000||currency!=='EUR')
    throw new Error('INVALID_MOCK_PAYMENT_DETAILS');
  if(humanApproved!==true)throw new Error('HUMAN_APPROVAL_REQUIRED');
  if(scaMode!=='simulated')throw new Error('SCA_SIMULATION_REQUIRED');
  return {
    provider:'fabrick',mode:'sandbox_mock',simulation:true,providerCalled:false,
    state:'prepared_not_executed',moneyMoved:false,bankRedirect:false,
    tenantId,amountCents,currency,beneficiaryId,payerId
  };
}
