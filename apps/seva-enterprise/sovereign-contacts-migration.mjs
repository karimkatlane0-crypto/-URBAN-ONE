// TITANS sovereign contacts migration core.
// Provider-neutral, user-mediated file workflow. No OAuth, network calls, or LIVE writes.
// Google export files may be used by the user; Exchange is intentionally rejected.
import { createHash, randomUUID } from 'node:crypto';

const FIELDS = ['givenName', 'familyName', 'email', 'phone', 'company'];
const CONSENT_STATES = new Set(['unknown', 'granted', 'denied', 'revoked']);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const clean = value => typeof value === 'string' ? value.trim() : '';

function normalizeRecord(input, index) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('record_' + index + '_invalid');
  const record = Object.fromEntries(FIELDS.map(field => [field, clean(input[field])]));
  record.email = record.email.toLowerCase();
  record.phone = record.phone.replace(/[\s().-]/g, '');
  if (!record.givenName && !record.familyName && !record.email && !record.phone) {
    throw new TypeError('record_' + index + '_has_no_identity_fields');
  }
  return Object.freeze({
    ...record,
    id: clean(input.id) || ('import-' + (index + 1)),
    source: clean(input.source) || 'user-upload',
    consent: CONSENT_STATES.has(input.consent) ? input.consent : 'unknown',
    provenance: clean(input.provenance) || 'user-supplied-file',
  });
}

function identityKeys(record) {
  return [record.email && ('e:' + record.email), record.phone && ('p:' + record.phone)].filter(Boolean);
}
function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

export function exportContactsCsv(records) {
  const rows = [FIELDS.join(','), ...records.map(record => FIELDS.map(field => csvCell(record[field])).join(','))];
  return rows.join('\r\n') + '\r\n';
}

export function parseContactsCsv(input) {
  if (typeof input !== 'string') throw new TypeError('csv_must_be_text');
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw new TypeError('csv_unclosed_quote');
  if (cell.length || row.length) { row.push(cell); if (row.some(value => value !== '')) rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift().map(value => value.trim());
  if (!headers.includes('givenName') && !headers.includes('name')) throw new TypeError('csv_missing_name_header');
  return rows.map(values => {
    const item = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    return {
      givenName: item.givenName || item.name || '',
      familyName: item.familyName || item.surname || '',
      email: (item.email || '').toLowerCase(),
      phone: item.phone || '',
      company: item.company || '',
      consent: 'unknown',
      source: 'google-contacts-export',
      provenance: 'user-uploaded-csv',
    };
  });
}

export function exportContactsVCard(records) {
  const escape = value => String(value ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  return records.map(record => [
    'BEGIN:VCARD', 'VERSION:3.0',
    'N:' + escape(record.familyName) + ';' + escape(record.givenName) + ';;;',
    'FN:' + escape([record.givenName, record.familyName].filter(Boolean).join(' ')),
    ...(record.email ? ['EMAIL;TYPE=INTERNET:' + escape(record.email)] : []),
    ...(record.phone ? ['TEL;TYPE=CELL:' + escape(record.phone)] : []),
    ...(record.company ? ['ORG:' + escape(record.company)] : []),
    'END:VCARD',
  ].join('\r\n')).join('\r\n') + (records.length ? '\r\n' : '');
}

export function parseContactsVCard(input) {
  if (typeof input !== 'string') throw new TypeError('vcard_must_be_text');
  const unfolded = input.replace(/\r?\n[ \t]/g, '');
  const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);
  return cards.map((card, index) => {
    const value = key => {
      const line = card.split(/\r?\n/).find(item => item.toUpperCase().startsWith(key));
      return line ? line.slice(line.indexOf(':') + 1).replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1').trim() : '';
    };
    const name = value('N:').split(';');
    const full = value('FN:').split(/\s+/);
    return {
      familyName: name[0] || full.slice(-1)[0] || '',
      givenName: name[1] || full.slice(0, -1).join(' ') || '',
      email: value('EMAIL').toLowerCase(),
      phone: value('TEL'),
      company: value('ORG'),
      consent: 'unknown',
      source: 'google-contacts-export',
      provenance: 'user-uploaded-vcard:' + (index + 1),
    };
  });
}

export function createContactsMigrationPlan({
  sourceType, sourceRecords, targetRecords = [],
  consentConfirmed = false, rightToUseConfirmed = false,
} = {}) {
  if (sourceType === 'exchange') throw new Error('EXCHANGE_SOURCE_DISABLED');
  if (!['google_contacts_export', 'csv', 'vcard', 'manual'].includes(sourceType)) throw new Error('UNSUPPORTED_SOURCE_TYPE');
  if (consentConfirmed !== true || rightToUseConfirmed !== true) throw new Error('EXPLICIT_CONSENT_REQUIRED');
  if (!Array.isArray(sourceRecords) || !Array.isArray(targetRecords)) throw new TypeError('records_must_be_arrays');
  const incoming = sourceRecords.map(normalizeRecord);
  const existing = targetRecords.map(normalizeRecord);
  const targetIndex = new Map();
  for (const record of existing) for (const key of identityKeys(record)) {
    const values = targetIndex.get(key) ?? [];
    values.push(record.id);
    targetIndex.set(key, values);
  }
  const seenIncoming = new Map();
  const entries = incoming.map(record => {
    const keys = identityKeys(record);
    const existingIds = [...new Set(keys.flatMap(key => targetIndex.get(key) ?? []))];
    const priorImports = [...new Set(keys.flatMap(key => seenIncoming.get(key) ?? []))];
    for (const key of keys) {
      const values = seenIncoming.get(key) ?? [];
      values.push(record.id);
      seenIncoming.set(key, values);
    }
    const status = (existingIds.length > 1 || (existingIds.length && priorImports.length)) ? 'conflict'
      : existingIds.length ? 'duplicate'
      : priorImports.length ? 'duplicate_in_upload'
      : 'insert';
    return Object.freeze({ sourceId: record.id, status, matchedTargetIds: existingIds, matchedUploadIds: priorImports, record });
  });
  const summary = Object.freeze({
    total: entries.length,
    insert: entries.filter(item => item.status === 'insert').length,
    duplicate: entries.filter(item => item.status === 'duplicate' || item.status === 'duplicate_in_upload').length,
    conflict: entries.filter(item => item.status === 'conflict').length,
  });
  const planId = randomUUID();
  const digest = sha256(JSON.stringify({ planId, sourceType, summary, entries }));
  return Object.freeze({ planId, sourceType, summary, entries, digest, createdAt: new Date().toISOString(), mode: 'DRY_RUN' });
}

// Adapter must enforce tenant scope, durable encrypted backups and database transactions.
// Supported mutation is insert-only. Updates/deletes and external provider writes are not exposed.
export async function applyContactsMigration({ plan, confirmationDigest, adapter } = {}) {
  if (!plan || plan.mode !== 'DRY_RUN' || typeof plan.digest !== 'string') throw new Error('VALID_PLAN_REQUIRED');
  if (confirmationDigest !== plan.digest) throw new Error('EXPLICIT_PLAN_CONFIRMATION_REQUIRED');
  if (!adapter || !['snapshot', 'begin', 'insert', 'commit', 'rollback'].every(name => typeof adapter[name] === 'function')) {
    throw new TypeError('TRANSACTIONAL_ADAPTER_REQUIRED');
  }
  if (plan.summary.conflict > 0) throw new Error('CONFLICTS_REQUIRE_MANUAL_RESOLUTION');
  const backupRef = await adapter.snapshot();
  if (!backupRef) throw new Error('BACKUP_REFERENCE_REQUIRED');
  const migrationId = randomUUID();
  let started = false;
  try {
    await adapter.begin({ migrationId, backupRef });
    started = true;
    const inserted = [];
    for (const item of plan.entries) {
      if (item.status !== 'insert') continue;
      await adapter.insert(item.record, { migrationId, sourceId: item.sourceId });
      inserted.push(item.sourceId);
    }
    await adapter.commit();
    return Object.freeze({
      migrationId, backupRef, insertedCount: inserted.length,
      insertedSourceIds: Object.freeze(inserted), planDigest: plan.digest,
      status: 'COMMITTED', reversible: typeof adapter.restoreMigration === 'function',
    });
  } catch (error) {
    if (started) {
      try { await adapter.rollback(); }
      catch (rollbackError) {
        throw new AggregateError([error, rollbackError], 'MIGRATION_FAILED_AND_ROLLBACK_FAILED');
      }
    }
    throw error;
  }
}

export async function rollbackContactsMigration({ receipt, adapter, confirmation = false } = {}) {
  if (confirmation !== true) throw new Error('EXPLICIT_ROLLBACK_CONFIRMATION_REQUIRED');
  if (!receipt || receipt.status !== 'COMMITTED' || !receipt.migrationId || !receipt.backupRef) {
    throw new Error('VALID_MIGRATION_RECEIPT_REQUIRED');
  }
  if (!adapter || typeof adapter.restoreMigration !== 'function') throw new Error('RESTORE_ADAPTER_REQUIRED');
  await adapter.restoreMigration(receipt.migrationId, receipt.backupRef);
  return Object.freeze({ migrationId: receipt.migrationId, status: 'ROLLED_BACK' });
}
