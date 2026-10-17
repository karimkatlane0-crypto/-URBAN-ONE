import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightBnbConsentCampaign} from '../packages/marketing/bnb-consent-preflight.mjs';

const campaign={id:'eu27-pilot',channel:'EMAIL',purpose:'bnb-partner-updates',
  senderIdentityRef:'verified-sender',privacyNoticeUrl:'https://example.org/privacy'};
const review={country:'IT',channel:'EMAIL',approved:true,legalReviewRef:'country-email-review-001',reviewedAt:'2026-10-17T21:00:00Z'};
const rec={recordId:'b-and-b-01',organization:'Example Test Guesthouse',country:'IT',channel:'EMAIL',
  contact:'owner@example.org',consentStatus:'granted',consentChannel:'EMAIL',
  consentPurpose:'bnb-partner-updates',consentedAt:'2026-10-17T20:00:00Z',
  consentProofRef:'private-proof-001',consentTextRef:'text-version-1',
  sourceRef:'operator-website-record',sourceCheckedAt:'2026-10-17T21:00:00Z',
  unsubscriptionMethod:'one-click-unsubscribe'};
const run=(audience=[],args={})=>preflightBnbConsentCampaign({
  audience,campaign,countryReviews:[review],...args
});
test('Empty audience is a zero-recipient dry run and never dispatches',()=>{
  const r=run();
  assert.equal(r.examined,0);
  assert.equal(r.dispatchPerformed,false);
  assert.equal(r.sendAuthorized,false);
});
test('Documented matching consent is eligible for review only, not send',()=>{
  const r=run([rec]);assert.equal(r.eligible.length,1);
  assert.equal(r.status,'DRY_RUN_ONLY');
  assert.equal(r.sendAuthorized,false);
});
test('Consent channel and purpose must match separately',()=>{
  const r=run([{...rec,consentChannel:'SMS',consentPurpose:'other'}]);
  assert.equal(r.eligible.length,0);
  assert.ok(r.blocked[0].reasons.includes('CHANNEL_AND_PURPOSE_OPT_IN_PROOF_REQUIRED'));
});
test('No legal clearance blocks otherwise valid record',()=>{
  const r=run([rec],{countryReviews:[]});
  assert.ok(r.blocked[0].reasons.includes('COUNTRY_CHANNEL_LEGAL_REVIEW_REQUIRED'));
});
test('Suppressed and opted-out destinations are blocked',()=>{
  const r=run([rec],{suppressed:[{channel:'EMAIL',address:'OWNER@example.org'}]});
  assert.ok(r.blocked[0].reasons.includes('SUPPRESSED'));
  const r2=run([{...rec,optOut:true}]);
  assert.ok(r2.blocked[0].reasons.includes('SUPPRESSED'));
});
test('Duplicate destination never counts twice',()=>{
  const r=run([rec,{...rec,recordId:'b-and-b-02'}]);
  assert.equal(r.eligible.length,1);
  assert.ok(r.blocked[0].reasons.includes('DUPLICATE'));
});
test('SMS requires phone and separate SMS review and opt in',()=>{
  const smsCampaign={...campaign,channel:'SMS'};
  const smsReview={...review,channel:'SMS'};
  const smsRec={...rec,channel:'SMS',contact:'+393471234567',
    consentChannel:'SMS'};
  const r=preflightBnbConsentCampaign({campaign:smsCampaign,countryReviews:[smsReview],audience:[smsRec]});
  assert.equal(r.eligible.length,1);
  assert.equal(r.sendAuthorized,false);
  const r2=preflightBnbConsentCampaign({campaign:smsCampaign,countryReviews:[smsReview],
    audience:[{...smsRec,contact:'3471234567'}]});
  assert.ok(r2.blocked[0].reasons.includes('PHONE_E164_REQUIRED'));
});
test('No consent proof blocks recipient, regardless of supplied address',()=>{
  const r=run([{...rec,consentProofRef:null}]);
  assert.equal(r.eligible.length,0);
});
