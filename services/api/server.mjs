import {handleScienceApi} from './science.mjs';
import http from 'node:http';
import {route} from './router.mjs';
import {handleStripeWebhook} from './stripe-webhook.mjs';
import {serveWeb} from './web.mjs';
import {handlePoleApi} from './pole-http.mjs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const headers={'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'};

/**
 * Create the HTTP API server.
 * authenticate must be a trusted adapter that verifies credentials and resolves
 * membership/scopes server-side. It receives headers only, never request JSON.
 * The default intentionally denies protected routes until a platform IAM adapter
 * is explicitly supplied by the runtime composition layer.
 */
export function createApiServer({env=process.env, authenticate=async()=>null}={}) {
  const server=http.createServer(async(req,res)=>{
    try{
      const path=new URL(req.url,'http://localhost').pathname;
      const limit=path==='/api/stripe/webhook'?1024*1024:64*1024;
      let size=0;
      const chunks=[];
      for await(const chunk of req){
        size+=chunk.length;
        if(size>limit){res.writeHead(413,headers);res.end(JSON.stringify({error:'PAYLOAD_TOO_LARGE'}));return;}
        chunks.push(chunk);
      }
      const rawBody=Buffer.concat(chunks);
      if(await serveWeb(req,res,path))return;

      if(path.startsWith('/api/science/')){
        let body={};
        if(rawBody.length){try{body=JSON.parse(rawBody.toString('utf8'));}catch{res.writeHead(400,headers);res.end(JSON.stringify({error:'INVALID_JSON'}));return;}}
        const result=await handleScienceApi({method:req.method,path,headers:req.headers,body,env});
        res.writeHead(result.status,headers);res.end(JSON.stringify(result.body));return;
      }
      if(path.startsWith('/api/pole/')){
        let body={};
        if(rawBody.length){
          try{body=JSON.parse(rawBody.toString('utf8'));}
          catch{res.writeHead(400,headers);res.end(JSON.stringify({error:'INVALID_JSON'}));return;}
        }
        if(!body||typeof body!=='object'||Array.isArray(body)){
          res.writeHead(400,headers);res.end(JSON.stringify({error:'INVALID_JSON'}));return;
        }
        const result=await handlePoleApi({method:req.method,path,headers:req.headers,body,env});
        res.writeHead(result.status,headers);res.end(JSON.stringify(result.body));return;
      }
      if(req.method==='POST'&&path==='/api/stripe/webhook'){
        const r=handleStripeWebhook({rawBody,headers:req.headers,env});
        res.writeHead(r.status,headers);res.end(JSON.stringify(r.body));return;
      }

      let body={};
      if(rawBody.length){
        try{body=JSON.parse(rawBody.toString('utf8'));}
        catch{res.writeHead(400,headers);res.end(JSON.stringify({error:'INVALID_JSON'}));return;}
      }
      // Identity is derived exclusively by the trusted adapter from request headers.
      // Request body fields such as userId, tenantId, role and scopes are never authority.
      let auth=null;
      try{auth=await authenticate({headers:req.headers,method:req.method,path,env});}
      catch{res.writeHead(401,headers);res.end(JSON.stringify({error:'AUTHENTICATION_FAILED'}));return;}
      if(auth!==null&&(!auth||typeof auth.userId!=='string'||!auth.userId||!Array.isArray(auth.scopes))){
        res.writeHead(401,headers);res.end(JSON.stringify({error:'AUTHENTICATION_FAILED'}));return;
      }
      const r=route({method:req.method,path,body,auth},env);
      res.writeHead(r.status,headers);
      res.end(JSON.stringify(r.body));
    }catch(e){
      const forbidden=['AUTH_REQUIRED','FORBIDDEN','CONSENT_REQUIRED','CONSENT_PURPOSE_MISMATCH','PROVENANCE_REQUIRED'];
      const badRequest=['STRIPE_WEBHOOK_SECRET_REQUIRED','STRIPE_SIGNATURE_INVALID','STRIPE_SIGNATURE_STALE','STRIPE_EVENT_JSON_INVALID','STRIPE_EVENT_INVALID'];
      const code=forbidden.includes(e.message)?403:badRequest.includes(e.message)?400:500;
      res.writeHead(code,headers);
      res.end(JSON.stringify({error:code===500?'INTERNAL_SERVER_ERROR':e.message}));
    }
  });
  return server;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||8787);
  // No platform IAM adapter is configured in this entry point yet. Protected
  // routes therefore remain denied; do not infer authentication from request JSON.
  createApiServer().listen(port,()=>console.log('URBAN ONE UNIVERSAL API '+port));
}
