import {isAbsolute} from 'node:path';
import {createMobileHandler} from './mobile-sync-api.mjs';
import {mobileSessionAuthenticator} from './mobile-sync-session.mjs';
import {createMobileUiHandler} from './mobile-sync-ui.mjs';

// One process, one existing session store and database. Configuration grants no membership.
export function createMobileIntegration({store,env=process.env}) {
  const enabled=env.SEVA_MOBILE_SYNC_ENABLED==='true';
  const status={enabled,ready:false,mode:'staging',mount:'main-server',
    uiPath:'/mobile-crm/',apiPrefix:'/api/v1/mobile',reason:'disabled'};
  let handle,serveUi;
  if(enabled) {
    try {
      let origin;
      try{origin=new URL(env.SEVA_PUBLIC_URL||'');}catch{throw Error('https_origin_required');}
      const loopback=env.NODE_ENV!=='production'&&env.SEVA_MOBILE_ALLOW_LOOPBACK_HTTP==='true'
        &&origin.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(origin.hostname);
      if((origin.protocol!=='https:'&&!loopback)||origin.username||origin.password
        ||origin.pathname!=='/'||origin.search||origin.hash)throw Error('https_origin_required');
      if(!store?.persistent||!isAbsolute(env.SEVA_DB_PATH||''))throw Error('persistent_database_required');
      const encoded=env.SEVA_MOBILE_SIGNING_KEY_BASE64||'';
      const key=Buffer.from(encoded,'base64');
      if(key.length!==32||key.toString('base64')!==encoded)throw Error('dedicated_signing_key_required');
      handle=createMobileHandler({db:store.db,authenticate:mobileSessionAuthenticator(store),
        enabled:true,signingKey:key,allowedOrigin:origin.origin,requireScopeBinding:true});
      serveUi=createMobileUiHandler();status.ready=true;status.reason=null;
    } catch(error) {
      const known=['https_origin_required','persistent_database_required','dedicated_signing_key_required'];
      status.reason=known.includes(error.message)?error.message:'mobile_storage_unavailable';
    }
  }
  return {status:Object.freeze(status),async handle(req,res) {
    const path=new URL(req.url||'/', 'http://localhost').pathname;
    if(path!=='/mobile-crm'&&!path.startsWith('/mobile-crm/')
      &&path!=='/api/v1/mobile'&&!path.startsWith('/api/v1/mobile/'))return false;
    if(!status.ready) {
      res.writeHead(503,{'Content-Type':'application/json; charset=utf-8',
        'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      res.end(JSON.stringify({error:'mobile_not_ready',reason:status.reason,
        enabled,configurationPath:'/api/public/status'}));return true;
    }
    if(serveUi(req,res))return true;
    if(path==='/api/v1/mobile') {
      res.writeHead(404,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
      res.end(JSON.stringify({error:'mobile_route_not_found'}));return true;
    }
    return handle(req,res);
  }};
}
