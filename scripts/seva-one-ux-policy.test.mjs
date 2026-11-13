import test from 'node:test';
import assert from 'node:assert/strict';
import {planAction,authorizeAction,importPreview} from './seva-one-ux-policy.mjs';
for(const action of ['purchase','message-send','booking-confirm','import-commit']) {
 test(action+' requires explicit scoped approval',()=>{
  const p=planAction({action,tenantId:'tenant-a',providerVerified:true,evidenceRef:'test-evidence',idempotencyKey:'key'});
  assert.equal(p.state,'awaiting-approval');
  assert.throws(()=>authorizeAction(p,{approved:true,tenantId:'tenant-b',action,actorId:'owner',approvalRef:'ok'}));
  assert.equal(authorizeAction(p,{approved:true,tenantId:'tenant-a',action,actorId:'owner',approvalRef:'ok'}).state,'approved');
 });
}
test('unverified provider cannot authorize purchase',()=>{
 const p=planAction({action:'purchase',tenantId:'t',idempotencyKey:'k',evidenceRef:'e'});
 assert.throws(()=>authorizeAction(p,{approved:true,tenantId:'t',action:'purchase',actorId:'owner',approvalRef:'a'}));
});
test('search can preview without payment approval',()=>assert.equal(planAction({action:'search',tenantId:'t'}).state,'preview'));
test('reversible import deduplicates and rejects conflicts',()=>{
 const p=importPreview([{id:'1',value:'A'}],[{id:'1',value:'A'},{id:'2',value:'B'},{id:'1',value:'X'}]);
 assert.deepEqual(p.skip,['1']);assert.equal(p.add.length,1);assert.deepEqual(p.conflict,['1']);assert.equal(p.canCommit,false);
});
test('invalid input rejected',()=>assert.throws(()=>planAction({action:'purchase',tenantId:''})));
