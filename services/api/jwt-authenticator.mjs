import {
  createPublicKey,
  verify,
  constants
} from 'node:crypto';

const DEFAULT_ALGORITHMS = ['RS256', 'ES256', 'PS256', 'EdDSA'];

function decodeSegment(segment) {
  return Buffer.from(segment, 'base64url');
}

function parseJsonSegment(segment, errorCode) {
  try {
    const value = JSON.parse(decodeSegment(segment).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid');
    return value;
  } catch {
    throw new Error(errorCode);
  }
}

function verifyJwtSignature({ algorithm, key, signingInput, signature }) {
  const data = Buffer.from(signingInput, 'utf8');
  const publicKey = createPublicKey({ key, format: 'jwk' });
  switch (algorithm) {
    case 'RS256': return verify('RSA-SHA256', data, publicKey, signature);
    case 'RS384': return verify('RSA-SHA384', data, publicKey, signature);
    case 'RS512': return verify('RSA-SHA512', data, publicKey, signature);
    case 'PS256': return verify('sha256', data, { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }, signature);
    case 'PS384': return verify('sha384', data, { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 48 }, signature);
    case 'PS512': return verify('sha512', data, { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 64 }, signature);
    case 'ES256': return verify('sha256', data, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature);
    case 'ES384': return verify('sha384', data, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature);
    case 'ES512': return verify('sha512', data, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature);
    case 'EdDSA': return verify(null, data, publicKey, signature);
    default: return false;
  }
}

function audienceMatches(tokenAudience, expectedAudience) {
  return Array.isArray(tokenAudience)
    ? tokenAudience.includes(expectedAudience)
    : tokenAudience === expectedAudience;
}

/**
 * Generic OIDC/JWT adapter. It is inert until issuer, audience and JWKS URL are
 * explicitly configured. Tenant, role and scopes are resolved only by the
 * trusted membership callback; JWT custom claims never grant application scope.
 */
export function createJwtAuthenticator({
  env = process.env,
  resolveMembership,
  fetchImpl = globalThis.fetch,
  nowSeconds = () => Math.floor(Date.now() / 1000)
} = {}) {
  let cachedJwks = null;
  let cacheExpiresAt = 0;

  return async ({ headers = {} } = {}) => {
    const issuer = env.IAM_ISSUER;
    const audience = env.IAM_AUDIENCE;
    const jwksUrl = env.IAM_JWKS_URL;
    if (!issuer || !audience || !jwksUrl || typeof resolveMembership !== 'function') return null;
    if (typeof audience !== 'string' || typeof issuer !== 'string') throw new Error('IAM_CONFIGURATION_INVALID');
    let issuerUrl;
    try { issuerUrl = new URL(issuer); } catch { throw new Error('IAM_ISSUER_INVALID'); }
    if (issuerUrl.protocol !== 'https:' && issuerUrl.hostname !== 'localhost' && issuerUrl.hostname !== '127.0.0.1') {
      throw new Error('IAM_ISSUER_HTTPS_REQUIRED');
    }

    const authorization = headers.authorization || headers.Authorization || '';
    const bearer = /^Bearer ([^\s]+)$/i.exec(authorization);
    if (!bearer) return null;

    let url;
    try { url = new URL(jwksUrl); } catch { throw new Error('IAM_JWKS_URL_INVALID'); }
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      throw new Error('IAM_JWKS_HTTPS_REQUIRED');
    }

    const token = bearer[1];
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some(part => !part)) throw new Error('IAM_TOKEN_INVALID');
    const header = parseJsonSegment(parts[0], 'IAM_TOKEN_HEADER_INVALID');
    const claims = parseJsonSegment(parts[1], 'IAM_TOKEN_CLAIMS_INVALID');
    if (header.typ && String(header.typ).toUpperCase() !== 'JWT') throw new Error('IAM_TOKEN_TYPE_INVALID');

    const configuredAlgorithms = String(env.IAM_ALLOWED_ALGORITHMS || DEFAULT_ALGORITHMS.join(','))
      .split(',').map(value => value.trim()).filter(Boolean);
    if (!configuredAlgorithms.length || !configuredAlgorithms.includes(header.alg)) throw new Error('IAM_ALGORITHM_NOT_ALLOWED');
    if (typeof header.kid !== 'string' || !header.kid) throw new Error('IAM_KEY_ID_REQUIRED');

    const now = nowSeconds();
    const tolerance = Number(env.IAM_CLOCK_TOLERANCE_SECONDS ?? 60);
    if (!Number.isFinite(now) || !Number.isFinite(tolerance) || tolerance < 0 || tolerance > 300) {
      throw new Error('IAM_CLOCK_CONFIGURATION_INVALID');
    }
    if (claims.iss !== issuer || !audienceMatches(claims.aud, audience)) throw new Error('IAM_ISSUER_OR_AUDIENCE_INVALID');
    if (typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 200) throw new Error('IAM_SUBJECT_INVALID');
    if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || now >= claims.exp + tolerance) throw new Error('IAM_TOKEN_EXPIRED');
    if (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || !Number.isFinite(claims.nbf) || claims.nbf > now + tolerance)) {
      throw new Error('IAM_TOKEN_NOT_YET_VALID');
    }
    if (claims.iat !== undefined && (typeof claims.iat !== 'number' || !Number.isFinite(claims.iat) || claims.iat > now + tolerance)) {
      throw new Error('IAM_TOKEN_ISSUED_IN_FUTURE');
    }

    const ttl = Number(env.IAM_JWKS_CACHE_SECONDS || 300);
    if (!Number.isFinite(ttl) || ttl < 30 || ttl > 900) throw new Error('IAM_JWKS_CACHE_CONFIGURATION_INVALID');
    const fetchJwks = async () => {
      if (typeof fetchImpl !== 'function') throw new Error('IAM_JWKS_FETCH_UNAVAILABLE');
      const response = await fetchImpl(url.href, { headers: { accept: 'application/json' }, cache: 'no-store' });
      if (!response?.ok) throw new Error('IAM_JWKS_FETCH_FAILED');
      const body = await response.json();
      if (!Array.isArray(body?.keys)) throw new Error('IAM_JWKS_INVALID');
      cachedJwks = body.keys;
      cacheExpiresAt = now + ttl;
    };
    let fetchedThisRequest = false;
    if (!cachedJwks || now >= cacheExpiresAt) {
      await fetchJwks();
      fetchedThisRequest = true;
    }

    const findSigningKey = () => cachedJwks.find(key =>
      key?.kid === header.kid &&
      (!key.use || key.use === 'sig') &&
      (!key.alg || key.alg === header.alg) &&
      (!Array.isArray(key.key_ops) || key.key_ops.includes('verify'))
    );
    let jwk = findSigningKey();
    // Identity providers may rotate keys before the cache expires. Refresh once
    // on an unknown kid, but never loop or accept a key with mismatched metadata.
    if (!jwk && !fetchedThisRequest) {
      await fetchJwks();
      jwk = findSigningKey();
    }
    if (!jwk) throw new Error('IAM_SIGNING_KEY_NOT_FOUND');

    let signature;
    try { signature = decodeSegment(parts[2]); }
    catch { throw new Error('IAM_SIGNATURE_INVALID'); }
    let valid = false;
    try { valid = verifyJwtSignature({ algorithm: header.alg, key: jwk, signingInput: parts.slice(0, 2).join('.'), signature }); }
    catch { valid = false; }
    if (!valid) throw new Error('IAM_SIGNATURE_INVALID');

    const requestedTenantId = headers['x-tenant-id'] || headers['X-Tenant-Id'];
    if (typeof requestedTenantId !== 'string' || !requestedTenantId) throw new Error('IAM_TENANT_CONTEXT_REQUIRED');
    const membership = await resolveMembership({
      actorId: claims.sub,
      tenantId: requestedTenantId
    });
    if (!membership || membership.status && membership.status !== 'active' ||
        membership.tenantId !== requestedTenantId ||
        typeof membership.role !== 'string' ||
        !Array.isArray(membership.scopes) ||
        membership.scopes.some(scope => typeof scope !== 'string' || !scope)) {
      throw new Error('IAM_TENANT_MEMBERSHIP_DENIED');
    }

    return Object.freeze({
      userId: claims.sub,
      tenantId: membership.tenantId,
      role: membership.role,
      scopes: Object.freeze([...new Set(membership.scopes)])
    });
  };
}
