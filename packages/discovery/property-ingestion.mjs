import {createHash} from 'node:crypto';

const DAY = 86400000;
const PURPOSES = new Set(['sale', 'rent']);
const METHODS = new Set(['api', 'licensed_feed', 'open_data']);
const text = (value, max = 200) => typeof value === 'string' ? value.normalize('NFKC').trim().slice(0, max) : '';
const isoTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString() === value;

function safeHttpsUrl(value, hosts) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && hosts.includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

function sourceGate(source, now) {
  const auth = source?.authorization;
  const reviewed = Date.parse(auth?.reviewedAt || '');
  const age = now - reviewed;
  const allowed = auth?.status === 'APPROVED' && Number.isFinite(age) && age >= 0 && age <= 90 * DAY &&
    Boolean(text(auth?.agreementRef, 120)) && Array.isArray(auth?.purposes) &&
    auth.purposes.some(purpose => PURPOSES.has(purpose)) && METHODS.has(source?.accessMethod) &&
    Array.isArray(source?.allowedHosts) && source.allowedHosts.length > 0;
  return {allowed, reason: allowed ? null : 'SOURCE_AUTHORIZATION_MISSING_STALE_OR_INCOMPLETE'};
}

function canonical(value) {
  return text(value, 300).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('und').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function stableId(value) {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Validates and normalizes a batch received from an operator-authorized API,
 * licensed feed, or open-data distribution. This function performs no network
 * requests and persists nothing. Caller owns scheduling, storage and audit.
 */
export function ingestPropertyBatch({source, records, now = Date.now(), maxRecordAgeMs = 7 * DAY} = {}) {
  if (!Number.isFinite(now) || !Number.isFinite(maxRecordAgeMs) || maxRecordAgeMs <= 0) throw new TypeError('INVALID_CLOCK_OR_FRESHNESS');
  if (!Array.isArray(records)) throw new TypeError('RECORDS_MUST_BE_ARRAY');
  if (records.length > 5000) throw new RangeError('INGEST_BATCH_LIMIT');

  const gate = sourceGate(source, now);
  if (!gate.allowed) return {status:'SOURCE_BLOCKED', sourceId:text(source?.id,80) || null, accepted:[], rejected:records.length, quarantined:0, reason:gate.reason};

  const sourceId = text(source.id, 80);
  if (!sourceId) return {status:'SOURCE_BLOCKED', sourceId:null, accepted:[], rejected:records.length, quarantined:0, reason:'SOURCE_ID_REQUIRED'};
  const accepted = [], rejected = [], seen = new Set();

  for (const [index, row] of records.entries()) {
    const reject = reason => rejected.push({index, reason});
    if (!row || typeof row !== 'object' || Array.isArray(row)) { reject('INVALID_RECORD'); continue; }
    const externalId = text(row.externalId, 160);
    const purpose = row.purpose;
    const country = text(row.country, 2).toUpperCase();
    const city = text(row.city, 120);
    const title = text(row.title, 200);
    const sourceUrl = safeHttpsUrl(row.sourceUrl, source.allowedHosts);
    const observedAt = row.observedAt;
    const observed = Date.parse(observedAt || '');
    const age = now - observed;
    const price = row.price;
    if (!externalId || !PURPOSES.has(purpose) || !source.authorization.purposes.includes(purpose) ||
        !/^[A-Z]{2}$/.test(country) || !city || !title || !sourceUrl) { reject('REQUIRED_FIELDS_OR_SOURCE_URL_INVALID'); continue; }
    if (!isoTime(observedAt) || !Number.isFinite(age) || age < 0 || age > maxRecordAgeMs) { reject('OBSERVATION_STALE_OR_INVALID'); continue; }
    if (!price || price.currency !== 'EUR' || !Number.isSafeInteger(price.amountCents) || price.amountCents <= 0) { reject('PRICE_INVALID'); continue; }
    const key = sourceId + ':' + externalId;
    if (seen.has(key)) { reject('DUPLICATE_WITHIN_BATCH'); continue; }
    seen.add(key);

    // Cross-source deduplication is attempted only when a sufficiently precise,
    // non-sensitive address fingerprint exists; otherwise retain source identity.
    const address = row.address && typeof row.address === 'object' ? row.address : {};
    const street = canonical(address.street), number = text(address.number, 24).toUpperCase();
    const localityKey = street && number ? [country, canonical(city), street, number, purpose].join('|') : key;
    const identity = stableId(localityKey);
    accepted.push({
      id: stableId(key), sourceId, externalId, identity, purpose,
      propertyType: text(row.propertyType, 80) || 'unspecified',
      title, country, city,
      locality: text(row.locality, 120) || null,
      address: street && number ? {street:text(address.street,160), number} : null,
      price:{currency:'EUR', amountCents:price.amountCents},
      areaSqm:Number.isFinite(row.areaSqm) && row.areaSqm > 0 ? Math.round(row.areaSqm * 100) / 100 : null,
      sourceUrl, observedAt,
      provenance:{method:source.accessMethod, authorizationRef:text(source.authorization.agreementRef,120), authorizationReviewedAt:source.authorization.reviewedAt}
    });
  }

  return {status:'PROCESSED', sourceId, accepted, rejected:rejected.length, quarantined:0, rejectionReasons:rejected};
}

export function deduplicatePropertyRecords(records = []) {
  if (!Array.isArray(records)) throw new TypeError('RECORDS_MUST_BE_ARRAY');
  const byIdentity = new Map();
  for (const record of records) {
    if (!record?.identity) continue;
    const previous = byIdentity.get(record.identity);
    if (!previous || Date.parse(record.observedAt) > Date.parse(previous.observedAt)) byIdentity.set(record.identity, record);
  }
  return [...byIdentity.values()].sort((a,b) => a.identity.localeCompare(b.identity));
}

export const propertyIngestionPolicy = Object.freeze({
  networkFetching:false, persistence:false, backgroundScheduling:false,
  allowedMethods:[...METHODS], purposes:[...PURPOSES],
  prohibited:['credential_or_paywall_bypass','unauthorized_scraping','owner_personal_data_enrichment','invented_availability','unverified_publication_rights'],
  sourceAuthorizationMaxAgeDays:90, defaultRecordFreshnessDays:7,
  requiredHumanEvidence:['provider_or_owner_authorization','accepted_terms_or_open_data_license','permitted_fields_and_purposes','source_host_allowlist']
});
