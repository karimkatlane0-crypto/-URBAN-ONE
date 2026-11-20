import test from 'node:test';
import assert from 'node:assert/strict';
import {createSkillDraft,TITANS_SKILL_TOOLS,TitansSkillError} from '../packages/titans/skill-manifest.mjs';

const base={id:'partner-insights-review',name:'Partner Insights Review',version:'0.1.0',
  description:'Analyze approved partner metrics and prepare a review-only summary for a human operator.',
  purpose:'analytics_access',ownerId:'partner-001',scopes:['analytics:read'],tools:['analyze.data','draft.create'],
  createdAt:'2026-11-20T14:00:00.000Z'};
test('skill creator produces a review-only, non-executable draft manifest',()=>{
  const manifest=createSkillDraft(base);
  assert.equal(manifest.status,'DRAFT');
  assert.equal(manifest.executionEnabled,false);
  assert.equal(manifest.publishable,false);
  assert.equal(manifest.signature,null);
  assert.equal(manifest.requiresHumanApproval,true);
  assert.equal(manifest.externalSideEffects,false);
  assert.deepEqual(manifest.tools,['analyze.data','draft.create']);
  assert.deepEqual(manifest.scopes,['analytics:read']);
});
test('skill creator rejects wildcard, unlisted tools, unknown scopes and duplicate permissions',()=>{
  assert.throws(()=>createSkillDraft({...base,tools:['*']}),e=>e.code==='INVALID_SKILL_TOOLS');
  assert.throws(()=>createSkillDraft({...base,tools:['payments.create']}),e=>e.code==='INVALID_SKILL_TOOLS');
  assert.throws(()=>createSkillDraft({...base,scopes:['*']}),e=>e.code==='INVALID_SKILL_SCOPES');
  assert.throws(()=>createSkillDraft({...base,scopes:['analytics:read','analytics:read']}),e=>e.code==='INVALID_SKILL_SCOPES');
});
test('skill creator validates identity, version, purpose and content',()=>{
  assert.throws(()=>createSkillDraft({...base,id:'../escape'}),e=>e.code==='INVALID_SKILL_ID');
  assert.throws(()=>createSkillDraft({...base,version:'latest'}),e=>e.code==='INVALID_SKILL_VERSION');
  assert.throws(()=>createSkillDraft({...base,purpose:'all_access'}),e=>e.code==='INVALID_SKILL_PURPOSE');
  assert.throws(()=>createSkillDraft({...base,description:''}),e=>e.code==='INVALID_SKILL_DESCRIPTION');
});
test('tool allowlist contains no send, payment, export, deploy, merge or delete action',()=>{
  for(const denied of ['send.email','send.sms','payments.create','contacts.export','deploy','merge','delete','execute.shell','provider.write'])
    assert.equal(TITANS_SKILL_TOOLS.includes(denied),false);
});
