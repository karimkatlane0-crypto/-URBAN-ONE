# UNIVERSAL 36 — Orchestration & Intelligence Blueprint

**Baseline:** 20 November 2026  
**Programme:** TITANS × SYNAPSY × SEVA × KKUBERA × URBAN ONE  
**Operating lifecycle:** BUILD → VERIFY → RELEASE → SCALE  
**Status:** Architecture blueprint / BUILD candidate. This document is not evidence of deployed orchestration, provider activation, production MLOps or certification.

## 1. Executive intent

UNIVERSAL 36 is the common executive entry point and orchestration model for one coordinated intelligence ecosystem. The products remain independently governed bounded contexts. Shared navigation, event contracts and policy enforcement do not merge user identities, customer data, credentials, financial ledgers, legal responsibilities or provider accounts.

The quality bar is Tier-1 consulting discipline: clear problem definition, traceable evidence, quantified assumptions, options, risks, accountable owners, implementation gates and measurable outcomes. This is an internal operating standard, not an EY affiliation, endorsement or certification.

## 2. Product and domain map

| Domain | Primary responsibility | Integration boundary |
|---|---|---|
| TITANS | Agentic onboarding, partner lifecycle, skills, policy, approvals and audit | Authenticated actor, purpose, exact scope, expiry, revocation |
| SYNAPSY | Identity/service hub, requests, workflows and account governance | Account linking only after verified identity proof |
| SEVA | Intelligence Studio, AI commerce, creator/partner workflows and digital services | Separate provider credentials, campaign consent and entitlement checks |
| KKUBERA | Matching, marketplace, property and hospitality discovery | Source provenance, availability evidence, paid visit and payment boundaries |
| URBAN ONE | Universal workspace, property, hospitality, B2B and mobile/web products | Product-specific permissions, legal and provider constraints |
| INSIGHTS.AI | KPI, analytics, reporting and Power BI/CRM data products | Read-only by default; source-by-source authorization |
| GMAPS / EU data | Geospatial and European public-data access | Provider terms, license, source timestamp and coverage |

## 3. Target architecture

### 3.1 Experience plane
- Universal 36 homepage: navigation, module discovery, executive status and evidence links.
- Role-aware workspaces: owner, partner, recipient, analyst and operator.
- Accessible responsive web/mobile UI, clear environment labels and visible blockers.
- No credential, consent or payment state is inferred from a page view or a local browser flag.

### 3.2 Orchestration plane
- **TITANS Orchestrator:** task registry, actor context, policy evaluation, routing, retries and cancellation.
- **Approval gate:** explicit human approval for external write/send/share/delete, release, payment and provider actions.
- **Skill registry:** signed, versioned skill manifests with declared tools, scopes, input/output schemas and risk tier.
- **Workflow engine:** durable state transitions, idempotency keys, correlation IDs and compensating actions.
- **Audit plane:** append-only evidence, provenance, actor, environment, decision and timestamps.

A model may propose or prepare an action. It must not silently convert a proposal into a side effect.

### 3.3 Domain and integration plane
- Provider adapters are isolated by product, tenant, environment and purpose.
- OAuth/SSO, webhook signatures, token rotation, rate limits, retry/backoff, dead-letter handling and reconciliation are required before an adapter is marked VERIFIED.
- Every adapter declares NOT_CONNECTED, CONFIGURED, TESTED, VERIFIED or RELEASED, with evidence and last-check time.
- A marketing connection is not a transactional connection; an affiliate publisher account is not an advertising account; a music service is not its advertising API.

### 3.4 Data plane / DLOps
1. Source registration and legal basis.
2. Schema contract and validation.
3. Ingestion with idempotency and immutable source reference.
4. Quality checks: completeness, uniqueness, validity, freshness and reconciliation.
5. Data lineage and dataset versioning.
6. Classification, minimization, retention and deletion policy.
7. Access control by tenant, product, purpose and scope.
8. Encryption, backup, restore drills and disaster recovery.
9. Data observability, drift and incident alerts.

No customer data is used for model training by default. Synthetic test data is preferred until a separately authorized data-use policy is approved.

### 3.5 Model plane / MLOps
1. Model and dataset registry with owner, version, source and license.
2. Reproducible training pipeline and pinned dependencies.
3. Offline evaluation, safety tests and bias/robustness checks appropriate to the use case.
4. Benchmark against a documented baseline.
5. Human review and release approval.
6. Canary deployment, monitoring, rollback and kill switch.
7. Drift, latency, cost, failure and quality monitoring.
8. Model retirement and evidence retention.

A model artifact, notebook, mock provider or local emulator is not a deployed model service. Production inference requires an authenticated runtime, quota, observability, security review and rollback path.

## 4. Agentic onboarding, partner and skill lifecycle

1. Create a specific request for a named recipient.
2. Authenticate both actors from server-owned identity context.
3. Show purpose, requested scopes, data categories, expiry and consequences.
4. Recipient chooses ACCEPT or DECLINE.
5. ACCEPT records only the requested grant; DECLINE records no grant.
6. Persist the receipt and audit reference.
7. Enforce the grant at every downstream point of use.
8. Allow recipient revocation and propagate it to all dependent adapters.
9. Sandbox partner skills and test least-privilege tool access.
10. Publish a signed skill version only after independent tests and human approval.
11. Monitor usage, errors, costs and scope changes; suspend or revoke when required.

The current TITANS request API/SQLite implementation is a staging candidate. It is not a production identity provider. Its grant record does not yet enforce provider access unless the downstream adapter checks it.

## 5. Reconciliation and financial controls

TEST sequence:
- ingest synthetic source event;
- validate signature/provenance in the test adapter;
- deduplicate using stable event and idempotency keys;
- post balanced ledger entries;
- reconcile expected vs observed state;
- process refund/chargeback simulations;
- verify audit chain and replay behavior;
- test recovery and duplicate delivery;
- export evidence.

LIVE is a separate environment and requires provider certification, legal approval, security review, backup/restore, human release authorization and a verified rollback plan. A payment link alone does not prove payment-to-entitlement automation.

## 6. Executive advisory workbench

The advisory workbench should generate evidence-backed work products across:
- strategy and market sizing;
- customer and competitor research;
- product and service design;
- technology architecture and integration;
- data strategy, BI and KPI governance;
- AI/ML model evaluation;
- finance, unit economics and reconciliation;
- operations, service quality and delivery;
- security, privacy and regulatory readiness;
- partner and go-to-market planning.

Each output records source, date, assumptions, uncertainty, owner, decision requested and next verification. Recommendations must distinguish facts from estimates and scenarios.

## 7. Canonical event envelope

Cross-domain events should carry a stable envelope. Payload fields remain product-specific.

~~~json
{
  "eventId": "uuid",
  "eventType": "domain.action.v1",
  "tenantId": "server-derived-tenant",
  "actorId": "server-derived-actor",
  "product": "titans|synapsy|seva|kkubera|urban-one",
  "purpose": "allowlisted-purpose",
  "scopes": ["exact:scope"],
  "environment": "TEST|STAGING|LIVE",
  "occurredAt": "ISO-8601",
  "traceId": "correlation-id",
  "idempotencyKey": "stable-key",
  "sourceRef": "source-or-provider-reference",
  "payloadHash": "sha256",
  "consentReceiptRef": "optional-receipt-id"
}
~~~

tenantId, actorId, environment and consent reference must be resolved or validated server-side. Never trust client-supplied identity or tenant fields.

## 8. Evidence-based baseline and open gates

| Workstream | Latest known evidence | Status |
|---|---|---|
| TITANS policy + staging request ledger/API/UI | PR #224 CI run 44755885679 success; API/UI tests pass | BUILD PASS · hosted staging VERIFY pending |
| Universal 36 homepage | PR #225 CI run 44754867625 success; tests, verify and evidence pass | BUILD PASS · browser/visual acceptance pending |
| TEST reconciliation | PR #219 CI and browser run pass; Android API 24 pass | VERIFY PARTIAL |
| Android API 36 | PR #219 run 44663035422 failed with WebView evaluation timeout | BLOCKED · corrective diagnostic patch awaiting rerun |
| Supermetrics sources | GA4, Ads, HubSpot, Amazon Ads/Seller Central, Awin and Spotify Ads not connected | AUTHORIZATION PENDING |
| Power BI / CRM | import/query assets exist; cloud refresh and live connector not verified | VERIFY PENDING |
| AI provider runtime | prior authenticated generation returned quota exhaustion; no fresh live provider proof | NOT VERIFIED |
| MLOps cluster / DLOps production pipeline | architecture/scaffolds exist; no production cluster or model deployment proof | NOT DEPLOYED |
| Booking / affiliate / payment automation | account approvals and end-to-end conversion remain separate gates | NOT VERIFIED |

Evidence is commit-specific. A passing CI run does not certify a public deployment, physical device, external provider, legal compliance or production service.

## 9. Risk register and controls

| Risk | Control | Release evidence required |
|---|---|---|
| Cross-tenant disclosure | Server-derived identity, ownership checks and synthetic two-tenant tests | Browser/API isolation tests |
| Overbroad consent | Allowlisted purpose and scopes, recipient decision, expiry and revocation | Receipt and replay tests |
| Grant not enforced downstream | Point-of-use policy check in each adapter | Adapter contract and denial tests |
| SQLite staging mistaken for production | Explicit staging label; backup/restore and production DB decision | Recovery and security review |
| Provider token leakage | Secret manager, hash-only actor token records, rotation and least privilege | Secret scan and rotation test |
| Reconciliation double-post | Idempotency, unique source keys and atomic transactions | Duplicate/replay/refund test suite |
| Model/data quality drift | Dataset lineage, evaluation, drift monitors and rollback | Evaluation report and monitoring evidence |
| Unverified mobile compatibility | API 24/36 plus physical-device acceptance | Fresh emulator and device runs |
| False release claim | Separate BUILD/VERIFY/RELEASE gates and human authorization | Signed release checklist |

## 10. Delivery sequence

**P0 — complete BUILD candidates**
- Universal 36 canonical homepage.
- TITANS staging request API, ledger and private inbox UI.
- Preserve product-specific repositories and access boundaries.

**P1 — verify staging**
- Configure authorized synthetic actors and persistent staging database.
- Run hosted two-account browser E2E, expiry, replay, revocation and recovery tests.
- Add downstream grant enforcement.
- Resolve Android API 36 WebView timeout and run API 24/36 again.
- Verify mobile and web accessibility.

**P2 — integrate**
- Connect one provider at a time after explicit authorization.
- Build data contracts and read-only Insights pipelines.
- Implement TEST reconciliation and MLOps/DLOps observability.
- Add partner/skill sandbox and signed artifact workflow.

**P3 — release readiness**
- Independent security/privacy review, restore evidence, physical-device test, provider certification, runbook and rollback.
- Obtain explicit human authorization.
- Only then consider release and subsequent scale.

## 11. Non-negotiable governance

- BUILD may proceed in isolated branches when the change is reversible and bounded.
- VERIFY requires fresh, inspectable evidence on the current head.
- RELEASE requires explicit human authorization; no automatic merge or deployment.
- SCALE follows verified release only.
- Every blocker must have an owner, corrective action and evidence.
- TEST and LIVE remain separate.
- One ecosystem means coordinated contracts and orchestration, not pooled identities or unbounded access.

**ONE INTELLIGENCE. ONE ECOSYSTEM. TITANS GO GLOBAL. AD MAIORA SEMPER.**
