// SVAIAM sovereign policy adapter: pure functions, no live side effects.
// IMPORTANT: caller MUST provide identity and tenant grants verified by trusted middleware.
import { createHash, randomUUID } from 'node:crypto';
const valid = x => typeof x === 'string' && x.length > 0 && x.length <= 128;
const has = (a,v) => Array.isArray(a) && a.includes(v);
const approved = new Set(['plan:read','plan:create','rag:query','ml:assess','audit:read']);
export const liveActions = Object.freeze(['agent:execute','mls:import','payment:capture','message:send','release:deploy']);
export function authorizeSovereign({principal,tenantId,action,resourceTenantId,verifiedContext=false}={}) {
  const deny = reason => ({allowed:false,reason,mode:'DENY_DEFAULT'});
  if (!verifiedContext || !principal || !valid(principal.id) || !valid(principal.tenantId))
    return deny('verified_identity_required');
  if (!valid(tenantId) || principal.tenantId !== tenantId) return deny('tenant_boundary');
  if (!valid(resourceTenantId) || resourceTenantId !== tenantId) return deny('resource_tenant_boundary');
  if (!valid(action) || !approved.has(action)) return deny('action_disabled');
  if (!has(principal.permissions,action)) return deny('permission_missing');
  return {allowed:true,reason:'authorized_planning_only',mode:'PLANNED_ONLY'};
}
const normalize = v => (typeof v==='string' ? v.slice(0,128) : '');
export function auditDecision({principal,tenantId,resourceTenantId,action,decision,correlationId}={}) {
  const record = {
    schema:'svaiam.audit.v1', id:randomUUID(), at:new Date().toISOString(),
    correlationId:valid(correlationId)?correlationId:randomUUID(),
    actorId:normalize(principal?.id), tenantId:normalize(tenantId),
    resourceTenantId:normalize(resourceTenantId),
    action:normalize(action), result:decision?.allowed===true?'ALLOW_PLAN':'DENY',
    reason:normalize(decision?.reason)
  };
  return {...record, digest:createHash('sha256').update(JSON.stringify(record)).digest('hex'),
    persistence:'NOT_CONFIGURED',signed:false};
}
export function sovereignPlan(request={}) {
  const decision=authorizeSovereign(request);
  const audit=auditDecision({...request,decision});
  return {status:decision.allowed?'PLANNED_ONLY':'DENIED',decision,audit,
    agentsExecuted:0,providerCalls:0,paymentsCaptured:0,liveEnabled:false};
}
export function ragQueryPlan({principal,tenantId,documentTenantId,query,verifiedContext=false}={}) {
  const plan=sovereignPlan({principal,tenantId,resourceTenantId:documentTenantId,action:'rag:query',verifiedContext});
  return {...plan,queryAccepted:plan.decision.allowed && typeof query==='string' && query.trim().length>0,
    retrievedDocuments:0,modelInvoked:false};
}
