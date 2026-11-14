# SEVA SOVEREIGN ENTERPRISE — Three-version release and financial control register
Date: 2026-11-14 | Source: user-supplied SVAIAM screenshots and SEVA GitHub PR #152
Status: DESIGN + SECURITY SLICE ONLY. NOT A CERTIFIED PRODUCTION RELEASE.

## Executive visual system
Original professional consulting-style visual system; no affiliation with Ernst & Young.
Palette: deep navy #101725, white #FFFFFF, warm gold #D7B85A, slate #627185, accessible contrast. Gold is reserved for decision gates, not for invented success indicators.
Icons: shield-check (policy), network (orchestration), brain-circuit (AI), database (RAG), chart-no-axes-combined (metrics), file-check (evidence).
Navigation: Goals / Operations / Evidence / Finance / Approvals / Releases.
All status cards must show verified timestamp, source and owner; do not use green PASS without a passing check.

## Three orchestrated versions (not three LIVE environments)
| Version | Product surface | Permitted operation | Gate |
| --- | --- | --- | --- |
| V1 CONTROL | Executive command center and 72-node evidence ledger | read-only plans, role-scoped reviews | identity and source evidence |
| V2 INTELLIGENCE | TITANS planning, GMAS, model gateway and governed RAG | offline previews, no external provider calls | dataset rights, model evaluation, tenant isolation |
| V3 COMMERCE | CMS 500 EUR/month, CRM, billing and partner integrations | contract drafts, TEST-only payment flow when separately configured | tax terms, Stripe subscription, signed webhooks, entitlements, refunds, cancellation, privacy |

No automatic agent execution, MLS import, messaging, payouts, purchases, bookings or production deployments.
A plan is not evidence of a provider integration.

## Technical interfaces
FRONTEND -> API -> AUTHENTICATED CONTEXT -> RBAC -> TENANT POLICY -> PLAN/READ -> AUDIT -> HUMAN REVIEW.
Model provider registry: version, region, data-retention terms, cost, model capabilities, evaluation results, credentials present? Do not record secrets.
RAG: provenance, lawful basis, document ACL, tenantId, index partition, retrieval filtering, citations and deletion policy.
MLOps: dataset rights, versioned splits, baseline, evaluation, drift, rollback, approval.
Agent workflows: goalId, tenantId, correlationId, permissions, tool allowlist, stage, approval state, evidence URI and immutable execution receipt (not yet implemented).
Audit: persist append-only with server-generated identity, signed integrity and retention policy (NOT IMPLEMENTED).

## Economic/financial improvements — hypotheses, not achieved savings
Metrics to instrument:
- cost per approved AI task = (inference + infrastructure + review + tooling costs) / approved tasks;
- contribution margin per paid CMS account = net recognized revenue - variable service and processing costs;
- MRR = sum of active recurring subscription net prices (exclude one-time sales and unpaid links);
- churn = lost customers / customers at period start; refunds and VAT tracked separately;
- CAC payback = CAC / monthly gross profit per new customer;
- gross margin = (net revenue - cost of delivery) / net revenue;
- incident cost and rollback time, p95 latency, audit coverage and model drift.
Illustration ONLY: 10 paying CMS accounts at 500 EUR/month = 5,000 EUR gross contractual billings per month before VAT treatment, refunds, processing, labor and infrastructure. This is NOT realized MRR or forecast.

## CMS €500/month commercial forms and requirements
Required fields: customer legal name, business contact, jurisdiction, VAT/tax details, service tier, included hours, SLA, data processing terms, start date, cancellation, invoicing, accepted terms, payment reference, human signature/acceptance.
Do not prefill banking identifiers in public GitHub source. Customer must independently verify beneficiary/payment details in the signed agreement.
WordPress published offer: https://zerounocms.wordpress.com/seva-cms-enterprise-500-mese/
Stripe CMS recurring product, recurring price, signed webhook, entitlement mapping, portal, refunds and cancellations: NOT VERIFIED.
Never infer recurring payment activation from a one-time 500 EUR link or bank-transfer instructions.

## Release checklist
- [x] New SVAIAM isolated policy adapter, deny-by-default, planning-only
- [x] SVAIAM dedicated GitHub workflow success on PR #152
- [x] SEVA Enterprise Phases II–III workflow success on PR #152
- [ ] General CI green (observed FAIL 2026-11-14)
- [ ] Authenticated RBAC integration and adversarial runtime E2E
- [ ] PostgreSQL tenant RLS and cross-tenant denial evidence
- [ ] Persistent, protected, independently verified audit
- [ ] Model/RAG provider security and residency checks
- [ ] Backup restore, rollback, SLO/monitoring and incident drills
- [ ] CMS recurring checkout and signed webhook E2E in TEST
- [ ] Explicit release authorization after all checks
NO-GO for LIVE until these conditions pass.
