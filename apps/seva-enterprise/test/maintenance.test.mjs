import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {mkdtemp,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../core.mjs';
import {backupSeva,restoreSeva} from '../maintenance.mjs';
test('online backup and offline restore preserve SEVA goals Lastre and cursor',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'seva-backup-'));
 const live=join(dir,'live.sqlite'),backup=join(dir,'snap.sqlite'),restored=join(dir,'restored.sqlite');
 try{
  const s=createStore(live),u=s.register('backup@example.com','VerySecurePassword-123');
  s.saveGoal(u.id,{title:'preserved'});
  s.createIntent(u.id,{category:'buy',description:'Study lamp',budgetCents:1700,consent:true});
  const cursor=s.db.prepare('SELECT MAX(seq) AS n FROM dbrelay_changes').get().n;
  assert.equal((await backupSeva(live,backup)).verified,true);
  assert.equal((await restoreSeva(backup,restored)).existingDatabaseOverwritten,false);
  const recovered=createStore(restored);
  assert.equal(recovered.listGoals(u.id)[0].title,'preserved');
  assert.equal(recovered.listIntents(u.id)[0].description,'Study lamp');
  assert.equal(recovered.db.prepare('SELECT MAX(seq) AS n FROM dbrelay_changes').get().n,cursor);
  recovered.db.close();s.db.close();
  assert.equal((await stat(backup)).size>0,true);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('SEVA backup and restore refuse overwriting existing database files',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'seva-backup2-'));
 const live=join(dir,'live.sqlite'),backup=join(dir,'snap.sqlite');
 try{
  const s=createStore(live);s.register('bup2@example.com','VerySecurePassword-123');
  await backupSeva(live,backup);
  await assert.rejects(()=>backupSeva(live,backup));
  await assert.rejects(()=>restoreSeva(backup,live));
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM users').get().n,1);s.db.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('SEVA maintenance rejects memory databases and public directory destinations',async()=>{
 await assert.rejects(()=>backupSeva(':memory:','./snap.sqlite'));
 await assert.rejects(()=>restoreSeva('nonexistent.sqlite','./public/backup.sqlite'));
});
