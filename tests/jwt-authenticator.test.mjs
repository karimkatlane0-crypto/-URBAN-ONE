import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createJwtAuthenticator } from '../services/api/jwt-authenticator.mjs';

const now = 1_800_000_000;
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'super-ai-test-key', use: 'sig', alg: 'RS256' };
const env = {
  IAM_ISSUER: 'https://issuer.example.test',
  IAM_AUDIENCE: 'super-ai-api',
  IAM_JWKS_URL: 'https://issuer.example.test/.well-known/jwks.json',
  IAM_ALLOWED_ALGORITHMS: 'RS256',
  IAM_CLOCK_TOLERANCE_SECONDS: '0',
  IAM_JWKS_CACHE_SECONDS: '300'
};

function makeToken(overrides = {}, key = privateKey) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'super-ai-test-key' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({
    iss: env.IAM_ISSUER,
    aud: env.IAM_AUDIENCE,
    sub: 'actor-1',
    exp: now + 300,
    iat: now - 10,
    scopes: ['*'],
    tenant_id: 'forged-tenant',
    ...overrides
  })).toString('base64url');
  const input = header + '.' + claims;
  return input + '.' + sign('RSA-SHA256', Buffer.from(input), key).toString('base64url');
}

function createAdapter(overrides = {}) {
  let fetchCount = 0;
  const adapter = createJwtAuthenticator({
    env,
    nowSeconds: () => now,
    fetchImpl: async url => {
      fetchCount += 1;
      assert.equal(url, env.IAM_JWKS_URL);
      return { ok: true, json: async () => ({ keys: [jwk] }) };
    },
    resolveMembership: async ({ actorId, tenantId }) => {
      if (actorId !== 'actor-1' || tenantId !== 'tenant-a') return null;
      return { tenantId, role: 'operator', status: 'active', scopes: ['instances:read'] };
    },
    ...overrides
  });
  return { adapter, getFetchCount: () => fetchCount };
}

test('JWT adapter verifies signature, issuer, audience and server-side tenant membership', async () => {
  const { adapter, getFetchCount } = createAdapter();
  const token = makeToken();
  const principal = await adapter({
    headers: { authorization: 'Bearer ' + token, 'x-tenant-id': 'tenant-a' },
    method: 'GET',
    path: '/api/instances'
  });
  assert.deepEqual(principal, {
    userId: 'actor-1',
    tenantId: 'tenant-a',
    role: 'operator',
    scopes: ['instances:read']
  });
  assert.equal(getFetchCount(), 1);
});

test('JWT custom tenant and scope claims do not override membership-derived authority', async () => {
  const { adapter } = createAdapter();
  const principal = await adapter({
    headers: { authorization: 'Bearer ' + makeToken(), 'x-tenant-id': 'tenant-a' }
  });
  assert.equal(principal.tenantId, 'tenant-a');
  assert.deepEqual(principal.scopes, ['instances:read']);
  assert.equal(principal.scopes.includes('*'), false);
});

test('JWKS cache avoids refetching the same key set during its configured lifetime', async () => {
  const { adapter, getFetchCount } = createAdapter();
  const headers = { authorization: 'Bearer ' + makeToken(), 'x-tenant-id': 'tenant-a' };
  await adapter({ headers });
  await adapter({ headers });
  assert.equal(getFetchCount(), 1);
});

test('JWT adapter rejects invalid signature, issuer, audience and expiry', async () => {
  const { adapter } = createAdapter();
  const headers = token => ({ authorization: 'Bearer ' + token, 'x-tenant-id': 'tenant-a' });
  const invalidSignature = makeToken().split('.');
  invalidSignature[2] = Buffer.from('not-a-valid-signature').toString('base64url');
  await assert.rejects(adapter({ headers: headers(invalidSignature.join('.')) }), /IAM_SIGNATURE_INVALID/);
  await assert.rejects(adapter({ headers: headers(makeToken({ iss: 'https://attacker.example.test' })) }), /IAM_ISSUER_OR_AUDIENCE_INVALID/);
  await assert.rejects(adapter({ headers: headers(makeToken({ aud: 'another-api' })) }), /IAM_ISSUER_OR_AUDIENCE_INVALID/);
  await assert.rejects(adapter({ headers: headers(makeToken({ exp: now - 1 })) }), /IAM_TOKEN_EXPIRED/);
});

test('JWT adapter requires tenant context and active server-side membership', async () => {
  const { adapter } = createAdapter();
  const token = makeToken();
  await assert.rejects(adapter({ headers: { authorization: 'Bearer ' + token } }), /IAM_TENANT_CONTEXT_REQUIRED/);
  await assert.rejects(adapter({ headers: { authorization: 'Bearer ' + token, 'x-tenant-id': 'tenant-b' } }), /IAM_TENANT_MEMBERSHIP_DENIED/);
});

test('JWT adapter is inert when no issuer, audience and JWKS are configured', async () => {
  const adapter = createJwtAuthenticator({ env: {}, resolveMembership: async () => null });
  assert.equal(await adapter({ headers: { authorization: 'Bearer ignored' } }), null);
});
