# SEVA Intelligence Studio × TITANS × Klaviyo — BUILD record

Date: 2026-11-20
Branch: `feat/seva-klaviyo-mlops-foundation-20261120`
Base: `main-@URBAN-ONE`
Related gate: [Issue #186](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/186)

## Scope implemented in this BUILD candidate

- Server-side Klaviyo OAuth primitives: PKCE S256, state, authorization URL, authorization-code exchange, refresh and revoke.
- OAuth token traffic is routed to `https://a.klaviyo.com/oauth/token` and `/oauth/revoke`; authorization starts at `https://www.klaviyo.com/oauth/authorize`.
- API adapter exposes GET-only relative `/api/*` reads. No profile, event, subscription, list, flow, campaign or webhook writes are implemented.
- SYNAPSY remains canonical identity. Mapping requires opaque `customer_id` and `tenant_id`, uses Klaviyo `external_id`, and excludes unnecessary sensitive fields.
- Marketing eligibility is fail-closed: explicit channel grant, status, source, method, evidence ID and timestamp required; revoked, suppressed, expired, future-dated or incomplete consent is denied.
- Event envelope carries idempotency ID, tenant metadata, source marker and event time.
- Tests use synthetic fixtures and mocked HTTP responses only.

## Explicitly not implemented / not verified

- No OAuth app created in Klaviyo; requires owner/admin/manager action in provider UI.
- No client ID, secret, callback registration, token storage, refresh-token encryption or KMS integration supplied.
- No staging backend or isolated Klaviyo test account verified. The connected account is production-marked; do not write synthetic data to it.
- No durable outbox, worker, retry queue, webhook endpoint, signature verification or event delivery implemented.
- No direct SYNAPSY database adapter or cross-tenant authorization integration.
- No model training, model registry, inference service, drift monitor or autonomous MLOps pipeline. TITANS readiness remains deterministic/offline.
- No Klaviyo campaign, flow, subscription or profile was created or changed.

## Required deployment configuration (server-side only)

- `KLAVIYO_OAUTH_CLIENT_ID`
- `KLAVIYO_OAUTH_CLIENT_SECRET`
- exact registered `KLAVIYO_OAUTH_REDIRECT_URI`
- encrypted token repository keyed by tenant + provider account
- callback state/PKCE verifier stored server-side with short TTL and one-time use
- allowed read scopes initially only: `accounts:read lists:read profiles:read segments:read metrics:read flows:read events:read webhooks:read`

Never put OAuth secrets, refresh tokens or private API keys in frontend code, browser storage, Git, logs, issues or chat.

## Staging acceptance

1. Create/register OAuth app with Klaviyo owner/admin/manager; approve exact callback and read-only scopes.
2. Provision isolated staging backend, token vault, tenant binding and synthetic Klaviyo test account.
3. Run OAuth callback/state/PKCE, token refresh/revoke, account identity and scope checks.
4. Add durable outbox and retry/dead-letter semantics; add signed webhook verification and replay protection before webhook registration.
5. Test synthetic-only one-way SYNAPSY → Klaviyo mapping, consent revocation, suppression, duplicate events, tenant isolation and deletion.
6. Attach CI, timestamped provider receipts and independent security review.

## Release governance

BUILD candidate only. No merge, production deployment, LIVE sync, campaigns, flows, messages or provider-side changes are authorized by this commit. RELEASE remains closed pending CI, review, staging evidence and separate human approval.

## Evidence sources

- Klaviyo OAuth documentation: https://developers.klaviyo.com/en/docs/set_up_oauth
- Klaviyo authentication documentation: https://developers.klaviyo.com/en/docs/authenticate_
- Existing project gate: Issue #186.
