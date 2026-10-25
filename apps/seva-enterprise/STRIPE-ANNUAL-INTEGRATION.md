# SEVA IS CALLED — Stripe annual subscription integration (Karim Katlane)

**Status 2026-10-25:** source integration on isolated review branch. NOT deployed. No live charges or payment links created. No new secret has been transmitted or committed.

## Distinct commercial contracts

| Role / calculation | Commercial rule | Stripe status verified |
|---|---|---|
| Buyer (Acquirente) | **EUR 50/year** recurring | Buyer product and price exist in account Katlane Karim; both inactive; no annual Checkout live |
| E-commerce merchant | **EUR 500/year** recurring | E-commerce product exists but inactive; price exists; no annual Checkout live |
| Commercial model **A** | **EUR 50/month** | Quote/simulation and separate monthly code; no verified live subscription |
| T / G / M / S | deadline/quorum, goal fees, consented marketing, verifiable savings | Simulation only; no automatic redistribution of other buyers' money |

Annual buyer: Stripe product `prod_VVYYMcbZ5izjAv`, price `price_1UUXRLRzfcoKq6cnCatbmcZR`.
Annual merchant: Stripe product `prod_VVXXVGhdpIodLC`, price `price_1UUWSlRzfcoKq6cnfB1elOxQ`.
These identifiers are not API secrets; real provider credentials stay exclusively in a private environment.

## Implemented in this change
- `annual-billing.mjs` validates plan, product ownership, active states, EUR amount, annual recurrence, licensed billing and metadata.
- Authenticated `POST /api/billing/checkout/annual` accepts `{"plan":"buyer"}` or `{"plan":"ecommerce"}` and refuses requests until both `SEVA_SALES_ENABLED=true` and `SEVA_ANNUAL_SALES_ENABLED=true`. Annual metadata is attached to Stripe Checkout and subscription.
- UI displays both annual options, both disabled until annual enablement.
- Tests assert contract invariants and fail-closed route behavior.
- Existing monthly Checkout, SEVA Work site, private `OPENAI_API_KEY`, Stripe products and payment settings are unchanged.

## Verification gates before a public launch

- [ ] Configure TEST Stripe prices/products and webhook signing secret in private hosting. Do not copy live credentials to code or public Git.
- [ ] Verify buyer and merchant CHECKOUT, verified signature, repeat events, price-to-plan attribution, proper entitlements, cancellation, failed invoice, refund policy and duplicate events in Stripe TEST.
- [ ] Confirm per-plan entitlements and customer/merchant permissions in the backend; existing entitlement is generic, not permission-scoped.
- [ ] Confirm user terms, withdrawal/renewal wording, VAT/tax calculation, privacy/GDPR consent, provider/fulfillment and support.
- [ ] Verify separate Work secret `/workspace/sites/seva/.env.local` is retained, not sent to browser or GitHub. Confirm first authenticated public OpenAI response from deployed SEVA origin (prior 200 at API authentication layer alone is insufficient).
- [ ] Verify persistent database, backup/restore, HTTPS, CSRF/security, responsive Android PWA and browser E2E; record CI links and environment.
- [ ] Only then authorize explicit transition of plan activation and `SEVA_ANNUAL_SALES_ENABLED`, and separately inspect payment totals and customer access.
- [ ] Do not imply automatic marketing cashback or payment rails: real refunds and incentives require their own contracts, funding, independent provider controls and checks.

**Release decision:** NO-GO for live annual sales until evidence has been recorded for every required gate. This change is a staged integration, not a fully published SEVA product.
