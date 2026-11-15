import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import worker from '../worker/index.js';
import {withSevaExperience,bindSevaExperience,sevaLanguageURL} from '../src/experience.js';

const origin='https://seva.test';
const get=(path,method='GET',headers={})=>worker.fetch(new Request(origin+path,{method,headers}));

test('language navigation opens translated public pages and keeps workspace details private',async()=>{
  assert.equal(sevaLanguageURL(origin+'/studio',false),'/studio?lang=en');
  assert.equal(sevaLanguageURL(origin+'/global?lang=en',true),'/global?lang=it');
  assert.equal(sevaLanguageURL(origin+'/app?section=search&mode=offer&sector=auto&private=SECRET',false),'/global?lang=en');
  const response=await get('/app?section=search&mode=offer&sector=auto','GET',{'oai-authenticated-user-id':'experience-synthetic-account'});
  const html=await response.text();
  const header=html.match(/<header id="seva-experience"[\s\S]*?<\/header>/)[0];
  const languageLinks=[...header.matchAll(/<a\b[^>]*data-seva-language[^>]*href="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(languageLinks,['/global?lang=en']);
  assert.match(header,/English · panoramica pubblica/);
  assert.match(header,/Alcune aree operative restano in italiano/);
});

test('all entry views use one build, real logo and action menu without reflecting private query data',async()=>{
  const info=await (await get('/api/experience')).json();
  assert.equal(info.name,'SYNAPSY');assert.match(info.build,/^[a-f0-9]{16}$/);
  for(const path of ['/global','/funzionalita','/studio','/app?section=service']){
    const response=await get(path+(path.includes('?')?'&':'?')+'private=PRIVATE_QUERY_MARKER', 'GET',{'oai-authenticated-user-id':'experience-synthetic-account'});
    assert.equal(response.status,200,path);
    const html=await response.text();
    assert.equal((html.match(/<header id="seva-experience"/g)||[]).length,1);
    assert(html.includes('data-build="'+info.build+'"'));
    assert.match(html, /<title>[^<]+<\/title>/);
    assert(!html.includes('<title>undefined</title>'));
    const header=html.match(/<header id="seva-experience"[\s\S]*?<\/header>/)[0];
    assert(header.includes('src="/assets/seva-logo.png"'));
    assert(header.includes('di Karim Katlane'));
    assert(!header.includes('PRIVATE_QUERY_MARKER'));
    for(const target of ['/app?section=home','/app?section=crm','/kkubera','/studio/diritti','/music','/titans/operazioni'])assert(header.includes('href="'+target+'"'));
    for(const [,attrs,script] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!attrs.includes('json'))assert.doesNotThrow(()=>new Script(script));
    assert.equal((await get(path,'HEAD',{'oai-authenticated-user-id':'experience-synthetic-account'})).status,200);
  }
  const noAccount=await get('/app?section=service');assert.equal(noAccount.status,302);
  assert.match(noAccount.headers.get('location'),/^\/signin-with-chatgpt\?/);
  assert.equal((await get('/api/experience','POST')).status,405);
  const head=await get('/api/experience','HEAD');assert.equal(await head.text(),'');
  const raw='<html lang="it"><head><title>Original</title></head><body><main>Work</main></body></html>';
  const once=withSevaExperience(raw,origin+'/global');assert(once.includes('<title>Original</title>'));assert.equal(withSevaExperience(once,origin+'/global'),once);
});

test('historical release links converge and preserve useful deep links without redirecting writes',async()=>{
  for(const release of ['v150','v200','v201'])for(const [suffix,target] of [['','/superapp'],['/arena','/arena'],['/studio','/studio'],['/app','/app']]){
    const path='/'+release+suffix+'?lang=en'+(suffix==='/app'?'&section=service':'');
    const response=await get(path);assert.equal(response.status,308,path);
    assert.equal(response.headers.get('location'),target+'?lang=en'+(suffix==='/app'?'&section=service':''));
    assert.equal((await get(path,'HEAD')).status,308);
    assert.notEqual((await get(path,'POST')).status,308);
  }
  assert.equal((await get('/v999')).headers.get('location'),'/superapp');
  assert.equal((await get('/api/v201')).status,404);
});

test('release notification reads public metadata only and never reloads an unfinished page automatically',async()=>{
  const keys=['document','window','location','localStorage','fetch','setInterval','clearInterval'];
  const previous=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
  const events={},calls=[];let reloads=0;
  function element(){return {hidden:true,open:false,value:'',textContent:'',addEventListener(k,f){this[k]=f;},setAttribute(){},removeAttribute(){},querySelectorAll(){return [];},querySelector(){return {focus(){}};}};}
  const nodes=Object.fromEntries(['seva-experience','seva-tool-menu','seva-tool-search','seva-tool-count','seva-unified-theme','seva-update','seva-update-refresh'].map(k=>[k,element()]));
  try{
    globalThis.document={getElementById:k=>nodes[k],documentElement:{lang:'it',dataset:{}},visibilityState:'visible',addEventListener(k,f){events[k]=f;}};
    globalThis.window={addEventListener(k,f){events[k]=f;}};
    globalThis.location={href:origin+'/studio',reload(){reloads++;}};
    globalThis.localStorage={getItem(){return null;},setItem(){}};
    globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
    globalThis.fetch=async(path,options)=>{calls.push({path,options});return Response.json({name:'SEVA Intelligence Studio',build:'bbbbbbbbbbbbbbbb'});};
    bindSevaExperience('aaaaaaaaaaaaaaaa');
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(calls.length,1);assert.equal(calls[0].path,'/api/experience');assert.equal(calls[0].options.credentials,'omit');
    assert.equal(nodes['seva-update'].hidden,false);assert.equal(reloads,0);
    nodes['seva-update-refresh'].click();assert.equal(reloads,1);
    assert.equal(Object.keys(document.documentElement.dataset).includes('scope'),false);
  }finally{for(const [key,value]of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});

test('shared release observer is a revalidated script using the page build without bloating each document',async()=>{
  const html=await(await get('/superapp')).text();
  const info=await(await get('/api/experience')).json();
  assert(html.includes('/assets/seva-experience.js?v='+info.build));
  assert.match(html,/<script defer src="\/assets\/seva-experience\.js[^>]+onerror=/);
  assert(html.includes('Controllo versione non disponibile.'));
  assert(!html.includes('async function checkRelease('));
  const response=await get('/assets/seva-experience.js?v='+info.build);
  assert.equal(response.status,200);
  assert.match(response.headers.get('Content-Type'),/^application\/javascript/);
  assert.match(response.headers.get('Cache-Control'),/must-revalidate/);
  const script=await response.text();
  assert.doesNotThrow(()=>new Script(script));
  assert(script.includes('dataset.build'));
  assert(script.includes("fetch('/api/experience'"));
  assert.equal(await(await get('/assets/seva-experience.js','HEAD')).text(),'');
  assert.equal((await get('/assets/seva-experience.js','POST')).status,405);
});
