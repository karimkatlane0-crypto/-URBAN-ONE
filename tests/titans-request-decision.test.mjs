import test from 'node:test';
import assert from 'node:assert/strict';
import {decideTitansRequest} from '../packages/titans/request-decision.mjs';

const now = Date.parse('2026-11-20T12:00:00.000Z');
const request = Object.freeze({
  id: 'req-001',
  status: 'pending',
  recipientId: 'recipient-01',
  requesterId: 'requester-01',
  purpose: 'Share selected professional contact fields for this connection request',
  requestedScopes: ['contact:name', 'contact:email'],
  expiresAt: '2026-11-21T12:00:00.000Z'
});

test('one-click accept grants only the scopes and purpose in this request', () => {
  const result = decideTitansRequest({
    request, actorId: 'recipient-01', actorAuthenticated: true,
    decision: 'accept', now
  });
  assert.equal(result.allowed, true);
  assert.equal(result.requestStatus, 'accepted');
  assert.equal(result.grant.purpose, request.purpose);
  assert.deepEqual(result.grant.scopes, request.requestedScopes);
  assert.equal(result.grant.revoked, false);
  assert.equal(result.auditEvent.event, 'REQUEST_ACCEPTED');
});

test('one-click decline records a decision and creates no grant', () => {
  const result = decideTitansRequest({
    request, actorId: 'recipient-01', actorAuthenticated: true,
    decision: 'decline', now
  });
  assert.equal(result.allowed, true);
  assert.equal(result.requestStatus, 'declined');
  assert.equal(result.grant, null);
  assert.equal(result.auditEvent.event, 'REQUEST_DECLINED');
});

test('only the authenticated intended recipient can decide', () => {
  assert.equal(decideTitansRequest({
    request, actorId: 'other-user', actorAuthenticated: true,
    decision: 'accept', now
  }).reason, 'ACTOR_NOT_RECIPIENT');
  assert.equal(decideTitansRequest({
    request, actorId: 'recipient-01', actorAuthenticated: false,
    decision: 'accept', now
  }).reason, 'ACTOR_NOT_AUTHENTICATED');
});

test('expired, already-decided and invalid requests fail closed', () => {
  assert.equal(decideTitansRequest({
    request: {...request, expiresAt: '2026-11-20T11:59:59.000Z'},
    actorId: 'recipient-01', actorAuthenticated: true, decision: 'accept', now
  }).reason, 'REQUEST_EXPIRED_OR_INVALID');
  assert.equal(decideTitansRequest({
    request: {...request, status: 'accepted'},
    actorId: 'recipient-01', actorAuthenticated: true, decision: 'accept', now
  }).reason, 'REQUEST_NOT_PENDING');
  assert.equal(decideTitansRequest({
    request: {...request, requestedScopes: []},
    actorId: 'recipient-01', actorAuthenticated: true, decision: 'accept', now
  }).reason, 'REQUEST_SCOPES_INVALID');
});

test('unknown decisions and missing purposes are rejected', () => {
  assert.equal(decideTitansRequest({
    request, actorId: 'recipient-01', actorAuthenticated: true,
    decision: 'accept-all', now
  }).reason, 'DECISION_NOT_ALLOWLISTED');
  assert.equal(decideTitansRequest({
    request: {...request, purpose: ''},
    actorId: 'recipient-01', actorAuthenticated: true,
    decision: 'accept', now
  }).reason, 'REQUEST_PURPOSE_REQUIRED');
});

test('wildcard scopes are rejected by the pure decision policy', () => {
  assert.equal(decideTitansRequest({
    request: {...request, requestedScopes: ['*']},
    actorId: 'recipient-01', actorAuthenticated: true,
    decision: 'accept', now
  }).reason, 'REQUEST_SCOPES_INVALID');
});

test('decision policy has no implicit external side effect', () => {
  const result = decideTitansRequest({
    request, actorId: 'recipient-01', actorAuthenticated: true,
    decision: 'accept', now
  });
  assert.equal('send' in result, false);
  assert.equal('transfer' in result, false);
  assert.equal('providerCall' in result, false);
});
