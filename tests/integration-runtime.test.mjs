import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {route} from '../services/api/router.mjs';
import {serveWeb} from '../services/api/web.mjs';

test('readiness distinguishes configured credentials from verified execution and never returns secrets', () => {
  const response = route({path:'/api/integrations/readiness'}, {OPENAI_API_KEY:'private-key', STRIPE_WEBHOOK_SECRET:'private-webhook'});
  assert.equal(response.status,200);
  assert.equal(response.body.liveProvidersVerified,false);
  assert.equal(response.body.items.find(x=>x.id==='openai').state,'configured_not_verified');
  assert.equal(response.body.items.find(x=>x.id==='gemini').state,'configuration_required');
  assert.equal(response.body.items.find(x=>x.id==='fabrick').state,'offline_mock_only');
  assert.doesNotMatch(JSON.stringify(response),/private-key|private-webhook/);
});

test('same-origin runtime serves the app and assets while withholding repository files', async t => {
  const server=http.createServer(async(req,res)=>{
    if(await serveWeb(req,res,new URL(req.url,'http://localhost').pathname))return;
    const result=route({method:req.method,path:req.url});
    res.writeHead(result.status,{'content-type':'application/json'});res.end(JSON.stringify(result.body));
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base='http://127.0.0.1:'+server.address().port;
  const home=await fetch(base+'/');
  assert.equal(home.status,200);assert.match(home.headers.get('content-type'),/text\/html/);
  assert.match(await home.text(),/checkIntegrations/);
  assert.equal((await fetch(base+'/europe.css')).status,200);
  const head=await fetch(base+'/index.html',{method:'HEAD'});assert.equal(await head.text(),'');
  for(const path of ['/.env','/package.json','/services/api/server.mjs','/assets/../../README.md','/missing.html']){
    assert.equal((await fetch(base+path)).status,404,path);
  }
  assert.equal((await fetch(base+'/api/integrations/readiness')).status,200);
  assert.equal((await fetch(base+'/api/contacts/import-preview',{method:'POST'})).status,403);
});
