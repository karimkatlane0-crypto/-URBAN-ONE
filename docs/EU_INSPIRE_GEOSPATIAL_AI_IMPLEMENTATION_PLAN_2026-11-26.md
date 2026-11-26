# EU INSPIRE + AI/ML/LLM + DevSecOps — implementation specification

**Status:** BUILD specification; not evidence of deployed or certified services  
**Date:** 2026-11-26  
**Parent programme:** OMNIA — TITANS, SEVA, SYNAPSY, KKUBERA, URBAN ONE  
**Target geography:** EU-27 first; UK and Switzerland through separately reviewed country adapters  
**Implementation rule:** source rights and authorization before ingestion; exact-head verification before release

## 1. Objective and non-goals

Deliver a governed European geospatial-data foundation that can serve KKUBERA, URBAN ONE Maps, civic-service discovery and approved AI workflows. Reuse shared infrastructure, but keep product tenants, customer records, legal purposes, permissions and payment ledgers separate.

This specification does not authorize bulk harvesting, paid data purchases, public redistribution, personal-location tracking, partner invitations, external broadcasts, production deployment or certification claims.

## 2. INSPIRE / EU data-source alignment

The source catalogue must not depend on the retired central INSPIRE Geoportal or central INSPIRE Reference Validator. As of the 2026 transition, discovery and vocabulary workflows must use the current EU horizontal services and EU Vocabularies. Metadata exchange should support GeoDCAT-AP. Keep the open-source INSPIRE validator available as a separately versioned CI tool where applicable.

Required source registry fields:

- source_id, publisher, country, dataset title, abstract, theme, language and authoritative landing page;
- dataset identifier, metadata URL, metadata standard/profile and metadata last-modified timestamp;
- licence/terms URI, permitted purposes, redistribution rules, attribution text and commercial-use status;
- access method (download, catalogue, OGC API Features, WMS/WFS or other documented interface);
- coordinate reference systems, axis order, geometry types, spatial/temporal coverage and update cadence;
- personal-data classification, legal basis assessment, DPIA trigger, retention and onward-transfer constraints;
- ingestion owner, adapter version, last successful fetch, checksum, validation receipt and deprecation status.

Every dataset must pass a source-and-licence gate before automated ingestion. An open endpoint is not, by itself, permission to republish its contents.

## 3. Interoperable ingestion architecture

`Source Registry → Licence & Purpose Gate → Country Adapter → Fetch/Import → Quarantine → Metadata Normalizer → Geometry/Schema Validator → Provenance Ledger → PostGIS → Versioned API → Web/Mobile`

Adapters must be isolated by provider and country. Each adapter exposes a documented contract: `discover`, `fetch`, `normalize`, `validate`, `checkpoint`, `health`. Retries must be bounded and idempotent. A failed validation quarantines the batch and must not overwrite the last known-good dataset.

Preferred standards:
- INSPIRE data specifications and themes where applicable;
- GeoDCAT-AP for catalogue metadata exchange;
- OGC API Features for feature access, with explicit CRS and axis-order handling;
- OGC API Records / catalogue capabilities where supported by the source;
- GeoPackage or documented open geospatial formats for offline exchange;
- OpenAPI for application-facing REST contracts.

Do not assume that every national provider implements the same profile or exposes the same fields. Maintain a country/provider conformance matrix and explicit mapping exceptions.

## 4. Canonical spatial data model

Keep separate records for:
- `dataset`, `dataset_version`, `source_record`, `licence_grant`, `ingestion_run`, `validation_issue`;
- `country`, `administrative_area`, `address`, `building`, `unit`, `parcel`, `road_segment`, `poi`, `public_service`;
- `property`, `listing`, `occupancy`, `transaction_state`, `availability_slot`, `appointment`;
- `geometry`, `coordinate_reference`, `provenance_event`, `consent_record`, `access_policy`.

Never conflate a parcel, building, unit, property, listing or transaction. Do not infer sale, rent, occupancy, ownership or availability from a stale listing, image, model output or absence of a record.

Spatial records must store the source CRS, normalized CRS, geometry type, precision class, transformation method and validation status. Use a declared project CRS for indexed geometry and preserve the original source geometry/coordinates. Address geocoding must be labelled EXACT_AUTHORIZED, APPROXIMATE or UNKNOWN; exact coordinates require a public or otherwise authorized source and documented provenance.

## 5. Data quality, provenance and scrubbing

Every imported feature carries dataset/version/source identifiers, source timestamp, ingestion timestamp, licence reference, adapter version, transformation lineage and validation result. Use stable source identifiers where available; deduplicate only with a documented match rule and retain collision candidates for review.

Minimum automated checks:
- schema/profile conformance, required metadata and controlled vocabulary validity;
- geometry validity, empty/null geometry, coordinate bounds, CRS and axis-order checks;
- duplicate identifiers, referential integrity, temporal consistency and update regressions;
- licence/purpose enforcement and personal-data field minimization;
- checksum and immutable batch receipt; quarantine and rollback on failed validation.

Scrubbing must be deterministic and reversible only where authorized. Never remove provenance, licence conditions or required attribution while cleaning data.

## 6. AI / ML / language-model controls

AI services consume only records authorized for the requesting tenant, purpose and user scope. Retrieval must filter access before ranking or model context construction. The model must not be used as an authority for legal status, ownership, occupancy, transaction state, live availability or accessibility.

Each response/result must distinguish:
1. verified source fact;
2. official contextual data;
3. computed estimate;
4. model inference;
5. missing or stale information.

Required controls include model/provider/version registry, prompt and tool policy, retrieval provenance, PII scrubbing, bounded context, evaluation dataset, relevance and bias tests, human review for consequential decisions, output retention policy and kill switch. No private user data or restricted source content may be sent to a model provider without an approved legal basis, purpose, connector scope and data-processing configuration.

ML ranking must be reproducible against a versioned Golden Set. Record features, weights/model version, ranking explanation and uncertainty. Monitor drift and disparate error rates across geography and source coverage; do not optimize for a single country's data density in a way that silently disadvantages under-covered regions.

## 7. GPS, walking and civic availability

GPS is opt-in, purpose-bound and precision-minimized. Provide manual location entry as an alternative. Do not retain precise location histories by default. Any location sharing, third-party routing request or analytics use requires a separate documented purpose and authorization.

Walking routes must use a licensed/authorized pedestrian network and state the source, network version, timestamp and known coverage limits. Accessibility claims (step-free, gradients, crossings, surface, lighting) require source evidence; otherwise mark UNKNOWN. Estimated travel time must be labelled as an estimate and must not be represented as a guarantee.

Civic or commercial availability must be time-bound and carry provider/source, last_verified_at, timezone, capacity/slot and verification state. A directory entry or cached timetable is not live availability.

## 8. Security and DevSecOps acceptance

- Deny-by-default IAM; server-derived identity and tenant; explicit least-privilege scopes.
- Separate ingestion, operator, partner, model and end-user service identities.
- Secret scanning, dependency and container scanning, SBOM, provenance attestations and signed release artifacts.
- SAST, dependency review, API authorization tests, rate limits, abuse tests and audit logging.
- PostgreSQL migrations versioned; PostGIS extension/version pinned; backup, restore and data-integrity drills required.
- Tenant isolation tests cover API, database rows, files, jobs, cache keys, vector retrieval and webhooks.
- CI runs against the exact PR head. Changes to an adapter or resolver must trigger its integration and security tests.
- Rollback procedure must restore both schema compatibility and last known-good data checkpoint.
- Production deploy is manual and requires explicit authorization after evidence review.

## 9. Partner and creator onboarding

Partner Skill Creator output is a draft manifest only until a sandbox execution gateway exists and is independently verified. Each skill manifest must include owner, purpose, tenant, environment, allowed tools, input/output data classes, rate and cost limits, timeout, retention, revocation path and human-approval requirements.

Onboarding gates: verified partner identity → contract/licence and purpose → scoped test credentials → isolated sandbox → negative authorization tests → security review → human approval → limited pilot → monitoring. No automatic invitation, account creation, data sharing, message broadcast, signing, payment or production tool execution is implied.

Worldwide broadcast is a content-distribution capability, not an unrestricted data export. Before any broadcast: identify audience and channels, prove rights to every asset/data item, document lawful basis and consent where applicable, approve language/localization, suppression/opt-out, budget and sender identity, then require a separate send authorization and provider receipt.

## 10. Unresolved terminology and standards register

The following user-supplied labels are preserved but intentionally not expanded because their intended meanings are not yet established: **SLE, LSE, LAS, CO, GITA**. Record each definition, owner, domain, required evidence and acceptance test before making it an API field, role, metric, service level or compliance claim. Do not substitute guessed expansions.

IEEE, ISO and OGC references must be selected per concrete interface or control. Alignment is not certification. Record the exact standard number, edition, applicable clauses, implementation evidence and independent assessor where certification is sought.

## 11. Delivery sequence and measurable gates

**G0 — Inventory:** enumerate sources, licences, countries, provider access and data classes. Exit: every candidate source has an owner and legal/terms disposition.

**G1 — One-country pilot:** select one EU country and a small, non-personal, redistributable dataset. Exit: repeatable ingestion, metadata normalization, geometry validation, provenance receipt and deletion/rollback test.

**G2 — Platform:** PostGIS schema, migrations, API, tenant isolation, observability, backup and restore. Exit: exact-head CI and independent isolation/restore evidence.

**G3 — Maps and civic services:** walking network and availability adapters. Exit: source freshness and coverage metrics; unknown values remain explicit.

**G4 — AI:** retrieval/ranking only over authorized data. Exit: Golden Set evaluation, bias/relevance review, provenance in outputs and kill-switch test.

**G5 — Partner/creator pilot:** synthetic data in isolated sandbox. Exit: least-privilege and revocation tests, audit receipt and human approval. No live partner access by default.

**G6 — Expansion:** country-by-country legal, source and technical review; EU first, then UK and Switzerland as separate jurisdictions.

Suggested pilot targets (targets, not achieved results): provenance completeness ≥99%; valid CRS/precision metadata 100%; source freshness SLA ≥95%; unauthorized dataset publication zero; cross-tenant leakage zero; reviewed Golden Set deduplication precision ≥98%; false live-availability claims zero in audited outputs.

## 12. Required evidence register

For each gate store: requirement ID, repository commit, source/provider, test command, test result, timestamp, environment, artifact/checksum, reviewer, unresolved exceptions and decision. A green unit-test suite does not prove source licensing, hosted runtime, production IAM, provider certification or legal compliance.

**Release decision:** HOLD until source rights, security, data quality, exact-head CI, hosted restore/isolation, privacy review and action-specific approval all pass.
