import {prepareUniversalAccess} from '../../packages/ai/universal-access.mjs';
import {providerStatus} from '../../packages/ai/providers.mjs';
import {relayStatus} from '../../packages/relay/relay.mjs';
import {prepareContactImport} from '../../packages/contacts/contact.mjs';
import {searchProperties} from '../../packages/real-estate/property.mjs';

function hasScope(req,scope){
  const auth=req?.auth||{};
  return Boolean(auth.userId)&&Array.isArray(auth.scopes)&&auth.scopes.includes(scope);
}

function guarded(req,scope,fn){
  if(!hasScope(req,scope)) return {status:403,body:{error:'FORBIDDEN',requiredScope:scope}};
  try{return {status:200,body:fn()};}
  catch(error){
    const status=error instanceof RangeError?413:400;
    return {status,body:{error:'INVALID_REQUEST',message:error.message}};
  }
}

export function route(req, env={}){
  const {method='GET',path='/',body={}}=req;
  if(method==='GET'&&path==='/health') return {status:200,body:{ok:true,version:'7.0.0-rc.1'}};
  if(method==='GET'&&path==='/api/universal/status') return {status:200,body:{providers:providerStatus(env),relay:relayStatus(env),features:{privateContacts:true,exactCivicSearch:true,mapReadyQuery:true}}};
  if(method==='POST'&&path==='/api/universal/prepare') return {status:200,body:prepareUniversalAccess(body)};
  if(method==='POST'&&path==='/api/contacts/import-preview'){
    return guarded(req,'contacts:read',()=>prepareContactImport(body.records||[],{source:body.source||'skebby',maxRecords:body.maxRecords||500}));
  }
  if(method==='POST'&&path==='/api/properties/search'){
    return guarded(req,'properties:read',()=>searchProperties(body.records||[],body.query||{}));
  }
  return {status:404,body:{error:'NOT_FOUND'}};
}
