# European Super App — production readiness and scientific-grade service blueprint

**Snapshot:** 2026-11-26  
**Programme:** OMNIA — TITANS, SEVA, SYNAPSY, KKUBERA, URBAN ONE, INSIGHTS.ai  
**Geography:** EU-27 first; UK/CH separate legal and data adapters  
**Status:** implementation and release blueprint; not a production certification or evidence of all services operating.

## 1. Mission and benchmark boundary

Build a coherent European super-app that unifies public and licensed data discovery, geospatial intelligence, commerce, workflow automation, analytics and approved AI agents. Use NASA/ESA/SOHO as engineering references for scientific data stewardship, mission-grade provenance, long-lived archives, instrument/source metadata, calibrated data products, operational status and reproducible research workflows.

Do not claim to be better than NASA, ESA or SOHO as institutions or missions. A super-app is not a solar observatory and cannot replace spacecraft, instruments, mission operations, calibration teams or scientific validation. The measurable goal is to make selected user workflows more accessible and integrated while meeting explicit reliability, quality, security and scientific reproducibility targets.

SOHO is a joint ESA/NASA mission with 12 instruments and a long-running solar observation archive. Its data access and processing history illustrate why raw, calibrated and derived products, instrument status, provenance and publication/data-rights policies must remain distinct. Use this as a data-governance pattern, not as a claim of equivalent capability.

## 2. Product service map

| Service domain | Intended capability | Production acceptance evidence |
|---|---|---|
| Identity and access | OIDC/OAuth, MFA, tenant and role isolation, consent, sessions, recovery | External auth E2E, negative authorization tests, key rotation, audit trail |
| Universal workspace | Single navigation, service catalogue, account, notifications, accessibility, localization | Web/mobile parity, route coverage, accessibility and device tests |
| TITANS agents | Agent orchestration, human approvals, scoped tools, audit and revocation | Isolated runtime, signed manifests, sandbox, tool allowlists, abuse tests, kill switch |
| SEVA commerce | Product/service catalogues, affiliates, orders, entitlements, creator attribution | Provider sandbox/live evidence, idempotent webhooks, reconciled order-to-entitlement |
| SYNAPSY | Private workspace, webhook integrations, workflow execution | Required secrets, signed webhook, durable queue, retries, replay protection, audit |
| KKUBERA | Property discovery, GIS, listing and appointment workflows | Authorized source licences, current listings, payment/booking lifecycle, privacy and route verification |
| INSIGHTS.ai | KPI, finance, CRM, marketing and product analytics | Metric definitions, source lineage, reconciliation, row-level access, freshness and accuracy |
| EU INSPIRE / Maps | 34 INSPIRE themes, EU-27 catalogues, country adapters, GIS and public services | Dataset metadata, licence/purpose gate, CRS/geometry validation, provenance, country coverage |
| Scientific data studio | Astronomy/solar/earth-observation archives, instrument catalogues, calibrated data and notebooks | Provider API terms, product level, calibration/version metadata, citation and reproducible pipeline |
| Notifications and broadcast | User alerts, localization and approved campaigns | Consent/suppression, audience authorization, send approval, provider receipt |
| Payments and finance | Checkout, manual transfer reconciliation, billing, refunds, tax and entitlements | Payment-provider E2E, verified settlement, immutable ledger, refund/reversal and reconciliation tests |
| Mobile and offline | Android/iOS, secure local storage, sync, accessibility | Signed release artifact, physical-device matrix, offline/online conflict tests, store acceptance |
| Developer ecosystem | API, webhooks, SDK, partner skills and app connectors | Versioned OpenAPI, auth scopes, sandbox certification, rate/cost limits, revocation and audit |

## 3. Shared platform architecture

Clients (Web / Android / iOS) → Edge/API Gateway → Identity & Policy → Domain Services → Event/Job Bus → PostgreSQL + PostGIS + Object Store + Search/Vector Index → Observability / Audit / Evidence

Required boundaries:
- Each product is a separately permissioned tenant/domain; shared navigation does not mean shared data or entitlements.
- Server derives identity, tenant, purpose and permissions. Never trust client-supplied tenant/user IDs.
- PostgreSQL is the system of record for transactional state; PostGIS for spatial state; object storage for immutable source artefacts and evidence; search/vector indexes are derived and rebuildable.
- All schema changes are versioned migrations. Every service has health/readiness checks, backup, restore, retention, RPO/RTO, incident owner and rollback plan.
- Events are versioned, idempotent, replay-protected and dead-lettered. External side effects require an approval policy and durable audit receipt.
- AI retrieval enforces access and licence filters before ranking/context construction. Model output is never authoritative for legal, payment, ownership, occupancy, live availability or safety state.
- Observability covers traces, metrics, structured logs, SLOs, alert routing, cost and provider quota. Do not log secrets or unnecessary personal data.

## 4. Scientific and space-data workbench

Build an opt-in, source-attributed scientific-data module, not a simulated mission-control service.

Initial source candidates (each requires terms/API verification before ingestion):
- SOHO archives: NASA/GSFC and ESA/ESAC archive routes; instrument-level update status.
- ESA Science Archives and mission catalogues.
- NASA Planetary Data System / Space Science Data Coordinated Archive where relevant.
- Copernicus Data Space / Sentinel and other EU earth-observation catalogues.
- EUMETSAT and ECMWF datasets only under their actual access and licence terms.

Every scientific dataset must include mission, instrument, product identifier, observation time, reception time, processing level, calibration version, coordinate/time reference, quality flags, provenance, citation, rights, update cadence and known gaps. Keep raw, calibrated, derived and model-generated products separate. Preserve original checksums and immutable source references. Never label delayed archive data as real-time.

Scientific workflows require versioned notebooks/pipelines, environment lockfiles, parameter records, dataset snapshots, reproducible outputs, peer review for consequential findings and uncertainty reporting. Any forecast must be labelled with model version, initialization time, valid time, confidence/uncertainty and source data cutoff.

## 5. Production DevSecOps gates

**G0 Inventory:** repositories, services, domains, providers, data owners, secrets, environments and dependencies are enumerated.

**G1 Build:** deterministic builds, pinned runtimes/dependencies, migrations, SBOM, provenance and secret scanning.

**G2 Verify:** exact-head CI, unit/integration/E2E, browser and physical-device tests, SAST/DAST/dependency scans, API authorization, tenant isolation, backup/restore, payment and webhook tests.

**G3 Stage:** production-like staging, synthetic tenants, provider sandboxes, load/chaos tests, observability and incident/rollback rehearsal.

**G4 Release:** explicit approver, signed immutable artifact, reviewed change set, migration compatibility, staged rollout, health gates and rollback owner.

**G5 Operate:** SLOs, alert response, cost limits, vulnerability patching, restore drills, access recertification, data retention and incident postmortems.

No release is permitted if a gate is missing, stale, attached to another commit, or based only on a passing unit-test suite.

## 6. Current verified snapshot — 2026-11-26

| Component | Evidence observed | Status / blocker |
|---|---|---|
| EU INSPIRE inventory | EU-27 × 34 = 918 assessment cells created; all initialized NOT_ASSESSED | BUILD scaffold; source/licence coverage not verified |
| OMNIA PR #265 | Draft PR; exact head 54257d2433eef6830ee2b463aa08008d52f56b0b; CI run 45737638307 completed success | Documentation only; no app code or service deployment |
| TITANS PR #224 | CI evidence recorded for head 3df84b217e44123d29d708a6f6218f388b3c123b; GitHub reports mergeable false | BLOCKED from merge; staging actors/runtime and production controls remain unverified |
| SUPER.AI / INSIGHTS / Global PR #250 | CI, browser and PostgreSQL evidence recorded for head b90538fd4d1050e7eb4149c7a1bf017396c34b9e | BLOCKED from merge; GitHub reports mergeable false; hosted/provider E2E open |
| Pages publication gate PR #266 | Draft PR changes automatic Pages publishing to manual dispatch with explicit boolean authorization | Not merged; publication remains gated |
| KKUBERA Vercel | Production deployment READY on old commit 13c2903bfd249a144b595f36e4fc5e077e274236; newer preview READY on 929dd2e952e41e8a682d716e9245638d15d44755; project reports live=false, SSO protection enabled | NOT PRODUCTION-VERIFIED; preview is not production; no new deploy performed |
| Render services | Workspace selection required before listing services; workspace shown as Karím's workspace, ID tea-dbdq2tlg1s2s73amsm90 | UNVERIFIED in this run; no service/database mutation |
| SEVA database relay | Prior verification found empty IP allowlist and blocked DB connectivity; Free DB nearing expiry | BLOCKED pending authorized network and persistence work |
| SEVA payments | Live checkout-to-entitlement lifecycle not proven; payment method availability previously inconsistent | BLOCKED pending end-to-end test and reconciliation |
| SYNAPSY | SYNAPSY_WEBHOOK_SECRET previously missing | BLOCKED until secret is configured and webhook replay/signature tests pass |
| HubSpot CRM | CRM writes previously unavailable due connector permission | BLOCKED; no writes attempted |
| Android / Play | App release gates remain open; no Play Console production publication proof | NOT RELEASED |

This snapshot is intentionally conservative. Recheck each provider and commit before making a new release decision; previous CI evidence does not certify a later head.

## 7. Release acceptance scorecard

Minimum proposed production targets (targets, not achieved results):
- Availability: service-specific SLO and error budget defined; initial target 99.9% monthly for critical APIs after load evidence.
- Security: zero known critical/high exploitable findings at release; zero cross-tenant leakage in negative tests.
- Data: 100% of published records carry source, licence/purpose, timestamp and provenance; stale data is visibly labelled.
- Payments: every completed charge/transfer reconciles to exactly one order and entitlement; zero duplicate grants.
- AI: 100% of answers with factual claims expose source lineage where applicable; uncertain or unsupported claims are marked.
- Recovery: tested backup restore meets approved RPO/RTO; no production launch without a restore receipt.
- Mobile: signed artifacts, supported-device matrix, accessibility and offline-sync tests pass.
- Operations: alert ownership, on-call route, incident playbook, rollback and kill switch demonstrated.

## 8. Immediate remediation order

1. Confirm the Render workspace before any service inspection; then inventory services, databases, deploys, env-var presence (never reveal values), networking, backups and expiry.
2. Resolve merge conflicts and dirty states on PR #224 and #250; re-run exact-head checks and independent review. Do not merge based solely on CI.
3. Complete PR #265 exact-head verification and source inventory; add one-country, non-personal, redistributable dataset pilot only after licence review.
4. Verify KKUBERA preview routes and auth, then compare against the old production deployment. Production deploy requires a separate release decision after smoke/E2E and SSO/access review.
5. Restore SEVA database connectivity/persistence with approved network access, test restore, and verify checkout → signed webhook → ledger → entitlement → refund/reversal.
6. Configure SYNAPSY webhook secret through the authorized secret manager and test signature, replay, idempotency and failure recovery.
7. Resolve CRM connector permission before any CRM write; run read-only checks first.
8. Finish Android API/device/signing/store gates and confirm Play Console status.
9. Integrate scientific archives one at a time under their own API, terms, citation, calibration and provenance policies.
10. Only after all domain gates pass: staged rollout, production monitoring, rollback rehearsal, signed release evidence and explicit go-live approval.

## 9. Non-goals and prohibited shortcuts

No claims of NASA/ESA certification, mission equivalence, scientific superiority, full EU dataset coverage, 24/7 real-time data, production readiness or universal integration without evidence. No scraping around access controls, no unlicensed republication, no secrets in Git, no inferred payments/entitlements, no cross-tenant data sharing, no public broadcast, no live purchase, no irreversible production action without a verified release decision.

**Release decision at snapshot:** HOLD. The repository contains a production-readiness blueprint and an INSPIRE inventory scaffold; the integrated super-app is not yet proven production-ready.
