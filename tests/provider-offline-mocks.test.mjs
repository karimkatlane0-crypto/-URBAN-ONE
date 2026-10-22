import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateFabrickAis,simulateFabrickPis} from '../packages/integrations/fabrick-offline-mock.mjs';
import {prepareInfocertMock,advanceInfocertMock} from '../packages/integrations/infocert-offline-mock.mjs';

const ais={mode:'sandbox_mock',tenantId:'mock-property-1',
  consent:{state:'active',tenantId:'mock-property-1',scopes:['ais:read'],
    expiresAt:'2027-01-01T00:00:00.000Z'},
  now:'2026-10-22T00:00:00.000Z'};
test('Fabrick denies disabled or unapproved live mode',()=>{
  assert.throws(()=>simulateFabrickAis(),/FABRICK_PROVIDER_NOT_ENABLED/);
  assert.throws(()=>simulateFabrickAis({...ais,mode:'live'}),/FABRICK_PROVIDER_NOT_ENABLED/);
});
test('Fabrick AIS mock is synthetic only',()=>{
  const result=simulateFabrickAis(ais);
  assert.equal(result.providerCalled,false);
  assert.equal(result.simulation,true);
  assert.equal(result.accounts[0].source,'synthetic_fixture');
  assert.equal(result.transactions[0].source,'synthetic_fixture');
});
test('Fabrick AIS denies tenant crossing, revocation and expired consent',()=>{
  assert.throws(()=>simulateFabrickAis({...ais,tenantId:'mock-other'}),/TENANT_INVALID/);
  assert.throws(()=>simulateFabrickAis({...ais,consent:{...ais.consent,state:'revoked'}}),/CONSENT_SCOPE/);
  assert.throws(()=>simulateFabrickAis({...ais,now:'2028-01-01T00:00:00Z'}),/EXPIRED/);
  assert.throws(()=>simulateFabrickAis({...ais,consent:{...ais.consent,scopes:['pis:write']}}),/CONSENT_SCOPE/);
});
const pis={mode:'sandbox_mock',tenantId:'mock-property-1',amountCents:3500,
  beneficiaryId:'mock-host-1',payerId:'mock-guest-1',humanApproved:true,scaMode:'simulated'};
test('Fabrick PIS blocks payment without approval, mock SCA, and real accounts',()=>{
  assert.throws(()=>simulateFabrickPis({...pis,humanApproved:false}),/HUMAN_APPROVAL_REQUIRED/);
  assert.throws(()=>simulateFabrickPis({...pis,scaMode:'absent'}),/SCA_SIMULATION_REQUIRED/);
  assert.throws(()=>simulateFabrickPis({...pis,beneficiaryId:'not-a-mock-reference'}),/MOCK_PARTIES_REQUIRED/);
  assert.throws(()=>simulateFabrickPis({...pis,amountCents:0}),/INVALID_MOCK_PAYMENT_DETAILS/);
});
test('Fabrick mock PIS never moves money',()=>{
  const result=simulateFabrickPis(pis);
  assert.equal(result.state,'prepared_not_executed');
  assert.equal(result.moneyMoved,false);
  assert.equal(result.providerCalled,false);
  assert.equal(result.bankRedirect,false);
});
const signing={mode:'sandbox_mock',tenantId:'mock-property-1',contractRef:'mock-contract-1',
  documentSha256:'a'.repeat(64),signerIds:['mock-signer-a','mock-signer-b']};
test('InfoCert blocks disabled, real and invalid signing requests',()=>{
  assert.throws(()=>prepareInfocertMock({}),/INFOCERT_PROVIDER_NOT_ENABLED/);
  assert.throws(()=>prepareInfocertMock({...signing,mode:'live'}),/INFOCERT_PROVIDER_NOT_ENABLED/);
  assert.throws(()=>prepareInfocertMock({...signing,signerIds:['mock-signer-a','mock-signer-a']}),/TWO_DISTINCT/);
  assert.throws(()=>prepareInfocertMock({...signing,documentSha256:'bad'}),/VALID_SHA256/);
});
test('InfoCert offline flow never yields a qualified legal signature',()=>{
  let flow=prepareInfocertMock(signing);
  assert.equal(flow.legalSignature,false);
  flow=advanceInfocertMock(flow,{mode:'sandbox_mock',event:'invite'});
  flow=advanceInfocertMock(flow,{mode:'sandbox_mock',event:'start'});
  flow=advanceInfocertMock(flow,{mode:'sandbox_mock',event:'mock_complete'});
  assert.equal(flow.state,'completed_mock');
  assert.equal(flow.signatureApplied,false);
  assert.equal(flow.legalSignature,false);
  assert.equal(flow.providerCalled,false);
  assert.throws(()=>advanceInfocertMock(flow,{mode:'sandbox_mock',event:'invite'}),/INVALID_MOCK_TRANSITION/);
});
