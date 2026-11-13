// SEVA KKUBERA REST adapter. No cross-database reads or production writes.
const fail=(status,message)=>Object.assign(new Error(message),{status});
const bounded=(value,max=120)=>typeof value==='string'&&value.length<=max?value:null;
export function realEstateRoute({method,path,url,user,body={}}){
  if(!user?.id)throw fail(401,'Authentication required');
  if(path==='/api/v1/real-estate/properties'&&method==='GET'){
    const transaction=url.searchParams.get('transaction'),visibility=url.searchParams.get('visibility');
    if(transaction&&!['sale','rental'].includes(transaction))throw fail(400,'Invalid transaction');
    if(visibility&&!['public','off_market'].includes(visibility))throw fail(400,'Invalid visibility');
    // No unverified remote feed or tenant-grant provider is configured.
    return {status:200,data:{properties:[],source:'not_connected',tenantScoped:true,offMarketEnabled:false}};
  }
  if(path==='/api/v1/real-estate/imports/preview'&&method==='POST'){
    if(!Array.isArray(body.records)||body.records.length>100)throw fail(400,'Expected up to 100 records');
    if(body.authorized!==true)throw fail(403,'Source authorization required');
    const records=body.records.map((r,i)=>{
      if(!r||typeof r!=='object'||Array.isArray(r))throw fail(400,'Invalid record');
      const externalId=bounded(r.externalId,100),transaction=bounded(r.transaction,20);
      if(!externalId||!['sale','rental'].includes(transaction))throw fail(400,'Invalid property mapping');
      return {row:i+1,externalId,transaction};
    });
    const seen=new Set();
    return {status:200,data:{dryRun:true,written:0,records:records.map(r=>({...r,duplicate:seen.has(r.externalId),...(seen.add(r.externalId),{})})),requiresApproval:true}};
  }
  if(path==='/api/v1/real-estate/decisions/score'&&method==='POST'){
    const price=body.price,benchmark=body.benchmark;
    if(!Number.isFinite(price)||!Number.isFinite(benchmark)||price<=0||benchmark<=0)throw fail(400,'Positive numeric price and benchmark required');
    const deviationPct=Math.round((price/benchmark-1)*10000)/100;
    return {status:200,data:{deviationPct,method:'price_vs_user_supplied_benchmark',sourceVerified:false,requiresHumanReview:true,investmentAdvice:false}};
  }
  if(path==='/api/v1/real-estate/agents/tasks'&&method==='POST'){
    if(!['sales','rental','risk','crm','migration'].includes(body.agent))throw fail(400,'Unsupported agent');
    return {status:503,data:{error:'TITANS execution connector not configured',executed:false}};
  }
  return null;
}
