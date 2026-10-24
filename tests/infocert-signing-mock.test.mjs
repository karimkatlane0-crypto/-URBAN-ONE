import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareInfocertMockEnvelope} from '../packages/integrations/infocert-signing-mock.mjs';
const mock={mode:'mock',documentSha256:'a'.repeat(64),contractAcceptanceRecorded:true,
  signers:[{role:'urban_one_authorized_signer'},{role:'bnb_authorized_representative'}]};
test('InfoCert defaults fail closed and refuses live mode',()=>{
  assert.throws(()=>prepareInfocertMockEnvelope(mock.mode==='mock'?{}:mock),/INFOCERT_PROVIDER_DISABLED/);
  assert.throws(()=>prepareInfocertMockEnvelope({...mock,mode:'live'}),/INFOCERT_PROVIDER_DISABLED/);
});
test('mock-only two-signer contract does not create a signature or external side effects',()=>{
  const r=prepareInfocertMockEnvelope(mock);
  assert.equal(r.state,'MOCK_PREPARED_NOT_SENT');
  assert.equal(r.legalSignatureCreated,false);
  assert.equal(r.providerCalls,0);
  assert.equal(r.documentsDelivered,0);
  assert.equal(r.costsIncurredCents,0);
  assert.equal(r.signerRoles.length,2);
});
test('invalid hash, missing acceptance and duplicate signer roles are blocked',()=>{
  assert.throws(()=>prepareInfocertMockEnvelope({...mock,documentSha256:'raw-pdf'}),/SYNTHETIC_DOCUMENT_SHA256_REQUIRED/);
  assert.throws(()=>prepareInfocertMockEnvelope({...mock,contractAcceptanceRecorded:false}),/MOCK_CONTRACT_ACCEPTANCE_REQUIRED/);
  assert.throws(()=>prepareInfocertMockEnvelope({...mock,signers:[mock.signers[0],mock.signers[0]]}),/TWO_AUTHORIZED_SIGNER_ROLES_REQUIRED/);
});
