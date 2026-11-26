import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canRunCategory, clearConsent, createConsentRecord, emitAnalyticsEvent,
  normalizeDialTarget, readConsent, sanitizeAnalyticsEvent, writeConsent,
} from '../apps/web/titans-marketing-studio.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

test('no optional analytics or marketing category runs before a recorded choice', () => {
  assert.equal(canRunCategory(null, 'necessary'), true);
  assert.equal(canRunCategory(null, 'analytics'), false);
  assert.equal(canRunCategory(null, 'marketing'), false);
});

test('reject-all record keeps necessary storage and disables optional categories', () => {
  const record = createConsentRecord({}, '2026-11-26T10:00:00.000Z');
  assert.equal(record.necessary, true);
  assert.equal(record.analytics, false);
  assert.equal(record.marketing, false);
  assert.equal(canRunCategory(record, 'analytics'), false);
  assert.equal(canRunCategory(record, 'marketing'), false);
});

test('consent is stored and can be withdrawn', () => {
  const storage = memoryStorage();
  writeConsent(storage, { analytics: true, marketing: false }, '2026-11-26T10:00:00.000Z');
  assert.equal(readConsent(storage).analytics, true);
  assert.equal(readConsent(storage).marketing, false);
  assert.equal(clearConsent(storage), true);
  assert.equal(readConsent(storage), null);
});

test('invalid or old consent versions fail closed', () => {
  const storage = memoryStorage();
  storage.setItem('titans.marketing.studio.consent.v1', JSON.stringify({
    version: 0, analytics: true, marketing: true, updatedAt: '2026-11-26T10:00:00.000Z',
  }));
  assert.equal(readConsent(storage), null);
  assert.equal(canRunCategory({ version: 1, analytics: true, marketing: true }, 'analytics'), false);
});

test('analytics sink is never called without analytics consent', () => {
  let calls = 0;
  const sent = emitAnalyticsEvent({
    consent: createConsentRecord({ analytics: false }),
    eventName: 'page_view',
    sink: () => { calls++; },
  });
  assert.equal(sent, false);
  assert.equal(calls, 0);
});

test('analytics event allowlist drops direct identifiers and query strings', () => {
  const event = sanitizeAnalyticsEvent('page_view', {
    page: '/pricing?email=person@example.com',
    email: 'person@example.com',
    phone: '+390000000000',
    userId: 'customer-123',
    campaign: 'organic',
  });
  assert.deepEqual(event.properties, { page: '/pricing', campaign: 'organic' });
});

test('analytics event emits only after valid analytics consent', () => {
  const events = [];
  const consent = createConsentRecord({ analytics: true });
  assert.equal(emitAnalyticsEvent({
    consent, eventName: 'cta_click', properties: { placement: 'header' },
    sink: event => events.push(event),
  }), true);
  assert.equal(events.length, 1);
  assert.equal(events[0].eventName, 'cta_click');
});

test('unknown event names are rejected', () => {
  assert.equal(sanitizeAnalyticsEvent('contact_export', {}), null);
});

test('mobile dial target accepts valid international numbers and rejects unsafe input', () => {
  assert.equal(normalizeDialTarget('+39 040 123 4567'), '+390401234567');
  assert.equal(normalizeDialTarget('040-123-4567'), '0401234567');
  assert.equal(normalizeDialTarget('javascript:alert(1)'), '');
  assert.equal(normalizeDialTarget('123'), '');
});
