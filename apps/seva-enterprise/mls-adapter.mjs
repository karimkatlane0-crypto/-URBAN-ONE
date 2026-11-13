// KKUBERA MLS adapter: no external access or data import without licensed credentials.
// RESO Web API integrations vary by MLS and require provider-specific agreements.
const error=(status,message)=>Object.assign(new Error(message),{status});
export function mlsProviderStatus(env=process.env){
  const url=env.KKUBERA_MLS_API_BASE_URL||'';
  let valid=false;
  try { const u=new URL(url); valid=u.protocol==='https:'&&Boolean(u.hostname)&&!u.username&&!u.password&&!['localhost','127.0.0.1','::1'].includes(u.hostname); } catch {}
  return {standard:'RESO Web API (provider-dependent)',configured:valid&&Boolean(env.KKUBERA_MLS_ACCESS_TOKEN),licensed:env.KKUBERA_MLS_LICENSE_APPROVED==='true',connected:false,offMarketEnabled:false};
}
export function mlsRoute({method,path,user,env=process.env}){
  if(!user?.id)throw error(401,'Authentication required');
  if(method==='GET'&&path==='/api/v1/real-estate/mls/status'){
    return {status:200,data:mlsProviderStatus(env)};
  }
  if(method==='GET'&&path==='/api/v1/real-estate/mls/properties'){
    const status=mlsProviderStatus(env);
    if(!status.configured||!status.licensed)return {status:503,data:{error:'MLS license or provider credentials unavailable',properties:[],imported:0}};
    // No network requests until scoped authorization, embargo policy and tenant grants are implemented.
    return {status:503,data:{error:'MLS synchronization not yet enabled',properties:[],imported:0}};
  }
  return null;
}
