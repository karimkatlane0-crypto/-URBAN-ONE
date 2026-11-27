import {isAbsolute} from 'node:path';

// Validate configuration before opening a database or accepting requests.
export function validateRuntime(env=process.env) {
  if(env.NODE_ENV!=='production')return;
  let origin;
  try { origin=new URL(env.SEVA_PUBLIC_URL); } catch { throw Error('SEVA_PUBLIC_URL must be an HTTPS origin'); }
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)
    throw Error('SEVA_PUBLIC_URL must be an HTTPS origin');
  if(!env.SEVA_DB_PATH||!isAbsolute(env.SEVA_DB_PATH))
    throw Error('Production SEVA_DB_PATH must be an absolute persistent database path');
}

export function sameOrigin(req,env=process.env) {
  if(req.headers['sec-fetch-site']==='cross-site')return false;
  const supplied=req.headers.origin;
  // Native clients may omit Origin; authentication is still required by each route.
  if(!supplied)return true;
  try {
    const origin=new URL(supplied);
    if(origin.origin!==supplied)return false;
    const expected=env.SEVA_PUBLIC_URL
      ?new URL(env.SEVA_PUBLIC_URL).origin
      :`${req.socket.encrypted?'https':'http'}://${req.headers.host}`;
    return origin.origin===expected;
  } catch { return false; }
}

export function databaseReady(db) {
  try { db.prepare('SELECT id FROM users LIMIT 1').get();return true; }
  catch { return false; }
}

// Session lookup may be synchronous (SQLite) or asynchronous. Always resolve
// it before testing identity; a Promise must never act as an authenticated user.
export async function requireSessionUser(store,token) {
  if(typeof token!=='string'||!token)
    throw Object.assign(Error('Please sign in'),{status:401});
  try {
    const user=await store.fromSession(token);
    if(user&&typeof user==='object'&&!Array.isArray(user)) {
      const {id,email}=user;
      if(typeof id==='string'&&id.trim()&&typeof email==='string'&&email.trim())
        return {id,email};
    }
  } catch {
    // The HTTP error handler logs messages: do not propagate database details.
    throw Object.assign(Error('Authentication temporarily unavailable'),{status:503});
  }
  throw Object.assign(Error('Please sign in'),{status:401});
}
