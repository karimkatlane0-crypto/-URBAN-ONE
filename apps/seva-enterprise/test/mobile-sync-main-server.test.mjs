import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer as createSocket} from 'node:net';
import {once} from 'node:events';
import {mkdtemp,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createStore} from '../core.mjs';
import {verifyMobileAudit} from '../mobile-sync-api.mjs';
import {MobileClient} from '../mobile-crm/client.mjs';

const run=promisify(execFile),password='Synthetic-Only-Password-2026';
const entry=new URL('../server.mjs',import.meta.url).pathname;
const installer=new URL('../mobile-sync-install.mjs',import.meta.url).pathname;
async function portNumber(){const s=createSocket();s.listen(0,'127.0.0.1');await once(s,'listening');
  const port=s.address().port;await new Promise(resolve=>s.close(resolve));return port;}
async function launch(database,{key=randomBytes(32).toString('base64'),enabled='true',port}={}){
  port??=await portNumber();const origin='http://127.0.0.1:'+port;
  const child=spawn(process.execPath,['--experimental-sqlite',entry],{
    env:{NODE_ENV:'test',PORT:String(port),SEVA_DB_PATH:database,SEVA_PUBLIC_URL:origin,
      SEVA_MOBILE_SYNC_ENABLED:enabled,SEVA_MOBILE_SIGNING_KEY_BASE64:key,
      SEVA_MOBILE_ALLOW_LOOPBACK_HTTP:'true',SEVA_SALES_ENABLED:'false',SEVA_ANNUAL_SALES_ENABLED:'false'},
    stdio:['ignore','ignore','pipe']});
  let diagnostic='';child.stderr.on('data',value=>{diagnostic=(diagnostic+value).slice(-3000);});
  const stop=async()=>{if(child.exitCode!==null||child.signalCode!==null)return;
    const ended=once(child,'exit');child.kill('SIGTERM');
    const kill=setTimeout(()=>child.kill('SIGKILL'),3000);try{await ended;}finally{clearTimeout(kill);}};
  for(let i=0;i<60;i++){
    if(child.exitCode!==null||child.signalCode!==null)throw Error('Server exited: '+diagnostic);
    try{const r=await fetch(origin+'/health',{signal:AbortSignal.timeout(300)});
      if(r.status===200)return {origin,port,key,stop,instance:(await r.json()).instanceId};}catch{}
    await new Promise(resolve=>setTimeout(resolve,70));
  }
  await stop();throw Error('Server did not become ready: '+diagnostic);
}
async function call(base,path,{cookie,method='GET',body,scope,headers={}}={}){
  const response=await fetch(base+path,{method,signal:AbortSignal.timeout(3000),headers:{Origin:base,
    ...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),
    ...(scope?{'X-SEVA-Mobile-Scope':scope}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
  const json=(response.headers.get('content-type')||'').includes('application/json');
  return {status:response.status,headers:response.headers,body:json?await response.json():await response.text(),
    cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
async function register(base,email){const r=await call(base,'/api/auth/register',{method:'POST',body:{email,password}});
  assert.equal(r.status,201);return r.body.user;}
async function login(base,email){const r=await call(base,'/api/auth/login',{method:'POST',body:{email,password}});
  assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly/);return r.cookie;}
async function provision(database,subject,tenant,role='owner',extra=[]){
  const {stdout}=await run(process.execPath,['--experimental-sqlite',installer,'--database',database,
    '--subject',subject,'--tenant',tenant,'--role',role,'--source','operator-input',
    '--rights-ref','synthetic-owned-fixture','--authorization-ref','synthetic-membership-fixture',...extra],
    {env:{NODE_ENV:'test'},timeout:5000});return JSON.parse(stdout);
}
const client=(origin,cookie)=>new MobileClient({origin,fetchImpl:(url,init)=>fetch(url,
  {...init,headers:{...init.headers,Origin:origin,Cookie:cookie}})});
const scalar=(database,query)=>{const db=new DatabaseSync(database,{readOnly:true});
  try{return db.prepare(query).get();}finally{db.close();}};

test('main server: disabled or unconfigured mobile routes fail clearly without installing mobile tables',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'seva-mobile-gate-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  for(const [label,config,reason] of [['disabled',{enabled:'false'},'disabled'],
    ['missing-key',{key:''},'dedicated_signing_key_required']]){
    const database=join(dir,label+'.sqlite'),s=await launch(database,config);
    try{
      const status=await call(s.origin,'/api/public/status');assert.equal(status.status,200);
      assert.equal(status.body.mobileSync.ready,false);assert.equal(status.body.mobileSync.reason,reason);
      for(const path of ['/mobile-crm/','/api/v1/mobile/me']){
        const r=await call(s.origin,path);assert.equal(r.status,503);assert.equal(r.body.error,'mobile_not_ready');}
      assert.equal(scalar(database,"SELECT count(*) n FROM sqlite_master WHERE name LIKE 'mobile_%'").n,0);
      assert.equal((await call(s.origin,'/api/billing/checkout',{method:'POST',body:{}})).status,401);
    }finally{await s.stop();}
  }
});

test('main server: real login, scoped CRM sync, conflicts and session/data persistence across process restart',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'seva-mobile-main-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const database=join(dir,'seva.sqlite');let s=await launch(database);t.after(()=>s.stop());
  const a=await register(s.origin,'alpha@synthetic.invalid'),b=await register(s.origin,'bravo@synthetic.invalid'),
    viewer=await register(s.origin,'viewer@synthetic.invalid');
  const cookieA=await login(s.origin,'alpha@synthetic.invalid');
  assert.equal((await call(s.origin,'/api/v1/mobile/me')).status,401);
  assert.equal((await call(s.origin,'/api/v1/mobile/me',{cookie:cookieA})).body.error,'membership_required');
  assert.equal((await provision(database,a.id,'tenant-a')).status,'PROPOSED');
  assert.equal(scalar(database,'SELECT count(*) n FROM mobile_subjects').n,0);
  for(const [user,tenant,role] of [[a,'tenant-a','owner'],[b,'tenant-b','operator'],[viewer,'tenant-a','viewer']])
    assert.equal((await provision(database,user.id,tenant,role,['--apply'])).status,'APPLIED');
  const cookieB=await login(s.origin,'bravo@synthetic.invalid'),cookieV=await login(s.origin,'viewer@synthetic.invalid');
  const ca=client(s.origin,cookieA),cb=client(s.origin,cookieB);await ca.connect();await cb.connect();
  assert.equal(ca.identity.subject,a.id);assert.equal(cb.snapshot().records.length,0);
  const info=await call(s.origin,'/api/public/status');assert.equal(info.body.mobileSync.mount,'main-server');
  assert.equal(info.body.mobileSync.ready,true);assert.ok(!JSON.stringify(info.body).includes(s.key));
  const ui=await call(s.origin,'/mobile-crm/');assert.equal(ui.status,200);assert.match(ui.body,/CRM & Operations/);
  assert.match(ui.headers.get('content-security-policy'),/connect-src 'self'/);
  assert.equal((await call(s.origin,'/mobile-crm/client.mjs')).status,200);
  const original={kind:'crm',recordId:'shared-record-id',sourceId:'operator-input',payload:{displayName:'Alpha synthetic fixture'}};
  const first=ca.queue(original);await ca.synchronize();assert.equal(ca.outbox.length,0);
  assert.equal(ca.snapshot().records[0].version,1);
  const replay=await call(s.origin,'/api/v1/mobile/sync',{cookie:cookieA,method:'POST',scope:ca.identity.scopeToken,
    body:{sourceId:'operator-input',mutations:[first]}});assert.equal(replay.body.results[0].duplicate,true);
  ca.queue({...original,payload:{displayName:'Stale local draft'}});
  const otherA=client(s.origin,cookieA);await otherA.connect();otherA.queue({...original,payload:{displayName:'Newer saved record'}});await otherA.synchronize();
  await ca.synchronize();assert.equal(ca.outbox[0].status,'conflict');
  assert.equal(ca.snapshot().records[0].payload.displayName,'Newer saved record');
  await cb.connect();assert.equal(cb.snapshot().records.length,0);
  assert.equal((await call(s.origin,'/api/v1/mobile/sync?cursor='+encodeURIComponent(ca.cursor),{cookie:cookieB})).status,403);
  assert.equal((await call(s.origin,'/api/v1/mobile/sync',{cookie:cookieB,method:'POST',scope:ca.identity.scopeToken,
    body:{sourceId:'operator-input',mutations:[first]}})).body.error,'scope_binding_changed');
  assert.equal((await call(s.origin,'/api/v1/mobile/me',{cookie:cookieB,headers:{'x-tenant-id':'tenant-a'}})).status,403);
  cb.queue({...original,payload:{displayName:'Bravo isolated record'}});await cb.synchronize();
  assert.equal(cb.snapshot().records[0].payload.displayName,'Bravo isolated record');
  const cv=client(s.origin,cookieV);await cv.connect();assert.equal(cv.snapshot().records[0].payload.displayName,'Newer saved record');
  assert.equal((await call(s.origin,'/api/v1/mobile/sync',{cookie:cookieV,method:'POST',scope:cv.identity.scopeToken,
    body:{sourceId:'operator-input',mutations:[first]}})).status,403);
  assert.equal((await call(s.origin,'/api/v1/mobile/sync',{cookie:cookieA,method:'POST',scope:ca.identity.scopeToken,
    headers:{Origin:'https://other.invalid'},body:{sourceId:'operator-input',mutations:[first]}})).status,403);
  assert.equal((await call(s.origin,'/api/v1/mobile/sync',{cookie:cookieA,method:'POST',scope:ca.identity.scopeToken,
    body:{sourceId:'unapproved',mutations:[{...first,operationId:'unapproved-source-test'}]}})).body.error,'source_not_authorized');
  const previous=s;await s.stop();s=await launch(database,{key:previous.key,port:previous.port});
  assert.notEqual(s.instance,previous.instance);await ca.connect();await cb.connect();
  assert.equal(ca.snapshot().records[0].version,2);assert.equal(ca.snapshot().records[0].payload.displayName,'Newer saved record');
  assert.equal(cb.snapshot().records[0].payload.displayName,'Bravo isolated record');
  const db=new DatabaseSync(database,{readOnly:true});try{
    assert.equal(db.prepare('SELECT count(*) n FROM mobile_records').get().n,2);
    assert.equal(JSON.parse(db.prepare('SELECT payload FROM mobile_records WHERE tenant=?').get('tenant-a').payload).displayName,'Newer saved record');
    assert.ok(verifyMobileAudit(db,Buffer.from(s.key,'base64'),'tenant-a').seq>0);
    assert.ok(verifyMobileAudit(db,Buffer.from(s.key,'base64'),'tenant-b').seq>0);
  }finally{db.close();}
  assert.equal((await call(s.origin,'/api/auth/logout',{method:'POST',cookie:cookieA,body:{}})).status,200);
  assert.equal((await call(s.origin,'/api/v1/mobile/me',{cookie:cookieA})).status,401);
});

test('operator installation is explicit, idempotent and refuses unknown accounts or conflicting grants',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'seva-mobile-provision-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const database=join(dir,'existing.sqlite'),store=createStore(database);
  const user=store.register('operator-fixture@synthetic.invalid',password);store.db.close();
  await assert.rejects(provision(join(dir,'missing.sqlite'),user.id,'tenant-a'),/existing_absolute_database_required/);
  await assert.rejects(access(join(dir,'missing.sqlite')));
  await assert.rejects(provision(database,'unknown-user','tenant-a','owner',['--apply']),/existing_seva_user_required/);
  assert.equal((await provision(database,user.id,'tenant-a')).configurationWritten,false);
  assert.equal(scalar(database,"SELECT count(*) n FROM sqlite_master WHERE name='mobile_subjects'").n,0);
  assert.equal((await provision(database,user.id,'tenant-a','owner',['--apply'])).status,'APPLIED');
  assert.equal((await provision(database,user.id,'tenant-a','owner',['--apply'])).status,'ALREADY_CONFIGURED');
  await assert.rejects(provision(database,user.id,'tenant-b','owner',['--apply']),/existing_membership_conflict/);
  const db=new DatabaseSync(database,{readOnly:true});try{
    assert.equal(db.prepare('SELECT tenant FROM mobile_subjects WHERE subject=?').get(user.id).tenant,'tenant-a');
    assert.equal(db.prepare('SELECT count(*) n FROM mobile_sources WHERE tenant=?').get('tenant-b').n,0);
    assert.equal(db.prepare("SELECT count(*) n FROM audit WHERE action='mobile_access_provisioned'").get().n,1);
  }finally{db.close();}
  // An interrupted historical installation may have grants but an incomplete schema.
  const partial=new DatabaseSync(database);partial.exec('DROP TABLE mobile_changes');partial.close();
  const repaired=await provision(database,user.id,'tenant-a','owner',['--apply']);
  assert.equal(repaired.status,'APPLIED');assert.equal(repaired.configurationWritten,true);assert.equal(repaired.schemaChanged,true);
  assert.deepEqual(repaired.changes,{addMembership:false,addSource:false});
});
