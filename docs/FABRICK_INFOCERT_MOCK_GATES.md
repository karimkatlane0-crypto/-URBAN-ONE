# URBAN ONE — Fabrick + InfoCert offline integration simulations

**Date:** 2026-10-22 · **State:** source-only deterministic mocks, no real provider connection.

These source modules let the CI test fail-closed policy while external contracting and credentials are pending.

## Fabrick AIS/PIS

- \`packages/integrations/fabrick-offline-mock.mjs\`
- \`simulateFabrickAis\`: requires \`mode:'sandbox_mock'\`, synthetic tenant references, synthetic active tenant-bound consent, AIS read scope and unexpired consent. Returns **fixtures only**; no bank requests.
- \`simulateFabrickPis\`: requires synthetic payer/beneficiary IDs, amount in EUR minor units, explicit simulated human approval, and simulated SCA. **Never executes a payment**.
- \`mode:'disabled'\` (default) and \`mode:'live'\` both fail closed. These functions are not a substitute for Fabrick's FPP approval, AIS/PISP IN contract, affinity model, production API, auth redirect, or bank SCA.
- Real AIS/PISP IN requirements and commercial terms are held privately. Do not put provider correspondence or any real bank account into source or fixtures.

## InfoCert signing

- \`packages/integrations/infocert-offline-mock.mjs\`
- \`prepareInfocertMock\`: accepts two unique **synthetic** signers, synthetic tenant/contract IDs and a test document SHA256. It never reads, stores, signs or transmits the PDF.
- \`advanceInfocertMock\`: simulates transitions only; \`completed_mock\` is **not a legal electronic signature**, never grants a contract.
- Default disabled/live inputs fail closed. No real identity verification, SPID/OTP flow, qualified certificate, PAdES document, eSeal, API call, expense or business-partner activation is performed.

## Provider-side gates

1. Commercial eligibility and terms confirmed **privately**. Fabrick AIS minimum/POC and InfoCert pricing remain unaccepted.
2. Receive sandbox documentation and non-production access through each provider's secure route.
3. Implement versioned server-only adapters with tenant authorization, signed callbacks, replay/idempotency, and data minimization.
4. Validate mock tests plus provider sandbox and negative tests; independent security/privacy review.
5. Require signed contract, real user consent/identification, provider production approval, and explicit authorization of each payment or signature before any LIVE setting.
6. Keep Stripe commercial billing separate from bank AIS/PIS and InfoCert contract signatures.

Run: \`npm test\`. The modules add no HTTP endpoint or mobile feature and are not evidence of production service capability.
