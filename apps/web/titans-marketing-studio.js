export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = 'titans.marketing.studio.consent.v1';
export const PHONE_STORAGE_KEY = 'titans.marketing.studio.phone.v1';

const EVENT_NAMES = new Set(['page_view', 'cta_click', 'form_submit', 'conversion']);
const EVENT_FIELDS = new Set(['page', 'campaign', 'content', 'placement', 'value']);

export function createConsentRecord(
  { analytics = false, marketing = false } = {},
  updatedAt = new Date().toISOString(),
) {
  return Object.freeze({
    version: CONSENT_VERSION,
    necessary: true,
    analytics: analytics === true,
    marketing: marketing === true,
    updatedAt,
  });
}

export function validateConsentRecord(value) {
  if (!value || typeof value !== 'object' || value.version !== CONSENT_VERSION) return null;
  if (typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean') return null;
  if (typeof value.updatedAt !== 'string' || Number.isNaN(Date.parse(value.updatedAt))) return null;
  return createConsentRecord(value, value.updatedAt);
}

export function readConsent(storage) {
  try {
    if (!storage || typeof storage.getItem !== 'function') return null;
    const raw = storage.getItem(CONSENT_STORAGE_KEY);
    return raw ? validateConsentRecord(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeConsent(storage, choices, updatedAt = new Date().toISOString()) {
  if (!storage || typeof storage.setItem !== 'function') throw new TypeError('CONSENT_STORAGE_UNAVAILABLE');
  const record = createConsentRecord(choices, updatedAt);
  storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function clearConsent(storage) {
  if (!storage || typeof storage.removeItem !== 'function') return false;
  storage.removeItem(CONSENT_STORAGE_KEY);
  return true;
}

export function canRunCategory(consent, category) {
  if (category === 'necessary') return true;
  const valid = validateConsentRecord(consent);
  if (!valid) return false;
  if (category === 'analytics') return valid.analytics;
  if (category === 'marketing') return valid.marketing;
  return false;
}

export function sanitizeAnalyticsEvent(eventName, properties = {}) {
  if (!EVENT_NAMES.has(eventName)) return null;
  const safe = {};
  for (const [key, value] of Object.entries(properties ?? {})) {
    if (!EVENT_FIELDS.has(key)) continue;
    if (typeof value === 'string') {
      const cleaned = value.slice(0, 120);
      safe[key] = key === 'page' ? cleaned.split(/[?#]/, 1)[0] : cleaned;
    } else if (key === 'value' && typeof value === 'number' && Number.isFinite(value)) {
      safe[key] = value;
    }
  }
  return Object.freeze({ eventName, properties: Object.freeze(safe) });
}

export function emitAnalyticsEvent({ consent, eventName, properties, sink } = {}) {
  if (!canRunCategory(consent, 'analytics') || typeof sink !== 'function') return false;
  const event = sanitizeAnalyticsEvent(eventName, properties);
  if (!event) return false;
  sink(event);
  return true;
}

export function normalizeDialTarget(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!/^\+?[0-9().\s-]+$/.test(trimmed)) return '';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) return '';
  return trimmed.startsWith('+') ? '+' + digits : digits;
}
