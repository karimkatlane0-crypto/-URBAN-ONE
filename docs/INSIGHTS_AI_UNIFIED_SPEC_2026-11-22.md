# INSIGHTS.ai — Unified Intelligence Specification
Date: 2026-11-22
Repository: karimkatlane0-crypto/-URBAN-ONE
Branch: feat/super-ai-unified-platform-20261122
Lifecycle: BUILD → VERIFY → RELEASE → SCALE

## Product contract
INSIGHTS.ai is the unified analytics and decision-intelligence layer for INSIDERS, SEVA CRM, TITANS, UNIVERSAL 36, GITA.IA, SEVA commerce, SYNAPSY, KKUBERA, URBAN ONE and Maps Europa. It also catalogs ChatGPT/OpenAI/Codex conversations, projects, files, archives, repositories, issues, PRs, workflows and artifacts as candidate knowledge/evidence sources. Catalog inclusion does not imply technical access to private chats, files or archives.

## Unified domains
- Executive scorecard and KPI registry.
- Finance: revenue, cost, margin, cash, budget, forecast, unit economics and ledger reconciliation.
- CRM/customer 360: accounts, contacts, companies, deals, tickets, pipeline, consent and lifecycle.
- Marketing: paid media, web analytics, acquisition, CAC, ROAS and attribution.
- Commerce/payments: orders, checkout, capture, refunds, disputes, tax, fees, net revenue and entitlements.
- Marketplace/affiliate/creator: clicks, eligible conversions, commissions, returns and settled payouts.
- Product/platform: adoption, quality, incidents, API/agent cost, latency, CI, deployments and service health.
- Property/hospitality/geospatial: search, matching, visits, availability, source provenance, coverage and freshness.
- Knowledge/evidence: ChatGPT, OpenAI, Codex, files, archives, GitHub and build artifacts.
- BI: Power BI and governed CSV/API exports.

## Metric contract
Every KPI must declare owner, formula, grain, numerator/denominator, population, eligibility, exclusions, unit, currency, timezone, period, target, source, freshness and transformation version. Separate actual, user-declared, estimated, forecast and demo values. Never render missing data as zero. Never blend currencies without an explicit FX source and timestamp.

## Data and access architecture
- Read-only by default; source-specific OAuth scopes, consent/purpose, tenant and role checks.
- PostgreSQL persistent analytics store with versioned migrations, tenant isolation, lineage and append-only audit.
- Source connectors keep their original systems authoritative; ingestion is explicit, idempotent, rate-limited and observable.
- Validate grain, duplicate keys, nulls, coverage, join cardinality, late-arriving events, refund and settlement consistency.
- Separate CRM reads from writes; no record mutation or audience activation through analytics.
- Power BI dataset/workspace and scheduled refresh must be verified independently; an import package or URL is not proof of cloud refresh.
- ChatGPT/Codex/file archive sources require explicit connector/file permissions and source-level citations; no universal chat archive access is presumed.

## Known verification snapshot
- HubSpot: read access for contacts, companies, deals and tickets; write is not authorized; status last checked 2026-11-20 and must be reverified.
- Supermetrics Meta Ads: one account discovered in the prior check; no data query or audience activation executed.
- Power BI: workspace, dataset and cloud refresh not verified.
- Google Analytics/Search Console: not connected in the prior evidence.
- Stripe: checkout → signed webhook → ledger → entitlement has not been demonstrated end-to-end.
- SEVA native CRM aggregate read exists as a prior claim; authenticated UI/API/database path remains to be verified.
- ChatGPT/OpenAI/Codex and private archives: included in the desired source registry; full access and ingestion are not verified.

## Commercial policy
INSIGHTS.ai is paid. No free plan, free trial or free activation by default. Every module must have a commercially approved price, currency, billing unit, tax treatment and terms displayed before checkout. Block activation if pricing is missing or unapproved. The previously proposed €29/month Financial Insights service remains a separate offer and is not a blanket price for the unified platform.

## Release gates
1. Source inventory and access matrix approved.
2. KPI definitions and owners reviewed.
3. Synthetic data quality and tenant isolation tests pass.
4. PostgreSQL migrations, backup and restore tests pass.
5. Each connector is independently authorized and read-tested.
6. Power BI refresh and reconciliation are proven.
7. Security, audit, privacy, accessibility and mobile parity pass.
8. CI evidence is tied to exact commit and environment.
9. RELEASE remains blocked pending explicit human approval.

## Current status
The Web and Mobile pages are BUILD candidates. No new provider connection, CRM write, personal-data export, payment, production deployment, merge or release is claimed.
