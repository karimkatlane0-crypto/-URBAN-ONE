import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeRegistry,validateRegistry,validateNode,STAGES} from './seva-enterprise-flow-registry.mjs';
const source=readFileSync(new URL('../docs/SEVA_ENTERPRISE_72_NODE_RECONCILIATION.md',import.meta.url),'utf8');
test('exactly 72 unique named checkpoints; 82 remain unidentified',()=>{
 const r=makeRegistry(source);assert.equal(r.nodes.length,72);assert.equal(r.unidentified,82);assert.equal(new Set(r.nodes.map(n=>n.id)).size,72);assert.ok(validateRegistry(r));
});
test('all seven stages in correct order',()=>assert.deepEqual(STAGES,['FRONTEND','API','BACKEND','DATABASE','EVENTO','FOLLOW-UP','AUDIT']));
test('no fabricated PASS',()=>assert.equal(makeRegistry(source).nodes.filter(n=>n.status==='PASS').length,0));
test('PASS without reproducible evidence is rejected',()=>{
 const n={...makeRegistry(source).nodes[0],status:'PASS'};
 assert.throws(()=>validateNode(n),/PASS missing/);
});
test('BLOCKED must name dependency',()=>{
 const n={...makeRegistry(source).nodes[0],status:'BLOCKED'};
 assert.throws(()=>validateNode(n),/BLOCKED missing dependency/);
});
test('invalid source inventory rejected',()=>assert.throws(()=>makeRegistry(source.replace('NODE-072','NODE-071')),/source inventory invalid/));
test('duplicate registry identifiers rejected',()=>{
 const r=makeRegistry(source);r.nodes[1].id=r.nodes[0].id;assert.throws(()=>validateRegistry(r),/Duplicate IDs/);
});
