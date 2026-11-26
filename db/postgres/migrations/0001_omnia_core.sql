-- OMNIA / ALL-IN-ONE shared platform foundation.
-- PostgreSQL 16+. Additive migration; does not alter existing SQLite stores.
-- Provision roles separately. The application role must be NOBYPASSRLS.
BEGIN;
CREATE SCHEMA IF NOT EXISTS omnia;

CREATE TABLE omnia.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE omnia.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer text NOT NULL,
  subject text NOT NULL,
  email text,
  display_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer,subject)
);

CREATE TABLE omnia.tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES omnia.tenants(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES omnia.users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner','admin','operator','agent','member','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,user_id)
);

CREATE TABLE omnia.workspaces (
  tenant_id uuid NOT NULL REFERENCES omnia.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_key text NOT NULL CHECK (module_key IN ('titans','seva','synapsy','kkubera','urban-one','insights')),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,module_key,slug)
);

CREATE TABLE omnia.crm_contacts (
  tenant_id uuid NOT NULL REFERENCES omnia.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid,
  external_ref text,
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 200),
  email text,
  phone_e164 text,
  lifecycle_stage text NOT NULL DEFAULT 'lead'
    CHECK (lifecycle_stage IN ('lead','prospect','customer','partner','inactive')),
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,workspace_id) REFERENCES omnia.workspaces(tenant_id,id) ON DELETE RESTRICT
);
CREATE INDEX crm_contacts_tenant_updated_idx ON omnia.crm_contacts(tenant_id,updated_at DESC);
CREATE INDEX crm_contacts_tenant_email_idx ON omnia.crm_contacts(tenant_id,lower(email)) WHERE email IS NOT NULL;

CREATE TABLE omnia.crm_interactions (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','phone','telegram','whatsapp','web','in_person','system')),
  direction text NOT NULL CHECK (direction IN ('inbound','outbound','internal')),
  subject text NOT NULL DEFAULT '',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid REFERENCES omnia.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata)='object'),
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,contact_id) REFERENCES omnia.crm_contacts(tenant_id,id) ON DELETE RESTRICT
);
CREATE INDEX crm_interactions_contact_time_idx ON omnia.crm_interactions(tenant_id,contact_id,occurred_at DESC);

CREATE TABLE omnia.crm_tasks (
  tenant_id uuid NOT NULL REFERENCES omnia.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid,
  assigned_user_id uuid REFERENCES omnia.users(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 240),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','blocked','done','cancelled')),
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,contact_id) REFERENCES omnia.crm_contacts(tenant_id,id) ON DELETE RESTRICT
);

CREATE TABLE omnia.consent_records (
  tenant_id uuid NOT NULL REFERENCES omnia.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject_ref text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('crm_contact','ai_processing','telegram_notifications','whatsapp_notifications','email_marketing','sms_marketing','analytics')),
  status text NOT NULL CHECK (status IN ('granted','withdrawn','denied')),
  policy_version text NOT NULL,
  evidence_ref text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id)
);
CREATE INDEX consent_subject_purpose_idx ON omnia.consent_records(tenant_id,subject_ref,purpose,captured_at DESC);

CREATE TABLE omnia.audit_events (
  tenant_id uuid NOT NULL REFERENCES omnia.tenants(id) ON DELETE RESTRICT,
  id bigint GENERATED ALWAYS AS IDENTITY,
  actor_user_id uuid REFERENCES omnia.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (length(action) BETWEEN 1 AND 120),
  resource_type text NOT NULL CHECK (length(resource_type) BETWEEN 1 AND 80),
  resource_ref text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  request_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details)='object'),
  PRIMARY KEY (tenant_id,id)
);
CREATE INDEX audit_events_tenant_time_idx ON omnia.audit_events(tenant_id,occurred_at DESC);

CREATE TABLE omnia.telegram_bindings (
  tenant_id uuid NOT NULL REFERENCES omnia.tenants(id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES omnia.users(id) ON DELETE RESTRICT,
  chat_id_sha256 text NOT NULL CHECK (chat_id_sha256 ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','revoked')),
  verified_at timestamptz,
  consent_status text NOT NULL DEFAULT 'unknown' CHECK (consent_status IN ('unknown','granted','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,id),
  UNIQUE (tenant_id,chat_id_sha256)
);

CREATE TABLE omnia.telegram_webhook_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'telegram' CHECK (provider='telegram'),
  update_id bigint NOT NULL CHECK (update_id>=0),
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  tenant_id uuid REFERENCES omnia.tenants(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'received_unmapped'
    CHECK (status IN ('received_unmapped','linked','rejected','processed')),
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider,update_id)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tenant_memberships','workspaces','crm_contacts','crm_interactions','crm_tasks','consent_records','audit_events','telegram_bindings']
  LOOP
    EXECUTE format('ALTER TABLE omnia.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE omnia.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY tenant_isolation ON omnia.%I USING (tenant_id = nullif(current_setting(''app.tenant_id'',true),'''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''app.tenant_id'',true),'''')::uuid)',t);
  END LOOP;
END $$;

ALTER TABLE omnia.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE omnia.tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON omnia.tenants
  USING (id = nullif(current_setting('app.tenant_id',true),'')::uuid)
  WITH CHECK (id = nullif(current_setting('app.tenant_id',true),'')::uuid);

ALTER TABLE omnia.telegram_webhook_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE omnia.telegram_webhook_receipts FORCE ROW LEVEL SECURITY;
CREATE POLICY telegram_ingest_only ON omnia.telegram_webhook_receipts
  USING (current_user='omnia_telegram_ingest')
  WITH CHECK (current_user='omnia_telegram_ingest' AND tenant_id IS NULL);
COMMIT;
