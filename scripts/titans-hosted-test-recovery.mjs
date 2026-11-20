import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createPersistentTestReconciliationStore } from '../services/titans/persistent-test-reconciliation.mjs';

const sha256File = (path) => createHash('sha256').update(awaitRead(path)).digest('hex');
const awaitRead = (path) => requireRead(path);
import { readFileSync as requireRead } from 'node:fs';

const root = mkdtempSync(join(tmpdir(), 'titans-hosted-recovery-'));
const sourceDb = join(root, 'source.sqlite');
const backupDb = join(root, 'backup.sqlite');
const restoredDb = join(root, 'restored.sqlite');
let store;
try {
  store = createPersistentTestReconciliationStore({ databasePath: sourceDb, environment: 'TEST' });
  const settlement = store.apply({
    type: 'payment.settled', eventId: 'hosted-evt-settle-001',
    idempotencyKey: 'hosted-idem-settle-001', paymentId: 'hosted-pay-001',
    amountMinor: 12500, currency: 'EUR',
  });
  const duplicate = store.apply({
    type: 'payment.settled', eventId: 'hosted-evt-settle-001',
    idempotencyKey: 'hosted-idem-settle-001', paymentId: 'hosted-pay-001',
    amountMinor: 12500, currency: 'EUR',
  });
  store.apply({
    type: 'payment.refunded', eventId: 'hosted-evt-refund-001',
    idempotencyKey: 'hosted-idem-refund-001', paymentId: 'hosted-pay-001',
    amountMinor: 2500, currency: 'EUR',
  });
  const before = store.report();
  assert.equal(settlement.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(before.environment, 'TEST');
  assert.equal(before.eventCount, 2);
  assert.equal(before.transactionCount, 2);
  assert.equal(before.unbalancedTransactions, 0);
  assert.equal(before.integrity.valid, true);
  assert.equal(store.paymentState('hosted-pay-001').refundedMinor, 2500);
  store.close();
  store = undefined;

  // Close/checkpoint before file copy; backup contains synthetic TEST records only.
  copyFileSync(sourceDb, backupDb);
  const backupSha256 = sha256File(backupDb);
  rmSync(sourceDb, { force: true });
  copyFileSync(backupDb, restoredDb);

  const restored = createPersistentTestReconciliationStore({ databasePath: restoredDb, environment: 'TEST' });
  const after = restored.report();
  assert.equal(after.eventCount, 2);
  assert.equal(after.transactionCount, 2);
  assert.equal(after.unbalancedTransactions, 0);
  assert.equal(after.integrity.valid, true);
  assert.equal(restored.paymentState('hosted-pay-001').settledMinor, 12500);
  assert.equal(restored.paymentState('hosted-pay-001').refundedMinor, 2500);
  restored.close();

  mkdirSync(resolve('release'), { recursive: true });
  copyFileSync(backupDb, resolve('release/titans-test-recovery.sqlite'));
  const evidence = {
    schema: 'titans-hosted-test-recovery/v1',
    environment: 'TEST',
    providerConnections: false,
    liveFundsUsed: false,
    syntheticFixture: { paymentId: 'hosted-pay-001', currency: 'EUR', settledMinor: 12500, refundedMinor: 2500 },
    checks: {
      settlementAccepted: true,
      duplicateIdempotencySuppressed: true,
      refundApplied: true,
      journalBalanced: true,
      auditChainValidBeforeBackup: true,
      backupSha256,
      sourceRemovedBeforeRestore: true,
      restoredStateMatches: true,
      restoredAuditChainValid: true,
    },
    beforeBackup: before,
    afterRestore: after,
    commit: process.env.GITHUB_SHA ?? 'local',
    runId: process.env.GITHUB_RUN_ID ?? 'local',
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(resolve('release/titans-test-recovery.json'), JSON.stringify(evidence, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ result: 'PASS', environment: 'TEST', backupSha256, evidence: 'release/titans-test-recovery.json' }) + '\n');
} finally {
  if (store) store.close();
  rmSync(root, { recursive: true, force: true });
}
