# KKUBERA — Property Intelligence ingestion core

## Build scope

This increment adds a deterministic, fail-closed ingestion boundary for property records received from operator-authorized APIs, licensed feeds, or open-data distributions. It is deliberately separate from tourism/hospitality inventory.

Implemented in this branch:
- source authorization gate (approval status, review age, agreement reference, permitted purposes, access method, HTTPS host allowlist);
- normalized sale/rent property records with EUR cents, source URL, observation timestamp and provenance;
- rejection of stale/future observations, unsafe URLs, invalid prices, unapproved purposes and duplicate provider IDs within a batch;
- stable SHA-256 identifiers and conservative cross-source identity matching when street + civic number are available;
- latest-observation selection for exact identity duplicates;
- owner personal identity fields are not copied to the public normalized record;
- deterministic unit tests.

## Explicitly not implemented

This module does not fetch websites, call provider APIs, schedule jobs, persist records, create database migrations, geocode properties, run an LLM, or connect a real MLS. It is a tested ingestion core, not a running background crawler or live inventory service. PR #141 remains a separate, disabled MLS adapter and must not be treated as connected.

## Source onboarding contract

Each source requires a human-reviewed record:
- stable source ID;
- method: `api`, `licensed_feed`, or `open_data`;
- HTTPS hostname allowlist;
- current authorization status and review timestamp (maximum age 90 days);
- non-secret agreement/licence reference;
- explicitly permitted purposes: `sale`, `rent`.

The provider's terms, licence and agreement control. A source is not approved merely because it is publicly reachable. No login/paywall/anti-bot bypass or unauthorized scraping is permitted. Keep confidential agreements and credentials outside the repository.

## Normalized record

Minimum fields: provider external ID, purpose, country, city, title, source URL, observed timestamp, EUR amount in integer cents. Optional fields include property type, locality, approximate area and street/civic number where the source permits publication. Owner name, personal email, phone, tax identifiers and identity documents are not exported.

## Next release gates

1. Review and merge this feature branch after CI.
2. Obtain source-by-source rights evidence and configure the approved registry in a private secret/config store.
3. Implement PostgreSQL schema + versioned migrations, tenant isolation, unique provider keys and provenance/audit history.
4. Implement idempotent scheduler/queue with bounded retries, rate limits, backoff, provider deletion/expiry handling and a kill switch.
5. Add provider adapters only for sources with approved API/feed documentation and rights.
6. Add real MLS provider contract, tenant grants, embargo rules and provider-specific E2E tests before enabling PR #141.
7. Run integration, restore, security and real-device tests; then request separate release authorization.

## Status

BUILD CORE: source committed to feature branch when GitHub confirms the file commits.
TESTS: added; CI result pending.
BACKGROUND INGESTION: not active.
LIVE SOURCES / REAL LISTINGS: none asserted by this increment.
DEPLOYMENT / MERGE: not performed.
