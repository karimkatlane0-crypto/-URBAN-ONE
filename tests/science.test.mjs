import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createScienceHandler} from '../services/api/science.mjs';
const token='operator-access-token-for-tests-only';
const env={SCIENCE_API_TOKEN:token,OPENAI_API_KEY:'test-key',OPENAI_MODEL:'test-model',ANTHROPIC_API_KEY:'test-key',ANTHROPIC_MODEL:'test-model',GEMINI_API_KEY:'test-key',GEMINI_MODEL:'test-model',XAI_API_KEY:'test-key',XAI_MODEL:'test-model'};
const request=(overrides={})=>({method:'POST',path:'/api/science/run',headers:{authorization:'Bearer '+token},body:{prompt:'Test a scientific hypothesis',providers:['openai'],consent:true},env,...overrides});

test('science fails closed before credentials are configured or consent is present',async()=>{
 let calls=0;const h=createScienceHandler({fetchImpl:async()=>{calls++;throw Error();}});
 assert.equal((await h(request({env:{}}))).status,503);
 assert.equal((await h(request({headers:{}}))).status,401);
 for(const body of [null,[],{}, {prompt:'x',providers:['openai'],consent:false},{prompt:'x',providers:['__proto__'],consent:true},{prompt:'x',providers:['openai','openai'],consent:true},{prompt:'x'.repeat(12001),providers:['openai'],consent:true}])assert.equal((await h(request({body}))).status,400);
 assert.equal(calls,0);
});
test('status describes configuration without leaking secrets or claiming live access',async()=>{
 const h=createScienceHandler();const r=await h({method:'GET',path:'/api/science/status',env});
 assert.equal(r.body.providers.length,4);assert.ok(r.body.providers.every(p=>p.state==='configured_unverified'));assert.ok(!JSON.stringify(r).includes('test-key'));
});
test('four provider HTTP contracts, normalized output and trusted endpoints',async()=>{
 const calls=[];
 const h=createScienceHandler({fetchImpl:async(url,options)=>{
  calls.push({url,options,payload:JSON.parse(options.body)});
  return {ok:true,json:async()=>url.includes('anthropic')?{content:[{type:'text',text:'claude answer'}]}:url.includes('googleapis')?{candidates:[{content:{parts:[{text:'gemini answer'}]}}]}:{output:[{content:[{type:'output_text',text:'response answer'}]}]}};
 }});
 const r=await h(request({body:{prompt:'units and assumptions',providers:['openai','claude','gemini','xai'],consent:true}}));
 assert.equal(r.body.results.length,4);assert.ok(r.body.results.every(i=>i.state==='completed'&&i.text));
 assert.equal(calls[0].url,'https://api.openai.com/v1/responses');assert.equal(calls[0].payload.store,false);assert.equal(calls[0].payload.max_output_tokens,2048);
 assert.equal(calls[1].options.headers['anthropic-version'],'2023-06-01');assert.equal(calls[1].payload.max_tokens,2048);
 assert.equal(calls[2].options.headers['x-goog-api-key'],'test-key');assert.ok(!calls[2].url.includes('test-key'));
 assert.equal(calls[3].url,'https://api.x.ai/v1/responses');
 for(const c of calls){assert.equal(c.options.redirect,'error');assert.ok(c.options.signal);}
 assert.ok(!JSON.stringify(r).includes('test-key'));
});
test('failures are isolated and upstream error bodies are never exposed',async()=>{
 const h=createScienceHandler({fetchImpl:async url=>{
  if(url.includes('anthropic'))throw Error('private-secret');
  if(url.includes('openai'))return {ok:false,status:429,json:async()=>({error:'private-secret'})};
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'ok'}]}}]})};
 }});
 const r=await h(request({body:{prompt:'x',providers:['openai','claude','gemini','xai'],consent:true},env:{...env,XAI_API_KEY:''}}));
 assert.deepEqual(r.body.results.map(i=>i.state),['provider_error','connection_failed','completed','not_configured']);assert.ok(!JSON.stringify(r).includes('private-secret'));
});
test('requests are rate limited and recover after the time window',async()=>{
 let time=100000;const h=createScienceHandler({now:()=>time,fetchImpl:async()=>({ok:true,json:async()=>({output_text:'ok'})})});
 for(let i=0;i<10;i++)assert.equal((await h(request())).status,200);
 assert.equal((await h(request())).status,429);time+=60001;assert.equal((await h(request())).status,200);
});
test('concurrency is capped and slots recover',async()=>{
 let release;const gate=new Promise(r=>{release=r;});const h=createScienceHandler({fetchImpl:async()=>{await gate;return {ok:true,json:async()=>({output_text:'ok'})};}});
 const a=h(request()),b=h(request());assert.equal((await h(request())).status,429);release();await Promise.all([a,b]);assert.equal((await h(request())).status,200);
});
test('web and Android source parity; outputs render as text and secrets are not stored',()=>{
 const web=readFileSync(new URL('../apps/web/science.html',import.meta.url),'utf8');
 assert.equal(web,readFileSync(new URL('../apps/mobile/www/science.html',import.meta.url),'utf8'));
 assert.ok(web.includes('content.textContent=item.text'));assert.doesNotMatch(web,/innerHTML|localStorage|sessionStorage|api\.openai\.com|api\.anthropic\.com/);
});
