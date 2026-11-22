import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandboxProvisioner } from '../apps/seva-enterprise/instance-sandbox.mjs';

const request = (overrides = {}) => ({
  instanceId: 'instance-1',
  tenantId: 'tenant-a',
  moduleId: 'ingest',
  version: '1.0.0',
  environment: 'test',
  isolation: { tenantScoped: true, dedicatedIdentity: true, networkPolicy: 'deny-by-default', secretScope: 'instance-only' },
  ...overrides
});

test('sandbox adapter provisions only isolated non-production instances', async () => {
  const adapter = createSandboxProvisioner();
  const result = await adapter.provision(request());
  assert.equal(result.accepted, true);
  assert.match(result.providerInstanceId, /^sandbox-/);
  assert.equal((await adapter.health({ instanceId: 'instance-1', tenantId: 'tenant-a' })).status, 'healthy');
});

test('sandbox adapter rejects production and incomplete isolation', async () => {
  const adapter = createSandboxProvisioner();
  await assert.rejects(adapter.provision(request({ environment: 'production' })), /SANDBOX_ENVIRONMENT_DENIED/);
  await assert.rejects(adapter.provision(request({ isolation: { tenantScoped: true } })), /SANDBOX_ISOLATION_REQUIRED/);
});

test('sandbox adapter enforces tenant ownership for health and stop', async () => {
  const adapter = createSandboxProvisioner();
  await adapter.provision(request());
  assert.equal((await adapter.health({ instanceId: 'instance-1', tenantId: 'tenant-b' })).status, 'unhealthy');
  await assert.rejects(adapter.stop({ instanceId: 'instance-1', tenantId: 'tenant-b' }), /SANDBOX_INSTANCE_NOT_FOUND/);
});

test('sandbox lifecycle requires stop before delete and confirms cleanup', async () => {
  const adapter = createSandboxProvisioner();
  await adapter.provision(request());
  await assert.rejects(adapter.delete({ instanceId: 'instance-1', tenantId: 'tenant-a' }), /SANDBOX_INSTANCE_MUST_BE_STOPPED/);
  assert.equal((await adapter.stop({ instanceId: 'instance-1', tenantId: 'tenant-a' })).stopped, true);
  assert.equal((await adapter.delete({ instanceId: 'instance-1', tenantId: 'tenant-a' })).deleted, true);
  assert.equal(adapter.status().instanceCount, 0);
});

test('sandbox adapter is explicitly simulation-only and capacity bounded', async () => {
  const adapter = createSandboxProvisioner({ maxInstances: 1 });
  await adapter.provision(request());
  assert.equal(adapter.status().networkCalls, false);
  assert.equal(adapter.status().cloudResources, false);
  await assert.rejects(adapter.provision(request({ instanceId: 'instance-2' })), /SANDBOX_CAPACITY_REACHED/);
});
