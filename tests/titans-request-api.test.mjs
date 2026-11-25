import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {TitansRequestStore,TitansRequestError} from '../packages/titans/request-ledger.mjs';
import {handleTitansApi,resolveTitansActor} from '../services/api/titans-http.mjs';

const aliceToken='alice-test-token-0123456789-abcdefghijkl';
const bobToken='bob-test-token-0123456789-abcdefghijklmno';
const malloryToken='mallory-test-token-0123456789-abcdefgh';
const hash=t=>createHash('sha256').update(t).digest('hex');
const env={
  TITANS_STAGING_ENABLED:'true',
  TITANS_STAGING_ACTORS_JSON:JSON.stringify([
    {id:'alice',tokenHash:hash(aliceToken),scopes:['titans:request:create','titans:request:read']},
    {id:'bob',tokenHash:hash(bobToken),scopes:['titans:request:respond','titans:request:read','titans:grant:revoke']},
    {id:'mallory',tokenHash:hash(malloryToken),scopes:['titans:request:read']}
  ])
};
const auth=t=>'Bearer '+t;
const store=()=>new TitansRequestStore(':memory:');
test('staging bearer authentication resolves server-owned identity and scopes only',()=>{
  const actor=resolveTitansActor(auth(aliceToken),env);
  assert.equal(actor.id,'alice');
  assert.deepEqual(actor.scopes,['titans:request:create','titans:request:read']);
  assert.throws(()=>resolveTitansActor(auth('unknown-token-012345678901234567890'),env),e=>e.code==='AUTH_REQUIRED');
  assert.throws(()=>resolveTitansActor('',env),e=>e.code==='AUTH_REQUIRED');
});
test('staging actor configuration rejects duplicate bearer token hashes',()=>{
  const duplicateEnv={...env,TITANS_STAGING_ACTORS_JSON:JSON.stringify([
    {id:'alice',tokenHash:hash(aliceToken),scopes:['titans:request:create']},
    {id:'bob',tokenHash:hash(aliceToken),scopes:['titans:request:respond']}
  ])};
  assert.throws(()=>resolveTitansActor(auth(aliceToken),duplicateEnv),error=>error.code==='STAGING_ACTORS_INVALID');
});
test('API creates an individual request and only the intended recipient sees the inbox',async()=>{
  const db=store();
  try{
    const created=await handleTitansApi({method:'POST',path:'/api/titans/requests',headers:{authorization:auth(aliceToken)},
      body:{recipientId:'bob',purpose:'data_sharing',scopes:['contacts:read','calendar:read'],note:'Specific project access'},
      env,storeOverride:db});
    assert.equal(created.status,201);
    assert.equal(created.body.state,'PENDING');
    assert.deepEqual(created.body.scopes,['calendar:read','contacts:read']);
    const inbox=await handleTitansApi({method:'GET',path:'/api/titans/requests/inbox',headers:{authorization:auth(bobToken)},env,storeOverride:db});
    assert.equal(inbox.status,200);
    assert.equal(inbox.body.requests.length,1);
    const hidden=await handleTitansApi({method:'GET',path:'/api/titans/requests/inbox',headers:{authorization:auth(malloryToken)},env,storeOverride:db});
    assert.equal(hidden.status,403);
  }finally{db.close();}
});
test('ACCEPT grants only requested purpose and scopes; replay is rejected',()=>{
  const db=store();
  try{
    const request=db.create({requesterId:'alice',recipientId:'bob',purpose:'data_sharing',scopes:['contacts:read','calendar:read']});
    const accepted=db.decide({requestId:request.requestId,actorId:'bob',decision:'accept'});
    assert.equal(accepted.state,'ACCEPTED');
    assert.equal(accepted.grant.active,true);
    assert.equal(accepted.grant.granteeId,'alice');
    assert.equal(accepted.grant.subjectId,'bob');
    assert.deepEqual(accepted.grant.scopes,['calendar:read','contacts:read']);
    assert.equal(accepted.grant.purpose,'data_sharing');
    assert.throws(()=>db.decide({requestId:request.requestId,actorId:'bob',decision:'accept'}),e=>e.code==='REQUEST_ALREADY_DECIDED');
    assert.equal(db.verifyAudit(request.requestId),true);
  }finally{db.close();}
});
test('DECLINE records decision and creates no grant',()=>{
  const db=store();
  try{
    const request=db.create({requesterId:'alice',recipientId:'bob',purpose:'partner_collaboration',scopes:['profile:read']});
    const declined=db.decide({requestId:request.requestId,actorId:'bob',decision:'decline'});
    assert.equal(declined.state,'DECLINED');
    assert.equal(declined.grant,null);
    assert.equal(db.verifyAudit(request.requestId),true);
  }finally{db.close();}
});
test('wrong recipient cannot decide or read another participant receipt',()=>{
  const db=store();
  try{
    const request=db.create({requesterId:'alice',recipientId:'bob',purpose:'analytics_access',scopes:['analytics:read']});
    assert.throws(()=>db.decide({requestId:request.requestId,actorId:'mallory',decision:'accept'}),e=>e.code==='REQUEST_NOT_FOUND');
    assert.throws(()=>db.receipt({requestId:request.requestId,actorId:'mallory'}),e=>e.code==='REQUEST_NOT_FOUND');
  }finally{db.close();}
});
test('expired requests become EXPIRED and cannot create a grant',()=>{
  const db=store();
  try{
    const now=Date.parse('2026-11-20T12:00:00.000Z');
    const request=db.create({requesterId:'alice',recipientId:'bob',purpose:'service_access',scopes:['profile:read'],
      expiresAt:new Date(now+60000).toISOString(),now});
    const expired=db.decide({requestId:request.requestId,actorId:'bob',decision:'accept',now:now+60001});
    assert.equal(expired.state,'EXPIRED');
    assert.equal(db.receipt({requestId:request.requestId,actorId:'alice'}).grant,null);
    assert.equal(db.verifyAudit(request.requestId),true);
  }finally{db.close();}
});
test('grant expires with its request and is no longer active in receipts',()=>{
  const db=store();
  try{
    const now=Date.parse('2026-11-20T12:00:00.000Z');
    const request=db.create({requesterId:'alice',recipientId:'bob',purpose:'data_sharing',scopes:['contacts:read'],expiresAt:new Date(now+60000).toISOString(),now});
    const accepted=db.decide({requestId:request.requestId,actorId:'bob',decision:'accept',now:now+1000});
    assert.equal(accepted.grant.active,true);
    const expired=db.receipt({requestId:request.requestId,actorId:'alice',now:now+61000});
    assert.equal(expired.grant.active,false);
    assert.equal(expired.grant.expiresAt,request.expiresAt);
  }finally{db.close();}
});
test('inbox transitions expired pending requests and writes an audit event',()=>{
  const db=store();
  try{
    const now=Date.parse('2026-11-20T12:00:00.000Z');
    const request=db.create({requesterId:'alice',recipientId:'bob',purpose:'data_sharing',scopes:['contacts:read'],expiresAt:new Date(now+60000).toISOString(),now});
    assert.deepEqual(db.inbox('bob',now+61000),[]);
    const receipt=db.receipt({requestId:request.requestId,actorId:'bob',now:now+61000});
    assert.equal(receipt.state,'EXPIRED');
    assert.equal(db.verifyAudit(request.requestId),true);
  }finally{db.close();}
});
test('only the recipient can revoke a grant; revoked grants cannot be revoked twice',()=>{
  const db=store();
  try{
    const request=db.create({requesterId:'alice',recipientId:'bob',purpose:'skill_installation',scopes:['skill:execute']});
    const accepted=db.decide({requestId:request.requestId,actorId:'bob',decision:'accept'});
    assert.throws(()=>db.revoke({grantId:accepted.grant.grantId,actorId:'alice'}),e=>e.code==='GRANT_NOT_FOUND');
    const revoked=db.revoke({grantId:accepted.grant.grantId,actorId:'bob'});
    assert.equal(revoked.revoked,true);
    assert.equal(db.receipt({requestId:request.requestId,actorId:'alice'}).grant.active,false);
    assert.throws(()=>db.revoke({grantId:accepted.grant.grantId,actorId:'bob'}),e=>e.code==='GRANT_ALREADY_REVOKED');
    assert.equal(db.verifyAudit(request.requestId),true);
  }finally{db.close();}
});
test('invalid wildcard, unknown purpose, duplicate scope and malformed expiry fail closed',()=>{
  const db=store();
  try{
    assert.throws(()=>db.create({requesterId:'alice',recipientId:'bob',purpose:'all_access',scopes:['*']}),e=>e.code==='INVALID_PURPOSE');
    assert.throws(()=>db.create({requesterId:'alice',recipientId:'bob',purpose:'data_sharing',scopes:['*']}),e=>e.code==='INVALID_SCOPE_SET');
    assert.throws(()=>db.create({requesterId:'alice',recipientId:'bob',purpose:'data_sharing',scopes:['contacts:read','contacts:read']}),e=>e.code==='INVALID_SCOPE_SET');
    assert.throws(()=>db.create({requesterId:'alice',recipientId:'bob',purpose:'data_sharing',scopes:['contacts:read'],expiresAt:'invalid'}),e=>e.code==='INVALID_EXPIRY');
  }finally{db.close();}
});
test('HTTP boundary ignores client-supplied actor identity and fails closed when staging is disabled',async()=>{
  const db=store();
  try{
    const response=await handleTitansApi({method:'POST',path:'/api/titans/requests',headers:{authorization:auth(aliceToken)},
      body:{actorId:'bob',recipientId:'bob',purpose:'data_sharing',scopes:['contacts:read']},env,storeOverride:db});
    assert.equal(response.status,201);
    assert.equal(response.body.requesterId,'alice');
    const disabled=await handleTitansApi({method:'GET',path:'/api/titans/requests/inbox',headers:{authorization:auth(bobToken)},
      env:{...env,TITANS_STAGING_ENABLED:'false'},storeOverride:db});
    assert.equal(disabled.status,503);
  }finally{db.close();}
});

test('authenticated HTTP decision, receipt and revocation routes bind actor to Bearer token',async()=>{
  const db=store();
  try{
    const created=await handleTitansApi({method:'POST',path:'/api/titans/requests',headers:{authorization:auth(aliceToken)},
      body:{recipientId:'bob',purpose:'data_sharing',scopes:['contacts:read']},env,storeOverride:db});
    assert.equal(created.status,201);
    const session=await handleTitansApi({method:'GET',path:'/api/titans/session',headers:{authorization:auth(bobToken)},env,storeOverride:db});
    assert.equal(session.status,200);assert.equal(session.body.actorId,'bob');
    const decided=await handleTitansApi({method:'POST',path:'/api/titans/requests/'+created.body.requestId+'/decision',
      headers:{authorization:auth(bobToken)},body:{decision:'accept',actorId:'alice'},env,storeOverride:db});
    assert.equal(decided.status,200);assert.equal(decided.body.decisionBy,'bob');
    const receipt=await handleTitansApi({method:'GET',path:'/api/titans/requests/'+created.body.requestId+'/receipt',
      headers:{authorization:auth(aliceToken)},env,storeOverride:db});
    assert.equal(receipt.status,200);assert.equal(receipt.body.grant.subjectId,'bob');
    const revoked=await handleTitansApi({method:'POST',path:'/api/titans/grants/'+receipt.body.grant.grantId+'/revoke',
      headers:{authorization:auth(bobToken)},body:{},env,storeOverride:db});
    assert.equal(revoked.status,200);assert.equal(revoked.body.revoked,true);
  }finally{db.close();}
});
