import http from 'node:http';import {route} from './router.mjs';
const port=Number(process.env.PORT||8787);
const server=http.createServer(async(req,res)=>{
  const chunks=[];for await(const c of req)chunks.push(c);
  let body={};if(chunks.length){try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{}}
  try{const r=route({method:req.method,path:new URL(req.url,'http://localhost').pathname,body},process.env);res.writeHead(r.status,{'content-type':'application/json'});res.end(JSON.stringify(r.body));}
  catch(e){const code=['AUTH_REQUIRED','FORBIDDEN','CONSENT_REQUIRED','CONSENT_PURPOSE_MISMATCH','PROVENANCE_REQUIRED'].includes(e.message)?403:500;res.writeHead(code,{'content-type':'application/json'});res.end(JSON.stringify({error:e.message}));}
});
server.listen(port,()=>console.log(`URBAN ONE UNIVERSAL API ${port}`));
