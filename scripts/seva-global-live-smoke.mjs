// SEVA Global public HTTP smoke probe. Network observations, not marketing claims.
// Does not require or collect auth tokens, personal data, session cookies or payment details.
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PUBLIC_ORIGIN='https://seva.karimkatlane0.chatgpt.site';
export const FRONTEND_ROUTES=[
  {path:'/superapp',type:'html',contains:'/superapp.webmanifest'},
  {path:'/mobile',type:'html',contains:'/superapp.webmanifest'},
  {path:'/account',type:'html',contains:'/account.webmanifest'},
  {path:'/sw.js',type:'javascript',contains:'addEventListener'},
  {path:'/superapp.webmanifest',type:'manifest',contains:'SEVA'}
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
     matches=Boolean(
       (contentType.includes('application/manifest+json')||contentType.includes('application/json'))&&
       typeof manifest?.name==='string'&&manifest.name.length>0&&manifest.short_name==='SEVA'&&
       manifest.id==='/superapp'&&manifest.start_url==='/superapp'&&manifest.scope==='/'&&manifest.display==='standalone'&&
       Array.isArray(manifest.icons)&&[192,512].every(size=>manifest.icons.some(i=>i?.sizes===size+'x'+size&&i.src==='/assets/seva-icon-'+size+'.png'&&i.type==='image/png'))
     );
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
  accountSignIn:'NOT_TESTED',
  authenticatedOpenAI:'NOT_TESTED',
  bankCredits:'NOT_TESTED',
  androidDeviceInstall:'NOT_TESTED',
  iOSDeviceInstall:'NOT_TESTED',
  digitalAssetLinks:'NOT_TESTED',
  releaseSigning:'NOT_TESTED',
  googlePlayPublication:'NOT_TESTED',
  note:'Only public HTTP responses from the canonical SEVA site, its install manifest identity and optional unauthenticated backend health are tested. User login, AI response, bank payment, Android/iOS installation, Digital Asset Links, release signing and Google Play publication are not verified.'
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
