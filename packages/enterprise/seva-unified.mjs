// Public-safe unified SEVA/TITANS/Onboarding capability contract.
// This is a planning/readiness registry, not an agent executor or entitlement grant.
const freeze = value => Object.freeze(value);
export const SEVA_UNIFIED_MODULES = freeze([
  freeze({id:'seva_agents',label:'SEVA Agents',provider:'openai',requires:['authenticated_identity','consent','account_quota','verified_openai_response']}),
  freeze({id:'titans',label:'TITANS orchestration',provider:'openai',requires:['approved_agent_registry','scoped_permissions','audited_execution']}),
  freeze({id:'onboarding',label:'Partner Onboarding',provider:'none',requires:['authorized_partner','signed_terms','verified_account']})
]);
export function unifiedReadiness(evidence={}) {
  const modules=SEVA_UNIFIED_MODULES.map(item=>{
    const missing=item.requires.filter(key=>evidence?.[item.id]?.[key]!==true);
    return {id:item.id,label:item.label,provider:item.provider,state:missing.length?'NOT_VERIFIED':'EVIDENCE_REVIEW_REQUIRED',missing};
  });
  return {
    platform:'SEVA Intelligence Studio',
    primaryAI:'openai',
    mode:'FAIL_CLOSED',
    live:false,
    mergeAuthorized:false,
    deploymentAuthorized:false,
    stripeLiveAuthorized:false,
    modules
  };
}
