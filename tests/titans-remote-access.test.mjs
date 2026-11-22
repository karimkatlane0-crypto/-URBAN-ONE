import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRemoteEndpoint, selectRemoteProvider, remoteRetryDelay } from '../packages/titans/remote-access.mjs';
const now = Date.parse('2026-11-22T06:00:00.000Z');
const provider = (id, overrides = {}) => ({ id, status: 'connected', tenantId: 'tenant-a', endpoint: 'https://remote.example.com/v1', allowedHosts: ['remote.example.com'], capabilities: ['browser.read'], priority: 10, health: { status: 'healthy', checkedAt: new Date(now - 1000).toISOString() }, ...overrides });

test('remote endpoints require HTTPS and an exact host allowlist', () => {
  assert.equal(validateRemoteEndpoint('http://remote.example.com', ['remote.example.com']).reason, 'HTTPS_REQUIRED');
  assert.equal(validateRemoteEndpoint('https://remote.example.com', ['example.com']).reason, 'HOST_NOT_ALLOWLISTED');
  assert.equal(validateRemoteEndpoint('https://remote.example.com', ['remote.example.com']).allowed, true);
});
test('remote endpoints reject credentials, IP literals and local hosts', () => {
  assert.equal(validateRemoteEndpoint('https://user:pass@remote.example.com', ['remote.example.com']).reason, 'EMBEDDED_CREDENTIALS_FORBIDDEN');
  assert.equal(validateRemoteEndpoint('https://127.0.0.1', ['127.0.0.1']).reason, 'NON_PUBLIC_HOST_FORBIDDEN');
  assert.equal(validateRemoteEndpoint('https://service.local', ['service.local']).reason, 'NON_PUBLIC_HOST_FORBIDDEN');
});
test('provider selection requires tenant, capability, allowlisted endpoint and fresh healthy evidence', () => {
  const selected = selectRemoteProvider({ providers: [provider('primary', { priority: 1 }), provider('backup', { priority: 2 })], capability: 'browser.read', tenantId: 'tenant-a', now });
  assert.deepEqual(selected, { allowed: true, reason: 'HEALTHY_TENANT_SCOPED_PROVIDER_SELECTED', providerId: 'primary', fallbackProviderIds: ['backup'] });
  assert.equal(selectRemoteProvider({ providers: [provider('wrong-tenant', { tenantId: 'tenant-b' })], capability: 'browser.read', tenantId: 'tenant-a', now }).reason, 'NO_VERIFIED_REMOTE_PROVIDER');
  assert.equal(selectRemoteProvider({ providers: [provider('stale', { health: { status: 'healthy', checkedAt: '2026-11-22T04:00:00.000Z' } })], capability: 'browser.read', tenantId: 'tenant-a', now }).reason, 'NO_VERIFIED_REMOTE_PROVIDER');
  assert.equal(selectRemoteProvider({ providers: [provider('unhealthy', { health: { status: 'degraded', checkedAt: new Date(now).toISOString() } })], capability: 'browser.read', tenantId: 'tenant-a', now }).reason, 'NO_VERIFIED_REMOTE_PROVIDER');
});
test('provider selection fails closed for missing tenant or capability', () => {
  assert.equal(selectRemoteProvider({ providers: [provider('p')], capability: '', tenantId: 'tenant-a', now }).reason, 'CAPABILITY_REQUIRED');
  assert.equal(selectRemoteProvider({ providers: [provider('p')], capability: 'browser.read', tenantId: '', now }).reason, 'TENANT_REQUIRED');
});
test('retry policy is bounded and only retries idempotent retryable operations', () => {
  assert.equal(remoteRetryDelay(1, { retryable: true, idempotent: true }), 250);
  assert.equal(remoteRetryDelay(2, { retryable: true, idempotent: true }), 500);
  assert.equal(remoteRetryDelay(9, { retryable: true, idempotent: true }), 0);
  assert.equal(remoteRetryDelay(1, { retryable: true, idempotent: false }), 0);
  assert.equal(remoteRetryDelay(1, { retryable: false, idempotent: true }), 0);
});