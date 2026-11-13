import test from 'node:test';
import assert from 'node:assert/strict';
import {assessTitansMlReadiness} from '../titans-ml-readiness.mjs';
test('fails closed with no evidence', () => {
 const result = assessTitansMlReadiness();
 assert.equal(result.readyForStagingReview,false);
 assert.equal(result.productionAuthorized,false);
 assert.equal(result.agentsExecuted,0);
 assert.equal(result.missing.length,10);
});
test('rejects malformed evidence', () => {
 assert.throws(()=>assessTitansMlReadiness(null),TypeError);
 assert.throws(()=>assessTitansMlReadiness([]),TypeError);
});
test('all evidence permits staging review only', () => {
 const keys = assessTitansMlReadiness().missing;
 const evidence = Object.fromEntries(keys.map(k=>[k,true]));
 const result=assessTitansMlReadiness(evidence);
 assert.equal(result.readyForStagingReview,true);
 assert.equal(result.productionAuthorized,false);
 assert.equal(result.liveEnabled,false);
});
test('truthy strings are not verified evidence', () => {
 assert.equal(assessTitansMlReadiness({audit_trail:'true'}).checks.find(x=>x.id==='audit_trail').verified,false);
});
