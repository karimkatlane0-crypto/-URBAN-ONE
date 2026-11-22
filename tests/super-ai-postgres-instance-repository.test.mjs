import test from 'node:test';
import assert from 'node:assert/strict';
import { createPostgresInstanceRepository, sha256Request } from '../packages/super-ai/postgres-instance-repository.mjs';

const tenantId = '11111111-1111-4111-8111-111111111111';
const instanceId = '22222222-2222-4222-8222-222222222222';
const base = {
  tenantId, instanceId, actorId: 'actor-1', moduleId: 'seva',
  moduleVersion: '1.0.0', environment: 'test', provider: 'sandbox',
  idempotencyKey: 'request-0001', requestSha256: sha256Request({ module: 'seva' })
};

function fakePool({ membership = [{ role: 'owner' }], prior = [], count = 0, inserted = [] } = {}) {
  const calls = [];
  const client = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT role FROM super_ai.tenant_memberships')) return { rows: membership };
      if (sql.includes('FROM super_ai.instance_idempotency')) return { rows: prior };
      if (sql.includes('count(*)::int')) return { rows: [{ total: count }] };
      if (sql.startsWith('INSERT INTO super_ai.service_instances')) return { rows: inserted };
      return { rows: [] };
    },
    release() { calls.push({ sql: 'RELEASE' }); }
  };
  return { calls, connect: async () => client };
}

test('repository requires a PostgreSQL pool', () => {
  assert.throws(() => createPostgresInstanceRepository({}), /POSTGRES_POOL_REQUIRED/);
});

test('create validates tenant, environment, idempotency and hash before connecting', async () => {
  const pool = fakePool();
  const repo = createPostgresInstanceRepository({ pool });
  await assert.rejects(repo.create({ ...base, tenantId: 'not-a-uuid' }), /INSTANCE_ID_INVALID/);
  await assert.rejects(repo.create({ ...base, environment: 'production-ish' }), /INSTANCE_ENVIRONMENT_INVALID/);
  await assert.rejects(repo.create({ ...base, requestSha256: 'bad' }), /INSTANCE_REQUEST_HASH_INVALID/);
  assert.equal(pool.calls.length, 0);
});

test('create rejects actors without active tenant membership and rolls back', async () => {
  const pool = fakePool({ membership: [] });
  const repo = createPostgresInstanceRepository({ pool });
  await assert.rejects(repo.create(base), /INSTANCE_ACTOR_NOT_A_TENANT_MEMBER/);
  assert.ok(pool.calls.some(call => call.sql === 'ROLLBACK'));
  assert.ok(pool.calls.some(call => call.sql === 'RELEASE'));
});

test('create checks tenant quota under a transaction-scoped advisory lock', async () => {
  const pool = fakePool({ count: 1 });
  const repo = createPostgresInstanceRepository({ pool });
  await assert.rejects(repo.create({ ...base, quota: 1 }), /INSTANCE_TENANT_QUOTA_REACHED/);
  assert.ok(pool.calls.some(call => call.sql.includes('pg_advisory_xact_lock')));
  assert.ok(pool.calls.some(call => call.sql === 'ROLLBACK'));
});

test('idempotency key cannot be reused for a different request hash', async () => {
  const pool = fakePool({ prior: [{ request_sha256: 'a'.repeat(64), instance_id: instanceId, response: null }] });
  const repo = createPostgresInstanceRepository({ pool });
  await assert.rejects(repo.create(base), /INSTANCE_IDEMPOTENCY_CONFLICT/);
});

test('create records a queued instance, idempotency response and audit event', async () => {
  const row = { id: instanceId, tenant_id: tenantId, state: 'queued' };
  const pool = fakePool({ inserted: [row] });
  const repo = createPostgresInstanceRepository({ pool });
  const result = await repo.create(base);
  assert.equal(result.instance.id, instanceId);
  assert.equal(result.replayed, false);
  assert.ok(pool.calls.some(call => call.sql.includes('INSERT INTO super_ai.instance_idempotency')));
  assert.ok(pool.calls.some(call => call.sql.includes('INSERT INTO super_ai.audit_events')));
  assert.ok(pool.calls.some(call => call.sql === 'COMMIT'));
});

test('request hash helper is deterministic and content-sensitive', () => {
  assert.equal(sha256Request({ a: 1 }), sha256Request({ a: 1 }));
  assert.notEqual(sha256Request({ a: 1 }), sha256Request({ a: 2 }));
});
