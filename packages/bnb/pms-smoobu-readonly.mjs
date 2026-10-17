/**
 * Booking.com -> authorized PMS (Smoobu) -> URBAN ONE: read-only request builder.
 * No networking, credentials storage, Booking.com direct login, guest charging,
 * or host settlement is performed by this module.
 *
 * IMPORTANT: call this only server-side. Returned headers contain API credentials
 * and MUST NOT be logged, returned to browsers, or committed.
 * Provider reference: https://docs.smoobu.com/#hmac-authentication
 */
import {createHash, createHmac, randomUUID} from 'node:crypto';

const SMOOBU_ORIGIN = 'https://login.smoobu.com';
const READ_ENDPOINTS = new Set(['/api/apartments', '/api/reservations']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_GATES = Object.freeze([
  'operatorConsent',
  'pmsAccessApproved',
  'propertyMappingVerified',
  'guestDataPurposeApproved'
]);

export function pmsReadiness(gates = {}) {
  const missing = REQUIRED_GATES.filter(name => gates[name] !== true);
  return {state: missing.length ? 'ONBOARDING_REQUIRED' : 'READ_ONLY_ELIGIBLE', missing};
}

function dateValue(value, field) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new TypeError(`${field} must use YYYY-MM-DD`);
  }
  const valueDate = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(valueDate.getTime()) || valueDate.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${field} is not a valid calendar date`);
  }
  return valueDate.getTime();
}

function approvedQuery(path, query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    throw new TypeError('query must be an object');
  }
  if (path === '/api/apartments') {
    if (Object.keys(query).length) throw new TypeError('apartments accepts no query in this adapter');
    return '';
  }
  if (Object.keys(query).sort().join(',') !== 'from,to') {
    throw new TypeError('reservations requires exactly from and to');
  }
  const from = dateValue(query.from, 'from');
  const to = dateValue(query.to, 'to');
  if (to < from || to - from > 31 * 86400000) {
    throw new RangeError('reservation window must be 0 to 31 days');
  }
  // Stable alphabetical ordering is required by Smoobu's signing scheme.
  return new URLSearchParams([['from', query.from], ['to', query.to]]).toString();
}

/**
 * Constructs only GET requests; does not call the external provider.
 * Store secrets in a server-side secret manager, never in frontend or git.
 */
export function buildSmoobuReadRequest({
  path,
  query = {},
  credentials,
  gates,
  now = new Date(),
  nonce = randomUUID()
} = {}) {
  if (!READ_ENDPOINTS.has(path)) throw new Error('READ_ONLY_PATH_REQUIRED');
  const readiness = pmsReadiness(gates);
  if (readiness.missing.length) throw new Error('PMS_ONBOARDING_REQUIRED');
  if (!credentials || typeof credentials.apiKey !== 'string' || !credentials.apiKey.trim()
      || typeof credentials.apiSecret !== 'string' || !credentials.apiSecret.trim()) {
    throw new Error('SERVER_SIDE_PMS_CREDENTIALS_REQUIRED');
  }
  const timestampDate = new Date(now);
  if (!Number.isFinite(timestampDate.getTime())) throw new TypeError('invalid timestamp');
  const timestamp = timestampDate.toISOString().replace(/\.\d{3}Z$/, 'Z');
  if (typeof nonce !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(nonce)) {
    throw new TypeError('nonce must be a UUID v4');
  }
  const canonicalQuery = approvedQuery(path, query);
  const emptyBodySha256 = createHash('sha256').update('').digest('hex');
  const canonical = ['GET', path, canonicalQuery, timestamp, nonce, emptyBodySha256, credentials.apiKey].join('\n');
  const signature = createHmac('sha256', credentials.apiSecret).update(canonical).digest('base64');
  return {
    method: 'GET',
    url: `${SMOOBU_ORIGIN}${path}${canonicalQuery ? `?${canonicalQuery}` : ''}`,
    headers: {
      'X-API-Key': credentials.apiKey,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature
    }
  };
}
