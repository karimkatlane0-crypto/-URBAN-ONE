// URBAN ONE | Staff-attested check-in / check-out evidence, source-only.
// This is NOT identity verification hardware, access control, Alloggiati Web,
// a police receipt validator, PMS synchronization or a live authenticated API.
// Real backend must inject an independently authenticated, scoped principal,
// protect the append-only journal and verify official provider receipts.
const ID=/^[A-Za-z0-9_-]{1,48}$/;
const EVIDENCE=/^ev_[A-Za-z0-9_-]{8,64}$/;
const RECEIPT=/^rcpt_[A-Za-z0-9_-]{8,64}$/;
const MAX_EVENTS=200;

function requireId(value,code){
  if(typeof value!=='string'||!ID.test(value))throw new Error(code);
  return value;
}
function timestamp(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)||
    !Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==
      (value.includes('.')?value:value.replace('Z','.000Z')))
    throw new Error('ATTESTATION_TIMESTAMP_INVALID');
  return value;
}

export const OPERATOR_EVENTS=Object.freeze({
  VISUAL_ID_AT_ENTRANCE:'ATTEST_VISUAL_ID_AT_ENTRANCE',
  DEPARTURE_OBSERVED:'ATTEST_DEPARTURE_OBSERVED',
  OFFICIAL_RECEIPT_REFERENCE:'RECORD_REPORTED_OFFICIAL_RECEIPT_REFERENCE'
});

export function createGuestStayReview({tenantId,propertyId,reservationId}={}){
  return {
    kind:'URBAN_ONE_GUEST_STAY_OPERATOR_REVIEW',
    mode:'SERVER_ONLY_SOURCE_REQUIRES_AUTHENTICATED_BACKEND',
    tenantId:requireId(tenantId,'TENANT_ID_REQUIRED'),
    propertyId:requireId(propertyId,'PROPERTY_ID_REQUIRED'),
    reservationId:requireId(reservationId,'RESERVATION_ID_REQUIRED'),
    review:{arrival:'NOT_ATTESTED',departure:'NOT_ATTESTED',
      alloggiati:'NOT_SUBMITTED',keys:'NOT_AUTHORIZED',pms:'NOT_UPDATED'},
    journal:[],
    providerEvidenceVerified:false,
    actualAlloggiatiSubmissionPerformed:false,
    physicalEntryAutomated:false,
    financialTransferAuthorized:false
  };
}

/**
 * Trusted auth MUST be supplied by an authenticated private backend, not by
 * browser/guest/body headers. Nothing here performs that authentication.
 * Actions record only an operator assertion, NOT external proof.
 */
export function recordGuestStayAttestation(state,command,{trustedAuth}={}){
  if(!state||state.kind!=='URBAN_ONE_GUEST_STAY_OPERATOR_REVIEW'||
    !Array.isArray(state.journal)||state.journal.length>MAX_EVENTS||
    !state.review||typeof state.review!=='object')
    throw new Error('TRUSTED_STAY_STATE_REQUIRED');
  if(!trustedAuth||trustedAuth.authenticatedByServer!==true||
    trustedAuth.actorType!=='staff'||typeof trustedAuth.actorId!=='string'||
    !ID.test(trustedAuth.actorId)||trustedAuth.tenantId!==state.tenantId||
    !Array.isArray(trustedAuth.propertyIds)||!trustedAuth.propertyIds.includes(state.propertyId)||
    !Array.isArray(trustedAuth.scopes)||!trustedAuth.scopes.includes('hospitality:attest'))
    throw new Error('AUTHENTICATED_PROPERTY_STAFF_REQUIRED');
  if(!command||typeof command!=='object'||Array.isArray(command))
    throw new Error('ATTESTATION_COMMAND_INVALID');
  const {action,eventId,at,evidenceRef,receiptRef}=command;
  requireId(eventId,'EVENT_ID_INVALID');
  timestamp(at);
  if(typeof evidenceRef!=='string'||!EVIDENCE.test(evidenceRef))
    throw new Error('OPAQUE_EVIDENCE_REFERENCE_REQUIRED');
  const isReceipt=action===OPERATOR_EVENTS.OFFICIAL_RECEIPT_REFERENCE;
  if(!Object.values(OPERATOR_EVENTS).includes(action))throw new Error('ATTESTATION_ACTION_FORBIDDEN');
  if(isReceipt){
    if(!trustedAuth.scopes.includes('alloggiati:receipt_review'))
      throw new Error('REPORTING_REVIEW_SCOPE_REQUIRED');
    if(typeof receiptRef!=='string'||!RECEIPT.test(receiptRef))
      throw new Error('OPAQUE_RECEIPT_REFERENCE_REQUIRED');
  }else if(receiptRef!==undefined)throw new Error('RECEIPT_REFERENCE_NOT_APPLICABLE');
  const entry={eventId,action,at,evidenceRef,actorId:trustedAuth.actorId,
    ...(isReceipt?{receiptRef}:{})};
  const prior=state.journal.find(e=>e.eventId===eventId);
  if(prior){
    if(JSON.stringify(prior)===JSON.stringify(entry))return state;
    throw new Error('EVENT_ID_REPLAY_CONFLICT');
  }
  if(state.journal.length>=MAX_EVENTS)throw new Error('ATTESTATION_JOURNAL_FULL');
  if(action===OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE){
    if(state.review.arrival!=='NOT_ATTESTED')throw new Error('ARRIVAL_ALREADY_ATTESTED');
    if(state.review.departure!=='NOT_ATTESTED')throw new Error('DEPARTURE_ALREADY_ATTESTED');
  }else if(action===OPERATOR_EVENTS.DEPARTURE_OBSERVED){
    if(state.review.arrival!=='STAFF_ASSERTION_RECORDED')throw new Error('ARRIVAL_ATTESTATION_REQUIRED');
    if(state.review.departure!=='NOT_ATTESTED')throw new Error('DEPARTURE_ALREADY_ATTESTED');
  }else{
    if(state.review.arrival!=='STAFF_ASSERTION_RECORDED')throw new Error('ARRIVAL_ATTESTATION_REQUIRED');
    if(state.review.alloggiati!=='NOT_SUBMITTED')throw new Error('RECEIPT_REVIEW_ALREADY_RECORDED');
  }
  const review={...state.review};
  if(action===OPERATOR_EVENTS.VISUAL_ID_AT_ENTRANCE)
    review.arrival='STAFF_ASSERTION_RECORDED';
  if(action===OPERATOR_EVENTS.DEPARTURE_OBSERVED)
    review.departure='STAFF_ASSERTION_RECORDED';
  if(isReceipt)
    review.alloggiati='RECEIPT_REFERENCE_RECORDED_UNVERIFIED';
  return {
    ...state,
    review,
    journal:[...state.journal,entry],
    // A claimed receipt reference is NOT an independently verified submission.
    providerEvidenceVerified:false,
    actualAlloggiatiSubmissionPerformed:false,
    physicalEntryAutomated:false,
    financialTransferAuthorized:false
  };
}

export function guestStayReviewReadiness(state){
  if(!state||state.kind!=='URBAN_ONE_GUEST_STAY_OPERATOR_REVIEW')
    throw new Error('TRUSTED_STAY_STATE_REQUIRED');
  return {
    mode:state.mode,
    operatorArrivalAttestationRecorded:state.review.arrival==='STAFF_ASSERTION_RECORDED',
    operatorDepartureAttestationRecorded:state.review.departure==='STAFF_ASSERTION_RECORDED',
    alloggiatiStatus:state.review.alloggiati,
    receiptNeedsAuthoritativeValidation:state.review.alloggiati==='RECEIPT_REFERENCE_RECORDED_UNVERIFIED',
    identityProviderVerified:false,physicalEntryAutomated:false,
    keysReleased:false,pmsSynced:false,
    alloggiatiSubmittedAndAccepted:false,
    financialTransferAuthorized:false
  };
}
