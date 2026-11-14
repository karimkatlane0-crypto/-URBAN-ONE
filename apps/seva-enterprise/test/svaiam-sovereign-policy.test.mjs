import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeSovereign,sovereignPlan,ragQueryPlan,auditDecision,liveActions} from '../svaiam-sovereign-policy.mjs';
const alice={id:'alice',tenantId:'tenant-a',permissions:['plan:create','plan:read','rag:query']};
const req={principal:alice,tenantId:'tenant-a',resourceTenantId:'tenant-a',verifiedContext:true,action:'plan:create'};
test('unauthenticated caller denied',()=>assert.equal(authorizeSovereign({...req,verifiedContext:false}).allowed,false));
test('cross-tenant impersonation denied',()=>assert.equal(authorizeSovereign({...req,tenantId:'tenant-b'}).reason,'tenant_boundary'));
test('cross-tenant resources denied',()=>assert.equal(authorizeSovereign({...req,resourceTenantId:'tenant-b'}).reason,'resource_tenant_boundary'));
test('missing permission denied',()=>assert.equal(authorizeSovereign({...req,principal:{...alice,permissions:[]}}).reason,'permission_missing'));
test('known authorized operation is planning only',()=>assert.equal(sovereignPlan(req).status,'PLANNED_ONLY'));
test('unknown operation denied',()=>assert.equal(authorizeSovereign({...req,action:'unknown'}).allowed,false));
for(const action of liveActions) test('live action denied: '+action,()=>assert.equal(authorizeSovereign({...req,action}).allowed,false));
test('audit record has hash, timestamp and no false persistence',()=>{
 const d=authorizeSovereign(req),a=auditDecision({...req,decision:d,correlationId:'case-123'});
 assert.match(a.digest,/^[a-f0-9]{64}$/);assert.equal(a.persistence,'NOT_CONFIGURED');assert.equal(a.signed,false);
 assert.equal(a.correlationId,'case-123');assert.equal(a.result,'ALLOW_PLAN');
});
test('RAG cross tenant denied before retrieval',()=>{const r=ragQueryPlan({principal:alice,tenantId:'tenant-a',documentTenantId:'tenant-b',query:'secret',verifiedContext:true});assert.equal(r.status,'DENIED');assert.equal(r.retrievedDocuments,0);});
test('RAG planning never invokes models',()=>{const r=ragQueryPlan({principal:alice,tenantId:'tenant-a',documentTenantId:'tenant-a',query:'test',verifiedContext:true});assert.equal(r.queryAccepted,true);assert.equal(r.modelInvoked,false);});
