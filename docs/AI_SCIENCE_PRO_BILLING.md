# AI Science Pro — Stripe billing launch

25 October 2026. Merchant: Katlane Karim, connected live Stripe account. Public app: https://urban-one-science.karimkatlane0.chatgpt.site/ .

## Offer

EUR 29 per month, 50 completed analyses per paid billing period, no usage overage charges. Unused quota does not roll over. OpenAI is the configured launch provider; Claude/Gemini/xAI are not included until configured and available. Owner access remains available; customers need ChatGPT sign-in and a verified active paid subscription. Cancellations through the hosted Stripe portal take effect at the end of the paid period.

Start purchase from the app after sign-in. Do not distribute the raw Payment Link as an unbound signup flow: the application supplies a private random client_reference_id to associate payment with the signed-in user. A direct link purchase without that reference requires manual support and does not automatically grant access.

## Stripe objects (identifiers only)

- Product: prod_VVTJg7Lv575RNP.
- Recurring Price: price_1UUSN5RzfcoKq6cnXijI28Iu, EUR 2,900 cents/month.
- Payment Link: plink_1UUSN5RzfcoKq6cn03m3eUU6.
- Webhook: we_1UUSMiRzfcoKq6cnZ416dxcX, API 2026-08-26.dahlia.
- Portal configuration: bpc_1UUSN6RzfcoKq6cn0RO6lPR2.

No provider API key, Stripe API key or webhook signing secret is in source. The application does not need a Stripe API key at runtime; it relies on signed events, a fixed account-owned Payment Link/Price and a durable checkout ownership record. Hosting secrets are stored separately in Sites.

## Implementation and verification

The production application uses signed webhooks and Cloudflare D1. Entitlements require all three independent verified facts: checkout ownership, an eligible active subscription, and a paid invoice period. Delivery order is independent; event IDs are deduplicated. Canceled subscriptions cannot be reactivated by stale events. Paid future invoice periods do not prematurely replace a current paid period. Usage is atomically reserved across isolates and released when no AI provider completes a response.

Production v2 source commit: 8545626c41371ef56af541e43009eb1f57c18072.
Deployment: appgdep_6ade12df55ec819190225512ee73786d, returned succeeded.
Complete hosted source: releases/ai-science-computer/pro-source-8545626.tar.gz (128 tracked files).
SHA-256: 7b3bedc2e0d429773f02c900b2629e1be12e75f8b79a2f048f4401ef3bf9e3a0.

The shared entitlement module and SQLite tests are mirrored in packages/billing/science-paid.mjs and tests/science-billing.test.mjs. SQL fixtures mirror the hosted Drizzle schema. The executable production routes and UI are in the complete hosted source archive; this does not retrofit billing into the older single-operator Node runtime.

Checks passed: production build; 10 actual-SQL billing tests (including all six event-order permutations, signatures, wrong product/account/mode, duplicate events, canceled/expired access, quota and early renewal); browser rendering of the public plan and Stripe checkout at EUR 29/month; production status HTTP 200 with checkoutReady true; anonymous checkout HTTP 401; unsigned webhook HTTP 400; terms/privacy HTTP 200. A synthetic signed readiness probe returned 200 and its repeat returned duplicate:true, verifying production signature/receipt/database plumbing without a payment or entitlement grant. This synthetic probe is not a Stripe-generated payment event.

## Remaining evidence and commercial limits

No customer payment, real Stripe lifecycle webhook delivery, hosted authenticated customer inference, payout or bank credit was executed or verified during this task. A complete customer purchase-to-access acceptance run remains open. Refunds/disputes require merchant handling and access review. This is not a certification or partnership with EY or any AI provider and does not guarantee earnings.

Tax Settings is active but no active Stripe Tax registration was present. Automatic tax is disabled. The EUR 29 price has inclusive tax behavior, but this is not evidence that VAT was calculated, collected or declared; confirm the merchant's fiscal treatment with their advisor. No registration, fiscal address or legal classification was changed.

Terms: https://urban-one-science.karimkatlane0.chatgpt.site/terms.html . Privacy: https://urban-one-science.karimkatlane0.chatgpt.site/privacy.html . Support: karimkatlane0@gmail.com.
