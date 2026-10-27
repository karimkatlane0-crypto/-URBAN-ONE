// SEVA Global public HTTP smoke probe. Network observations, not marketing claims.
// Does not require or collect auth tokens, personal data, session cookies or payment details.
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PUBLIC_ORIGIN='https://seva-executive-studio-preview.vercel.app';
export const FRONTEND_ROUTES=[
  {path:'/',type:'html',contains:'SEVA'},
  {path:'/discover.html',type:'html',contains:'SEVA IS CALLED'},
  {path:'/psdm.html',type:'html',contains:'Problem Solving'},
  {path:'/mobile.html',type:'html',contains:'Android'},
  {path:'/studio.js',type:'javascript',contains:'serverReady'},
  {path:'/psdm-engine.js',type:'javascript',contains:'rankDecisions'},
  {path:'/manifest-global.webmanifest',type:'manifest',contains:'SEVA'}
];

const approvedBackend=value=>{
  if(!value)return null;
  try{
    const url=new URL(value);
    // No passwords, query strings, fragments or unencrypted transport.
    if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash||url.hostname==='localhost')
      return null;
    return url.origin;
  }catch{return null;}
};

export async function runSmoke({fetchImpl=fetch,backendOrigin=null,requestTimeoutMs=12000}={}){
 const results=[];
 for(const target of FRONTEND_ROUTES){
  const url=new URL(target.path,PUBLIC_ORIGIN);
  try{
   const response=await fetchImpl(url.toString(),{method:'GET',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(requestTimeoutMs)});
   const contentType=(response.headers.get('content-type')||'').toLowerCase();
   const body=await response.text();
   let matches=body.includes(target.contains)&&body.length>20;
   if(target.type==='html')matches=matches&&contentType.includes('text/html');
   if(target.type==='manifest'){
     let manifest;try{manifest=JSON.parse(body);}catch{manifest=null;}
     matches=Boolean(manifest&&manifest.name&&manifest.display==='standalone'&&manifest.icons?.some(i=>i.sizes==='192x192')&&manifest.icons?.some(i=>i.sizes==='512x512'));
   }
   if(target.type==='javascript')matches=matches&&(contentType.includes('javascript')||contentType.includes('text/plain'));
   results.push({path:target.path,status:response.status,ok:response.status===200&&matches,
    contentType:contentType.split(';')[0].slice(0,80),classification:response.status===200&&matches?'VERIFIED_HTTP':'UNEXPECTED_RESPONSE'});
  }catch(e){
    results.push({path:target.path,status:null,ok:false,classification:'NETWORK_OR_TIMEOUT_ERROR'});
  }
 }
 const backend=approvedBackend(backendOrigin);
 let backendStatus={status:'NOT_CONFIGURED',httpStatus:null};
 if(backend){
  try{
   const response=await fetchImpl(backend+'/health',{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(requestTimeoutMs)});
   const body=await response.text();
   backendStatus={status:response.status===200&&body.length>0?'HTTP_HEALTH_RESPONDED':'HEALTH_FAILED',httpStatus:response.status};
  }catch{backendStatus={status:'HEALTH_REQUEST_FAILED',httpStatus:null};}
 }else if(backendOrigin){backendStatus={status:'INVALID_BACKEND_ORIGIN',httpStatus:null};}
 return {
  schemaVersion:1,generatedAt:new Date().toISOString(),publicOrigin:PUBLIC_ORIGIN,
  frontend:{status:results.every(x=>x.ok)?'HTTP_SMOKE_PASS':'HTTP_SMOKE_FAIL',routes:results},
  backend:backendStatus,
  authenticatedOpenAI:'NOT_TESTED',
  bankCredits:'NOT_TESTED',
  androidDeviceInstall:'NOT_TESTED',
  googlePlayPublication:'NOT_TESTED',
  note:'Only public HTTP file responses and optional unauthenticated backend health are tested. No user login, AI response, bank payment, device install or Google Play publication is implied.'
 };
}

const main=async()=>{
 const result=await runSmoke({backendOrigin:process.env.SEVA_BACKEND_ORIGIN});
 const output=resolve(process.env.SEVA_REPORT_PATH||'reports/seva-global-live-smoke.json');
 mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 process.stdout.write(JSON.stringify({report:output,frontend:result.frontend.status,backend:result.backend.status,failedRoutes:result.frontend.routes.filter(x=>!x.ok).map(x=>x.path)})+'\n');
 if(result.frontend.status!=='HTTP_SMOKE_PASS')process.exitCode=1;
};
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{process.stderr.write('Smoke probe failed: '+e.message+'\n');process.exitCode=1;});
