import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {encryptedSnapshot,restoreEncryptedSnapshot} from '../mobile-sync-backup.mjs';
import {mobileSessionAuthenticator} from '../mobile-sync-session.mjs';

test('encrypted snapshot and restore preserve an explicitly selected SQLite database',t=>{
  const dir=mkdtempSync(join(tmpdir(),'seva-backup-test-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const db=new DatabaseSync(join(dir,'original.sqlite'));t.after(()=>db.close());
  db.exec("PRAGMA journal_mode=WAL; CREATE TABLE fixture(id TEXT,value TEXT); INSERT INTO fixture VALUES('record','SYNTHETIC_SECRET_SENTINEL')");
  const key=randomBytes(32),backup=join(dir,'backup.sealed'),restored=join(dir,'restored.sqlite');
  encryptedSnapshot(db,backup,key);assert.equal(readFileSync(backup).includes(Buffer.from('SYNTHETIC_SECRET_SENTINEL')),false);
  assert.equal(restoreEncryptedSnapshot(backup,restored,key).integrity,'ok');
  const copy=new DatabaseSync(restored);assert.equal(copy.prepare('SELECT value FROM fixture').get().value,'SYNTHETIC_SECRET_SENTINEL');copy.close();
  assert.throws(()=>restoreEncryptedSnapshot(backup,restored,key),/EEXIST/);
});
test('wrong key and tampered backup are rejected before destination creation',t=>{
  const dir=mkdtempSync(join(tmpdir(),'seva-backup-test-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec('CREATE TABLE fixture(id TEXT)');
  const key=randomBytes(32),backup=join(dir,'backup.sealed'),restore=join(dir,'restore.sqlite');
  encryptedSnapshot(db,backup,key);assert.throws(()=>restoreEncryptedSnapshot(backup,restore,randomBytes(32)));
  assert.equal(existsSync(restore),false);const bytes=readFileSync(backup);bytes[bytes.length-1]^=1;writeFileSync(backup,bytes);
  assert.throws(()=>restoreEncryptedSnapshot(backup,restore,key));assert.equal(existsSync(restore),false);
});
test('SEVA session adapter accepts exactly one well-formed cookie and invokes server lookup',async()=>{
  const token=randomBytes(32).toString('hex'),seen=[];
  const auth=mobileSessionAuthenticator({fromSession:value=>{seen.push(value);return value===token?{id:'server-user'}:null;}});
  assert.deepEqual(await auth({headers:{cookie:'seva_session='+token}}),{id:'server-user'});assert.deepEqual(seen,[token]);
  for(const cookie of ['', 'seva_session=%broken','seva_session=x','seva_session='+token+'; seva_session='+token])
    assert.equal(await auth({headers:{cookie}}),null);
  assert.equal(await auth({headers:{authorization:'Bearer '+token}}),null);
});
