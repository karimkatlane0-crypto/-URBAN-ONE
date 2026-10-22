import test from 'node:test';
import assert from 'node:assert/strict';
import {newGuestJourney,transitionGuestJourney,mockOptionalServiceQuote} from '../packages/bnb/guest-journey-offline.mjs';
const base={tenantId:'mock-owner',propertyId:'mock-hotel',reservationId:'mock-booking'};
const evidence={operatorRef:'mock-operator',evidenceRef:'mock-provider-proof',tenantId:'mock-owner',approved:true};
test('journey starts as unauthorised offline mock',()=>{const s=newGuestJourney(base);assert.equal(s.state,'received');assert.equal(s.simulation,true);assert.equal(s.paymentVerified,false);assert.equal(s.chargesCreated,0)});
test('check-in/check-out require operator approval and correct sequence',()=>{
 let s=newGuestJourney(base);
 assert.throws(()=>transitionGuestJourney(s,{...evidence,action:'checkin'}),/INVALID_JOURNEY_TRANSITION/);
 assert.throws(()=>transitionGuestJourney(s,{...evidence,action:'verify_reservation',approved:false}),/OPERATOR_AUTH/);
 for(const action of ['verify_reservation','start_prearrival','checkin','start_checkout','checkout','reconcile'])s=transitionGuestJourney(s,{...evidence,action});
 assert.equal(s.state,'reconciled');assert.equal(s.history.length,7);assert.equal(s.paymentVerified,false);assert.equal(s.hostTransfersCreated,0);
});
test('simulation never accepts cross-tenant or real reservation ID',()=>{
 const s=newGuestJourney(base);
 assert.throws(()=>transitionGuestJourney(s,{...evidence,tenantId:'mock-other',action:'verify_reservation'}),/CROSS_TENANT/);
 assert.throws(()=>newGuestJourney({...base,reservationId:'real-reservation-123'}),/SYNTHETIC_REFERENCES/);
});
test('optional-service quote is never a purchase or host settlement',()=>{
 assert.throws(()=>mockOptionalServiceQuote({...base,service:'late_checkout',priceCents:1200}),/PROPERTY_APPROVAL/);
 const s=mockOptionalServiceQuote({...base,service:'late_checkout',priceCents:1200,propertyApproved:true});
 assert.equal(s.state,'quote_only_not_payable');assert.equal(s.paymentVerified,false);assert.equal(s.chargesCreated,0);
 assert.throws(()=>mockOptionalServiceQuote({...base,service:'room_booking',priceCents:1200,propertyApproved:true}),/SERVICE_NOT_AVAILABLE/);
});
