# SEVA UNICO ENTERPRISE — Full-stack flow register
Date: 2026-11-13. Status: proposed control contracts; not live execution evidence.

## End-to-end contract
FRONTEND → API → BACKEND → DATABASE → EVENT → FOLLOW-UP → AUDIT.
Each flow requires: flow_id, tenant_id, actor_id, correlation_id, idempotency_key where relevant, timestamp, source_version, consent/legal basis, retry policy, failure handling, audit_event_id, owner, test reference and release gate.

| ID | Trigger/UI | API/backend | Data/event | Follow-up and audit | Gate |
|---|---|---|---|---|---|
| FLOW-01 | Onboarding account | authenticated registration/session | user/session + account.created | confirmation; consent ledger | TEST E2E REQUIRED |
| FLOW-02 | CRM contact import | authorization and dedupe | contact + contact.imported | task scheduling; opt-out | TEST E2E REQUIRED |
| FLOW-03 | Lead/customer inquiry | authenticated CRM endpoint | lead + lead.created | owner assignment and SLA timer | TEST E2E REQUIRED |
| FLOW-04 | Checkout TEST | validated Stripe price and customer | checkout + payment.pending | await signed webhook, no premature access | TEST E2E REQUIRED |
| FLOW-05 | Stripe webhook TEST | signature, idempotency, entitlement | payment.succeeded/failed | provision/revoke only on verified status; audit | TEST E2E REQUIRED |
| FLOW-06 | Subscription management | owned customer portal | subscription.updated/canceled | renewal/cancellation notices | TEST E2E REQUIRED |
| FLOW-07 | SEPA bank transfer | bank order and reconciliation | bank.order.pending/settled | grant access only on independent settlement proof | TEST E2E REQUIRED |
| FLOW-08 | TITANS plan | authenticated agent planning | agent.plan.created | human approval and audit; execute stays fail-closed | NO LIVE EXECUTE |
| FLOW-09 | GMAS matching | authorized catalog and scoring | match.preview.created | human review, no unauthorized MLS feeds | TEST E2E REQUIRED |
| FLOW-10 | DBRELAY synchronization | tenant-scoped snapshot/change API | sync.started/completed/failed | retry bounded, conflict audit | TEST E2E REQUIRED |
| FLOW-11 | MLOps evaluation | dataset provenance + model registry | model.eval.completed | drift/rollback review | TEST E2E REQUIRED |
| FLOW-12 | Release pipeline | CI + human approval | release.candidate/approved/rolled_back | smoke tests and rollback record | NO LIVE DEPLOY |

## Acceptance rules
- Correlation IDs must persist across frontend, API, database and asynchronous events.
- Never put secrets, payment details or unnecessary personal data into audit logs.
- Outbox or equivalent durable delivery; bounded retries, dead-letter queue, idempotent consumers.
- Distinguish test fixtures, staged integrations and production evidence.
- Contracts, privacy disclosures, tax obligations and payment settlement require separate legal/accounting validation.
- Link each FLOW to NODE-001..NODE-154 only after deduplication and evidence review; do not invent node PASS.

## Known blockers
Kubernetes package contains insurance-agent-ai-ops reference manifests rather than a validated SEVA deployment; placeholder images, emptyDir backup, SQLite concurrency and NetworkPolicy concerns require remediation. No authenticated cluster verification documented. Stripe LIVE and autonomous TITANS remain disabled.

## Verification plan
1. Add Node.js contract tests for unauthorized access, tenant isolation, duplicate webhook, failed payments, retry exhaustion, and audit completeness.
2. Run npm run check and npm test on branch; attach exact GitHub Actions run.
3. Test Stripe and CRM flows with synthetic accounts and TEST keys only.
4. Review changes and obtain explicit human release authorization separately.
