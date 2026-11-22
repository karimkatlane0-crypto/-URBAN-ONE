import test from 'node:test';
import assert from 'node:assert/strict';
import { createInstanceManager } from '../packages/titans/instance-manager.mjs';

const manifest = { id: 'ingest', version: '1.0.0', description: 'Tenant-scoped ingestion worker', capabilities: ['events.ingest'], resourceProfile: { cpu: 1, memoryMb: 256, storageMb: 512 }, environments: ['development', 'test', 'staging'] };
function harness({ approved = true, provision = async () => ({ accepted: true, providerInstanceId: 'runtime-1' }), max = 3 } = {}) {
  const calls = [];
  const manager = createInstanceManager({
    catalog: [manifest],
    authorize: async request => { calls.push(request); return approved; },
    provisioner: { provision, stop: async () => ({ stopped: true }), delete: async () => ({ deleted: true }) },
    maxInstancesPerTenant: max
  });
  return { manager, calls };
}

test('catalog validates and exposes immutable module metadata', () => {
  const { manager } = harness();
  assert.equal(manager.catalog()[0].id, 'ingest');
  assert.throws(() => createInstanceManager({ catalog: [{ ...manifest, resourceProfile: {} }], provisioner: { provision(){}, stop(){}, delete(){} } }), /MODULE_RESOURCE_PROFILE_INVALID/);
});

test('create provisions an isolated instance only after approval', async () => {
  let request;
  const { manager } = harness({ provision: async input => { request = input; return { accepted: true, providerInstanceId: 'p-1' }; } });
  const result = await manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0001' });
  assert.equal(result.state, 'running');
  assert.equal(request.isolation.tenantScoped, true);
  assert.equal(request.isolation.networkPolicy, 'deny-by-default');
  assert.equal(request.isolation.secretScope, 'instance-only');
});

test('creation fails closed without human approval', async () => {
  const { manager } = harness({ approved: false });
  await assert.rejects(manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0002' }), /HUMAN_APPROVAL_REQUIRED/);
  assert.equal(manager.list({ tenantId: 'tenant-a' }).length, 0);
});

test('idempotency returns the same instance and prevents duplicate provisioning', async () => {
  let count = 0;
  const { manager } = harness({ provision: async () => { count++; return { accepted: true }; } });
  const input = { tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0003' };
  const first = await manager.create(input);
  const second = await manager.create(input);
  assert.equal(first.id, second.id);
  assert.equal(count, 1);
});

test('tenant isolation hides instances across tenants', async () => {
  const { manager } = harness();
  const created = await manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0004' });
  assert.throws(() => manager.get({ tenantId: 'tenant-b', instanceId: created.id }), /INSTANCE_NOT_FOUND/);
  assert.equal(manager.list({ tenantId: 'tenant-b' }).length, 0);
});

test('per-tenant active instance quota is enforced', async () => {
  const { manager } = harness({ max: 1 });
  await manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0005' });
  await assert.rejects(manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0006' }), /TENANT_INSTANCE_LIMIT_REACHED/);
  await manager.create({ tenantId: 'tenant-b', moduleId: 'ingest', idempotencyKey: 'create-0007' });
});

test('provisioner failure is recorded as failed without leaking provider details', async () => {
  const { manager } = harness({ provision: async () => { throw new Error('PROVIDER_UNAVAILABLE'); } });
  await assert.rejects(manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0008' }), /PROVIDER_UNAVAILABLE/);
  assert.equal(manager.list({ tenantId: 'tenant-a' })[0].state, 'failed');
});

test('failed provision without accepted provider resource can be deleted without provider cleanup', async () => {
  let deleteCalls = 0;
  const manager = createInstanceManager({
    catalog: [manifest],
    authorize: async () => true,
    provisioner: {
      provision: async () => { throw new Error('PROVIDER_UNAVAILABLE'); },
      stop: async () => ({ stopped: true }),
      delete: async () => { deleteCalls++; return { deleted: true }; }
    }
  });
  await assert.rejects(manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'failed-clean-0001' }), /PROVIDER_UNAVAILABLE/);
  const failed = manager.list({ tenantId: 'tenant-a' })[0];
  assert.equal(failed.state, 'failed');
  const deleted = await manager.delete({ tenantId: 'tenant-a', instanceId: failed.id });
  assert.equal(deleted.state, 'deleted');
  assert.equal(deleteCalls, 0);
});

test('health evidence and stop lifecycle are tenant scoped', async () => {
  const { manager } = harness();
  const created = await manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0009' });
  assert.equal(manager.updateHealth({ tenantId: 'tenant-a', instanceId: created.id, status: 'healthy' }).health.status, 'healthy');
  assert.equal((await manager.stop({ tenantId: 'tenant-a', instanceId: created.id })).state, 'stopped');
  assert.equal((await manager.delete({ tenantId: 'tenant-a', instanceId: created.id })).state, 'deleted');
});

test('production environment is denied unless module explicitly supports it', async () => {
  const { manager } = harness();
  await assert.rejects(manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', environment: 'production', idempotencyKey: 'create-0010' }), /ENVIRONMENT_NOT_ALLOWED/);
});

test('invalid identifiers and states are rejected', async () => {
  const { manager } = harness();
  await assert.rejects(manager.create({ tenantId: 'tenant-a', moduleId: 'unknown', idempotencyKey: 'create-0011' }), /MODULE_NOT_FOUND/);
  await assert.rejects(manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'bad' }), /IDEMPOTENCY_KEY_INVALID/);
});

test('concurrent duplicate creates share one provisioning operation', async () => {
  let count = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const { manager } = harness({ provision: async () => { count++; await gate; return { accepted: true }; } });
  const input = { tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0012' };
  const first = manager.create(input);
  const second = manager.create(input);
  await new Promise(resolve => setImmediate(resolve));
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a.id, b.id);
  assert.equal(count, 1);
});

test('concurrent distinct creates cannot oversubscribe the tenant quota', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const { manager } = harness({ max: 1, provision: async () => { await gate; return { accepted: true }; } });
  const first = manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0013' });
  const second = manager.create({ tenantId: 'tenant-a', moduleId: 'ingest', idempotencyKey: 'create-0014' });
  await new Promise(resolve => setImmediate(resolve));
  release();
  await first;
  await assert.rejects(second, /TENANT_INSTANCE_LIMIT_REACHED/);
});
