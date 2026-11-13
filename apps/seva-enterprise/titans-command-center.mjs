// TITANS decision orchestration: deterministic, auditable planning only.
// No autonomous MLS access, messaging, payments, or customer data migration.
import {globalMatchRoute} from './global-real-estate.mjs';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const stages=['GOAL','BUILD','VERIFY','RELEASE','GLOBAL_SCALE'];
const agents=['source_evidence','compliance','gmas_match','risk_review','crm_followup','billing_reconciliation'];
export function titansRoute({method,path,user,body={}}){
  if(!user?.id)throw fail(401,'Authentication required');
  if(path==='/api/v1/titans/capabilities'&&method==='GET')return {status:200,data:{edition:'SEVA Enterprise Global Command Center',stages,agents,mode:'planning_only',externalAgentsConnected:false,livePayments:false,mlsConnected:false}};
  if(path==='/api/v1/titans/plan'&&method==='POST'){
    if(!['sale','rental'].includes(body.transaction)||typeof body.country!=='string'||!/^[A-Z]{2}$/.test(body.country))throw fail(400,'Valid transaction and ISO country required');
    const tasks=agents.map((agent,index)=>({sequence:index+1,agent,status:'PENDING',requiresHumanApproval:['compliance','risk_review','billing_reconciliation'].includes(agent)}));
    return {status:200,data:{transaction:body.transaction,country:body.country,stages,tasks,execution:'NOT_STARTED',evidenceVerified:false,sourceAuthorizationRequired:true}};
  }
  if(path==='/api/v1/titans/match-preview'&&method==='POST'){
    const r=globalMatchRoute({method:'POST',path:'/api/v1/real-estate/global/match',user,body});
    return {status:200,data:{...r.data,mode:'preview',agentsExecuted:0,paymentsCaptured:0}};
  }
  if(path==='/api/v1/titans/execute'&&method==='POST')return {status:503,data:{error:'Agent execution unavailable until provider credentials, tenant permissions and audit tests pass',executed:false}};
  return null;
}
