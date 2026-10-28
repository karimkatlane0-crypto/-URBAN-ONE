import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const script=await readFile(new URL('../public/studio.js',import.meta.url),'utf8');
function jsonResponse(value,status=200,type='application/json; charset=utf-8'){
 return {ok:status>=200&&status<300,status,headers:{get:()=>type},json:async()=>value};
}
function mockClient(fetchImpl) {
 const elements=new Map();
 function element() {
  const classes=new Set();
  return {
   value:'',checked:false,disabled:false,textContent:'',hidden:false,children:[],
   listeners:Object.create(null),
   classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
   appendChild(node){this.children.push(node);return node;},
   replaceChildren(...nodes){this.children=[...nodes];},
   addEventListener(name,fn){this.listeners[name]=fn;},
   setAttribute(){},
   scrollTop:0,scrollHeight:0
  };
 }
 const get=id=>{
  if(!elements.has(id))elements.set(id,element());
  return elements.get(id);
 };
 get('checkout').disabled=true;
 get('ai-provider').value='openai';
 const ctx={
  document:{getElementById:get,createElement:element},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  crypto:{randomUUID:()=> 'test-uuid'},
  fetch:fetchImpl,
  window:{location:{assign(){throw Error('Unexpected redirect');}}},
  alert:()=>{throw Error('Unexpected alert')}
 };
 runInNewContext(script,ctx,{filename:'studio.js'});
 return {get,settle:()=>new Promise(resolve=>setImmediate(resolve))};
}
test('static HTML fallback with 200 must never imply live SEVA backend',async()=>{
 const calls=[];
 const client=mockClient(async(path)=>{
  calls.push(path);
  // This simulates a CDN rewrite to index.html for a missing API.
  return {ok:true,status:200,headers:{get:()=> 'text/html; charset=utf-8'},
   json:async()=>{throw Error('HTML is not JSON');}};
 });
 await client.settle();
 assert.deepEqual(calls,['/health']);
 assert.equal(client.get('service-dot').classList.contains('online'),false);
 assert.match(client.get('service-state').textContent,/non verificato/);
 assert.equal(client.get('checkout').disabled,true);
 client.get('ai-prompt').value='Do not transmit';
 client.get('ai-consent').checked=true;
 await client.get('ai-form').listeners.submit({preventDefault(){}});
 assert.deepEqual(calls,['/health']);
});
test('valid health and SEVA status are both required before claiming online',async()=>{
 const calls=[];
 const client=mockClient(async(path)=>{
  calls.push(path);
  if(path==='/health')return jsonResponse({ok:true,service:'unknown'});
  return jsonResponse({name:'SEVA',generativeProviders:{openai:true,gemini:true},salesEnabled:false});
 });
 await client.settle();
 assert.deepEqual(calls,['/health']);
 assert.equal(client.get('service-dot').classList.contains('online'),false);
});
test('live reply preserves provider selection and displays provenance without markup',async()=>{
 const calls=[];
 let completeAI;
 const client=mockClient(async(path,options)=>{
  calls.push({path,options});
  if(path==='/health')return jsonResponse({ok:true,service:'seva'});
  if(path==='/api/public/status')return jsonResponse({
   name:'SEVA',salesEnabled:false,generativeProviders:{openai:true,gemini:true}
  });
  if(path==='/api/me')return jsonResponse({user:{email:'synthetic@example.test'},access:true});
  if(path==='/api/ai/generate')return new Promise(resolve=>{completeAI=resolve;});
  throw Error('Unexpected HTTP request '+path);
 });
 await client.settle();
 assert.equal(client.get('service-dot').classList.contains('online'),true);
 client.get('ai-provider').value='gemini';
 client.get('ai-prompt').value='Propose steps';
 client.get('ai-consent').checked=true;
 const pending=client.get('ai-form').listeners.submit({preventDefault(){}});
 assert.equal(client.get('ai-provider').disabled,true);
 assert.equal(client.get('send-ai').disabled,true);
 const before=calls.length;
 await client.get('ai-form').listeners.submit({preventDefault(){}});
 assert.equal(calls.length,before,'second request refused while pending');
 const req=calls.find(x=>x.path==='/api/ai/generate');
 assert.deepEqual(JSON.parse(req.options.body),{prompt:'Propose steps',consent:true,provider:'gemini'});
 completeAI(jsonResponse({
  provider:'Gemini',model:'gemini-synthetic',id:'gemini-trace-0001',
  text:'Synthetic steps: no external actions'
 }));
 await pending;
 assert.equal(client.get('ai-provider').disabled,false);
 assert.equal(client.get('ai-consent').checked,false);
 const messages=client.get('chat-log').children;
 const latest=messages[messages.length-1].children[1].children[1].textContent;
 assert.match(latest,/Fonte: Gemini/);
 assert.match(latest,/gemini-trace-0001/);
 assert.match(latest,/Synthetic steps/);
});
