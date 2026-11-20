import {createHash,timingSafeEqual} from 'node:crypto';
import {TitansRequestStore,TitansRequestError} from '../../packages/titans/request-ledger.mjs';

let store=null,storePath=null;
function actorsFrom(env){
  let list;
  try{list=JSON.parse(env.TITANS_STAGING_ACTORS_JSON||'[]');}catch{throw new TitansRequestError('STAGING_ACTORS_INVALID',503);}
  if(!Array.isArray(list)||list.length<2||list.length>100)throw new TitansRequestError('STAGING_ACTORS_NOT_CONFIGURED',503);
  for(const a of list){
    if(!a||typeof a.id!=='string'||!/^[A-Za-z0-9_-]{3,90}$/.test(a.id)||
      typeof a.tokenHash!=='string'||!/^[a-f0-9]{64}$/i.test(a.tokenHash)||
      !Array.isArray(a.scopes)||a.scopes.some(s=>typeof s!=='string'))throw new TitansRequestError('STAGING_ACTORS_INVALID',503);
  }
  if(new Set(list.map(a=>a.id)).size!==list.length)throw new TitansRequestError('STAGING_ACTORS_INVALID',503);
  return list;
}
export function resolveTitansActor(header,env={}){
  if(env.TITANS_STAGING_ENABLED!=='true')throw new TitansRequestError('STAGING_DISABLED',503);
  const token=/^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(String(header||''))?.[1];
  if(!token)throw new TitansRequestError('AUTH_REQUIRED',401);
  const list=actorsFrom(env),hash=Buffer.from(createHash('sha256').update(token).digest('hex'),'hex');
  for(const item of list){
    const saved=Buffer.from(item.tokenHash,'hex');
    if(timingSafeEqual(hash,saved))return {id:item.id,scopes:[...item.scopes]};
  }
  throw new TitansRequestError('AUTH_REQUIRED',401);
}
function acquireStore(env){
  if(env.TITANS_STAGING_ENABLED!=='true'||typeof env.TITANS_DB_PATH!=='string'||!env.TITANS_DB_PATH.startsWith('/'))
    throw new TitansRequestError('PERSISTENT_STAGING_DB_REQUIRED',503);
  if(store&&storePath===env.TITANS_DB_PATH)return store;
  if(store)throw new TitansRequestError('STAGING_DB_CHANGE_REQUIRES_RESTART',503);
  store=new TitansRequestStore(env.TITANS_DB_PATH);storePath=env.TITANS_DB_PATH;return store;
}
function requireScope(actor,scope){
  if(!actor.scopes.includes(scope))throw new TitansRequestError('FORBIDDEN',403);
}
function respond(error){
  if(error instanceof TitansRequestError)return {status:error.status,body:{error:error.code}};
  return {status:503,body:{error:'TITANS_STAGING_UNAVAILABLE'}};
}
export async function handleTitansApi({method='GET',path='/',headers={},body={},env={},storeOverride=null}){
  if(!path.startsWith('/api/titans/'))return {status:404,body:{error:'NOT_FOUND'}};
  try{
    const actor=resolveTitansActor(headers.authorization,env),directory=actorsFrom(env);
    const db=storeOverride||acquireStore(env);
    if(method==='GET'&&path==='/api/titans/session')return {status:200,body:{actorId:actor.id,scopes:actor.scopes}};
    if(method==='POST'&&path==='/api/titans/requests'){
      requireScope(actor,'titans:request:create');
      const recipient=directory.find(a=>a.id===body.recipientId);
      if(!recipient||!recipient.scopes.includes('titans:request:respond'))throw new TitansRequestError('RECIPIENT_NOT_ELIGIBLE',404);
      const receipt=db.create({requesterId:actor.id,recipientId:recipient.id,purpose:body.purpose,
        scopes:body.scopes,note:body.note||'',expiresAt:body.expiresAt});
      return {status:201,body:receipt};
    }
    if(method==='GET'&&path==='/api/titans/requests/inbox'){
      requireScope(actor,'titans:request:respond');
      return {status:200,body:{requests:db.inbox(actor.id)}};
    }
    const decision=/^\/api\/titans\/requests\/([0-9a-f-]{36})\/decision$/.exec(path);
    if(method==='POST'&&decision){
      requireScope(actor,'titans:request:respond');
      const result=db.decide({requestId:decision[1],actorId:actor.id,decision:body.decision});
      return {status:result.state==='EXPIRED'?410:200,body:result};
    }
    const receipt=/^\/api\/titans\/requests\/([0-9a-f-]{36})\/receipt$/.exec(path);
    if(method==='GET'&&receipt){
      requireScope(actor,'titans:request:read');
      return {status:200,body:db.receipt({requestId:receipt[1],actorId:actor.id})};
    }
    const revoke=/^\/api\/titans\/grants\/([0-9a-f-]{36})\/revoke$/.exec(path);
    if(method==='POST'&&revoke){
      requireScope(actor,'titans:grant:revoke');
      return {status:200,body:db.revoke({grantId:revoke[1],actorId:actor.id})};
    }
    return {status:404,body:{error:'NOT_FOUND'}};
  }catch(error){return respond(error);}
}
