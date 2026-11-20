import { requireConsent } from '../core/consent.mjs';
import { canonical, sha256 } from '../core/provenance.mjs';

const PURPOSE = 'insights:aggregate:test';
const TYPES = new Set([
  'match_created',
  'visit_requested',
  'payment_captured',
  'payment_refunded',
  'visit_cancelled',
  'no_show'
]);
const ALLOWED_KEYS = new Set([
  'eventId', 'tenantId', 'type', 'occurredAt', 'amountMinor', 'currency', 'paymentRef'
]);
const ZERO_HASH = '0'.repeat(64);

function assertIdentifier(value, code) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(value)) {
    throw new Error(code);
  }
}

function validateEvent(input, tenantId) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('EVENT_INVALID');
  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) throw new Error('EVENT_FIELD_NOT_ALLOWED');
  }
  assertIdentifier(input.eventId, 'EVENT_ID_INVALID');
  assertIdentifier(input.tenantId, 'TENANT_ID_INVALID');
  if (input.tenantId !== tenantId) throw new Error('TENANT_MISMATCH');
  if (!TYPES.has(input.type)) throw new Error('EVENT_TYPE_INVALID');
  if (typeof input.occurredAt !== 'string' || Number.isNaN(Date.parse(input.occurredAt))) {
    throw new Error('EVENT_TIMESTAMP_INVALID');
  }

  const paymentEvent = input.type === 'payment_captured' || input.type === 'payment_refunded';
  if (paymentEvent) {
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error('AMOUNT_MINOR_INVALID');
    }
    if (typeof input.currency !== 'string' || !/^[A-Z]{3}$/.test(input.currency)) {
      throw new Error('CURRENCY_INVALID');
    }
    assertIdentifier(input.paymentRef, 'PAYMENT_REF_INVALID');
  } else if (input.amountMinor !== undefined || input.currency !== undefined || input.paymentRef !== undefined) {
    throw new Error('NON_PAYMENT_AMOUNT_NOT_ALLOWED');
  }

  return Object.freeze({
    eventId: input.eventId,
    tenantId: input.tenantId,
    type: input.type,
    occurredAt: new Date(input.occurredAt).toISOString(),
    ...(paymentEvent ? {
      amountMinor: input.amountMinor,
      currency: input.currency,
      paymentRef: input.paymentRef
    } : {})
  });
}

/**
 * In-memory, synthetic-friendly analytics ledger.
 * No provider calls, persistence, contact data, or cross-tenant reads are performed.
 */
export function createInsightsAnalytics({
  tenantId,
  consent,
  purpose = PURPOSE
} = {}) {
  assertIdentifier(tenantId, 'TENANT_ID_INVALID');
  if (purpose !== PURPOSE) throw new Error('INSIGHTS_TEST_PURPOSE_REQUIRED');
  const consentProof = requireConsent({ consent, purpose });
  const events = new Map();
  const audit = [];
  const captures = new Map();
  const refunds = new Map();

  function append(event) {
    const previousHash = audit.at(-1)?.hash ?? ZERO_HASH;
    const sequence = audit.length + 1;
    const body = { sequence, previousHash, event };
    const entry = Object.freeze({ ...body, hash: sha256(body) });
    audit.push(entry);
    return entry;
  }

  function ingest(input) {
    const event = validateEvent(input, tenantId);
    const existing = events.get(event.eventId);
    if (existing) {
      if (canonical(existing) !== canonical(event)) throw new Error('IDEMPOTENCY_CONFLICT');
      return { accepted: false, duplicate: true, auditHash: audit.find(x => x.event.eventId === event.eventId).hash };
    }

    if (event.type === 'payment_captured') {
      if (captures.has(event.paymentRef)) throw new Error('PAYMENT_CAPTURE_ALREADY_EXISTS');
      captures.set(event.paymentRef, { amountMinor: event.amountMinor, currency: event.currency });
      refunds.set(event.paymentRef, 0);
    }
    if (event.type === 'payment_refunded') {
      const capture = captures.get(event.paymentRef);
      if (!capture) throw new Error('REFUND_CAPTURE_NOT_FOUND');
      if (capture.currency !== event.currency) throw new Error('REFUND_CURRENCY_MISMATCH');
      const nextRefund = (refunds.get(event.paymentRef) ?? 0) + event.amountMinor;
      if (nextRefund > capture.amountMinor) throw new Error('REFUND_EXCEEDS_CAPTURE');
      refunds.set(event.paymentRef, nextRefund);
    }

    events.set(event.eventId, event);
    const entry = append(event);
    return { accepted: true, duplicate: false, auditHash: entry.hash };
  }

  function metrics() {
    const counts = Object.fromEntries([...TYPES].map(type => [type, 0]));
    const money = new Map();
    for (const event of events.values()) {
      counts[event.type] += 1;
      if (event.type === 'payment_captured' || event.type === 'payment_refunded') {
        const row = money.get(event.currency) ?? { currency: event.currency, grossMinor: 0, refundedMinor: 0, netMinor: 0 };
        if (event.type === 'payment_captured') row.grossMinor += event.amountMinor;
        else row.refundedMinor += event.amountMinor;
        row.netMinor = row.grossMinor - row.refundedMinor;
        money.set(event.currency, row);
      }
    }
    const funnel = {
      matches: counts.match_created,
      visitRequests: counts.visit_requested,
      capturedPayments: counts.payment_captured,
      refunds: counts.payment_refunded,
      cancellations: counts.visit_cancelled,
      noShows: counts.no_show
    };
    return Object.freeze({
      tenantId,
      purpose,
      consentAt: consentProof.at,
      eventCount: events.size,
      funnel: Object.freeze(funnel),
      conversionMatchToPaid: funnel.matches ? funnel.capturedPayments / funnel.matches : null,
      money: Object.freeze([...money.values()].map(row => Object.freeze(row)))
    });
  }

  function verifyAudit() {
    let previousHash = ZERO_HASH;
    for (let index = 0; index < audit.length; index += 1) {
      const entry = audit[index];
      const body = { sequence: index + 1, previousHash, event: entry.event };
      if (entry.sequence !== index + 1 || entry.previousHash !== previousHash || sha256(body) !== entry.hash) {
        return { valid: false, checked: index + 1 };
      }
      previousHash = entry.hash;
    }
    return { valid: true, checked: audit.length, head: previousHash };
  }

  return Object.freeze({
    ingest,
    metrics,
    verifyAudit,
    auditSnapshot: () => Object.freeze(audit.map(entry => Object.freeze({ ...entry }))),
    consentSnapshot: () => Object.freeze({ ...consentProof })
  });
}

export const INSIGHTS_TEST_PURPOSE = PURPOSE;
