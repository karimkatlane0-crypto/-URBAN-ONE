# SUPER.AI PostgreSQL foundation — BUILD candidate

Date: 2026-11-22  
Branch: `feat/super-ai-unified-platform-20261122`  
Scope: migration infrastructure and tenant-safe control-plane schema only.

## Added

- `packages/super-ai/postgres-migrations.mjs`: PostgreSQL migration runner using an injected `pg`-compatible pool. It does not add a runtime dependency or open a connection by itself.
- `packages/super-ai/migrations/0001_control_plane.up.sql`: tenant roots, memberships, service-instance registry, tenant-scoped idempotency records and append-only audit events.
- `0001_control_plane.down.sql`: explicit rollback for the initial schema.
- `tests/super-ai-postgres-migrations.test.mjs`: filename, checksum and fail-closed rollback guard tests.

## Safety properties

1. Ordered migration IDs and SHA-256 checksums are recorded in `super_ai.schema_migrations`.
2. A PostgreSQL advisory lock serializes concurrent migration runners.
3. Each migration and its ledger write run in one transaction.
4. A changed already-applied migration fails with `MIGRATION_CHECKSUM_MISMATCH`.
5. Rollback is disabled unless `allowDestructiveRollback: true` is passed and only the latest applied migration can be rolled back. Down migrations execute newest-first.
6. Tenant-scoped tables use PostgreSQL RLS with `FORCE ROW LEVEL SECURITY`; application transactions must set `app.tenant_id` from server-verified membership using transaction-local `set_config`.
7. Audit rows reject UPDATE and DELETE. The application database role must not own the tables and must not have `BYPASSRLS`.

## Invocation contract

The application or deployment layer must create and authorize a PostgreSQL pool, then explicitly call `runPostgresMigrations({ pool, directory, direction: 'up' })`. The runner is intentionally not imported by the SEVA server and no migration is automatically applied.

## Not yet implemented or verified

- No PostgreSQL service has been provisioned or contacted.
- No `pg` dependency or connection secret has been added.
- No database migration has been executed against PostgreSQL.
- No two-tenant live RLS test, backup/restore test, PITR test, connection-pool test or failover test has been run.
- Existing SEVA runtime remains SQLite; this change does not migrate its data or switch its server.
- Instance Manager still uses its current in-memory store and simulated provisioner. This schema is a foundation, not a completed durable Instance Manager.
- The initial down migration is destructive. A tested backup and explicit operator authorization are required before using it on any non-disposable database.

## Next BUILD increment

Add a PostgreSQL repository adapter for the Instance Manager with atomic tenant/idempotency/quota reservation, provider-operation receipts and restart recovery. Keep it opt-in until integration tests run against a disposable PostgreSQL instance and two synthetic tenants.
