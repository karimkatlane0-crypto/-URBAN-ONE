# TITANS Partner Onboarding — ENTRY LEVEL

**Commercial status:** user-approved BUILD baseline; not yet published or activated.
**Lifecycle:** BUILD → VERIFY → RELEASE → SCALE.

## Approved offer
- Price: **€10.00 per user for 30 days**.
- Account: registration by e-mail followed by e-mail verification.
- Payment: manual bank transfer for each access period.
- Exact payment reference: `REEDEEM`.
- Beneficiary and bank coordinates: restricted configuration only; never publish these details in repository documentation or public pages.
- Renewal: manual transfer for each subsequent 30-day period. No automatic debit, recurring mandate or automatic renewal.
- Access: one 30-day entitlement, beginning only after actual cleared funds are independently verified.

## Confidential payment instructions
Full bank coordinates are confidential operational data. Store them only in a restricted secret/configuration manager. Never place them in Git, public HTML, source maps, build artifacts, client bundles, logs, analytics, unauthenticated API responses or public documentation. Expose payment instructions only after authentication and verified e-mail ownership. Do not log the full coordinates when rendering or delivering instructions.

## Required flow
1. Create account and verify e-mail ownership.
2. Resolve the ENTRY LEVEL SKU server-side; do not accept price, duration, beneficiary or entitlement values from the browser.
3. Show €10.00, 30-day duration, manual-renewal terms and private bank-transfer instructions to the verified account.
4. Record a pending payment intent with tenant/user, SKU, expected amount/currency, exact reference, creation time and unique reconciliation key.
5. An authorized operator reconciles actual cleared funds using reliable bank evidence. A screenshot, transfer receipt, user declaration or pending bank transaction is not proof of settlement.
6. Verify amount, currency, beneficiary, exact reference, transaction identity and settlement status. Reject mismatches and duplicates.
7. In one PostgreSQL transaction, record the settled payment, append the audit event and grant the 30-day entitlement. Enforce idempotency on bank transaction identity and reconciliation key.
8. Expire access at the exact end of the 30-day period unless a new, separately settled payment is reconciled.
9. Handle refunds, chargebacks, reversals, failed transfers, duplicate transfers, manual correction and revocation through audited state transitions.

## Security and data model
- PostgreSQL persistent ledger; versioned migrations; tenant isolation and least-privilege operator role.
- Separate payment intent, settlement evidence, entitlement and audit records.
- No client-side entitlement grant and no trust in a success/return URL.
- Never store online-banking credentials or scrape bank accounts. Manual reconciliation must use an authorized bank statement/export or provider feed with restricted access.
- Protect settlement evidence as financial personal data; minimize, encrypt, restrict, retain and delete under an approved policy.
- Record operator identity, decision, timestamp, evidence reference/hash and reason. Do not store unnecessary bank statement details.
- Fail closed if settlement is ambiguous, evidence is unavailable, or the payment does not match the expected order.

## SKU separation
ENTRY LEVEL and TITANS GO ENTERPRISE GLOBAL may remain distinct product identifiers/scopes, but they share one approved commercial baseline: €10 per user for 30 days, manual bank transfer, exact reference `REEDEEM`, access only after verified cleared funds, and manual renewal only. No lifetime access, automatic debit or recurring mandate. Keep product identifiers and audit records distinct without introducing conflicting commercial terms.

## Verification acceptance
- Registration and e-mail verification required before payment instructions are shown.
- Anonymous and unverified accounts cannot retrieve private bank instructions.
- Correct €10 settlement + exact reference + correct beneficiary grants exactly 30 days once.
- Wrong amount, currency, beneficiary or reference grants no access.
- Pending/unsettled funds, receipt upload alone, duplicate statement rows and replayed reconciliation grant no additional access.
- Expiry occurs at 30 days; a new manual settlement is required to renew.
- Refund/reversal/dispute follows approved revocation or adjustment policy with complete audit history.
- Tenant isolation, operator authorization, secret scanning, log redaction, backup/restore and recovery tests pass.

## Release boundary
This document authorizes BUILD and VERIFY only. It does not authorize public publication, merge, deployment, live payment activation, bank-data transfer or customer onboarding. RELEASE requires separate explicit human authorization after all acceptance tests pass.
