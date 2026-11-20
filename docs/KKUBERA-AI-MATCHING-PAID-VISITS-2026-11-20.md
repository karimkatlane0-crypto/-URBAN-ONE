# KKUBERA — AI Matching & Paid Visits

Date: 2026-11-20
Branch: feat/kkubera-ai-matching-paid-visits-2026-11-20
Base: main-@URBAN-ONE
Tracking issue: #220

## Product contract
The visitor must see the requested visit fee in the offer and calendar preview before consenting or paying. Amount, currency and fee breakdown remain identical through checkout and receipt. No charge, event write, invitation, contact transfer or outbound message occurs without the relevant explicit user action.

## End-to-end state flow
`MATCH → PRICE → CALENDAR → CONSENT → PAYMENT → CONFIRMED VISIT → INSIGHTS`

### MATCH
Match the visitor's stated criteria against authorized property/listing data. Explain principal match reasons and disclose missing or unverified listing facts. Do not infer sensitive traits or enrich private-person profiles.

### PRICE
Present fee amount, currency, payee, inclusions, additional costs, cancellation/refund terms and quote expiry. Store an immutable price snapshot/version. If price changes, invalidate checkout and require renewed review and consent.

### CALENDAR
Display proposed date, local timezone, duration, location and exact visit fee. Check availability only where an authorized integration exists; otherwise label the handoff manual/unverified. Preview first. No event write or invitation before explicit confirmation.

### CONSENT
Record visitor, provider, purpose, selected slot, price snapshot, terms version, timestamp and consent action. Separate booking/payment consent from optional contact sharing and analytics. Provide cancellation and withdrawal paths.

### PAYMENT — TEST first
Create payment intent only after explicit confirmation. Verify provider webhook signatures; enforce idempotency and replay protection. Maintain an append-only transaction ledger and reconcile payment, booking and refund states. Test pending, succeeded, failed, partially refunded, fully refunded and disputed states. No LIVE credentials, real charge or production activation in this candidate.

### CONFIRMED VISIT
Confirm only when payment is verified and provider acceptance/availability is confirmed. Prevent duplicate bookings and double charges. Issue a status/receipt record; handle cancellations, rescheduling and no-shows.

### INSIGHTS
Measure match impressions, qualified requests, calendar previews, consent, paid visits, completed visits, cancellations, refunds and no-shows. Show denominators, time windows, tenant scope and source provenance. Keep operational analytics separate from personal contact data; apply RBAC and tenant isolation. Label predictions as inferred, never observed facts.

## Google integrations
- **Calendar:** separate OAuth consent per Google identity; minimum scopes; verify identity, scope grant and revocation. Read availability and create an event only after final user confirmation. Until API access is independently verified, use a clearly labelled prefilled manual handoff.
- **Contacts:** connector/API access is not currently evidenced. Build opt-in selective sharing with field-level choice, explicit recipient/purpose, revocation and export. No silent sync, automatic merging, contact enrichment, transfer or invitation.

## Required TEST matrix
- Two isolated tenants, two visitors and two providers.
- Price parity across listing, calendar preview, checkout and receipt.
- Price change/expiry between preview and checkout.
- Timezone and daylight-saving transitions.
- Slot expiry, provider rejection, cancellation and rescheduling.
- Repeated requests, duplicate webhook delivery, webhook replay and idempotency.
- Pending/failure/success/refund/dispute transitions; partial/full refund reconciliation.
- Unauthorized cross-tenant reads/writes and consent withdrawal.
- Keyboard-only navigation, mobile layout, screen reader and accessible error states.
- Storage failure, retry and recovery.

## Audit and privacy
Record actor, purpose, consent/terms version, price snapshot, state transition, timestamp and correlation ID. Never store payment secrets or unnecessary personal data in audit logs. Define retention, deletion/export, lawful basis, data-subject rights and processor boundaries before release.

## Delivery gates
- **BUILD:** candidate specification and implementation.
- **VERIFY:** fresh CI, API contract tests, browser E2E, TEST payment/webhook/reconciliation evidence, timezone/accessibility checks and independent privacy/security review.
- **RELEASE:** separate explicit human approval only.
- **SCALE:** only after verified release and operational monitoring.

## External dependencies and restrictions
Google Contacts is not connected/verified. Google Calendar API writes are not connected/verified; manual handoff is the fallback. Payment TEST backend, signed webhooks and ledger must be verified before end-to-end payment claims. No merge, deployment, LIVE payment, real invitation, contact sync or release is authorized by this candidate.
