import {prepareUniversalAccess} from '../../packages/ai/universal-access.mjs';
import {providerStatus} from '../../packages/ai/providers.mjs';
import {AI_COMMAND_CAPACITY,aiCommandCapabilities} from '../../packages/ai/commands.mjs';
import {relayStatus} from '../../packages/relay/relay.mjs';
import {prepareContactImport} from '../../packages/contacts/contact.mjs';
import {searchProperties} from '../../packages/real-estate/property.mjs';
import {buildDataEuropaSpatialSearch,INSPIRE_THEMES,publicSpatialPolicy} from '../../packages/geo/inspire.mjs';
import {buildCopernicusStacSearch,COPERNICUS_COLLECTIONS,copernicusSatellitePolicy} from '../../packages/geo/copernicus.mjs';
import {networkPassPolicy,quoteNetworkPass} from '../../packages/bnb/network-pass.mjs';

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

function safe(fn){
  try{return {status:200,body:fn()};}
  catch(error){return {status:400,body:{error:'INVALID_REQUEST',message:error.message}};}
}

export function route(req, env={}){
  const {method='GET',path='/',body={}}=req;
  if(method==='GET'&&path==='/health') return {status:200,body:{ok:true,version:'7.0.0'}};
  if(method==='GET'&&path==='/api/ai/commands/capabilities') return {status:200,body:aiCommandCapabilities()};
  if(method==='GET'&&path==='/api/universal/status') return {status:200,body:{providers:providerStatus(env),relay:relayStatus(env),features:{privateContacts:true,exactCivicSearch:true,mapReadyQuery:true,euInspirePublicData:true,inspireThemeCount:INSPIRE_THEMES.length,dataEuropaSearchApi:true,copernicusSatelliteData:true,copernicusStac:true,copernicusCollectionCount:COPERNICUS_COLLECTIONS.length,aiCommandRegistry:true,aiCommandCapacity:AI_COMMAND_CAPACITY,bnbNetworkPassModel:true}}};
  if(method==='GET'&&path==='/api/public/eu-spatial/policy') return {status:200,body:publicSpatialPolicy()};
  if(method==='POST'&&path==='/api/public/eu-spatial/search-plan') return safe(()=>buildDataEuropaSpatialSearch(body));
  if(method==='GET'&&path==='/api/public/satellite/copernicus/policy') return {status:200,body:copernicusSatellitePolicy()};
  if(method==='POST'&&path==='/api/public/satellite/copernicus/search-plan') return safe(()=>buildCopernicusStacSearch(body));
  if(method==='GET'&&path==='/api/public/bnb-network/model') return {status:200,body:networkPassPolicy()};
  if(method==='POST'&&path==='/api/public/bnb-network/quote') return safe(()=>quoteNetworkPass(body));
  if(method==='POST'&&path==='/api/universal/prepare') return {status:200,body:prepareUniversalAccess(body)};
  if(method==='POST'&&path==='/api/contacts/import-preview'){
    return guarded(req,'contacts:read',()=>prepareContactImport(body.records||[],{source:body.source||'skebby',maxRecords:body.maxRecords||500}));
  }
  if(method==='POST'&&path==='/api/properties/search'){
    return guarded(req,'properties:read',()=>searchProperties(body.records||[],body.query||{}));
  }
  return {status:404,body:{error:'NOT_FOUND'}};
}
