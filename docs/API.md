# API Contract — v7.0.0 RC1

## GET /health
Public liveness only. Does not expose credentials, provider configuration or private data.

## GET /api/universal/status
Returns fail-closed status for AI providers and relay. This is configuration state, not a promise of live-provider functionality.

## POST /api/universal/prepare
Prepares a sanitized, provenance-hashed envelope. Requires authenticated user context, RBAC scope `prepare:provider`, explicit consent, purpose, scope and source reference. It does not execute a provider request.

## High-risk actions
Payments/PIS, outbound communications and privileged DB writes are separate execution gates. They must never be inferred from a successful `prepare` response.
