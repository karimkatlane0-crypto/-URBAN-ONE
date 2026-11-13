# SEVA · TITANS · Onboarding — unified integration proposal

Status: DRAFT / NO-GO LIVE. OpenAI is the intended primary AI provider. This PR does not merge Android PR #132 or OpenAI PR #133.

## Existing modules reused
- `apps/seva-enterprise/generative-ai.mjs` and `developer-ai.mjs`: consented provider routing; OpenAI default, but authenticated caller and quotas remain external gates.
- `services/api/science.mjs`: isolated science API with operator token; **not** multi-tenant identity.
- `packages/ai/providers.mjs` and `services/api/readiness.mjs`: configuration/readiness reporting, not live certification.
- `docs/BNB_PRIVATE_PARTNERSHIP_ONBOARDING.md`: partner authorization and payment onboarding gates, not active partners.
- `packages/enterprise/seva-unified.mjs`: new fail-closed capability registry; no autonomous execution.

## Integration sequence
1. Complete review of PR #133; rebase this branch only after approval.
2. Establish a real authenticated SEVA API service and per-account scoped roles.
3. Connect onboarding to a consented partner and verified account lifecycle.
4. Register TITANS agents with explicit tool scopes, human approval for external actions, trace IDs, durable audit, retries and kill switch.
5. Run offline tests, authenticated staging end-to-end checks and independent production evidence.
6. Keep Stripe TEST isolated; no Stripe LIVE activation or provider calls from this registry.
7. Verify backup/restore, rollback and monitoring before GO LIVE.

## Acceptance criteria
- CI and security tests pass on the actual merge head.
- No API keys or customer data in browser bundles, logs or PR files.
- Explicit consent and tenant isolation; no synthetic evidence promoted to LIVE.
- OpenAI inference verified separately after account approval and available API credit.
- Render runtime, database persistence and onboarding permissions independently demonstrated.
- All actions fail closed when authorization or evidence is absent.

Rollback: revert the PR. No schema migration, live integration or financial change is included.
