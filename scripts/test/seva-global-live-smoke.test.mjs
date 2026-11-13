import test from 'node:test';
import assert from 'node:assert/strict';
import {runSmoke,FRONTEND_ROUTES,PUBLIC_ORIGIN} from '../seva-global-live-smoke.mjs';

function mockFetch({failPath=null,unreachable=false,manifestPatch={},manifestType='application/manifest+json',redirectPath=null,requests=[]}={}){
 return async (url,options)=>{
  requests.push({url,options});
  if(unreachable)throw Error('synthetic network failure');
  const u=new URL(url);
  if(u.pathname==='/health')return new Response('OK',{status:200,headers:{'content-type':'text/plain'}});
  const target=FRONTEND_ROUTES.find(x=>x.path===u.pathname);
  if(!target)return new Response('Not Found',{status:404});
  if(target.path===failPath)return new Response('Unavailable',{status:503});
  if(target.path===redirectPath)return new Response(null,{status:302,headers:{location:'https://historical-preview.example/'}});
  const type=target.type==='html'?'text/html':target.type==='manifest'?manifestType:'text/javascript';
  const body=target.type==='manifest'
   ?JSON.stringify({id:'/superapp',name:'SEVA Intelligence Studio · Enterprise',short_name:'SEVA',start_url:'/superapp',scope:'/',display:'standalone',icons:[192,512].map(size=>({src:'/assets/seva-icon-'+size+'.png',sizes:size+'x'+size,type:'image/png'})),...manifestPatch})
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
 assert.equal(r.accountSignIn,'NOT_TESTED');
 assert.equal(r.iOSDeviceInstall,'NOT_TESTED');
 assert.equal(r.digitalAssetLinks,'NOT_TESTED');
 assert.equal(r.releaseSigning,'NOT_TESTED');
});
test('Every public request checks the canonical Sites destination without following redirects',async()=>{
 const requests=[];
 const r=await runSmoke({fetchImpl:mockFetch({requests})});
 assert.equal(PUBLIC_ORIGIN,'https://seva.karimkatlane0.chatgpt.site');
 assert.equal(r.publicOrigin,PUBLIC_ORIGIN);
 assert.deepEqual(requests.map(({url})=>new URL(url).pathname),['/superapp','/mobile','/account','/sw.js','/superapp.webmanifest']);
 for(const {url,options} of requests){
  assert.equal(new URL(url).origin,PUBLIC_ORIGIN);
  assert.equal(options.method,'GET');assert.equal(options.redirect,'manual');assert.equal(options.cache,'no-store');
  assert.equal(options.headers,undefined);
 }
});
test('A different PWA identity, start page, icon origin or content type cannot pass as the SEVA app',async()=>{
 for(const manifestPatch of [{id:'/global'},{start_url:'/account'},{scope:'/other/'},{short_name:'Other app'},{icons:[{sizes:'192x192',src:'https://other.example/icon.png',type:'image/png'},{sizes:'512x512',src:'/assets/seva-icon-512.png',type:'image/png'}]}]){
  const r=await runSmoke({fetchImpl:mockFetch({manifestPatch})});
  assert.equal(r.frontend.status,'HTTP_SMOKE_FAIL');
  assert.deepEqual(r.frontend.routes.filter(x=>!x.ok).map(x=>x.path),['/superapp.webmanifest']);
 }
 const r=await runSmoke({fetchImpl:mockFetch({manifestType:'text/html'})});
 assert.equal(r.frontend.status,'HTTP_SMOKE_FAIL');
});
test('One broken frontend route fails public readiness, never declares GO',async()=>{
 const r=await runSmoke({fetchImpl:mockFetch({failPath:'/mobile'})});
 assert.equal(r.frontend.status,'HTTP_SMOKE_FAIL');
 assert.deepEqual(r.frontend.routes.filter(x=>!x.ok).map(x=>x.path),['/mobile']);
});
test('A redirect away from the canonical entry page is reported as an unexpected response',async()=>{
 const r=await runSmoke({fetchImpl:mockFetch({redirectPath:'/superapp'})});
 assert.equal(r.frontend.status,'HTTP_SMOKE_FAIL');
 assert.deepEqual(r.frontend.routes.filter(x=>!x.ok).map(x=>({path:x.path,status:x.status,classification:x.classification})),[{path:'/superapp',status:302,classification:'UNEXPECTED_RESPONSE'}]);
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
