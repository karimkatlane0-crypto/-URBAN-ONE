/**
 * URBAN ONE — InfoCert signing simulation. This module does not import an SDK,
 * perform HTTP requests, issue signatures, store PII, or imply service approval.
 * Provider credentials, identities and real contracts MUST NOT be passed here.
 */
const SHA256=/^[a-f0-9]{64}$/i;
const EXPECTED_ROLES=['bnb_authorized_representative','urban_one_authorized_signer'];
export function prepareInfocertMockEnvelope({
  mode='disabled',documentSha256,signers=[],contractAcceptanceRecorded=false
}={}){
  if(mode!=='mock')throw new Error('INFOCERT_PROVIDER_DISABLED');
  if(!SHA256.test(documentSha256||''))throw new Error('SYNTHETIC_DOCUMENT_SHA256_REQUIRED');
  if(!contractAcceptanceRecorded)throw new Error('MOCK_CONTRACT_ACCEPTANCE_REQUIRED');
  if(!Array.isArray(signers)||signers.length!==2||
    new Set(signers.map(x=>x?.role)).size!==2||
    !EXPECTED_ROLES.every(role=>signers.some(x=>x?.role===role)))
    throw new Error('TWO_AUTHORIZED_SIGNER_ROLES_REQUIRED');
  return Object.freeze({
    provider:'infocert',environment:'MOCK_ONLY',state:'MOCK_PREPARED_NOT_SENT',
    documentSha256:documentSha256.toLowerCase(),
    signerRoles:Object.freeze([...EXPECTED_ROLES]),
    legalSignatureCreated:false,providerCalls:0,documentsDelivered:0,costsIncurredCents:0
  });
}
