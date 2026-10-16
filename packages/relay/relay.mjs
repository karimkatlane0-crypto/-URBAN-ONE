export function relayStatus(env={}){
  const required=['CORE_GATEWAY_URL','CORE_GATEWAY_TOKEN','CORE_OWNER_ID'];
  const missing=required.filter(k=>!env[k]);
  return {enabled:missing.length===0,missing,mode:'fail-closed'};
}
export async function sendRelay(){throw new Error('RELAY_NOT_CERTIFIED');}
