# SEVA OpenAI primary — staging-only review

OpenAI is the primary AI provider; no provider is declared LIVE from configuration alone.

## Scope
- Reuse `apps/seva-enterprise/developer-ai.mjs`, `packages/ai/providers.mjs` and `services/api/readiness.mjs`.
- Validate prompt, explicit model, fixed official endpoint and response completion.
- Prevent arbitrary credential forwarding and sanitize provider errors.
- Add deterministic mocked tests in `tests/seva-openai-primary.test.mjs`.
- Do not modify Stripe, Android release signing, Render or production services.

## Required before release
- Confirm caller authentication, consent, per-account quotas and access controls.
- Verify no browser bundle imports the server-side adapter.
- Execute `node --test tests/seva-openai-primary.test.mjs` and `npm test` in CI.
- Verify account API billing/credit separately only after approval.
- Keep NO-GO for LIVE until an authorized end-to-end operation succeeds.

## Rollback
Revert the branch commits; no migration or live configuration is included.
