import test from 'node:test';
import assert from 'node:assert/strict';
import { constants, generateKeyPairSync, sign } from 'node:crypto';
import { createOidcAuthenticator } from '../packages/super-ai/oidc-authenticator.mjs';
import { createApiServer } from '../services/api/server.mjs';

const issuer = 'https://issuer.example.test';
const audience = 'super-ai-api';
const jwksUrl = 'https://issuer.example.test/.well-known/jwks.json';
const now = 1_800_000_000_000;
const primary = generateKeyPairSync('rsa', { modulusLength: 2048 });
const alternate = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ecPair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const edPair = generateKeyPairSync('ed25519');
const jwk = { ...primary.publicKey.export({ format: 'jwk' }), kid: 'key-1', use: 'sig', alg: 'RS256', key_ops: ['verify'] };
const env = {
  SUPER_AI_IAM_ISSUER: issuer,
  SUPER_AI_IAM_AUDIENCE: audience,
  SUPER_AI_IAM_JWKS_URL: jwksUrl
};

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function token(claimOverrides = {}, { key = primary.privateKey, kid = 'key-1', alg = 'RS256' } = {}) {
  const header = encode({ alg, typ: 'JWT', kid });
  const payload = encode({
    iss: issuer,
    aud: audience,
    sub: 'user-123',
    tenant_id: 'tenant-456',
    scope: 'contacts:read properties:read',
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + 300,
    ...claimOverrides
  });
  const signingInput = header + '.' + payload;
  const input = Buffer.from(signingInput);
  let signature;
  if (alg === 'RS256') signature = sign('RSA-SHA256', input, key);
  else if (alg === 'PS256') signature = sign('sha256', input, { key, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 });
  else if (alg === 'ES256') signature = sign('sha256', input, { key, dsaEncoding: 'ieee-p1363' });
  else if (alg === 'EdDSA') signature = sign(null, input, key);
  else throw new Error('Unsupported test algorithm: ' + alg);
  signature = signature.toString('base64url');
  return signingInput + '.' + signature;
}

function fakeFetch(keys = [jwk]) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ keys }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };
  return { fetchImpl, calls };
}

async function withServer(options, work) {
  const server = createApiServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try { return await work('http://127.0.0.1:' + address.port); }
  finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

test('OIDC authenticator validates signature, issuer, audience and returns only scoped principal fields', async () => {
  const fake = fakeFetch();
  const authenticate = createOidcAuthenticator({ fetchImpl: fake.fetchImpl, now: () => now });
  const principal = await authenticate({
    headers: { authorization: 'Bearer ' + token() },
    env
  });
  assert.equal(principal.userId, 'user-123');
  assert.equal(principal.tenantId, 'tenant-456');
  assert.deepEqual(principal.scopes, ['contacts:read', 'properties:read']);
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].options.redirect, 'error');
  assert.equal(fake.calls[0].options.cache, 'no-store');
});

test('missing bearer credentials remain anonymous and do not fetch JWKS', async () => {
  const fake = fakeFetch();
  const authenticate = createOidcAuthenticator({ fetchImpl: fake.fetchImpl, now: () => now });
  assert.equal(await authenticate({ headers: {}, env: {} }), null);
  assert.equal(fake.calls.length, 0);
});

test('bearer token is rejected when IAM issuer, audience or JWKS configuration is absent', async () => {
  const fake = fakeFetch();
  const authenticate = createOidcAuthenticator({ fetchImpl: fake.fetchImpl, now: () => now });
  await assert.rejects(authenticate({ headers: { authorization: 'Bearer ' + token() }, env: {} }), /IAM_NOT_CONFIGURED/);
  assert.equal(fake.calls.length, 0);
});

test('invalid signature and unknown signing key fail closed', async () => {
  const fake = fakeFetch();
  const authenticate = createOidcAuthenticator({ fetchImpl: fake.fetchImpl, now: () => now });
  await assert.rejects(
    authenticate({ headers: { authorization: 'Bearer ' + token({}, { key: alternate.privateKey }) }, env }),
    /JWT_SIGNATURE_INVALID/
  );
  await assert.rejects(
    authenticate({ headers: { authorization: 'Bearer ' + token({}, { kid: 'rotated-key' }) }, env }),
    /JWT_SIGNING_KEY_NOT_FOUND/
  );
  assert.equal(fake.calls.length, 2);
});


test('OIDC authenticator verifies every enabled asymmetric signing algorithm', async () => {
  const variants = [
    { alg: 'PS256', pair: primary, key: { ...jwk, kid: 'rsa-ps256', alg: 'PS256' }, kid: 'rsa-ps256' },
    { alg: 'ES256', pair: ecPair, key: { ...ecPair.publicKey.export({ format: 'jwk' }), kid: 'ec-1', use: 'sig', alg: 'ES256', key_ops: ['verify'] }, kid: 'ec-1' },
    { alg: 'EdDSA', pair: edPair, key: { ...edPair.publicKey.export({ format: 'jwk' }), kid: 'ed-1', use: 'sig', alg: 'EdDSA', key_ops: ['verify'] }, kid: 'ed-1' }
  ];
  for (const variant of variants) {
    const fake = fakeFetch([variant.key]);
    const authenticate = createOidcAuthenticator({ fetchImpl: fake.fetchImpl, now: () => now });
    const result = await authenticate({
      headers: { authorization: 'Bearer ' + token({}, { key: variant.pair.privateKey, kid: variant.kid, alg: variant.alg }) },
      env
    });
    assert.equal(result.userId, 'user-123', variant.alg);
  }
});

test('issuer, audience, expiry and not-before claims are enforced', async () => {
  const fake = fakeFetch();
  const authenticate = createOidcAuthenticator({ fetchImpl: fake.fetchImpl, now: () => now });
  const check = claims => authenticate({ headers: { authorization: 'Bearer ' + token(claims) }, env });
  await assert.rejects(check({ iss: 'https://attacker.example.test' }), /JWT_ISSUER_INVALID/);
  await assert.rejects(check({ aud: 'another-api' }), /JWT_AUDIENCE_INVALID/);
  await assert.rejects(check({ exp: Math.floor(now / 1000) - 120 }), /JWT_EXPIRED/);
  await assert.rejects(check({ nbf: Math.floor(now / 1000) + 120 }), /JWT_NOT_YET_VALID/);
});

test('unsafe JWKS URLs and unsupported algorithms are rejected', async () => {
  const fake = fakeFetch();
  const authenticate = createOidcAuthenticator({ fetchImpl: fake.fetchImpl, now: () => now });
  await assert.rejects(
    authenticate({
      headers: { authorization: 'Bearer ' + token() },
      env: { ...env, SUPER_AI_IAM_JWKS_URL: 'http://issuer.example.test/jwks' }
    }),
    /IAM_HTTPS_REQUIRED/
  );
  const noneHeader = encode({ alg: 'none', typ: 'JWT', kid: 'key-1' });
  const payload = encode({ iss: issuer, aud: audience, sub: 'user-123', exp: Math.floor(now / 1000) + 60 });
  await assert.rejects(
    authenticate({ headers: { authorization: 'Bearer ' + noneHeader + '.' + payload + '.x' }, env }),
    /JWT_HEADER_INVALID/
  );
});

test('API server uses OIDC verification before granting protected route scope', async () => {
  const fake = fakeFetch();
  const authenticate = createOidcAuthenticator({ fetchImpl: fake.fetchImpl, now: () => now });
  await withServer({ env, authenticate }, async base => {
    const response = await fetch(base + '/api/contacts/import-preview', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + token()
      },
      body: JSON.stringify({ records: [] })
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.inputCount, 0);
    assert.equal(body.acceptedCount, 0);
  });
});
