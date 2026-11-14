import test from 'node:test';
import assert from 'node:assert/strict';
import {mobileCrmRoute} from '../apps/seva-enterprise/mobile-crm-sovereign.mjs';
const base='/api/mobile-crm/v1';
const context={verifiedContext:true,tenantId:'tenant_A',
 principal:{id:'user_A',tenantId:'tenant_A',permissions:['plan:read','plan:create','audit:read']}};
const call=(method,path,body,ctx=context)=>mobileCrmRoute({method,path:base+path,body,context:ctx});
test('only four named mobile CRM endpoints exist and there is no public fallback',()=>{
 assert.equal(mobileCrmRoute({path:'/api/elsewhere'}),null);
 assert.equal(call('POST','/random').status,404);
});
test('status is authenticated and explicitly not connected',()=>{
 assert.equal(call('GET','/status').status,200);
 assert.equal(call('GET','/status').body.live,false);
 assert.equal(call('GET','/status',{},{}).status,401);
 assert.equal(call('GET','/status',{},{...context,verifiedContext:false}).status,401);
});
test('cross tenant and missing permissions fail closed',()=>{
 const foreign={...context,tenantId:'tenant_B'};
 assert.equal(call('GET','/status',{},foreign).status,403);
 assert.equal(call('POST','/sync/plan',{tenantId:'tenant_A',deviceType:'web',deviceId:'abc'},
 {...context,principal:{...context.principal,permissions:['plan:read']}}).status,403);
});
test('import preview requires provenance and consent and never imports records',()=>{
 const descriptor={tenantId:'tenant_A',sourceType:'csv',consentConfirmed:true,rightToUseConfirmed:true,recordCount:120};
 const result=call('POST','/imports/preview',descriptor);
 assert.equal(result.status,200);assert.equal(result.body.previewCount,120);
 assert.equal(result.body.acceptedRecords,0);assert.equal(result.body.persisted,false);
 assert.equal(result.body.audit.persistence,'NOT_CONFIGURED');
 for(const patch of [{consentConfirmed:false},{rightToUseConfirmed:false},{tenantId:'tenant_B'},
  {recordCount:10001},{sourceType:'global_private_messages'}])
  assert.equal(call('POST','/imports/preview',{...descriptor,...patch}).status,400);
});
test('sync is planning only with no data writes',()=>{
 const result=call('POST','/sync/plan',{tenantId:'tenant_A',deviceType:'android',deviceId:'device1'});
 assert.equal(result.status,200);assert.equal(result.body.writes,0);
 assert.equal(call('POST','/sync/plan',{tenantId:'tenant_B',deviceType:'ios',deviceId:'device1'}).status,400);
});
test('audit reads cannot invent durable records',()=>{
 const result=call('GET','/audit');assert.equal(result.status,503);assert.deepEqual(result.body.records,[]);
});
