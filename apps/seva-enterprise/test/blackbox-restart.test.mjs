/**
 * SEVA backend black-box acceptance: a real HTTP process, two synthetic tenants,
 * a full process restart, durable DBRELAY cursor and fail-closed OpenAI/commerce.
 *
 * All interactions are localhost. No real OpenAI key, OAuth token, bank account,
 * Stripe secret, merchant data or personal identity is used or printed.
 * This proves the server's deployment behavior IN A SYNTHETIC ENVIRONMENT only;
 * it does not prove public HTTPS deployment, ChatGPT OAuth or provider payment.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const appDir=resolve(fileURLToPath(new URL('../',import.meta.url)));
const password='Synthetic-Acceptance-Passphrase-01';
const emailA='synthetic-seva-a@example.test';
const emailB='synthetic-seva-b@example.test';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function ephemeralPort(){
 return await new Promise((resolve,reject)=>{
  const server=createServer();
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>{
   const {port}=server.address();
   server.close(err=>err?reject(err):resolve(port));
  });
 });
}

function launch({dbFile,port}){
 const env={
  ...process.env,
  NODE_ENV:'production',
  PORT:String(port),
  SEVA_NO_LISTEN:'0',
  SEVA_PUBLIC_URL:'https://seva-acceptance.example.test/',
  SEVA_DB_PATH:dbFile,
  OPENAI_API_KEY:'',
  OPENAI_BASE_URL:'',
  STRIPE_SECRET_KEY:'',
  STRIPE_WEBHOOK_SECRET:'',
  SEVA_PAYMENT_METHOD:'sepa',
  SEVA_BANK_ORDERS_ENABLED:'false',
  SEVA_BANK_LIVE_APPROVED:'false',
  SEVA_SALES_ENABLED:'false',
  SEVA_ANNUAL_SALES_ENABLED:'false',
  SEVA_ADMIN_EMAIL:''
 };
 const child=spawn(process.execPath,['--experimental-sqlite','server.mjs'],{
  cwd:appDir,env,stdio:['ignore','pipe','pipe']
 });
 let stderr='';
 child.stdout.on('data',()=>{});
 child.stderr.on('data',chunk=>{stderr=(stderr+String(chunk)).slice(-2500);});
 child.on('error',error=>{stderr=String(error.message);});
 return {child,getStderr:()=>stderr};
}

async function stopServer(handle){
 if(!handle)return;
 const child=handle.child;
 if(child.exitCode!==null||child.signalCode!==null)return;
 await new Promise(resolve=>{
  let resolved=false;
  const finish=()=>{if(resolved)return;resolved=true;clearTimeout(timer);resolve();};
  child.once('exit',finish);
  const timer=setTimeout(()=>{child.kill('SIGKILL');finish();},2000);
  child.kill('SIGTERM');
 });
}

async function waitForHealth(origin,handle){
 for(let tries=0;tries<120;tries++){
  if(handle.child.exitCode!==null||handle.child.signalCode!==null)
   throw Error('Server exited during startup: '+handle.getStderr());
  try{
   const response=await fetch(origin+'/health',{signal:AbortSignal.timeout(650)});
   if(response.status===200){
    const data=await response.json();
    if(data.ok===true&&data.service==='seva')return;
   }
  }catch{/* server starting */}
  await sleep(100);
 }
 throw Error('Synthetic server failed to become healthy: '+handle.getStderr());
}

async function api(origin,path,{method='GET',cookie,body,originHeader}={}){
 const headers={};
 if(cookie)headers.Cookie=cookie;
 if(body!==undefined)headers['Content-Type']='application/json';
 if(originHeader)headers.Origin=originHeader;
 const response=await fetch(origin+path,{
  method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'manual',
  signal:AbortSignal.timeout(5000)
 });
 let data={};
 try{data=await response.json();}catch{data={};}
 return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const createGoal=(title)=>({title,status:'doing',description:'Synthetic goal only'});
function titles(obj){return obj.data.goals.map(g=>g.title);}

test('EXECUTIVE TIER-1: login, per-tenant goals, DBRELAY and restart via real localhost HTTP', {timeout:45000},async()=>{
 const directory=mkdtempSync(join(tmpdir(),'seva-real-process-'));
 const dbFile=join(directory,'seva.sqlite');
 const port=await ephemeralPort(),origin='http://127.0.0.1:'+port;
 let running,report={schemaVersion:1,scope:'synthetic-localhost',realBackendHttps:'NOT_TESTED',
  chatgptOIDC:'NOT_TESTED',realOpenAIInference:'NOT_TESTED',bankSettlement:'NOT_TESTED',
  tests:{},generatedAt:new Date().toISOString()};
 try{
  // Start a real Node HTTP process with production startup checks and on-disk SQLite.
  running=launch({dbFile,port});
  await waitForHealth(origin,running);
  report.tests.productionStartWithAbsoluteSqlite='PASS';
  assert.equal((await api(origin,'/api/goals')).status,401);
  assert.equal((await api(origin,'/api/dbrelay/snapshot')).status,401);
  report.tests.anonymousAccessRejected='PASS';

  const a=await api(origin,'/api/auth/register',{method:'POST',body:{email:emailA,password}});
  const b=await api(origin,'/api/auth/register',{method:'POST',body:{email:emailB,password}});
  assert.equal(a.status,201);
  assert.equal(b.status,201);
  assert.match(a.cookie,/^seva_session=/);
  assert.match(b.cookie,/^seva_session=/);
  assert.notEqual(a.cookie,b.cookie);
  report.tests.twoAccountRegistrationAndSessions='PASS';

  const aSave=await api(origin,'/api/goals',{method:'POST',cookie:a.cookie,body:createGoal('ALPHA ONLY')});
  const bSave=await api(origin,'/api/goals',{method:'POST',cookie:b.cookie,body:createGoal('BETA ONLY')});
  assert.equal(aSave.status,201);
  assert.equal(bSave.status,201);

  const aGoals=await api(origin,'/api/goals',{cookie:a.cookie});
  const bGoals=await api(origin,'/api/goals',{cookie:b.cookie});
  assert.deepEqual(titles(aGoals),['ALPHA ONLY']);
  assert.deepEqual(titles(bGoals),['BETA ONLY']);
  const as=await api(origin,'/api/dbrelay/snapshot',{cookie:a.cookie});
  const bs=await api(origin,'/api/dbrelay/snapshot',{cookie:b.cookie});
  assert.deepEqual(as.data.goals.map(x=>x.title),['ALPHA ONLY']);
  assert.deepEqual(bs.data.goals.map(x=>x.title),['BETA ONLY']);
  const ad=await api(origin,'/api/dbrelay/changes?after=0&limit=20',{cookie:a.cookie});
  const bd=await api(origin,'/api/dbrelay/changes?after=0&limit=20',{cookie:b.cookie});
  assert.equal(ad.data.changes.length,1);
  assert.equal(bd.data.changes.length,1);
  assert.notEqual(ad.data.changes[0].resourceId,bd.data.changes[0].resourceId);
  assert.equal(ad.data.dataIncluded,false);
  const firstACursor=ad.data.nextCursor;
  report.tests.httpTwoTenantIsolationAndChangeFeed='PASS';

  const csrf=await api(origin,'/api/goals',{method:'POST',cookie:a.cookie,
   originHeader:'https://unexpected-origin.example.test',body:createGoal('CSRF ATTACK')});
  assert.equal(csrf.status,403);
  const noAI=await api(origin,'/api/ai/generate',{method:'POST',cookie:a.cookie,
   body:{prompt:'Plan',consent:true}});
  assert.equal(noAI.status,503);
  const publicState=await api(origin,'/api/public/status');
  assert.equal(publicState.data.aiConfigured,false);
  assert.equal(publicState.data.salesEnabled,false);
  const checkout=await api(origin,'/api/billing/checkout',{method:'POST',cookie:a.cookie,body:{}});
  assert.equal(checkout.status,503);
  const bank=await api(origin,'/api/bank/status');
  assert.equal(bank.status,200);
  assert.equal(bank.data.enabled,false);
  report.tests.csrfBlockAndAiBankSalesFailClosed='PASS';

  // A true process shutdown/restart (not merely closing a SQLite handle in-process).
  await stopServer(running);
  running=launch({dbFile,port});
  await waitForHealth(origin,running);
  report.tests.processRestartWithSameDurableDatabase='PASS';

  const loginA=await api(origin,'/api/auth/login',{method:'POST',body:{email:emailA,password}});
  const loginB=await api(origin,'/api/auth/login',{method:'POST',body:{email:emailB,password}});
  assert.equal(loginA.status,200);
  assert.equal(loginB.status,200);
  const aAfter=await api(origin,'/api/dbrelay/snapshot',{cookie:loginA.cookie});
  const bAfter=await api(origin,'/api/dbrelay/snapshot',{cookie:loginB.cookie});
  assert.deepEqual(aAfter.data.goals.map(x=>x.title),['ALPHA ONLY']);
  assert.deepEqual(bAfter.data.goals.map(x=>x.title),['BETA ONLY']);
  const aChangeAfter=await api(origin,'/api/dbrelay/changes?after=0&limit=20',{cookie:loginA.cookie});
  assert.equal(aChangeAfter.data.nextCursor,firstACursor);
  assert.equal(aChangeAfter.data.changes.length,1);
  assert.equal((await api(origin,'/api/me')).status,401);
  report.tests.loginAfterRestartAndTenantPersistence='PASS';

  // Verify that cursor increases and stale cursors still resolve correctly after reboot.
  const update=await api(origin,'/api/goals/'+aSave.data.id,{
   method:'PUT',cookie:loginA.cookie,body:{...createGoal('ALPHA UPDATED'),status:'done'}});
  assert.equal(update.status,200);
  const incremental=await api(origin,'/api/dbrelay/changes?after='+firstACursor+'&limit=10',{
   cookie:loginA.cookie});
  assert.equal(incremental.status,200);
  assert.equal(incremental.data.changes.length,1);
  assert.equal(incremental.data.changes[0].action,'updated');
  assert.deepEqual(titles(await api(origin,'/api/goals',{cookie:loginB.cookie})),['BETA ONLY']);
  report.tests.incrementalCursorAfterRestart='PASS';

  report.result='PASS';
  assert.equal(Object.values(report.tests).length,8);
  // CI artifact includes only status names and no account identifiers or PII.
  if(process.env.SEVA_BLACKBOX_REPORT_PATH){
   const target=resolve(process.env.SEVA_BLACKBOX_REPORT_PATH);
   mkdirSync(dirname(target),{recursive:true});
   writeFileSync(target,JSON.stringify(report,null,2)+'\n');
  }
 }finally{
  await stopServer(running);
  rmSync(directory,{recursive:true,force:true});
 }
});
