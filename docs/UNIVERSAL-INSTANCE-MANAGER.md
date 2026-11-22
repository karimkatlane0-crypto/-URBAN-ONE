# UNIVERSAL Instance Manager — BUILD contract

**Status:** BUILD candidate; provider runtime NOT CONNECTED; production NOT AUTHORIZED.

## Purpose

Provide a central catalog and lifecycle API so a user action can request an isolated module instance. This implementation is provider-neutral: it defines validation, approval, idempotency, tenant scoping, quotas, lifecycle states and a strict provisioner adapter contract. It does not create cloud resources by itself.

## Module manifest

Each catalog entry declares a stable module ID, version, capabilities, resource profile and permitted environments. Invalid or duplicate manifests fail at startup. A module cannot request arbitrary shell commands, raw credentials or unrestricted network access through the manager.

## Lifecycle

`create` → `provisioning` → `running` or `failed` → `stopping` → `stopped` → `deleted`.

Every create/stop/delete request passes the injected authorization function. Creation requires a tenant ID and idempotency key; per-tenant active-instance quotas are enforced. Reads and listings are tenant-scoped. Health updates require a running instance and timestamped status.

The provisioner adapter must implement `provision`, `stop` and `delete`. It receives a constrained request with tenant-scoped identity, instance-only secret scope and deny-by-default network policy. It must return `{ accepted: true }` only after the provider has accepted the isolated instance request. `delete` must confirm provider-side resource cleanup before the manager marks the instance deleted. The manager does not trust browser-provided tenant identity; the server adapter must derive tenant context from authenticated identity.

## Persistence and production gates

The default registry is an in-memory Map for deterministic tests and local development. Production MUST inject a durable transactional store with a unique constraint on (tenant_id, idempotency_key), atomic idempotency reservation, atomic quota reservation, optimistic state transitions and recovery of in-flight provisioning after process restart. The starter's in-process idempotency lock only prevents duplicate concurrent calls within one process; it is not a distributed lock.

Before a real adapter is marked VERIFIED, require workload identity, least-privilege scopes, per-instance secrets, network egress allowlists, DNS/IP and redirect revalidation, resource quotas, signed image/artifact provenance, startup and health probes, timeouts, cleanup/compensation, immutable audit events, cost metering, backup/restore and adapter conformance tests.

The first production adapter must be restricted to a non-production sandbox. No production environment is enabled by the starter catalog. No provider credentials, URLs, IP allowlists, billing plans or live data are created or changed by this module.

## Verification

Run `npm test`, `npm run verify` and `npm run security:secrets` on the branch. Add integration tests against a disposable sandbox provider before connecting an adapter. The unit tests exercise manifest validation, approval denial, tenant isolation, sequential and concurrent idempotency, quotas, failure states, health evidence and stop/delete lifecycle.

## Status vocabulary

- `CATALOG_ONLY`: manifest is available.
- `PROVISIONING`: approved request accepted by the adapter.
- `RUNNING`: adapter returned an accepted instance; health is still unknown until timestamped health evidence arrives.
- `HEALTHY`: a separate current health check was recorded.
- `FAILED`, `STOPPED`, `DELETED`: lifecycle outcomes, not proof of provider cleanup unless adapter receipts are retained.

**Governance:** BUILD → VERIFY → RELEASE → SCALE. Merge and deployment remain separate human approval gates.

## Sandbox adapter and click-to-instance UI

The SEVA enterprise candidate now wires the manager to `apps/seva-enterprise/instance-sandbox.mjs`, an in-process simulation adapter. It accepts only `test` and `staging`, requires tenant scope, dedicated identity, deny-by-default network policy and instance-only secret scope, and returns synthetic provider receipts. It does not start containers, allocate cloud resources, invoke a shell, contact external networks or use provider credentials.

The authenticated UI is served at `/instances.html` and linked from the SEVA command center. It calls:
- `GET /api/instances/catalog`
- `GET /api/instances`
- `GET /api/instances/adapter`
- `POST /api/instances`
- `POST /api/instances/:uuid/stop`
- `DELETE /api/instances/:uuid`

API routes require a valid SEVA session. Mutating requests require same-origin validation and are rate limited. Tenant identity is derived from the authenticated server session, never accepted from the browser. Cross-tenant reads and lifecycle operations fail closed.

The sandbox registry is volatile and process-local. A server restart clears instances. The manager must not be described as a cloud/container deployment product until a separate, authenticated provider adapter, durable state store, sandbox environment and independent provider-side verification are implemented.
