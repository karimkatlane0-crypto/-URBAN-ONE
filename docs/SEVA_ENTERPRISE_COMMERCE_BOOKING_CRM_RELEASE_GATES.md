# SEVA UNICO ENTERPRISE — Commerce, Booking, CRM and Agentic UX
Date: 2026-11-13
Status: IMPLEMENTATION SPECIFICATION / NOT PRODUCTION CERTIFIED
PR: #147
Primary site: https://seva.karimkatlane0.chatgpt.site/app?section=home

## Goal
One accessible portal with name-based search, CRM, bookings, payments, commissions, and human-supervised TITANS agents. The product must not imply it uses ChatGPT/OpenAI's internal billing or that a provider integration is active without authorization.

## Unified transaction and event flow
FRONTEND -> API -> BACKEND -> DATABASE -> EVENTO -> FOLLOW-UP -> AUDIT.
Every action: flow_id, tenant_id, actor_id, consent_ref, idempotency_key, environment (TEST/LIVE), provider, request_id, timestamp, result, audit_ref. No sensitive payment details or API secrets in logs.

## Prioritized acceptance criteria
1. Identity and tenant isolation: authenticated ownership checks on all customer, subscription, booking, and CRM endpoints; negative cross-tenant tests.
2. Name search: permission-scoped contact/company/property/catalog search, source attribution, deduplication, privacy/erasure controls. Do not scrape private directories or import contacts without a lawful basis.
3. Checkout TEST: server-side Stripe price allowlist; Checkout Session creation only for authenticated customers; success page must not grant access without a verified signed webhook.
4. Billing lifecycle: signed webhook, event deduplication, durable subscription ledger, renewal/cancellation/refund and entitlement reconciliation; Customer Portal session only for the authenticated owner.
5. Markup/commissions: explicit fee policy, tax handling, provider contractual permissions, refund reversal, and ledger reconciliation; no hidden charges.
6. Booking: partner-authorized inventory and availability, quote/hold/confirm/cancel, clear fees and cancellation rules; never assert confirmed reservations without provider confirmation.
7. CRM communications: opt-in and purpose limitation; Skebby and WhatsApp Business approved credentials, templates and delivery callbacks; STOP/unsubscribe and audit.
8. TITANS: plan/preview first; execute fail-closed, human approval for payments, outbound messages and bookings; scoped capabilities, budgets and rate limits.
9. MLOps: authorized dataset, model registry, reproducible evaluation, drift monitoring and rollback. No model declared LIVE from a passing unit test alone.
10. Reversible migration: export/import dry run, mapping and checksums, backup/restore, tenant-scoped rollback and data retention controls.
11. UX/accessibility: keyboard, screen-reader labels, clear progress/error states, mobile-first search and one-click navigation; explicit confirmation before financial actions.
12. DevSecOps: contract tests, SAST/dependency and secret scanning, CI evidence, staging smoke tests, signed artifact provenance, release approval and rollback drill.

## Release decision matrix
- BUILD: code, schemas, tests and documentation committed to PR.
- VERIFY: CI on exact head SHA + provider TEST E2E + negative auth tests + backup/restore evidence.
- REVIEW: independent review of code, privacy, payments and provider contracts.
- MERGE: only after required checks and approvals.
- RELEASE: authorized staging first; LIVE requires separate approval and observed end-to-end evidence.
Default: NO-GO for autonomous agent execution, Kubernetes production, outbound mass messaging, Stripe LIVE and real bookings.

## Evidence per Enterprise control
node_id | flow_id | frontend_path | api_route | backend_path | database_table | event_type | follow_up | audit_event | commit_sha | test_name | ci_run_url | provider_e2e_evidence | tenant | environment | owner | dependency | status | reviewed_at

Existing 72 named nodes remain NOT VERIFIED until evidenced. The additional 82 must be discovered and deduplicated, not invented.
