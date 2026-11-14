// SEVA mobile CRM: dry-run-only, deny-by-default adapter.
// NOT wired to the public server until a trusted identity and PostgreSQL RLS are verified.
// No real CRM ingestion, customer discovery, payment or messaging takes place.
import {authorizeSovereign, auditDecision} from './svaiam-sovereign-policy.mjs';
const prefix='/api/mobile-crm/v1';
const respond=(status,body)=>({status,body:{...body,live:false}});
const isId=v=>typeof v==='string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
function decisionFor(ctx,permission,resourceTenantId=ctx?.tenantId){
  // verifiedContext MUST be supplied by trusted server middleware, never client input.
  return authorizeSovereign({principal:ctx?.principal,tenantId:ctx?.tenantId,
    resourceTenantId,action:permission,verifiedContext:ctx?.verifiedContext===true});
}
function gate(ctx,permission,resourceTenantId){
  const decision=decisionFor(ctx,permission,resourceTenantId);
  if(!decision.allowed)return respond(ctx?.verifiedContext===true?403:401,{error:decision.reason});
  return null;
}
const known=new Set(['csv','json','google_contacts','authorized_crm']);
export function mobileCrmRoute({method,path,context={},body={}}={}){
  if(typeof path!=='string'||!path.startsWith(prefix+'/'))return null;
  if(method==='GET'&&path===prefix+'/status'){
    const blocked=gate(context,'plan:read');if(blocked)return blocked;
    return respond(200,{mode:'STAGING_ONLY',sync:'NOT_CONNECTED',postgres:'NOT_VERIFIED',
      capabilities:['import_preview','sync_plan'],payments:'DISABLED',broadcast:'DISABLED'});
  }
  if(method==='POST'&&path===prefix+'/imports/preview'){
    const blocked=gate(context,'plan:create');if(blocked)return blocked;
    if(!body||typeof body!=='object'||Array.isArray(body)||!known.has(body.sourceType)||
       body.consentConfirmed!==true||body.rightToUseConfirmed!==true||
       !isId(body.tenantId)||body.tenantId!==context.tenantId||
       !Number.isSafeInteger(body.recordCount)||body.recordCount<0||body.recordCount>10000)
      return respond(400,{error:'invalid_authorized_import_descriptor'});
    const decision=decisionFor(context,'plan:create',body.tenantId);
    return respond(200,{mode:'PREVIEW_ONLY',acceptedRecords:0,previewCount:body.recordCount,
      sourceType:body.sourceType,requires:['source_provenance','field_mapping','deduplication',
        'lawful_basis','tenant_rls','rollback'],audit:auditDecision({principal:context.principal,
          tenantId:context.tenantId,resourceTenantId:body.tenantId,action:'plan:create',decision}),
      persisted:false});
  }
  if(method==='POST'&&path===prefix+'/sync/plan'){
    const blocked=gate(context,'plan:create');if(blocked)return blocked;
    if(!body||!isId(body.tenantId)||body.tenantId!==context.tenantId||
       !['android','ios','web'].includes(body.deviceType)||
       !isId(body.deviceId))return respond(400,{error:'invalid_sync_descriptor'});
    return respond(200,{mode:'PLAN_ONLY',deviceType:body.deviceType,
      strategy:'incremental_cursor_with_conflict_review',writes:0,
      prerequisites:['authenticated_device','tls','encrypted_local_store',
        'postgres_rls','durable_audit','restore_test']});
  }
  if(method==='GET'&&path===prefix+'/audit'){
    const blocked=gate(context,'audit:read');if(blocked)return blocked;
    return respond(503,{error:'durable_audit_not_configured',records:[]});
  }
  return respond(404,{error:'unknown_endpoint'});
}
