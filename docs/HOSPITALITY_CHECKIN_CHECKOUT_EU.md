# URBAN ONE Hospitality Operations — Check-in / Check-out EU Pilot

**Status:** Public campaign source + synthetic local workflow demo only (not live hotel management).

## What can be sold today
- Paid B2B business process discovery, check-in/out workflow mapping and synthetic-data prototype delivery under individual written agreements.
- Optional private scoped projects for concierge, guest communications, or PMS technical analysis **only if** skills, support, data rights, licensing, access scopes, SLA and liability are genuinely agreed.
- One-off fees paid voluntarily by a customer via the existing approved URBAN ONE Stripe LIVE hosted payment link, **only after** contract and EUR amount agreed. Link is not a universal self-service enrollment, automatic bill, or a booking payment processor.

## What cannot be claimed or billed today
- Live property reservations, Bookings.com provider/host approval, PMS live inventory, confirmed B&B Network Pass stays, paid customer subscriptions, digital signature, PSD2 bank access, host payouts, automatic late-checkout charging, guaranteed million-euro revenue or a publicly published paid ChatGPT plugin.
- Stripe payment link does not authorize entitlement; secure live webhook and contract/evidence reconciliation remain blocked. Never commission an OTA reservation by default or double-charge accommodation.

## Sales conversion steps
1. Interested hotel/B&B/property manager voluntarily contacts URBAN ONE via one of the five localized `apps/web/hospitality-{it,en,de,fr,es}.html` pages. The request opens a prefilled **mailto draft** that the customer chooses whether to send; the static page does NOT store the request.
2. Privately qualify authorized B2B decision maker and legal entity, verify scope and country VAT obligations. Do not use public GitHub for personal/private guest data.
3. Send a written offer: deliverables, pilot length, fee in EUR, any monthly subscription, eligible optional direct-event commissions, taxes, cancellation, SLA, exclusions and privacy terms. Obtain the actual customer/association acceptance and signature by authorized method.
4. On receipt of the customer's signed agreement, send the appropriate Stripe-hosted payment method. Do not create recurring charges before explicit recurring billing authorization.
5. Confirm completed payment authoritatively in Stripe and fulfill only after verification; track refund/dispute/duplicate events and issue appropriate invoice/receipt per applicable laws.
6. For actual property operations, connect approved PMS only after host identity and permission, tenancy segregation, real provider credentials server-side, privacy, role controls and provider acceptance. For real reservations, follow identity check and legally required guest-reporting rules by jurisdiction (never treat a synthetic demo as compliant check-in).
7. When agreed, measure **verified incremental EUR from check-in/check-out services** separately from accommodation GMV/OTA charges. Commission share and recipient depend on signed partner terms, not a default "18%" entitlement.

## Demo code
`packages/bnb/guest-journey-offline.mjs`: deterministic simulation, synthetic IDs only, no PII, no network, no billable event. State sequence:
`received -> reservation_verified -> prearrival -> checked_in -> checkout_ready -> checked_out -> reconciled`.
Cancel path is possible before final reconciliation. Tenant checks and mock operator authorization are enforced.
`tests/guest-journey-offline.test.mjs`: positive and denial tests.

**Future production gate:** independently prove upstream reservation/payment/guest compliance, signed contracts, correct check-in/out records, private event ledger, Stripe webhook, customer support and refund policy, tenant isolation and operator override. Do not automatically accept contracts or signatures from untrusted client state.

## Booking.com original provider position
https://connect.booking.com/ : new connectivity provider integrations paused; individual properties should use an approved channel manager.
## Promotion compliance
https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data/can-data-received-third-party-be-used-marketing_en
https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32002L0058

## Plugin listing rule
https://developers.openai.com/plugins/plugin-guidelines — commerce in public plugins currently limited to physical goods; do not sell/promote subscriptions or digital services in plugin UI. Standalone lawful external website commercial offers are a separate channel. Plugin installation != public directory approval.
