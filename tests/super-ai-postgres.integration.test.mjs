import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createPostgresInstanceRepository } from '../packages/super-ai/postgres-instance-repository.mjs';
import { runPostgresMigrations } from '../packages/super-ai/postgres-migrations.mjs';
import { createPostgresStripeEventStore } from '../packages/super-ai/postgres-stripe-event-store.mjs';
import { createPostgresMembershipResolver } from '../services/api/postgres-membership-resolver.mjs';
import { createPlatformApiServer } from '../services/api/platform-server.mjs';

const connectionString = process.env.SUPER_AI_TEST_DATABASE_URL;

test('PostgreSQL control plane migration, RLS and Instance Manager integration', {
  skip: !connectionString ? 'SUPER_AI_TEST_DATABASE_URL is not configured; CI provides an ephemeral PostgreSQL 17 service' : false
}, async () => {
  const { Pool } = await import('pg');
  const ownerPool = new Pool({ connectionString, max: 4 });
  let appPool;
  const migrationDirectory = fileURLToPath(new URL('../packages/super-ai/migrations/', import.meta.url));
  const appPassword = 'super-ai-ci-only-password';

  try {
    await ownerPool.query('DROP SCHEMA IF EXISTS super_ai CASCADE');
    await ownerPool.query('DROP OWNED BY super_ai_test_app').catch(() => {});
    await ownerPool.query('DROP ROLE IF EXISTS super_ai_test_app');
    await ownerPool.query("CREATE ROLE super_ai_test_app LOGIN PASSWORD 'super-ai-ci-only-password' NOSUPERUSER NOBYPASSRLS");

    const migration = await runPostgresMigrations({ pool: ownerPool, directory: migrationDirectory });
    assert.deepEqual(migration.applied, ['0001', '0002']);
    const replay = await runPostgresMigrations({ pool: ownerPool, directory: migrationDirectory });
    assert.deepEqual(replay.applied, []);

    await ownerPool.query('GRANT USAGE ON SCHEMA super_ai TO super_ai_test_app');
    await ownerPool.query('GRANT SELECT ON super_ai.tenants, super_ai.tenant_memberships TO super_ai_test_app');
    await ownerPool.query('GRANT SELECT, INSERT ON super_ai.service_instances, super_ai.instance_idempotency TO super_ai_test_app');
    await ownerPool.query('GRANT SELECT, INSERT, UPDATE, DELETE ON super_ai.audit_events TO super_ai_test_app');
    await ownerPool.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA super_ai TO super_ai_test_app');

    const tenantA = '11111111-1111-4111-8111-111111111111';
    const tenantB = '22222222-2222-4222-8222-222222222222';
    await ownerPool.query(
      "INSERT INTO super_ai.tenants(id,slug,display_name) VALUES ($1,'tenant-a','Tenant A'),($2,'tenant-b','Tenant B')",
      [tenantA, tenantB]
    );
    await ownerPool.query(
      "INSERT INTO super_ai.tenant_memberships(tenant_id,actor_id,role) VALUES ($1,'actor-a','owner'),($2,'actor-b','owner')",
      [tenantA, tenantB]
    );

    const appUrl = new URL(connectionString);
    appUrl.username = 'super_ai_test_app';
    appUrl.password = appPassword;
    appPool = new Pool({ connectionString: appUrl.toString(), max: 4 });

    const eventStore = createPostgresStripeEventStore({ pool: ownerPool });
    const event = {
      id: 'evt_super_ai_ci_0001',
      type: 'payment_intent.succeeded',
      livemode: false,
      created: 1800000000,
      data: { object: { id: 'pi_super_ai_ci_0001' } }
    };
    const firstReceipt = await eventStore.record(event);
    assert.deepEqual(firstReceipt, { stored: true, duplicate: false });
    const duplicateReceipt = await eventStore.record(event);
    assert.deepEqual(duplicateReceipt, { stored: true, duplicate: true });
    await assert.rejects(
      eventStore.record({ ...event, type: 'charge.refunded' }),
      /STRIPE_EVENT_ID_CONFLICT/
    );

    await assert.rejects(
      appPool.query('SELECT event_id FROM super_ai.stripe_webhook_events'),
      /permission denied/
    );

    const resolveMembership = createPostgresMembershipResolver({
      pool: appPool,
      roleScopes: {
        owner: ['instances:read', 'instances:write'],
        operator: ['instances:read', 'instances:write'],
        viewer: ['instances:read']
      }
    });
    const membershipA = await resolveMembership({ actorId: 'actor-a', tenantId: tenantA });
    assert.deepEqual(membershipA, {
      tenantId: tenantA,
      role: 'owner',
      status: 'active',
      scopes: ['instances:read', 'instances:write']
    });
    assert.equal(await resolveMembership({ actorId: 'actor-a', tenantId: tenantB }), null);
    assert.equal(await resolveMembership({ actorId: 'unknown-actor', tenantId: tenantA }), null);

    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'super-ai-postgres-ci-key', use: 'sig', alg: 'RS256' };
    const iamEnv = {
      IAM_ISSUER: 'https://issuer.integration.test',
      IAM_AUDIENCE: 'super-ai-api',
      IAM_JWKS_URL: 'https://issuer.integration.test/.well-known/jwks.json',
      IAM_ALLOWED_ALGORITHMS: 'RS256',
      IAM_CLOCK_TOLERANCE_SECONDS: '0'
    };
    const issuedAt = 1800000000;
    const tokenHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: jwk.kid })).toString('base64url');
    const tokenClaims = Buffer.from(JSON.stringify({
      iss: iamEnv.IAM_ISSUER,
      aud: iamEnv.IAM_AUDIENCE,
      sub: 'actor-a',
      exp: issuedAt + 300,
      iat: issuedAt - 10,
      scopes: ['*'],
      tenant_id: tenantB
    })).toString('base64url');
    const signingInput = tokenHeader + '.' + tokenClaims;
    const token = signingInput + '.' + sign('RSA-SHA256', Buffer.from(signingInput), privateKey).toString('base64url');
    const platformServer = createPlatformApiServer({
      env: iamEnv,
      pool: appPool,
      roleScopes: { owner: ['contacts:read'] },
      fetchImpl: async () => ({ ok: true, json: async () => ({ keys: [jwk] }) }),
      nowSeconds: () => issuedAt
    });
    await new Promise(resolve => platformServer.listen(0, '127.0.0.1', resolve));
    const platformAddress = platformServer.address();
    try {
      const authorized = await fetch(`http://127.0.0.1:${platformAddress.port}/api/contacts/import-preview`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + token,
          'x-tenant-id': tenantA,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ records: [] })
      });
      assert.equal(authorized.status, 200);
      const denied = await fetch(`http://127.0.0.1:${platformAddress.port}/api/contacts/import-preview`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + token,
          'x-tenant-id': tenantB,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ records: [] })
      });
      assert.equal(denied.status, 401);
    } finally {
      await new Promise((resolve, reject) => platformServer.close(error => error ? reject(error) : resolve()));
    }

    const repository = createPostgresInstanceRepository({ pool: appPool, defaultQuota: 1 });
    const instanceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const request = {
      tenantId: tenantA,
      actorId: 'actor-a',
      instanceId,
      moduleId: 'seva-crm',
      moduleVersion: '1.0.0',
      provider: 'sandbox',
      environment: 'test',
      idempotencyKey: 'tenant-a-request-0001',
      resourceProfile: { memoryMb: 256 }
    };

    const created = await repository.create(request);
    assert.equal(created.instance.id, instanceId);
    assert.equal(created.instance.state, 'queued');
    assert.equal(created.replayed, false);

    const replayed = await repository.create(request);
    assert.equal(replayed.replayed, true);
    assert.equal(replayed.instance.id, instanceId);

    await assert.rejects(
      repository.create({ ...request, instanceId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', idempotencyKey: 'tenant-a-request-0002' }),
      /INSTANCE_TENANT_QUOTA_REACHED/
    );

    const visibleToA = await repository.get({ tenantId: tenantA, actorId: 'actor-a', instanceId });
    assert.equal(visibleToA.id, instanceId);
    const crossTenantLookup = await repository.get({ tenantId: tenantB, actorId: 'actor-b', instanceId });
    assert.equal(crossTenantLookup, null);
    await assert.rejects(
      repository.get({ tenantId: tenantB, actorId: 'actor-a', instanceId }),
      /INSTANCE_ACTOR_NOT_A_TENANT_MEMBER/
    );

    const rlsClient = await appPool.connect();
    try {
      await rlsClient.query('BEGIN');
      await rlsClient.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA]);
      const rows = await rlsClient.query('SELECT tenant_id,id FROM super_ai.service_instances');
      assert.equal(rows.rowCount, 1);
      assert.equal(rows.rows[0].tenant_id, tenantA);
      const crossInsert = await rlsClient.query(
        "INSERT INTO super_ai.service_instances(id,tenant_id,module_id,module_version,environment,state,provider) VALUES ($1,$2,'cross-tenant','1','test','queued','sandbox')",
        ['cccccccc-cccc-4ccc-8ccc-cccccccccccc', tenantB]
      ).catch(error => error);
      assert.match(crossInsert.message, /row-level security|violates row-level security/i);
      await rlsClient.query('ROLLBACK');
    } finally {
      rlsClient.release();
    }

    const auditClient = await appPool.connect();
    try {
      await auditClient.query('BEGIN');
      await auditClient.query("SELECT set_config('app.tenant_id', $1, true)", [tenantA]);
      const audit = await auditClient.query('SELECT id FROM super_ai.audit_events WHERE tenant_id=$1', [tenantA]);
      assert.equal(audit.rowCount, 1);
      await assert.rejects(
        auditClient.query("UPDATE super_ai.audit_events SET detail='{}'::jsonb WHERE tenant_id=$1", [tenantA]),
        /AUDIT_EVENTS_APPEND_ONLY/
      );
      await auditClient.query('ROLLBACK');
    } finally {
      auditClient.release();
    }

    const rollback = await runPostgresMigrations({
      pool: ownerPool,
      directory: migrationDirectory,
      direction: 'down',
      allowDestructiveRollback: true
    });
    assert.deepEqual(rollback.applied, ['0002']);
    const rollbackCore = await runPostgresMigrations({
      pool: ownerPool,
      directory: migrationDirectory,
      direction: 'down',
      allowDestructiveRollback: true
    });
    assert.deepEqual(rollbackCore.applied, ['0001']);
    const reapply = await runPostgresMigrations({ pool: ownerPool, directory: migrationDirectory });
    assert.deepEqual(reapply.applied, ['0001', '0002']);
  } finally {
    if (appPool) await appPool.end();
    await ownerPool.query('DROP SCHEMA IF EXISTS super_ai CASCADE').catch(() => {});
    await ownerPool.query('DROP ROLE IF EXISTS super_ai_test_app').catch(() => {});
    await ownerPool.end();
  }
});
