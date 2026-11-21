# SEVA SUPER APP — Unified Network & CRM Blueprint

**Status:** BUILD specification / NOT a production implementation  
**Date:** 2026-11-21  
**Governance:** BUILD → VERIFY → RELEASE → SCALE  
**Principle:** VERIFY FIRST. AUTHORIZE BEFORE ACTION.

## Product objective

Deliver one mobile-first SEVA experience for citizens, professionals, SMEs, businesses and institutional stakeholders. Core entry and core networking/CRM features are free to end users. Paid infrastructure and optional third-party provider fees are separate operating costs and must not be silently enabled or passed through.

The product unifies navigation and experience; it does not merge unrelated legal entities, provider accounts, credentials, financial ledgers or domain databases.

## Unified product areas

1. **Identity & onboarding** — personal, professional, SME and stakeholder profiles; verified fields are distinguished from self-declared fields; account recovery and deletion.
2. **Address book** — manual entry and user-initiated imports; source/provenance retained; duplicate review; export and deletion.
3. **Connections network** — search only profiles explicitly opted into discovery; request-to-connect workflow; accept, reject, block and revoke; private contact details are not disclosed before acceptance and purpose-specific consent.
4. **SME & citizen directory** — organization pages, roles, service categories, geography and public contact channels; publication controlled by the profile owner.
5. **CRM** — contacts, organizations, relationship history, tasks, follow-ups, opportunities, service cases and notes; every record has an owner and tenant boundary.
6. **Customer engagement** — consented invitations, one-to-one messages and service updates; no bulk messaging or marketing automation until provider scopes, consent, unsubscribe and rate limits are verified.
7. **Customer service** — cases, assignment, status, SLA, attachments with restricted access, resolution and customer feedback.
8. **Insights & analytics** — source-backed counts and funnels; distinguish observed, inferred and estimated metrics; no cross-tenant analytics leakage.
9. **AI assistants** — optional drafting, classification and summaries; human confirmation for external actions; provider and model status shown truthfully.
10. **Admin & governance** — RBAC, audit, consent history, retention, export, deletion, abuse reporting and incident controls.

## Contact exchange and consent rules

- A contact record is private by default and visible only to its owner and authorized workspace members.
- Public discoverability is an explicit, revocable profile setting, separate from permission to share an email address or phone number.
- A connection request exposes only the minimum public profile fields.
- Contact exchange requires acceptance by both parties and a separate confirmation for each private channel shared.
- Consent is purpose-specific, timestamped, versioned, attributable and revocable. Unknown consent is never treated as granted.
- Importing a CSV/vCard or connecting Google Contacts does not grant permission to contact, market to, enrich or publish those people.
- OAuth access is per account, least-privilege and revocable. No scraping, password capture, silent sync or hidden invitations.
- Deletion and consent withdrawal propagate to derived indexes, exports and queued outbound work, subject to documented legal retention requirements.

## Canonical data boundaries

SEVA remains its own application and data domain. Do not merge SEVA records with KKUBERA, URBAN ONE, SYNAPSY or other projects. Cross-product links require an explicit identity mapping, purpose, owner approval and auditable data contract. Do not copy credentials or payment data between products.

### Proposed relational model (PostgreSQL target)

- `users`, `user_sessions`, `organizations`, `organization_memberships`
- `profiles`, `profile_visibility`, `contacts`, `contact_sources`
- `connection_requests`, `connections`, `contact_shares`
- `consent_records`, `consent_purposes`, `consent_withdrawals`
- `crm_activities`, `tasks`, `opportunities`, `service_cases`
- `engagement_events`, `notification_preferences`, `suppression_records`
- `audit_events`, `outbox_events`, `idempotency_keys`
- `analytics_daily_rollups` (derived, minimized and tenant-scoped)

Every tenant-owned row carries a server-derived `tenant_id`; user identity and role are never trusted from a client-supplied field. Enforce PostgreSQL Row Level Security and test cross-tenant denial at the database and API layers.

## API contract (proposed, not yet implemented)

- `GET/POST /api/v1/contacts`
- `GET/PATCH/DELETE /api/v1/contacts/:id`
- `POST /api/v1/contacts/import/preview` and `POST /api/v1/contacts/import/commit`
- `GET /api/v1/directory` (opt-in profiles only)
- `POST /api/v1/connections/requests`, `POST /api/v1/connections/requests/:id/accept`, `POST /api/v1/connections/requests/:id/reject`
- `POST /api/v1/contact-shares` and `DELETE /api/v1/contact-shares/:id`
- `GET/POST /api/v1/crm/activities`, `GET/POST /api/v1/crm/tasks`
- `GET/POST /api/v1/service-cases`, `PATCH /api/v1/service-cases/:id`
- `GET /api/v1/insights/overview`
- `GET/POST /api/v1/consents`, `POST /api/v1/consents/:id/withdraw`
- `GET /api/v1/privacy/export`, `DELETE /api/v1/privacy/account`

All writes require authentication, CSRF/origin protections where applicable, server-side authorization, input validation, rate limits, audit and idempotency for retried operations. Return minimal fields and never expose internal identifiers unnecessarily.

## DBRELAY and migration plan

The current documented DBRELAY implementation is a same-server SQLite change feed, not a cloud multi-tenant database or a verified cross-device relay. Keep it intact as the baseline until a migration is rehearsed.

1. Inventory SQLite schema, migrations, indexes, triggers, foreign keys and all read/write call sites.
2. Create versioned PostgreSQL migrations and an explicit mapping; do not run destructive or in-place schema changes.
3. Add tenant-aware repository interfaces and PostgreSQL RLS policies.
4. Build an idempotent, dry-run migration that reports counts, rejected rows, duplicates and checksum reconciliation without transferring production personal data.
5. Test with synthetic tenants and records, including adversarial cross-tenant access.
6. Verify transactional outbox ordering, retry, duplicate suppression, dead-letter quarantine and replay receipts.
7. Take a verified backup; restore into a separate database; compare row counts, checksums, foreign keys and application behavior.
8. Run a controlled cutover with a rollback path and a read-only reconciliation window.
9. Only then configure the production service, durable database, monitoring, off-site backup and recovery objectives.

The existing Render database is a Free PostgreSQL instance with an expiry date of 2026-11-29. It is not an approved permanent production database. No paid service, migration, database deletion or provider switch is authorized by this specification.

## Free-to-use policy

- No fee to create an account, maintain a basic profile, search opt-in public profiles, request/accept connections, exchange consented contact details, or use basic CRM/service-case functionality.
- Optional paid integrations or premium business features must be clearly separated and never block core free access.
- Infrastructure spending is an operator cost. Do not activate paid hosting or databases until the owner confirms the recurring budget and limit.

## UI and accessibility

- One responsive shell, one navigation system, one design token set and consistent light/dark themes.
- Mobile-first layouts, keyboard navigation, visible focus, semantic landmarks, accessible forms and WCAG 2.2 AA target.
- Shared visual language across SEVA Studio, People & Connections, CRM, Service, Insights, DBRELAY and Admin.
- Every module displays truthful status: local prototype, connected, unavailable, pending consent or verified live.
- Never present localStorage as a secure cloud address book. Do not store sensitive contact data in unencrypted browser storage.

## Release acceptance — all required

- Two or more synthetic users across at least two tenants; cross-tenant read/write tests fail closed.
- Contact import preview, duplicate resolution, export and deletion verified.
- Directory visibility opt-in and private-field sharing require separate acceptance.
- Connection request/accept/reject/block/revoke tested end to end.
- Consent audit and withdrawal stop subsequent queued engagement.
- CRM activity/task/case workflows verified across roles.
- Insights reconcile to source records and respect tenant boundaries.
- PostgreSQL RLS, backup/restore, migration reconciliation and rollback independently verified.
- HTTPS production runtime, monitoring, alerting and incident response verified.
- Browser tests, accessibility tests, Android/mobile acceptance and privacy/security review pass on the exact release commit.
- Public anonymous access, terms, privacy notice, support channel and data-retention policy are published.
- Release owner explicitly approves the exact commit and production target.

## Current evidence and known blockers

- Latest inspected Vercel preview commit: `f0130caaf4966387524f81b39f5bea2b5621e8b9`; preview state READY, SSO protection enabled.
- The deployed preview source contains three static files: `src/index.html`, `src/studio.html`, `src/seva-titans-hub.html`.
- The People & Browser hub currently stores contacts in browser `localStorage`; its own UI warns that storage is unencrypted. It does not submit or synchronize contacts to a backend. Google Contacts accounts are shown as not connected.
- No active SEVA Render web service was found in the inspected workspace.
- Existing `seva-dbrelay` PostgreSQL is Free and expires 2026-11-29; current SEVA DBRELAY source documents SQLite as the server source of truth.
- Therefore the Super App CRM/network is a BUILD target, not a verified multi-user cloud service. Production DB deployment and public release remain BLOCKED.

**Next execution order:** unified UI shell → synthetic-only CRM/network API → tenant/auth/consent security tests → durable PostgreSQL migration → backup/restore → browser/mobile acceptance → production release review.
