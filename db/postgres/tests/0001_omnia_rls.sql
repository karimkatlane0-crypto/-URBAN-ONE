\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='urban_one_runtime_test') THEN
    EXECUTE 'CREATE ROLE urban_one_runtime_test NOLOGIN NOBYPASSRLS';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='urban_one_telegram_ingest') THEN
    EXECUTE 'CREATE ROLE urban_one_telegram_ingest NOLOGIN NOBYPASSRLS';
  END IF;
END $$;
GRANT USAGE ON SCHEMA urban_one TO urban_one_runtime_test,urban_one_telegram_ingest;
GRANT SELECT ON urban_one.tenants,urban_one.tenant_memberships,urban_one.workspaces,urban_one.crm_contacts,urban_one.crm_interactions,urban_one.crm_tasks,urban_one.consent_records,urban_one.audit_events,urban_one.telegram_bindings TO urban_one_runtime_test;
GRANT INSERT,UPDATE ON urban_one.crm_contacts,urban_one.crm_tasks TO urban_one_runtime_test;
GRANT INSERT ON urban_one.crm_interactions,urban_one.consent_records,urban_one.audit_events TO urban_one_runtime_test;
GRANT SELECT,INSERT ON urban_one.telegram_webhook_receipts TO urban_one_telegram_ingest;

INSERT INTO urban_one.tenants(id,slug,display_name) VALUES
 ('10000000-0000-4000-8000-000000000001','alpha','Alpha'),
 ('10000000-0000-4000-8000-000000000002','bravo','Bravo');
INSERT INTO urban_one.users(id,issuer,subject,email) VALUES
 ('10000000-0000-4000-8000-000000000011','test','alpha','alpha@example.test'),
 ('10000000-0000-4000-8000-000000000022','test','bravo','bravo@example.test');
INSERT INTO urban_one.tenant_memberships(tenant_id,user_id,role) VALUES
 ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000011','owner'),
 ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000022','owner');
INSERT INTO urban_one.workspaces(tenant_id,id,module_key,slug,name) VALUES
 ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000101','urban-one','alpha-crm','Alpha CRM'),
 ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000202','urban-one','bravo-crm','Bravo CRM');
INSERT INTO urban_one.crm_contacts(tenant_id,id,workspace_id,display_name,email) VALUES
 ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000111','10000000-0000-4000-8000-000000000101','Alpha Contact','alpha@example.test'),
 ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000222','10000000-0000-4000-8000-000000000202','Bravo Contact','bravo@example.test');

SET LOCAL ROLE urban_one_runtime_test;
SET LOCAL app.tenant_id='10000000-0000-4000-8000-000000000001';
DO $$
BEGIN
  IF (SELECT count(*) FROM urban_one.tenants) <> 1 THEN RAISE EXCEPTION 'tenant RLS isolation failed'; END IF;
  IF (SELECT count(*) FROM urban_one.crm_contacts) <> 1 THEN RAISE EXCEPTION 'CRM RLS isolation failed'; END IF;
  IF EXISTS (SELECT 1 FROM urban_one.crm_contacts WHERE display_name='Bravo Contact') THEN RAISE EXCEPTION 'cross-tenant CRM read leaked'; END IF;
  BEGIN
    INSERT INTO urban_one.crm_contacts(tenant_id,id,display_name) VALUES
      ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000333','Cross Tenant Write');
    RAISE EXCEPTION 'cross-tenant CRM write unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

SET LOCAL ROLE urban_one_telegram_ingest;
INSERT INTO urban_one.telegram_webhook_receipts(provider,update_id,payload_sha256)
VALUES ('telegram',42,repeat('a',64)) ON CONFLICT(provider,update_id) DO NOTHING;
DO $$
DECLARE n integer;
BEGIN
  INSERT INTO urban_one.telegram_webhook_receipts(provider,update_id,payload_sha256)
  VALUES ('telegram',42,repeat('a',64)) ON CONFLICT(provider,update_id) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'Telegram update replay was not suppressed'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
