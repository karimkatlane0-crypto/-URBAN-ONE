# SEVA SOVEREIGN TITANS — Onboarding & Agent Governance

**Version:** 1.0.0 · **State:** implementation candidate · **Release:** not authorized.

## Delivered in this change
- Static onboarding console at `apps/web/seva-titans-onboarding.html`.
- Provider/identity manifest at `apps/web/seva-titans-manifest.json`.
- Pure policy evaluator at `packages/titans/policy.mjs`.
- Automated tests for deny-by-default, exact scope, actor authentication, expiry, revocation, consent evidence and side-effect approval.
- No OAuth tokens, secrets, credentials, contact records or live provider calls are included.

## Identity and provider inventory
Google account A (`karimkatlane0@gmail.com`) and account B (`karimkatlane86@gmail.com`) are distinct principals. Each requires its own OAuth authorization, callback validation, minimum scopes, disconnect path and token revocation. A connected GitHub integration with limited repository scopes is not equivalent to a general-purpose remote execution identity.

Provider states are deliberately explicit: `not_connected`, `not_configured`, `not_implemented`, `not_verified`, and `connected_limited`. Only a provider whose runtime state is exactly `connected` can pass the policy evaluator.

## Action model
- `READ`: connected provider + exact scope + authenticated actor + unexpired, unrevoked grant.
- `DRAFT`: local-only and no external side effect.
- `WRITE`, `SEND`, `SHARE`, `DELETE`: all READ prerequisites plus explicit action approval and a consent evidence reference.

The evaluator is a policy primitive, not an identity provider, token vault, backend authorization boundary or proof of a real provider connection. Production enforcement must run server-side; client-side checks are never sufficient.

## Remote agent architecture
The next implementation layer must provide:
1. Tenant-scoped identity and RBAC.
2. OAuth/token vault with encryption, rotation, disconnect and revocation.
3. Provider adapter interface with health checks and capability discovery.
4. Sandboxed task execution, allowlisted tools/domains and bounded quotas.
5. Human approval for every external side effect.
6. Trace IDs, idempotency, retries, kill switch and immutable audit events.
7. Consent ledger with purpose, recipient, data fields, source, actor, timestamp, expiry and revocation.
8. Data retention, deletion, export and tested backup/restore.

“Unlimited access” is not a supported security mode. Use quotas and scoped, revocable grants.

## Communication protocol
The request → response flow is:
1. Draft request locally.
2. Identify the recipient through an authenticated channel.
3. Present purpose, exact fields, destination and expiry.
4. Record accept or deny with verifiable evidence.
5. Grant only the accepted fields and purpose.
6. Re-check revocation and expiry at execution time.
7. Audit the transfer result.

A user-entered URL or local response note is not independent proof of recipient identity. This release does not send email/SMS, invite calendar participants, sync contacts or transfer data.

## Unresolved acronyms
The request's GMAS, LSE, LAS, IAM, IEEE, EIII, SLE and SAL labels are not mapped to a confirmed provider, standard or protocol. Do not create integrations against guessed meanings. Record full name, authoritative owner, API/documentation, protocol, data classification and intended operation before adapter implementation.

## Verification and release
CI must execute `npm run security:secrets`, `npm test`, `npm run verify` and `npm run evidence` on the candidate branch and merge commit. Browser smoke tests, server-side policy enforcement, OAuth callback/revocation, tenant isolation, security review, backup/restore and staging acceptance remain release gates.

**No production deployment or external communication is authorized by this source change.**
