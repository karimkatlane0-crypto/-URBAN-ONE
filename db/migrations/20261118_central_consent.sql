-- Central, product-scoped consent ledger.
-- Apply only after selecting encrypted durable storage, backup, retention and access controls.
-- Optional purposes are independent and default OFF. Essential processing is not a consent toggle.
CREATE TABLE IF NOT EXISTS consent_state (
  subject_id TEXT NOT NULL,
  product TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  notice_version TEXT NOT NULL,
  revision INTEGER NOT NULL,
  analytics INTEGER NOT NULL DEFAULT 0 CHECK (analytics IN (0,1)),
  personal INTEGER NOT NULL DEFAULT 0 CHECK (personal IN (0,1)),
  email INTEGER NOT NULL DEFAULT 0 CHECK (email IN (0,1)),
  mobile INTEGER NOT NULL DEFAULT 0 CHECK (mobile IN (0,1)),
  partners INTEGER NOT NULL DEFAULT 0 CHECK (partners IN (0,1)),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (subject_id, product)
);
CREATE TABLE IF NOT EXISTS consent_audit (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  product TEXT NOT NULL,
  revision INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  notice_version TEXT NOT NULL,
  choices_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL UNIQUE,
  UNIQUE (subject_id, product, revision)
);
CREATE INDEX IF NOT EXISTS consent_audit_subject_idx
  ON consent_audit(subject_id, product, revision);
