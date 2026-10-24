import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTurnoverCsv,planTurnoverTasks,processTurnoverCsv} from '../packages/hospitality/turnover-import.mjs';

const csv='reservation_id,property_id,arrival_date,departure_date\nBOOK-001,PROPERTY-01,2026-10-24,2026-10-27\nBOOK-002,PROPERTY-02,2026-10-23,2026-10-24\n';

test('operator CSV produces tasks with stable identifiers and no provider side effects',()=>{
  const x=processTurnoverCsv(csv,{today:'2026-10-24'});
  assert.equal(x.reservationCount,2);
  assert.equal(x.taskCount,4);
  assert.equal(x.simulatedProviderActions,false);
  assert.equal(x.externalProvidersCalled,false);
  assert.equal(x.guestCheckInAutomaticallyCompleted,false);
  assert.equal(x.actualGuestCheckOutAutomaticallyCompleted,false);
  assert.equal(x.alloggiatiWebSent,false);
  const checkIn=x.tasks.find(t=>t.reservationId==='BOOK-001'&&t.event==='check_in');
  assert.equal(checkIn.phase,'due_today');
  assert.equal(checkIn.status,'OPERATOR_CONFIRMATION_REQUIRED');
  assert.equal(checkIn.guestIdentityVerified,false);
  assert.equal(checkIn.keyReleaseAuthorized,false);
  assert.equal(checkIn.alloggiatiSubmission,'NOT_PERFORMED');
  const checkOut=x.tasks.find(t=>t.reservationId==='BOOK-002'&&t.event==='check_out');
  assert.equal(checkOut.phase,'due_today');
  assert.equal(x.tasks.find(t=>t.reservationId==='BOOK-002'&&t.event==='check_in').phase,'overdue_unconfirmed');
  const again=processTurnoverCsv(csv,{today:'2026-10-24'});
  assert.deepEqual(again,x);
});

test('future and overdue tasks never become completed merely because the date passed',()=>{
 const r=processTurnoverCsv(csv,{today:'2026-11-01'});
 assert.equal(r.tasks.every(t=>t.phase==='overdue_unconfirmed'),true);
 assert.equal(r.tasks.every(t=>t.guestIdentityVerified===false),true);
 assert.equal(r.tasks.every(t=>t.paymentCollected===false),true);
 assert.equal(r.tasks.every(t=>t.requiresStaffReview),true);
});

test('URL-only Gemini user attachments do not count as booking records',()=>{
 for(const input of ['https://gemini.google.com/','   https://gemini.google.com/']){
   assert.throws(()=>parseTurnoverCsv(input),/BOOKING_EXPORT_REQUIRED_NOT_A_LINK/);
 }
});

test('no guest names, document scans, phone numbers or extra columns in permitted export',()=>{
 for(const header of [
   'reservation_id,property_id,arrival_date,departure_date,guest_name',
   'reservation_id,property_id,arrival_date,departure_date,identity_document',
   'reservation_id,property_id,arrival_date,departure_date,email',
   'reservation_id,property_id,arrival_date'
 ]){
   assert.throws(()=>parseTurnoverCsv(header+'\nB-1,P-1,2026-10-24,2026-10-25'),/BOOKING_CSV_HEADER_REQUIRED_NO_GUEST_DATA/);
 }
});

test('reject malformed CSV, injection-like identifiers, collisions and invalid date ranges',()=>{
 const pre='reservation_id,property_id,arrival_date,departure_date\n';
 for(const payload of [
  '=HYPERLINK(1),P-1,2026-10-24,2026-10-25',
  'B-1,P-1,2026-10-31,2026-10-24',
  'B-1,P-1,2026-02-30,2026-03-01',
  'B-1,P-1,2026-10-24,2026-10-24',
  'B-1,P-1,2026-10-24,2026-10-25,EXTRA'
 ]){
   assert.throws(()=>parseTurnoverCsv(pre+payload));
 }
 assert.throws(()=>parseTurnoverCsv(pre+'B-1,P-1,2026-10-24,2026-10-25\nB-1,P-1,2026-10-27,2026-10-30'),/BOOKING_DUPLICATE/);
 assert.throws(()=>parseTurnoverCsv(pre+'"open\nnewline",P-1,2026-10-24,2026-10-25'),/BOOKING_CSV_MULTILINE_REJECTED/);
});

test('strict local date input and bounded exports',()=>{
 assert.throws(()=>planTurnoverTasks([]),/PROPERTY_LOCAL_DATE_REQUIRED/);
 assert.throws(()=>planTurnoverTasks([],{today:'2026-02-30'}),/PROPERTY_LOCAL_DATE_REQUIRED/);
 assert.throws(()=>parseTurnoverCsv('x'.repeat(260000)),/BOOKING_CSV_SIZE_INVALID/);
 const arr=parseTurnoverCsv('\uFEFFdeparture_date,reservation_id,arrival_date,property_id\r\n2026-10-31,"BOOK-01",2026-10-24,P-01\r\n');
 assert.equal(arr[0].reservation_id,'BOOK-01');
 assert.equal(arr[0].property_id,'P-01');
});

test('caller cannot smuggle forged staff confirmation into planned task result',()=>{
 const b={reservation_id:'BOOK-1',property_id:'P-1',arrival_date:'2026-10-24',departure_date:'2026-10-25',
   guestIdentityVerified:true,alloggiatiSubmission:'CONFIRMED',keyReleaseAuthorized:true};
 const r=planTurnoverTasks([b],{today:'2026-10-24'});
 assert.equal(r.tasks[0].guestIdentityVerified,false);
 assert.equal(r.tasks[0].alloggiatiSubmission,'NOT_PERFORMED');
 assert.equal(r.tasks[0].keyReleaseAuthorized,false);
});
