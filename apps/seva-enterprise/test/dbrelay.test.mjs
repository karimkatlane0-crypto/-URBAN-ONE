import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../core.mjs';
import {dbrelayChanges,dbrelaySnapshot,dbrelayStatus} from '../dbrelay.mjs';

const make=()=>{const s=createStore(':memory:');const a=s.register('relay-a@example.com','VerySecurePassword-123');const b=s.register('relay-b@example.com','VerySecurePassword-123');return {s,a,b};};
test('DBRELAY campaign updates and deletion produce isolated tombstones',()=>{
 const {s,a,b}=make();
 try{
  const id=s.saveCampaign(a.id,{months:1,marketingCents:0},{quorumTarget:2,deadlineIso:'2027-02-01T12:00:00Z'});
  s.db.prepare('UPDATE campaign_drafts SET status=? WHERE id=?').run('cancelled',id);
  s.db.prepare('DELETE FROM campaign_drafts WHERE id=?').run(id);
  const feed=dbrelayChanges(s,a.id,0,100);
  assert.deepEqual(feed.changes.map(x=>[x.resource,x.resourceId,x.action]),[
   ['campaign',id,'created'],['campaign',id,'updated'],['campaign',id,'deleted']]);
  assert.deepEqual(dbrelaySnapshot(s,a.id).campaigns,[]);
  assert.deepEqual(dbrelayChanges(s,b.id,0,100).changes,[]);
 }finally{s.db.close();}
});
test('DBRELAY cascaded subgoal deletion is complete and rolled-back writes never emit events',()=>{
 const {s,a}=make();
 try{
  const parent=s.saveGoal(a.id,{title:'Parent'});
  const child=s.saveGoal(a.id,{title:'Child',parent_id:parent});
  const grandchild=s.saveGoal(a.id,{title:'Grandchild',parent_id:child});
  const cursor=dbrelayStatus(s,a.id).cursor;
  s.db.exec('BEGIN');s.saveGoal(a.id,{title:'Rolled back'});s.db.exec('ROLLBACK');
  assert.equal(dbrelayStatus(s,a.id).cursor,cursor);
  s.deleteGoal(a.id,parent);
  const changes=dbrelayChanges(s,a.id,cursor,100).changes;
  assert.deepEqual(new Set(changes.map(x=>x.resourceId)),new Set([parent,child,grandchild]));
  assert.equal(changes.every(x=>x.action==='deleted'),true);
  assert.deepEqual(dbrelaySnapshot(s,a.id).goals,[]);
 }finally{s.db.close();}
});
test('DBRELAY initialized as same-origin with no external transfers',()=>{
 const {s,a}=make();const r=dbrelayStatus(s,a.id);
 assert.equal(r.database,'ready');assert.equal(r.persistent,false);
 assert.equal(r.externalDataTransfer,false);assert.equal(r.paymentsExecuted,false);
 s.db.close();
});
test('DBRELAY records insert update delete atomically',()=>{
 const {s,a}=make();const id=s.saveGoal(a.id,{title:'GOAL'});
 s.saveGoal(a.id,{title:'DONE',status:'done'},id);
 s.deleteGoal(a.id,id);
 const r=dbrelayChanges(s,a.id,0,50);
 assert.deepEqual(r.changes.map(x=>x.action),['created','updated','deleted']);
 assert.deepEqual(r.changes.map(x=>x.resource),['goal','goal','goal']);
 assert.equal(r.changes.every(x=>x.resourceId===id),true);
 s.db.close();
});
test('DBRELAY isolates user feeds and snapshots',()=>{
 const {s,a,b}=make();s.saveGoal(a.id,{title:'Private A'});
 s.saveGoal(b.id,{title:'Private B'});
 const aFeed=dbrelayChanges(s,a.id,0,30);
 const bFeed=dbrelayChanges(s,b.id,0,30);
 assert.equal(aFeed.changes.length,1);assert.equal(bFeed.changes.length,1);
 assert.notEqual(aFeed.changes[0].resourceId,bFeed.changes[0].resourceId);
 assert.deepEqual(dbrelaySnapshot(s,b.id).goals.map(x=>x.title),['Private B']);
 s.db.close();
});
test('DBRELAY cursor pagination avoids duplicate events',()=>{
 const {s,a}=make();for(let i=0;i<5;i++)s.saveGoal(a.id,{title:'item '+i});
 const first=dbrelayChanges(s,a.id,0,2),second=dbrelayChanges(s,a.id,first.nextCursor,2);
 const third=dbrelayChanges(s,a.id,second.nextCursor,2);
 assert.deepEqual([first.changes.length,second.changes.length,third.changes.length],[2,2,1]);
 assert.equal(first.hasMore,true);assert.equal(third.hasMore,false);
 assert.equal(new Set([...first.changes,...second.changes,...third.changes].map(x=>x.seq)).size,5);
 s.db.close();
});
test('DBRELAY rejects invalid cursors and limits',()=>{
 const {s,a}=make();
 for(const value of ['-1','1e5','nan','1000000000000000000000'])assert.throws(()=>dbrelayChanges(s,a.id,value,5));
 for(const value of ['0','101','2.1','-1'])assert.throws(()=>dbrelayChanges(s,a.id,0,value));
 s.db.close();
});
test('DBRELAY initial snapshot covers existing goals and consented drafts',()=>{
 const {s,a}=make();s.saveGoal(a.id,{title:'Prior stored'});
 s.saveCampaign(a.id,{months:1,marketingCents:0},{quorumTarget:2,deadlineIso:'2027-02-01T12:00:00Z',marketingConsentConfirmed:false});
 const r=dbrelaySnapshot(s,a.id);
 assert.equal(r.goals.length,1);assert.equal(r.campaigns.length,1);
 assert.equal(r.campaigns[0].status,'draft');
 assert.deepEqual(dbrelayChanges(s,a.id,0,10).changes.map(x=>x.resource),['goal','campaign']);
 s.db.close();
});
test('DBRELAY persists changes across SQLite close and reopen',()=>{
 const dir=mkdtempSync(join(tmpdir(),'seva-dbrelay-')),file=join(dir,'store.sqlite');
 try {
   const initial=createStore(file),u=initial.register('durable@example.com','VerySecurePassword-123');
   initial.saveGoal(u.id,{title:'persistent'});
   const first=dbrelayChanges(initial,u.id,0,30);initial.db.close();
   const resumed=createStore(file);
   assert.equal(dbrelayStatus(resumed,u.id).persistent,true);
   assert.equal(dbrelaySnapshot(resumed,u.id).goals[0].title,'persistent');
   assert.equal(dbrelayChanges(resumed,u.id,0,30).changes[0].seq,first.changes[0].seq);
   resumed.db.close();
 } finally {rmSync(dir,{recursive:true,force:true});}
});
test('DBRELAY does not emit events from rejected writes',()=>{
 const {s,a}=make();assert.throws(()=>s.saveGoal(a.id,{title:''}));
 assert.equal(dbrelayStatus(s,a.id).cursor,0);s.db.close();
});
test('DBRELAY events do not embed emails, descriptions or payment data',()=>{
 const {s,a}=make();s.saveGoal(a.id,{title:'Goal secret',description:'private text'});
 const json=JSON.stringify(dbrelayChanges(s,a.id,0,20));
 assert.equal(json.includes('private text'),false);
 assert.equal(json.includes('@example.com'),false);
 s.db.close();
});
test('DBRELAY validates authenticated owner before exposing state',()=>{
 const {s}=make();
 assert.throws(()=>dbrelaySnapshot(s,'not-a-user'));
 assert.throws(()=>dbrelayChanges(s,'not-a-user',0,20));s.db.close();
});
