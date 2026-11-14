# SEVA Mobile Sync — candidate build, 14 November 2026

## Scope and provenance

This additive backend implements the four routes listed in the original `SEVA_MOBILE_DATABASE_STARTER_2026-11-14.zip` README. It does not replace SEVA, migrate a production database or enable payments. The original browser/IndexedDB demonstration remains an offline demo; its UI is not silently changed into a production client. Base: repository `karimkatlane0-crypto/-URBAN-ONE`, main commit `b918b1de78b2626b649e82b1d703038b36cbed3f`, after PR #154. Prior general CI and Android success applies to head `d56a36e277c2e4de052adbf079d40e8918c8a8cd`, not automatically to this new build.

## Four endpoints

| Method and route | Behavior |
| --- | --- |
| GET /api/v1/mobile/me | Existing SEVA session plus server-provisioned membership; verified subject, tenant and role. |
| GET /api/v1/mobile/sync?cursor=... | Tenant-scoped changes, 100 per page, signed scope-bound 24-hour cursor, tombstones. |
| POST /api/v1/mobile/sync | Explicit batch from an operator-approved source, at most 100 operations and 64 KiB; optimistic baseVersion; idempotency and conflicts. |
| POST /api/v1/mobile/partners/applications | Explicit consent, pending-review application only; no acceptance of an agreement and no charge. |

The sync request is `{sourceId,mutations:[{operationId,recordId,kind,operation,baseVersion,payload}]}`. `operation` is `upsert` or `delete`; omit payload for deletion. Use stable operation IDs when retrying. An edited operation requires a new ID. Conflicts are returned without overwriting; clients must retain conflicted outbox items for review. Deletion cannot be undone by replaying an old operation. This version does not expose a public undelete operation.

Record kinds: crm, partner, task, evidence, device. Payload fields are allowlisted in `mobile-sync-api.mjs`; geographic labels are optional strings, not an authoritative government/address database. No chat history, credentials, payment cards, OTPs or device-control payloads are accepted. No network import, global-phone scraping, broadcast, or remote-cloning capability exists.

Partner input: `{sourceId,operationId,applicationId,organization,contactEmail,country?,consent:true}`. HTTP 202 means pending review, not a completed partnership or payment.

## Identity, authority and data

The session adapter uses `store.fromSession` from the existing server-side SEVA store. It rejects missing, malformed or duplicate cookies. Production OAuth/OIDC/PKCE is NOT added or certified here. API JSON, query strings and headers cannot grant a tenant or role.

A trusted operator must provision `mobile_subjects(subject,tenant,role,active)` from verified existing account IDs and `mobile_sources(tenant,source_id,rights_ref,enabled)` after inspecting ownership/licence and purpose evidence. There is no public provisioning endpoint. Blank rights references or disabled sources fail closed. A stored rights reference records an operator decision; it does not independently prove lawful processing. User authorization cannot grant access to other people's accounts, devices or private conversations.

SQLite tables are scoped with tenant keys and server-side filtering. This is NOT PostgreSQL RLS, multi-region sovereignty, encryption at rest, or a multi-node Kubernetes certification. Those remain release gates. Audit events are HMAC-chained and transactionally stored with mutations; triggers reject ordinary updates/deletes and a persisted head detects a removed tail. A database administrator who can replace BOTH the ledger and head, or someone possessing the signing key, is outside that guarantee. External checkpoint anchoring/WORM storage, key rotation, retention/erasure rules and scalable verification remain required before production.

## Integration and execution

`mobile-sync-server.mjs` is an opt-in loopback sidecar using the existing `core.mjs` and explicitly configured SEVA SQLite file. It does not alter `server.mjs` or deploy on import. Reviewed reverse-proxy configuration must route only `/api/v1/mobile/` to it while preserving the existing HTTPS origin and session cookie. No CORS wildcard is emitted. Mutation requests require the exact configured Origin.

Required operator-controlled settings: `SEVA_MOBILE_SYNC_ENABLED=true`, HTTPS `SEVA_PUBLIC_URL`, explicit `SEVA_DB_PATH`, dedicated random 32-byte base64 `SEVA_MOBILE_SIGNING_KEY_BASE64`, optional `SEVA_MOBILE_PORT` (default 3001). Keep signing/backup keys outside Git, browser storage, logs and this package. Do not reuse payment/provider keys. No credentials are included.

Before enabling: back up the selected staging database, review migrations, provision only authorized memberships and sources, configure same-origin TLS proxy, then test through the real login and browser. The sidecar is deliberately not started in this delivery. Feature disable + stopping/removing the proxy route is the operational rollback. Additive tables are retained; no production DROP or restore is automated.

## Verification

Local Node.js 22.16.0: 27 tests PASS, 0 FAIL, 0 SKIP at package creation. Actual HTTP requests run against loopback with synthetic identities and SQLite. Tests include unauthenticated/forged scope rejection, read-only roles, authorized sources, cross-tenant reads/writes, stale updates, tombstones, replay, pagination, expired/tampered cursors, restricted payloads, body bounds, audit rollback and tampering, database close/reopen, AES-256-GCM backup and isolated restore. The cookie adapter is tested with a server-lookup fixture; actual hosted login and reverse-proxy execution still need independent evidence. Existing root tests are neither modified nor disabled.

Reproduce: `node --experimental-sqlite --test apps/seva-enterprise/test/mobile-sync-*.test.mjs`.
Dedicated workflow: `.github/workflows/mobile-sync-security.yml`. The existing Enterprise test glob also includes these new test files. GitHub CI results must be tied to the new commit, not assumed from local tests or PR #154.

## Backup boundaries

`encryptedSnapshot` uses SQLite VACUUM INTO to snapshot only the explicitly supplied database, then seals it with AES-256-GCM and a separate 32-byte key. A temporary plaintext snapshot is removed in a finally block; this is not a secure-erasure guarantee. `restoreEncryptedSnapshot` rejects bad authentication and refuses to overwrite an existing destination; integrity_check runs on the restored file. Operator-only utilities, no HTTP backup endpoint. Tests cover synthetic data only. There is NO backup of the user's phone, Drive, production SEVA, Stripe, Kubernetes or every database in the world.

## Remaining release queue — NO-GO

1. Verify new commit CI; review all code and membership/source provisioning.
2. Hosted authentication, same-origin HTTP integration, physical Android/iOS tests, offline outbox/reconnect and browser-storage privacy.
3. Production persistence, tenant isolation under production DB roles, encrypted at-rest storage, externally anchored audit, retention and restore drill.
4. Separately verify Stripe TEST checkout -> signed webhook -> entitlement -> replay/cancellation before any LIVE activation. No financial product/pricing change is included.
5. Connect only authorized WhatsApp/Skebby/Meta/Windsor/Power BI/Kubernetes providers with their own credentials and evidence. No broadcasting or paid advertising is triggered.
6. Owner review of evidence before deployment. This branch is not a release certificate.

References: Node SQLite documentation https://nodejs.org/api/sqlite.html ; PostgreSQL RLS documentation https://www.postgresql.org/docs/current/ddl-rowsecurity.html . These describe platform behavior, not deployment evidence for SEVA.
