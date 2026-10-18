# URBAN ONE — First B&B customer without upfront project spend

**Operating version:** 2026-10-18 · **Status:** outreach/pilot preparation only, not production Booking.com connectivity or verified sales.

## Goal and non-negotiable budget rule

Reach **one contracted, paying B&B customer** with a minimal, verified and lawful B2B product offering. **No new paid service, campaign, subscription, domain, advertising, provider API tier, account charge, refund, transfer or bank movement is authorized by this document.** Spending requires a separate explicit approval with an amount and purpose. Free-tier tools may have quotas, so stop before any potential billable usage.

This repository is **public**. Store no personal contact details, partner/private contracts, guest identities, bank identifiers, IBAN, account IDs, API keys, booking tokens, login links or financial ledger entries here.

## Truthful baseline — evidence snapshot dated 2026-10-18

- GitHub source and onboarding playbooks exist; readiness docs are **not** external-provider access.
- Booking.com pauses onboarding for new Connectivity Providers; an **authorized property PMS/channel manager** is the preferred route. No property authorization, Booking.com/OTA inventory or reservation sync is evidenced.
- Stripe Live account was read separately: customer charges and merchant payouts enabled, EUR payout bank destination configured (details intentionally omitted). At that snapshot, EUR available and pending balances were both zero, no listed charges, no payouts, and no connected host accounts. Balances can change: read Stripe again before any claim or payment operation.
- Stripe Live **B&B Monthly Platform Service** and **Verified Booking & Service Commissions** products already exist but are **inactive and unpriced**. Do not activate or create recurring prices before commercial and tax terms are approved.
- Network Pass has a separate one-time EUR 1,000 checkout and bounded six-night credit design; it must not be presented as guest inventory already available, paid or provider-authorized.

## Offer: lead with a limited, no-cost discovery / workflow demonstration

The initial B2B sale is about a **clearly scoped digital service**: mapping the guest journey, defining manual check-in/check-out workflows and optional upsell catalogue, and preparing an auditable authorized PMS pilot. Demonstrate using synthetic data first. Do **not** imply a live Booking.com account, live reservations, guaranteed occupancy, guaranteed profit, guest-contact access or an installed mobile production app.

Commercial proposal **for negotiation, not an active price**:
- B&B partner SaaS **EUR 99/month (illustrative)**, only after a written agreement covering included services, cancellation, tax treatment and support;
- optional fees for **independently verified and specifically contracted** direct bookings / upsells; **no automatic commission on OTA/Booking.com reservations** without proper authorization and actual economic/legal entitlement;
- zero upfront fee for a short initial introductory call and synthetic-data demonstration; any extended pilot responsibilities must be agreed before starting;
- host is never charged or enrolled into auto-renewal without clear opt-in and Stripe Checkout/Billing provider-side confirmation.

Do not include nights or hospitality inventory in a paid membership until real participating supply, refund terms and eligible settlement are signed and verified.

## Execution with no paid tooling

1. **Qualify** a short list (e.g. five) of independently verified operating B&Bs from publicly accessible business sources. Record business name, official site and public general-business contact channel **privately**, with source/date and applicable contact-law review. Do not scrape private guest data or send bulk cold SMS/email.
2. **Request permission** for a 15-minute workflow discovery through an appropriate compliant contact channel. A warm referral or general inquiry is preferred. Do not represent URBAN ONE as Booking.com, Stripe, EY or OpenAI partner.
3. **Run demonstration** with synthetic reservations and a sample check-in / checkout / upsell ledger. Ask only for current PMS/channel-manager name, actual workflow needs and level of interest — not passwords or API keys.
4. **Offer a bounded scope**: specific monthly functionality, per-service fee trigger, taxes, data protection, cancellation, refund, responsibility, support and partner exit. Validate business feasibility before promising features.
5. **Sign a private contract** and obtain explicit host / property-level permissions. Only then initiate secure provider onboarding and test authorization.
6. **Provider pilot**: read only consented inventory/reservations after authorized PMS integration. Deduplicate provider events, handle cancellations and reconcile payment responsibility. Keep accommodation amounts managed by OTA/property outside URBAN ONE fee collection.
7. **Billing**: create/activate a price only after written commercial approval and tax review; hosted Stripe Billing Checkout + signed, idempotent webhook; do not grant service entitlement from a redirect.
8. **First paid acceptance**: proof = signed agreement + provider-confirmed successful invoice/charge + delivered scope + reconciliation. Distinguish gross invoice from net profit after fees/tax/support costs.

## Evidence gate checklist

| Stage | Required proof | Otherwise |
| --- | --- | --- |
| Lead qualified | verified business/operating status | `UNVERIFIED` |
| Contact compliant | basis to contact + opt-out respected | `DO_NOT_CONTACT` |
| Host interested | affirmative reply / discovery evidence | `PROSPECT` |
| Contract signed | private signed terms | `NOT_CUSTOMER` |
| Property access | operator grant + provider permission | `NO_PROVIDER_READ` |
| Reservation test | source event + mapping + cancellation test | `NO_LIVE_SYNC` |
| Charge | Stripe provider-side paid event | `UNPAID` |
| Revenue recognized | actual platform entitlement and accounting | `NO_REVENUE_CLAIM` |
| Settlement | verified recipient + eligibility + transfer object | `NO_PAYOUT` |

## Minimal weekly scorecard, not invented results

Maintain in private working records: `prospects_qualified`, `compliant_outreach_sent`, `affirmative_replies`, `discovery_calls`, `signed_hosts`, `active_paid_subscriptions`, `verified_invoice_amount`, `refunds`, `provider_fees`, `support_cost`, `net_contribution`. Distinguish `zero` from `not_measured`, include a date and authoritative source for every nonzero value. Track recurring monthly revenue only for legitimately active and paid subscriptions and exclude accommodation GMV that belongs to Booking.com or a property.

## Next definitive gate

**Obtain the first positive B&B response to a no-fee discovery call.** Without a consenting customer and scoped offer, do not launch an automatic charge, property sync, partner settlement, public availability promise or marketing campaign.

See [B&B onboarding](BNB_PRIVATE_PARTNERSHIP_ONBOARDING.md), [authorized PMS pilot](BOOKING_COM_PMS_READ_ONLY.md), [Network Pass bounded economics](BNB_NETWORK_PASS.md), and [P0 issue](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/24).
