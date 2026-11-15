# Runtime RBAC and audit tests — REQUIRED, NOT EXECUTED

These tests require a deployed TEST-only service and an isolated test identity provider. Do not run against LIVE.

1. Anonymous GET returns 401.
2. Authenticated user missing required scope returns 403.
3. Tenant A principal requesting tenant B resource returns 403 or privacy-preserving 404.
4. Spoofed tenant_id query/header never changes effective tenant.
5. Operator cannot read global audit; auditor only reads tenant-scoped, redacted events.
6. GET authorized produces append-only audit record with request_id and timestamp.
7. Audit sink outage denies protected reads (fail-closed).
8. POST/PUT/PATCH/DELETE return 405 or 404; no mutation occurs.
9. Response never contains token, API key, secret, or raw personal payload.
10. Rate limits and pagination enforce bounded queries.
11. No agent execution, payment, messaging, merge, or deploy endpoint reachable.
12. Test ID token issuer, audience, signature, expiry, scopes, role and tenant claims.

PASS only after evidence of actual HTTP assertions, logs and CI artifacts.
