import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSmoobuTurnover,prepareSmoobuTurnover} from '../packages/hospitality/pms-smoobu-turnover.mjs';
const mapping={'50017':'PROPERTY-01'};
const row={id:291,type:'reservation',arrival:'2026-10-24',departure:'2026-10-27',
  apartment:{id:50017,name:'Secret address'},channel:{name:'Booking.com'},
  'guest-name':'Example Guest','email':'not-for-logs@example.com','phone':'999777',
  notice:'PRIVATE_DOCUMENT_PASSPORT','guest-app-url':'https://guest.smoobu.com/?t=PRIVATE_TOKEN',
  price:300, 'is-blocked-booking':false};
const payload={page_count:1,page:1,total_items:1,bookings:[row]};
test('Smoobu private JSON becomes task-only pseudonymous projection',()=>{
  const out=prepareSmoobuTurnover(payload,{today:'2026-10-24',propertyMapping:mapping,authorizedExport:true});
  assert.equal(out.provider,'smoobu');
  assert.equal(out.reservationCount,1);
  assert.equal(out.tasks.length,2);
  assert.equal(out.tasks[0].reservationId,'SMOOBU-291');
  assert.equal(out.tasks[0].propertyId,'PROPERTY-01');
  assert.equal(out.tasks[0].status,'OPERATOR_CONFIRMATION_REQUIRED');
  assert.equal(out.tasks[0].guestIdentityVerified,false);
  assert.equal(out.tasks[0].physicalPresenceVerified,false);
  assert.equal(out.tasks[0].alloggiatiSubmission,'NOT_PERFORMED');
  assert.equal(out.propertyPmsConnected,false);
  assert.equal(out.bookingProviderVerified,false);
  assert.equal(out.alloggiatiProviderConnected,false);
  assert.equal(out.pisOrStripeChargesCreated,false);
  for(const forbidden of ['Example Guest','not-for-logs','999777','PRIVATE_DOCUMENT','PRIVATE_TOKEN','Secret address'])
    assert.equal(JSON.stringify(out).includes(forbidden),false);
});
test('unapproved export or unknown property blocked',()=>{
  assert.throws(()=>normalizeSmoobuTurnover(payload,{propertyMapping:mapping}),/OPERATOR_EXPORT_AUTHORIZATION_REQUIRED/);
  assert.throws(()=>normalizeSmoobuTurnover(payload,{authorizedExport:true,propertyMapping:{'123':'PROPERTY-01'}}),/SMOOBU_UNMAPPED_PROPERTY/);
  assert.throws(()=>normalizeSmoobuTurnover(payload,{authorizedExport:true,propertyMapping:{}}),/PROPERTY_MAPPING_REQUIRED/);
});
test('cancelled or blocked records do not create arrival events',()=>{
  const p={page_count:1,page:1,total_items:3,bookings:[
    {...row,id:292,type:'cancellation'}, {...row,id:293,'is-blocked-booking':true},row]};
  const out=prepareSmoobuTurnover(p,{today:'2026-10-25',propertyMapping:mapping,authorizedExport:true});
  assert.equal(out.reservationCount,1);
  assert.equal(out.ignoredBlockedOrNonReservation,2);
});
test('reject partial pagination instead of losing guest reservations',()=>{
  for(const p of [{...payload,page_count:2},
    {...payload,page:2},{...payload,total_items:4}])
    assert.throws(()=>normalizeSmoobuTurnover(p,{propertyMapping:mapping,authorizedExport:true}),/SINGLE_PAGE_REQUIRED/);
});
test('invalid dates, duplicate IDs and malicious mapping rejected',()=>{
  const cfg={propertyMapping:mapping,authorizedExport:true};
  for(const rowUpdate of [
    {arrival:'2026-02-30'}, {departure:'2026-10-20'}, {id:'x'},
    {apartment:{id:888}},{arrival:'2026-10-24T00:00:00Z'}]){
     assert.throws(()=>normalizeSmoobuTurnover(
       {...payload,bookings:[{...row,...rowUpdate}]},cfg));
  }
  assert.throws(()=>normalizeSmoobuTurnover(
   {...payload,total_items:2,bookings:[row,row]},cfg),/SMOOBU_DUPLICATE_BOOKING/);
  assert.throws(()=>normalizeSmoobuTurnover(payload,
    {authorizedExport:true,propertyMapping:{'50017':'../../etc/passwd'}}),/PROPERTY_MAPPING_INVALID/);
});
