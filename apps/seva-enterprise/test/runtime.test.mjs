import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../core.mjs';
import {validateRuntime,sameOrigin,databaseReady} from '../runtime.mjs';

test('production refuses ephemeral defaults and invalid public origins',()=>{
 const valid={NODE_ENV:'production',SEVA_PUBLIC_URL:'https://seva.example',SEVA_DB_PATH:'/var/data/seva.sqlite'};
 assert.doesNotThrow(()=>validateRuntime(valid));
 for(const SEVA_DB_PATH of [undefined,':memory:','./data/seva.sqlite'])assert.throws(()=>validateRuntime({...valid,SEVA_DB_PATH}));
 for(const SEVA_PUBLIC_URL of [undefined,'http://seva.example','https://user:pass@seva.example','https://seva.example/path','https://seva.example/?q=x'])assert.throws(()=>validateRuntime({...valid,SEVA_PUBLIC_URL}));
 assert.doesNotThrow(()=>validateRuntime({NODE_ENV:'development'}));
});

test('CSRF pins complete public origin behind proxy and rejects spoofed Host',()=>{
 const env={SEVA_PUBLIC_URL:'https://seva.example'};
 const req=origin=>({headers:{origin,host:'internal:3000'},socket:{}});
 assert.equal(sameOrigin(req('https://seva.example'),env),true);
 for(const origin of ['http://seva.example','https://seva.example:444','https://attacker.example','null','not a url','https://seva.example/path'])assert.equal(sameOrigin(req(origin),env),false);
 const forged=req('https://attacker.example');forged.headers.host='attacker.example';assert.equal(sameOrigin(forged,env),false);
 const cross=req('https://seva.example');cross.headers['sec-fetch-site']='cross-site';assert.equal(sameOrigin(cross,env),false);
});

test('local requests validate scheme and do not trust forwarded protocol',()=>{
 const req={headers:{origin:'http://localhost:3000',host:'localhost:3000','x-forwarded-proto':'https'},socket:{}};
 assert.equal(sameOrigin(req,{}),true);
 req.headers.origin='https://localhost:3000';assert.equal(sameOrigin(req,{}),false);
 delete req.headers.origin;assert.equal(sameOrigin(req,{}),true);
});

test('database readiness fails closed when database has closed',()=>{
 const s=createStore();assert.equal(databaseReady(s.db),true);s.db.close();assert.equal(databaseReady(s.db),false);
});

test('restart preserves login, owner isolation, goals and DBRELAY cursor',()=>{
 const dir=mkdtempSync(join(tmpdir(),'seva-restart-'));
 let s;
 try {
  const file=join(dir,'seva.sqlite');s=createStore(file);
  const a=s.register('restart-a@example.com','SecurePassword123!'),b=s.register('restart-b@example.com','SecurePassword123!');
  s.saveGoal(a.id,{title:'Persisted goal',evidence:'Synthetic acceptance evidence',status:'done'});
  const cursor=s.db.prepare('SELECT MAX(seq) AS n FROM dbrelay_changes').get().n;
  s.db.close();s=createStore(file);
  assert.equal(s.login('restart-a@example.com','SecurePassword123!').id,a.id);
  assert.equal(s.listGoals(a.id)[0].evidence,'Synthetic acceptance evidence');
  assert.equal(s.listGoals(b.id).length,0);
  assert.equal(s.db.prepare('SELECT MAX(seq) AS n FROM dbrelay_changes').get().n,cursor);
  assert.equal(databaseReady(s.db),true);
 } finally {s?.db.close();rmSync(dir,{recursive:true,force:true});}
});
