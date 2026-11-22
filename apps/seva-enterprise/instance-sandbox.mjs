import { randomUUID } from 'node:crypto';

/**
 * Deterministic in-process sandbox adapter.
 * It simulates lifecycle receipts only: no containers, cloud resources,
 * shell commands, outbound network requests or external credentials.
 */
export function createSandboxProvisioner({ clock = () => new Date().toISOString(), maxInstances = 50 } = {}) {
  const instances = new Map();
  if (!Number.isSafeInteger(maxInstances) || maxInstances < 1) throw new Error('SANDBOX_LIMIT_INVALID');

  return Object.freeze({
    async provision(request) {
      if (!request || typeof request.instanceId !== 'string' || typeof request.tenantId !== 'string') throw new Error('SANDBOX_REQUEST_INVALID');
      if (!['test', 'staging'].includes(request.environment)) throw new Error('SANDBOX_ENVIRONMENT_DENIED');
      if (request.isolation?.tenantScoped !== true ||
          request.isolation?.dedicatedIdentity !== true ||
          request.isolation?.networkPolicy !== 'deny-by-default' ||
          request.isolation?.secretScope !== 'instance-only') throw new Error('SANDBOX_ISOLATION_REQUIRED');
      if (instances.size >= maxInstances) throw new Error('SANDBOX_CAPACITY_REACHED');
      if (instances.has(request.instanceId)) throw new Error('SANDBOX_INSTANCE_EXISTS');
      const providerInstanceId = 'sandbox-' + randomUUID();
      instances.set(request.instanceId, {
        providerInstanceId,
        tenantId: request.tenantId,
        moduleId: request.moduleId,
        environment: request.environment,
        state: 'running',
        createdAt: clock(),
        updatedAt: clock()
      });
      return { accepted: true, providerInstanceId, adapter: 'in-memory-sandbox' };
    },

    async health({ instanceId, tenantId }) {
      const row = instances.get(instanceId);
      if (!row || row.tenantId !== tenantId || row.state !== 'running') return { status: 'unhealthy', checkedAt: clock() };
      return { status: 'healthy', checkedAt: clock(), adapter: 'in-memory-sandbox' };
    },

    async stop({ instanceId, tenantId }) {
      const row = instances.get(instanceId);
      if (!row || row.tenantId !== tenantId) throw new Error('SANDBOX_INSTANCE_NOT_FOUND');
      if (row.state === 'deleted') throw new Error('SANDBOX_INSTANCE_DELETED');
      row.state = 'stopped';
      row.updatedAt = clock();
      return { stopped: true, adapter: 'in-memory-sandbox' };
    },

    async delete({ instanceId, tenantId }) {
      const row = instances.get(instanceId);
      if (!row || row.tenantId !== tenantId) throw new Error('SANDBOX_INSTANCE_NOT_FOUND');
      if (row.state !== 'stopped') throw new Error('SANDBOX_INSTANCE_MUST_BE_STOPPED');
      row.state = 'deleted';
      row.updatedAt = clock();
      instances.delete(instanceId);
      return { deleted: true, adapter: 'in-memory-sandbox' };
    },

    status() {
      return Object.freeze({
        adapter: 'in-memory-sandbox',
        mode: 'simulation-only',
        networkCalls: false,
        cloudResources: false,
        credentialsRequired: false,
        instanceCount: instances.size,
        maxInstances
      });
    }
  });
}
