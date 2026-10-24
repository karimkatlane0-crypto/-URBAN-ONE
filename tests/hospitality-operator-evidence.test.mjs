import test from 'node:test';
import assert from 'node:assert/strict';
import {createGuestStayReview,recordGuestStayAttestation,guestStayReviewReadiness,OPERATOR_EVENTS}
  from '../packages/hospitality/operator-evidence.mjs';

const base=()=>createGuestStayReview({tenantId:'TENANT-01',propertyId:'PROPERTY-01',reservationId:'SMOOBU-291'});
const auth={
  authenticatedByServer:true,actorType:'staff',actorId:'OPERATOR-01',
  tenantId:'TENANT-01',propertyIds:['PROPERTY-01'],
  scopes:['hospitality:attest','alloggiati:receipt_review']
};
const cmd=(action,eventId,overrides={})=>({
  action,eventId,at:'2026-10-24T10:30:00Z',
  evidenceRef:'ev_12345678',...overrides
});

test('state never fabricates entry, keys, police reporting, PMS or payments',()=>{
  const s=base();const r=guestStayReviewReadiness(s);
  assert.equal(s.review.arrival,'NOT_ATTESTED');
  assert.equal(r.alloggiatiSubmittedAndAccepted,false);
  assert.equal(r.identityProviderVerified,false);
  assert.equal(r.keysReleased,false);
  assert.equal(r.financialTransferAuthorized,false);
  assert.equal(s.journal.length,0);
});
test('staff attestation remains distinct from external identity verification',()=>{
  const s=recordGuestStayAttestation(base(),
    cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'ENTRY-1'),{trustedAuth:auth});
  const r=guestStayReviewReadiness(s);
  assert.equal(r.operatorArrivalAttestationRecorded,true);
  assert.equal(r.identityProviderVerified,false);
  assert.equal(r.physicalEntryAutomated,false);
  assert.equal(r.alloggiatiSubmittedAndAccepted,false);
  assert.equal(s.review.keys,'NOT_AUTHORIZED');
  assert.equal(s.review.pms,'NOT_UPDATED');
  assert.equal(s.journal[0].actorId,'OPERATOR-01');
  assert.equal(s.journal[0].evidenceRef,'ev_12345678');
});
test('police receipt reference can be noted but never asserted validated or submitted',()=>{
  const checkin=recordGuestStayAttestation(base(),
    cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'EVENT-1'),{trustedAuth:auth});
  const ref=recordGuestStayAttestation(checkin,
    cmd(OPERATOR_EVENTS.OFFICIAL_RECEIPT_REFERENCE,'EVENT-2',{receiptRef:'rcpt_87654321'}),
    {trustedAuth:auth});
  assert.equal(ref.review.alloggiati,'RECEIPT_REFERENCE_RECORDED_UNVERIFIED');
  assert.equal(ref.actualAlloggiatiSubmissionPerformed,false);
  assert.equal(ref.providerEvidenceVerified,false);
  assert.equal(guestStayReviewReadiness(ref).receiptNeedsAuthoritativeValidation,true);
});
test('check-out evidence is a separate staff action after arrival',()=>{
  assert.throws(()=>recordGuestStayAttestation(base(),
    cmd(OPERATOR_EVENTS.DEPARTURE_OBSERVED,'EVENT-2'),{trustedAuth:auth}),
    /ARRIVAL_ATTESTATION_REQUIRED/);
  const entered=recordGuestStayAttestation(base(),
    cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'EVENT-1'),{trustedAuth:auth});
  const departed=recordGuestStayAttestation(entered,
    cmd(OPERATOR_EVENTS.DEPARTURE_OBSERVED,'EVENT-2'),{trustedAuth:auth});
  assert.equal(departed.review.departure,'STAFF_ASSERTION_RECORDED');
  assert.equal(guestStayReviewReadiness(departed).pmsSynced,false);
  assert.equal(departed.actualAlloggiatiSubmissionPerformed,false);
});
test('duplicate deliveries are idempotent, conflicting event IDs denied',()=>{
  const command=cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'EVENT-1');
  const state=recordGuestStayAttestation(base(),command,{trustedAuth:auth});
  assert.strictEqual(recordGuestStayAttestation(state,command,{trustedAuth:auth}),state);
  assert.throws(()=>recordGuestStayAttestation(state,
    {...command,evidenceRef:'ev_98765432'}, {trustedAuth:auth}),
    /EVENT_ID_REPLAY_CONFLICT/);
  assert.throws(()=>recordGuestStayAttestation(state,
    cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'EVENT-2'),{trustedAuth:auth}),
    /ARRIVAL_ALREADY_ATTESTED/);
});
test('cross-tenant, cross-property, guest and missing operator scopes fail closed',()=>{
  const action=cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'EVENT-1');
  for(const trustedAuth of [
    undefined,
    {...auth,tenantId:'OTHER'},
    {...auth,propertyIds:['PROPERTY-02']},
    {...auth,actorType:'guest'},
    {...auth,authenticatedByServer:false},
    {...auth,scopes:[]},
    {...auth,actorId:'invalid/actor'}
  ]){
    assert.throws(()=>recordGuestStayAttestation(base(),action,{trustedAuth}),
      /AUTHENTICATED_PROPERTY_STAFF_REQUIRED/);
  }
});
test('alloggiati reconciliation requires separate scope and opaque references',()=>{
  const state=recordGuestStayAttestation(base(),
    cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'EVENT-1'),{trustedAuth:auth});
  const v=cmd(OPERATOR_EVENTS.OFFICIAL_RECEIPT_REFERENCE,'EVENT-2',{receiptRef:'rcpt_12345678'});
  assert.throws(()=>recordGuestStayAttestation(state,v,
    {trustedAuth:{...auth,scopes:['hospitality:attest']}}),/REPORTING_REVIEW_SCOPE_REQUIRED/);
  assert.throws(()=>recordGuestStayAttestation(state,{...v,receiptRef:'P123/real personal ID'},
    {trustedAuth:auth}),/OPAQUE_RECEIPT_REFERENCE_REQUIRED/);
});
test('reject forged URL/camera/document evidence and arbitrary actions',()=>{
  const s=base();
  for(const evidenceRef of ['https://example.com/file','ev_1','ev_12345678/../doc','sk_test_invalid'])
    assert.throws(()=>recordGuestStayAttestation(s,
      cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'E-1',{evidenceRef}),{trustedAuth:auth}),
      /OPAQUE_EVIDENCE_REFERENCE_REQUIRED/);
  assert.throws(()=>recordGuestStayAttestation(s,
    cmd('RELEASE_KEYS','E-2'),{trustedAuth:auth}),/ATTESTATION_ACTION_FORBIDDEN/);
  assert.throws(()=>recordGuestStayAttestation(s,
    cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'E-3',{at:'2026-10-24'}),
    {trustedAuth:auth}),/ATTESTATION_TIMESTAMP_INVALID/);
});
test('pseudonymous journal never contains guest PII supplied in extraneous fields',()=>{
  const supplied=cmd(OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE,'EVENT-1',{
    guestEmail:'guest-private@example.com',passport:'GUEST-PASSPORT',accessCode:'12345'
  });
  const next=recordGuestStayAttestation(base(),supplied,{trustedAuth:auth});
  assert.equal(JSON.stringify(next).includes('guest-private'),false);
  assert.equal(JSON.stringify(next).includes('GUEST-PASSPORT'),false);
  assert.equal(JSON.stringify(next).includes('12345'),true); // evidence ID, not the supplied access code
  assert.equal(Object.hasOwn(next.journal[0],'passport'),false);
  assert.equal(Object.hasOwn(next.journal[0],'accessCode'),false);
});
