import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../core.mjs';
import {analyticsOverview} from '../analytics.mjs';
test('analytics includes zero-safe goal KPI and original three distinct prices',()=>{
 const s=createStore(),u=s.register('kpi@example.com','VerySecurePassword-123');
 const r=analyticsOverview(s,u.id);
 assert.equal(r.goals.total,0);assert.equal(r.goals.completionPercent,0);
 assert.deepEqual([r.commercial.buyerAnnualCents,r.commercial.ecommerceAnnualCents,r.commercial.formulaAMonthlyCents],[5000,50000,5000]);
 assert.equal(r.disclaimers.proposalMoneyIsRevenue,false);s.db.close();
});
test('analytics tracks completion, blocking, saved quote values but not revenue',()=>{
 const s=createStore(),u=s.register('kpi1@example.com','VerySecurePassword-123');
 s.saveGoal(u.id,{title:'Done',status:'done'});
 s.saveGoal(u.id,{title:'Block',status:'blocked'});
 s.saveGoal(u.id,{title:'Progress',status:'doing'});
 s.saveCampaign(u.id,{dueNowCents:25000,marketingCents:1000,savingCents:2500},{quorumTarget:2,deadlineIso:'2027-01-01T00:00:00Z',marketingConsentConfirmed:true});
 const r=analyticsOverview(s,u.id);
 assert.equal(r.goals.completionPercent,33.33);assert.equal(r.proposals.quotedCents,25000);
 assert.equal(r.proposals.marketingConsentedCents,1000);assert.equal(r.proposals.estimatedSavingsCents,2500);s.db.close();
});
test('analytics and Lastre intents are isolated by user account',()=>{
 const s=createStore(),a=s.register('kpi-a@example.com','VerySecurePassword-123'),b=s.register('kpi-b@example.com','VerySecurePassword-123');
 s.saveGoal(a.id,{title:'Private A',status:'done'});
 s.createIntent(a.id,{category:'rent',description:'Apartment',budgetCents:90000,consent:true});
 assert.equal(analyticsOverview(s,b.id).goals.total,0);
 assert.equal(analyticsOverview(s,b.id).lastre.intentTotal,0);
 assert.equal(analyticsOverview(s,a.id).lastre.byCategory.rent,1);s.db.close();
});
