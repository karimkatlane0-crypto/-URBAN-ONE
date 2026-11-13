// KKUBERA 3 GLOBAL FIRST: deterministic matching, no MLS access or payment execution.
const fail=(status,message)=>Object.assign(new Error(message),{status});
const isoCurrency=v=>typeof v==='string'&&/^[A-Z]{3}$/.test(v);
export function globalMatchRoute({method,path,user,body={}}){
  if(!user?.id)throw fail(401,'Authentication required');
  if(path==='/api/v1/real-estate/global/capabilities'&&method==='GET')return {status:200,data:{
    edition:'KKUBERA 3 GLOBAL FIRST',scope:'multi-country',marketsActivated:[],
    features:{matching:'deterministic_preview',mls:'requires_provider_license',offMarket:'requires_explicit_grant',tickets:'not_enabled',payouts:'not_enabled',titans:'not_connected'},
    principle:'GOAL BUILD VERIFY RELEASE GLOBAL SCALE'
  }};
  if(path==='/api/v1/real-estate/global/match'&&method==='POST'){
    const {request,properties}=body;
    if(!request||!Array.isArray(properties)||properties.length>100)throw fail(400,'Invalid matching input');
    if(!['sale','rental'].includes(request.transaction)||!isoCurrency(request.currency)||typeof request.country!=='string'||!/^[A-Z]{2}$/.test(request.country))throw fail(400,'Country, currency and transaction required');
    if(!Number.isFinite(request.maxPrice)||request.maxPrice<=0)throw fail(400,'Positive maxPrice required');
    const matches=properties.map(p=>{
      if(!p||typeof p!=='object'||!['sale','rental'].includes(p.transaction)||!isoCurrency(p.currency)||typeof p.country!=='string'||!/^[A-Z]{2}$/.test(p.country)||!Number.isFinite(p.price)||p.price<=0)throw fail(400,'Invalid property');
      // Do not convert currencies without a verified FX rate.
      const compatible=p.transaction===request.transaction&&p.country===request.country&&p.currency===request.currency&&p.price<=request.maxPrice;
      // Off-market listings require explicit sharing grant and embargo permission.
      const allowed=p.visibility!=='off_market'||(p.ownerAuthorized===true&&p.agentAccessGranted===true&&p.embargoAllowsSharing===true);
      return {id:String(p.id||'').slice(0,100),eligible:compatible&&allowed,reason:!allowed?'restricted_listing':!compatible?'criteria_mismatch':'criteria_match'};
    });
    return {status:200,data:{matches,source:'caller_supplied_only',fxConversion:false,mlsConnected:false,humanReviewRequired:true,executedTransactions:0}};
  }
  return null;
}
