import http from 'node:http';
import {route} from './router.mjs';
import {handleStripeWebhook} from './stripe-webhook.mjs';
import {serveWeb} from './web.mjs';

const port=Number(process.env.PORT||8787);

const server=http.createServer(async(req,res)=>{
  const chunks=[];for await(const c of req)chunks.push(c);
  const rawBody=Buffer.concat(chunks);
  const path=new URL(req.url,'http://localhost').pathname;

  try{
    if(await serveWeb(req,res,path)) return;
    if(req.method==='POST'&&path==='/api/stripe/webhook'){
      const r=handleStripeWebhook({rawBody,headers:req.headers,env:process.env});
      res.writeHead(r.status,{'content-type':'application/json'});
      res.end(JSON.stringify(r.body));
      return;
    }

    let body={};
    if(rawBody.length){try{body=JSON.parse(rawBody.toString('utf8'))}catch{}}
    const r=route({method:req.method,path,body},process.env);
    res.writeHead(r.status,{'content-type':'application/json'});
    res.end(JSON.stringify(r.body));
  }
  catch(e){
    const forbidden=['AUTH_REQUIRED','FORBIDDEN','CONSENT_REQUIRED','CONSENT_PURPOSE_MISMATCH','PROVENANCE_REQUIRED'];
    const badRequest=['STRIPE_WEBHOOK_SECRET_REQUIRED','STRIPE_SIGNATURE_INVALID','STRIPE_SIGNATURE_STALE','STRIPE_EVENT_JSON_INVALID','STRIPE_EVENT_INVALID'];
    const code=forbidden.includes(e.message)?403:badRequest.includes(e.message)?400:500;
    res.writeHead(code,{'content-type':'application/json'});
    res.end(JSON.stringify({error:e.message}));
  }
});

server.listen(port,()=>console.log(`URBAN ONE UNIVERSAL API ${port}`));
