# SEVA Studio & Developer API — public source, gated commercial service

**Status 27 October 2026: SOURCE PUBLICATION / QA, NOT A LIVE PAID LAUNCH.**
SEVA is an independent service. This repository is public source documentation; no consumer access to ChatGPT, Claude or Gemini accounts is bundled or transferred. API access uses properly configured, server-side OpenAI Responses API only and may fail if credits are exhausted. No API credentials are committed.

## New SEVA Studio
- UI: /studio.html with responsive, accessible executive workspace; local goal drafts, a deterministic non-AI goal outline, authenticated SEVA AI requests, developer key issuance and disabled-by-default Stripe checkout.
- The browser never stores secret API keys or provider credentials. The issued developer key is shown once in-session and is not stored by client code. No CRM photos, IDs or private attachments are included.
- Local drafts remain in browser localStorage. They are NOT presented as synced or persistent across devices.
- Provider labels are honest: only OpenAI API can run when configured and authorized; Gemini/Claude are not activated by public hyperlinks.

## Developer API, paid-tier access
Endpoint: POST /api/v1/ai/plan
Authorization: Bearer seva_k_<64 hex characters>
Content-Type: application/json
JSON request: {"prompt":"Piano per un nuovo servizio","consent":true}
Response: model/provider response, entitlement indication and request usage.

API key control:
- POST /api/developer/keys: same-origin browser session required, JSON {"name":"Server produzione"}. Returns a secret once.
- GET /api/developer/keys: lists metadata without secrets.
- DELETE /api/developer/keys/{id}: revokes owned key.
- GET /api/v1/capabilities: non-sensitive public capabilities.
- Only the verified Enterprise **monthly** plan enables API key issuance and inference. Buyer/e-commerce and other URBAN ONE products do not automatically grant Developer API rights.
- By default **6 requests/minute/key**, maximum **3 active keys**, automatic key expiry in 90 days. Keys are stored only as SHA-256 digests. Separate production requirements include abuse protection, tenant-aware spend caps, monitoring, audit, privacy retention and encrypted backups.
- AI requests are rejected without explicit consent or active webhook-proven enterprise entitlement. Sending requests requires independently funded server-side OpenAI API billing, not consumer subscription cookies.
- Use server-to-server credentials in a backend, never in browser JavaScript, mobile bundles or GitHub. The external API does not enable wildcard CORS.

## Verified Stripe baseline (read-only, 27 October)
- LIVE SEVA Enterprise Product: prod_VVj0Q1lYCSsXLV; existing EUR 50/month Price: price_1UUhYoRzfcoKq6cnHGOhJGY7 — **inactive**.
- Sandbox Enterprise EUR 50/month product/price: prod_VVpDblBEWDSzde / price_1UUnZNRqMSOj5D6KF7Ynjk4l.
- Buyer EUR 50/year and e-commerce EUR 500/year are separate business contracts, NOT Developer API entitlements.
- Do not use existing unrelated URBAN ONE or KKUBERA live payment links for this service. SEVA cannot collect money correctly until its product, webhooks, entitlements and legal pages are activated and fully accepted.

## Run & test
Use Node.js 22.13 or newer. From apps/seva-enterprise:
  npm run check
  npm test
  npm start
Open http://localhost:3000/studio.html. Local goal editing works without Stripe or an AI provider. Authenticated goals and AI require the verified API runtime; AI production requires paid entitlement and an authorized OpenAI API key.

The existing SEVA Stripe webhook handler verifies Stripe signatures, ties checkout and subscription to a specific SEVA account and price, de-duplicates events, and processes invoice paid/failed and cancellation. No access grant comes from redirect URLs.
Rate/usage limits, billing consumer rights and pricing need explicit published terms before external paid users are accepted.

## GO / NO-GO
G1: Public HTTPS Node service, valid domain and single-instance durable SQLite, backup/restore and two-account isolation — NOT CERTIFIED.
G2: Authenticated real OpenAI response with available provider credit — NOT CERTIFIED (previously credit_balance_exhausted).
G3: Sandbox recurring Checkout -> signed webhook -> scoped entitlement -> API key -> usage -> renewal / payment failure / cancellation — NOT CERTIFIED.
G4: Privacy notice, GDPR minimization, terms, support, refunds and VAT registrations/tax handling — NOT CERTIFIED.
G5: Device acceptance, production signing and incident procedure — NOT CERTIFIED.
Only after each gate is proven and signed off should the SEVA LIVE product and live checkout be activated. This code keeps sales disabled by default.

## Safety rules
Never upload identity PDFs, bank details, live Stripe keys, OpenAI/Gemini/Claude secrets or CRM customer data to public GitHub. The user's attached Gemini shortcuts contain web links, not transferable API credentials. Do not assume third-party model access from a consumer share URL.
No real charges or payouts are executed by the source commit. Revenue projections are not realized income.

GOAL → EXECUTE → VERIFY → RELEASE. AD MAIORA SEMPER.
