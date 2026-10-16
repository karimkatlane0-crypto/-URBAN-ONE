# Security Model

1. Deny by default.
2. Authenticate before privileged operations.
3. Authorize by role and scope.
4. Require purpose-bound consent when personal data is involved.
5. Sanitize PII/secrets before external AI-provider handoff.
6. Hash provenance envelope before provider execution.
7. Require human approval + SCA receipt for PIS.
8. Record provider/relay receipts in the evidence ledger.
9. Never embed provider secrets in Web/Android/iOS bundles.
10. Treat release, provider certification and device tests as separate gates.
