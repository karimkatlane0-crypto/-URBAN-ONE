# URBAN ONE — Booking.com via authorized PMS (read-only pilot)

Status: **SOURCE ONLY / NOT CONNECTED / NO LIVE BOOKING OR PAYMENT**, prepared 2026-10-18.

## Provider constraint and architecture
Booking.com currently pauses new Connectivity Provider integrations and does not allow direct property connections to its Connectivity APIs. A property can connect using an authorized channel manager in its Booking.com Extranet.

`Booking.com <-> authorized PMS/channel manager <-> URBAN ONE server adapter <-> B&B Network Pass rules <-> Stripe for independent, explicitly authorized URBAN ONE charges`

Smoobu is an illustrative PMS candidate **not an approved or contracted URBAN ONE partner**. Do not represent this as Booking.com certification, channel partnership or API access.

## Read-only implementation
`packages/bnb/pms-smoobu-readonly.mjs` constructs signed GET requests for `/api/apartments` and scoped date-window `/api/reservations`. It performs **zero provider network calls**. HMAC-SHA256 uses method, path, alphabetically sorted query, UTC timestamp, UUID v4 nonce, SHA256 of the empty body and API key, separated by newlines. The signature is base64 encoded.

All gates must be true, established by **real evidence** before supplying them from a trusted server:
1. Property operator consent and legal authority.
2. PMS account authorized to access the identified property.
3. Property/unit/rate mapping checked against PMS identifiers.
4. Guest data access purpose approved, minimized and protected.

Adapter must stay server-only; request headers contain credentials. Never log or expose request headers, guest PII, banking data or tokens in GitHub. Deploying this source alone does not meet the gates.

## Pilot instructions (pending external authorization)
- Obtain an explicit host agreement and confirm their connected Booking.com PMS.
- Complete the PMS provider's application/onboarding rules, permissions, retention, security and commercial terms.
- Configure host-specific credentials securely on the server (Smoobu HMAC user account or approved partner OAuth, as appropriate).
- Wire an HTTPS-only fetch transport server-side with rate limiting, retries, observability that redacts headers, provider-error handling, and tenant separation **only after review**.
- Read only the specifically authorized host inventory and scoped reservations, with confirmed channel source; never assume every Smoobu booking came from Booking.com.
- Add mapping, cancellation reconciliation, idempotency, audit records, privacy controls, and booking lifecycle tests prior to live sync.
- Keep Booking.com accommodation collections distinct from URBAN ONE Network Pass / optional service payments; no duplicate charges.
- Enroll host recipients and confirm eligible payment and completed stay before host settlement; no automatic transfers in this pilot.
- Verify pilot with external PMS/property evidence, then approve any LIVE flags. No unapproved API credentials, charge or transfer.

## External primary sources
- https://connect.booking.com/ — new-provider pause and individual-property channel-manager constraint
- https://developers.booking.com/connectivity/docs/token-based-authentication — only for **already authorized** Connectivity Provider machine accounts; JWT access does not confer property authorization
- https://docs.smoobu.com/#hmac-authentication — HMAC canonical signature, replay protection, API endpoints
- https://support.smoobu.com/hc/en-us/articles/360003170740-Use-the-Smoobu-API-get-an-API-key-set-up-webhooks-and-sign-your-requests — transition timeline
- https://docs.stripe.com/connect/separate-charges-and-transfers — downstream payout model, not activated
