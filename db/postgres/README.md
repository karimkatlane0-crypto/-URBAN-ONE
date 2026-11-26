# URBAN ONE PostgreSQL foundation

This is a URBAN ONE-only database foundation for the canonical `-URBAN-ONE` repository. It is not a shared customer database for TITANS, SEVA, SYNAPSY or KKUBERA and is not connected to production. Other projects must keep separate database instances, tenant namespaces, service credentials, webhook secrets and payment ledgers.

## Scope
- URBAN ONE-local tenant registry, users and memberships.
- URBAN ONE workspaces only (`module_key='urban-one'`).
- URBAN ONE CRM contacts, interactions and tasks.
- Purpose-specific consent records and audit events.
- Hashed Telegram account bindings and idempotent webhook receipts (update ID and payload digest only; no raw message body).
- Forced PostgreSQL Row-Level Security on tenant-owned tables.

## Runtime contract
1. Authenticate through the configured identity provider and resolve URBAN ONE membership server-side.
2. Set transaction-local `app.tenant_id` only from the verified membership.
3. Use a non-owner `NOBYPASSRLS` runtime role; never use a superuser for application traffic.
4. Keep migration, runtime and Telegram receipt-ingestion roles separate and least-privileged.
5. Do not process Telegram content until signature validation, account linking, explicit purpose consent, replay handling and retention/deletion are verified.
6. Keep secrets in the hosting secret manager. Never commit customer data, provider tokens or payment details.

## Isolation rule
Cross-project navigation and SSO may exchange verified OIDC issuer/subject references through explicit APIs. They must not share CRM rows, customer records, tenant IDs, database credentials, webhook keys or payment ledgers. Each project's database is provisioned and recovered independently.

## Migration boundary
This is an additive CI-tested schema foundation only. Existing SQLite stores remain unchanged. No runtime adapter, production database, data copy, dual-write, cutover, backup/restore drill or production migration is claimed. The existing Render Free database is not an approved permanent production database; the external connection is not enabled.

## Verification
The PostgreSQL 16 workflow applies the migration to an ephemeral CI database and verifies two synthetic URBAN ONE tenants, cross-tenant read/write denial and Telegram update replay suppression. These tests do not prove production hosting, recovery, live Telegram delivery or customer synchronization.
