# Mobile CRM on the existing SEVA server

## What this change does

The existing `server.mjs` now mounts `/mobile-crm/` and `/api/v1/mobile/*` in its own process. It uses the same `store.db` and the same `seva_session` lookup as the existing login. No additional listener, public login or reverse-proxy route is required. The PR #157/#158 API, client, stay register, source checks, signed scope binding and tenant-scoped records remain in use.

The routes remain opt-in. With missing configuration, they return HTTP 503 with `mobile_not_ready` and a specific configuration reason; the main service continues running. A disabled or unconfigured mount does not create the mobile tables. `/api/public/status` adds a `mobileSync` object without keys, database paths or private records. `ready` describes configuration and route mounting, not provider verification or membership approval.

## Configure the existing process

Use the complete repository and Node.js 22.13 or later, as required by the application. Keep the existing login/database configuration. Add these settings to the approved staging process:

| Setting | Required value |
| --- | --- |
| `SEVA_MOBILE_SYNC_ENABLED` | `true` to enable the mount |
| `SEVA_PUBLIC_URL` | The exact HTTPS origin, without credentials, path, query or fragment |
| `SEVA_DB_PATH` | The absolute path of the selected persistent SEVA SQLite database |
| `SEVA_MOBILE_SIGNING_KEY_BASE64` | A dedicated random 32-byte key encoded as canonical base64, supplied through the hosting secret facility |

Retain the signing key across restarts: cursors, scope tokens and existing audit records are bound to it. Do not reuse payment/provider keys or generate a different key at every launch. Key rotation requires its own migration plan. No key is included in the source or this document.

Start the existing application using its normal command:

```sh
cd apps/seva-enterprise
npm start
```

When migrating an existing sidecar installation, stop and retire its separate service and remove its mobile proxy overrides before choosing the main-server route. Do not start `mobile-sync-server.mjs` alongside this configuration: both modes use the same opt-in flag. The old sidecar remains available for deployments that deliberately retain that architecture. `SEVA_MOBILE_PORT` is not used by the main-server mount.

For an isolated local test only, a non-production process may opt into `SEVA_MOBILE_ALLOW_LOOPBACK_HTTP=true` with an HTTP origin whose host is `127.0.0.1`, `localhost` or `[::1]`. This exception is rejected for production and for other hosts. It is not a way to publish a plain-HTTP service.

## Install an explicitly approved membership and source

An authenticated account alone does not grant mobile access. `mobile-sync-install.mjs` is an operator-only local utility; it is not reachable through HTTP. It requires an existing SEVA database and an existing account ID. It neither registers users nor infers consent from a filename or environment variable.

Take the account ID from the authenticated account/administrative record. Replace every placeholder below with the approved values and actual evidence references. Keep the source ID for the UI field **Fonte autorizzata**.

```sh
node --experimental-sqlite apps/seva-enterprise/mobile-sync-install.mjs \
  --database /absolute/path/to/staging-seva.sqlite \
  --subject EXISTING_SEVA_USER_ID \
  --tenant APPROVED_TENANT_ID \
  --role operator \
  --source APPROVED_SOURCE_ID \
  --rights-ref SOURCE_RIGHTS_EVIDENCE_REF \
  --authorization-ref MEMBERSHIP_AUTHORIZATION_REF
```

The default returns `PROPOSED` and opens the database read-only. After reviewing that exact proposal, repeat the command with `--apply`. This transaction creates only the missing membership and authorized source, initializes the additive mobile schema when needed, and records the operation in the existing audit table. The supplied references record the operator's decision; the utility does not independently verify those documents. It does not change consent or revocation records.

Repeating the same applied command with a complete schema returns `ALREADY_CONFIGURED`. If an incomplete historical installation is missing schema objects, creation is recorded as `schemaChanged:true` and `APPLIED`, even when membership/source are unchanged. A different tenant/role, disabled existing membership, different rights reference or disabled existing source is refused rather than silently changed. Role changes and revocations remain a distinct administrative operation. Do not automate provisioning for every login.

## Use the completed server path

1. Sign in through the existing SEVA login on the configured origin.
2. Open `/mobile-crm/` and choose **Collega la sessione SEVA**.
3. Enter the source ID approved by the operator; prepare a CRM record, stay or follow-up task.
4. Choose **Invia la coda**. The client identifies the current session, reads changes, submits the queued operation IDs, and refreshes the persisted result on the same server.
5. Review any conflict before preparing a new proposal. Lost responses reuse the original operation ID; older versions do not overwrite newer records.

The outbox remains in memory with explicit encrypted export/import. Sending is explicit; reconnecting does not send drafts automatically. There are no automatic emails, provider calls or payments. The mobile database is an internal register: it is not automatically the separate ChatGPT Sites/D1 CRM, a phone contact database or an OTA feed.

## Failure diagnosis and rollback

| Result | Meaning and next step |
| --- | --- |
| 503 `mobile_not_ready`, reason `disabled` | Set the explicit mobile flag only in the intended environment |
| 503, reason `https_origin_required` | Correct the configured origin; use HTTPS outside the isolated loopback exception |
| 503, reason `persistent_database_required` | Configure the absolute persistent SEVA database path |
| 503, reason `dedicated_signing_key_required` | Supply the dedicated canonical base64 key through the secret facility |
| 503, reason `mobile_storage_unavailable` | Review database/schema and local server diagnostics; no fallback storage is created |
| 401 `authentication_required` | Sign in again through the same existing SEVA login |
| 403 `membership_required` | Have an operator review and explicitly install the existing account's membership |
| 403 `source_not_authorized` | Correct the source ID or review its recorded authorization |
| 403 scope/account error | Reconnect the same account; do not transfer its draft to another tenant |
| A sync result marked `conflict` | Retain/review the local proposal; it has not replaced the newer server version |

To roll back the mount, set `SEVA_MOBILE_SYNC_ENABLED=false` and restart the existing process. Keep the database, mobile records and audit history. No table deletion, database replacement, payment reconfiguration or restore is part of rollback.

## Evidence and remaining scope

The new test `test/mobile-sync-main-server.test.mjs` runs the real `server.mjs` on loopback with temporary on-disk SQLite and synthetic accounts. It checks disabled/missing-key behavior, real registration/login cookies, explicit installation, unauthorized access, source checks, two-tenant isolation, viewer restrictions, replay, stale-write conflicts, logout, process restart and a fresh SQLite connection reading the stored records and verifying the mobile audit chain. Provider credentials are not passed to those child processes.

Run the directly affected HTTP suites:

```sh
node --experimental-sqlite --test \
  apps/seva-enterprise/test/mobile-sync-*.test.mjs \
  apps/seva-enterprise/test/http.test.mjs
```

These are local server/client and database proofs. They do not establish a hosted installation, production TLS, browser-to-production execution, physical Android/iOS behavior, an external audit anchor or provider delivery. The existing provider/payment gates remain separate. A source commit or GitHub workflow result does not install this Node/SQLite process into the separate Sites/Cloudflare/D1 runtime.
