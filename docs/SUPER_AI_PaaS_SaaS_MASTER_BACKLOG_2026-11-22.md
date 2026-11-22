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
