/** G.1.1 BLACK BOX staged HTTP account-isolation + restart acceptance probe.
 * No purchases, no external provider calls, no production mutation.
 * Use only against an explicitly authorized staging origin.
 */
import {randomBytes} from 'node:crypto';
import {writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function verifyTarget(raw,{allowLoopback=false}={}){
 const value=new URL(raw);
 if(value.username||value.password||value.search||value.hash||value.pathname!=='/')throw Error('Expected a bare HTTPS origin');
 const loopback=allowLoopback&&value.protocol==='http:'&&['localhost','127.0.0.1'].includes(value.hostname);
 if(value.protocol!=='https:'&&!loopback)throw Error('G.1.1 requires HTTPS; loopback HTTP is permitted only in unit tests');
 return value.origin;
}
async function request(origin,path,{method='GET',body,cookie}={}){
 const res=await fetch(origin+path,{method,headers:{
   ...(body?{'content-type':'application/json'}:{}),
   ...(cookie?{'cookie':cookie}:{})
 },body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000),redirect:'error'});
 const data=await res.json();
 return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]};
}
function ok(actual,expected,action){
 if(actual!==expected)throw Error('G.1.1 '+action+' returned '+actual+', expected '+expected);
}
function headers(result){
 if(!result.cookie?.startsWith('seva_session='))throw Error('Authenticated cookie missing');
 return result.cookie;
}
async function signIn(origin,creds){
 const r=await request(origin,'/api/auth/login',{method:'POST',body:creds});
 ok(r.status,200,'login');return headers(r);
}
function uniqueTitle(tag){return 'G11-'+tag+'-'+randomBytes(9).toString('hex');}
async function snapshot(origin,cookie){
 const r=await request(origin,'/api/dbrelay/snapshot',{cookie});
 ok(r.status,200,'DBRELAY snapshot');
 if(!Array.isArray(r.data.goals)||!Number.isSafeInteger(r.data.cursor))throw Error('Invalid DBRELAY snapshot');
 return r.data;
}
export async function prepare(origin,{allowLoopback=false}={}){
 const base=verifyTarget(origin,{allowLoopback});
 const health=await request(base,'/health');ok(health.status,200,'health');
 if(health.data.ok!==true)throw Error('Database health not ready');
 const status=await request(base,'/api/public/status');ok(status.status,200,'public status');
 if(status.data.salesEnabled===true)throw Error('BLACK BOX must not create users with sales active');
 const accounts=[];
 for(const tag of ['A','B']){
  const creds={email:'g11-'+randomBytes(12).toString('hex')+'@example.invalid',password:randomBytes(24).toString('hex')};
  const register=await request(base,'/api/auth/register',{method:'POST',body:creds});
  ok(register.status,201,'register');
  const cookie=headers(register);
  const title=uniqueTitle(tag);
  const put=await request(base,'/api/goals',{method:'POST',cookie,body:{title,status:'doing',criteria:'Tenant-only restart acceptance',evidence:'Synthetic BLACK BOX G1.1'}});
  ok(put.status,201,'create goal');
  if(!put.data.id)throw Error('Goal ID absent');
  const snap=await snapshot(base,cookie);
  if(snap.goals.length!==1||snap.goals[0].id!==put.data.id)throw Error('Prepared goal missing');
  accounts.push({credentials:creds,goalId:put.data.id,title,cursor:snap.cursor});
 }
 const a=await snapshot(base,await signIn(base,accounts[0].credentials));
 const b=await snapshot(base,await signIn(base,accounts[1].credentials));
 if(a.goals.some(g=>g.id===accounts[1].goalId)||b.goals.some(g=>g.id===accounts[0].goalId))throw Error('CROSS_TENANT_LEAK');
 return {privateReceipt:{schema:'seva-blackbox-g11-v1',origin:base,accounts,version:status.data.version,stage:'after-prepare'},
  publicEvidence:{gate:'G.1.1',phase:'prepare',environment:'staging',result:'PASS',observed:'Two synthetic accounts and mutually isolated goals stored via HTTP, before restart',measuredAt:new Date().toISOString(),version:status.data.version,accounts:2}};
}
export async function verifyAfterRestart(origin,privateReceipt,{allowLoopback=false}={}){
 const base=verifyTarget(origin,{allowLoopback});
 if(privateReceipt?.schema!=='seva-blackbox-g11-v1'||privateReceipt.origin!==base||privateReceipt.accounts?.length!==2)throw Error('Invalid G.1.1 private evidence');
 const health=await request(base,'/health');ok(health.status,200,'health after restart');
 const [a,b]=privateReceipt.accounts;
 for(const [own,other] of [[a,b],[b,a]]){
  const cookie=await signIn(base,own.credentials);
  const snap=await snapshot(base,cookie);
  const ownGoal=snap.goals.find(g=>g.id===own.goalId);
  if(!ownGoal||ownGoal.title!==own.title||snap.cursor<own.cursor)throw Error('PERSISTENCE_FAILED');
  if(snap.goals.some(g=>g.id===other.goalId||g.title===other.title))throw Error('CROSS_TENANT_LEAK');
  const unauthorized=await request(base,'/api/goals/'+other.goalId,{method:'PUT',cookie,body:{title:'should-not-overwrite',status:'todo'}});
  if(unauthorized.status===200)throw Error('CROSS_TENANT_WRITE');
 }
 return {gate:'G.1.1',phase:'verify-after-restart',environment:'staging',result:'PASS',
  expected:'Two accounts retain only their own goals and DBRELAY cursor after service restart',
  observed:'Authenticated owners A and B retrieved isolated persisted goals; unauthorized write denied',
  accounts:2,measuredAt:new Date().toISOString(),version:privateReceipt.version};
}
async function main(){
 const [mode,origin,receiptFile]=process.argv.slice(2);
 if(!['prepare','verify'].includes(mode)||!origin||!receiptFile)throw Error('Usage: SEVA_BLACKBOX_STAGING=YES node blackbox-g11.mjs prepare|verify https://staging-origin /secure/private-receipt.json');
 if(process.env.SEVA_BLACKBOX_STAGING!=='YES')throw Error('Explicit staging-only authorization required');
 const base=verifyTarget(origin),path=resolve(receiptFile);
 if(mode==='prepare'){
  const {privateReceipt,publicEvidence}=await prepare(base);
  await writeFile(path,JSON.stringify(privateReceipt),{mode:0o600,flag:'wx'});
  console.log(JSON.stringify(publicEvidence));
 }else{
  const privateReceipt=JSON.parse(await readFile(path,'utf8'));
  console.log(JSON.stringify(await verifyAfterRestart(base,privateReceipt)));
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error('G.1.1 refused/failed: '+e.message);process.exitCode=1;});
