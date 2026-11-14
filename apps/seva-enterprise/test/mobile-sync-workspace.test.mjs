import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startFixture} from './helpers/mobile-workspace-fixture.mjs';
import {validateStay} from '../mobile-sync-stay.mjs';
const prefix='/api/v1/mobile';
const crm={kind:'crm',sourceId:'test-owned',payload:{displayName:'Synthetic operator fixture'}};
const stay={bookingReference:'TEST-1',unit:'TEST-UNIT',guestReference:'SYNTHETIC-ID',arrivalDate:'2026-12-10',departureDate:'2026-12-12',status:'planned'};
const fixture=async(t,options)=>{const f=await startFixture(options);t.after(()=>f.close());return f;};
const connected=async t=>{const f=await fixture(t),c=f.makeClient();await c.connect();return {...f,c};};
test('browser constructor has no network side effects; connection uses same-origin only',async t=>{
  const f=await fixture(t),c=f.makeClient();assert.equal(f.calls.length,0);await c.connect();
  assert.equal(c.snapshot().identity.tenant,'space-a');assert.equal(c.snapshot().identity.role,'owner');
  assert.ok(f.calls.every(x=>x.url.startsWith(f.origin+prefix)&&x.credentials==='same-origin'&&x.mode==='same-origin'&&x.redirect==='error'));
  assert.equal(c.snapshot().identity.scopeToken,undefined);
});
test('unauthenticated UI shell contains no customer records and API denies reads',async t=>{
  const f=await fixture(t);const r=await f.raw('/mobile-crm/',{actor:'nobody'});assert.equal(r.status,200);
  assert.match(r.body,/NON COLLEGATO/);assert.equal((await f.raw(prefix+'/me',{actor:'nobody'})).status,401);
  assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);
});
test('static assets are allowlisted and reject traversal and writes',async t=>{
  const f=await fixture(t);
  for(const p of ['core.mjs','unknown','..%2Fcore.mjs'])assert.equal((await f.raw('/mobile-crm/'+p)).status,404);
  assert.equal((await f.raw('/mobile-crm/',{method:'POST',data:{}})).status,405);
});
test('browser writes require a server-signed scope binding',async t=>{
  const f=await fixture(t),c=f.makeClient();await c.connect();const m=c.queue(crm);
  const data={sourceId:'test-owned',mutations:[m]};
  assert.equal((await f.raw(prefix+'/sync',{method:'POST',data})).body.error,'scope_binding_required');
  assert.equal((await f.raw(prefix+'/sync',{method:'POST',data,scope:'forged.signature'})).body.error,'scope_binding_invalid');
});
test('scope binding cannot be reused with a different account',async t=>{
  const f=await fixture(t),a=await f.raw(prefix+'/me');const c=f.makeClient();await c.connect();
  const r=await f.raw(prefix+'/sync',{method:'POST',actor:'bravo',scope:a.body.scopeToken,data:{sourceId:'test-owned',mutations:[c.queue(crm)]}});
  assert.equal(r.body.error,'scope_binding_changed');assert.equal(f.db.prepare('SELECT count(*) n FROM mobile_records').get().n,0);
});
test('binding expires and a fresh identity read renews it',async t=>{
  let now=1000000;const f=await fixture(t,{now:()=>now}),c=f.makeClient();await c.connect();const old=c.identity.scopeToken;
  now+=900001;assert.equal((await f.raw(prefix+'/sync',{scope:old})).body.error,'scope_binding_expired');
  await c.connect();assert.notEqual(c.identity.scopeToken,old);
});
test('CRM writes are explicit and replay-safe',async t=>{
  const {c,db}=await connected(t);c.queue(crm);assert.equal(db.prepare('SELECT count(*) n FROM mobile_records').get().n,0);
  await c.synchronize();assert.equal(c.outbox.length,0);assert.equal(c.snapshot().records[0].payload.displayName,crm.payload.displayName);
  assert.equal(db.prepare('SELECT count(*) n FROM mobile_changes').get().n,1);
});
test('network failure retains the exact pending operation',async t=>{
  const f=await fixture(t);let offline=false;
  const c=f.makeClient('alpha',async(url,init,real)=>{if(offline)throw TypeError('offline');return real();});
  await c.connect();const op=c.queue(crm);offline=true;await assert.rejects(c.synchronize());
  assert.equal(c.outbox[0].mutation.operationId,op.operationId);offline=false;await c.synchronize();assert.equal(c.outbox.length,0);
});
test('lost write response retries the same ID without duplicate changes',async t=>{
  const f=await fixture(t);let lose=true;const c=f.makeClient('alpha',async(url,init,real)=>{
    const r=await real();if(init.method==='POST'&&lose){lose=false;throw TypeError('lost response');}return r;});
  await c.connect();const op=c.queue(crm);await assert.rejects(c.synchronize());
  assert.equal(c.outbox[0].mutation.operationId,op.operationId);await c.synchronize();
  assert.equal(f.db.prepare('SELECT count(*) n FROM mobile_changes').get().n,1);
});
test('conflicts remain visible and never overwrite newer data',async t=>{
  const {c,makeClient}=await connected(t);const op=c.queue(crm);await c.synchronize();
  const other=makeClient();await other.connect();c.queue({...crm,recordId:op.recordId,payload:{displayName:'Old local draft'}});
  other.queue({...crm,recordId:op.recordId,payload:{displayName:'Newer server version'}});await other.synchronize();await c.synchronize();
  assert.equal(c.outbox[0].status,'conflict');assert.equal(c.records.get(op.recordId).payload.displayName,'Newer server version');
});
test('viewer cannot stage writes or partner applications',async t=>{
  const f=await fixture(t),c=f.makeClient('reader');await c.connect();assert.throws(()=>c.queue(crm),/write_forbidden/);
  await assert.rejects(c.applyPartner({}),/write_forbidden/);
});
test('account change clears records and pending private drafts',async t=>{
  const f=await fixture(t),c=f.makeClient();await c.connect();c.queue(crm);
  f.sessions.set(f.tokens.alpha,{id:'bravo'});await assert.rejects(c.connect(),/account_changed/);
  assert.equal(c.identity,null);assert.equal(c.outbox.length,0);assert.equal(c.records.size,0);
});
test('account change between preflight and write fails closed',async t=>{
  const f=await fixture(t);const c=f.makeClient('alpha',async(url,init,real)=>{if(init.method==='POST')f.sessions.set(f.tokens.alpha,{id:'bravo'});return real();});
  await c.connect();c.queue(crm);await assert.rejects(c.synchronize(),/scope_binding_changed/);
  assert.equal(c.identity,null);assert.equal(f.db.prepare('SELECT count(*) n FROM mobile_records').get().n,0);
});
test('source authorization remains enforced by server, not UI',async t=>{
  const {c,db}=await connected(t);c.queue({...crm,sourceId:'not-approved'});await assert.rejects(c.synchronize(),/source_not_authorized/);
  assert.equal(c.outbox.length,1);assert.equal(db.prepare('SELECT count(*) n FROM mobile_records').get().n,0);
});
test('foreign identity fields, unknown kinds and concurrent record drafts are rejected',async t=>{
  const {c}=await connected(t);assert.throws(()=>c.queue({...crm,payload:{tenantId:'other'}}),/invalid_fields/);
  assert.throws(()=>c.queue({...crm,kind:'private_messages'}),/invalid_kind/);
  const op=c.queue(crm);assert.throws(()=>c.queue({...crm,recordId:op.recordId}),/record_already_queued/);
});
test('encrypted queue roundtrip is scoped and does not export tokens',async t=>{
  const {c,makeClient}=await connected(t);c.queue(crm);const envelope=await c.exportQueue('test passphrase long enough');
  assert.ok(!JSON.stringify(envelope).includes(crm.payload.displayName));assert.ok(!JSON.stringify(envelope).includes(c.identity.scopeToken));
  const c2=makeClient();await c2.connect();await c2.importQueue(envelope,'test passphrase long enough');
  assert.deepEqual(c2.outbox,c.outbox);await c2.importQueue(envelope,'test passphrase long enough');assert.equal(c2.outbox.length,1);
});
test('encrypted queue rejects wrong phrase, tamper and another account',async t=>{
  const {c,makeClient}=await connected(t);c.queue(crm);const e=await c.exportQueue('test passphrase long enough');
  await assert.rejects(c.importQueue(e,'wrong passphrase long enough'),/decryption_failed/);
  await assert.rejects(c.importQueue({...e,ciphertext:(e.ciphertext[0]==='A'?'B':'A')+e.ciphertext.slice(1)},'test passphrase long enough'),/decryption_failed/);
  const b=makeClient('bravo');await b.connect();await assert.rejects(b.importQueue(e,'test passphrase long enough'),/archive_scope_mismatch/);
  assert.equal(b.outbox.length,0);
});
test('weak export phrases and unsupported routes are rejected',async t=>{
  const {c}=await connected(t);await assert.rejects(c.exportQueue('short'),/passphrase_min_12/);
  await assert.rejects(c.request('/payments'),/route_forbidden/);
});
test('partner application uses existing endpoint and creates no charge',async t=>{
  const {c,db}=await connected(t);const input={sourceId:'test-owned',operationId:'partner-test-op',applicationId:'partner-test-app',organization:'Synthetic Partner',contactEmail:'fixture@example.test',country:'IT',consent:true};
  const a=await c.applyPartner(input),b=await c.applyPartner(input);
  assert.equal(a.state,'pending_review');assert.equal(b.chargeCreated,false);assert.equal(b.agreementAccepted,false);
  assert.equal(db.prepare("SELECT count(*) n FROM mobile_records WHERE kind='partner'").get().n,1);
});
test('internal stay state machine supports planned, check-in, check-out with audit',async t=>{
  const {c,db}=await connected(t);const op=c.queue({kind:'stay',sourceId:'test-owned',payload:stay});await c.synchronize();
  for(const status of ['checked_in','checked_out']){c.queue({kind:'stay',sourceId:'test-owned',recordId:op.recordId,payload:{...stay,status}});await c.synchronize();}
  assert.equal(c.records.get(op.recordId).version,3);assert.equal(c.records.get(op.recordId).payload.status,'checked_out');
  assert.equal(db.prepare('SELECT count(*) n FROM mobile_changes').get().n,3);
});
test('stay dates, skipped transitions, reversal and history deletion are rejected',()=>{
  assert.throws(()=>validateStay(null,{...stay,status:'checked_in'}),/must_start_planned/);
  assert.throws(()=>validateStay(null,{...stay,arrivalDate:'2026-02-30'}),/dates_invalid/);
  assert.throws(()=>validateStay(stay,{...stay,status:'checked_out'}),/transition_forbidden/);
  assert.throws(()=>validateStay({...stay,status:'checked_out'},{...stay,status:'checked_in'}),/transition_forbidden/);
  assert.throws(()=>validateStay(stay,null,'delete'),/history_must_be_retained/);
});
test('cancelled stays are terminal; check-in locks operational details',()=>{
  assert.doesNotThrow(()=>validateStay(stay,{...stay,status:'cancelled'}));
  assert.throws(()=>validateStay({...stay,status:'cancelled'},stay),/transition_forbidden/);
  assert.throws(()=>validateStay(stay,{...stay,status:'checked_in',unit:'OTHER'}),/details_locked/);
});
test('invalid stay mutation rolls back the whole batch and leaves audit valid',async t=>{
  const f=await fixture(t),identity=(await f.raw(prefix+'/me')).body;
  const data={sourceId:'test-owned',mutations:[
    {operationId:'batch-crm',recordId:'batch-crm',kind:'crm',operation:'upsert',baseVersion:0,payload:crm.payload},
    {operationId:'batch-stay',recordId:'batch-stay',kind:'stay',operation:'upsert',baseVersion:0,payload:{...stay,status:'checked_out'}}]};
  assert.equal((await f.raw(prefix+'/sync',{method:'POST',data,scope:identity.scopeToken})).status,409);
  assert.equal(f.db.prepare('SELECT count(*) n FROM mobile_records').get().n,0);
  assert.equal((await f.raw(prefix+'/me')).status,200);
});
test('frontend does not render user HTML, persist browser secrets or call financial providers',()=>{
  const ui=readFileSync(new URL('../mobile-crm/interface.mjs',import.meta.url),'utf8');
  const cli=readFileSync(new URL('../mobile-crm/client.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(ui+cli,/innerHTML|outerHTML|localStorage|sessionStorage|indexedDB|api\.stripe|buy\.stripe|navigator\.sendBeacon/);
  assert.match(ui,/textContent/);assert.match(cli,/credentials:'same-origin'/);assert.match(cli,/redirect:'error'/);
});
