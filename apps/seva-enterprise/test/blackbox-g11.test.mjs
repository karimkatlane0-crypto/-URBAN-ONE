import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {createServer as createHttpServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {prepare,verifyAfterRestart,verifyTarget} from '../blackbox-g11.mjs';

function availablePort(){return new Promise((resolve,reject)=>{
 const socket=createServer();
 socket.once('error',reject);
 socket.listen(0,'127.0.0.1',()=>{const p=socket.address().port;socket.close(()=>resolve(p));});
});}
async function launch(port,path){
 const child=spawn(process.execPath,['--experimental-sqlite',new URL('../server.mjs',import.meta.url).pathname],{
  env:{...process.env,NODE_ENV:'test',SEVA_NO_LISTEN:'0',PORT:String(port),SEVA_DB_PATH:path,
       SEVA_SALES_ENABLED:'false',SEVA_ANNUAL_SALES_ENABLED:'false',
       OPENAI_API_KEY:'',STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:''},
  stdio:'ignore'
 });
 const url='http://127.0.0.1:'+port;
 for(let attempt=0;attempt<50;attempt++){
  if(child.exitCode!==null)throw Error('Child exited before health');
  try{
   const res=await fetch(url+'/health',{signal:AbortSignal.timeout(700)});
   if(res.status===200)return child;
  }catch{}
  await new Promise(done=>setTimeout(done,120));
 }
 child.kill();throw Error('Local SEVA server did not start');
}
async function stop(child){
 if(child.exitCode!==null)return;
 const completed=once(child,'exit');
 child.kill('SIGTERM');
 await completed;
}
test('G.1.1 BLACK BOX: 2 signed-in tenants survive real Node process restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seva-real-restart-'));
 const db=join(dir,'seva.sqlite');
 const port=await availablePort();
 const url='http://127.0.0.1:'+port;
 let server;
 try{
  server=await launch(port,db);
  const {privateReceipt,publicEvidence}=await prepare(url,{allowLoopback:true});
  assert.equal(publicEvidence.result,'PASS');
  assert.equal(publicEvidence.accounts,2);
  const initialHealth=await (await fetch(url+'/health')).json();
  assert.equal(privateReceipt.bootId,initialHealth.bootId);
  assert.equal((await (await fetch(url+'/health')).json()).bootId,initialHealth.bootId);
  await assert.rejects(
   verifyAfterRestart(url,privateReceipt,{allowLoopback:true}),
   /RESTART_NOT_OBSERVED/,
   'Repeating verification on the same Node process must not certify a restart'
  );
  await stop(server);server=null;
  server=await launch(port,db);
  assert.notEqual((await (await fetch(url+'/health')).json()).bootId,initialHealth.bootId);
  const result=await verifyAfterRestart(url,privateReceipt,{allowLoopback:true});
  assert.equal(result.result,'PASS');
  assert.match(result.observed,/isolated/);
  assert.equal(result.processChangeObserved,true);
  assert.equal(result.operatorRestartEvidenceRequired,true);
 }finally{if(server)await stop(server);await rm(dir,{recursive:true,force:true});}
});
test('G.1.1 rejects legacy or missing boot-ID receipts before sending credentials',async()=>{
 for(const receipt of [
  {schema:'seva-blackbox-g11-v1',origin:'https://example.invalid',accounts:[{},{}]},
  {schema:'seva-blackbox-g11-v2',origin:'https://example.invalid',accounts:[{},{}]},
  {schema:'seva-blackbox-g11-v2',origin:'https://example.invalid',bootId:'invented',accounts:[{},{}]}
 ])await assert.rejects(verifyAfterRestart('https://example.invalid',receipt),/Invalid G.1.1 private evidence/);
});
test('G.1.1 requires a SEVA runtime identity and makes no account writes on incompatible health',async t=>{
 let health={ok:true,service:'seva'},writes=0;
 const server=createHttpServer((req,res)=>{
  if(req.method!=='GET')writes++;
  res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(health));
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(done=>server.close(done)));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const invalid of [
  {ok:true,service:'seva'},
  {ok:true,service:'seva',bootId:'invalid'},
  {ok:true,service:'another-product',bootId:randomUUID()},
  {ok:false,service:'seva',bootId:randomUUID()}
 ]){
  health=invalid;
  await assert.rejects(prepare(origin,{allowLoopback:true}),/Runtime identity unavailable/);
 }
 assert.equal(writes,0);
});
test('G.1.1 refuses accidental external plain HTTP or URL with credentials',()=>{
 assert.throws(()=>verifyTarget('http://example.com'),/HTTPS/);
 assert.throws(()=>verifyTarget('https://user:pass@example.com/'),/bare HTTPS/);
 assert.throws(()=>verifyTarget('https://example.com/path'),/bare HTTPS/);
 assert.equal(verifyTarget('http://127.0.0.1:3000/',{allowLoopback:true}),'http://127.0.0.1:3000');
});

