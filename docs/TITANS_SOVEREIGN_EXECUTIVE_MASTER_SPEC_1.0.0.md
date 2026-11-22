# TITANS Sovereign — Executive Master Specification

**Version:** 1.0.0  
**Date:** 2026-11-22  
**Delivery:** one reviewable PR; no merge or production release included  
**Workspace scope:** requested; connector-created plugin scope is recorded separately and must not be inferred.

## Executive objective

Establish a governed, auditable operating framework for TITANS and the autonomous INSIDERS Finance Control model family. The framework covers manifest governance, partner onboarding, skill/plugin lifecycle, agent boundaries, financial reconciliation, EU governance, ML/LM controls, IAM, customer experience, and controlled release.

This specification does not certify legal compliance, activate integrations, create live financial access, or assert that agents are deployed.

## System boundaries

- **INSIDERS Finance Control:** ledger reconciliation, exception management, financial controls and audit evidence.
- **INSIGHTS:** metric definitions, source lineage, KPI reporting and executive decision support.
- **INSPIRE:** research, innovation and partner/customer opportunity workflows.
- **EUROPEAN EU:** applicable EU/EEA legal and operational requirements, assessed by actual role and use.
- **ML / LM:** model lifecycle, evaluations, versioning, monitoring, human oversight and rollback.
- **SLE / LAS / LSE:** preserved as owner-defined labels. Their expansions and responsibilities remain TBD until approved.
- **IAM:** identity, authorization, tenant isolation, secrets and audit.
- **TITANS COMMAND / ICON AGENTS:** orchestration and registry only; no agent inherits permissions implicitly.

## Required control planes

1. **Identity plane:** named owner, authenticated identity, MFA where supported, scoped authorization, separation of duties.
2. **Data plane:** data inventory, purpose, lawful basis, minimization, retention, provenance, deletion and export controls.
3. **Integration plane:** provider, endpoint, environment, connector identity, scopes, webhook verification, idempotency, rate limits and failure handling.
4. **Finance plane:** immutable source records, reconciliation windows, gross-to-net bridge, exception classes, approved tolerances and audit.
5. **Model plane:** model/provider/version, evaluation, limitations, monitoring, human review and rollback.
6. **Experience plane:** accessibility, localization, journey completion, support, complaint and satisfaction metrics.
7. **Release plane:** CI evidence on exact SHA, security review, rollback, approval record and controlled rollout.

## Finance reconciliation contract

Minimum record fields: source_system, legal_entity, account_reference (non-secret), currency, timezone, source_record_id, transaction_id, payment_id, refund_id, dispute_id, fee_id, payout_id, settlement_id, event_at, booked_at, settled_at, gross_amount, tax_amount, fee_amount, refund_amount, net_amount, status, match_key, reconciliation_batch_id, evidence_reference.

Rules:
- Never mix currencies or reporting windows without explicit conversion methodology.
- Preserve source values; derived values must be reproducible.
- Deduplicate using provider identifiers and documented idempotency keys.
- Do not force-match; classify unmatched, duplicate, pending, failed, reversed and disputed records.
- Reconciliation PASS requires opening + movements = closing and source/settlement control totals within owner-approved tolerances.
- A discrepancy is an investigation item, never an instruction to move money.
- Do not store full card data, bank credentials, secrets or unnecessary personal data.

## Partner onboarding record

Required fields: partner_id, legal_name, official_domain, relationship_owner, purpose, jurisdiction, data_categories, requested_scopes, granted_scopes, environment, DPA/contract status, consent/lawful-basis review, retention, security review, status, evidence_urls, last_verified_at.

States: DISCOVERED → IDENTITY_VERIFIED → RISK_REVIEW → PERMISSIONS_APPROVED → TESTED → ACTIVE. Use BLOCKED or REJECTED when evidence or approvals fail. Never skip a state based on a marketing claim.

## Agent and plugin registry

Each agent/plugin must declare owner, purpose, version, tools, scopes, allowed data, prohibited actions, environment, approval gates, audit destination, failure behavior and deactivation owner. Proposed, installed, connected, authorized, tested and production-active are distinct states.

## Independent verification plan

- Validate JSON manifest and frontmatter.
- Test skill metadata and required policy clauses.
- Check repository diff for secrets and prohibited credential patterns.
- Run unit/contract tests and CI on the exact PR head SHA.
- Review permissions and branch protection.
- Verify no external side effects, merge or deployment occurred.
- Capture test artifacts, exact SHA and timestamp.

## Acceptance / release gates

| Gate | Acceptance evidence | Default state |
|---|---|---|
| Manifest | schema-valid, versioned, owner assigned | BLOCKED until verified |
| Partner onboarding | identity, contract, scopes, evidence | NOT VERIFIED |
| Finance | reconciled source records and approved tolerances | NOT VERIFIED |
| IAM | least privilege, tenant isolation, audit | NOT VERIFIED |
| ML/LM | evaluation, limitations, oversight, rollback | NOT VERIFIED |
| EU governance | role/use-specific legal assessment | NOT VERIFIED |
| Customer experience | accessibility and end-to-end journey evidence | NOT VERIFIED |
| CI | passing checks on exact PR SHA | NOT VERIFIED until run |
| Release | named approval and rollback | NOT AUTHORIZED |

## Change control

All changes are made on an isolated feature branch and submitted in one PR to `main-@URBAN-ONE`. The PR remains open for review. No merge, deployment, partner invitation, financial operation, or production data transfer is included in this delivery.
