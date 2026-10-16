CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS consents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, purpose TEXT NOT NULL, granted INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence_receipts (id TEXT PRIMARY KEY, kind TEXT NOT NULL, sha256 TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS provider_events (id TEXT PRIMARY KEY, provider TEXT NOT NULL, state TEXT NOT NULL, receipt_json TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS properties (id TEXT PRIMARY KEY, country TEXT, city TEXT, street TEXT, house_number TEXT, status TEXT, source_ref TEXT, payload_json TEXT, created_at TEXT NOT NULL);
