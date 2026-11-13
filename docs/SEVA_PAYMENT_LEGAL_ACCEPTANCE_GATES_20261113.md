# SEVA — Payment legal and technical gates (2026-11-13)

## Source-backed code inventory
- `apps/seva-enterprise/server.mjs`: imports `billing.mjs`, `annual-billing.mjs`, `stripe-portal.mjs`, `bank-transfer.mjs`, `core.mjs`; contains Stripe checkout creation, server-side price/product validation, and runtime feature gates.
- `status()` explicitly reports `checkoutVerified:false`, `automaticRefundsEnabled:false`, rewards payout disabled, and `Enterprise candidate`.
- `SEVA_SALES_ENABLED` and `SEVA_MONTHLY_PRICE_ID` are required for sales; `SEVA_PAYMENT_METHOD=sepa` disables Stripe checkout.
- `apps/seva-enterprise/package.json` defines Node 22+ `npm run check` and `npm test`.

## Outstanding acceptance criteria (NOT VERIFIED)
1. Merchant legal entity, terms of service, pre-contract disclosure, cancellation/withdrawal and renewal disclosures reviewed for relevant jurisdiction and buyer type.
2. VAT/tax configuration, invoice/receipt obligations, payout beneficiary and accounting reconciliation reviewed by qualified professional.
3. Stripe TEST customer identity and price mapping, Checkout, signed webhook, idempotent provisioning, renewals, failed payments, cancellation, refunds and disputes proven end-to-end.
4. Bank-transfer orders must not grant access until independent settlement confirmation; no fabricated credit or self-approval.
5. GDPR data minimization, retention, access logs, tenant isolation, incident and chargeback procedures reviewed.
6. Production release requires explicit human approval, runtime evidence and rollback. Never infer debt settlement from successful software tests.

## Status
Code inventory only; no payment, bank transfer, Stripe LIVE, agent execution or production deploy performed. The 72/154 control registers must not mark these gates PASS without test and legal evidence.
