import test from 'node:test';
import assert from 'node:assert/strict';
import {developerAI} from '../apps/seva-enterprise/developer-ai.mjs';
import {providerStatus} from '../packages/ai/providers.mjs';
import {integrationReadiness} from '../services/api/readiness.mjs';

const env = {OPENAI_API_KEY:'fake-test-key', OPENAI_MODEL:'test-model'};
const valid = {id:'resp_offline123',status:'completed',model:'test-model',output_text:'Verified mock output'};
const mock = (data=valid,status=200) => async (url, options) => {
  assert.equal(url,'https://api.openai.com/v1/responses');
  assert.equal(options.redirect,'error');
  assert.equal(JSON.parse(options.body).store,false);
  return {ok:status>=200&&status<300,status,json:async()=>data};
};
test('OpenAI is primary but never certified by presence of keys',()=>{
  assert.equal(providerStatus(env).primary,'openai');
  assert.equal(providerStatus(env).mode,'fail-closed');
  assert.equal(integrationReadiness(env).liveProvidersVerified,false);
});
test('offline successful response is accepted without network',async()=>{
  const result=await developerAI(null,'test',env,mock());
  assert.equal(result.provider,'OpenAI');
  assert.equal(result.verified,true);
});
test('invalid prompt and missing model fail without network',async()=>{
  let called=false;
  const send=async()=>{called=true;throw Error('unexpected');};
  await assert.rejects(developerAI(null,' ',env,send),{status:400});
  await assert.rejects(developerAI(null,'test',{OPENAI_API_KEY:'fake'},send),{status:503});
  assert.equal(called,false);
});
test('arbitrary endpoint is rejected before request',async()=>{
  let called=false;
  await assert.rejects(developerAI(null,'test',{...env,OPENAI_BASE_URL:'https://evil.example'},async()=>{called=true;}),{status:503});
  assert.equal(called,false);
});
test('incomplete, empty and invalid ID responses fail closed',async()=>{
  for(const body of [{...valid,status:'incomplete'},{...valid,output_text:''},{...valid,id:'wrong'}])
    await assert.rejects(developerAI(null,'test',env,mock(body)),{status:502});
});
test('provider error never leaks response body or secret',async()=>{
  await assert.rejects(developerAI(null,'test',env,mock({error:{message:'fake-test-key'}},401)),e=>{
    assert.equal(e.status,502);
    assert.equal(e.message.includes('fake-test-key'),false);
    return true;
  });
  await assert.rejects(developerAI(null,'test',env,mock({error:{code:'credit_balance_exhausted'}},429)),{status:503});
});
