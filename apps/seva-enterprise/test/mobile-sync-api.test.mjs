import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createMobileHandler,initMobileSchema,verifyMobileAudit} from '../mobile-sync-api.mjs';
const key=randomBytes(32),origin='https://seva.test';
const op=(extra={})=>({operationId:'op-1',recordId:'record-1',kind:'crm',operation:'upsert',baseVersion:0,payload:{displayName:'Synthetic contact'},...extra});
const batch=(operations=[op()],extra={})=>({sourceId:'owned-fixture',mutations:operations,...extra});
async function fixture(t,options={}) {
  const db=new DatabaseSync(options.path||':memory:');initMobileSchema(db);
  for(const [subject,tenant,role] of [['alice','tenant-a','owner'],['bob','tenant-b','owner'],['reader','tenant-a','viewer']])
    db.prepare('INSERT OR REPLACE INTO mobile_subjects VALUES(?,?,?,1)').run(subject,tenant,role);
  for(const tenant of ['tenant-a','tenant-b'])db.prepare('INSERT OR REPLACE INTO mobile_sources VALUES(?,?,?,1)').run(tenant,'owned-fixture','synthetic-test-only');
  const handler=createMobileHandler({db,authenticate:async req=>req.headers.authorization?{id:req.headers.authorization.replace('Bearer ','')}:null,
    enabled:true,signingKey:key,allowedOrigin:origin,...options});
  const server=createServer(async(req,res)=>{if(!await handler(req,res)){res.writeHead(404);res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(async()=>{await new Promise(r=>server.close(r));db.close();});
  const call=async(path='/sync',method='GET',data,actor='alice',extra={})=>{
    const headers={origin,'content-type':'application/json',...(actor?{authorization:'Bearer '+actor}:{}),...extra};
    const res=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/mobile${path}`,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
    return {status:res.status,body:await res.json(),headers:res.headers};
  };
  return {db,call};
}
test('disabled API and missing signing key fail closed',async t=>{
  const a=await fixture(t,{enabled:false});assert.equal((await a.call('/me')).status,503);
  const b=await fixture(t,{signingKey:null});assert.equal((await b.call('/me')).status,503);
});
test('unauthenticated and unprovisioned subjects are rejected',async t=>{
  const {call}=await fixture(t);assert.equal((await call('/me','GET',undefined,null)).status,401);
  assert.equal((await call('/me','GET',undefined,'nobody')).status,403);
});
test('identity is derived from server membership; cache disabled',async t=>{
  const {call}=await fixture(t);const r=await call('/me');assert.equal(r.status,200);
  assert.equal(r.body.tenant,'tenant-a');assert.equal(r.body.role,'owner');assert.equal(r.headers.get('cache-control'),'no-store');
});
test('client tenant and role claims cannot override server scope',async t=>{
  const {call}=await fixture(t);
  assert.equal((await call('/sync?tenant=tenant-b')).status,403);
  assert.equal((await call('/me','GET',undefined,'alice',{'x-tenant-id':'tenant-b'})).status,403);
  assert.equal((await call('/sync','POST',batch(undefined,{tenantId:'tenant-b'}))).status,403);
});
test('viewer can read but cannot mutate',async t=>{
  const {call}=await fixture(t);assert.equal((await call('/sync','GET',undefined,'reader')).status,200);
  assert.equal((await call('/sync','POST',batch(),'reader')).status,403);
});
test('only server-authorized sources are importable',async t=>{
  const {call,db}=await fixture(t);assert.equal((await call('/sync','POST',batch(undefined,{sourceId:'global-mobile-phones'}))).status,403);
  db.exec("UPDATE mobile_sources SET enabled=0 WHERE tenant='tenant-a'");
  assert.equal((await call('/sync','POST',batch())).status,403);
  assert.equal(db.prepare('SELECT count(*) n FROM mobile_records').get().n,0);
});
test('cross-origin writes and missing origin rejected',async t=>{
  const {call}=await fixture(t);
  assert.equal((await call('/sync','POST',batch(),'alice',{origin:'https://untrusted.test'})).status,403);
  assert.equal((await call('/sync','POST',batch(),'alice',{origin:''})).status,403);
  assert.equal((await call('/me','GET',undefined,'alice',{'sec-fetch-site':'cross-site'})).status,403);
});
test('durable mutations are tenant isolated even with same record ID',async t=>{
  const {call}=await fixture(t);assert.equal((await call('/sync','POST',batch())).status,200);
  assert.equal((await call('/sync','GET',undefined,'bob')).body.changes.length,0);
  await call('/sync','POST',batch([op({payload:{displayName:'Tenant B fixture'}})]),'bob');
  assert.equal((await call('/sync')).body.changes[0].payload.displayName,'Synthetic contact');
  assert.equal((await call('/sync','GET',undefined,'bob')).body.changes[0].payload.displayName,'Tenant B fixture');
});
test('duplicate operation persists once and changed replay is rejected',async t=>{
  const {call,db}=await fixture(t);await call('/sync','POST',batch());
  const repeated=await call('/sync','POST',batch());assert.equal(repeated.body.results[0].duplicate,true);
  assert.equal(db.prepare('SELECT count(*) n FROM mobile_changes').get().n,1);
  assert.equal((await call('/sync','POST',batch([op({payload:{displayName:'Changed'}})]))).status,409);
});
test('optimistic conflicts do not overwrite accepted data',async t=>{
  const {call}=await fixture(t);await call('/sync','POST',batch());
  const r=await call('/sync','POST',batch([op({operationId:'op-2',payload:{displayName:'stale'}})]));
  assert.equal(r.body.results[0].status,'conflict');assert.equal(r.body.results[0].currentVersion,1);
  assert.equal((await call('/sync')).body.changes[0].payload.displayName,'Synthetic contact');
});
test('versioned update succeeds and old operations cannot resurrect tombstones',async t=>{
  const {call}=await fixture(t);await call('/sync','POST',batch());
  const update=await call('/sync','POST',batch([op({operationId:'op-2',baseVersion:1,payload:{displayName:'Updated'}})]));
  assert.equal(update.body.results[0].version,2);
  const del={operationId:'op-3',recordId:'record-1',kind:'crm',operation:'delete',baseVersion:2};
  await call('/sync','POST',batch([del]));
  const restore=await call('/sync','POST',batch([op({operationId:'op-4',baseVersion:3})]));
  assert.equal(restore.body.results[0].status,'conflict');
  assert.equal((await call('/sync')).body.changes.at(-1).deleted,true);
});
test('cursor signatures prevent modification and cross-tenant reuse',async t=>{
  const {call}=await fixture(t);await call('/sync','POST',batch());
  const cursor=(await call('/sync')).body.cursor;
  assert.equal((await call('/sync?cursor='+encodeURIComponent(cursor),'GET',undefined,'bob')).status,403);
  assert.equal((await call('/sync?cursor='+encodeURIComponent(cursor+'x'))).status,400);
  assert.equal((await call('/sync?cursor='+encodeURIComponent(cursor))).body.changes.length,0);
});
test('expired and duplicate cursors are rejected',async t=>{
  let time=100000;const {call}=await fixture(t,{now:()=>time});const cursor=(await call('/sync')).body.cursor;
  time+=86400001;assert.equal((await call('/sync?cursor='+encodeURIComponent(cursor))).status,410);
  assert.equal((await call('/sync?cursor=a&cursor=b')).status,400);
});
test('pagination returns every tenant change without duplicate delivery',async t=>{
  const {call}=await fixture(t);const mutations=Array.from({length:100},(_,i)=>op({operationId:'op-'+i,recordId:'record-'+i}));
  await call('/sync','POST',batch(mutations));await call('/sync','POST',batch([op({operationId:'last',recordId:'last'})]));
  const first=await call('/sync');assert.equal(first.body.changes.length,100);assert.equal(first.body.hasMore,true);
  const second=await call('/sync?cursor='+first.body.cursor);assert.equal(second.body.changes.length,1);assert.equal(second.body.hasMore,false);
});
test('schema rejects secrets, chats, nested objects and prototype keys',async t=>{
  const {call}=await fixture(t);
  for(const payload of [{password:'not-a-secret'},{apiKey:'x'},{chatHistory:'private'},{displayName:{nested:'x'}},JSON.parse('{"__proto__":{"admin":true}}')])
    assert.equal((await call('/sync','POST',batch([op({payload})]))).status,400);
  assert.equal((await call('/sync','POST',batch([op({kind:'chat'})]))).status,400);
});
test('batch bounds, duplicate operation IDs and oversized bodies rejected',async t=>{
  const {call}=await fixture(t);
  assert.equal((await call('/sync','POST',batch([]))).status,400);
  assert.equal((await call('/sync','POST',batch(Array.from({length:101},()=>op())))).status,400);
  assert.equal((await call('/sync','POST',batch([op(),op()]))).status,400);
  assert.equal((await call('/sync','POST',{x:'x'.repeat(70000)})).status,413);
});
test('audit failure rolls back business mutation and idempotency record',async t=>{
  const {call,db}=await fixture(t);
  db.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON mobile_audit BEGIN SELECT RAISE(ABORT,'synthetic database error'); END;");
  const r=await call('/sync','POST',batch());assert.equal(r.status,503);assert.equal(r.body.error,'mobile_storage_unavailable');
  for(const table of ['mobile_records','mobile_changes','mobile_operations'])assert.equal(db.prepare(`SELECT count(*) n FROM ${table}`).get().n,0);
});
test('audit append-only protection and HMAC tamper detection',async t=>{
  const {call,db}=await fixture(t);await call('/sync','POST',batch());
  assert.equal(verifyMobileAudit(db,key,'tenant-a').seq,1);
  assert.throws(()=>db.exec("DELETE FROM mobile_audit"),/audit_append_only/);
  db.exec("DROP TRIGGER mobile_audit_no_update; UPDATE mobile_audit SET event='{}'");
  assert.equal((await call('/sync')).status,503);
});
test('removed audit tail is detected against persisted head',async t=>{
  const {call,db}=await fixture(t);await call('/sync','POST',batch());
  db.exec('DROP TRIGGER mobile_audit_no_delete; DELETE FROM mobile_audit');
  assert.equal((await call('/sync')).status,503);
});
test('partner application requires consent, is idempotent and never creates charge',async t=>{
  const {call}=await fixture(t);const data={sourceId:'owned-fixture',operationId:'application-op',applicationId:'partner-1',organization:'Synthetic Partner',contactEmail:'fixture@example.test',consent:false};
  assert.equal((await call('/partners/applications','POST',data)).status,400);
  data.consent=true;const r=await call('/partners/applications','POST',data);
  assert.equal(r.status,202);assert.equal(r.body.state,'pending_review');assert.equal(r.body.chargeCreated,false);
  assert.equal(r.body.agreementAccepted,false);assert.equal((await call('/partners/applications','POST',data)).body.results[0].duplicate,true);
});
test('revoked membership denied; rate limiting recovers',async t=>{
  let time=100000;const {call,db}=await fixture(t,{rateLimit:2,now:()=>time});
  await call('/me');await call('/me');assert.equal((await call('/me')).status,429);
  time+=60001;assert.equal((await call('/me')).status,200);
  db.exec("UPDATE mobile_subjects SET active=0 WHERE subject='alice'");assert.equal((await call('/me')).status,403);
});
test('database reopen preserves data, idempotency and audit',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'seva-mobile-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const path=join(dir,'data.sqlite');
  // Independent subtest lifetimes ensure the first HTTP server/database are closed.
  await t.test('write',async t=>{const {call}=await fixture(t,{path});assert.equal((await call('/sync','POST',batch())).status,200);});
  await t.test('reopen',async t=>{const {call,db}=await fixture(t,{path});assert.equal((await call('/sync')).body.changes.length,1);
    assert.equal((await call('/sync','POST',batch())).body.results[0].duplicate,true);assert.ok(verifyMobileAudit(db,key,'tenant-a').seq>=2);});
});
