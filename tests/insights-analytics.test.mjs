import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInsightsAnalytics, INSIGHTS_TEST_PURPOSE } from '../packages/insights/analytics.mjs';

const consent = { granted: true, purpose: INSIGHTS_TEST_PURPOSE, at: '2026-11-20T18:00:00.000Z' };
const make = (tenantId = 'tenant-test-a') => createInsightsAnalytics({ tenantId, consent });
const event = (overrides = {}) => ({
  eventId: 'evt-001',
  tenantId: 'tenant-test-a',
  type: 'match_created',
  occurredAt: '2026-11-20T18:01:00.000Z',
  ...overrides
});

test('requires explicit consent for the exact TEST analytics purpose', () => {
  assert.throws(() => createInsightsAnalytics({ tenantId: 'tenant-test-a' }), /CONSENT_REQUIRED/);
  assert.throws(() => createInsightsAnalytics({
    tenantId: 'tenant-test-a',
    consent: { granted: true, purpose: 'marketing:send' }
  }), /CONSENT_PURPOSE_MISMATCH/);
  assert.throws(() => createInsightsAnalytics({
    tenantId: 'tenant-test-a', consent, purpose: 'insights:live'
  }), /INSIGHTS_TEST_PURPOSE_REQUIRED/);
});

test('enforces tenant isolation and rejects personal-data fields', () => {
  const ledger = make();
  assert.throws(() => ledger.ingest(event({ tenantId: 'tenant-test-b' })), /TENANT_MISMATCH/);
  assert.throws(() => ledger.ingest(event({ email: 'person@example.invalid' })), /EVENT_FIELD_NOT_ALLOWED/);
  assert.equal(ledger.metrics().eventCount, 0);
});

test('is idempotent for identical events and rejects conflicting event IDs', () => {
  const ledger = make();
  const first = ledger.ingest(event());
  const duplicate = ledger.ingest(event());
  assert.equal(first.accepted, true);
  assert.equal(duplicate.duplicate, true);
  assert.throws(() => ledger.ingest(event({ type: 'visit_requested' })), /IDEMPOTENCY_CONFLICT/);
  assert.equal(ledger.metrics().eventCount, 1);
});

test('reconciles captured payments and partial refunds without exceeding capture', () => {
  const ledger = make();
  ledger.ingest(event({ eventId: 'match-1' }));
  ledger.ingest(event({ eventId: 'paid-1', type: 'payment_captured', amountMinor: 12500, currency: 'EUR', paymentRef: 'pay-test-1' }));
  ledger.ingest(event({ eventId: 'refund-1', type: 'payment_refunded', amountMinor: 2500, currency: 'EUR', paymentRef: 'pay-test-1' }));
  assert.throws(() => ledger.ingest(event({
    eventId: 'refund-2', type: 'payment_refunded', amountMinor: 10001, currency: 'EUR', paymentRef: 'pay-test-1'
  })), /REFUND_EXCEEDS_CAPTURE/);
  assert.deepEqual(ledger.metrics().money, [{ currency: 'EUR', grossMinor: 12500, refundedMinor: 2500, netMinor: 10000 }]);
  assert.equal(ledger.metrics().conversionMatchToPaid, 1);
});

test('rejects currency mismatch and duplicate capture references', () => {
  const ledger = make();
  ledger.ingest(event({ eventId: 'paid-1', type: 'payment_captured', amountMinor: 5000, currency: 'EUR', paymentRef: 'pay-test-2' }));
  assert.throws(() => ledger.ingest(event({
    eventId: 'refund-1', type: 'payment_refunded', amountMinor: 1000, currency: 'USD', paymentRef: 'pay-test-2'
  })), /REFUND_CURRENCY_MISMATCH/);
  assert.throws(() => ledger.ingest(event({
    eventId: 'paid-2', type: 'payment_captured', amountMinor: 5000, currency: 'EUR', paymentRef: 'pay-test-2'
  })), /PAYMENT_CAPTURE_ALREADY_EXISTS/);
});

test('creates a verifiable append-only audit hash chain', () => {
  const ledger = make();
  ledger.ingest(event({ eventId: 'a' }));
  ledger.ingest(event({ eventId: 'b', type: 'visit_requested' }));
  const result = ledger.verifyAudit();
  assert.equal(result.valid, true);
  assert.equal(result.checked, 2);
  assert.equal(ledger.auditSnapshot().length, 2);
});

test('keeps all state in memory and performs no provider dispatch', () => {
  const source = readFileSync(new URL('../packages/insights/analytics.mjs', import.meta.url), 'utf8');
  assert.match(source, /In-memory/);
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|localStorage|process\.env|https:\/\//);
});
