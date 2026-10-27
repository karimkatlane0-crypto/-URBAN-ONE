import test from 'node:test';
import assert from 'node:assert/strict';
import {runSmoke,FRONTEND_ROUTES} from '../seva-global-live-smoke.mjs';

function mockFetch({failPath=null,unreachable=false}={}){
 return async url=>{
  if(unreachable)throw Error('synthetic network failure');
  const u=new URL(url);
  if(u.pathname==='/health')return new Response('OK',{status:200,headers:{'content-type':'text/plain'}});
  const target=FRONTEND_ROUTES.find(x=>x.path===u.pathname);
  if(!target)return new Response('Not Found',{status:404});
  if(target.path===failPath)return new Response('Unavailable',{status:503});
  const type=target.type==='html'?'text/html':target.type==='manifest'?'application/manifest+json':'text/javascript';
  const body=target.type==='manifest'
   ?JSON.stringify({name:'SEVA Global',display:'standalone',icons:[{sizes:'192x192'},{sizes:'512x512'}]})
   :'<html> '+target.contains+' test static response </html>';
  return new Response(body,{status:200,headers:{'content-type':type}});
 };
}
test('Public smoke isolates external service gates even if every file is reachable',async()=>{
 const r=await runSmoke({fetchImpl:mockFetch()});
 assert.equal(r.frontend.status,'HTTP_SMOKE_PASS');
 assert.equal(r.backend.status,'NOT_CONFIGURED');
 assert.equal(r.authenticatedOpenAI,'NOT_TESTED');
 assert.equal(r.bankCredits,'NOT_TESTED');
 assert.equal(r.androidDeviceInstall,'NOT_TESTED');
});
test('One broken frontend route fails public readiness, never declares GO',async()=>{
 const r=await runSmoke({fetchImpl:mockFetch({failPath:'/psdm.html'})});
 assert.equal(r.frontend.status,'HTTP_SMOKE_FAIL');
 assert.deepEqual(r.frontend.routes.filter(x=>!x.ok).map(x=>x.path),['/psdm.html']);
});
test('Provider failures are recorded without leaking secrets or requests',async()=>{
 const r=await runSmoke({fetchImpl:mockFetch({unreachable:true})});
 assert.equal(r.frontend.status,'HTTP_SMOKE_FAIL');
 assert.ok(r.frontend.routes.every(x=>x.classification==='NETWORK_OR_TIMEOUT_ERROR'));
});
test('Backend with syntactically valid HTTPS origin is just health, never AI authorization',async()=>{
 const r=await runSmoke({fetchImpl:mockFetch(),backendOrigin:'https://backend.example'});
 assert.equal(r.backend.status,'HTTP_HEALTH_RESPONDED');
 assert.equal(r.authenticatedOpenAI,'NOT_TESTED');
});
test('Reject invalid backend origins before making any backend request',async()=>{
 const r=await runSmoke({fetchImpl:mockFetch(),backendOrigin:'http://localhost:3000/'});
 assert.equal(r.backend.status,'INVALID_BACKEND_ORIGIN');
});
