import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPersistentTestReconciliationStore } from '../services/titans/persistent-test-reconciliation.mjs';

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'titans-reconciliation-'));
  const databasePath = join(dir, 'ledger.sqlite');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return { databasePath };
}

const settled = (overrides = {}) => ({
  type: 'payment.settled', eventId: 'evt-settled', idempotencyKey: 'idem-settled',
  paymentId: 'pay-1', amountMinor: 10000, currency: 'EUR', ...overrides,
});
const refund = (overrides = {}) => ({
  type: 'payment.refunded', eventId: 'evt-refund', idempotencyKey: 'idem-refund',
  paymentId: 'pay-1', amountMinor: 2500, currency: 'EUR', ...overrides,
});

test('persistent TEST journal survives close and reopen', (t) => {
  const { databasePath } = fixture(t);
  const first = createPersistentTestReconciliationStore({ databasePath });
  first.apply(settled());
  first.close();
  const reopened = createPersistentTestReconciliationStore({ databasePath });
  t.after(() => reopened.close());
  assert.deepEqual(reopened.paymentState('pay-1'), {
    paymentId: 'pay-1', currency: 'EUR', settledMinor: 10000, refundedMinor: 0,
  });
  assert.equal(reopened.report().eventCount, 1);
});

test('journal uses balanced double-entry rows and reproducible report shape', (t) => {
  const { databasePath } = fixture(t);
  const store = createPersistentTestReconciliationStore({ databasePath });
  t.after(() => store.close());
  store.apply(settled());
  store.apply(refund());
  const report = store.report();
  assert.equal(report.environment, 'TEST');
  assert.equal(report.unbalancedTransactions, 0);
  assert.equal(report.transactionCount, 2);
  assert.equal(report.lines.reduce((sum, line) => sum + line.debitMinor, 0),
    report.lines.reduce((sum, line) => sum + line.creditMinor, 0));
  assert.deepEqual(report.totals, [{ currency: 'EUR', eventAmountMinor: 12500, eventCount: 2 }]);
});

test('duplicate event and idempotency key do not create extra journal entries', (t) => {
  const { databasePath } = fixture(t);
  const store = createPersistentTestReconciliationStore({ databasePath });
  t.after(() => store.close());
  assert.equal(store.apply(settled()).duplicate, false);
  assert.equal(store.apply(settled()).duplicate, true);
  assert.equal(store.report().transactionCount, 1);
});

test('conflicting event identity and idempotency payloads are rejected', (t) => {
  const { databasePath } = fixture(t);
  const store = createPersistentTestReconciliationStore({ databasePath });
  t.after(() => store.close());
  store.apply(settled());
  assert.throws(() => store.apply(settled({ amountMinor: 9000 })), /EVENT_ID_PAYLOAD_CONFLICT/);
  assert.throws(() => store.apply(settled({
    eventId: 'evt-other', idempotencyKey: 'idem-settled', paymentId: 'pay-other',
  })), /IDEMPOTENCY_KEY_PAYLOAD_CONFLICT/);
});

test('out-of-order, currency mismatch and over-refund fail without partial writes', (t) => {
  const { databasePath } = fixture(t);
  const store = createPersistentTestReconciliationStore({ databasePath });
  t.after(() => store.close());
  assert.throws(() => store.apply(refund()), /PAYMENT_NOT_FOUND_OR_OUT_OF_ORDER/);
  assert.equal(store.report().eventCount, 0);
  store.apply(settled());
  assert.throws(() => store.apply(refund({ currency: 'USD' })), /CURRENCY_MISMATCH/);
  assert.throws(() => store.apply(refund({ amountMinor: 10001 })), /REFUND_EXCEEDS_SETTLED_AMOUNT/);
  assert.equal(store.paymentState('pay-1').refundedMinor, 0);
  store.apply(refund());
  store.apply(refund({
    eventId: 'evt-refund-2', idempotencyKey: 'idem-refund-2', amountMinor: 7500,
  }));
  assert.equal(store.paymentState('pay-1').refundedMinor, 10000);
});

test('integrity verifier detects a modified audit hash', (t) => {
  const { databasePath } = fixture(t);
  const store = createPersistentTestReconciliationStore({ databasePath });
  store.apply(settled());
  store.close();
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(databasePath);
  db.prepare("UPDATE audit SET hash='tampered' WHERE sequence=1").run();
  db.close();
  const reopened = createPersistentTestReconciliationStore({ databasePath });
  t.after(() => reopened.close());
  assert.equal(reopened.verifyIntegrity().valid, false);
});

test('LIVE environment is rejected and no provider integration is exposed', (t) => {
  const { databasePath } = fixture(t);
  assert.throws(() => createPersistentTestReconciliationStore({ databasePath, environment: 'LIVE' }), /TEST_ENVIRONMENT_ONLY/);
  const store = createPersistentTestReconciliationStore({ databasePath });
  t.after(() => store.close());
  assert.equal('provider' in store, false);
  assert.equal('charge' in store, false);
});
