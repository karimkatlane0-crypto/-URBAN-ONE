// SEVA ONE: pure event/outbox orchestration. No provider calls or side effects.
import {createHash} from 'node:crypto';
export const FLOW_STAGES=Object.freeze(['FRONTEND','API','BACKEND','DATABASE','EVENTO','FOLLOW-UP','AUDIT']);
export const EFFECTS=Object.freeze(['payment','message','booking','import']);
export function prepareFlow({tenantId,actorId,flowId,action,payload={},providerVerified=false,consentRef=null}) {
 for(const [key,value] of Object.entries({tenantId,actorId,flowId,action}))
   if(typeof value!=='string'||!value.trim()) throw Error('Missing '+key);
 if(!payload||typeof payload!=='object'||Array.isArray(payload)) throw Error('Invalid payload');
 const effect=EFFECTS.includes(action);
 const digest=createHash('sha256').update(JSON.stringify({tenantId,flowId,action,payload})).digest('hex');
 return {tenantId,actorId,flowId,action,idempotencyKey:digest,providerVerified,
  consentRef,requiresApproval:effect,state:effect?'AWAITING_APPROVAL':'PREVIEW',
  trace:FLOW_STAGES.map(stage=>({stage,status:'NOT VERIFIED'}))};
}
export function approveFlow(flow,{actorId,tenantId,approvalRef,approved}) {
 if(flow.state!=='AWAITING_APPROVAL') throw Error('Flow not awaiting approval');
 if(!approved||!actorId||!approvalRef||tenantId!==flow.tenantId||!flow.providerVerified) throw Error('Approval or provider missing');
 if(['message','import'].includes(flow.action)&&!flow.consentRef) throw Error('Consent missing');
 return {...flow,state:'AUTHORIZED',approval:{actorId,approvalRef}};
}
export function createOutboxRecord(flow) {
 if(flow.state!=='AUTHORIZED') throw Error('Not authorized');
 return {id:flow.idempotencyKey,tenantId:flow.tenantId,flowId:flow.flowId,
  action:flow.action,state:'PENDING_PROVIDER_EXECUTION',attempts:0,
  audit:{approvalRef:flow.approval.approvalRef,actorId:flow.approval.actorId}};
}
export function reconcileProviderResult(record,result) {
 if(record.state!=='PENDING_PROVIDER_EXECUTION') throw Error('Invalid state');
 if(!result||result.confirmed!==true||!result.providerEventId) throw Error('Provider confirmation missing');
 return {...record,state:'PROVIDER_CONFIRMED',providerEventId:result.providerEventId};
}
