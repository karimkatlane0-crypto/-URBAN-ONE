import { createHash } from 'node:crypto';

const ROLES = new Set(['research', 'analytics', 'copilot', 'transformer', 'civic', 'audit', 'orchestrator']);
const TASK_STATES = new Set(['queued', 'approved', 'blocked']);

function requiredText(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(name + ' is required');
  return value.trim();
}

function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function createAgentTask({ id, role, objective, evidenceRefs = [], mode = 'advisory' }) {
  const taskId = requiredText(id, 'id');
  if (!ROLES.has(role)) throw new TypeError('unsupported agent role');
  const taskObjective = requiredText(objective, 'objective');
  if (!Array.isArray(evidenceRefs) || evidenceRefs.some((ref) => typeof ref !== 'string' || !ref.trim())) {
    throw new TypeError('evidenceRefs must be an array of non-empty strings');
  }
  if (!['advisory', 'test'].includes(mode)) throw new TypeError('mode must be advisory or test');
  return Object.freeze({
    id: taskId,
    role,
    objective: taskObjective,
    evidenceRefs: Object.freeze([...evidenceRefs]),
    mode,
    state: 'queued',
    approvalRequired: true,
    externalSideEffects: false,
  });
}

export function transitionAgentTask(task, nextState, { humanApproved = false } = {}) {
  if (!task || !TASK_STATES.has(task.state)) throw new TypeError('invalid task');
  if (!TASK_STATES.has(nextState)) throw new TypeError('invalid task state');
  if (nextState === 'approved' && humanApproved !== true) {
    throw new Error('HUMAN_APPROVAL_REQUIRED');
  }
  if (task.state !== 'queued' || nextState === 'queued') throw new Error('INVALID_TASK_TRANSITION');
  return Object.freeze({ ...task, state: nextState, humanApproved: nextState === 'approved' });
}

export function buildDecisionBrief({ goal, sources = [], alternatives = [], risks = [] }) {
  const decisionGoal = requiredText(goal, 'goal');
  if (!Array.isArray(sources) || !Array.isArray(alternatives) || !Array.isArray(risks)) {
    throw new TypeError('sources, alternatives and risks must be arrays');
  }
  const normalizedSources = sources.map((source) => {
    const title = requiredText(source?.title, 'source.title');
    const url = requiredText(source?.url, 'source.url');
    const publishedAt = requiredText(source?.publishedAt, 'source.publishedAt');
    const authority = source?.authority;
    if (!['primary', 'secondary', 'unverified'].includes(authority)) throw new TypeError('invalid source authority');
    return Object.freeze({ title, url, publishedAt, authority, supports: String(source.supports ?? '') });
  });
  const unresolved = normalizedSources.filter((source) => source.authority !== 'primary');
  return Object.freeze({
    goal: decisionGoal,
    method: Object.freeze(['forward', 'backward']),
    forward: Object.freeze({
      steps: Object.freeze(['collect primary evidence', 'compare alternatives', 'assess risks', 'prepare recommendation']),
      alternatives: Object.freeze(alternatives.map((item) => requiredText(item, 'alternative'))),
    }),
    backward: Object.freeze({
      target: decisionGoal,
      acceptanceChecks: Object.freeze(['define measurable outcome', 'identify prerequisites', 'verify evidence', 'assign accountable owner']),
    }),
    sources: Object.freeze(normalizedSources),
    risks: Object.freeze(risks.map((item) => requiredText(item, 'risk'))),
    unresolvedSourceCount: unresolved.length,
    decision: 'HUMAN_DECISION_REQUIRED',
    releaseAuthorized: false,
  });
}

export function createCivicRoute({ consentGranted, stops = [] }) {
  if (consentGranted !== true) throw new Error('LOCATION_CONSENT_REQUIRED');
  if (!Array.isArray(stops) || stops.length < 2) throw new TypeError('at least two route stops are required');
  const ids = new Set();
  const normalized = stops.map((stop) => {
    const id = requiredText(stop?.id, 'stop.id');
    if (ids.has(id)) throw new TypeError('duplicate stop id');
    ids.add(id);
    const latitude = Number(stop.latitude);
    const longitude = Number(stop.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new RangeError('invalid latitude');
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError('invalid longitude');
    return Object.freeze({ id, latitude, longitude, label: String(stop.label ?? id) });
  });
  return Object.freeze({
    mode: 'CONSENTED_ROUTE_PLAN',
    liveGpsRead: false,
    backgroundTracking: false,
    stops: Object.freeze(normalized),
  });
}

export function createTestReconciliationLedger({ environment = 'TEST' } = {}) {
  if (environment !== 'TEST') throw new Error('TEST_ENVIRONMENT_ONLY');
  const entries = [];
  const audit = [];
  const eventIds = new Map();
  const idempotency = new Map();
  const payments = new Map();

  function appendAudit(event, entry) {
    const previousHash = audit.length ? audit[audit.length - 1].hash : 'GENESIS';
    const record = {
      sequence: audit.length + 1,
      eventId: event.eventId,
      eventType: event.type,
      entryId: entry.id,
      previousHash,
    };
    const hash = sha256(previousHash + ':' + stableJson(record));
    audit.push(Object.freeze({ ...record, hash }));
  }

  function apply(event) {
    if (!event || !['payment.settled', 'payment.refunded'].includes(event.type)) {
      throw new TypeError('unsupported TEST event type');
    }
    const eventId = requiredText(event.eventId, 'eventId');
    const key = requiredText(event.idempotencyKey, 'idempotencyKey');
    const paymentId = requiredText(event.paymentId, 'paymentId');
    const amountMinor = Number(event.amountMinor);
    const currency = requiredText(event.currency, 'currency').toUpperCase();
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new RangeError('amountMinor must be a positive integer');
    if (!/^[A-Z]{3}$/.test(currency)) throw new TypeError('currency must be an ISO-style 3-letter code');
    const fingerprint = sha256(stableJson({ type: event.type, paymentId, amountMinor, currency }));
    if (eventIds.has(eventId)) {
      const prior = eventIds.get(eventId);
      if (prior.fingerprint !== fingerprint) throw new Error('EVENT_ID_PAYLOAD_CONFLICT');
      return Object.freeze({ duplicate: true, entry: prior.entry });
    }
    if (idempotency.has(key)) {
      const prior = idempotency.get(key);
      if (prior.fingerprint !== fingerprint) throw new Error('IDEMPOTENCY_KEY_PAYLOAD_CONFLICT');
      return Object.freeze({ duplicate: true, entry: prior.entry });
    }

    let payment = payments.get(paymentId);
    if (event.type === 'payment.settled') {
      if (payment) throw new Error('PAYMENT_ALREADY_SETTLED');
      payment = { paymentId, currency, settledMinor: amountMinor, refundedMinor: 0 };
    } else {
      if (!payment) throw new Error('PAYMENT_NOT_FOUND');
      if (payment.currency !== currency) throw new Error('CURRENCY_MISMATCH');
      if (payment.refundedMinor + amountMinor > payment.settledMinor) throw new Error('REFUND_EXCEEDS_SETTLED_AMOUNT');
    }

    const entry = Object.freeze({
      id: 'LEDGER-' + String(entries.length + 1).padStart(6, '0'),
      eventId,
      idempotencyKey: key,
      paymentId,
      type: event.type,
      amountMinor,
      currency,
      environment: 'TEST',
    });
    entries.push(entry);
    if (event.type === 'payment.settled') payments.set(paymentId, payment);
    else {
      payment.refundedMinor += amountMinor;
      payments.set(paymentId, payment);
    }
    const accepted = { fingerprint, entry };
    eventIds.set(eventId, accepted);
    idempotency.set(key, accepted);
    appendAudit(event, entry);
    return Object.freeze({ duplicate: false, entry });
  }

  return Object.freeze({
    environment: 'TEST',
    apply,
    entries: () => Object.freeze(entries.map((entry) => Object.freeze({ ...entry }))),
    auditTrail: () => Object.freeze(audit.map((record) => Object.freeze({ ...record }))),
    paymentState: (paymentId) => {
      const payment = payments.get(paymentId);
      return payment ? Object.freeze({ ...payment }) : null;
    },
  });
}
