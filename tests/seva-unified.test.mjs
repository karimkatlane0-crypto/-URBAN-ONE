import test from 'node:test';
import assert from 'node:assert/strict';
import {unifiedReadiness,SEVA_UNIFIED_MODULES} from '../packages/enterprise/seva-unified.mjs';
test('SEVA unification defaults to OpenAI and no live execution',()=>{
 const result=unifiedReadiness();
 assert.equal(result.primaryAI,'openai');
 assert.equal(result.live,false);
 assert.equal(result.mergeAuthorized,false);
 assert.equal(result.stripeLiveAuthorized,false);
 assert.equal(result.modules.length,3);
 assert.ok(result.modules.every(m=>m.state==='NOT_VERIFIED'));
});
test('client-supplied evidence cannot enable LIVE or authorize payments',()=>{
 const evidence=Object.fromEntries(SEVA_UNIFIED_MODULES.map(m=>[m.id,Object.fromEntries(m.requires.map(k=>[k,true]))]));
 const result=unifiedReadiness(evidence);
 assert.ok(result.modules.every(m=>m.state==='EVIDENCE_REVIEW_REQUIRED'));
 assert.equal(result.live,false);
 assert.equal(result.deploymentAuthorized,false);
});
test('partial evidence remains blocked and no provider call is made',()=>{
 const result=unifiedReadiness({seva_agents:{consent:true}});
 assert.ok(result.modules[0].missing.includes('authenticated_identity'));
 assert.equal(result.mode,'FAIL_CLOSED');
});
