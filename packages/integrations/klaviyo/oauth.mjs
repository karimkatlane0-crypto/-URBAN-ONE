import {createHash, randomBytes} from 'node:crypto';
import {Buffer} from 'node:buffer';

const AUTHORIZE_URL='https://www.klaviyo.com/oauth/authorize';
const TOKEN_URL='https://a.klaviyo.com/oauth/token';
const REVOKE_URL='https://a.klaviyo.com/oauth/revoke';
const DEFAULT_REVISION='2026-10-15';
const READ_SCOPES=Object.freeze([
  'accounts:read','lists:read','profiles:read','segments:read',
  'metrics:read','flows:read','events:read','webhooks:read'
]);
const required=(value,name)=>{if(typeof value!=='string'||!value.trim())throw new TypeError(name+' is required');return value.trim();};
const b64url=value=>Buffer.from(value).toString('base64url');
const basic= (id,secret)=>'Basic '+Buffer.from(id+':'+secret,'utf8').toString('base64');

export function createKlaviyoPKCE(){
  const verifier=b64url(randomBytes(48));
  const challenge=b64url(createHash('sha256').update(verifier).digest());
  return Object.freeze({verifier,challenge,state:b64url(randomBytes(32))});
}

export function buildKlaviyoAuthorizationUrl({clientId,redirectUri,pkce,scopes=READ_SCOPES}){
  required(clientId,'clientId');required(redirectUri,'redirectUri');
  if(!pkce||typeof pkce.verifier!=='string'||typeof pkce.challenge!=='string'||typeof pkce.state!=='string')throw new TypeError('Valid PKCE context is required');
  if(!Array.isArray(scopes)||scopes.length===0||scopes.some(s=>typeof s!=='string'||!s.trim()))throw new TypeError('Explicit scopes are required');
  const url=new URL(AUTHORIZE_URL);
  url.searchParams.set('response_type','code');
  url.searchParams.set('client_id',clientId);
  url.searchParams.set('redirect_uri',redirectUri);
  url.searchParams.set('scope',scopes.join(' '));
  url.searchParams.set('state',pkce.state);
  url.searchParams.set('code_challenge',pkce.challenge);
  url.searchParams.set('code_challenge_method','S256');
  return url.toString();
}

async function oauthPost(url,{clientId,clientSecret,body,fetchImpl}){
  const response=await fetchImpl(url,{method:'POST',headers:{
    authorization:basic(clientId,clientSecret),
    'content-type':'application/x-www-form-urlencoded',
    accept:'application/json'
  },body:new URLSearchParams(body)});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const error=new Error('KLAVIYO_OAUTH_REQUEST_FAILED');
    error.status=response.status;
    error.code=typeof payload.error==='string'?payload.error:'OAUTH_ERROR';
    throw error;
  }
  return payload;
}

/** Server-side OAuth primitives. Token persistence/encryption is injected by the hosting service, never this module. */
export function createKlaviyoOAuthClient({clientId,clientSecret,redirectUri,fetchImpl=globalThis.fetch}){
  required(clientId,'clientId');required(clientSecret,'clientSecret');required(redirectUri,'redirectUri');
  if(typeof fetchImpl!=='function')throw new TypeError('fetch implementation required');
  return Object.freeze({
    async exchangeCode({code,codeVerifier}){
      return oauthPost(TOKEN_URL,{clientId,clientSecret,fetchImpl,body:{
        grant_type:'authorization_code',code:required(code,'code'),
        code_verifier:required(codeVerifier,'codeVerifier'),redirect_uri:redirectUri
      }});
    },
    async refresh(refreshToken){
      return oauthPost(TOKEN_URL,{clientId,clientSecret,fetchImpl,body:{
        grant_type:'refresh_token',refresh_token:required(refreshToken,'refreshToken')
      }});
    },
    async revoke(refreshToken){
      return oauthPost(REVOKE_URL,{clientId,clientSecret,fetchImpl,body:{
        token_type_hint:'refresh_token',token:required(refreshToken,'refreshToken')
      }});
    },
    async get({accessToken,path,revision=DEFAULT_REVISION}){
      const token=required(accessToken,'accessToken');
      if(typeof path!=='string'||!/^\/api\/[a-z0-9/_-]+\/?(?:\?[^#]*)?$/i.test(path))throw new TypeError('Only relative Klaviyo /api read paths are allowed');
      const response=await fetchImpl('https://a.klaviyo.com'+path,{method:'GET',headers:{
        authorization:'Bearer '+token,accept:'application/json',revision
      }});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok){const error=new Error('KLAVIYO_API_READ_FAILED');error.status=response.status;error.code='PROVIDER_READ_ERROR';throw error;}
      return payload;
    }
  });
}

export const KLAVIYO_READ_SCOPES=READ_SCOPES;
