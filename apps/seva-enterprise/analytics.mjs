/**
 * Owner-scoped SEVA KPI/KPMI analytics.
 * Financial totals here are saved quote previews, NEVER realized turnover or earnings.
 */
export function analyticsOverview(store,owner) {
 const db=store.db;
 const counts=db.prepare("SELECT status, COUNT(*) AS count FROM goals WHERE user_id=? GROUP BY status").all(owner);
 const statuses={todo:0,doing:0,blocked:0,done:0};
 for(const row of counts){if(Object.hasOwn(statuses,row.status))statuses[row.status]=row.count;}
 const total=Object.values(statuses).reduce((a,b)=>a+b,0);
 const campaigns=db.prepare("SELECT quote_json,status FROM campaign_drafts WHERE user_id=?").all(owner);
 const byState={draft:0,other:0};let quotedCents=0, marketingCents=0,savingCents=0;
 for(const item of campaigns){
   if(item.status==='draft')byState.draft++; else byState.other++;
   const q=JSON.parse(item.quote_json);
   for(const [field,set] of [['dueNowCents','due'],['marketingCents','marketing'],['savingCents','saving']]){
     const v=q[field];if(!Number.isSafeInteger(v)||v<0)continue;
     if(set==='due')quotedCents+=v; else if(set==='marketing')marketingCents+=v;else savingCents+=v;
   }
 }
 const intents=db.prepare("SELECT category,COUNT(*) AS count FROM lastre_intents WHERE user_id=? GROUP BY category").all(owner);
 const buyerIntents={buy:0,rent:0,lease:0,credit:0,other:0};
 for(const row of intents){if(Object.hasOwn(buyerIntents,row.category))buyerIntents[row.category]=row.count;}
 const intentTotal=Object.values(buyerIntents).reduce((a,b)=>a+b,0);
 return {
  name:'SEVA KPI / KPMI',source:'owner-scoped-sqlite',currency:'EUR',
  goals:{total,...statuses,completionPercent:total?Math.round(statuses.done*10000/total)/100:0},
  proposals:{total:campaigns.length,...byState,quotedCents,marketingConsentedCents:marketingCents,estimatedSavingsCents:savingCents},
  lastre:{intentTotal,byCategory:buyerIntents},
  commercial:{buyerAnnualCents:5000,ecommerceAnnualCents:50000,formulaAMonthlyCents:5000},
  disclaimers:{proposalMoneyIsRevenue:false,quoteIsPayment:false,savingsAreGuaranteed:false,customerRewardsAutomated:false}
 };
}
