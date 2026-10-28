import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

function collect(stream){
  let value='';
  stream.setEncoding('utf8');
  stream.on('data',chunk=>{value+=chunk});
  return ()=>value;
}

test('OpenAI smoke client sends the expected secure Responses API request', async()=>{
  let observed=null;
  const server=http.createServer(async(req,res)=>{
    const chunks=[];
    for await(const chunk of req) chunks.push(chunk);
    const raw=Buffer.concat(chunks).toString('utf8');
    observed={
      method:req.method,
      url:req.url,
      authorization:req.headers.authorization,
      contentType:req.headers['content-type'],
      body:JSON.parse(raw),
    };
    res.writeHead(200,{'content-type':'application/json'});
    res.end(JSON.stringify({
      id:'resp_test_urban_one',
      model:'test-model',
      output:[{content:[{type:'output_text',text:'URBAN_ONE_OPENAI_OK'}]}],
    }));
  });

  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const address=server.address();
  assert.ok(address&&typeof address==='object');

  const child=spawn(process.execPath,['scripts/openai-smoke.mjs'],{
    cwd:new URL('..',import.meta.url),
    env:{
      ...process.env,
      OPENAI_API_KEY:'test-runtime-token',
      OPENAI_MODEL:'test-model',
      NODE_ENV:'test',
      OPENAI_BASE_URL:`http://127.0.0.1:${address.port}/v1`,
    },
    stdio:['ignore','pipe','pipe'],
  });
  const stdout=collect(child.stdout);
  const stderr=collect(child.stderr);
  const [code]=await once(child,'close');
  server.close();
  await once(server,'close');

  assert.equal(code,0,stderr());
  assert.ok(observed);
  assert.equal(observed.method,'POST');
  assert.equal(observed.url,'/v1/responses');
  assert.equal(observed.authorization,'Bearer test-runtime-token');
  assert.equal(observed.contentType,'application/json');
  assert.equal(observed.body.model,'test-model');
  assert.equal(observed.body.input,'Reply with exactly: URBAN_ONE_OPENAI_OK');
  assert.equal(observed.body.store,false);
  assert.equal(observed.body.max_output_tokens,32);

  const result=JSON.parse(stdout().trim());
  assert.equal(result.ok,true);
  assert.equal(result.provider,'openai');
  assert.equal(result.model,'test-model');
  assert.equal(result.responseId,'resp_test_urban_one');
  assert.equal(result.output,'URBAN_ONE_OPENAI_OK');
  assert.equal(stdout().includes('test-runtime-token'),false);
  assert.equal(stderr().includes('test-runtime-token'),false);
});

async function probe(overrides) {
  const child=spawn(process.execPath,['scripts/openai-smoke.mjs'],{
    cwd:new URL('..',import.meta.url),
    env:{
      ...process.env,
      NODE_ENV:'test',
      OPENAI_API_KEY:'test-runtime-token',
      OPENAI_MODEL:'test-model',
      ...overrides
    },
    stdio:['ignore','pipe','pipe'],
  });
  const stdout=collect(child.stdout);
  const stderr=collect(child.stderr);
  const [code]=await once(child,'close');
  return {code,stdout:stdout(),stderr:stderr()};
}

test('smoke refuses a successful provider response without response id',async()=>{
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'content-type':'application/json'});
    res.end(JSON.stringify({output_text:'URBAN_ONE_OPENAI_OK',model:'test-model'}));
  });
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const addr=server.address();
  try {
    const result=await probe({OPENAI_BASE_URL:`http://127.0.0.1:${addr.port}/v1`});
    assert.equal(result.code,1);
    assert.match(result.stderr,/OPENAI_RESPONSE_ID_REQUIRED/);
    assert.equal(result.stdout,'');
  } finally {
    server.close();
    await once(server,'close');
  }
});

test('smoke rejects nonofficial API destinations before sending credentials',async()=>{
  const result=await probe({OPENAI_BASE_URL:'https://example.invalid/v1'});
  assert.equal(result.code,2);
  assert.match(result.stderr,/OPENAI_BASE_URL_REJECTED/);
  assert.equal(result.stdout,'');
});

test('smoke requires configured model instead of guessing model id',async()=>{
  const result=await probe({OPENAI_MODEL:'',OPENAI_BASE_URL:'https://api.openai.com/v1'});
  assert.equal(result.code,2);
  assert.match(result.stderr,/OPENAI_MODEL_REQUIRED/);
});

test('smoke requires a server-side API credential',async()=>{
  const result=await probe({OPENAI_API_KEY:'',OPENAI_BASE_URL:'https://api.openai.com/v1'});
  assert.equal(result.code,2);
  assert.match(result.stderr,/OPENAI_API_KEY_REQUIRED/);
});
