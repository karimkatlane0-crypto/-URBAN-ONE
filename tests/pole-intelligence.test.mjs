import {route} from '../services/api/router.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {planAdvisoryWorkflow,previewDossierMemo,previewContractOutline,featureDecision,trainSyntheticRanker,
  scoreSyntheticMatch,workflowTypes,modelRegistry} from '../packages/real-estate/premium-taskforce.mjs';
import {distanceMeters,evaluateWalkAlerts} from '../packages/geo/pole-walk.mjs';

test('European sale, rental, succession, judicial auction are review-only with human gates',()=>{
  for(const type of workflowTypes){
    const plan=planAdvisoryWorkflow({type,country:'IT'});
    assert.equal(plan.documentStatus,'NOT_LEGALLY_BINDING');
    assert.equal(plan.actions.sign,false);
    assert.equal(plan.actions.bid,false);
    assert.equal(plan.actions.makePayment,false);
    assert.equal(plan.actions.file,false);
    assert.ok(plan.steps.length>=4);
    const memo=previewDossierMemo({type,country:'IT',propertyReference:'DEMO'});
    assert.match(memo,/NON VINCOLANTE/);
    assert.match(memo,/NON È UN CONTRATTO/);
  }
  assert.match(planAdvisoryWorkflow({type:'succession',country:'DE'}).steps.join(' '),/Irlanda e Danimarca/);
  assert.throws(()=>planAdvisoryWorkflow({type:'succession',country:'EUROPE'}),/COUNTRY_REQUIRED/);
  assert.throws(()=>planAdvisoryWorkflow({type:'mortgage',country:'IT'}),/UNSUPPORTED_WORKFLOW/);
  assert.equal(modelRegistry.deepLearning.state,'NOT_CONNECTED');
  assert.equal(modelRegistry.deepMind.state,'NOT_A_PARTNER_OR_INTEGRATION');
});
test('subscription and GPS notifications deny by default without server-owned rights and store policy',()=>{
  const feature='verified_civic_walk_alerts';
  assert.equal(featureDecision({feature,platform:'ios'}).enabled,false);
  assert.equal(featureDecision({feature,platform:'android',providerApproved:true,
    entitlement:{feature,verified:true,source:'client_flag',storePolicyApproved:true}}).enabled,false);
  assert.equal(featureDecision({feature,platform:'ios',providerApproved:true,
    entitlement:{feature,verified:true,source:'signed_server',storePolicyApproved:false}}).enabled,false);
  assert.equal(featureDecision({feature,platform:'ios',providerApproved:true,
    entitlement:{feature,verified:true,source:'signed_server',storePolicyApproved:true}}).enabled,true);
  assert.equal(featureDecision({feature:'missing',platform:'web'}).enabled,false);
});
test('real offline linear ML training on synthetic data only; no property valuation, no automatic advice',()=>{
  const examples=[
    {origin:'synthetic',features:{budgetMatch:1,civicMatch:1,purposeMatch:1,sourceTrust:1},label:1},
    {origin:'synthetic',features:{budgetMatch:.8,civicMatch:1,purposeMatch:.9,sourceTrust:.7},label:1},
    {origin:'synthetic',features:{budgetMatch:0,civicMatch:0,purposeMatch:0,sourceTrust:0},label:0},
    {origin:'synthetic',features:{budgetMatch:.1,civicMatch:.1,purposeMatch:.2,sourceTrust:0},label:0}
  ];
  const model=trainSyntheticRanker(examples);
  const high=scoreSyntheticMatch(model,examples[0].features),low=scoreSyntheticMatch(model,examples[2].features);
  assert.ok(high.score>low.score);
  assert.equal(high.noLegalOrFinancialDecision,true);
  assert.equal(model.productionValidated,false);
  assert.throws(()=>trainSyntheticRanker([...examples.slice(1),{...examples[0],origin:'real'}]),/REAL_DATA_TRAINING_BLOCKED/);
  assert.throws(()=>scoreSyntheticMatch(model,{budgetMatch:1,civicMatch:-.1,purposeMatch:1,sourceTrust:1}),/INVALID_FEATURE_civicMatch/);
});
test('foreground GPS matches only opted-in verified listings with valid civic location and premium',()=>{
  const center={lat:45.6500,lng:13.7700};
  const listings=[{id:'listingA',status:'sale',position:{lat:45.6501,lng:13.7701},
    ownerPublicationAuthorized:true,geocodingVerified:true,notificationOptIn:true}];
  assert.equal(Math.round(distanceMeters(center,center)),0);
  assert.equal(evaluateWalkAlerts({current:center,targets:listings}).reason,'FOREGROUND_CONSENT_REQUIRED');
  assert.equal(evaluateWalkAlerts({current:center,targets:listings,positionConsent:true,foreground:true}).reason,'SERVER_PREMIUM_ENTITLEMENT_REQUIRED');
  const opts={current:center,targets:listings,positionConsent:true,foreground:true,premiumVerified:true,now:100000000};
  assert.equal(evaluateWalkAlerts(opts).alerts.length,1);
  assert.equal(evaluateWalkAlerts({...opts,previous:{listingA:100000000-1000}}).alerts.length,0);
  assert.equal(evaluateWalkAlerts({...opts,targets:listings.map(v=>({...v,notificationOptIn:false}))}).alerts.length,0);
  assert.equal(evaluateWalkAlerts({...opts,targets:listings.map(v=>({...v,geocodingVerified:false}))}).alerts.length,0);
  assert.equal(evaluateWalkAlerts({...opts,targets:listings.map(v=>({...v,status:'sold'}))}).alerts.length,0);
  assert.equal(evaluateWalkAlerts({...opts,foreground:false}).alerts.length,0);
  assert.throws(()=>distanceMeters({lat:999,lng:0},center),/INVALID_COORDINATES/);
});
test('identical premium UI in Web, iOS and Android source, syntax-valid script, no private origin or paid links',()=>{
  const webHtml=readFileSync(new URL('../apps/web/pole-premium.html',import.meta.url),'utf8');
  const mobileHtml=readFileSync(new URL('../apps/mobile/www/pole-premium.html',import.meta.url),'utf8');
  const webJs=readFileSync(new URL('../apps/web/pole-premium.js',import.meta.url),'utf8');
  const mobileJs=readFileSync(new URL('../apps/mobile/www/pole-premium.js',import.meta.url),'utf8');
  assert.equal(webHtml,mobileHtml);
  assert.equal(webJs,mobileJs);
  assert.doesNotThrow(()=>new Script(webJs));
  assert.match(webHtml,/BOZZA|NON vincolanti|NON vincolante|NON vincolanti|NON vincolanti|NON vincolanti|NON vincolanti|NON vincolanti|NON vincolanti|NON vincolanti|non contratti validi/i);
  assert.match(webHtml,/walkConsent/);
  assert.match(webJs,/watchPosition/);
  assert.match(webJs,/visibilitychange/);
  assert.match(webJs,/const entitled=false/);
  assert.doesNotMatch(webJs,/fetch\s*\(/);
  assert.doesNotMatch(webHtml,/sk_live_[a-z0-9]{10}/i);
  for(const name of ['index.html','europe-immobili.html','pole-position.html']){
    for(const root of ['apps/web/','apps/mobile/www/']){
      assert.match(readFileSync(new URL('../'+root+name,import.meta.url),'utf8'),/pole-premium\.html/);
    }
  }
});


test('contract drafting produces review-only outlines, never executable legal documents',()=>{
  for(const type of ['listing_sale','rental']){
    const outline=previewContractOutline({type,country:'IT'});
    assert.equal(outline.legallyBinding,false);
    assert.equal(outline.readyToSign,false);
    assert.equal(outline.certified,false);
    assert.match(outline.text,/NON È UN CONTRATTO/);
    assert.match(outline.text,/PROFESSIONISTA/);
  }
  assert.throws(()=>previewContractOutline({type:'succession',country:'IT'}),/CONTRACT_OUTLINE_NOT_AVAILABLE_FOR_PROCEDURE/);
});
test('public capabilities endpoint makes all provider, legal, GPS and pay boundaries explicit',()=>{
  const r=route({method:'GET',path:'/api/public/pole/intelligence'});
  assert.equal(r.status,200);
  assert.equal(r.body.providerExecution,false);
  assert.equal(r.body.trainingOnCustomerData,false);
  assert.equal(r.body.realContractGeneration,false);
  assert.equal(r.body.paidEntitlementsActive,false);
  assert.equal(r.body.backgroundTracking,false);
});
