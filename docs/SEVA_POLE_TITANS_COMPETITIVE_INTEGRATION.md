# SEVA TITANS + Pole Position + Competitive Edge — integration review

## Source verified
- Pole Position already exists as a **staging** Node/SQLite API at `services/api/pole-http.mjs`, `pole-store.mjs` and `pole-checkout.mjs`.
- The Web/Capacitor demo is not automatically connected to authenticated production endpoints.
- `packages/enterprise/seva-unified.mjs` is a readiness registry, **not** an agent runtime.
- OpenAI is primary. No alternative provider is silently enabled.
- Stripe Customer Portal logic exists separately; payment entitlement cannot be inferred from a checkout redirect.

## Competitive edge — proposal, not claims
Use authorized dossiers, offer/visit funnel evidence, response time, conversion and customer experience as KPIs. The new `comparePoleOptions` is a deterministic scenario calculator, not a live market benchmark: all supplied metrics remain unverified; no actual financial return is claimed.

## Required before merge and go-live
1. Run `node --test tests/seva-pole-competitive.test.mjs` and full repository CI.
2. Confirm Pole Position regulatory role: listing/visit software versus regulated real-estate mediation, who provides services and who receives funds.
3. Replace staging Bearer tokens with audited tenant-scoped SEVA identity, roles and explicit owner authorization.
4. Integrate private persistent backend, atomic slot reservation, cross-device sync and verified event evidence.
5. Map onboarding consent and authorized property ownership to role-scoped Pole APIs. Agents may propose and draft but cannot approve, contact, book or charge without explicit scoped authorization and audit.
6. Review GDPR retention, addresses, messages, consumer terms and cancellation.
7. Use Stripe TEST only. Verify signed webhook and idempotent entitlement before any paid booking, and never reuse Stripe LIVE keys in test.
8. No autonomous MLOps/DLOps execution, new plugin connection, production deployment or price/financial action is included in this PR.
9. Reconcile with the SEVA canonical site separately; GitHub merge does not update `seva.karimkatlane0.chatgpt.site`.

Rollback: revert this standalone PR. New files only; no database migration or live transaction.
