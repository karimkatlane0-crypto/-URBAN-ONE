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

The in-memory reconciliation ledger is a deterministic test fixture only. It supports simulated settled-payment and refund events, idempotency keys, duplicate detection, integer minor-unit amounts, currency consistency, refund caps, append-only ledger entries, and a SHA-256-linked audit sequence.

It is not connected to Stripe, banks, webhooks, databases, queues, or production accounts. It does not process real payments. Durable storage, provider signature verification, chargebacks, settlement matching, operational replay, and external audit export are separate acceptance gates.

## Verification and release

1. BUILD: implement within an isolated branch.
2. VERIFY: exact-head CI, unit tests, security checks, Android API 24/36, browser route checks, accessibility and independent evidence review.
3. RELEASE: explicit human approval; no automatic merge or deployment.
4. SCALE: only after verified release.

## Reversibility

All implementation changes are isolated in a pull request. No production configuration, secrets, external account, provider setting, payment, webhook, partner approval, or live service is changed by this scaffold. Rollback is by closing the unmerged PR or reverting its commits. Preserve the evidence and do not rewrite shared history.
