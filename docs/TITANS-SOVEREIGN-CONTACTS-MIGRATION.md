# TITANS — Sovereign Contacts Migration

**Status:** BUILD implementation candidate; VERIFY pending.  
**Issue:** [#222](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/222)  
**Governance:** BUILD → VERIFY → RELEASE → SCALE.

## Scope

This module provides provider-neutral file portability and a transactional migration engine. It does not connect to Google, Exchange, a CRM, or any network service. The user must export contacts from the official Google Contacts interface and explicitly upload the file to an authorized application.

Google Contacts is the preferred source. Exchange is rejected by default. No Exchange fallback, automatic background synchronization, or account linking is implemented.

## Data flow

1. User obtains a CSV or vCard export from Google Contacts.
2. User uploads the file to a trusted, authenticated application.
3. The application parses supported fields and marks imported consent as `unknown`.
4. A dry-run plan reports inserts, duplicates, and cross-key conflicts.
5. The user reviews the plan and confirms its exact digest.
6. A tenant-scoped transactional adapter snapshots the destination and applies inserts only.
7. A migration receipt records the backup reference and inserted source IDs.
8. Rollback requires a separate explicit confirmation and an adapter restore operation.

## Safety invariants

- Consent and right-to-use confirmation are required even to create a migration plan.
- The core does not infer marketing consent from a contact import.
- Duplicate records are never silently overwritten.
- Ambiguous email/phone matches are conflicts and block apply.
- The engine only inserts; it never updates or deletes contacts.
- A failed transaction invokes rollback.
- A committed migration is reversible only when the adapter provides and successfully executes a tested `restoreMigration` operation.
- No real contacts are used in automated tests.
- No OAuth token, provider credential, or personal contact data is written to logs by this module.

## Adapter contract

The application adapter must provide tenant isolation, authorization, encrypted durable backups, and a database transaction implementation:

- `snapshot()`
- `begin({ migrationId, backupRef })`
- `insert(record, { migrationId, sourceId })`
- `commit()`
- `rollback()`
- `restoreMigration(migrationId, backupRef)`

The module is not wired to the public server. A production adapter must be separately reviewed for authentication, tenant/RLS isolation, concurrency, retention, backup encryption, audit durability, and restore correctness.

## Supported portable fields

`givenName`, `familyName`, `email`, `phone`, and `company`. Unsupported provider fields are not silently claimed as preserved. CSV and vCard imports set consent to `unknown`.

## Verification

Run:

```sh
node --test tests/sovereign-contacts-migration.test.mjs
```

This is a local test instruction, not evidence that CI has run. Google People API OAuth integration, provider quota handling, real-account authorization, encrypted backend storage, legal review, manual accessibility checks, and an independently witnessed restore test remain open gates.

## Release boundary

No merge, deployment, live sync, real-contact migration, OAuth activation, or release is authorized by this candidate.
