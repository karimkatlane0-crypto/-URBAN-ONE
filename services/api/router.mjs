import {prepareUniversalAccess} from '../../packages/ai/universal-access.mjs';
import {providerStatus} from '../../packages/ai/providers.mjs';
import {relayStatus} from '../../packages/relay/relay.mjs';

export function route(req, env={}){
  const {method='GET',path='/',body={}}=req;
  if(method==='GET'&&path==='/health') return {status:200,body:{ok:true,version:'7.0.0-rc.1'}};
  if(method==='GET'&&path==='/api/universal/status') return {status:200,body:{providers:providerStatus(env),relay:relayStatus(env)}};
  if(method==='POST'&&path==='/api/universal/prepare') return {status:200,body:prepareUniversalAccess(body)};
  return {status:404,body:{error:'NOT_FOUND'}};
}
