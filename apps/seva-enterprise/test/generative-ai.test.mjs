import test from 'node:test';
import assert from 'node:assert/strict';
import {generateWithProvider,selectProvider,providerStatus} from '../generative-ai.mjs';

const configured={
  SEVA_GEMINI_ENABLED:'true',
  GEMINI_API_KEY:'synthetic-gemini-key',
  GEMINI_MODEL:'gemini-2.5-flash'
};
const simulated={
  ok:true,status:200,
  json:async()=>({
    responseId:'gemini-response-1234',
    modelVersion:'gemini-2.5-flash',
    candidates:[{finishReason:'STOP',content:{parts:[{text:'Proposed synthetic plan'}]}}]
  })
};

test('selection is explicit and never silently changes provider',()=>{
 assert.equal(selectProvider(),'openai');
 assert.equal(selectProvider('gemini'),'gemini');
 assert.throws(()=>selectProvider('Gemini'),e=>e.status===400);
 assert.throws(()=>selectProvider('auto'),e=>e.status===400);
});

test('Gemini starts disabled even with a key until model and release flag exist',()=>{
 assert.equal(providerStatus({GEMINI_API_KEY:'synthetic',GEMINI_MODEL:'gemini-2.5-flash'}).gemini,false);
 assert.equal(providerStatus({...configured,SEVA_GEMINI_ENABLED:'false'}).gemini,false);
 assert.equal(providerStatus({...configured,GEMINI_MODEL:'not-gemini'}).gemini,false);
 assert.equal(providerStatus(configured).gemini,true);
});

test('disabled Gemini never makes a network call',async()=>{
 let calls=0;
 await assert.rejects(()=>generateWithProvider({},'Test','gemini',
  {...configured,SEVA_GEMINI_ENABLED:'false'},async()=>{calls++;return simulated;}),
  e=>e.status===503);
 assert.equal(calls,0);
});

test('Gemini generates via fixed official endpoint with only the typed text',async()=>{
 let captured;
 const result=await generateWithProvider(
  {id:'private-user',email:'private@example.test'},'Build a plan','gemini',configured,
  async(url,options)=>{captured={url,options};return simulated;});
 assert.equal(captured.url,
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
 assert.equal(captured.options.headers['x-goog-api-key'],'synthetic-gemini-key');
 assert.ok(!captured.url.includes('synthetic'));
 const request=JSON.parse(captured.options.body);
 assert.equal(request.contents[0].parts[0].text,'Build a plan');
 assert.equal(request.generationConfig.candidateCount,1);
 assert.equal(request.generationConfig.maxOutputTokens,900);
 assert.doesNotMatch(captured.options.body,/private-user|private@example.test|student data|payment data/);
 assert.equal(result.provider,'Gemini');
 assert.equal(result.text,'Proposed synthetic plan');
 assert.equal(result.id,'gemini-response-1234');
});

test('Gemini missing provider trace ID fails closed',async()=>{
 await assert.rejects(()=>generateWithProvider({},'Plan','gemini',configured,
  async()=>({...simulated,json:async()=>({
    candidates:[{finishReason:'STOP',content:{parts:[{text:'Text'}]}}]
  })})),
 e=>e.status===502&&/trace ID/.test(e.message));
});

test('Gemini blocked content cannot be presented as a completed plan',async()=>{
 await assert.rejects(()=>generateWithProvider({},'Plan','gemini',configured,
  async()=>({...simulated,json:async()=>({
    responseId:'trace-blocked',
    candidates:[{finishReason:'SAFETY',content:{parts:[{text:'Blocked'}]}}]
  })})),e=>e.status===502);
});

test('Gemini rate limits hide provider details and stop without fallback',async()=>{
 let calls=0;
 await assert.rejects(()=>generateWithProvider({},'Plan','gemini',configured,
  async()=>{calls++;return {ok:false,status:429,json:async()=>({
    error:{status:'RESOURCE_EXHAUSTED',message:'Never echo this private detail'}
  })};}),e=>e.status===503&&!e.message.includes('private detail'));
 assert.equal(calls,1);
});

test('Gemini transport failures are sanitized',async()=>{
 await assert.rejects(()=>generateWithProvider({},'Plan','gemini',configured,
  async()=>{throw Error('Bearer sensitive secret');}),
  e=>e.status===502&&!e.message.includes('secret'));
});

test('OpenAI adapter remains the default and uses its original consented payload',async()=>{
 let called;
 const result=await generateWithProvider({id:'user'},'Plan','openai',{
  OPENAI_API_KEY:'synthetic-openai-key',OPENAI_MODEL:'synthetic-model'
 },async(url,options)=>{
  called={url,options};return {ok:true,json:async()=>({
   id:'resp_synthetic',model:'synthetic-model',output_text:'Mock reply'
  })};
 });
 assert.equal(result.provider,'OpenAI');
 assert.equal(called.url,'https://api.openai.com/v1/responses');
 assert.equal(JSON.parse(called.options.body).store,false);
});
