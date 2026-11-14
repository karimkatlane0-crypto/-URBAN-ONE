// Uses SEVA's existing server-side session lookup. No identity from client JSON.
export function mobileSessionAuthenticator(store) {
  if(typeof store?.fromSession!=='function')throw new TypeError('SEVA session store required');
  return async req=>{
    const values=(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith('seva_session='));
    if(values.length!==1)return null;
    let token;try {token=decodeURIComponent(values[0].slice('seva_session='.length));}catch{return null;}
    if(!/^[a-f0-9]{64}$/.test(token))return null;
    return store.fromSession(token);
  };
}
