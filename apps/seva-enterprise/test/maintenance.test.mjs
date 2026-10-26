import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createStore} from '../core.mjs';
import {backupSeva,restoreSeva} from '../maintenance.mjs';

test('G.4 backup/restore preserves two isolated tenants, session and DBRELAY cursor', async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seva-recovery-'));
 const live=join(dir,'live.sqlite'),snap=join(dir,'snap.sqlite'),restored=join(dir,'recovered.sqlite');
 let s,recovered;
 try{
  s=createStore(live);
  const a=s.register('blackbox-a@example.invalid','TestOnlyPasswordA-2026!');
  const b=s.register('blackbox-b@example.invalid','TestOnlyPasswordB-2026!');
  const token=s.newSession(a.id);
  s.saveGoal(a.id,{title:'Tenant A only',status:'doing',criteria:'Must stay private',evidence:'synthetic'});
  s.saveGoal(b.id,{title:'Tenant B only',status:'todo'});
  const cursor=s.db.prepare('SELECT MAX(seq) AS n FROM dbrelay_changes').get().n;
  assert.ok(cursor>0);
  const backup=await backupSeva(live,snap);
  assert.equal(backup.verified,true);
  assert.equal(backup.existingFileOverwritten,false);
  const restore=await restoreSeva(snap,restored);
  assert.equal(restore.verified,true);
  assert.equal(restore.existingDatabaseOverwritten,false);
  recovered=createStore(restored);
  assert.equal(recovered.fromSession(token).id,a.id);
  assert.deepEqual(recovered.listGoals(a.id).map(g=>g.title),['Tenant A only']);
  assert.deepEqual(recovered.listGoals(b.id).map(g=>g.title),['Tenant B only']);
  assert.equal(recovered.db.prepare('SELECT MAX(seq) AS n FROM dbrelay_changes').get().n,cursor);
  assert.ok((await stat(snap)).size>0);
 }finally{recovered?.db.close();s?.db.close();await rm(dir,{recursive:true,force:true});}
});
test('G.4 backup cannot overwrite prior evidence or the live database',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seva-noclobber-'));
 const live=join(dir,'live.sqlite'),snap=join(dir,'snap.sqlite');
 let s;
 try{
  s=createStore(live);s.register('backup-protected@example.invalid','TestOnlyProtectedPass-2026!');
  await backupSeva(live,snap);
  await assert.rejects(backupSeva(live,snap),{code:'EEXIST'});
  await assert.rejects(restoreSeva(snap,live),{code:'EEXIST'});
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM users').get().n,1);
 }finally{s?.db.close();await rm(dir,{recursive:true,force:true});}
});
test('G.4 rejects incomplete SQLite schema and in-memory input',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seva-corrupt-'));
 const bad=join(dir,'not-seva.sqlite');
 const db=new DatabaseSync(bad);
 try{
  db.exec('CREATE TABLE random_data (id TEXT)');
  await assert.rejects(backupSeva(bad,join(dir,'invalid-backup.sqlite')),/Missing SEVA table/);
  await assert.rejects(backupSeva(':memory:',join(dir,'mem.sqlite')),/real SQLite/);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});
