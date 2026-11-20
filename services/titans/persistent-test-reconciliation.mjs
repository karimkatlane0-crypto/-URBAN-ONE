import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const stableJson = (value) => {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
};
const required = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(name + ' is required');
  return value.trim();
};

/**
 * Durable TEST-only reconciliation store. Uses Node's built-in SQLite driver.
 * The journal is tamper-evident, not legally immutable or production accounting.
 */
export function createPersistentTestReconciliationStore({ databasePath, environment = 'TEST' } = {}) {
  if (environment !== 'TEST') throw new Error('TEST_ENVIRONMENT_ONLY');
  if (typeof databasePath !== 'string' || !databasePath.trim() || databasePath === ':memory:') {
    throw new TypeError('a persistent databasePath is required');
  }

  const db = new DatabaseSync(resolve(databasePath));
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS payments (
      payment_id TEXT PRIMARY KEY, currency TEXT NOT NULL,
      settled_minor INTEGER NOT NULL CHECK(settled_minor > 0),
      refunded_minor INTEGER NOT NULL DEFAULT 0 CHECK(refunded_minor >= 0 AND refunded_minor <= settled_minor)
    );
    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE,
      fingerprint TEXT NOT NULL, event_type TEXT NOT NULL,
      payment_id TEXT NOT NULL, amount_minor INTEGER NOT NULL,
      currency TEXT NOT NULL, accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS journal_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL UNIQUE REFERENCES events(event_id),
      payment_id TEXT NOT NULL, event_type TEXT NOT NULL,
      amount_minor INTEGER NOT NULL, currency TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS journal_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES journal_transactions(id),
      account TEXT NOT NULL, debit_minor INTEGER NOT NULL DEFAULT 0,
      credit_minor INTEGER NOT NULL DEFAULT 0,
      CHECK(debit_minor >= 0 AND credit_minor >= 0),
      CHECK((debit_minor = 0) <> (credit_minor = 0))
    );
    CREATE TABLE IF NOT EXISTS audit (
      sequence INTEGER PRIMARY KEY, event_id TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL, transaction_id INTEGER NOT NULL,
      previous_hash TEXT NOT NULL, hash TEXT NOT NULL
    );
  `);

  const environmentRow = db.prepare("SELECT value FROM metadata WHERE key='environment'").get();
  if (environmentRow && environmentRow.value !== 'TEST') {
    db.close();
    throw new Error('DATABASE_ENVIRONMENT_MISMATCH');
  }
  db.prepare("INSERT OR IGNORE INTO metadata(key,value) VALUES('environment','TEST')").run();

  const selectEvent = db.prepare('SELECT * FROM events WHERE event_id = ? OR idempotency_key = ?');
  const selectPayment = db.prepare('SELECT * FROM payments WHERE payment_id = ?');
  const insertEvent = db.prepare('INSERT INTO events(event_id,idempotency_key,fingerprint,event_type,payment_id,amount_minor,currency) VALUES(?,?,?,?,?,?,?)');
  const insertTransaction = db.prepare('INSERT INTO journal_transactions(event_id,payment_id,event_type,amount_minor,currency) VALUES(?,?,?,?,?)');
  const insertLine = db.prepare('INSERT INTO journal_lines(transaction_id,account,debit_minor,credit_minor) VALUES(?,?,?,?)');
  const insertAudit = db.prepare('INSERT INTO audit(sequence,event_id,event_type,transaction_id,previous_hash,hash) VALUES(?,?,?,?,?,?)');

  function apply(event) {
    if (!event || !['payment.settled', 'payment.refunded'].includes(event.type)) {
      throw new TypeError('unsupported TEST event type');
    }
    const eventId = required(event.eventId, 'eventId');
    const key = required(event.idempotencyKey, 'idempotencyKey');
    const paymentId = required(event.paymentId, 'paymentId');
    const amountMinor = Number(event.amountMinor);
    const currency = required(event.currency, 'currency').toUpperCase();
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new RangeError('amountMinor must be a positive integer');
    if (!/^[A-Z]{3}$/.test(currency)) throw new TypeError('currency must be a 3-letter code');
    const fingerprint = sha256(stableJson({ type: event.type, paymentId, amountMinor, currency }));

    db.exec('BEGIN IMMEDIATE');
    try {
      const prior = selectEvent.get(eventId, key);
      if (prior) {
        if (prior.fingerprint !== fingerprint) throw new Error(prior.event_id === eventId
          ? 'EVENT_ID_PAYLOAD_CONFLICT' : 'IDEMPOTENCY_KEY_PAYLOAD_CONFLICT');
        db.exec('COMMIT');
        return Object.freeze({ duplicate: true, eventId: prior.event_id });
      }

      const payment = selectPayment.get(paymentId);
      if (event.type === 'payment.settled') {
        if (payment) throw new Error('PAYMENT_ALREADY_SETTLED');
        insertEvent.run(eventId, key, fingerprint, event.type, paymentId, amountMinor, currency);
        db.prepare('INSERT INTO payments(payment_id,currency,settled_minor,refunded_minor) VALUES(?,?,?,0)')
          .run(paymentId, currency, amountMinor);
      } else {
        if (!payment) throw new Error('PAYMENT_NOT_FOUND_OR_OUT_OF_ORDER');
        if (payment.currency !== currency) throw new Error('CURRENCY_MISMATCH');
        if (payment.refunded_minor + amountMinor > payment.settled_minor) throw new Error('REFUND_EXCEEDS_SETTLED_AMOUNT');
        insertEvent.run(eventId, key, fingerprint, event.type, paymentId, amountMinor, currency);
        db.prepare('UPDATE payments SET refunded_minor = refunded_minor + ? WHERE payment_id = ?')
          .run(amountMinor, paymentId);
      }

      const transaction = insertTransaction.run(eventId, paymentId, event.type, amountMinor, currency);
      const transactionId = Number(transaction.lastInsertRowid);
      if (event.type === 'payment.settled') {
        insertLine.run(transactionId, 'test_clearing', amountMinor, 0);
        insertLine.run(transactionId, 'test_settlement_offset', 0, amountMinor);
      } else {
        insertLine.run(transactionId, 'test_refunds', amountMinor, 0);
        insertLine.run(transactionId, 'test_clearing', 0, amountMinor);
      }
      const totals = db.prepare('SELECT COALESCE(SUM(debit_minor),0) AS debit, COALESCE(SUM(credit_minor),0) AS credit FROM journal_lines WHERE transaction_id=?').get(transactionId);
      if (totals.debit !== totals.credit || totals.debit !== amountMinor) throw new Error('UNBALANCED_JOURNAL_TRANSACTION');

      const last = db.prepare('SELECT sequence,hash FROM audit ORDER BY sequence DESC LIMIT 1').get();
      const sequence = (last?.sequence ?? 0) + 1;
      const previousHash = last?.hash ?? 'GENESIS';
      const auditRecord = { sequence, eventId, eventType: event.type, transactionId, previousHash };
      const hash = sha256(previousHash + ':' + stableJson(auditRecord));
      insertAudit.run(sequence, eventId, event.type, transactionId, previousHash, hash);
      db.exec('COMMIT');
      return Object.freeze({ duplicate: false, eventId, transactionId, hash });
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function verifyIntegrity() {
    const rows = db.prepare('SELECT * FROM audit ORDER BY sequence').all();
    let previousHash = 'GENESIS';
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const record = {
        sequence: row.sequence, eventId: row.event_id, eventType: row.event_type,
        transactionId: row.transaction_id, previousHash,
      };
      const expected = sha256(previousHash + ':' + stableJson(record));
      if (row.sequence !== i + 1 || row.previous_hash !== previousHash || row.hash !== expected) {
        return Object.freeze({ valid: false, failedSequence: row.sequence });
      }
      previousHash = row.hash;
    }
    return Object.freeze({ valid: true, records: rows.length, headHash: previousHash });
  }

  function report() {
    const lines = db.prepare(`
      SELECT jt.currency AS currency, jl.account AS account,
        SUM(jl.debit_minor) AS debitMinor, SUM(jl.credit_minor) AS creditMinor
      FROM journal_lines jl JOIN journal_transactions jt ON jt.id=jl.transaction_id
      GROUP BY jt.currency,jl.account ORDER BY jt.currency,jl.account
    `).all().map((row) => ({
      currency: row.currency, account: row.account,
      debitMinor: row.debitMinor, creditMinor: row.creditMinor,
    }));
    const totals = db.prepare(`
      SELECT currency, SUM(amount_minor) AS eventAmountMinor, COUNT(*) AS eventCount
      FROM journal_transactions GROUP BY currency ORDER BY currency
    `).all().map((row) => ({
      currency: row.currency, eventAmountMinor: row.eventAmountMinor, eventCount: row.eventCount,
    }));
    const unbalanced = db.prepare(`
      SELECT jt.id FROM journal_transactions jt JOIN journal_lines jl ON jl.transaction_id=jt.id
      GROUP BY jt.id HAVING SUM(jl.debit_minor) != SUM(jl.credit_minor)
    `).all().length;
    return Object.freeze({
      environment: 'TEST', eventCount: db.prepare('SELECT COUNT(*) AS n FROM events').get().n,
      transactionCount: db.prepare('SELECT COUNT(*) AS n FROM journal_transactions').get().n,
      unbalancedTransactions: unbalanced, totals: Object.freeze(totals), lines: Object.freeze(lines),
      integrity: verifyIntegrity(),
    });
  }

  return Object.freeze({
    environment: 'TEST', apply, verifyIntegrity, report,
    paymentState(paymentId) {
      const row = selectPayment.get(paymentId);
      return row ? Object.freeze({
        paymentId: row.payment_id, currency: row.currency,
        settledMinor: row.settled_minor, refundedMinor: row.refunded_minor,
      }) : null;
    },
    close() { db.close(); },
  });
}
