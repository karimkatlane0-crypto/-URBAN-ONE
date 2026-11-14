# SEVA CRM & Operations — candidate build, 14 November 2026

## Scope and immutable payment boundary
Built on main `b89a51e248f785302533c972740f1e3af46ce4ab`, after PR #157 merged at 2026-11-14 06:08:46 UTC. The four `/api/v1/mobile` contracts remain in place. This change is a responsive browser client and operational register, not an Enterprise production certificate.

No changes to the main `server.mjs`, `core.mjs`, bank-transfer logic, Stripe/payment methods, prices, links, IBAN, subscriptions or provider account configuration. No charges, refunds, payouts, broadcasts, external bookings or remote-device operations. No third-party private database import. New UI is served only by the explicitly enabled mobile sidecar.

## Implemented
- `/mobile-crm/`: responsive Italian CRM and front-office interface. No synthetic customers or revenue are embedded in the product.
- Same-origin existing SEVA session; `/me` returns a signed 15-minute subject/tenant/role binding. The sidecar requires this binding for writes. It does not replace session authentication.
- CRM fields, authorized-source ID, territory fields, search and version-aware edits; explicit in-memory outbox with reviewable conflicts.
- Follow-up task records; no automatic emails or messages.
- Partner application uses the existing fourth endpoint, explicit consent and `pending_review`, with no contractual acceptance or payment.
- `stay` record kind: planned -> checked_in -> checked_out; planned -> cancelled. Dates validated, operational details locked on transition, terminal states cannot reverse, deletion forbidden. This is an internal register, not OTA connectivity, identity verification or authority filing.
- Network failure/replay retains the same operation ID. No automatic send on reconnect. Account change clears the previous view and drafts; race between identity read and write is rejected server-side.
- Explicit AES-256-GCM/PBKDF2 encrypted outbox export/import, scoped to origin, subject and tenant. Password and session tokens are not persisted. The outbox is not a database backup; closing the tab without export loses drafts.
- Static asset allowlist, no directory traversal, restrictive CSP, no-store responses and text-only rendering of record values.

## Verification, with distinct scopes
- Node 22.16.0: 51 PASS / 0 FAIL / 0 SKIP, real local HTTP requests and synthetic SQLite/session fixtures. Original 27 tests unchanged; 24 additional tests.
- Offline Chromium DOM component checks: 20 PASS / 0 FAIL with injected synthetic transport, not the live API. Reflow at 320, 360, 390, 768, 1024 and 1440 CSS pixels; CRM, stay, partner, offline, conflict and account-clear controls exercised.
- Browser -> local HTTP end-to-end: BLOCKED_BY_ADMINISTRATOR at navigation. Browser policy was not changed or bypassed. No physical Android/iOS test or hosted-login test performed.
- New commit CI: consult the PR runs for its exact head SHA. The build manifest is a pre-CI snapshot, not an automatic current-status badge.

Reproduce HTTP tests from the complete repository:

```sh
node --experimental-sqlite --test apps/seva-enterprise/test/mobile-sync-*.test.mjs
```

The delivered archive includes `scripts/test-mobile-crm-components.py` (Python Playwright and Chromium required) and the separate attempted HTTP-browser harness. Test fixtures are synthetic and must never become production authentication.

## Controlled staging activation (not executed in this build)
Use the existing approved SEVA session store and a staging copy, provision memberships and approved sources server-side from actual authorizations, and use the sidecar's explicit configuration. Keep signing keys in the hosting secret store, never in the browser, repository, report or chat.

The reverse proxy must route both `/mobile-crm/` and `/api/v1/mobile/` to the same opt-in sidecar under the existing HTTPS origin, preserve Origin, and forward existing session cookies only to the intended service. Do not create a second public login or change payment routing. The sidecar binds loopback only and cannot publish itself.

Before enabling: validate hosted session lifecycle, cross-account/cross-tenant HTTP denial, strict source authorization, CSP, rate limits, request bounds, database file permissions, encrypted storage, secrets, real backup and rollback. A green source CI alone is insufficient.

## Reversibility and production limits
Discarding a local proposal does not delete a server record. Imports never silently overwrite a newer version. Stay history is not erased to simulate reversal of a real-world arrival or departure. The existing encrypted database snapshot utility remains separate from the browser queue archive.

Rollback of this candidate: disable the sidecar and withdraw only its proxy routes; preserve the existing SEVA login, main server and payment routes. Keep database/audit history; do not drop tables or restore over a live database. A production restore requires an isolated validated restore drill and operator review.

The store remains SQLite with application-level tenant scoping, not PostgreSQL RLS. HMAC audit is not an external immutable anchor. Multi-process load, key rotation, retention, physical devices and full browser-HTTPS integration remain unverified. Provider/payment end-to-end tests, WhatsApp/Skebby, Windsor/Power BI, Kubernetes and autonomous TITANS execution remain separate gates in Issue #153.

## Primary implementation references
- WHATWG Fetch: https://fetch.spec.whatwg.org/
- Node.js SQLite: https://nodejs.org/api/sqlite.html
- W3C reflow guidance: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
These references guide implementation; passing the scoped tests is not a third-party certification.
