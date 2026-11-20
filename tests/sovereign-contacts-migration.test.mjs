import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyContactsMigration, createContactsMigrationPlan, exportContactsCsv,
  exportContactsVCard, parseContactsCsv, parseContactsVCard, rollbackContactsMigration,
} from '../apps/seva-enterprise/sovereign-contacts-migration.mjs';

const sample = [
  { id:'g-1', givenName:'Ada', familyName:'Lovelace', email:'ADA@example.com', phone:'+39 333 111 2222', company:'Analytical Engines' },
  { id:'g-2', givenName:'Grace', familyName:'Hopper', email:'grace@example.com' },
];

function plan(records=sample, targetRecords=[]) {
  return createContactsMigrationPlan({
    sourceType:'google_contacts_export', sourceRecords:records, targetRecords,
    consentConfirmed:true, rightToUseConfirmed:true,
  });
}

test('CSV export/import round trip preserves supported fields and leaves consent unknown', () => {
  const csv = exportContactsCsv(sample);
  const parsed = parseContactsCsv(csv);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].email, 'ada@example.com');
  assert.equal(parsed[0].company, 'Analytical Engines');
  assert.equal(parsed[0].consent, 'unknown');
});

test('CSV parser handles quoted commas, quotes and newlines', () => {
  const parsed = parseContactsCsv('givenName,familyName,email,phone,company\r\nAda,Lovelace,ada@example.com,,"Engines, Analytical"\r\n');
  assert.equal(parsed[0].company, 'Engines, Analytical');
});

test('vCard export/import preserves supported fields', () => {
  const parsed = parseContactsVCard(exportContactsVCard(sample));
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].givenName, 'Ada');
  assert.equal(parsed[0].familyName, 'Lovelace');
  assert.equal(parsed[0].email, 'ada@example.com');
  assert.equal(parsed[0].consent, 'unknown');
});

test('consent and right-to-use are required before planning', () => {
  assert.throws(() => createContactsMigrationPlan({
    sourceType:'csv', sourceRecords:sample, consentConfirmed:true,
  }), /EXPLICIT_CONSENT_REQUIRED/);
});

test('Exchange is excluded from the default source policy', () => {
  assert.throws(() => createContactsMigrationPlan({
    sourceType:'exchange', sourceRecords:sample, consentConfirmed:true, rightToUseConfirmed:true,
  }), /EXCHANGE_SOURCE_DISABLED/);
});

test('preview identifies duplicates and never auto-overwrites', () => {
  const result = plan(sample, [{ id:'crm-1', givenName:'Ada', email:'ada@example.com' }]);
  assert.deepEqual(result.summary, { total:2, insert:1, duplicate:1, conflict:0 });
  assert.equal(result.entries.find(item => item.status === 'duplicate').matchedTargetIds[0], 'crm-1');
});

test('ambiguous cross-key matches are conflicts and cannot be applied', async () => {
  const result = plan([{ id:'g-x', givenName:'X', email:'x@example.com', phone:'123' }], [
    { id:'crm-email', givenName:'X', email:'x@example.com' },
    { id:'crm-phone', givenName:'X', phone:'123' },
  ]);
  assert.equal(result.summary.conflict, 1);
  const adapter = fakeAdapter();
  await assert.rejects(() => applyContactsMigration({
    plan:result, confirmationDigest:result.digest, adapter,
  }), /CONFLICTS_REQUIRE_MANUAL_RESOLUTION/);
});

function fakeAdapter() {
  const state = { records:[], backup:null, transaction:false, restored:false };
  return {
    state,
    async snapshot(){ state.backup = [...state.records]; return 'backup-1'; },
    async begin(){ state.transaction = true; },
    async insert(record){ if(!state.transaction) throw Error('NO_TRANSACTION'); state.records.push(record); },
    async commit(){ state.transaction = false; },
    async rollback(){ state.records = [...(state.backup ?? [])]; state.transaction = false; },
    async restoreMigration(){ state.records = [...(state.backup ?? [])]; state.restored = true; },
  };
}

test('apply requires matching digest and inserts only after preview approval', async () => {
  const migrationPlan = plan();
  const adapter = fakeAdapter();
  await assert.rejects(() => applyContactsMigration({
    plan:migrationPlan, confirmationDigest:'wrong', adapter,
  }), /EXPLICIT_PLAN_CONFIRMATION_REQUIRED/);
  const receipt = await applyContactsMigration({
    plan:migrationPlan, confirmationDigest:migrationPlan.digest, adapter,
  });
  assert.equal(receipt.status, 'COMMITTED');
  assert.equal(receipt.insertedCount, 2);
  assert.equal(adapter.state.records.length, 2);
});

test('failed transaction invokes rollback and leaves original state intact', async () => {
  const migrationPlan = plan();
  const adapter = fakeAdapter();
  adapter.state.records.push({ id:'existing' });
  const originalInsert = adapter.insert;
  let calls = 0;
  adapter.insert = async (...args) => {
    if (++calls === 2) throw Error('simulated_failure');
    return originalInsert(...args);
  };
  await assert.rejects(() => applyContactsMigration({
    plan:migrationPlan, confirmationDigest:migrationPlan.digest, adapter,
  }), /simulated_failure/);
  assert.deepEqual(adapter.state.records, [{ id:'existing' }]);
});

test('rollback requires explicit confirmation and restores from backup', async () => {
  const migrationPlan = plan();
  const adapter = fakeAdapter();
  const receipt = await applyContactsMigration({
    plan:migrationPlan, confirmationDigest:migrationPlan.digest, adapter,
  });
  await assert.rejects(() => rollbackContactsMigration({ receipt, adapter }), /EXPLICIT_ROLLBACK_CONFIRMATION_REQUIRED/);
  const result = await rollbackContactsMigration({ receipt, adapter, confirmation:true });
  assert.equal(result.status, 'ROLLED_BACK');
  assert.equal(adapter.state.records.length, 0);
  assert.equal(adapter.state.restored, true);
});
