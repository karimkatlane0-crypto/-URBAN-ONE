import test from 'node:test';
import assert from 'node:assert/strict';
import {createDBRelaySync} from '../public/dbrelay-sync.js';

test('failed snapshot retries from the last applied cursor without skipping changes',async()=>{
 let current=1,fail=false;const after=[];
 const sync=createDBRelaySync(async path=>{
  if(path.endsWith('/status'))return {cursor:current};
  if(path.endsWith('/snapshot')){if(fail)throw Error('Network interrupted');return {cursor:current,goals:[{title:'version '+current}]};}
  after.push(new URL(path,'https://example.test').searchParams.get('after'));
  return {changes:[{seq:current}],nextCursor:current,hasMore:false};
 });
 assert.equal((await sync.refresh()).cursor,1);
 current=2;fail=true;
 await assert.rejects(sync.refresh(),/Network interrupted/);
 fail=false;
 assert.equal((await sync.refresh()).snapshot.goals[0].title,'version 2');
 assert.deepEqual(after,['1','1']);
});

test('large backlogs require one snapshot rather than draining rate-limited pages',async()=>{
 let current=1,feeds=0,snapshots=0;
 const sync=createDBRelaySync(async path=>{
  if(path.endsWith('/status'))return {cursor:current};
  if(path.endsWith('/snapshot')){snapshots++;return {cursor:current,goals:[]};}
  feeds++;return {changes:Array(100).fill({seq:2}),nextCursor:101,hasMore:true};
 });
 await sync.refresh();current=9000;
 const result=await sync.refresh();
 assert.equal(result.cursor,9000);assert.equal(result.hasMore,true);
 assert.equal(feeds,1);assert.equal(snapshots,2);
});

test('cursor regression after recovery reloads the snapshot without polling past the new head',async()=>{
 let current=50;
 const sync=createDBRelaySync(async path=>{
  if(path.endsWith('/status'))return {cursor:current};
  assert.ok(path.endsWith('/snapshot'));
  return {cursor:current,goals:[{title:'recovered'}]};
 });
 await sync.refresh();current=5;
 assert.equal((await sync.refresh()).cursor,5);
});

test('logout invalidates in-flight private snapshots and resets the next account cursor',async()=>{
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 let first=true;
 const sync=createDBRelaySync(async path=>{
  if(path.endsWith('/status'))return {cursor:first?99:3};
  if(first){await gate;return {cursor:99,goals:[{title:'account A'}]};}
  return {cursor:3,goals:[{title:'account B'}]};
 });
 const old=sync.refresh();
 assert.equal(sync.refresh(),old);
 await new Promise(resolve=>setImmediate(resolve));
 sync.reset();first=false;
 assert.equal((await sync.refresh()).snapshot.goals[0].title,'account B');
 release();assert.equal(await old,null);
});
