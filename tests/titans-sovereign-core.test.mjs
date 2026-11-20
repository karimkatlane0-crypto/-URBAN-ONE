import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDecisionBrief,
  createAgentTask,
  createCivicRoute,
  createTestReconciliationLedger,
  transitionAgentTask,
} from '../services/titans/sovereign-core.mjs';

test('agent tasks are advisory by default and require explicit human approval', () => {
  const task = createAgentTask({ id: 'task-1', role: 'research', objective: 'Collect primary civic sources' });
  assert.equal(task.state, 'queued');
  assert.equal(task.externalSideEffects, false);
  assert.throws(() => transitionAgentTask(task, 'approved'), /HUMAN_APPROVAL_REQUIRED/);
  assert.equal(transitionAgentTask(task, 'approved', { humanApproved: true }).state, 'approved');
});

test('decision brief combines forward and backward planning and flags non-primary sources', () => {
  const brief = buildDecisionBrief({
    goal: 'Select a safe pedestrian route',
    sources: [
      { title: 'Municipal open data', url: 'https://example.test/data', publishedAt: '2026-11-20', authority: 'primary' },
      { title: 'Community note', url: 'https://example.test/note', publishedAt: '2026-11-19', authority: 'secondary' },
    ],
    alternatives: ['Route A', 'Route B'],
    risks: ['Temporary roadworks'],
  });
  assert.deepEqual(brief.method, ['forward', 'backward']);
  assert.equal(brief.unresolvedSourceCount, 1);
  assert.equal(brief.decision, 'HUMAN_DECISION_REQUIRED');
  assert.equal(brief.releaseAuthorized, false);
});

test('civic route requires consent and validates coordinates', () => {
  assert.throws(() => createCivicRoute({ consentGranted: false, stops: [] }), /LOCATION_CONSENT_REQUIRED/);
  const route = createCivicRoute({
    consentGranted: true,
    stops: [
      { id: 'start', latitude: 45.65, longitude: 13.77 },
      { id: 'finish', latitude: 45.66, longitude: 13.78 },
    ],
  });
  assert.equal(route.liveGpsRead, false);
  assert.equal(route.backgroundTracking, false);
  assert.equal(route.stops.length, 2);
  assert.throws(() => createCivicRoute({ consentGranted: true, stops: [{ id: 'a', latitude: 100, longitude: 0 }, { id: 'b', latitude: 0, longitude: 0 }] }), /invalid latitude/);
});

test('reconciliation ledger is TEST-only, idempotent and append-only', () => {
  assert.throws(() => createTestReconciliationLedger({ environment: 'LIVE' }), /TEST_ENVIRONMENT_ONLY/);
  const ledger = createTestReconciliationLedger();
  const payment = { type: 'payment.settled', eventId: 'evt-1', idempotencyKey: 'idem-1', paymentId: 'pay-1', amountMinor: 5000, currency: 'EUR' };
  const first = ledger.apply(payment);
  const duplicate = ledger.apply(payment);
  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(ledger.entries().length, 1);
  assert.equal(ledger.auditTrail().length, 1);
  assert.throws(() => ledger.apply({ ...payment, amountMinor: 6000 }), /EVENT_ID_PAYLOAD_CONFLICT/);
});

test('refunds reconcile against settled amount and preserve a hash-linked audit trail', () => {
  const ledger = createTestReconciliationLedger();
  ledger.apply({ type: 'payment.settled', eventId: 'evt-pay', idempotencyKey: 'idem-pay', paymentId: 'pay-2', amountMinor: 10000, currency: 'EUR' });
  ledger.apply({ type: 'payment.refunded', eventId: 'evt-refund', idempotencyKey: 'idem-refund', paymentId: 'pay-2', amountMinor: 2500, currency: 'EUR' });
  assert.equal(ledger.paymentState('pay-2').refundedMinor, 2500);
  assert.equal(ledger.entries().length, 2);
  const [first, second] = ledger.auditTrail();
  assert.equal(second.previousHash, first.hash);
  assert.match(second.hash, /^[a-f0-9]{64}$/);
  assert.throws(() => ledger.apply({ type: 'payment.refunded', eventId: 'evt-over', idempotencyKey: 'idem-over', paymentId: 'pay-2', amountMinor: 8000, currency: 'EUR' }), /REFUND_EXCEEDS_SETTLED_AMOUNT/);
});

test('idempotency key cannot be reused with a different payload', () => {
  const ledger = createTestReconciliationLedger();
  ledger.apply({ type: 'payment.settled', eventId: 'evt-a', idempotencyKey: 'same-key', paymentId: 'pay-a', amountMinor: 100, currency: 'EUR' });
  assert.throws(() => ledger.apply({ type: 'payment.settled', eventId: 'evt-b', idempotencyKey: 'same-key', paymentId: 'pay-b', amountMinor: 100, currency: 'EUR' }), /IDEMPOTENCY_KEY_PAYLOAD_CONFLICT/);
});
