# URBAN ONE — PSD2 × AI controlled workflows

**24 October 2026 · Technical branch proposal · No banking activation**

This module provides safe, deterministic planning for future AI assistance in URBAN ONE. It is **not an LLM integration**, real bank-data connector, authorized PSD2 provider, payment instrument or merchant settlement system.

## Goal

**AI can assist** after the appropriate gates with categorization of authorized AIS transactions, financial summaries, anomaly triage, payment preparation, contract-to-Stripe reconciliation and reporting. **AI cannot** infer banking consent, accept agreements, collect SCA factors, approve bank payments for a human, certify a provider, execute transfers, or manufacture evidence of a payment.

## Source / tests

- `packages/finance/psd2-ai-workflow.mjs` — fail-closed, synthetic-only planning; rejects live/sandbox modes other than explicit `sandbox_mock`.
- `tests/psd2-ai-workflow.test.mjs` — deny-by-default, cross-tenant consent, expiry/revocation, mock-only PIS drafts, no money movement or invented Stripe verification.
- Existing Fabrick mock `packages/integrations/fabrick-offline-mock.mjs` remains the fixture source; its runtime is not connected to a bank.
- Existing Stripe signature module is not modified; it does **not** authorize entitlement from receipt of a webhook alone.

## Strict separation

| Lane | Allowed now | External production gate |
|---|---|---|
| Stripe customer collection | Existing LIVE customer-initiated one-time link for agreed B2B services | Signed merchant/customer agreement, actual verified payment and fulfilment |
| PSD2 software subscriptions (EUR 29/month) | Product/price exist in Stripe | Payment Link inactive; production entitlement provisioning & Stripe webhook reconciliation unverified |
| Fabrick AIS | Synthetic analysis and planning | Accepted FPP onboarding, credentials, tenant authorization, bank consent and scoped access |
| Fabrick PISP IN | Synthetic *draft* only | Correct affiliated beneficiary, human approval, bank SCA, provider production authorization |
| AI | Deterministic offline planning | LLM provider configured, privacy, redaction, tenancy, model-output isolation and audit tests |

## Implementation stages

1. **Now:** retain free/offline PSD2 AI simulations; sell only existing deliverable B2B services via merchant Stripe checkout, without misleading customers into buying unactivated banking functions.
2. **Provider approval:** wait for Fabrick to confirm product eligibility, sandbox access, any financial commitments and beneficiary affiliations. No recurring or paid Fabrick agreement without the owner's new approval; do not interpret December 2026 as automatic consent to a charge.
3. **Secure backend:** integrate real provider only in an authenticated separate API runtime with explicit consent ledger, proper secret store, typed adapter, callback verification, tenant isolation, revocation/expiry and anti-replay.
4. **AI analytics:** send minimum authorized and purpose-scoped financial aggregates to an approved model provider only if permitted by banking provider terms and valid data-processing arrangements; keep an audit trail and never have the model create authoritative bank instructions.
5. **AIS/PIS verification:** test negative cases, account selection, onboarding, human confirmation and SCA, provider-status reconciliation, and prod acceptance; only then update provider status.
6. **Revenue gate:** customer payment is verified separately by Stripe. No PSD2 entitlement until subscription/webhook backend can reliably grant, revoke and reconcile access.

## Current evidence

- Fabrick commercial enquiry emailed 24 October 2026; contract and bank approvals not evidenced.
- GitHub Issue [#29](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/29) tracks provider and sandbox gates.
- The merchant's Stripe LIVE payout destination remains configured inside the payment provider. **No bank account number, IBAN, customer data or secrets may be committed here.**

**Deployment status:** source-only proposal on a feature branch, not live on the hosted application. Merging or deploying must be independently tested and explicitly approved; branch publication alone does not activate provider services.
