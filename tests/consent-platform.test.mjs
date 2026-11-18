import test from 'node:test';
import assert from 'node:assert/strict';
import {ConsentLedger, ConsentError, OPTIONAL_PURPOSES} from '../packages/privacy/consent.mjs';

function ledger() { return new ConsentLedger(':memory:'); }
const base = {subjectId:'user-001', product:'seva', noticeVersion:'privacy-v1', occurredAt:'2026-11-18T00:00:00.000Z'};

test('new subjects start with every optional purpose OFF; essential is not a toggle', () => {
  const db=ledger();
  try {
    const state=db.get(base.subjectId,base.product);
    assert.equal(state.essential,true);
    for(const purpose of OPTIONAL_PURPOSES) assert.equal(state[purpose],false);
    assert.throws(()=>db.update({...base,choices:{essential:false}}), e=>e.code==='ESSENTIAL_IS_NOT_A_TOGGLE');
  } finally { db.close(); }
});

test('partial preferences update only the selected purpose and are product scoped', () => {
  const db=ledger();
  try {
    const state=db.update({...base,choices:{analytics:true,personal:true}});
    assert.equal(state.analytics,true); assert.equal(state.personal,true);
    assert.equal(state.email,false); assert.equal(state.mobile,false); assert.equal(state.partners,false);
    assert.equal(db.get(base.subjectId,'urban-one').analytics,false);
  } finally { db.close(); }
});

test('refusal and withdrawal are recorded as new revisions', () => {
  const db=ledger();
  try {
    db.update({...base,choices:{analytics:true,email:true,partners:true}});
    const state=db.withdraw({...base,purposes:['analytics','partners']});
    assert.equal(state.analytics,false); assert.equal(state.partners,false);
    assert.equal(state.email,true); assert.equal(state.revision,2);
    assert.equal(db.isAllowed({...base,purpose:'email'}),true);
    assert.equal(db.isAllowed({...base,purpose:'analytics'}),false);
    assert.throws(()=>db.assertAllowed({...base,purpose:'analytics'}),e=>e.code==='CONSENT_REQUIRED');
  } finally { db.close(); }
});

test('unknown purposes, non-boolean values and invalid products fail closed', () => {
  const db=ledger();
  try {
    assert.throws(()=>db.update({...base,choices:{tracking:true}}),e=>e.code==='UNKNOWN_PURPOSE');
    assert.throws(()=>db.update({...base,choices:{analytics:'yes'}}),e=>e.code==='PREFERENCE_MUST_BE_BOOLEAN');
    assert.throws(()=>db.get(base.subjectId,'../seva'),e=>e.code==='INVALID_PRODUCT');
    assert.throws(()=>db.withdraw({...base,purposes:['email','email']}),e=>e.code==='INVALID_WITHDRAWAL_SCOPE');
  } finally { db.close(); }
});

test('audit records are append-only revisions linked by previous hash', () => {
  const db=ledger();
  try {
    db.update({...base,choices:{analytics:true}});
    db.update({...base,choices:{analytics:false}});
    const rows=db.audit(base.subjectId,base.product);
    assert.equal(rows.length,2);
    assert.equal(rows[0].previousHash,'GENESIS');
    assert.equal(rows[1].previousHash,rows[0].eventHash);
    assert.equal(db.verifyAudit(base.subjectId,base.product),true);
  } finally { db.close(); }
});

test('independent users cannot share consent state', () => {
  const db=ledger();
  try {
    db.update({...base,choices:{mobile:true}});
    assert.equal(db.get('user-002',base.product).mobile,false);
  } finally { db.close(); }
});

import {PRODUCT_IDS, PRODUCT_REGISTRY, requireRegisteredProduct} from '../packages/privacy/products.mjs';

test('four-product registry is explicit and rejects unregistered namespaces',()=>{
  assert.deepEqual(PRODUCT_IDS,['urban-one','seva','synapsy','kkubera']);
  assert.equal(PRODUCT_REGISTRY.seva.label,'SEVA');
  assert.throws(()=>requireRegisteredProduct('unknown-app'),e=>e.code==='UNREGISTERED_PRODUCT');
});

test('same account preferences remain isolated across all four products',()=>{
  const db=ledger();
  try{
    for(const product of PRODUCT_IDS) db.update({subjectId:'shared-account',product,noticeVersion:'v1',choices:{analytics:product==='seva',partners:product==='kkubera'}});
    assert.equal(db.get('shared-account','seva').analytics,true);
    assert.equal(db.get('shared-account','urban-one').analytics,false);
    assert.equal(db.get('shared-account','kkubera').partners,true);
    assert.equal(db.get('shared-account','synapsy').partners,false);
  }finally{db.close();}
});
