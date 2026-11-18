# Central Consent Platform — Implementation Contract

**Scope:** SEVA and URBAN ONE  
**Status:** P0 domain ledger and migration scaffold; provider integration and deployment pending  
**Rule:** optional purposes are OFF by default. The essential-service category is not a user-toggleable blanket permission.

## Canonical purposes

- `analytics`: optional analytics, subject to the applicable legal basis.
- `personal`: optional personalization.
- `email`: promotional email.
- `mobile`: promotional SMS/WhatsApp; channel-specific legal checks remain mandatory.
- `partners`: specifically disclosed partner disclosures only; never a blanket partner authorization.
- `essential`: service operation/security/legal obligations only, assessed by purpose and lawful basis; not represented as consent.

## P0 API contract

The router integration must be mounted only behind a verified authentication adapter. The adapter must set a trusted `req.auth.userId` and scopes; client-supplied identity headers are not trusted.

- `GET /api/privacy/consent` — return the authenticated user's state for one allowlisted product.
- `PUT /api/privacy/consent` — apply partial, purpose-specific boolean choices and a notice version.
- `POST /api/privacy/consent/withdraw` — revoke one or more optional purposes.
- `GET /api/privacy/consent/audit` — return the authenticated user's audit history.

Required scopes: `privacy:read`, `privacy:write`. A caller may only read or mutate its own subject. Administrative access requires a separate audited support role and is not included in this phase.

## Storage and security

- Apply `db/migrations/20261118_central_consent.sql` to a durable, encrypted database.
- Back up and test restore before production.
- Restrict audit-table write access to the consent service; application users receive no direct database access.
- Add retention/deletion rules, key management, rate limits, CSRF protections for cookie sessions, and authenticated service-to-service calls.
- The SQLite reference ledger is suitable for isolated tests and local staging only until a durable production database adapter and backup/restore evidence are approved.
- Audit hash chaining is tamper-evidence, not a substitute for access control, immutable backups, or independent audit.

## Middleware contract

Every optional processing path must call the central authorization function immediately before processing. Missing identity, missing state, stale notice, unavailable ledger, or provider failure must fail closed. Consent must be scoped by user, product, purpose, and notice version.

Withdrawal must enqueue or synchronously propagate revocation to every downstream processor. No queue or provider integration is considered complete until retries, dead-letter handling, and reconciliation are tested.

## WordPress, SEVA and URBAN ONE

- WordPress must use the authenticated server-side user context and call the central API server-to-server. Never expose service credentials in browser JavaScript.
- SEVA and URBAN ONE must use the same canonical subject identity only where identity federation is verified; otherwise use explicit account linking.
- Each product must render the same preference taxonomy, but each user's selections remain product-scoped unless a lawful, explicit cross-product choice is designed and disclosed.
- Analytics tags, marketing dispatch, personalization, and partner exports must be gated at the server/provider boundary, not merely hidden in the UI.

## Release blockers

1. Verified authentication adapter and ownership tests.
2. Durable database adapter, encryption, backup and restore.
3. API route integration and OpenAPI contract.
4. WordPress plugin plus SEVA and URBAN ONE adapters.
5. Downstream revocation propagation and provider-specific integration tests.
6. Security, privacy/legal review and staging evidence.

No production rollout or GDPR certification is claimed by this implementation scaffold.
