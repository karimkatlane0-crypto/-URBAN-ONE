# SEVA IS CALLED — Executive Tier-1, four independent release gates

Test implementation: apps/seva-enterprise/test/blackbox-restart.test.mjs
GitHub workflow: .github/workflows/seva-tier1-backend-blackbox.yml

## Gate A — persistent HTTPS server
- Source: render.yaml, Node 24.4.0, SQLite persistent volume /var/data/seva.sqlite, Frankfurt, single instance.
- Source is NOT deployed merely because render.yaml exists.
- The black-box test starts a separate Node HTTP process with production runtime validation and a temporary on-disk database. It closes the process, restarts a second process, and checks stored goals and change-event cursors.
- PASS here means local CI synthetic durability works; it does not demonstrate a public Render HTTPS endpoint, offsite backup, backup restore, or billing approval.
- A paid persistent-disk Render plan requires direct approval by the account owner before creation.

## Gate B — OpenAI ChatGPT login
- Screenshot at auth.openai.com proves an OpenAI-hosted account-choice/consent screen for SEVA — Intenti, obiettivi e valore, not backend session success.
- Real acceptance requires registered OIDC callback + PKCE/state, backend exchange and issuer/audience/nonce/expiry verification, then app-local tenant session with logout and CSRF controls.
- App does not infer that OpenAI profile identity or a ChatGPT app connection grants access to conversations or service-side Responses API. Eligible ChatGPT-plan inference needs separately approved scopes and proper integration.
- This black-box test proves two local email/password accounts over HTTP, not Sign in with ChatGPT OAuth.

## Gate C — actual OpenAI response
- server.mjs requires explicit consent, authenticated user, local entitlement/admin, secure provider key and a traceable provider response ID. developer-ai.mjs restricts its backend target to the official Responses API endpoint and never silently includes stored goal history.
- Black-box tests demand a 503 response when no key exists; this is secure fail-closed behavior, NOT a successful OpenAI inference.
- Real GO requires an authorized, funded API project (or supported separately authorized Sign in with ChatGPT plan scopes), successful provider response and nonsecret provider trace ID.

## Gate D — DBRELAY persistence and tenant isolation
- Real localhost HTTP test registers two synthetic tenants, saves separate goals, confirms per-tenant snapshots and cursors, blocks anonymous access and cross-origin writes, restarts Node, logs both tenants in again, reads persisted goals, updates A and confirms B cannot see it.
- JSON receipt is a transient CI artifact with synthetic status only. No production user data is read.
- Remote GO requires service HTTPS, secured storage, backup/restore, account recovery, safe deployment and privacy/legal review.

## Financial protection
- Bank order / SEPA activation flags, annual/monthly sales and Stripe credentials stay disabled/empty in test. No orders or payouts executed.
- A running web frontend, passing CI or an OpenAI sign-in screenshot must never be represented as a complete commercial release.

Sources:
- Render persistence: https://render.com/docs/disks
- Render free instance: https://render.com/docs/free
- OpenAI Sign in with ChatGPT: https://developers.openai.com/siwc/quickstart
