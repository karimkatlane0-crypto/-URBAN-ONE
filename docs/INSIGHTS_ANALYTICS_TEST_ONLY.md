# @INSIGHTS.ai — TEST-only analytics core

**Status:** BUILD candidate. Not provider-connected, not production-certified, and not released.

## Scope
- Aggregate match, visit-request, captured-payment, refund, cancellation and no-show events.
- Enforce one tenant per ledger instance.
- Require explicit consent for the exact purpose `insights:aggregate:test`.
- Accept only allow-listed, non-personal event fields.
- Apply event-ID idempotency and reject conflicting replays.
- Reconcile partial refunds against a captured payment in the same currency; reject over-refunds.
- Produce aggregate funnel and net-money metrics in integer minor units.
- Maintain an append-only in-memory SHA-256 audit chain with a verifier.

## Safety boundaries
- Synthetic/test events only. The module has no provider SDK, network call, persistence adapter, CRM write, contact import, or payment execution.
- No email, phone, name, address, bank details, credentials, or arbitrary event metadata are accepted.
- Tenant identity is mandatory and cross-tenant events are rejected.
- Consent is checked when the in-memory ledger is created. A new ledger must be created for a different tenant or consent purpose.
- The audit chain is in-memory only; it is not durable evidence and must not be described as a production ledger.
- Currency amounts are integer minor units; no floating-point money arithmetic is used.

## Local verification
Run:

```sh
node --test tests/insights-analytics.test.mjs
```

The repository-wide suite is separately required before merge consideration. No merge, deployment, provider connection, LIVE payment, or RELEASE is part of this BUILD change.
