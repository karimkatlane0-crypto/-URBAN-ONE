import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {requireSessionUser} from '../runtime.mjs';

process.env.SEVA_NO_LISTEN='1';
process.env.SEVA_DB_PATH=':memory:';
process.env.SEVA_SALES_ENABLED='false';
process.env.NODE_ENV='test';
const {server,store}=await import('../server.mjs');
server.listen(0,'127.0.0.1');await once(server,'listening');
after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));store.db.close();});
const base=`http://127.0.0.1:${server.address().port}`;
const originalLookup=store.fromSession;
const request=async(path,method='GET',token='test-session')=>{
 const response=await fetch(base+path,{method,headers:{...(token?{Cookie:'seva_session='+token}:{}),...(method==='GET'?{}:{'Content-Type':'application/json',Origin:base})},...(method==='GET'?{}:{body:'{}'})});
 return {status:response.status,body:await response.json()};
};

test('session lookup awaits a delayed user and exposes only the identity fields',async()=>{
 let release;
 const pending=new Promise(resolve=>{release=resolve;});
 let completed=false;
 const result=requireSessionUser({fromSession:()=>pending},'token').then(user=>{completed=true;return user;});
 await Promise.resolve();assert.equal(completed,false);
 release(Object.assign(Object.create(null),{id:'owner',email:'owner@example.invalid',password:'must-not-be-returned'}));
 assert.deepEqual(await result,{id:'owner',email:'owner@example.invalid'});
});

test('missing token and malformed async identities deny access',async()=>{
 let calls=0;
 for(const token of [undefined,null,'',42])await assert.rejects(requireSessionUser({fromSession(){calls++;}},token),e=>e.status===401&&e.message==='Please sign in');
 assert.equal(calls,0);
 for(const value of [null,undefined,false,true,[],{},'owner',{id:'owner'},{id:'',email:'a'},{id:'a',email:' '},{id:3,email:'a'}]){
  await assert.rejects(requireSessionUser({fromSession:async()=>value},'token'),e=>e.status===401&&e.message==='Please sign in');
 }
});

test('synchronous exceptions and rejected lookups cannot leak details or spoof HTTP status',async()=>{
 for(const fromSession of [()=>{throw {status:200,message:'private-db-detail'};},async()=>{throw Error('private-db-detail');}]){
  await assert.rejects(requireSessionUser({fromSession},'token'),e=>e.status===503&&e.message==='Authentication temporarily unavailable'&&!e.cause);
 }
});

test('every protected route awaits a denied asynchronous session before using account data',async()=>{
 const routes=[
  ['GET','/api/developer/keys'],['POST','/api/developer/keys'],['DELETE','/api/developer/keys/key-one'],
  ['POST','/api/communications/draft'],['GET','/api/analytics/overview'],
  ['GET','/api/lastre/intents'],['POST','/api/lastre/intents'],['DELETE','/api/lastre/intents/entry'],['POST','/api/lastre/analyze'],
  ['GET','/api/notifications/preferences'],['PUT','/api/notifications/preferences'],['GET','/api/notifications'],['POST','/api/notifications/read'],['DELETE','/api/notifications'],
  ['GET','/api/commerce/affiliate/opportunities'],['GET','/api/commerce/profile'],['PUT','/api/commerce/profile'],['DELETE','/api/commerce/profile'],
  ['GET','/api/commerce/student'],['POST','/api/commerce/student/apply'],['GET','/api/commerce/cart'],['PUT','/api/commerce/cart'],
  ['GET','/api/commerce/requests'],['POST','/api/commerce/requests'],['POST','/api/commerce/checkout'],['POST','/api/commerce/assist'],
  ['GET','/api/commercial/campaigns'],['POST','/api/commercial/campaigns'],
  ['GET','/api/student'],['PUT','/api/student'],['DELETE','/api/student'],['GET','/api/me'],
  ['GET','/api/dbrelay/status'],['GET','/api/dbrelay/snapshot'],['GET','/api/dbrelay/changes'],
  ['GET','/api/goals'],['POST','/api/goals'],['PUT','/api/goals/00000000-0000-4000-8000-000000000000'],['DELETE','/api/goals/00000000-0000-4000-8000-000000000000'],
  ['POST','/api/ai/generate'],['GET','/api/bank/orders'],['POST','/api/bank/orders'],['POST','/api/billing/checkout'],['POST','/api/billing/checkout/annual'],['GET','/api/rewards']
 ];
 let calls=0;store.fromSession=async()=>{calls++;return null;};
 try{
  for(const [method,path] of routes)assert.deepEqual(await request(path,method),{status:401,body:{error:'Please sign in'}},method+' '+path);
  assert.equal(calls,routes.length);
 }finally{store.fromSession=originalLookup;}
});

test('HTTP lookup failure is unavailable, sanitizes both response and server logs, and preserves public health',async()=>{
 const logs=[],originalError=console.error;
 console.error=(...args)=>logs.push(args.join(' '));
 store.fromSession=async()=>{throw {status:200,message:'private-db-detail'};};
 try{
  assert.deepEqual(await request('/api/me'),{status:503,body:{error:'Authentication temporarily unavailable'}});
  assert.equal(logs.length,1);assert(!logs[0].includes('private-db-detail'));
  assert.equal((await request('/health','GET',null)).status,200);
  assert.equal((await request('/api/public/status','GET',null)).status,200);
 }finally{console.error=originalError;store.fromSession=originalLookup;}
});

test('concurrent async sessions resolving in reverse order keep their own goals and safe user shape',async()=>{
 const a=store.register('async-a@example.invalid','A-strong-test-password'),b=store.register('async-b@example.invalid','B-strong-test-password');
 store.saveGoal(a.id,{title:'Only A'});store.saveGoal(b.id,{title:'Only B'});
 const resolvers=new Map();
 store.fromSession=token=>new Promise(resolve=>resolvers.set(token,resolve));
 try{
  const first=request('/api/goals','GET','session-a'),second=request('/api/goals','GET','session-b');
  const deadline=Date.now()+2000;
  while(resolvers.size<2&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(resolvers.size,2);
  resolvers.get('session-b')(b);resolvers.get('session-a')(a);
  const [ra,rb]=await Promise.all([first,second]);
  assert.equal(ra.status,200);assert.equal(rb.status,200);
  assert.deepEqual(ra.body.goals.map(g=>g.title),['Only A']);assert.deepEqual(rb.body.goals.map(g=>g.title),['Only B']);
  store.fromSession=async()=>({...a,password:'must-not-be-returned'});
  assert.deepEqual((await request('/api/me')).body.user,a);
  assert.equal((await request('/api/student')).body.profile,null);
 }finally{store.fromSession=originalLookup;}
});
