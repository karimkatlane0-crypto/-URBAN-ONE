import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {createApiServer} from '../services/api/server.mjs';

async function withServer(options, run){
  const server=createApiServer(options);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  try{return await run(`http://127.0.0.1:${address.port}`);}
  finally{await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
}

test('API server serves health without an identity provider',async()=>{
  await withServer({},async base=>{
    const response=await fetch(base+'/health');
    assert.equal(response.status,200);
    assert.equal((await response.json()).ok,true);
  });
});

test('request JSON cannot impersonate an authenticated principal',async()=>{
  await withServer({},async base=>{
    const response=await fetch(base+'/api/contacts/import-preview',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({userId:'attacker',tenantId:'tenant-victim',scopes:['contacts:read'],records:[]})
    });
    assert.equal(response.status,401);
    assert.equal((await response.json()).error,'AUTH_REQUIRED');
  });
});

test('trusted authentication adapter can authorize a synthetic test principal',async()=>{
  let received;
  await withServer({
    authenticate:async({headers,method,path})=>{
      received={authorization:headers.authorization,method,path};
      return {userId:'synthetic-user-a',tenantId:'synthetic-tenant-a',scopes:['contacts:read']};
    }
  },async base=>{
    const response=await fetch(base+'/api/contacts/import-preview',{
      method:'POST',headers:{'content-type':'application/json','authorization':'Bearer synthetic-test-token'},
      body:JSON.stringify({records:[]})
    });
    assert.equal(response.status,200);
    assert.deepEqual(received,{authorization:'Bearer synthetic-test-token',method:'POST',path:'/api/contacts/import-preview'});
  });
});

test('authentication adapter failure fails closed',async()=>{
  await withServer({authenticate:async()=>{throw new Error('invalid token');}},async base=>{
    const response=await fetch(base+'/api/contacts/import-preview',{method:'POST',headers:{'content-type':'application/json'},body:'{"records":[]}'});
    assert.equal(response.status,401);
    assert.equal((await response.json()).error,'AUTHENTICATION_FAILED');
  });
});

test('malformed JSON is rejected before route execution',async()=>{
  await withServer({},async base=>{
    const response=await fetch(base+'/api/universal/prepare',{method:'POST',headers:{'content-type':'application/json'},body:'{'});
    assert.equal(response.status,400);
    assert.equal((await response.json()).error,'INVALID_JSON');
  });
});

test('authenticated principal without required scope is forbidden',async()=>{
  await withServer({authenticate:async()=>({userId:'synthetic-user-a',scopes:['profile:read']})},async base=>{
    const response=await fetch(base+'/api/contacts/import-preview',{method:'POST',headers:{'content-type':'application/json'},body:'{"records":[]}'});
    assert.equal(response.status,403);
    assert.equal((await response.json()).error,'FORBIDDEN');
  });
});


test('Stripe webhook endpoint returns retryable 503 until a durable event store is configured',async()=>{
  const secret='whsec_api_test_secret';
  const timestamp=Math.floor(Date.now()/1000);
  const payload=Buffer.from(JSON.stringify({
    id:'evt_api_store_missing',
    type:'invoice.paid',
    livemode:false,
    data:{object:{id:'in_api_store_missing'}}
  }));
  const digest=createHmac('sha256',secret).update(String(timestamp)).update('.').update(payload).digest('hex');
  await withServer({env:{STRIPE_WEBHOOK_SECRET:secret}},async base=>{
    const response=await fetch(base+'/api/stripe/webhook',{
      method:'POST',
      headers:{'content-type':'application/json','stripe-signature':`t=${timestamp},v1=${digest}`},
      body:payload
    });
    assert.equal(response.status,503);
    assert.equal((await response.json()).error,'STRIPE_EVENT_STORE_UNAVAILABLE');
  });
});
