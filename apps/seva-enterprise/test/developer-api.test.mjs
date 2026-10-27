import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../core.mjs';
import {createDeveloperApi} from '../developer-api.mjs';

function fixture() {
 const store=createStore(':memory:');
 const a=store.register('alice@example.test','StrongSyntheticPassword!1122');
 const b=store.register('bob@example.test','StrongSyntheticPassword!3344');
 let now=1793100000, calls=0;
 const api=createDeveloperApi(store,async (user,prompt)=>{calls++;return {text:'Processed: '+prompt,provider:'synthetic-test-only',userId:user.id};},()=>now);
 const subscribe=user=>store.db.prepare("INSERT INTO plan_entitlements(user_id,plan,active,updated) VALUES(?,'enterprise_monthly',1,?)").run(user.id,now);
 return {store,a,b,api,subscribe,getCalls:()=>calls,move:s=>{now+=s}};
}

test('paid subscriber only; buyer plan or a Stripe success redirect grants nothing',()=>{
 const f=fixture();
 assert.throws(()=>f.api.issueKey(f.a.id),e=>e.status===402);
 f.store.db.prepare("INSERT INTO plan_entitlements(user_id,plan,active,updated) VALUES(?,'buyer_annual',1,?)").run(f.b.id,1793100000);
 assert.throws(()=>f.api.issueKey(f.b.id),e=>e.status===402);
 f.subscribe(f.a);
 const issued=f.api.issueKey(f.a.id,'integration test');
 assert.match(issued.key,/^seva_k_[a-f0-9]{64}$/);
 assert.equal(f.api.listKeys(f.a.id).length,1);
 assert.equal(f.api.listKeys(f.b.id).length,0);
 assert.ok(!JSON.stringify(f.api.listKeys(f.a.id)).includes(issued.key));
});

test('requires consent, validates prompts, enforces quota and per-account isolation',async()=>{
 const f=fixture();f.subscribe(f.a);f.subscribe(f.b);
 const issued=f.api.issueKey(f.a.id);
 await assert.rejects(()=>f.api.generate('Bearer '+issued.key,{prompt:'Hello'}),e=>e.status===400);
 await assert.rejects(()=>f.api.generate('Bearer '+issued.key,{prompt:'',consent:true}),e=>e.status===400);
 await assert.rejects(()=>f.api.generate('Bearer wrong',{prompt:'Hello',consent:true}),e=>e.status===401);
 for(let i=0;i<6;i++){
  const r=await f.api.generate('Bearer '+issued.key,{prompt:'Goal '+i,consent:true});
  assert.equal(r.userId,f.a.id);
 }
 assert.equal(f.getCalls(),6);
 await assert.rejects(()=>f.api.generate('Bearer '+issued.key,{prompt:'Over quota',consent:true}),e=>e.status===429);
 f.move(61);
 assert.equal((await f.api.generate('Bearer '+issued.key,{prompt:'New minute',consent:true})).userId,f.a.id);
 assert.deepEqual(f.api.revokeKey(f.b.id,issued.id),{revoked:false});
 assert.deepEqual(f.api.revokeKey(f.a.id,issued.id),{revoked:true});
 await assert.rejects(()=>f.api.generate('Bearer '+issued.key,{prompt:'Revoked',consent:true}),e=>e.status===401);
});

test('cancelled subscription denies previously issued API keys',async()=>{
 const f=fixture();f.subscribe(f.a);const key=f.api.issueKey(f.a.id);
 f.store.db.prepare("UPDATE plan_entitlements SET active=0 WHERE user_id=? AND plan='enterprise_monthly'").run(f.a.id);
 await assert.rejects(()=>f.api.generate('Bearer '+key.key,{prompt:'After cancel',consent:true}),e=>e.status===402);
});

test('keys expire, are hashed and never stored in plaintext',async()=>{
 const f=fixture();f.subscribe(f.a);const key=f.api.issueKey(f.a.id);
 const dbRow=f.store.db.prepare('SELECT key_hash FROM developer_api_keys WHERE id=?').get(key.id);
 assert.equal(dbRow.key_hash.length,64);
 assert.ok(dbRow.key_hash!==key.key);
 f.move(91*86400);
 await assert.rejects(()=>f.api.generate('Bearer '+key.key,{prompt:'Expired',consent:true}),e=>e.status===401);
});
