# SEVA × KKUBERA — Enterprise integration contract (draft)

Status: BUILD / NOT RELEASED. No production changes or data transfers authorized by this document.

## Boundaries
- KKUBERA source: private `karimkatlane0-crypto/URBAN-ONE` (historical repository name), DBRELAY 2.1.4.
- SEVA source: `karimkatlane0-crypto/-URBAN-ONE/apps/seva-enterprise`.
- Separate databases and credentials; do not copy contacts, listings, or payment records by default.
- Any cross-app transfer requires tenant-scoped authentication, purpose, provenance, consent/legal basis and audit logging.

## Proposed integration
1. Add SEVA connector for KKUBERA read-only property catalog with scoped service credentials and strict schema validation.
2. Add optional CRM import pipeline: CSV/JSON mapping, preview, deduplication, owner authorization, dry-run and rollback.
3. Implement risk scoring as explainable decision support, with source timestamps and human review.
4. Early-access flag only for listings explicitly authorized for pre-publication sharing. Store embargo timestamp and access grants; no guarantee of a 24-hour lead.
5. Keep existing KKUBERA one-time service fees distinct from any future SEVA SaaS subscription. Stripe TEST signed-webhook E2E is mandatory before automated entitlements.
6. Add audit and metrics: ingestion latency, provenance completeness, duplicate rate, alert delivery, lead conversion.

## Release gates
- Automated unit/integration tests PASS, including tenant isolation and negative authorization tests.
- Authorized test feed and import/export fixture with dry-run/rollback PASS.
- Signed Stripe TEST checkout/webhook/idempotency/reconciliation PASS.
- Persistent DB backup and restore PASS; HTTPS and secret management PASS.
- Staging smoke tests PASS; production deployment requires separate approval.
- No scraping of restricted portals, no fabricated listings, no unsupported claim of advance access.

## Current evidence
KKUBERA README and backend/README document offline Android ranking, SQLite DBRELAY and local Stripe fixture tests; cloud AI, live runtime, real-device and end-to-end payment tests are not established. This document does not assert those tests have passed.
