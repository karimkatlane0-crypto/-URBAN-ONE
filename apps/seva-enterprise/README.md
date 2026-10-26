# SEVA AI · Enterprise Phases II & III

**Version:** 2.3.0 · **Source candidate for review, not an MVP pitch and not yet a live commercial release.**

This is a standalone application under `apps/seva-enterprise/`, separate from the URBAN ONE and KKUBERA applications. The current package was derived from the previous SEVA 1.1 implementation after 68 unit/HTTP tests. It does **not** overwrite or replace the existing, separately hosted `seva.karimkatlane0.chatgpt.site` project.

## Annual Stripe subscriptions (integration candidate)

Buyer €50/year and e-commerce merchant €500/year are separate from commercial formula A=€50/month. Their code path is fail-closed by default. No annual Stripe Checkout can be opened until provider prices/products are ACTIVE, private environment is configured, test webhook-to-entitlement cycle is proven and explicit owner release controls are approved. See [STRIPE-ANNUAL-INTEGRATION.md](STRIPE-ANNUAL-INTEGRATION.md).

## Phase II DBRELAY — secure data synchronization

Goal edits and consented campaign drafts are logged atomically in SQLite by `dbrelay_changes`. Authenticated `/api/dbrelay/status`, `/api/dbrelay/snapshot` and `/api/dbrelay/changes` support source-of-truth snapshots and owner-scoped incremental sync; the dedicated **DBRELAY** UI tab refreshes saved goals from the backend. No external cloud relay, Stripe execution or auto-upload of photos. See [DBRELAY-PHASE-II.md](DBRELAY-PHASE-II.md).

## What works in the verified local package

- Enterprise Phase II: account sessions, isolated customer goals and subgoals, acceptance criteria, evidence, status and audit, JSON/CSV/TXT export, pricing quote at **EUR 50/month** with consent-bounded marketing and verified-savings logic, ownership-scoped saved commercial drafts with a SHA-256 snapshot, and quorum/deadline marketing-redemption **preview** (no transfer).
- Enterprise Phase III: consent-scoped goal planning through the server-side OpenAI Responses API **when a real server secret and paid entitlement exist**, an auditable non-executing AI reply, a rewards ledger with no payout operation, a responsive HTTPS installable PWA with offline shell caching that explicitly excludes API, checkout and private data.
- Stripe monthly checkout endpoint is **fail-closed**, accepts only a newly configured, active EUR 50/month recurring Stripe price. The old inactive EUR 500/year product is deliberately rejected and unchanged. No fee is collected by this source package itself.
- Tests include isolation, payment webhook signature and duplicate handling, price contract and consent checks; see `npm test` output.

## Start locally (Node.js 22.13+)

```sh
cd apps/seva-enterprise
npm test
npm run check
npm start
```

Open `http://localhost:3000`, sign up and test goals, self-service quote and mobile interface. All authentication, goal editing, saved proposals and calculations operate locally, but AI and Stripe **do not operate** without separately configured real providers.

## Provider activation (requires project-owner authorization and review)

1. Deploy on a secure **persistent Node service** with persistent SQLite storage, backup, HTTPS reverse proxy, same-origin protection and monitoring. This implementation is **not suitable for stateless, multi-instance serverless deployment** without changing the database.
2. Secret manager: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, unique `SEVA_MONTHLY_PRICE_ID`, `SEVA_PUBLIC_URL`. Never commit secrets or consumer tokens.
3. Run an authenticated OpenAI request **from the deployed SEVA origin**, capture response ID, measure latency and verify redaction/quotas. Local mocks alone are insufficient.
4. Create and validate a separate EUR 50/month price in **Stripe TEST**, check checkout → signed webhook → login entitlement → failed payment/cancellation → idempotent retry. Verify tax / terms / refund policy. Keep `SEVA_SALES_ENABLED=false` until passing.
5. Execute realistic mobile PWA browser tests, offline/online, accessibility, multi-user concurrency, security review and Android device acceptance. **No APK or Play Store release is claimed**.
6. Marketing redemption remains a review-only decision, not an automated transfer: contracts and regulatory treatment, refund reserve, buyer-funded source, original payment reconciliation, payment rails and double-spend controls must be approved first.

## Relationship to ChatGPT/OpenAI

SEVA is an independent application consuming OpenAI APIs if configured. **It is not an OpenAI or ChatGPT product and does not claim any OpenAI partnership.** API authentication reported from an earlier chat has not been independently re-run against this enterprise package or the public SEVA site.

## Release acceptance

Local test suite PASS is a code quality gate only. Production `GO` requires separate evidence for published origin, authentication, real first OpenAI response, billing and rights, customer support, backups and mobile device acceptance. Do not claim a completed public enterprise deployment merely because the code is present in GitHub.

## Enterprise commerce & students — 2.4

See [International Store and Student Access](README-COMMERCE-I18N.md). `/shop.html` provides six languages, a student verification request, optional customer profile, owner-scoped cart, free/recurring/quote models and non-paying quote creation. No new Stripe product or student discount has been activated. The public SEVA site is not automatically updated by this repository commit.

## Student ID profiles — 26 October 2026
Account-scoped student ID, academic-year data, explicit notice/declaration, JSON export, version conflict checks and deletion. See STUDENT-BACKEND.md. This profile does not approve the separate commerce student-verification application or unlock a student price.
