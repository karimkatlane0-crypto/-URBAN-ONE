# URBAN ONE — B&B Private Partnership onboarding (public-safe technical playbook)

**Status (2026-10-17):** partner discovery / technical onboarding. **No Booking.com or PMS connection, no signed B&B agreement, no live reservation sync, and no connected host payout account are evidenced by this document.**

This public repository contains only the non-confidential technical implementation plan. **Private commercial negotiations, contracts, property identifiers tied to nonpublic data, access tokens, identities, banking details and guest records must NOT be stored here or in public GitHub Issues/PRs.**

## Roles and proposed collaboration

1. **URBAN ONE** — membership rules, pass entitlement after verified Stripe payment, eligible credit redemption, guest journey, audit ledger.
2. **Booking.com** — independently manages its accommodation booking and payment flows according to the applicable accommodation partner agreement. URBAN ONE does not assume its API permissions or payment authority.
3. **Authorized PMS/channel manager** — operational source for participating-property inventory, availability, rates, reservations, cancellations and check-in data.
4. **Candidate: Smoobu** — potential PMS bridge, **not a signed URBAN ONE partner**. Its official docs describe Booking.com connectivity, partner OAuth 2.0 / HMAC APIs and provider registration.
5. **Stripe / Stripe Connect** — URBAN ONE checkout and connected-recipient onboarding for eligible host transfers; this is **not** proof of any host account being onboarded.
6. **GitHub** — version control, source review, CI/test evidence and public-safe status tracking. GitHub is a development service, not automatically a commercial party to a partnership agreement.

## Gated lifecycle

`partner_candidate -> partner_terms_agreed -> authorized_property -> pms_account_authorized -> property_unit_rate_mapping -> inventory_sync_verified -> reservation_sync_verified -> booking_payment_role_verified -> network_pass_entitlement_verified -> checkin_verified -> host_connected_account_verified -> host_settlement_eligible -> transfer_provider_verified -> reconciled`

Each transition requires source, timestamp, actor, external ID (when applicable) and auditable evidence. Missing evidence -> `pending` or `manual_review`, never `LIVE` by assumption.

### Gate A: external authorization

- [ ] Confirm a B&B operator with legal authority to grant scoped access to its property data.
- [ ] Agree private partner terms (inventory eligible for pass, premium/blackout rules, fees, notices, cancellations/refunds, responsibility for guests, personal data, disputes, reversibility and existing-booking protection).
- [ ] Determine whether the B&B has a Booking.com Extranet listing and a property ID.
- [ ] Choose an authorized PMS/channel manager; **Smoobu is an initial technical candidate**, not selected by contractual agreement.
- [ ] If using Smoobu, request third-party partner registration/credentials using its official process. Verify OAuth scopes or HMAC permissions and credentials securely on the server.
- [ ] Grant property-level Booking.com connection from the authorized Extranet; verify granular permissions and contract status.

**Provider constraint:** Booking.com publicly states integrations for new Connectivity Providers are paused and individual properties should connect via a channel manager instead of direct Connectivity APIs.

### Gate B: reservation adapter / data protections

- [ ] Map `provider_property_id`, units, rate plans, internal IDs and currency with provider provenance.
- [ ] Read and reconcile availability/rates, without designating URBAN ONE as write authority by default.
- [ ] Verify provider-side read of reservation, modification and cancellation and implement dedupe (provider + event ID) / idempotent retries.
- [ ] Store guest data only where explicitly permitted and necessary; never store OTA passwords, API keys or card details in this repository/client/logs.
- [ ] Distinguish `accommodation_provider_managed`, `accommodation_property_managed`, `urban_one_service` and `partner_service`; prevent double accommodation charges.
- [ ] Pilot with a consented property and a provider-confirmed test booking, then verify booking lifecycle before exposing any `LIVE_RESERVATION_SYNC` flag.

### Gate C: payments and host settlement

- [x] Existing live Stripe Network Pass Payment Link was previously checked for configuration: **EUR 1,000 one-time** (not proof a guest paid).
- [ ] Verify each Checkout Session / PaymentIntent server-side and signature-verified webhook before issuing entitlement.
- [ ] Enroll each participating B&B as an authorized Stripe Connect recipient, verify payout capability and supported geography.
- [ ] Agree allocation, taxes/VAT, cancellation/refund/no-show and chargeback liability before moving funds.
- [ ] If release is conditional on verified stay completion, evaluate **separate charges and transfers** in Stripe Connect for eligible URBAN ONE payment flows, subject to marketplace/payment-provider terms.
- [ ] **No transfer** without a verified recipient, sufficient eligible funds, settlement trigger, reconciled reservation and explicit applicable business authorization.
- [ ] Persist proof of transfer object/provider state and settlement ledger; never infer settlement from a redirect or local boolean.

## Present verified-vs-pending baseline

- `BOOKING_COM_INTEGRATION_READY_FOR_ONBOARDING`
- `PMS_ADAPTER_READY_FOR_ONBOARDING`
- `NETWORK_PASS_STRIPE_LIVE = YES` (checkout configuration, not sale)
- `NETWORK_PASS_PAYMENT_VERIFIED = NO_COMPLETED_PAYMENT_FOUND` (at prior inspection)
- `STRIPE_CONNECT_HOSTS = 0` (at prior inspection)
- `HOST_SETTLEMENT_READY = NO`

The status must be rechecked against authenticated providers before any operation or public launch claim.

## Public-safe next actions

1. Privately obtain the first B&B operator's consent and channel-manager choice.
2. Contact the chosen provider through **its official partner onboarding channel**; do not fabricate contract acceptance or API credentials.
3. Implement the provider-neutral adapter on a reviewed PR with mocks/tests and no provider secrets.
4. Validate first consented end-to-end reservation, cancellation, check-in and host payout in the supported environment.
5. Move `LIVE` flags only after timestamped provider evidence and commercial/legal review.

## Public documentation

- Booking.com Connectivity: https://connect.booking.com/
- Smoobu Booking.com setup: https://support.smoobu.com/hc/en-us/articles/360003170920-How-do-I-connect-Booking-com-to-Smoobu
- Smoobu developer / partner API: https://docs.smoobu.com/
- Stripe separate charges and transfers: https://docs.stripe.com/connect/separate-charges-and-transfers
- Existing Network Pass economics: [BNB_NETWORK_PASS.md](BNB_NETWORK_PASS.md)

**Important:** This is a technical invitation/readiness document, not an executed private partnership, Booking.com certification, commercial endorsement or completed financial transaction.
