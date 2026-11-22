CREATE SCHEMA IF NOT EXISTS super_ai;

CREATE TABLE super_ai.tenants (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE super_ai.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_ai.tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_root_isolation ON super_ai.tenants
  USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE super_ai.tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES super_ai.tenants(id) ON DELETE RESTRICT,
  actor_id text NOT NULL CHECK (length(actor_id) BETWEEN 1 AND 200),
  role text NOT NULL CHECK (role IN ('owner','admin','operator','analyst','member','viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, actor_id)
);

CREATE TABLE super_ai.service_instances (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES super_ai.tenants(id) ON DELETE RESTRICT,
  module_id text NOT NULL CHECK (module_id ~ '^[a-z][a-z0-9-]{1,62}$'),
  module_version text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('development','test','staging','production')),
  state text NOT NULL CHECK (state IN ('queued','provisioning','running','stopping','stopped','failed','deleted')),
  provider text NOT NULL,
  provider_instance_id text,
  resource_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  health jsonb NOT NULL DEFAULT '{"status":"unknown"}'::jsonb,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id)
);

CREATE INDEX service_instances_tenant_state_idx
  ON super_ai.service_instances(tenant_id, state, updated_at DESC);

CREATE TABLE super_ai.instance_idempotency (
  tenant_id uuid NOT NULL REFERENCES super_ai.tenants(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 8 AND 128),
  request_sha256 text NOT NULL CHECK (request_sha256 ~ '^[a-f0-9]{64}$'),
  instance_id uuid NOT NULL,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, idempotency_key),
  FOREIGN KEY (tenant_id, instance_id)
    REFERENCES super_ai.service_instances(tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE super_ai.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES super_ai.tenants(id) ON DELETE RESTRICT,
  actor_id text,
  action text NOT NULL CHECK (length(action) BETWEEN 1 AND 120),
  resource_type text NOT NULL CHECK (length(resource_type) BETWEEN 1 AND 80),
  resource_id text,
  correlation_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_tenant_created_idx
  ON super_ai.audit_events(tenant_id, created_at DESC);

CREATE FUNCTION super_ai.reject_audit_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_EVENTS_APPEND_ONLY';
END;
$$;

CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE OR DELETE ON super_ai.audit_events
  FOR EACH ROW EXECUTE FUNCTION super_ai.reject_audit_mutation();

ALTER TABLE super_ai.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_ai.tenant_memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_membership_isolation ON super_ai.tenant_memberships
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE super_ai.service_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_ai.service_instances FORCE ROW LEVEL SECURITY;
CREATE POLICY service_instance_isolation ON super_ai.service_instances
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE super_ai.instance_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_ai.instance_idempotency FORCE ROW LEVEL SECURITY;
CREATE POLICY instance_idempotency_isolation ON super_ai.instance_idempotency
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE super_ai.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_ai.audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_event_isolation ON super_ai.audit_events
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- Application requests must set this transaction-locally after authenticating
-- the actor and resolving tenant membership server-side:
-- SELECT set_config('app.tenant_id', $1, true);
-- Do not grant application roles BYPASSRLS or table ownership.
