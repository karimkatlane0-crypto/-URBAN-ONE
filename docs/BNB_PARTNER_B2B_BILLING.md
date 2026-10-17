# URBAN ONE — B&B Partner B2B Billing (consent-first pilot)

**Release state:** implementation proposal and Stripe catalog prepared, **not live host billing**. This file is public, not an executed partnership or an offer accepted by any B&B.

## Stripe Live catalog — created 2026-10-17, both INACTIVE

| Purpose | Product ID | Charging state |
|---|---|---|
| Monthly B&B software/platform/service fee | \`prod_VSZuHukbW2SKsj\` | inactive; no price |
| Verified direct-booking and optional-service commission | \`prod_VSZuJCXPhgNQgk\` | inactive; no price |

Existing EUR 1,000 consumer B&B Network Pass is a **separate** product, charge, contract, liability and accounting flow. Do not charge the Network Pass to a B&B as its platform fee.

## Business model

**Leg 1 — Monthly recurring partner fee.** Each B&B purchases a separately agreed service plan with contractually specified monthly amount, effective date, VAT treatment, cancellation, and specific deliverables (software, reservation support, optional concierge tools). Configure a Stripe recurring EUR/month Price and subscription **only after** signed agreement, authenticated Stripe Customer, customer authorisation and any required payment mandate/consent. Configure invoice delivery / payment collection to match the agreement; do not silently charge a saved card.

**Leg 2 — Performance commission.** Charge only after a contract-defined event is both fulfilled and payment/provider-verified. Initial allowed event classes:
- **direct booking**: only a direct reservation routed through approved URBAN ONE channels, booked/paid/fulfilled and contract-authorized;
- **optional service**: a separately priced, delivered and paid service (e.g., assisted check-in, concierge, approved upsell) if the host agreement expressly authorizes the commission.

**Booking.com reservations are not assumed commissionable.** Booking.com/platform commissions, accommodation amounts collected elsewhere, Network Pass payouts and direct booking commissions must not be confused or double counted. OTA bookings default to **excluded** until specific contract/platform permissions and verified policy permit a separate service fee. Any provider agreement prevails.

**Charges to a B&B are NOT host settlement.** Host settlements are a different payout workflow with its own eligibility, Stripe Connect onboarding and reconciliation.

## Public-safe technical core

\`packages/bnb/partner-billing.mjs\` exports \`quoteBnbPartnerBilling\`, which builds **proposal-only** amounts:
- Blocks unsigned or incomplete agreements.
- Blocks missing explicit billing authorization or unverified Stripe Customer.
- Computes monthly fee plus an approved percentage in basis points on verified direct-booking or service amounts, exclusive of tax.
- Requires source event IDs, provider evidence, payment verification, completion and contract eligibility.
- Omits duplicate, previously billed, disputed, refunded and OTA events.
- Returns \`readyForInvoice:false\`, \`chargesCreated:0\`, \`invoiceCreated:false\` under **all** conditions.
- Does not fetch provider data, write Stripe API objects or finalize/send an invoice.

\`tests/bnb-partner-billing.test.mjs\` tests deny-by-default, consent, net calculation, duplicates, no double charging and failure states.

For production deployment, the backend MUST independently validate the signed contract and payment authorization from a private record, fetch the real Stripe Customer from Stripe server-side, verify provider booking/service/payment events, persist idempotency and billed event IDs, calculate tax, and only then separately request an invoice or subscription creation under privileged authorization. Never accept contract/verification booleans directly from an untrusted mobile client.

## Draft partner service agreement — unexecuted template for private negotiation

Use the following as a checklist; **complete and sign privately**. Obtain qualified local legal/tax review for the actual jurisdiction and partner before use.

1. **Parties and authorized signers:** URBAN ONE operating legal entity; B&B operator legal identity; company/tax identifiers, authority and official addresses.
2. **Scope:** software access; property inventory integration permissions; listed concierge/check-in services; operating support hours; data access boundaries.
3. **Subscription:** EUR \`[AGREED_MONTHLY_PRICE]\` per month \`[VAT_TREATMENT]\`; invoice/payment due date, start date, renewal and cancellation notice \`[TERMS]\`.
4. **Performance fee:** \`[AGREED_PERCENTAGE]%\` of specifically defined **net/gross excluding taxes/refunds** \`[BASE]\` on qualifying verified URBAN ONE **direct** reservations and \`[LISTED_OPTIONAL_SERVICES]\`. Specify when earned, attribution window, documented audit trail, cap/discount rules if any, refund clawbacks and exclusion of non-eligible third-party OTA transactions.
5. **Verification and disputes:** qualifying completion evidence; source system; who approves contested events, dispute window; signed adjustments and credit notes; no fees for cancelled, unfulfilled, unpaid, refunded or disputed events under the agreed rules.
6. **Billing permission:** exact Stripe Customer/account and authorized billing method. Manual invoice (\`send_invoice\`) versus automatic collection (\`charge_automatically\`) must be individually chosen and consented to; no automatic charges implied by signing a general partnership proposal.
7. **Inventory/Booking.com:** independent Booking.com accommodation partner permissions; PMS and connectivity authorization; cancellation, no-shows and merchant-of-record; no unapproved API access.
8. **Data protection:** controller/processor roles and GDPR terms, security, retention, DPA where needed; provider/guest data minimization; no payment credentials in GitHub or clients.
9. **No property transfer:** hospitality partner retains property and inventory control; reversible exit with agreed notice and protection for confirmed eligible reservations.
10. **Tax and liability:** B2B VAT invoicing/cross-border rules, refunds, reporting and responsibilities validated by the appropriate professional.
11. **Signatures:** \`[PARTNER_SIGNER]\`, \`[URBAN_ONE_SIGNER]\`, \`[DATE]\`, \`[CONTRACT_REF]\`; archival of signed version and consent **privately**, not in this public repository.

## Activation checklist

- [x] Stripe Live B2B products created, inactive and without pricing
- [x] Non-charging fee proposal logic and tests committed to review branch
- [ ] First B&B identified and operator authority confirmed
- [ ] Private commercial agreement signed and service/pricing details approved
- [ ] Tax/accounting terms verified
- [ ] Stripe Customer created/retrieved and authorized billing method configured
- [ ] EUR monthly price created and subscription activated under written authorization
- [ ] Booking/service evidence feed verified and durable invoice ledger deployed
- [ ] First commission invoice drafted, reviewed and sent/collected per agreement
- [ ] Webhooks, refunds, adjustments, failures and invoice-paid reconciliation verified end-to-end
- [ ] Production deploy and pilot evidence recorded

**Never create charges, payment links, active subscription, invoices or provider transfers purely from this source document.**
