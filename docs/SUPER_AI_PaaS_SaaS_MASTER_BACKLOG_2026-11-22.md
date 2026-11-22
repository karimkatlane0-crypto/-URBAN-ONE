# SUPER.AI — Unified PaaS / SaaS Master Backlog

**Date:** 2026-11-22  
**Repository:** `karimkatlane0-crypto/-URBAN-ONE`  
**Target:** UNIVERSAL 36 · TITANS · INSIDERS / INSIDER.IA · GITA.IA · SEVA · SEVA CRM · SYNAPSY · KKUBERA · URBAN ONE · Maps Europa · SEVA public  
**Lifecycle:** BUILD → VERIFY → RELEASE → SCALE  
**Status:** BUILD specification and integration index. This file is not evidence that listed services are deployed or production-ready.

## 1. Product integration contract

SUPER.AI is the shared experience and control plane. It does not collapse the products into one undifferentiated database or permission domain.

| Product | Bounded responsibility | Required integration |
|---|---|---|
| UNIVERSAL 36 | Executive home, module discovery, global navigation and status | Canonical entry point and role-aware module directory |
| TITANS Enterprise Studio | Governance, partner onboarding, approvals, policy and audit | Orchestration and policy control plane |
| INSIDERS / INSIDER.IA | Finance, analytics, KPI, reconciliation and executive insights | Source-backed metric and financial evidence plane |
| GITA.IA | Agent and skill runtime | Signed registry, scoped tools, sandbox, approval and audit |
| SEVA Unified Studio | AI services, commerce, content and partner workflows | Provider-specific service runtime and entitlements |
| SEVA CRM | Customer/account/contact and commercial workflows | Tenant-scoped CRM with consent and connector lineage |
| SYNAPSY | Identity/service hub and workflow coordination | Explicit account linking and service permissions |
| KKUBERA Discovery | Property, stays, matching, visits and marketplace | Authorized inventory, source provenance and visit/payment lifecycle |
| URBAN ONE Workspace | Enterprise, hospitality, property and operations | Domain workspaces and mobile parity |
| Maps Europa | Geospatial and public European data discovery | Source/license/coverage/freshness contracts |
| SEVA public | Public-facing site and service entry | Separate public trust boundary; no admin/session leakage |

## 2. Non-negotiable architecture

1. **PostgreSQL persistent data plane:** provision a durable PostgreSQL service; TLS; connection pooling; encrypted backups; restore and point-in-time recovery; environment separation.
2. **Versioned migrations:** ordered migration IDs, checksums, advisory lock, transactional application where supported, schema ledger, forward-fix/rollback policy and repeatable CI tests. No destructive migration without backup and recovery evidence.
3. **Tenant isolation:** derive tenant and actor from server-side identity; enforce row-level security or equivalent ownership predicates at every read/write; test two synthetic tenants and cross-tenant denial.
4. **IAM:** SSO/MFA where supported, RBAC/ABAC, least privilege, service identities, scoped tokens, rotation, session expiry/revocation and access review.
5. **Instance Manager:** durable transactional registry; unique (tenant_id, idempotency_key); distributed idempotency; atomic quota reservation; recovery of in-flight provisioning; real authenticated API; isolated provider adapter; provider receipts; cleanup/compensation; health and cost evidence.
6. **Agent runtime:** signed, versioned agent/skill manifests; owner, tools, scopes, input/output schema, data classification, budget, environment, risk tier, approval gate, audit destination and kill switch. No agent inherits user permissions.
7. **Workflow engine:** durable state machine, correlation IDs, retries/backoff, cancellation, dead-letter queue, idempotency, compensating actions and immutable audit events.
8. **Billing and entitlements:** plan/catalog versioning; customer-initiated checkout; signed webhook; idempotent ledger; payment/refund/dispute states; entitlement grant/revoke; invoice/tax records as applicable; settlement and payout reconciliation. A payment link is not an automated entitlement.
9. **Connector platform:** provider identity, OAuth scopes, consent/purpose, token vault and rotation, webhook signature, rate limits, retry/DLQ, sync cursor, source lineage, health and revocation. Read-only by default.
10. **Observability/SRE:** structured logs, metrics, traces, audit, SLO/SLI, alerts, incident response, cost controls, backup monitoring, restore drills and tested rollback.
11. **Experience plane:** canonical navigation across all named workspaces; consistent TITANS/UNIVERSAL 36 design system; responsive Web/Mobile; keyboard and screen-reader access; reduced motion; clear environment and evidence labels.
12. **Release plane:** exact-SHA CI, secret scan, dependency/SBOM review, threat model, API/browser/mobile tests, physical device test, provider acceptance, canary, rollback and human authorization.

## 3. Evidence-based gaps at the 2026-11-22 baseline

| Area | Verified baseline | Gap to close |
|---|---|---|
| Instance Manager UI | Shared page and launchers present in 12 web workspaces | Link all product navigation and verify all mobile mirrors |
| Instance Manager API | Standalone SEVA API exists; API routes return HTTP 404 on the two inspected Vercel projects | Host durable authenticated API on an approved backend |
| Instance persistence | Core defaults to in-memory Map; sandbox adapter is in-process simulation | PostgreSQL store, distributed idempotency, quotas and recovery |
| Provider execution | Simulation only; no cloud/container resources created | Non-production real provider adapter and conformance tests |
| Database | SEVA local SQLite store and base SQL schema exist | Shared PostgreSQL service, tenant RLS, migrations and restore evidence |
| Migrations | SQL schema and individual migrations exist | Unified migration runner, ledger, lock, rollback and CI drift checks |
| Identity | SEVA session authentication and tenant-scoped instance logic exist | Platform IAM/SSO/MFA and consistent authorization across all apps |
| Agentic orchestration | Architecture blueprint and TITANS command-center components exist | Durable runtime, signed registry, tool execution boundary and observability |
| CRM | SEVA CRM UI and tests exist | Live connector scopes, customer record ownership and end-to-end workflow evidence |
| Finance / INSIDERS | Financial Insights simulation and financial control specifications exist | Source-connected data, verified metric lineage, ledger reconciliation and Power BI refresh |
| Payments | Stripe LIVE service links exist for separately agreed services | Checkout → signed webhook → ledger → entitlement → refund/dispute → settlement proof |
| E-commerce | Shopify/WooCommerce code and integration scaffolds exist | Real store authorization, test order, refund, stock and payout reconciliation |
| Affiliate / creator | Affiliate application/ledger scaffolds exist | Approved publisher accounts, attributed eligible conversions and payout proof |
| Maps / EU data | Public discovery entry points exist | Per-source license, coverage, attribution, freshness and API verification |
| Web/Mobile | Shared CSS and workspace pages exist | Complete route matrix, accessibility, browser, Android API 24/36 and physical-device parity |
| Public SEVA | Separate public site exists | Verify public/internal separation, current content and operational monitoring |

## 4. Delivery epics and acceptance criteria

### E0 — Canonical product registry and navigation
- Registry lists every product, canonical URL, owner, environment, status and evidence timestamp.
- Every workspace can navigate to SUPER.AI and every other authorized workspace.
- No dead links, duplicate identity labels or accidental public/admin session sharing.
- Automated route test covers Web and Mobile.

### E1 — PostgreSQL foundation and migrations
- PostgreSQL service is provisioned only in an approved environment.
- Migration runner applies each migration once and records ID/checksum.
- Concurrent runners serialize safely.
- Failed migration leaves a recoverable schema state.
- Backup restore test succeeds against a disposable database.
- Two-tenant isolation test passes under application and database policy.

### E2 — IAM and policy
- Authenticated user, tenant, role, purpose and scopes are server-derived.
- Deny-by-default authorization applies to every endpoint.
- Cross-tenant list/get/update/delete attempts fail.
- Session expiry, revocation and secret rotation are tested.
- Privileged operations emit immutable audit events.

### E3 — Durable Instance Manager
- Replace process-local Map with transactional PostgreSQL repository.
- Enforce unique tenant/idempotency key and atomic tenant quota.
- Recover provisioning after process restart.
- Deploy API with health/readiness checks and authenticated endpoints.
- Sandbox provider create/health/stop/delete passes end-to-end with receipts.
- Provider cleanup and compensation are proven; no UI action is enabled before backend verification.

### E4 — TITANS / GITA.IA
- Signed agent and skill manifests are versioned.
- Tool allowlists and scopes are enforced server-side.
- Runtime is isolated per tenant/environment with time, token and cost budgets.
- High-impact actions require a human approval receipt.
- Retry, cancellation, replay protection, audit and kill switch pass tests.

### E5 — SaaS billing, commerce and entitlements
- Product/plan catalog is versioned and mapped to tenant entitlements.
- Webhook signature and event idempotency are tested.
- Payment, refund, dispute, cancellation and failed-payment state transitions are reconciled.
- Access is granted only from verified server-side payment events and revoked according to policy.
- Creator/affiliate payouts remain disabled until contracts, eligibility, balance and settlement evidence are verified.

### E6 — INSIDERS, CRM and BI
- KPI definitions have owner, formula, grain, denominator, eligibility and source.
- Data import has consent/purpose, validation, deduplication and lineage.
- CRM read/write permissions are tested independently.
- Power BI dataset refresh is proven against an authorized tenant.
- Finance ledger reconciles gross, tax, fees, refunds, disputes, net and settlement by currency and reporting window.

### E7 — Domain provider integrations
- Each connector has separate DISCOVERED / AUTHORIZED / CONFIGURED / TESTED / VERIFIED / RELEASED states.
- Provider terms, scopes, credentials, webhook and data retention are recorded.
- A successful API read is not interpreted as end-to-end transactional readiness.
- Affiliate, advertising, commerce, payments and banking integrations remain separate products and permissions.

### E8 — Production reliability and user experience
- Web route smoke and accessibility checks cover all workspaces.
- Mobile WebView checks pass API 24 and API 36, followed by physical-device acceptance.
- Monitoring, incident alerts, support runbooks, backup and restore are operational.
- Canary and rollback are tested.
- Release approval is recorded separately from CI success.

## 5. Current priority order

1. Create the canonical SUPER.AI navigation and status surface.
2. Establish PostgreSQL + migration + restore foundation.
3. Implement tenant-safe persistent Instance Manager API and deploy it to an approved backend.
4. Implement IAM and shared policy enforcement.
5. Build the TITANS/GITA.IA governed agent runtime.
6. Complete billing/entitlements and transaction reconciliation.
7. Connect INSIDERS/CRM/Power BI and commerce providers one by one.
8. Complete all route, browser, mobile and physical-device verification.
9. Release only after evidence and explicit human authorization.

## 6. Safety and release boundary

- BUILD changes may be committed to an isolated feature branch and reviewed by PR.
- VERIFY must use synthetic data until specific external data access is authorized.
- Do not write to production customer records, rotate/revoke credentials, alter provider settings, initiate payments, send campaigns, create cloud resources or transfer personal data as part of unapproved verification.
- RELEASE (merge, production deployment, public rollout, live payment activation) requires explicit human approval.
- No status is marked PASS without reproducible evidence tied to an exact commit, environment, timestamp and test result.


## 5. BUILD update — PostgreSQL Instance Manager repository

**Implementation added on the SUPER.AI feature branch (2026-11-22):**
- `packages/super-ai/postgres-instance-repository.mjs` provides a pg-compatible, transaction-scoped repository for durable instance creation and tenant-scoped reads.
- Tenant context is set with transaction-local `app.tenant_id`; the actor must have an active membership.
- Provisioning is restricted to `owner`, `admin`, and `operator` roles; read-only roles are denied.
- Per-tenant PostgreSQL advisory transaction lock serializes quota and idempotency decisions across API replicas.
- Request hash mismatch on an existing idempotency key is rejected; matching requests replay the stored response.
- Instance creation, idempotency receipt and append-only audit event are committed in one transaction.
- `tests/super-ai-postgres-instance-repository.test.mjs` adds unit coverage for validation, membership, role authorization, quota guard, idempotency conflict/replay, transaction behavior and audit insertion.

**Verification boundary:** tests have been added to the repository but have not yet been executed in this environment. No PostgreSQL service was provisioned or contacted; no migration was applied; no API route or provider was connected to this repository. This is an implementation component, not production readiness. Next gates: run the full CI suite on the exact branch SHA, add disposable-PostgreSQL integration tests, provision an approved non-production database, apply migrations, and prove two-tenant RLS plus restore/recovery before wiring the API.


### Security hardening follow-up — 2026-11-22

A code review identified that quota and request digest inputs must not be trusted from the request payload. The repository was hardened:
- Tenant quota now comes only from a server-configured `defaultQuota` or injected trusted `resolveQuota({ client, tenantId })`; invalid resolver values fail closed.
- Request digest is computed inside the repository from canonicalized server-validated fields; caller-supplied hashes are ignored.
- Canonical JSON hashing is stable across object key order.
- Added tests for caller quota override attempts, invalid trusted quota results, and canonical hashing.

The new exact-head CI run is pending/in progress. These controls are code-level safeguards, not a substitute for authenticating `actorId` at the API boundary, validating the IAM role mapping, or integration-testing PostgreSQL RLS with separate non-owner database roles.


### API integration gate discovered during VERIFY — 2026-11-22

The current `services/api/server.mjs` invokes `route({method,path,body}, process.env)` without attaching an authenticated principal. `services/api/router.mjs` authorization helpers depend on `req.auth`, which is not populated by this server path. Therefore the PostgreSQL Instance Manager repository is intentionally **not wired into this HTTP router**: accepting `tenantId` or `actorId` from an unauthenticated request would create a tenant-spoofing / privilege-escalation boundary.

Required before API integration:
1. Implement and verify authentication middleware that derives immutable actor and tenant identity from a validated session/token.
2. Resolve tenant membership and scope server-side; never trust actor/tenant identifiers from request JSON.
3. Use a server-controlled module/provider/environment allowlist and trusted quota resolver.
4. Add route-level tests for missing/invalid token, cross-tenant IDOR, insufficient scope, and authenticated create/read.
5. Run PostgreSQL integration tests using separate non-owner application roles with RLS enabled.

Current API integration: **BLOCKED BY AUTHENTICATION PRINCIPAL GAP**. The repository unit tests passing in CI do not close this gate.


### IAM provider discovery — 2026-11-22

**Result: no platform identity provider is selected or configured in the inspected repository. Do not invent one or treat an unrelated integration as the platform IdP.**

Inspected implementation evidence:
- `services/api/server.mjs` parses the request and calls `route({method,path,body}, process.env)`; it does not attach a verified principal.
- `services/api/router.mjs` checks `req.auth.userId` and `req.auth.scopes` in guarded routes, but this request property is not populated by the generic server path.
- `apps/seva-enterprise/core.mjs` contains an application-local SQLite `sessions` table and `fromSession(token)` lookup. This is SEVA-local authentication, with no demonstrated shared tenant-membership or scope authority for the SUPER.AI API. It must not be silently reused across service/database trust boundaries.
- `apps/seva-enterprise/mobile-sync-session.mjs` adapts the SEVA cookie session store; it does not establish a platform-wide OIDC issuer or tenant authority.
- `services/api/pole-store.mjs` has a separate staging-only static token-hash allowlist (`POLE_STAGING_ACTORS_JSON`) with timing-safe hash comparison. It has no tenant-membership/scopes model and is not a suitable general IAM provider.
- Prior SEVA authentication PR #131 and the SUPER.AI settings UI do not supply a provider, issuer, audience, JWKS endpoint, tenant-membership source or verified production session authority.

**Decision:** no verifier has been wired into the general API and no token format/provider has been guessed. This is a fail-closed implementation hold, not a successful IAM integration.

**Required provider contract before integration:**
1. Approved IdP / session authority and exact issuer (or trusted introspection endpoint).
2. API audience/resource identifier and accepted token type.
3. Trusted JWKS URI or introspection authentication mechanism, with rotation/revocation behavior.
4. Immutable subject mapping to an internal user ID.
5. Server-side tenant membership and role/scope lookup, including membership revocation semantics.
6. Staging-only client/test issuer and synthetic users for two separate tenants.
7. Secret/configuration delivery through the approved runtime secret manager; no credentials in Git.

**Implementation and test gate once the authority is identified:**
- Verify signature or introspection result, issuer, audience, expiry/not-before, token type and required subject; fail closed on missing configuration, key lookup failure, invalid token and revoked session.
- Construct `req.auth` only from verified claims plus server-side membership lookup; ignore identity, tenant, role and scope fields from request JSON and untrusted headers.
- Enforce route scopes and tenant ownership on every Instance Manager operation.
- Test missing credentials, malformed/invalid/expired/revoked token, wrong issuer/audience, insufficient scope, inactive membership, cross-tenant list/read/update/delete, and successful same-tenant operations.
- Use synthetic staging tenants A and B and a disposable PostgreSQL instance with RLS and non-owner application roles. No production DB, customer data or live identity-provider writes.

**Current state:** provider discovery COMPLETE (no provider found); real verifier INTEGRATION BLOCKED pending an approved identity authority and its non-production configuration. Existing CI checks do not prove IAM, PostgreSQL tenant isolation or backup/restore.


### Backend HTTP authentication boundary — BUILD update — 2026-11-22

- Refactored the HTTP server into an importable `createApiServer({ env, authenticate })` factory so the HTTP boundary can be tested without starting a production listener.
- The authentication adapter receives request headers/method/path only; it never receives request JSON. The server passes only the adapter's returned principal to the router as `req.auth`.
- The default server entry point intentionally has no IAM adapter configured. Protected routes therefore remain denied; request-body `userId`, `tenantId`, roles or scopes cannot authenticate a caller.
- Adapter exceptions and malformed principal shapes fail closed. Malformed JSON is now rejected with HTTP 400 rather than silently becoming an empty body.
- Added HTTP integration tests for health, body-based identity spoofing denial, a synthetic trusted principal, authentication failure, and malformed JSON.

**Verification boundary:** these are HTTP boundary tests with an injected synthetic adapter, not cryptographic token validation or proof of a production IAM provider. No issuer/audience/JWKS/introspection authority is configured. The PostgreSQL Instance Manager remains unwired and no database, provider or cloud resource was contacted. Next: run CI on this exact commit, choose/configure an approved non-production IdP, implement its verifier and server-side membership resolver, then connect authenticated routes and run disposable PostgreSQL/RLS integration tests.


## 7. Cycle 2 BUILD update — 2026-11-22

### E1 — PostgreSQL foundation
- Migration runner is implemented with up/down pairing, migration ID/name consistency, SHA-256 checks for both directions, applied-source drift detection and one-step latest-only rollback.
- Fake-pool tests cover ordered apply, idempotent replay, migration drift, missing/mismatched rollback files and transaction rollback.
- Dedicated ephemeral PostgreSQL 17 CI integration workflow is added. It tests migrations, non-owner/non-BYPASSRLS application role, two-tenant RLS, membership, quota, idempotency, cross-tenant denial and append-only audit.
- This is not a persistent shared database deployment. The only Render PostgreSQL resource discovered was `seva-dbrelay` (Free, Frankfurt, expires 2026-11-29, no HA, no connection pool, empty IP allowlist); read-only external query was blocked by that allowlist. It is not approved or verified as SUPER.AI's data plane.
- **Status:** BUILD candidate; live integration workflow pending; durable non-production DB, restore/PITR and recovery remain NOT VERIFIED.

### E2 — IAM and policy
- HTTP server's trusted auth adapter boundary remains fail-closed, and client-body identity spoofing is denied.
- No approved platform identity provider, issuer/audience/JWKS or introspection authority is configured.
- **Status:** BLOCKED pending an approved IAM authority and cryptographic verification implementation.

### E3 — Durable Instance Manager
- PostgreSQL repository and schema foundation exist; repository remains disconnected from HTTP routes.
- Instance Manager UI remains fail-closed when authenticated API is absent; no create action is enabled.
- Provider runtime inspected to date is simulation-only.
- **Status:** PARTIAL BUILD; API/IAM/DB/provider end-to-end NOT VERIFIED.

### E5 — Billing and entitlement
- Read-only Stripe LIVE inventory observed 19 products, 23 prices, 14 payment links and 4 enabled webhook registrations.
- TITANS GO ENTERPRISE GLOBAL €10/user one-time lifetime SKU was not found in this inventory; a distinct €5 TITANS/PSD2 manual-service item exists.
- SEVA €50/€500 one-time links are active with manual fulfillment and agreement fields; their explicit methods are card, Stripe Link and Satispay. Automatic tax is disabled on those links.
- An active recurring SEVA Entry €50/month product/price remains in LIVE catalog metadata with checkout disabled/verification pending. This conflicts with the current SEVA one-time service policy and needs commercial reconciliation.
- Webhook registration does not prove event delivery, signature verification, ledger, entitlement, refund or dispute E2E.
- **Status:** LIVE catalog discrepancies identified; no Stripe writes; payment-to-entitlement NOT VERIFIED.

### E8 — Experience and production / FRONT-END-TO-END.IA
- Browser suite expanded to 26 web/mobile routes with same-origin link/anchor checks, keyboard focus, axe-core WCAG checks, mobile viewport overflow, page-error capture, workspace filter/empty-state reset, Maps search interaction and fail-closed Instance Manager checks.
- Added dedicated mobile Maps Europa and SYNAPSY routes and corrected SUPER.AI mobile hub links.
- CI runs the expanded suite against a local PR preview and uploads JSON evidence/screenshots.
- **Status:** BUILD complete for test harness and mobile routes; browser workflow result pending on final exact SHA; production UX/backend parity not yet verified.
