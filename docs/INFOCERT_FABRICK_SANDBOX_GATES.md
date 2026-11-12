# URBAN ONE — InfoCert and Fabrick provider sandbox gates

**Scope:** technical prototypes only (20 October 2026). These new modules are OFFLINE mocks. They do **not** integrate with InfoCert, Fabrick, banks, SMS, OTP, qualified certificates, or any payment processor. No production readiness is claimed.

## InfoCert — contract signing
- Primary candidate **InfoCert Sign** for two-signer B2B PDF contract envelopes, notifications, status tracking and optional qualified signing/identification. Alternative e-Signature & e-Sealing may be appropriate if a certificate-level API is necessary. Provider selection and FEA vs QES must be confirmed contractually/legally.
- Mock-only module: `packages/integrations/infocert-signing-mock.mjs`, `prepareInfocertMockEnvelope`.
- Synthetic two roles: `urban_one_authorized_signer` and `bnb_authorized_representative`.
- Enforces mock mode, synthetic document SHA-256, mock contract acceptance and distinct roles.
- No credentials, signed contracts, real identities, OTP, certificate issuance, digital signatures, provider network calls, or real charges.
- Provider enablement gate: written partner terms/prices, signed approval, sandbox access, security specs, identity requirements, provider receipts and legal review.

Public docs: https://developers.infocert.digital/infocert-sign/ and https://developers.infocert.digital/e-signature-and-e-sealing/

## Fabrick — AIS/PIS
- Mock-only module: `packages/finance/fabrick-psd2-mock.mjs`.
- AIS simulates consent to a synthetic tagged account and does not access bank data.
- PIS simulates payer consent, explicit human approval and SCA evidence; rejects real-looking account/beneficiary identifiers and never executes a bank transfer.
- Real AIS requires regulatory role/consent scope/expiry, provider authorization and authenticated responses. Real PIS requires beneficiary/host onboarding decision, explicit payer consent, SCA, idempotency, reconciliation, bank/provider receipt and fail-closed backend.
- Provider enablement gate: written FPP model confirmation (including business accounts and B&B beneficiary setup), commercial terms, API key and sandbox account, privacy terms and provider acceptance.
- Strict separation from Stripe subscription billing; this prototype never charges or moves money.

Public docs: https://docs.fabrick.com/docs/platformAndPaymentInstitution/openBankingAndPSD2/pass/prerequisites/

## Release and privacy
- **Default mode disabled.** `live` always rejected. `mock` returns a labelled simulation, never a document or payment.
- Synthetic data only. Never put production credentials, private contract PDFs, identities, IBANs, account statements or provider responses in a public issue, PR, repository, or chat.
- This is not a runnable integration. Do not expose any mock output as a completed signature, banking consent or transfer.
- Test: `npm test` covers the offline simulation gates, and other CI checks must pass before merge.
- No technical meetings requested; provider correspondence is email/documentation only.
- Tracked by #28 (InfoCert) and #29 (Fabrick).
