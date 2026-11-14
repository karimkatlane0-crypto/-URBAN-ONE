# SEVA UNICO ENTERPRISE — Mobile CRM release-gate evidence (2026-11-14)

Status: BUILD PRESENT / GENERAL CI PASS ON EARLIER COMMIT / PRODUCTION NO-GO.

## Observed evidence
- PR #155: mobile CRM four-route dry-run adapter, now closed; module present on main.
- Adapter source: `apps/seva-enterprise/mobile-crm-sovereign.mjs`.
- Contract: `apps/seva-enterprise/docs/MOBILE-CRM-SOVEREIGN-FOUR-ENDPOINTS.md`.
- Test source: `tests/seva-mobile-crm-sovereign.test.mjs`.
- CI run 43560835622 SUCCESS on commit d56a36e277c2e4de052adbf079d40e8918c8a8cd; Android run 43560835693 SUCCESS on same commit.
- Issue #153 remains OPEN. This is a dated CI result, not a claim that all current main branch runtime and provider gates passed.
- User-provided `SEVA_Sovereign_Manifest.json`: isolated security starter reports seven local Node tests; `production_release: NO-GO`. Not evidence of the whole repository.

## Four endpoint boundaries (current code)
1. GET /api/mobile-crm/v1/status — authorized capability status only.
2. POST /api/mobile-crm/v1/imports/preview — descriptor validation, acceptedRecords=0, persisted=false.
3. POST /api/mobile-crm/v1/sync/plan — plan only, writes=0.
4. GET /api/mobile-crm/v1/audit — HTTP 503 without durable audit.

This adapter is not wired to a certified public identity/DB runtime. Do not treat `verifiedContext` as a trusted client assertion.

## Required acceptance checklist (all pending direct verification)
- [ ] Production OIDC/JWKS verification including issuer, audience, expiry and revocation; tenant derived server-side.
- [ ] RBAC denied by default with explicit resource-level grants and adversarial cross-tenant tests.
- [ ] PostgreSQL RLS at database layer for all CRM/KKUBERA/partner tables, verified under actual application roles.
- [ ] Signed/tamper-evident persisted audit with readback, retention and recovery tests; fail closed if unavailable.
- [ ] Source-level legal authorization, consent metadata, purpose limitation, data minimization, revocable mappings and per-tenant deletion/export.
- [ ] Android/iOS/Web encrypted store, authenticated sync, conflict/idempotency tests and lost-device revocation.
- [ ] Restore drill, RPO/RTO, rollback rehearsal, migrations and evidence capture.
- [ ] Stripe TEST: checkout → signed webhook → entitlement → cancellation/refund and no duplicate charge. LIVE payments remain disabled unless separately certified.
- [ ] Booking.com, WhatsApp, Meta, Skebby and affiliate integration: provider-specific agreements, permissions and test callbacks; no broad data extraction or broadcasts.
- [ ] Same-head-SHA green CI, security scanning, staging end-to-end and explicit owner-approved release decision.

## Authorization constraints
Only import customer, contact or device data the organization is lawfully permitted to process. The user's broad verbal authorization does not confer permission over third-party CRM data or mobile phones.
No indiscriminate global phone access, cloning private messages, mass contact scraping or automated unsolicited outreach.

## Reconciliation
Map these gates into the 72-node register, with each node's module path, evidence URL, hash, verified date and owner. Keep NOT VERIFIED until an independently observable test completes.
