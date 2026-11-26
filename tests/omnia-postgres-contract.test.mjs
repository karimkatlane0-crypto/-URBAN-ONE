import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = path => readFile(new URL('../'+path, import.meta.url), 'utf8');

test('URBAN ONE PostgreSQL schema isolates CRM data by tenant', async () => {
  const sql = await read('db/postgres/migrations/0001_omnia_core.sql');
  for (const table of ['tenants','users','tenant_memberships','workspaces','crm_contacts','crm_interactions','crm_tasks','consent_records','audit_events','telegram_bindings','telegram_webhook_receipts']) {
    assert.match(sql, new RegExp('CREATE TABLE urban_one\\.'+table+'\\b'));
  }
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/FORCE ROW LEVEL SECURITY/);
  assert.match(sql,/current_setting\\(''app\\.tenant_id''/);
  assert.match(sql,/CREATE POLICY tenant_ingest_only|CREATE POLICY telegram_ingest_only/);
  assert.match(sql,/module_key='urban-one'/);
});

test('Telegram durable receipt stores only a digest and suppresses duplicate update IDs', async () => {
  const sql = await read('db/postgres/migrations/0001_omnia_core.sql');
  const checks = await read('db/postgres/tests/0001_omnia_rls.sql');
  assert.match(sql,/payload_sha256 text NOT NULL/);
  assert.doesNotMatch(sql,/message_text|raw_payload|message_body/);
  assert.match(sql,/UNIQUE \\(provider,update_id\\)/);
  assert.match(checks,/ON CONFLICT\\(provider,update_id\\) DO NOTHING/);
  assert.match(checks,/cross-tenant CRM read leaked/);
  assert.match(checks,/cross-tenant CRM write unexpectedly succeeded/);
});
