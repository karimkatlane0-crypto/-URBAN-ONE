// SEVA Enterprise — controlled Pole Position and competitive decision support.
// Offline, side-effect free; does not execute agents, book visits or take payments.
import {unifiedReadiness} from './seva-unified.mjs';
const clean = (value,limit=80) => typeof value==='string' && value.trim().length>0 && value.length<=limit ? value.trim() : null;
export const POLE_COMPETITIVE_CAPABILITIES = Object.freeze([
 Object.freeze({id:'pole_dossiers',source:'services/api/pole-http.mjs',state:'STAGING_ONLY'}),
 Object.freeze({id:'pole_visits',source:'services/api/pole-store.mjs',state:'STAGING_ONLY'}),
 Object.freeze({id:'pole_checkout',source:'services/api/pole-checkout.mjs',state:'STRIPE_TEST_ONLY'}),
 Object.freeze({id:'seva_titans',source:'packages/enterprise/seva-unified.mjs',state:'REQUIRES_VERIFIED_RUNTIME'}),
 Object.freeze({id:'partner_onboarding',source:'docs/BNB_PRIVATE_PARTNERSHIP_ONBOARDING.md',state:'AUTHORIZATION_REQUIRED'})
]);
export function comparePoleOptions(options=[]) {
 if(!Array.isArray(options)||options.length<2||options.length>10)
   throw new RangeError('TWO_TO_TEN_OPTIONS_REQUIRED');
 const normalized=options.map((o,index)=>{
   if(!o||typeof o!=='object'||Array.isArray(o))throw new TypeError('INVALID_OPTION');
   const name=clean(o.name);
   if(!name)throw new TypeError('INVALID_OPTION_NAME');
   const fields=['monthlySoftwareCostEur','setupCostEur','expectedQualifiedLeads','expectedConversionRate'];
   for(const f of fields)if(!Number.isFinite(o[f])||o[f]<0||o[f]>1000000)throw new RangeError('INVALID_METRIC_'+f);
   if(o.expectedConversionRate>1)throw new RangeError('INVALID_CONVERSION_RATE');
   return Object.freeze({id:index+1,name,monthlySoftwareCostEur:o.monthlySoftwareCostEur,
     setupCostEur:o.setupCostEur,expectedQualifiedLeads:o.expectedQualifiedLeads,
     expectedConversionRate:o.expectedConversionRate,
     projectedConversions:o.expectedQualifiedLeads*o.expectedConversionRate,
     inputSource:'USER_SCENARIO_UNVERIFIED'});
 });
 return Object.freeze({purpose:'SCENARIO_COMPARISON_ONLY',provider:'openai',
   aiCalled:false,bookingsMade:false,paymentsMade:false,ranked:false,
   notes:'No market dataset, causal attribution, verified conversion or financial return is implied',
   options:normalized});
}
export function poleTitansReadiness(evidence={}) {
 return Object.freeze({
  platform:'SEVA Intelligence Studio',primaryAI:'openai',mode:'FAIL_CLOSED',
  agentRegistry:unifiedReadiness(evidence),capabilities:POLE_COMPETITIVE_CAPABILITIES,
  live:false,poleProduction:false,autonomousTransactions:false,stripeLive:false
 });
}
