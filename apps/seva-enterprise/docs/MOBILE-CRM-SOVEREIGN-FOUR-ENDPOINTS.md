# SEVA Mobile CRM Sovereign — four endpoint contract
Scope: additive dry-run security adapter only. NOT a production or public HTTP deployment.
Entry point: `mobileCrmRoute` in `mobile-crm-sovereign.mjs`.

| Method | Path | Scope | Effect |
|---|---|---|---|
| GET | /api/mobile-crm/v1/status | plan:read | Authenticated capability status |
| POST | /api/mobile-crm/v1/imports/preview | plan:create | Authorized source descriptor validation; zero records imported |
| POST | /api/mobile-crm/v1/sync/plan | plan:create | Device sync planning; zero writes |
| GET | /api/mobile-crm/v1/audit | audit:read | 503 until durable audit is connected |

Trusted `principal`, `tenantId` and `verifiedContext` must come only from server-side identity middleware. The plain verifiedContext flag is NOT authentication.
Import requests declare provenance and rights, but these statements must be corroborated against actual source credentials and lawful basis in the production integration. No SMS, WhatsApp, Meta, global people database, Stripe LIVE, checkout, scraping or remote phone access is activated.

Required gates before exposing endpoints: OIDC/JWKS + audience validation, server-side tenant grants, per-resource authorization, PostgreSQL RLS with cross-tenant adversarial tests, consent/source provenance, encrypted device storage, durable tamper-evident audit, rate limits, backups and restore drill, end-to-end QA and owner approval.

Local test: `node --test tests/seva-mobile-crm-sovereign.test.mjs`.
Any 4 endpoints here are a module contract, not evidence that external provider endpoints exist or work.
