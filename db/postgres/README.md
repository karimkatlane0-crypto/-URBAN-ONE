# OMNIA PostgreSQL foundation

This is an additive, CI-tested schema foundation for the shared ALL-IN-ONE platform. It does not alter or migrate any existing SQLite database and is not connected to production.

## Domains

- omnia.tenants, omnia.users, omnia.tenant_memberships: verified identity and workspace membership.
- omnia.workspaces: separate module workspaces for TITANS, SEVA, SYNAPSY, KKUBERA, URBAN ONE and INSIGHTS.
- omnia.crm_contacts, crm_interactions, crm_tasks: tenant-scoped customer relationship records.
- omnia.consent_records, audit_events: purpose-bound consent history and audit events.
- omnia.telegram_bindings: hashed chat identifiers and explicit account-link/consent state.
- omnia.telegram_webhook_receipts: durable update-ID replay receipts only; no raw message body or raw provider payload is stored.

## Runtime contract

1. Authenticate via the configured identity provider; derive user and tenant from verified server-side membership.
2. Begin a transaction and set SET LOCAL app.tenant_id to the verified UUID.
3. Use a non-owner, NOBYPASSRLS application role. Never connect as PostgreSQL superuser or schema owner.
4. Use separate, least-privilege roles for CRM runtime, identity provisioning and Telegram webhook ingestion. Provision omnia_telegram_ingest as a NOLOGIN NOBYPASSRLS role; grant only the schema/table permissions required by the webhook adapter.
5. Telegram updates are acknowledged idempotently only after the durable receipt insert succeeds. Raw message text is not persisted by the receipt table. A separate tenant-linking and consent-controlled processing stage is required before messages can become CRM interactions.
6. Keep credentials and database URLs in the hosting secret manager. Do not commit customer records, tokens, bot secrets or payment data.

## Migration and deployment boundary

- Apply migrations only to a dedicated staging database after a migration owner reviews them.
- The current Render seva-dbrelay PostgreSQL instance is on the Free plan and expires 2026-11-29. It is not an approved permanent production database.
- The connected Render workspace currently exposes no web service. The database external connection is blocked by an empty IP allowlist; do not weaken that allowlist just to permit this chat session.
- The existing SEVA and KKUBERA SQLite stores remain separate. No dual-write, data copy, cutover or production migration is included.
- Before a future cutover, implement the PostgreSQL repository adapter, migration runner/checksums, backups, restore drill, cross-tenant API tests, data-retention/export/deletion and rollback plan.

## CI verification

The PostgreSQL 16 workflow applies the migration to an ephemeral CI database, runs two synthetic tenant isolation checks, verifies a cross-tenant write is denied, and verifies duplicate Telegram update IDs are suppressed. These checks do not prove production hosting, backup recovery, real Telegram delivery or customer CRM synchronization.
