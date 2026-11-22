import test from 'node:test';
import assert from 'node:assert/strict';
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
    assert.equal(response.status,403);
    assert.equal((await response.json()).error,'FORBIDDEN');
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
