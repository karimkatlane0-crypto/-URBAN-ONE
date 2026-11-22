DROP TRIGGER IF EXISTS audit_events_no_update ON super_ai.audit_events;
DROP FUNCTION IF EXISTS super_ai.reject_audit_mutation();
DROP TABLE IF EXISTS super_ai.audit_events;
DROP TABLE IF EXISTS super_ai.instance_idempotency;
DROP TABLE IF EXISTS super_ai.service_instances;
DROP TABLE IF EXISTS super_ai.tenant_memberships;
DROP TABLE IF EXISTS super_ai.tenants;
