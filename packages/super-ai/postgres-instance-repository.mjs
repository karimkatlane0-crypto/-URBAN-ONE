import { createHash } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requiredString(value, code, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(code);
  return value.trim();
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
}

function validateCreate(input) {
  if (!input || !UUID.test(input.tenantId || '') || !UUID.test(input.instanceId || '')) throw new Error('INSTANCE_ID_INVALID');
  const actorId = requiredString(input.actorId, 'INSTANCE_ACTOR_REQUIRED');
  const moduleId = requiredString(input.moduleId, 'INSTANCE_MODULE_INVALID', 63);
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(moduleId)) throw new Error('INSTANCE_MODULE_INVALID');
  const moduleVersion = requiredString(input.moduleVersion, 'INSTANCE_VERSION_REQUIRED', 80);
  const provider = requiredString(input.provider, 'INSTANCE_PROVIDER_REQUIRED', 80);
  if (!['development', 'test', 'staging', 'production'].includes(input.environment)) throw new Error('INSTANCE_ENVIRONMENT_INVALID');
  if (typeof input.idempotencyKey !== 'string' || input.idempotencyKey.length < 8 || input.idempotencyKey.length > 128) throw new Error('INSTANCE_IDEMPOTENCY_KEY_INVALID');
  if (input.resourceProfile !== undefined && (!input.resourceProfile || typeof input.resourceProfile !== 'object' || Array.isArray(input.resourceProfile))) throw new Error('INSTANCE_RESOURCE_PROFILE_INVALID');
  return {
    tenantId: input.tenantId, instanceId: input.instanceId, actorId, moduleId,
    moduleVersion, provider, environment: input.environment,
    idempotencyKey: input.idempotencyKey,
    resourceProfile: canonicalize(input.resourceProfile ?? {})
  };
}

async function inTenantTransaction(pool, tenantId, work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* preserve original failure */ }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * PostgreSQL-backed Instance Manager repository.
 * Quotas are trusted server configuration or resolved from the tenant plan,
 * never accepted from the request body. actorId must come from authenticated IAM.
 */
export function createPostgresInstanceRepository({ pool, resolveQuota, defaultQuota = 50 }) {
  if (!pool || typeof pool.connect !== 'function') throw new Error('POSTGRES_POOL_REQUIRED');
  if (typeof defaultQuota !== 'number' || !Number.isSafeInteger(defaultQuota) || defaultQuota < 1 || defaultQuota > 100000) {
    throw new Error('INSTANCE_DEFAULT_QUOTA_INVALID');
  }
  if (resolveQuota !== undefined && typeof resolveQuota !== 'function') throw new Error('INSTANCE_QUOTA_RESOLVER_INVALID');

  return Object.freeze({
    async create(input) {
      const data = validateCreate(input);
      const requestSha256 = sha256Request({
        tenantId: data.tenantId, actorId: data.actorId, instanceId: data.instanceId,
        moduleId: data.moduleId, moduleVersion: data.moduleVersion,
        environment: data.environment, provider: data.provider,
        resourceProfile: data.resourceProfile
      });
      return inTenantTransaction(pool, data.tenantId, async client => {
        const membership = await client.query(
          "SELECT role FROM super_ai.tenant_memberships WHERE tenant_id=$1 AND actor_id=$2 AND status='active'",
          [data.tenantId, data.actorId]
        );
        if (!membership.rows?.length) throw new Error('INSTANCE_ACTOR_NOT_A_TENANT_MEMBER');
        if (!['owner', 'admin', 'operator'].includes(membership.rows[0].role)) throw new Error('INSTANCE_PROVISION_FORBIDDEN');

        // Serialize quota and idempotency decisions per tenant across API replicas.
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [data.tenantId]);
        const prior = await client.query(
          'SELECT request_sha256, instance_id, response FROM super_ai.instance_idempotency WHERE tenant_id=$1 AND idempotency_key=$2',
          [data.tenantId, data.idempotencyKey]
        );
        if (prior.rows?.length) {
          const row = prior.rows[0];
          if (row.request_sha256 !== requestSha256) throw new Error('INSTANCE_IDEMPOTENCY_CONFLICT');
          if (row.response) return { ...row.response, replayed: true };
          const existing = await client.query(
            'SELECT id, tenant_id, module_id, module_version, environment, state, provider, provider_instance_id, resource_profile, health, error_code, created_at, updated_at FROM super_ai.service_instances WHERE tenant_id=$1 AND id=$2',
            [data.tenantId, row.instance_id]
          );
          if (!existing.rows?.length) throw new Error('INSTANCE_IDEMPOTENCY_ORPHANED');
          return { instance: existing.rows[0], replayed: true };
        }

        const quota = resolveQuota
          ? await resolveQuota({ client, tenantId: data.tenantId })
          : defaultQuota;
        if (!Number.isSafeInteger(quota) || quota < 1 || quota > 100000) throw new Error('INSTANCE_TENANT_QUOTA_INVALID');
        const count = await client.query(
          "SELECT count(*)::int AS total FROM super_ai.service_instances WHERE tenant_id=$1 AND state IN ('queued','provisioning','running','stopping')",
          [data.tenantId]
        );
        if ((count.rows?.[0]?.total ?? 0) >= quota) throw new Error('INSTANCE_TENANT_QUOTA_REACHED');

        const inserted = await client.query(
          `INSERT INTO super_ai.service_instances
            (id, tenant_id, module_id, module_version, environment, state, provider, resource_profile)
           VALUES ($1,$2,$3,$4,$5,'queued',$6,$7::jsonb)
           RETURNING id, tenant_id, module_id, module_version, environment, state, provider, provider_instance_id, resource_profile, health, error_code, created_at, updated_at`,
          [data.instanceId, data.tenantId, data.moduleId, data.moduleVersion, data.environment, data.provider, JSON.stringify(data.resourceProfile)]
        );
        const response = { instance: inserted.rows[0], replayed: false };
        await client.query(
          'INSERT INTO super_ai.instance_idempotency (tenant_id,idempotency_key,request_sha256,instance_id,response) VALUES ($1,$2,$3,$4,$5::jsonb)',
          [data.tenantId, data.idempotencyKey, requestSha256, data.instanceId, JSON.stringify(response)]
        );
        await client.query(
          'INSERT INTO super_ai.audit_events (tenant_id,actor_id,action,resource_type,resource_id,detail) VALUES ($1,$2,$3,$4,$5,$6::jsonb)',
          [data.tenantId, data.actorId, 'instance.queued', 'service_instance', data.instanceId, JSON.stringify({ moduleId: data.moduleId, environment: data.environment, provider: data.provider })]
        );
        return response;
      });
    },

    async get({ tenantId, actorId, instanceId }) {
      if (!UUID.test(tenantId || '') || !UUID.test(instanceId || '')) throw new Error('INSTANCE_ID_INVALID');
      requiredString(actorId, 'INSTANCE_ACTOR_REQUIRED');
      return inTenantTransaction(pool, tenantId, async client => {
        const access = await client.query(
          "SELECT 1 FROM super_ai.tenant_memberships WHERE tenant_id=$1 AND actor_id=$2 AND status='active'",
          [tenantId, actorId]
        );
        if (!access.rows?.length) throw new Error('INSTANCE_ACTOR_NOT_A_TENANT_MEMBER');
        const result = await client.query(
          'SELECT id, tenant_id, module_id, module_version, environment, state, provider, provider_instance_id, resource_profile, health, error_code, created_at, updated_at FROM super_ai.service_instances WHERE tenant_id=$1 AND id=$2',
          [tenantId, instanceId]
        );
        return result.rows?.[0] ?? null;
      });
    }
  });
}

export function sha256Request(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}
