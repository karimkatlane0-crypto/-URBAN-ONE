CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  granted INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_receipts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  state TEXT NOT NULL,
  receipt_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  country TEXT,
  city TEXT,
  street TEXT,
  house_number TEXT,
  status TEXT,
  source_ref TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

-- Private, owner-scoped contact directory. Raw certificate/document IDs are never stored here;
-- only a SHA-256 fingerprint or an encrypted external vault reference may be persisted.
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_contact_id TEXT,
  given_name TEXT,
  family_name TEXT,
  display_name TEXT,
  phone_e164 TEXT,
  email TEXT,
  city TEXT,
  province TEXT,
  zone TEXT,
  certificate_id_hash TEXT,
  certificate_issuer TEXT,
  certificate_valid_to TEXT,
  consent_status TEXT NOT NULL DEFAULT 'unknown',
  consent_at TEXT,
  consent_evidence_ref TEXT,
  rpo_status TEXT NOT NULL DEFAULT 'not_checked',
  rpo_checked_at TEXT,
  rpo_reference TEXT,
  direct_opposition INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(owner_user_id, source, source_contact_id)
);

CREATE INDEX IF NOT EXISTS contacts_owner_name_idx
  ON contacts(owner_user_id, family_name, given_name);
CREATE INDEX IF NOT EXISTS contacts_owner_phone_idx
  ON contacts(owner_user_id, phone_e164);
CREATE INDEX IF NOT EXISTS contacts_owner_email_idx
  ON contacts(owner_user_id, email);

-- Canonical address index for exact civic-number matching and map-ready coordinates.
-- It is separate from properties so existing deployments can adopt it without rewriting the base table.
CREATE TABLE IF NOT EXISTS property_address_index (
  property_id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  city_key TEXT NOT NULL,
  street_key TEXT NOT NULL,
  house_number_key TEXT NOT NULL,
  postal_code TEXT,
  address_key TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  geocode_source TEXT,
  geocode_checked_at TEXT,
  FOREIGN KEY(property_id) REFERENCES properties(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS property_address_exact_idx
  ON property_address_index(country_code, city_key, street_key, house_number_key, postal_code);
CREATE INDEX IF NOT EXISTS property_address_street_idx
  ON property_address_index(country_code, city_key, street_key);
