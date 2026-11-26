\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='omnia_runtime_test') THEN
    EXECUTE 'CREATE ROLE omnia_runtime_test NOLOGIN NOBYPASSRLS';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='omnia_telegram_ingest') THEN
    EXECUTE 'CREATE ROLE omnia_telegram_ingest NOLOGIN NOBYPASSRLS';
  END IF;
END $$;
GRANT USAGE ON SCHEMA omnia TO omnia_runtime_test,omnia_telegram_ingest;
GRANT SELECT ON omnia.tenants,omnia.tenant_memberships,omnia.workspaces,omnia.crm_contacts,omnia.crm_interactions,omnia.crm_tasks,omnia.consent_records,omnia.audit_events,omnia.telegram_bindings TO omnia_runtime_test;
GRANT INSERT,UPDATE ON omnia.crm_contacts,omnia.crm_tasks TO omnia_runtime_test;
GRANT INSERT ON omnia.crm_interactions,omnia.consent_records,omnia.audit_events TO omnia_runtime_test;
GRANT SELECT,INSERT ON omnia.telegram_webhook_receipts TO omnia_telegram_ingest;

INSERT INTO omnia.tenants(id,slug,display_name) VALUES
 ('10000000-0000-4000-8000-000000000001','alpha','Alpha'),
 ('10000000-0000-4000-8000-000000000002','bravo','Bravo');
INSERT INTO omnia.users(id,issuer,subject,email) VALUES
 ('10000000-0000-4000-8000-000000000011','test','alpha','alpha@example.test'),
 ('10000000-0000-4000-8000-000000000022','test','bravo','bravo@example.test');
INSERT INTO omnia.tenant_memberships(tenant_id,user_id,role) VALUES
 ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000011','owner'),
 ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000022','owner');
INSERT INTO omnia.workspaces(tenant_id,id,module_key,slug,name) VALUES
 ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000101','urban-one','alpha-crm','Alpha CRM'),
 ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000202','seva','bravo-crm','Bravo CRM');
INSERT INTO omnia.crm_contacts(tenant_id,id,workspace_id,display_name,email) VALUES
 ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000111','10000000-0000-4000-8000-000000000101','Alpha Contact','alpha@example.test'),
 ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000222','10000000-0000-4000-8000-000000000202','Bravo Contact','bravo@example.test');

SET LOCAL ROLE omnia_runtime_test;
SET LOCAL app.tenant_id='10000000-0000-4000-8000-000000000001';
DO $$
BEGIN
  IF (SELECT count(*) FROM omnia.tenants) <> 1 THEN RAISE EXCEPTION 'tenant RLS isolation failed'; END IF;
  IF (SELECT count(*) FROM omnia.crm_contacts) <> 1 THEN RAISE EXCEPTION 'CRM RLS isolation failed'; END IF;
  IF EXISTS (SELECT 1 FROM omnia.crm_contacts WHERE display_name='Bravo Contact') THEN RAISE EXCEPTION 'cross-tenant CRM read leaked'; END IF;
  BEGIN
    INSERT INTO omnia.crm_contacts(tenant_id,id,display_name) VALUES
      ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000333','Cross Tenant Write');
    RAISE EXCEPTION 'cross-tenant CRM write unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

SET LOCAL ROLE omnia_telegram_ingest;
INSERT INTO omnia.telegram_webhook_receipts(provider,update_id,payload_sha256)
VALUES ('telegram',42,repeat('a',64)) ON CONFLICT(provider,update_id) DO NOTHING;
DO $$
DECLARE n integer;
BEGIN
  INSERT INTO omnia.telegram_webhook_receipts(provider,update_id,payload_sha256)
  VALUES ('telegram',42,repeat('a',64)) ON CONFLICT(provider,update_id) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Telegram update replay was not suppressed'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
