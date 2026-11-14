import {createServer} from 'node:http';
import {createStore} from './core.mjs';
import {createMobileHandler} from './mobile-sync-api.mjs';
import {mobileSessionAuthenticator} from './mobile-sync-session.mjs';

// Opt-in loopback sidecar; reverse proxy must preserve the SEVA HTTPS origin.
// This file does not start or modify the main server and never deploys itself.
if(process.env.SEVA_MOBILE_SYNC_ENABLED!=='true')throw Error('Mobile sync disabled');
const origin=new URL(process.env.SEVA_PUBLIC_URL||'');
if(origin.protocol!=='https:')throw Error('SEVA_PUBLIC_URL must use HTTPS');
const encoded=process.env.SEVA_MOBILE_SIGNING_KEY_BASE64||'';
const key=Buffer.from(encoded,'base64');
if(key.length!==32||key.toString('base64')!==encoded)throw Error('Dedicated 32-byte signing key required');
if(!process.env.SEVA_DB_PATH)throw Error('Explicit existing SEVA_DB_PATH required');
const port=Number(process.env.SEVA_MOBILE_PORT||3001);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid mobile port');
const store=createStore(process.env.SEVA_DB_PATH);
const handler=createMobileHandler({db:store.db,authenticate:mobileSessionAuthenticator(store),
  enabled:true,signingKey:key,allowedOrigin:origin.origin});
const server=createServer(async(req,res)=>{
  if(!await handler(req,res)){res.writeHead(404,{'Cache-Control':'no-store'});res.end();}
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(port,'127.0.0.1');
let closing=false;
function stop(){if(closing)return;closing=true;server.close(()=>{store.db.close();});}
process.once('SIGTERM',stop);process.once('SIGINT',stop);
