# SEVA Stripe TEST Customer Portal — release gates

This PR adds an authenticated `POST /api/billing/customer-portal` endpoint, TEST-only, using a unique customer ID already recorded in the server-side entitlement ledger. It never derives customer ownership from browser-supplied IDs or email. The route is disabled unless `SEVA_STRIPE_TEST_PORTAL_ENABLED=true` and the server key begins `sk_test_`. The endpoint does not create a subscription or collect payment itself.

**Required before TEST execution:** existing authenticated SEVA user, one unambiguous Stripe TEST customer stored in the local ledger, HTTPS `SEVA_PUBLIC_URL`, Stripe Customer Portal TEST configuration, test secret and provider endpoint accessibility. Customer Portal may return a URL only after a real Stripe API call; offline tests use no network.

**NO-GO:** live key, multiple customer IDs, missing origin, unauthenticated user, missing Stripe configuration, or unavailable persistent backend.

**Follow-up:** verify Checkout TEST → signed webhook → entitlement → Portal → cancellation → subscription webhook → entitlement revocation; failed payment and idempotent replay; confirm the agreed price, taxes, terms, billing portal settings, backups and rollback. The current app persists to SQLite; the Render Postgres database is not an automatic substitute. Do not deploy or activate Stripe LIVE.
