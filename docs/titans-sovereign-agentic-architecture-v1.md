# TITANS Sovereign Agentic Architecture v1.0

**Status:** BUILD / TEST scaffold. Not a production agent runtime, provider integration, certification, or release.

## Operating contract

TITANS coordinates bounded specialist roles: Research, Analytics, Copilot, Transformer, Civic, Audit, and Orchestrator. Role names identify responsibilities; they do not imply connected accounts, autonomous execution, or provider authorization.

Every task starts queued, records its evidence references, and declares that external side effects are disabled. A transition to approved requires an explicit human approval flag. Approval is not execution and does not authorize a release.

## Decision intelligence

Every decision brief carries both directions of analysis:

- **Forward:** gather evidence, compare alternatives, assess risks, prepare a recommendation.
- **Backward:** start from the measurable goal, identify prerequisites, acceptance checks, and accountable ownership.

Sources are classified as primary, secondary, or unverified. Non-primary sources remain visible as unresolved evidence. The decision output remains HUMAN_DECISION_REQUIRED; releaseAuthorized is always false.

## Civic GPS and walking maps

The civic route planner accepts coordinates only after explicit consent. It validates latitude/longitude and route-stop identifiers. This module does not read device GPS, run background tracking, or transmit location. A future native GPS adapter requires a separate permission review, retention policy, accessibility review, and user-visible controls.

## Reconciliation TEST boundary

The original in-memory reconciliation ledger remains a deterministic fixture. A separate persistent TEST adapter (`services/titans/persistent-test-reconciliation.mjs`) uses Node's built-in SQLite driver, explicit TEST-only initialization, transactional event ingestion, unique event/idempotency keys, integer minor-unit amounts, currency checks, settlement-before-refund ordering, cumulative refund caps, balanced two-line journal transactions, and a SHA-256-linked audit sequence. It supports integrity verification and a deterministic aggregate report.

The persistent adapter writes only to a caller-supplied local SQLite file in TEST; it is not connected to Stripe, banks, external webhooks, provider APIs, queues, or production accounts. It does not process real payments. The hash chain is tamper-evident, not legally immutable, and does not establish independent audit assurance. The journal accounts are illustrative TEST accounts, not a chart of accounts or statutory accounting opinion. Provider signature verification, chargebacks, external settlement matching, operational replay, encrypted backups, retention controls, and independent audit export remain separate acceptance gates.

## Verification and release

1. BUILD: implement within an isolated branch.
2. VERIFY: exact-head CI, unit tests, security checks, Android API 24/36, browser route checks, accessibility and independent evidence review.
3. RELEASE: explicit human approval; no automatic merge or deployment.
4. SCALE: only after verified release.

## Reversibility

All implementation changes are isolated in a pull request. No production configuration, secrets, external account, provider setting, payment, webhook, partner approval, or live service is changed by this scaffold. Rollback is by closing the unmerged PR or reverting its commits. Preserve the evidence and do not rewrite shared history.


## Corrective-cycle boundaries (2026-11-20)

- Android API 24 previously failed while resolving Gradle/Maven dependencies before emulator execution; API 36 completed. A bounded retry is being added without changing dependency versions.
- The current browser smoke covers three public portals, locale selection, JavaScript errors, and mobile viewport. Automated WCAG checks and keyboard-focus checks are being added; manual assistive-technology validation remains a separate gate.
- SYNAPSY webhook proof requires its administrator to configure the repository environment secret. No secret value is handled by this project change.
- Branch protection was observed disabled on the default branch. Enabling it is an administrative governance change and is not performed by this PR.
