# SEVA Enterprise · International Store / Student Access (Phase III Extension)

## Scope implemented

- Same SEVA identity provider: email + password, HttpOnly SameSite=Lax cookie. The commerce site uses the authenticated session and can register or log in directly. This is a Spotify-*style* student eligibility experience, **not Spotify SSO or affiliation**.
- New student verification **request**: institution, optional academic email and adult confirmation; initially `pending`. Never auto-grants discounts or access based on school-domain claims. An approved independent identity/eligibility workflow is needed before student checkout becomes possible.
- Optional authenticated commerce profile: name/country for quote, city/address/postcode optional, separate marketing consent default OFF, ability to erase optional profile. No card or government ID collected. Store encrypted database backups in deployment, apply privacy notice/retention and verified email before live launch.
- Owner-scoped SQLite cart, seven price models (free, monthly €50, student offer pending verified pricing, one-time, pay-for-goal, opt-in marketing, time-based), anti-tamper validation, immutable SHA-256 quote snapshot. **Unpriced/custom items are quote-only**, never charged via Stripe automatically.
- International e-commerce page: native IT/EN and localized DE/FR/ES/PT vocabulary, language dropdown, EUR currency formatting and mobile-first page. No claims of geo-local tax verification or actual inventory.
- Guarded monthly Checkout: only the standalone EUR 50 monthly SKU may delegate to the original server-side Stripe flow, itself disabled by `SEVA_SALES_ENABLED=false` until live verification. Mixed carts/student pricing are blocked from paid checkout.
- AI catalog advice endpoint delegates to existing authenticated OpenAI Responses function with entitlement gate and explicit no-execution instructions. No autonomous orders are placed.
- PWA static cache includes shop assets; excludes /api/, customer data, Stripe and AI responses. The Android APK, real device QA, and public deployment remain separate gates.

## Security and operational checklist

1. Verify all account emails and implement account recovery, rate limiting at edge, account deletion/retention policies and admin student verification with **documented evidence** and expiration. There is no customer-controlled `verified` endpoint in this change.
2. Finalize price, tax, VAT, cancellation, refund terms, student eligibility provider and consumer rights before enabling checkout. Student price is deliberately **not specified** in this iteration.
3. Verify stripe TEST lifecycle checkout → signed webhook → entitlement → cancelled/failed/refunded access for every actual billed SKU before live; apply webhooks idempotently and reconcile orders. A quote request does not grant access.
4. Host on a persistent encrypted database service with backup/restore, HTTPS, log protection, monitoring, environment secrets and data protection impact assessment as applicable.
5. Verify deployed origin's OpenAI response ID from authenticated account, localized UX on real devices, and accessibility and PWA installation. Test regular and student accounts, legal consent notices.

## Local verification

`npm run check` and `npm test` (Node 22.16, experimental SQLite). No third-party API charges or payment initiation in tests.
