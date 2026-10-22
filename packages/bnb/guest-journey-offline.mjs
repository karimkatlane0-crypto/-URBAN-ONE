// Synthetic guest operations simulator. NO PMS calls, no guest PII, no Stripe calls.
// Do not use demo flags as verified evidence or automatic customer entitlement.
export const GUEST_JOURNEY_RELEASE='OFFLINE_SIMULATION_ONLY';
const allowed=new Map([
 ['received',['verify_reservation','cancel']],
 ['reservation_verified',['start_prearrival','cancel']],
 ['prearrival',['checkin','cancel']],
 ['checked_in',['start_checkout','cancel']],
 ['checkout_ready',['checkout','cancel']],
 ['checked_out',['reconcile']],
 ['reconciled',[]],
 ['cancelled',[]]
]);
const steps={
 verify_reservation:'reservation_verified',
 start_prearrival:'prearrival',
 checkin:'checked_in',
 start_checkout:'checkout_ready',
 checkout:'checked_out',
 reconcile:'reconciled',
 cancel:'cancelled'
};
function mockRef(str){return typeof str==='string' && /^mock-[a-zA-Z0-9_-]{1,70}$/.test(str)}
function requireMockRefs(state){if(!mockRef(state?.propertyId)||!mockRef(state?.reservationId)||!mockRef(state?.tenantId))throw new Error('SYNTHETIC_REFERENCES_REQUIRED')}
export function newGuestJourney({propertyId,reservationId,tenantId}={}){
 const st={type:GUEST_JOURNEY_RELEASE,simulation:true,propertyId,reservationId,tenantId,state:'received',history:['received'],paymentVerified:false,fulfillmentAuthorized:false,chargesCreated:0,hostTransfersCreated:0};
 requireMockRefs(st);return st;
}
export function transitionGuestJourney(st,{action,operatorRef,evidenceRef,tenantId,approved=false}={}){
 if(st?.simulation!==true||st?.type!==GUEST_JOURNEY_RELEASE)throw new Error('LIVE_WORKFLOW_NOT_SUPPORTED');
 requireMockRefs(st);
 if(tenantId!==st.tenantId)throw new Error('CROSS_TENANT_ACCESS_DENIED');
 if(!mockRef(operatorRef)||!mockRef(evidenceRef)||!approved)throw new Error('OPERATOR_AUTH_AND_MOCK_EVIDENCE_REQUIRED');
 if(typeof action!=='string'||!allowed.get(st.state)?.includes(action))throw new Error('INVALID_JOURNEY_TRANSITION');
 const next=steps[action];
 return {...st,state:next,history:[...st.history,next],paymentVerified:false,fulfillmentAuthorized:false,chargesCreated:0,hostTransfersCreated:0};
}
export function mockOptionalServiceQuote({tenantId,reservationId,service,priceCents,currency='EUR',propertyApproved=false}={}){
 if(!mockRef(tenantId)||!mockRef(reservationId))throw new Error('SYNTHETIC_REFERENCES_REQUIRED');
 if(!['late_checkout','early_checkin','luggage','concierge'].includes(service))throw new Error('SERVICE_NOT_AVAILABLE_IN_MOCK');
 if(!Number.isSafeInteger(priceCents)||priceCents<0||priceCents>5000000||currency!=='EUR')throw new Error('INVALID_MOCK_PRICE');
 if(propertyApproved!==true)throw new Error('PROPERTY_APPROVAL_REQUIRED');
 return {simulation:true,state:'quote_only_not_payable',tenantId,reservationId,service,priceCents,currency,chargesCreated:0,paymentVerified:false,fulfillmentAuthorized:false};
}
