// URBAN ONE | Smoobu JSON -> pseudonymous daily turnover tasks.
//
// Pure in-memory mapping ONLY. No Smoobu network access, auth, PMS writes,
// identification, keys, police submissions, payments or public JSON endpoints.
// This module intentionally never copies guest names, contacts or notes.
import {planTurnoverTasks} from '../hospitality/turnover-import.mjs';

const ID=/^[A-Za-z0-9_-]{1,48}$/;
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const MAX_BOOKINGS=1000;
function fail(code){throw new Error(code)}
function idValue(value){
  if(typeof value==='number' && Number.isSafeInteger(value) && value>0)return String(value);
  if(typeof value==='string' && /^\d{1,16}$/.test(value)&&Number(value)>0)return value;
  fail('SMOOBU_IDENTIFIER_INVALID');
}
function validDay(v){
  return typeof v==='string'&&DAY.test(v)&&
    Number.isFinite(Date.parse(v+'T00:00:00Z'))&&
    new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
}
/**
 * Accept a Smoobu GET /api/reservations response already acquired privately
 * by the approved property PMS server. Never expose provider payload in web UI
 * or logs: it can contain guest name, email, phone and other sensitive fields.
 *
 * maps Smoobu apartment IDs to strictly pseudonymous URBAN ONE property IDs.
 * Refuses pagination gaps, unexpected properties, duplicates and invalid dates.
 */
export function normalizeSmoobuTurnover(payload,{
  propertyMapping,authorizedExport=false
}={}){
  if(authorizedExport!==true)fail('OPERATOR_EXPORT_AUTHORIZATION_REQUIRED');
  if(!payload||typeof payload!=='object'||Array.isArray(payload))fail('SMOOBU_RESPONSE_INVALID');
  if(!Array.isArray(payload.bookings)||payload.bookings.length>MAX_BOOKINGS)
    fail('SMOOBU_BOOKING_LIMIT_INVALID');
  if(payload.page_count!==1 || (payload.page!==undefined&&payload.page!==1) ||
     (payload.total_items!==undefined&&
      (!Number.isSafeInteger(payload.total_items)||payload.total_items>payload.bookings.length)))
    fail('SMOOBU_COMPLETE_SINGLE_PAGE_REQUIRED');
  if(!propertyMapping||typeof propertyMapping!=='object'||Array.isArray(propertyMapping)||
      Object.keys(propertyMapping).length===0)fail('PROPERTY_MAPPING_REQUIRED');
  const normalized=[],seen=new Set();let ignoredBlockedOrNonReservation=0;
  for(const record of payload.bookings){
    if(!record||typeof record!=='object'||Array.isArray(record))
      fail('SMOOBU_BOOKING_INVALID');
    // Ignore blocked calendar holds and unsupported lifecycle types, rather
    // than creating a fabricated guest arrival for them.
    if(record.type!=='reservation'||record['is-blocked-booking']===true){
      ignoredBlockedOrNonReservation++;continue;
    }
    const bookId=idValue(record.id);
    const apartmentId=idValue(record.apartment?.id);
    if(!Object.prototype.hasOwnProperty.call(propertyMapping,apartmentId))
      fail('SMOOBU_UNMAPPED_PROPERTY');
    const propertyId=propertyMapping[apartmentId];
    if(typeof propertyId!=='string'||!ID.test(propertyId))
      fail('PROPERTY_MAPPING_INVALID');
    if(!validDay(record.arrival)||!validDay(record.departure)||
       record.arrival>=record.departure)fail('SMOOBU_STAY_DATES_INVALID');
    const key=propertyId+':'+bookId;
    if(seen.has(key))fail('SMOOBU_DUPLICATE_BOOKING');
    seen.add(key);
    normalized.push(Object.freeze({
      reservation_id:'SMOOBU-'+bookId,
      property_id:propertyId,
      arrival_date:record.arrival,
      departure_date:record.departure
    }));
  }
  return {mode:'privately_authorized_export_projection_only',
    provider:'smoobu',sourceApiCalled:false,pmsAccessVerified:false,
    operatorIdentityVerified:false,originalContainsGuestPiiPossible:true,
    rawProviderPayloadPersisted:false,operatorExportAuthorizationSelfDeclared:true,
    ignoredBlockedOrNonReservation,bookings:normalized};
}
export function prepareSmoobuTurnover(payload,{today,propertyMapping,authorizedExport=false}={}){
  const normalized=normalizeSmoobuTurnover(payload,{propertyMapping,authorizedExport});
  const tasks=planTurnoverTasks(normalized.bookings,{today});
  return {
    provider:'smoobu',mode:'local_pseudonymous_projection_no_provider_calls',
    propertyPmsConnected:false,bookingProviderVerified:false,
    alloggiatiProviderConnected:false,pisOrStripeChargesCreated:false,
    receivedSourcePayloadRedacted:true,
    ignoredBlockedOrNonReservation:normalized.ignoredBlockedOrNonReservation,
    reservationCount:tasks.reservationCount,
    today:tasks.today,
    taskCount:tasks.taskCount,
    tasks:tasks.tasks
  };
}
