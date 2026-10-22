import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate24HourPreview,noPartnerDataAccess} from '../packages/marketing/preview-policy.mjs';
const base={publishAt:'2026-11-02T12:00:00Z',now:'2026-11-01T12:00:00Z',scope:'public_news',rightsVerified:true,memberOptedIn:true,consentRef:'mock-opt-in'};
test('24 hour preview begins exactly one day before public release',()=>{
  assert.equal(evaluate24HourPreview(base).access,'preview');
  assert.equal(evaluate24HourPreview({...base,now:'2026-11-01T11:59:59Z'}).access,'scheduled');
  assert.equal(evaluate24HourPreview({...base,now:'2026-11-02T11:59:59Z'}).access,'preview');
  assert.equal(evaluate24HourPreview({...base,now:'2026-11-02T12:00:00Z',memberOptedIn:false}).access,'public');
});
test('rights and opt-in fail closed',()=>{
 assert.equal(evaluate24HourPreview({...base,rightsVerified:false}).access,'blocked');
 assert.equal(evaluate24HourPreview({...base,memberOptedIn:false}).access,'scheduled');
 assert.equal(evaluate24HourPreview({...base,consentRef:'unapproved-real-id'}).access,'scheduled');
 assert.throws(()=>evaluate24HourPreview({...base,scope:'booking_guest_data'}),/UNAUTHORIZED_CONTENT_SCOPE/);
 assert.throws(()=>evaluate24HourPreview({...base,now:'tomorrow'}),/UTC_TIMESTAMP_REQUIRED/);
});
test('no Booking provider access is implied by the preview',()=>{
 assert.equal(noPartnerDataAccess().bookingAccess,false);
 assert.equal(noPartnerDataAccess({providerAuthorized:true,propertyAuthorized:true}).otaPriceAccess,false);
});
