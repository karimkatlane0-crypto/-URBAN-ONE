import { randomUUID } from 'node:crypto';

const MODULE_ID = /^[a-z][a-z0-9-]{1,62}$/;
const TENANT_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/;
const ENVIRONMENTS = new Set(['development', 'test', 'staging', 'production']);
const ACTIVE = new Set(['provisioning', 'running', 'stopping']);
const TERMINAL = new Set(['failed', 'stopped', 'deleted']);

function fail(code) { throw new Error(code); }
function clone(value) { return structuredClone(value); }
function safeManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || !MODULE_ID.test(manifest.id ?? '')) fail('MODULE_MANIFEST_INVALID');
  if (typeof manifest.version !== 'string' || !manifest.version.trim()) fail('MODULE_VERSION_REQUIRED');
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.some(x => typeof x !== 'string' || !/^[a-z][a-z0-9._:-]{1,63}$/.test(x))) fail('MODULE_CAPABILITIES_INVALID');
  const profile = manifest.resourceProfile ?? {};
  for (const key of ['cpu', 'memoryMb', 'storageMb']) {
    if (!Number.isSafeInteger(profile[key]) || profile[key] < 1) fail('MODULE_RESOURCE_PROFILE_INVALID');
  }
  return Object.freeze({
    id: manifest.id,
    version: manifest.version,
    description: String(manifest.description ?? '').slice(0, 240),
    capabilities: Object.freeze([...new Set(manifest.capabilities)]),
    resourceProfile: Object.freeze({ cpu: profile.cpu, memoryMb: profile.memoryMb, storageMb: profile.storageMb }),
    environments: Object.freeze([...(manifest.environments ?? ['development', 'test', 'staging'])])
  });
}
function publicRecord(record) {
  const { id, tenantId, moduleId, version, environment, state, createdAt, updatedAt, health, resourceProfile, errorCode } = record;
  return Object.freeze(clone({ id, tenantId, moduleId, version, environment, state, createdAt, updatedAt, health, resourceProfile, ...(errorCode ? { errorCode } : {}) }));
}

/**
 * Provider-neutral instance lifecycle manager.
 * The registry is in-memory by default. Production must inject a durable store,
 * authenticated provisioner, isolated runtime/network policy and health adapter.
 * This module never executes shell commands or makes network requests itself.
 */
export function createInstanceManager({
  catalog = [],
  provisioner,
  store = new Map(),
  authorize = async () => false,
  clock = () => new Date().toISOString(),
  maxInstancesPerTenant = 10
} = {}) {
  if (!provisioner || typeof provisioner.provision !== 'function' || typeof provisioner.stop !== 'function') fail('PROVISIONER_ADAPTER_REQUIRED');
  if (!(store instanceof Map) && (!store || typeof store.get !== 'function' || typeof store.set !== 'function' || typeof store.values !== 'function')) fail('INSTANCE_STORE_INVALID');
  if (!Number.isSafeInteger(maxInstancesPerTenant) || maxInstancesPerTenant < 1) fail('INSTANCE_LIMIT_INVALID');
  const modules = new Map();
  for (const raw of catalog) {
    const manifest = safeManifest(raw);
    if (modules.has(manifest.id)) fail('MODULE_DUPLICATE');
    modules.set(manifest.id, manifest);
  }
  const idempotency = new Map();

  async function approval(action, context) {
    const accepted = await authorize(Object.freeze({ action, ...context }));
    if (accepted !== true) fail('HUMAN_APPROVAL_REQUIRED');
  }
  function tenant(value) { if (typeof value !== 'string' || !TENANT_ID.test(value)) fail('TENANT_ID_INVALID'); return value; }
  function owned(id, tenantId) {
    const record = store.get(id);
    if (!record || record.tenantId !== tenantId) fail('INSTANCE_NOT_FOUND');
    return record;
  }
  function countActive(tenantId) {
    return [...store.values()].filter(x => x.tenantId === tenantId && ACTIVE.has(x.state)).length;
  }

  return Object.freeze({
    catalog() { return Object.freeze([...modules.values()].map(x => clone(x))); },

    async create({ tenantId, moduleId, version, environment = 'development', idempotencyKey } = {}) {
      tenantId = tenant(tenantId);
      if (typeof moduleId !== 'string' || !modules.has(moduleId)) fail('MODULE_NOT_FOUND');
      const manifest = modules.get(moduleId);
      if (version && version !== manifest.version) fail('MODULE_VERSION_UNAVAILABLE');
      if (!ENVIRONMENTS.has(environment) || !manifest.environments.includes(environment)) fail('ENVIRONMENT_NOT_ALLOWED');
      if (typeof idempotencyKey !== 'string' || !IDEMPOTENCY_KEY.test(idempotencyKey)) fail('IDEMPOTENCY_KEY_INVALID');
      const idem = tenantId + ':' + idempotencyKey;
      if (idempotency.has(idem)) return publicRecord(owned(idempotency.get(idem), tenantId));
      if (countActive(tenantId) >= maxInstancesPerTenant) fail('TENANT_INSTANCE_LIMIT_REACHED');
      await approval('instance.create', { tenantId, moduleId, version: manifest.version, environment });
      const id = randomUUID();
      const now = clock();
      const record = {
        id, tenantId, moduleId, version: manifest.version, environment,
        state: 'provisioning', createdAt: now, updatedAt: now,
        health: { status: 'unknown', checkedAt: null },
        resourceProfile: clone(manifest.resourceProfile)
      };
      store.set(id, record);
      idempotency.set(idem, id);
      try {
        const result = await provisioner.provision(Object.freeze({
          instanceId: id, tenantId, moduleId, version: manifest.version, environment,
          resourceProfile: clone(manifest.resourceProfile),
          isolation: Object.freeze({ tenantScoped: true, dedicatedIdentity: true, networkPolicy: 'deny-by-default', secretScope: 'instance-only' }),
          capabilities: [...manifest.capabilities]
        }));
        if (!result || result.accepted !== true) fail('PROVISIONING_REJECTED');
        record.state = 'running';
        record.updatedAt = clock();
        record.health = { status: 'unknown', checkedAt: null };
        record.providerInstanceId = typeof result.providerInstanceId === 'string' ? result.providerInstanceId : null;
        return publicRecord(record);
      } catch (error) {
        record.state = 'failed';
        record.errorCode = /^[A-Z0-9_]{1,64}$/.test(error?.message ?? '') ? error.message : 'PROVISIONING_FAILED';
        record.updatedAt = clock();
        throw error;
      }
    },

    get({ tenantId, instanceId } = {}) {
      tenantId = tenant(tenantId);
      return publicRecord(owned(instanceId, tenantId));
    },

    list({ tenantId, moduleId, state } = {}) {
      tenantId = tenant(tenantId);
      return Object.freeze([...store.values()]
        .filter(x => x.tenantId === tenantId)
        .filter(x => !moduleId || x.moduleId === moduleId)
        .filter(x => !state || x.state === state)
        .map(publicRecord));
    },

    async stop({ tenantId, instanceId } = {}) {
      tenantId = tenant(tenantId);
      const record = owned(instanceId, tenantId);
      if (record.state === 'stopped' || record.state === 'deleted') return publicRecord(record);
      if (record.state !== 'running' && record.state !== 'failed') fail('INSTANCE_STATE_CONFLICT');
      await approval('instance.stop', { tenantId, instanceId, moduleId: record.moduleId, environment: record.environment });
      record.state = 'stopping';
      record.updatedAt = clock();
      try {
        await provisioner.stop(Object.freeze({ instanceId, tenantId, providerInstanceId: record.providerInstanceId ?? null }));
        record.state = 'stopped';
        record.health = { status: 'stopped', checkedAt: clock() };
        record.updatedAt = clock();
        return publicRecord(record);
      } catch (error) {
        record.state = 'failed';
        record.errorCode = 'STOP_FAILED';
        record.updatedAt = clock();
        throw error;
      }
    },

    updateHealth({ tenantId, instanceId, status, checkedAt = clock() } = {}) {
      tenantId = tenant(tenantId);
      const record = owned(instanceId, tenantId);
      if (record.state !== 'running') fail('INSTANCE_NOT_RUNNING');
      if (!['healthy', 'degraded', 'unhealthy'].includes(status) || !Number.isFinite(Date.parse(checkedAt))) fail('HEALTH_EVIDENCE_INVALID');
      record.health = { status, checkedAt };
      record.updatedAt = clock();
      return publicRecord(record);
    },

    async delete({ tenantId, instanceId } = {}) {
      tenantId = tenant(tenantId);
      const record = owned(instanceId, tenantId);
      if (!['stopped', 'failed'].includes(record.state)) fail('INSTANCE_MUST_BE_STOPPED');
      await approval('instance.delete', { tenantId, instanceId, moduleId: record.moduleId, environment: record.environment });
      record.state = 'deleted';
      record.updatedAt = clock();
      return publicRecord(record);
    }
  });
}
