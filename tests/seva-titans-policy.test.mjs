import test from 'node:test';
import assert from 'node:assert/strict';
import {TITANS_POLICY,assessTitansAction,summarizeProviderStates} from '../packages/titans/policy.mjs';

const connected={id:'google-a',status:'connected',scopes:['contacts.read','calendar.write']};
const valid={providerId:'google-a',scope:'contacts.read',expiresAt:'2099-01-01T00:00:00.000Z',authenticatedActor:true};
test('policy defaults deny and only allowlisted actions exist',()=>{
 assert.equal(TITANS_POLICY.denyByDefault,true);
 assert.equal(assessTitansAction({provider:connected,action:'EXECUTE'}).allowed,false);
 assert.equal(assessTitansAction({provider:connected,action:'READ',scope:'contacts.read'}).allowed,false);
});
test('local draft is allowed without a provider and has no external side effect',()=>{
 assert.deepEqual(assessTitansAction({action:'DRAFT'}),{allowed:true,reason:'LOCAL_DRAFT_ONLY',externalSideEffect:false});
 assert.deepEqual(assessTitansAction({provider:null,action:'DRAFT'}),{allowed:true,reason:'LOCAL_DRAFT_ONLY',externalSideEffect:false});
 assert.deepEqual(assessTitansAction({provider:{status:'not_connected'},action:'DRAFT'}),{allowed:true,reason:'LOCAL_DRAFT_ONLY',externalSideEffect:false});
 assert.equal(assessTitansAction({action:'UNKNOWN'}).reason,'ACTION_NOT_ALLOWLISTED');
});
test('provider-backed reads fail closed when provider is unresolved',()=>{
 assert.equal(assessTitansAction({action:'READ',scope:'contacts.read',grant:valid}).reason,'PROVIDER_UNRESOLVED');
});
test('read requires connected provider, authenticated actor, exact scope and unexpired grant',()=>{
 assert.equal(assessTitansAction({provider:connected,action:'READ',scope:'contacts.read',grant:valid,now:Date.parse('2026-11-18')}).allowed,true);
 assert.equal(assessTitansAction({provider:{...connected,status:'not_connected'},action:'READ',scope:'contacts.read',grant:valid}).reason,'PROVIDER_NOT_CONNECTED');
 assert.equal(assessTitansAction({provider:connected,action:'READ',scope:'contacts.write',grant:valid}).reason,'GRANT_SCOPE_MISMATCH');
 assert.equal(assessTitansAction({provider:connected,action:'READ',scope:'contacts.read',grant:{...valid,revoked:true}}).reason,'GRANT_MISSING_OR_REVOKED');
 assert.equal(assessTitansAction({provider:connected,action:'READ',scope:'contacts.read',grant:{...valid,authenticatedActor:false}}).reason,'ACTOR_NOT_AUTHENTICATED');
});
test('side effects require explicit action approval and consent evidence',()=>{
 const base={...valid,scope:'calendar.write'};
 assert.equal(assessTitansAction({provider:connected,action:'WRITE',scope:'calendar.write',grant:base}).reason,'EXPLICIT_ACTION_APPROVAL_REQUIRED');
 assert.equal(assessTitansAction({provider:connected,action:'SEND',scope:'calendar.write',grant:{...base,explicitActionApproval:true}}).reason,'CONSENT_EVIDENCE_REQUIRED');
 const ok=assessTitansAction({provider:connected,action:'WRITE',scope:'calendar.write',grant:{...base,explicitActionApproval:true,consentRecordId:'consent-123'}});
 assert.equal(ok.allowed,true);assert.equal(ok.externalSideEffect,true);
});
test('expired grants and provider scope gaps are denied',()=>{
 assert.equal(assessTitansAction({provider:connected,action:'READ',scope:'contacts.read',grant:{...valid,expiresAt:'2020-01-01T00:00:00Z'},now:Date.parse('2026-11-18')}).reason,'GRANT_EXPIRED_OR_INVALID');
 assert.equal(assessTitansAction({provider:{...connected,scopes:[]},action:'READ',scope:'contacts.read',grant:valid}).reason,'PROVIDER_SCOPE_NOT_GRANTED');
});
test('provider summaries do not upgrade non-connected integrations',()=>{
 const result=summarizeProviderStates([{id:'x',label:'X',status:'not_connected'},{id:'y',label:'Y',status:'connected'}]);
 assert.deepEqual(result.map(x=>x.usable),[false,true]);
});
