import {
  constants,
  createPublicKey,
  verify as verifySignature
} from 'node:crypto';

const ALLOWED_ALGORITHMS = new Set(['RS256', 'PS256', 'ES256', 'EdDSA']);
const MAX_JWKS_BYTES = 64 * 1024;
const MAX_JWKS_KEYS = 100;

function decodeJsonSegment(segment) {
  if (typeof segment !== 'string' || !/^[A-Za-z0-9_-]+$/.test(segment)) {
    throw new Error('JWT_SEGMENT_INVALID');
  }
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    throw new Error('JWT_JSON_INVALID');
  }
}

function bearerToken(headers = {}) {
  const value = headers.authorization ?? headers.Authorization;
  if (typeof value !== 'string') return null;
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/i.exec(value.trim());
  return match?.[1] || null;
}

function readConfig(env = {}) {
  const issuer = String(env.SUPER_AI_IAM_ISSUER || '').trim();
  const audience = String(env.SUPER_AI_IAM_AUDIENCE || '').trim();
  const jwksUrl = String(env.SUPER_AI_IAM_JWKS_URL || '').trim();
  if (!issuer || !audience || !jwksUrl) return null;

  let issuerUrl;
  let keysUrl;
  try {
    issuerUrl = new URL(issuer);
    keysUrl = new URL(jwksUrl);
  } catch {
    throw new Error('IAM_CONFIGURATION_INVALID');
  }
  if (issuerUrl.protocol !== 'https:' || keysUrl.protocol !== 'https:' ||
      issuerUrl.username || issuerUrl.password || issuerUrl.hash ||
      keysUrl.username || keysUrl.password || keysUrl.hash) {
    throw new Error('IAM_HTTPS_REQUIRED');
  }

  const configured = String(env.SUPER_AI_IAM_ALLOWED_ALGORITHMS || 'RS256,PS256,ES256,EdDSA')
    .split(',').map(value => value.trim()).filter(Boolean);
  if (!configured.length || configured.some(value => !ALLOWED_ALGORITHMS.has(value))) {
    throw new Error('IAM_ALGORITHM_POLICY_INVALID');
  }
  return Object.freeze({ issuer, audience, jwksUrl: keysUrl.href, algorithms: new Set(configured) });
}

function verifyJwtSignature(algorithm, signingInput, signature, publicKey) {
  if (algorithm === 'RS256') return verifySignature('RSA-SHA256', signingInput, publicKey, signature);
  if (algorithm === 'PS256') {
    return verifySignature('sha256', signingInput, {
      key: publicKey,
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32
    }, signature);
  }
  if (algorithm === 'ES256') {
    return verifySignature('sha256', signingInput, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature);
  }
  if (algorithm === 'EdDSA') return verifySignature(null, signingInput, publicKey, signature);
  return false;
}

/**
 * Provider-neutral OIDC/JWT bearer authenticator.
 *
 * This verifier is deliberately inert until issuer, audience and HTTPS JWKS URL
 * are explicitly configured. It validates signatures and standard claims, but
 * tenant membership and platform entitlements remain separate server-side checks.
 */
export function createOidcAuthenticator({
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  jwksCacheMs = 5 * 60 * 1000,
  clockToleranceSeconds = 60,
  maxTokenLength = 16 * 1024
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('IAM_FETCH_REQUIRED');
  const cache = new Map();

  async function loadJwks(url, force = false) {
    const cached = cache.get(url);
    if (!force && cached && cached.expiresAt > now()) return cached.keys;
    const response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'error',
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    if (!response?.ok) throw new Error('IAM_JWKS_UNAVAILABLE');
    const contentLength = Number(response.headers?.get?.('content-length') || 0);
    if (contentLength > MAX_JWKS_BYTES) throw new Error('IAM_JWKS_TOO_LARGE');
    const raw = await response.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_JWKS_BYTES) throw new Error('IAM_JWKS_TOO_LARGE');
    let document;
    try { document = JSON.parse(raw); } catch { throw new Error('IAM_JWKS_INVALID'); }
    if (!Array.isArray(document?.keys) || document.keys.length === 0 || document.keys.length > MAX_JWKS_KEYS) {
      throw new Error('IAM_JWKS_INVALID');
    }
    const keys = document.keys.filter(key =>
      key && typeof key.kid === 'string' && key.kid.length > 0 &&
      (!key.use || key.use === 'sig') &&
      (!Array.isArray(key.key_ops) || key.key_ops.includes('verify'))
    );
    if (!keys.length) throw new Error('IAM_JWKS_NO_SIGNING_KEYS');
    cache.set(url, { keys, expiresAt: now() + Math.max(1000, jwksCacheMs) });
    return keys;
  }

  return async function authenticate({ headers, env } = {}) {
    const token = bearerToken(headers);
    if (!token) return null;
    if (token.length > maxTokenLength) throw new Error('JWT_TOO_LARGE');
    const config = readConfig(env);
    if (!config) throw new Error('IAM_NOT_CONFIGURED');

    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('JWT_FORMAT_INVALID');
    const header = decodeJsonSegment(parts[0]);
    const claims = decodeJsonSegment(parts[1]);
    if (!header || typeof header !== 'object' || Array.isArray(header) ||
        !config.algorithms.has(header.alg) || !ALLOWED_ALGORITHMS.has(header.alg) ||
        (header.typ && header.typ !== 'JWT') || header.crit !== undefined || typeof header.kid !== 'string' || !header.kid) {
      throw new Error('JWT_HEADER_INVALID');
    }

    const signingInput = Buffer.from(parts[0] + '.' + parts[1], 'ascii');
    let keys = await loadJwks(config.jwksUrl);
    let jwk = keys.find(key => key.kid === header.kid && (!key.alg || key.alg === header.alg));
    if (!jwk) {
      keys = await loadJwks(config.jwksUrl, true);
      jwk = keys.find(key => key.kid === header.kid && (!key.alg || key.alg === header.alg));
    }
    if (!jwk) throw new Error('JWT_SIGNING_KEY_NOT_FOUND');

    let publicKey;
    try { publicKey = createPublicKey({ key: jwk, format: 'jwk' }); }
    catch { throw new Error('JWT_SIGNING_KEY_INVALID'); }
    const signature = Buffer.from(parts[2], 'base64url');
    if (!signature.length || !verifyJwtSignature(header.alg, signingInput, signature, publicKey)) {
      throw new Error('JWT_SIGNATURE_INVALID');
    }

    if (!claims || typeof claims !== 'object' || Array.isArray(claims)) throw new Error('JWT_CLAIMS_INVALID');
    const currentSeconds = Math.floor(now() / 1000);
    const tolerance = Math.max(0, Number(clockToleranceSeconds) || 0);
    if (claims.iss !== config.issuer) throw new Error('JWT_ISSUER_INVALID');
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(config.audience)) throw new Error('JWT_AUDIENCE_INVALID');
    if (!Number.isFinite(claims.exp) || currentSeconds >= claims.exp + tolerance) throw new Error('JWT_EXPIRED');
    if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || currentSeconds + tolerance < claims.nbf)) {
      throw new Error('JWT_NOT_YET_VALID');
    }
    if (claims.iat !== undefined && (!Number.isFinite(claims.iat) || claims.iat > currentSeconds + tolerance)) {
      throw new Error('JWT_ISSUED_IN_FUTURE');
    }
    if (typeof claims.sub !== 'string' || !claims.sub.trim() || claims.sub.length > 255) {
      throw new Error('JWT_SUBJECT_INVALID');
    }

    const scopeValue = typeof claims.scope === 'string' ? claims.scope :
      (Array.isArray(claims.scp) ? claims.scp.join(' ') : '');
    const scopes = [...new Set(scopeValue.split(/\s+/).filter(value => /^[a-z0-9:_-]{1,128}$/i.test(value)))].slice(0, 100);
    const tenantId = typeof claims.tenant_id === 'string' ? claims.tenant_id :
      (typeof claims.tid === 'string' ? claims.tid : undefined);

    return Object.freeze({
      userId: claims.sub,
      ...(tenantId && tenantId.length <= 128 ? { tenantId } : {}),
      scopes: Object.freeze(scopes)
    });
  };
}
