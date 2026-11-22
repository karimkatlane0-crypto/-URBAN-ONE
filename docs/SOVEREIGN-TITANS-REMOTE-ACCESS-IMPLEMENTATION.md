# SOVEREIGN TITANS — Remote Access & Provider Fallback

**Date:** 22 November 2026  
**Workstream:** BUILD · remote access priority  
**Release:** not authorized

## Scope delivered in this branch

This branch adds provider-neutral, pure JavaScript policy primitives for:
- HTTPS-only remote endpoint validation.
- Exact hostname allowlisting; embedded URL credentials, IP literals and local hostnames are rejected.
- Tenant-scoped provider selection by explicit capability.
- Fresh, healthy provider evidence as a prerequisite for selection.
- Ordered primary and fallback provider candidates.
- Bounded exponential retry delays only for explicitly retryable, idempotent operations.

The functions do not perform network requests, authenticate users, store credentials, execute remote tools, or declare any provider connected. A selected provider is only a routing candidate after supplied configuration and health evidence pass validation.

## Runtime contract required before connecting a real provider

A production adapter must implement:
1. Server-side authentication and tenant isolation; never trust browser-supplied tenant IDs.
2. Secret-manager-backed credentials, rotation, revocation and least-privilege scopes.
3. Egress firewall plus DNS resolution/IP validation and redirect re-validation to prevent SSRF and DNS rebinding. Application URL checks alone are insufficient.
4. Per-provider capability discovery and signed/traceable health evidence.
5. Request deadlines, concurrency limits, quotas, circuit breaker, idempotency keys and bounded retries.
6. Sandboxed execution with tool/domain allowlists; no arbitrary shell, filesystem or unrestricted browser access.
7. Human approval and consent evidence for WRITE, SEND, SHARE and DELETE operations.
8. Trace IDs, immutable audit events, data minimization, retention and tested recovery.
9. Provider-independent adapter contract and conformance tests before onboarding each provider.

## Fallback rules

- Fallback is allowed only between providers explicitly configured for the same tenant and capability.
- Do not fail over on authorization errors, policy denials, validation failures or non-idempotent side effects.
- Retry only transient, explicitly retryable failures and only for idempotent operations.
- Do not copy credentials, sessions, cookies or personal data between providers.
- If no fresh healthy candidate exists, fail closed and surface NO_VERIFIED_REMOTE_PROVIDER.

## Provider onboarding status

@magnitodo.ia, @ultimatum.ia, @aria.ia, @apash.ia and @TRANSFORFER.IA remain requested architecture identities. Their authoritative endpoints, owners, authentication methods, API contracts, data classifications and capability proofs must be supplied or discovered from verified provider documentation before adapters can be connected. No endpoint or partnership is guessed.

## Verification

Run on the candidate branch: npm test, npm run verify and npm run security:secrets.

Also required before staging acceptance: network egress/SSRF tests, adapter contract tests against sandbox providers, tenant-isolation tests, timeout/circuit-breaker tests, browser/mobile parity and independent security review.

**Governance:** BUILD → VERIFY → RELEASE → SCALE. No merge, production deployment, provider authorization or external data transfer is included in this change.