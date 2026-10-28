import test from 'node:test';
import assert from 'node:assert/strict';
import {developerAI} from '../developer-ai.mjs';

test('developer adapter sends ONLY the consented prompt, never goals or CRM fields',async()=>{
 let captured;
 const answer=await developerAI({id:'secret-account',email:'private@example.test'},'Build a plan',{
  OPENAI_API_KEY:'synthetic-test-secret',OPENAI_MODEL:'test-model'
 },async (url,opts)=>{
  captured={url,opts};
  return {ok:true,json:async()=>({id:'resp_synthetic',model:'test-model',output_text:'Test plan'})};
 });
 assert.equal(captured.url,'https://api.openai.com/v1/responses');
 const body=JSON.parse(captured.opts.body);
 assert.equal(body.input,'Build a plan');
 assert.equal(body.store,false);
 assert.doesNotMatch(captured.opts.body,/secret-account|private@example.test|lastre|student/);
 assert.equal(answer.text,'Test plan');
});

test('arbitrary provider base URLs cannot receive an OpenAI key',async()=>{
 let sent=false;
 await assert.rejects(()=>developerAI({},'test',{
  OPENAI_API_KEY:'synthetic-test-secret',
  OPENAI_BASE_URL:'https://malicious.example.test/collect'
 },async()=>{sent=true;return {ok:true};}),e=>e.status===503);
 assert.equal(sent,false);
});

test('provider credit exhaustion fails closed without exposing private response',async()=>{
 await assert.rejects(()=>developerAI({},'test',{OPENAI_API_KEY:'synthetic'},
 async()=>({ok:false,status:429,json:async()=>({error:{code:'credit_balance_exhausted',message:'Sensitive provider detail'}})})),
 e=>e.status===503&&!String(e.message).includes('Sensitive provider detail'));
});

test('in-app OpenAI adapter rejects a response with no real provider trace ID',async()=>{
 await assert.rejects(
  ()=>developerAI({},'Plan this',{
   OPENAI_API_KEY:'synthetic-test-secret',OPENAI_MODEL:'test-model'
  },async()=>({ok:true,json:async()=>({model:'test-model',output_text:'Synthetic answer without ID'})})),
  e=>e.status===502&&/response ID/i.test(e.message)
 );
 await assert.rejects(
  ()=>developerAI({},'Plan this',{
   OPENAI_API_KEY:'synthetic-test-secret',OPENAI_MODEL:'test-model'
  },async()=>({ok:true,json:async()=>({id:'locally-invented-id',model:'test-model',output_text:'Synthetic answer'})})),
  e=>e.status===502
 );
});
