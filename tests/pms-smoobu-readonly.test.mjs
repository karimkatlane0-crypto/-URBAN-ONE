import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash, createHmac} from 'node:crypto';
import {buildSmoobuReadRequest, pmsReadiness} from '../packages/bnb/pms-smoobu-readonly.mjs';

const gates = {
  operatorConsent: true,
  pmsAccessApproved: true,
  propertyMappingVerified: true,
  guestDataPurposeApproved: true
};
const credentials = {apiKey: 'test-key-not-real', apiSecret: 'test-secret-not-real'};
const nonce = '550e8400-e29b-41d4-a716-446655440000';
const now = new Date('2026-10-18T08:00:00Z');

test('missing authorizations fail closed and disclose only missing gate names', () => {
  assert.equal(pmsReadiness({}).state, 'ONBOARDING_REQUIRED');
  assert.equal(pmsReadiness(gates).state, 'READ_ONLY_ELIGIBLE');
  assert.throws(
    () => buildSmoobuReadRequest({path:'/api/reservations', query:{from:'2026-10-18',to:'2026-10-19'},credentials}),
    /PMS_ONBOARDING_REQUIRED/
  );
});
test('no direct Booking.com access or write methods can be requested', () => {
  for (const path of ['/api/reservations/123', 'https://booking.com', '/api/rates', '/api/guests']) {
    assert.throws(() => buildSmoobuReadRequest({path,credentials,gates}), /READ_ONLY_PATH_REQUIRED/);
  }
});
test('HMAC matches independently constructed canonical string, with sorted query', () => {
  const request = buildSmoobuReadRequest({
    path:'/api/reservations',
    query:{to:'2026-10-19',from:'2026-10-18'},
    credentials,gates,now,nonce
  });
  assert.equal(request.method,'GET');
  assert.equal(request.url,'https://login.smoobu.com/api/reservations?from=2026-10-18&to=2026-10-19');
  assert.equal(request.headers['X-Timestamp'],'2026-10-18T08:00:00Z');
  const hash = createHash('sha256').update('').digest('hex');
  const canonical = ['GET','/api/reservations','from=2026-10-18&to=2026-10-19',
    '2026-10-18T08:00:00Z',nonce,hash,credentials.apiKey].join('\n');
  const expected = createHmac('sha256',credentials.apiSecret).update(canonical).digest('base64');
  assert.equal(request.headers['X-Signature'],expected);
});
test('invalid dates, excessive ranges, secrets, and extra query fields fail closed', () => {
  for (const query of [
    {from:'2026-02-30',to:'2026-03-02'},
    {from:'2026-10-18',to:'2026-12-21'},
    {from:'2026-10-18',to:'2026-10-19',guest:'secret'},
    {from:'2026-10-19',to:'2026-10-18'}
  ]) {
    assert.throws(() => buildSmoobuReadRequest({path:'/api/reservations',query,credentials,gates,now,nonce}));
  }
  assert.throws(() => buildSmoobuReadRequest({path:'/api/apartments',credentials:{apiKey:'x'},gates}), /SERVER_SIDE_PMS_CREDENTIALS_REQUIRED/);
  assert.throws(() => buildSmoobuReadRequest({path:'/api/apartments',credentials,gates,nonce:'bad'}), /UUID v4/);
});
test('apartment listing is signed as read-only GET', () => {
  const request = buildSmoobuReadRequest({path:'/api/apartments',credentials,gates,now,nonce});
  assert.equal(request.url,'https://login.smoobu.com/api/apartments');
  assert.equal(request.method,'GET');
  assert.ok(request.headers['X-Signature']);
});
