// SEVA ONE — shared UX action policy; pure functions, safe by default.
// This module never executes payments, messages or bookings.
export const ACTIONS = Object.freeze(['search','view','import-preview','import-commit','purchase','message-send','booking-confirm']);
export const STATES = Object.freeze(['draft','preview','awaiting-approval','approved','executed','rejected']);
const SENSITIVE = new Set(['import-commit','purchase','message-send','booking-confirm']);
export function planAction(input) {
  if(!input || !ACTIONS.includes(input.action)) throw new Error('Unknown action');
  if(typeof input.tenantId!=='string' || !input.tenantId.trim()) throw new Error('Missing tenant');
  const sensitive=SENSITIVE.has(input.action);
  return Object.freeze({
    action:input.action,tenantId:input.tenantId,
    state:sensitive?'awaiting-approval':'preview',
    requiresApproval:sensitive,
    idempotencyKey:input.idempotencyKey??null,
    providerVerified:input.providerVerified===true,
    evidenceRef:input.evidenceRef??null,
    sourceRevision:input.sourceRevision??null
  });
}
export function authorizeAction(plan, approval) {
  if(!plan.requiresApproval) return {...plan,state:'approved'};
  if(!approval || approval.approved!==true ||
     approval.tenantId!==plan.tenantId ||
     approval.action!==plan.action ||
     typeof approval.actorId!=='string' || !approval.actorId.trim() ||
     typeof approval.approvalRef!=='string' || !approval.approvalRef.trim() ||
     !plan.providerVerified || !plan.evidenceRef ||
     !plan.idempotencyKey) throw new Error('Authorization or provider evidence missing');
  return {...plan,state:'approved',approvedBy:approval.actorId,approvalRef:approval.approvalRef};
}
export function importPreview(existing, incoming) {
  if(!Array.isArray(existing)||!Array.isArray(incoming)) throw new Error('Expected arrays');
  const known=new Map(existing.map(x=>[x.id,JSON.stringify(x)]));
  const seen=new Set();
  const add=[],skip=[],conflict=[];
  for(const item of incoming) {
    if(!item || typeof item.id!=='string'||!item.id.trim()) throw new Error('Invalid import ID');
    if(seen.has(item.id)){conflict.push(item.id);continue;}
    seen.add(item.id);
    const current=known.get(item.id);
    if(current===undefined) add.push(item);
    else if(current===JSON.stringify(item)) skip.push(item.id);
    else conflict.push(item.id);
  }
  return {add,skip,conflict,canCommit:conflict.length===0};
}
