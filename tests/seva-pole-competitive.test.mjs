import test from 'node:test';
import assert from 'node:assert/strict';
import {comparePoleOptions,poleTitansReadiness} from '../packages/enterprise/pole-competitive.mjs';
const a={name:'Option A',monthlySoftwareCostEur:40,setupCostEur:100,expectedQualifiedLeads:20,expectedConversionRate:.1};
const b={name:'Option B',monthlySoftwareCostEur:20,setupCostEur:70,expectedQualifiedLeads:10,expectedConversionRate:.2};
test('pole and TITANS remain unverified with no autonomous bookings or payments',()=>{
 const r=poleTitansReadiness();
 assert.equal(r.primaryAI,'openai');
 assert.equal(r.live,false);
 assert.equal(r.stripeLive,false);
 assert.equal(r.agentRegistry.modules.length,3);
});
test('competitive scenarios are clearly hypothetical and never ranked automatically',()=>{
 const r=comparePoleOptions([a,b]);
 assert.equal(r.options[0].projectedConversions,2);
 assert.equal(r.options[1].inputSource,'USER_SCENARIO_UNVERIFIED');
 assert.equal(r.aiCalled,false);
 assert.equal(r.paymentsMade,false);
 assert.equal(r.ranked,false);
});
test('invalid costs, probabilities and untrusted options fail closed',()=>{
 assert.throws(()=>comparePoleOptions([a]),RangeError);
 assert.throws(()=>comparePoleOptions([a,{...b,expectedConversionRate:2}]),RangeError);
 assert.throws(()=>comparePoleOptions([a,{...b,name:' '}]),TypeError);
});
