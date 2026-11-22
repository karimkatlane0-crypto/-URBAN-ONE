import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer as createSocket} from 'node:net';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const password='Sandbox-Only-Password-2026';
const entry=new URL('../server.mjs',import.meta.url).pathname;
async function portNumber(){const s=createSocket();s.listen(0,'127.0.0.1');await once(s,'listening');const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function launch(database){
 const port=await portNumber(),origin='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,['--experimental-sqlite',entry],{env:{NODE_ENV:'test',PORT:String(port),SEVA_DB_PATH:database,SEVA_PUBLIC_URL:origin,SEVA_MOBILE_SYNC_ENABLED:'false',SEVA_MOBILE_ALLOW_LOOPBACK_HTTP:'true',SEVA_SALES_ENABLED:'false',SEVA_ANNUAL_SALES_ENABLED:'false'},stdio:['ignore','ignore','pipe']});
 let diagnostic='';child.stderr.on('data',v=>{diagnostic=(diagnostic+v).slice(-2000);});
 const stop=async()=>{if(child.exitCode!==null||child.signalCode!==null)return;const ended=once(child,'exit');child.kill('SIGTERM');await ended;};
 for(let i=0;i<70;i++){if(child.exitCode!==null)throw Error('Server exited: '+diagnostic);try{const r=await fetch(origin+'/health',{signal:AbortSignal.timeout(300)});if(r.status===200)return {origin,stop};}catch{}await new Promise(r=>setTimeout(r,70));}
 await stop();throw Error('Server did not start: '+diagnostic);
}
async function call(origin,path,{cookie,method='GET',body,requestOrigin=origin}={}){
 const r=await fetch(origin+path,{method,signal:AbortSignal.timeout(3000),headers:{Origin:requestOrigin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=(r.headers.get('content-type')||'').includes('application/json')?await r.json():await r.text();
 return {status:r.status,body:data,cookie:r.headers.get('set-cookie')?.split(';')[0]};
}
async function register(origin,email){const r=await call(origin,'/api/auth/register',{method:'POST',body:{email,password}});assert.equal(r.status,201);return r.body.user;}
async function login(origin,email){const r=await call(origin,'/api/auth/login',{method:'POST',body:{email,password}});assert.equal(r.status,200);return r.cookie;}

test('authenticated click-to-instance API provisions, isolates, stops and deletes sandbox instances',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'seva-instance-api-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const app=await launch(join(dir,'seva.sqlite'));t.after(()=>app.stop());
 const {origin}=app;
 const page=await call(origin,'/instances.html');assert.equal(page.status,200);assert.match(page.body,/Click-to-instance/);assert.match(page.body,/instances.js/);
 const script=await call(origin,'/instances.js');assert.equal(script.status,200);assert.ok(script.body.includes('/api/instances'));
 const styles=await call(origin,'/instances.css');assert.equal(styles.status,200);assert.match(styles.body,/grid-template-columns/);
 assert.equal((await call(origin,'/api/instances/catalog')).status,401);
 const a=await register(origin,'instance-a@synthetic.invalid');
 await register(origin,'instance-b@synthetic.invalid');
 const cookieA=await login(origin,'instance-a@synthetic.invalid'),cookieB=await login(origin,'instance-b@synthetic.invalid');
 const catalog=await call(origin,'/api/instances/catalog',{cookie:cookieA});
 assert.equal(catalog.status,200);assert.deepEqual(catalog.body.modules.map(x=>x.id),['ingest','dbrelay','insights','crm']);
 const adapter=await call(origin,'/api/instances/adapter',{cookie:cookieA});
 assert.equal(adapter.body.status.mode,'simulation-only');assert.equal(adapter.body.status.cloudResources,false);
 const crossOrigin=await call(origin,'/api/instances',{cookie:cookieA,method:'POST',requestOrigin:'https://attacker.invalid',body:{moduleId:'ingest',environment:'test',idempotencyKey:'cross-origin-01'}});
 assert.equal(crossOrigin.status,403);
 const production=await call(origin,'/api/instances',{cookie:cookieA,method:'POST',body:{moduleId:'ingest',environment:'production',idempotencyKey:'production-001'}});
 assert.equal(production.status,400);assert.equal(production.body.error,'ENVIRONMENT_NOT_ALLOWED');
 const created=await call(origin,'/api/instances',{cookie:cookieA,method:'POST',body:{moduleId:'ingest',environment:'test',idempotencyKey:'sandbox-create-01'}});
 assert.equal(created.status,201);assert.equal(created.body.instance.state,'running');assert.equal(created.body.instance.health.status,'healthy');
 assert.equal((await call(origin,'/api/instances',{cookie:cookieB})).body.instances.length,0);
 const hidden=await call(origin,'/api/instances/'+created.body.instance.id+'/stop',{cookie:cookieB,method:'POST',body:{}});
 assert.equal(hidden.status,400);assert.equal(hidden.body.error,'INSTANCE_NOT_FOUND');
 const stopped=await call(origin,'/api/instances/'+created.body.instance.id+'/stop',{cookie:cookieA,method:'POST',body:{}});
 assert.equal(stopped.status,200);assert.equal(stopped.body.instance.state,'stopped');
 const deleted=await call(origin,'/api/instances/'+created.body.instance.id,{cookie:cookieA,method:'DELETE',body:{}});
 assert.equal(deleted.status,200);assert.equal(deleted.body.instance.state,'deleted');
 assert.equal((await call(origin,'/api/instances',{cookie:cookieA})).body.instances[0].state,'deleted');
});
