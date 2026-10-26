# SEVA · Executive Command UX + AI draft studio · BLACK BOX release note

Date: 2026-10-26. Source repository `karimkatlane0-crypto/-URBAN-ONE` · branch `main-@URBAN-ONE`.

## Product goal
Deliver a coherent mobile-first path `GOAL → EXECUTE → VERIFY → VALIDATE → RELEASE`, with accessible launch points for goals, authenticated AI, professional communications and SEVA Store. “100 e lode” describes a product quality aspiration, **not a verified 100% commercial-readiness score**.

## Execution trace
1. **Executive Command Center**: responsive four-card launch pad, status label from the actual backend `/api/public/status`, mobile keyboard/focus and reduced-motion support; four-tap mobile dock. Never show ungrounded cash balances or “all systems operational” by default.
2. **Professional Beni e Servizi AI**: `POST /api/communications/draft` is authenticated and rate limited, requires SEVA AI entitlement/admin rule and a configured OpenAI key, uses server-side Responses API, `store:false`, factual user-entered context only. Does not include private user goals; ignores requests for invented prices, inventory, official partnership, confirmed cashback or shipping. Returns draft, provider ID, model and timestamp.
3. **Consent & human approval**: sending to WhatsApp or email requires the user to edit/review and tap the external composer. Server NEVER sends messages, creates recipients, pays for a campaign or calls third-party messaging APIs. For commercial offers, `recipientPermissionConfirmed === true` is mandatory even for draft generation.
4. **Security**: no API credentials in browser, no other-user data, no automated target list, no customer personal contacts, no push in background, no mass marketing. The PWA caches static assets only, not /api, Checkout or AI results.
5. **Boundaries**: `-URBAN-ONE` houses SEVA and URBAN ONE; the separate `URBAN-ONE` (no initial dash) houses KKUBERA and is NOT merged to avoid cross-tenant access or conflicting commercial configurations.

## Release gates and receipt
- Source tests: code correctness and synthetic HTTP regression, recorded as **PASS CI** only after GitHub Actions success.
- G.1.1 live hosting test must show HTTPS `/health` and per-tenant persistent SQLite after an actual remote process restart. CI process restart alone is not remote acceptance.
- G.2: an authenticated account with valid entitlement must obtain a real OpenAI response ID from deployed SEVA. Any insufficient provider credit or missing secret is **BLOCKED**, not AI PASS.
- G.3: Stripe TEST Checkout → signed webhook → correct owner plan → canceled/reversed access. LIVE sales stay disabled until this and legal/tax policy checks pass.
- G.4: encrypted independent offsite backup and restore, including DBRELAY, with private receipt.
- G.5: install **new Enterprise Android build**, physically test login, AI, Checkout rules, foreground notice UX, offline/reconnect, and Play billing policy. Previous 2.4.2 APK is **OFFLINE DEBUG ONLY** without new Enterprise features.
- G.6: consumer privacy, terms, refunds, financial features and Google Play/EEA alternative billing eligibility. External payer accounts/merchant agreement and platform contracts still need authorized onboarding and acceptance.
- Consent-gated WhatsApp automation and true remote Web Push require separate provider contracts, permission history, templates and real transport receipts before implementation. This PR deliberately supplies **manual** outbound only.

## Proof table (updated at merge only)
| Check | Source check | Result |
|---|---|---|
| Executive mobile cards and accessibility | HTTP and checked assets | CI pending |
| Draft validation and marketing permission | Node and HTTP synthetic test | CI pending |
| Actual OpenAI from hosted app | External response ID on deployed URL | NON VERIFICATO |
| Real WhatsApp/email delivery | No automated delivery attempted | DISABLED BY DESIGN |
| Backend HTTPS, DB restart, Stripe webhook E2E | Host and provider evidence | BLOCCATO |
| Production-signed mobile app | Android physical device and store | NON VERIFICATO |
