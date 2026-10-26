# SEVA BLACK BOX — actual execution, 26 October 2026

Release decision: **NO-GO for live commercial sales**.
Live Stripe products, prices and subscriptions were not changed. No Checkout or charge was created.

## Scope and environment

- Published private Sites implementation: https://seva.karimkatlane0.chatgpt.site, version 2, Worker version f01212d6-86a9-45fc-b2dc-73e4d897784e.
- GitHub Enterprise Node implementation remains separate; PR #94 merged as 23e5bc960847df3f4647862c602860cfb80dcebe with 185 passing tests.
- Sandbox: Sandbox di Katlane Karim, livemode=false.
- Service authentication was used for private HTTP checks. It does not establish a visitor identity and is not evidence of customer login. No access policy changed.

## Black-box evidence

| Goal | Input / action | Expected | Observed | Status / limits |
|---|---|---|---|---|
| G.1 HTTPS | Authenticated service GET /api/status | Reach deployed backend | HTTP 200; app SEVA; storage browser-local-crm; studentProfiles persistent-account-scoped; OpenAI configured; payments false | PASS for service reachability only. Database persistence, two-user isolation and visitor login not certified by status flags |
| G.2 OpenAI | POST /api/ai, synthetic prompt "Test sintetico SEVA BLACK BOX: rispondi soltanto SEVA_AI_OK.", consent=true | Generated text with provider response ID | HTTP 429, providerStatus 429, code credit_balance_exhausted; no generated answer | BLOCCATO: API credit exhausted. Existing key reused; no replacement key created |
| G.1 access control | Service GET /api/student without visitor identity | Reject missing identity | HTTP 401, "Accedi per gestire il tuo profilo" | PASS for missing-identity rejection, not full tenant isolation |
| G.3.1 catalog | Create three dedicated TEST products with recurring default prices, then re-read prices | Correct amounts, recurrence, active status and livemode=false | All three verified; identifiers below | PASS for sandbox catalog only |
| G.3 checkout / webhook | Inspect deployed /api/status and source routes | Dedicated payment backend and signed fulfillment | Status says checkout-not-connected; current Sites source implements status, AI and student routes, not Enterprise billing | BLOCCATO. No webhook pointed at an unverified route; no real sandbox purchase claimed |
| G.4 recovery candidate | Execute maintenance.test.mjs on PR #87 branch commit 77475d0 | Backup/restore, overwrite protection, private path validation | 3 tests pass, 0 fail, Node 24.22.1 | PASS LOCAL ONLY. Not integrated recovery on deployed service; no offsite production restore |
| G.5 physical Android | Inspect available device connection | Connected physical device for acceptance | No Desktop Commander devices; no adb executable in executor | BLOCCATO. No physical install or mobile customer E2E claimed |
| G.6 release | Review missing evidence | All mandatory gates pass | Several gates blocked or unverified | NO-GO |

Production logs corroborate POST /api/ai HTTP 429 at 2026-10-26T13:03:40.521Z and GET /api/student HTTP 401 at 2026-10-26T13:03:46.975Z. Raw logs, headers, tokens and secrets are deliberately excluded.

## Verified sandbox catalog

| Plan | Amount | Recurrence | Product | Price |
|---|---:|---|---|---|
| Enterprise | EUR 50 | monthly | prod_VVpDblBEWDSzde | price_1UUnZNRqMSOj5D6KF7Ynjk4l |
| Buyer | EUR 50 | annual | prod_VVpDnHNoc9ZgU0 | price_1UUnZORqMSOj5D6KSHBFcUTP |
| E-commerce | EUR 500 | annual | prod_VVpDsl6SMCXPET | price_1UUnZPRqMSOj5D6KFoJcBrfE |

These are sandbox-only objects with app=SEVA and purpose=black_box_test. They do not grant access or establish a live subscription. Existing URBAN ONE sandbox products remain unchanged.

## Remaining execution dependencies

1. Restore API credit on the existing OpenAI project; retry one bounded synthetic request from the deployed app. The UI currently describes the 429 as temporary even though the machine-readable code is credit_balance_exhausted; distinguish that condition in the next UI correction.
2. Select and deploy the actual SEVA billing backend with durable storage and customer authentication. The private Sites Worker and the Node Enterprise application must not be treated as interchangeable.
3. Install sandbox-only credentials securely; configure the above price IDs and a signed webhook at a verified reachable SEVA endpoint. A private site access gate must not block Stripe delivery; never put a service-access token in a webhook URL.
4. Execute real sandbox Checkout -> paid signed event -> owner-matched entitlement, duplicate replay, renewal, payment failure and cancellation. Never use a success redirect as proof of fulfillment.
5. Complete offsite backup and isolated restore of the actual deployed data store.
6. Complete physical Android acceptance and user-facing contractual/privacy/support review before a separate live release decision.

Tracker: https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/82
