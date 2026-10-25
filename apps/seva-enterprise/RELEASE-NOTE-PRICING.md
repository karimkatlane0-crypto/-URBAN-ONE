# SEVA AI — Pricing Intelligence / Golden Age

**Version:** 1.1.0 · 25 October 2026

## Commercial rules user-confirmed
- A = €50 per month. This is a **new proposed subscription**, not the existing live Stripe price.
- T = time-to-quorum or a contractually permitted early redemption or deadline. T itself is not an extra fee.
- G = free, negotiated, fixed, or calculated by verified achieved goals with upper limits.
- M = specifically requested, consented, capped and receipt-backed marketing service.
- S = evidence-backed purchasing savings; seek zero or low service price where genuinely available.
- R = redeem 100% of the buyer's documented eligible marketing expenditure once T conditions, independently funded reserve, legal/tax checks and payment method are satisfied. Full refund requires the relevant amount to be reconciled; no buyer is entitled to another buyer's contributions.

**Due now** = €50 × months + agreed G + authorized M − evidenced S.
**Net cost if and after R actually paid** = Due now − R.
A marketing rebate alone does not cancel the €50/month subscription. A near-zero total requires a separately funded discount or eligible reduction against A/G.

## Status and security
- User-facing calculator: `/commercial.html`; API `POST /api/commercial/quote` and `POST /api/commercial/redemption-preview`.
- **No billing, transfers, refunds or purchases** through these preview routes.
- Existing Stripe product `prod_VVXXVGhdpIodLC` remains inactive at its different annual subscription price (€500/year); neither a new €50/month price nor Checkout has been activated.
- Existing OpenAI response is not independently validated from a public SEVA deployment by this patch.
- Production automatic redemption needs binding terms (deadline/quorum computation; campaign-specific ledger; taxes; refunds on original buyer charges), event reconciliation, idempotency, signatures, buyer verification and prefunded reserve.
- In Italy the precise promotional/refund contract classification requires review under DPR 430/2001 and MIMIT cashback FAQ; do not market redistribution of pooled buyer funds as guaranteed returns.

## Test evidence
- Node 22.16.0 using npm test and syntax validation: **68/68 PASS**. Includes 24 new pricing/redemption rules and 4 new HTTP tests.
- HTTP smoke of `/commercial.html` served; full browser/Android acceptance and external Stripe/OpenAI E2E are **not performed**.
- No production deployment or GitHub push from this package.

## Concrete go-live gates
1. Final signed terms for time/quorum/early-redeem/deadline/partial-versus-full marketing refund.
2. Legal/tax classification and promo marketing review.
3. Stripe TEST checkout for 50 EUR monthly product, validated invoices, webhooks, subscription lifecycle and partial refund to original payment method.
4. Dedicated funded marketing refund reserve and immutable receipt-based buyer ledger.
5. Verified OpenAI API response from published authenticated SEVA domain, security/accessibility QA and production storage.
6. Only after end-to-end success, owner authorizes live product and actual payment execution.