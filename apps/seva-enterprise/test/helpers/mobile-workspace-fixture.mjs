// SYNTHETIC TEST ONLY. In-memory database and loopback; never uses user/provider credentials.
import {DatabaseSync} from 'node:sqlite';
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createMobileHandler,initMobileSchema} from '../../mobile-sync-api.mjs';
import {mobileSessionAuthenticator} from '../../mobile-sync-session.mjs';
import {createMobileUiHandler} from '../../mobile-sync-ui.mjs';
import {MobileClient} from '../../mobile-crm/client.mjs';
export async function startFixture(options={}) {
  const db=new DatabaseSync(':memory:');initMobileSchema(db);
  const sessions=new Map(),tokens={};
  for(const [subject,tenant,role] of [['alpha','space-a','owner'],['bravo','space-b','operator'],['reader','space-a','viewer']]){
    db.prepare('INSERT INTO mobile_subjects VALUES(?,?,?,1)').run(subject,tenant,role);
    const token=randomBytes(32).toString('hex');tokens[subject]=token;sessions.set(token,{id:subject});
  }
  for(const tenant of ['space-a','space-b'])db.prepare('INSERT INTO mobile_sources VALUES(?,?,?,1)').run(tenant,'test-owned','synthetic-fixture-only');
  let handler;const ui=createMobileUiHandler();
  const server=createServer(async(req,res)=>{if(ui(req,res))return;if(!await handler(req,res)){res.writeHead(404);res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin='http://127.0.0.1:'+server.address().port;
  const key=randomBytes(32);
  handler=createMobileHandler({db,authenticate:mobileSessionAuthenticator({fromSession:token=>sessions.get(token)||null}),
    signingKey:key,allowedOrigin:origin,enabled:true,requireScopeBinding:true,rateLimit:10000,...options});
  const calls=[];
  const raw=async(path,{method='GET',data,scope,actor='alpha',headers={}}={})=>{
    const res=await fetch(origin+path,{method,headers:{origin,...(tokens[actor]?{cookie:'seva_session='+tokens[actor]}:{}),
      ...(data?{'Content-Type':'application/json'}:{}),...(scope?{'X-SEVA-Mobile-Scope':scope}:{}),...headers},
      ...(data?{body:JSON.stringify(data)}:{})});
    return {status:res.status,headers:res.headers,body:(res.headers.get('content-type')||'').includes('application/json')?await res.json():await res.text()};
  };
  const makeClient=(actor='alpha',intercept)=>new MobileClient({origin,fetchImpl:async(url,init)=>{
    calls.push({url,method:init.method,credentials:init.credentials,mode:init.mode,redirect:init.redirect});
    const real=()=>fetch(url,{...init,headers:{...init.headers,origin,cookie:'seva_session='+tokens[actor]}});
    return intercept?intercept(url,init,real):real();
  }});
  return {db,server,origin,key,tokens,sessions,calls,raw,makeClient,close:async()=>{await new Promise(r=>server.close(r));db.close();}};
}
if(process.env.SEVA_RUN_SYNTHETIC_BROWSER_TEST==='true'&&process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const f=await startFixture();console.log(JSON.stringify({origin:f.origin,tokens:f.tokens}));
  process.once('SIGTERM',async()=>{await f.close();process.exit(0);});
}
