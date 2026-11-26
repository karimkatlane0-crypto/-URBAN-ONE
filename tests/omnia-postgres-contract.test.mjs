import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = path => readFile(new URL('../'+path, import.meta.url), 'utf8');

test('URBAN ONE PostgreSQL schema isolates CRM data by tenant', async () => {
  const sql = await read('db/postgres/migrations/0001_omnia_core.sql');
  for (const table of ['tenants','users','tenant_memberships','workspaces','crm_contacts','crm_interactions','crm_tasks','consent_records','audit_events','telegram_bindings','telegram_webhook_receipts']) {
    assert.ok(sql.includes('CREATE TABLE urban_one.'+table), 'missing URBAN ONE table: '+table);
  }
  assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'));
  assert.ok(sql.includes('FORCE ROW LEVEL SECURITY'));
  assert.ok(sql.includes("current_setting(''app.tenant_id''"));
  assert.ok(sql.includes("module_key='urban-one'"));
});

test('Telegram durable receipt stores only a digest and suppresses duplicate update IDs', async () => {
  const sql = await read('db/postgres/migrations/0001_omnia_core.sql');
  const checks = await read('db/postgres/tests/0001_omnia_rls.sql');
  assert.ok(sql.includes('payload_sha256 text NOT NULL'));
  assert.doesNotMatch(sql,/message_text|raw_payload|message_body/);
  assert.ok(sql.includes('UNIQUE (provider,update_id)'));
  assert.ok(checks.includes('ON CONFLICT(provider,update_id) DO NOTHING'));
  assert.ok(checks.includes('cross-tenant CRM read leaked'));
  assert.ok(checks.includes('cross-tenant CRM write unexpectedly succeeded'));
});
