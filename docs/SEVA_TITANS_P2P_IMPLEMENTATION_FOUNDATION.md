# SEVA TITANS P2P — implementation foundation

Status: **BUILD FOUNDATION / NOT PAYMENT-ENABLED**

This document translates Issue #196 into a provider-neutral implementation contract. It does not create payment intents, connect a provider, move funds, or enable live payments.

## Non-negotiable invariants

- Each beneficiary must independently opt in to receiving P2P payments and complete any provider-required onboarding/verification.
- Opt-in is revocable. A revoked, suspended, unverified, or payout-ineligible beneficiary cannot receive a new payment.
- Each transfer is a distinct, one-time transaction. No recurring mandate, batch transfer, automatic charge, or implicit consent.
- The beneficiary must receive exactly EUR 3.00 net.
- SEVA fee is EUR 0.00. SEVA Intelligence Studio cost is EUR 0.00.
- Provider/acquirer fees must be disclosed before payer confirmation and must be funded by a party other than the beneficiary and SEVA Intelligence Studio. If this cannot be guaranteed by the provider contract and settlement model, disable that payment rail.
- No SEVA custody or pooled user balance. Settlement must be directly to the verified beneficiary through a provider-approved marketplace/direct-settlement product.
- The browser/client never determines payment success. Only a verified server-side provider event plus provider-side reconciliation can do so.

## Required state model

Beneficiary receiving state:
`NOT_ENROLLED → PENDING_VERIFICATION → ACTIVE → PAUSED | REVOKED | REJECTED`

Only `ACTIVE` plus a fresh provider capability check may be offered as a recipient. Revocation immediately blocks new payment initiation. In-flight transactions remain visible and are reconciled according to provider rules.

Payment state:
`CREATED → AWAITING_PAYER_CONFIRMATION → PROCESSING → SUCCEEDED | FAILED | CANCELLED | EXPIRED`

Refund/dispute state is recorded separately and never rewrites the original payment history. Every state transition is append-only audited and idempotent.

## Transaction contract

Before confirmation, show payer:
- verified beneficiary display identity;
- EUR 3.00 net beneficiary amount;
- payer total and every provider fee/tax;
- payment method, refund/dispute terms, and provider identity.

On confirmation, create a unique transaction/idempotency key and redirect to an approved provider-hosted flow. Do not collect or store raw card/bank credentials in SEVA. Persist only minimal provider references and transaction metadata.

Mark `SUCCEEDED` only after:
1. authenticating the provider webhook signature against the raw request body;
2. validating event type, connected beneficiary/account, currency, gross/net amounts, and transaction reference;
3. rejecting replay/duplicate event effects idempotently;
4. retrieving provider-side payment/transfer state when needed;
5. reconciling that the beneficiary settlement is EUR 3.00 net and SEVA/Studio deductions are both EUR 0.00.

A mismatch, missing capability, fee uncertainty, invalid signature, or reconciliation gap fails closed.

## Required test matrix

- beneficiary opt-in, pending verification, activation, pause, revocation, reactivation;
- payer cannot initiate for non-active or payout-ineligible beneficiary;
- EUR 3.00 net invariant and explicit payer fee disclosure;
- no SEVA fee and no Studio-funded fee;
- payer confirmation required for every single payment;
- duplicate request/idempotency key and webhook replay;
- invalid signature, wrong beneficiary, wrong currency, wrong amount, wrong net settlement;
- provider pending, decline, cancel, timeout, refund, reversal, dispute;
- cross-user and cross-tenant access denial;
- audit trail and reconciliation recovery after process restart;
- client-side forged success status rejected.

Release target: **200/200 regression tests**, with CI run, commit SHA, artifacts, sandbox provider evidence, and independent review. The target has not yet been run or verified.

## Gate evidence

### BUILD
- [x] P2P requirements and state/transaction contract documented.
- [ ] Provider adapter, persistent data model, authenticated API and beneficiary controls implemented.
- [ ] UI opt-in, payer confirmation, receipts and revocation implemented.
- [ ] Tests implemented and CI passing.

### VERIFY
- [ ] Provider confirms direct beneficiary settlement is supported for the chosen Italian/EU account types.
- [ ] Provider fee allocation proves EUR 3.00 net to beneficiary with EUR 0.00 Studio cost.
- [ ] Sandbox end-to-end and independent security/payment review pass.
- [ ] 200/200 regression tests pass.

### RELEASE
- [ ] Provider approval, KYC/AML and legal/tax/PSD2 role assessment completed.
- [ ] Live credentials/webhook secrets configured only in approved secret manager.
- [ ] Explicit production approval and controlled smoke test completed.

### SCALE
- [ ] Settlement/failure/dispute/fraud/reconciliation monitoring and alerting.
- [ ] Capacity, incident, rollback and support runbooks.

## Explicitly not authorized

No Stripe/other provider product creation, paid service activation, live credentials, real charges, transfers, subscriptions, outbound messages, or production deployment is authorized by this build foundation.
