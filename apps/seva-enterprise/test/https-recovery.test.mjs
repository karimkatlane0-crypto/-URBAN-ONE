/** Synthetic local HTTPS acceptance. Never contacts a cloud host or provider. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createServer as createSocketServer} from 'node:net';
import {request as httpRequest} from 'node:http';
import {createServer as createHttpsServer} from 'node:https';
import {mkdtemp,mkdir,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {backupSeva,restoreSeva} from '../maintenance.mjs';

const appDir=fileURLToPath(new URL('../',import.meta.url));
const delay=ms=>new Promise(done=>setTimeout(done,ms));
async function availablePort(){
 const server=createSocketServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const port=server.address().port;await new Promise(done=>server.close(done));return port;
}
async function stop(child){
 if(!child||child.exitCode!==null||child.signalCode!==null)return;
 const done=once(child,'exit');
 const timer=setTimeout(()=>child.kill('SIGKILL'),2000);
 child.kill('SIGTERM');try{await done;}finally{clearTimeout(timer);}
}
async function startBackend(port,dbPath,origin){
 const child=spawn(process.execPath,['--experimental-sqlite','server.mjs'],{
  cwd:appDir,stdio:'ignore',env:{...process.env,NODE_ENV:'production',PORT:String(port),
   SEVA_NO_LISTEN:'0',SEVA_DB_PATH:dbPath,SEVA_PUBLIC_URL:origin,
   SEVA_SALES_ENABLED:'false',SEVA_ANNUAL_SALES_ENABLED:'false',
   SEVA_BANK_ORDERS_ENABLED:'false',SEVA_BANK_LIVE_APPROVED:'false',
   SEVA_PAYMENT_METHOD:'sepa',SEVA_ADMIN_EMAIL:'',OPENAI_API_KEY:'',
   STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:'',GEMINI_API_KEY:'',SEVA_GEMINI_ENABLED:'false'}
 });
 for(let attempt=0;attempt<80;attempt++){
  if(child.exitCode!==null||child.signalCode!==null)throw Error('Synthetic backend exited during startup');
  try{if((await fetch('http://127.0.0.1:'+port+'/health',{signal:AbortSignal.timeout(500)})).ok)return child;}catch{}
  await delay(100);
 }
 await stop(child);throw Error('Synthetic backend did not become ready');
}
async function runProbe(mode,origin,receipt,certificate,{trust=true}={}){
 const env={...process.env,SEVA_BLACKBOX_STAGING:'YES'};
 // The test CA is explicitly trusted. TLS verification is never disabled.
 if(trust)env.NODE_EXTRA_CA_CERTS=certificate;
 const child=spawn(process.execPath,['blackbox-g11.mjs',mode,origin,receipt],{cwd:appDir,env,stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';
 child.stdout.on('data',data=>{stdout+=data;});child.stderr.on('data',data=>{stderr+=data;});
 const [code]=await once(child,'exit');return {code,stdout,stderr};
}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('HTTPS: two accounts remain isolated after process restart and isolated backup recovery',{timeout:45000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seva-https-recovery-'));
 const live=join(dir,'live.sqlite'),snapshot=join(dir,'snapshot.sqlite'),recovered=join(dir,'recovered.sqlite');
 const certificate=join(dir,'test-ca.pem'),key=join(dir,'test-key.pem'),receipt=join(dir,'private-receipt.json');
 let backend,proxy;
 const report={schemaVersion:1,scope:'synthetic-local-https',result:'FAIL',accounts:2,
  remoteBackendHttps:'NOT_TESTED',providerRestart:'NOT_TESTED',offsiteBackup:'NOT_TESTED',tests:{}};
 try{
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1',
   '-subj','/CN=SEVA synthetic HTTPS acceptance','-addext','subjectAltName=IP:127.0.0.1',
   '-addext','basicConstraints=critical,CA:TRUE','-keyout',key,'-out',certificate],{stdio:'ignore'});
  const backendPort=await availablePort();
  proxy=createHttpsServer({key:await readFile(key),cert:await readFile(certificate)},(req,res)=>{
   const upstream=httpRequest({host:'127.0.0.1',port:backendPort,path:req.url,method:req.method,
    headers:{...req.headers,'x-forwarded-proto':'https'}},response=>{
     res.writeHead(response.statusCode,response.headers);response.pipe(res);
    });
   upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end();});req.pipe(upstream);
  });
  proxy.listen(0,'127.0.0.1');await once(proxy,'listening');
  const origin='https://127.0.0.1:'+proxy.address().port;
  backend=await startBackend(backendPort,live,origin);

  const untrusted=await runProbe('prepare',origin,receipt,certificate,{trust:false});
  assert.notEqual(untrusted.code,0,'An untrusted certificate must stop account creation');
  await assert.rejects(stat(receipt),{code:'ENOENT'});
  report.tests.untrustedCertificateRejected='PASS';

  const prepared=await runProbe('prepare',origin,receipt,certificate);
  assert.equal(prepared.code,0,prepared.stderr);assert.equal(JSON.parse(prepared.stdout).result,'PASS');
  assert.equal((await stat(receipt)).mode&0o777,0o600);
  report.tests.trustedHttpsTwoAccountIsolation='PASS';
  const unchanged=await runProbe('verify',origin,receipt,certificate);
  assert.notEqual(unchanged.code,0);assert.match(unchanged.stderr,/RESTART_NOT_OBSERVED/);
  report.tests.sameProcessCannotCertifyRestart='PASS';

  const backup=await backupSeva(live,snapshot);
  assert.equal(backup.verified,true);
  await assert.rejects(backupSeva(live,snapshot),{code:'EEXIST'});
  report.tests.consistentBackupAndNoClobber='PASS';

  await stop(backend);backend=null;
  backend=await startBackend(backendPort,live,origin);
  const restarted=await runProbe('verify',origin,receipt,certificate);
  assert.equal(restarted.code,0,restarted.stderr);
  assert.equal(JSON.parse(restarted.stdout).processChangeObserved,true);
  report.tests.realProcessRestartAndDurableTenantData='PASS';

  await stop(backend);backend=null;
  const originalHash=hash(await readFile(live));
  await assert.rejects(restoreSeva(snapshot,live),{code:'EEXIST'});
  const restore=await restoreSeva(snapshot,recovered);
  assert.equal(restore.existingDatabaseOverwritten,false);
  assert.equal(hash(await readFile(live)),originalHash);
  report.tests.restoreUsesNewDatabaseAndPreservesOriginal='PASS';
  backend=await startBackend(backendPort,recovered,origin);
  const restored=await runProbe('verify',origin,receipt,certificate);
  assert.equal(restored.code,0,restored.stderr);
  assert.equal(JSON.parse(restored.stdout).result,'PASS');
  report.tests.recoveredDatabaseLoginIsolationAndCursorsOverHttps='PASS';
  report.result='PASS';
 }finally{
  await stop(backend);
  if(proxy){const closed=new Promise(done=>proxy.close(done));proxy.closeAllConnections();await closed;}
  await rm(dir,{recursive:true,force:true});
  if(process.env.SEVA_HTTPS_RECOVERY_REPORT_PATH){
   const target=resolve(process.env.SEVA_HTTPS_RECOVERY_REPORT_PATH);
   await mkdir(dirname(target),{recursive:true});
   await writeFile(target,JSON.stringify({...report,generatedAt:new Date().toISOString()},null,2)+'\n');
  }
 }
});
