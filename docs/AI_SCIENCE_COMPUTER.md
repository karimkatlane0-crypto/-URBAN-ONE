# AI Science Computer

Multi-provider research workspace at `/science.html` on the Node API runtime. This is model inference orchestration, not a physical supercomputer or a validated scientific instrument. Models do not browse, execute code or run experiments in this workspace. Independent responses are displayed without manufacturing a consensus.

## Run

Node 22+: `node --env-file=.env.local services/api/server.mjs`.

Server-only configuration: `SCIENCE_API_TOKEN` (minimum 32 characters), `OPENAI_API_KEY` / `OPENAI_MODEL`, `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`, `GEMINI_API_KEY` / `GEMINI_MODEL`, `XAI_API_KEY` / `XAI_MODEL`. Model IDs must be explicitly chosen from the provider account. No provider model or credential is accepted from browser input. `.env.local` is ignored by Git. Never upload this file, including to static hosting or release archives.

Give authorized operators the workspace access token through a secure channel. It is distinct from all provider API keys. Use HTTPS on a deployment. This single-operator token is not multi-tenant identity; public commercial access needs user identity, persistent per-account quotas, revocation and a billing boundary. In-process limits: 10 requests/minute, 2 concurrent comparisons, 4 providers per comparison, 12,000 input characters, 2,048 output tokens/provider, 45 second timeout/provider. Limits reset on restart and do not span replicas. The API refuses execution until access is configured; it never runs automatically on page load. Selected providers receive the prompt only after explicit consent. Providers may charge API usage. No prompt, result, or credential is logged or persisted by the handler. Provider retention policies still apply.

A `configured_unverified` state is configuration metadata, not proof of account access or successful inference. Each completed result includes model, timestamp, request ID and duration. Other providers can still return successfully when one fails. Upstream errors are summarized without returning bodies or secrets. Static hosts can display the interface but cannot execute the Node endpoints. Existing Android builds are not rebuilt by adding the source page.

## Validation

`node --test tests/science.test.mjs`, `npm test`, `npm run verify`, `npm run security:secrets`. Mock tests validate HTTP contracts and failure handling; live inference and hosted deployment are separate evidence gates.

## API sources

- OpenAI Responses: https://developers.openai.com/api/docs/guides/text
- Claude Messages: https://platform.claude.com/docs/en/api/messages/create
- Gemini generateContent: https://ai.google.dev/api
- xAI Responses: https://docs.x.ai/developers/rest-api-reference/inference

Attachments supplied on 25 October 2026 contained generic Gemini URLs and one inaccessible shared conversation, not readable scientific specifications. No claims have been imported from inaccessible material.
