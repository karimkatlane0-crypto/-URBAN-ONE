import { isIP } from 'node:net';

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 250;
const DEFAULT_MAX_DELAY_MS = 4000;

function deny(reason) {
  return Object.freeze({ allowed: false, reason });
}

function hostAllowed(hostname, allowedHosts = []) {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
  return Array.isArray(allowedHosts) && allowedHosts.some(
    value => String(value).toLowerCase().replace(/\.$/, '') === host
  );
}

/**
 * Validate a remote provider endpoint before it is handed to an HTTP client.
 * This is an application-level guard, not a substitute for network egress
 * controls, DNS/IP pinning, or redirect validation in the transport layer.
 */
export function validateRemoteEndpoint(endpoint, allowedHosts = []) {
  let url;
  try { url = new URL(endpoint); } catch { return deny('ENDPOINT_INVALID'); }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (url.protocol !== 'https:') return deny('HTTPS_REQUIRED');
  if (url.username || url.password) return deny('EMBEDDED_CREDENTIALS_FORBIDDEN');
  if (url.hash) return deny('URL_FRAGMENT_FORBIDDEN');
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') || isIP(hostname) !== 0) {
    return deny('NON_PUBLIC_HOST_FORBIDDEN');
  }
  if (!hostAllowed(hostname, allowedHosts)) return deny('HOST_NOT_ALLOWLISTED');
  return Object.freeze({ allowed: true, reason: 'HTTPS_HOST_ALLOWLISTED', origin: url.origin, hostname });
}

/** Select a healthy, tenant-matched provider; no network request is made. */
export function selectRemoteProvider({ providers = [], capability, tenantId, now = Date.now(), healthMaxAgeMs = 60_000 } = {}) {
  if (typeof capability !== 'string' || !capability.trim()) return deny('CAPABILITY_REQUIRED');
  if (typeof tenantId !== 'string' || !tenantId.trim()) return deny('TENANT_REQUIRED');
  const candidates = providers
    .filter(p => p && p.status === 'connected' && p.tenantId === tenantId)
    .filter(p => Array.isArray(p.capabilities) && p.capabilities.includes(capability))
    .filter(p => {
      const checkedAt = Date.parse(p.health?.checkedAt);
      return p.health?.status === 'healthy' && Number.isFinite(checkedAt) && checkedAt <= now && now - checkedAt <= healthMaxAgeMs;
    })
    .filter(p => validateRemoteEndpoint(p.endpoint, p.allowedHosts).allowed)
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  if (!candidates.length) return deny('NO_VERIFIED_REMOTE_PROVIDER');
  return Object.freeze({ allowed: true, reason: 'HEALTHY_TENANT_SCOPED_PROVIDER_SELECTED', providerId: candidates[0].id, fallbackProviderIds: Object.freeze(candidates.slice(1).map(p => p.id)) });
}

/** Retries are bounded and permitted only for idempotent transient failures. */
export function remoteRetryDelay(attempt, { retryable = false, idempotent = false, maxAttempts = DEFAULT_MAX_ATTEMPTS, baseDelayMs = DEFAULT_BASE_DELAY_MS, maxDelayMs = DEFAULT_MAX_DELAY_MS } = {}) {
  if (!retryable || !idempotent) return 0;
  if (!Number.isInteger(attempt) || attempt < 1 || attempt >= maxAttempts) return 0;
  if (!Number.isFinite(baseDelayMs) || baseDelayMs < 0 || !Number.isFinite(maxDelayMs) || maxDelayMs < 0) return 0;
  return Math.min(maxDelayMs, baseDelayMs * (2 ** (attempt - 1)));
}