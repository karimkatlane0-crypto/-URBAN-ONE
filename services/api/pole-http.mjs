import {PoleStore, PoleError, resolvePoleActor, poleReadiness} from './pole-store.mjs';
import {createPoleTestCheckout} from './pole-checkout.mjs';
let store=null;
let storePath=null;
const endpoints=Object.freeze({
  '/api/pole/dossier/create':'dossier.create',
  '/api/pole/dossier/read':'dossier.read',
  '/api/pole/listing/update':'listing.update',
  '/api/pole/slot/create':'slot.create',
  '/api/pole/visit/request':'visit.request',
  '/api/pole/visit/read':'visit.read',
  '/api/pole/visit/transition':'visit.transition',
  '/api/pole/message/send':'message.send',
  '/api/pole/message/list':'message.list'
});
function acquireStore(env){
  if(env.POLE_STAGING_ENABLED!=='true'||typeof env.POLE_DB_PATH!=='string'||!env.POLE_DB_PATH.startsWith('/'))
    throw new PoleError('PERSISTENT_STAGING_DB_REQUIRED',503);
  if(store&&storePath===env.POLE_DB_PATH)return store;
  if(store)throw new PoleError('STAGING_DB_CHANGE_REQUIRES_RESTART',503);
  store=new PoleStore(env.POLE_DB_PATH);
  storePath=env.POLE_DB_PATH;
  return store;
}
export async function handlePoleApi({method,path,headers={},body={},env={}}){
  if(path==='/api/pole/status'&&method==='GET')
    return {status:200,body:poleReadiness(env)};
  if(method!=='POST'||(path!=='/api/pole/billing/checkout-test'&&!endpoints[path]))
    return {status:404,body:{error:'NOT_FOUND'}};
  try{
    const actor=resolvePoleActor(headers.authorization,env);
    const db=acquireStore(env);
    if(path==='/api/pole/billing/checkout-test'){
      const kind=body.kind;
      if(kind==='visit'){
        const visit=db.execute('visit.read',actor,{visitId:body.visitId});
        if(visit.visitorId!==actor.id||!['REQUESTED','CONFIRMED'].includes(visit.state))
          throw new PoleError('VISIT_NOT_ELIGIBLE',409);
      }
      const checkout=await createPoleTestCheckout({kind,actor,visitId:body.visitId,
        termsAccepted:body.termsAccepted,env});
      return {status:200,body:checkout};
    }
    const response=db.execute(endpoints[path],actor,body);
    return {status:201,body:response};
  }catch(error){
    if(error instanceof PoleError)return {status:error.status,body:{error:error.message}};
    // Do not leak SQL, paths, tokens or provider secrets to the browser.
    return {status:503,body:{error:'POLE_STAGING_UNAVAILABLE'}};
  }
}
