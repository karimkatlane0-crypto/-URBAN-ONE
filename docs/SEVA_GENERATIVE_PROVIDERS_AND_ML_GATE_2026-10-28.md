# SEVA GLOBAL — Generative AI and ML release gate (28 October 2026)

## Scope and truthfulness
This change adds a provider selector to authenticated SEVA AI Studio. Two text inference providers:
- OpenAI Responses API (existing provider; still requires a funded API account).
- Google Gemini API, from Google with Gemini models developed by Google DeepMind; available only after explicit server-side opt-in.

No custom deep-learning model is trained or deployed by this change. No self-improvement, fine-tuning, private-data learning, or benchmark performance is claimed. A multi-provider selector is not a production ML cluster or autonomous agent platform.

## Gate: Render configuration (private)
- GEMINI_API_KEY: a private server secret; never in code, browser, chat or logs.
- GEMINI_MODEL: explicit enabled model ID, only after confirming model access. No guessed default.
- SEVA_GEMINI_ENABLED=true: explicit opt-in after pricing, provider and privacy review. Defaults to false.
- OPENAI_API_KEY and OPENAI_MODEL stay distinct for OpenAI.
- SEVA_SALES_ENABLED=false and bank live flags remain untouched.

No cloud deployment, API credit, paid plan or live provider request is created by this source change. Github Pages build is not Render runtime evidence.

## Safety contract
1. POST /api/ai/generate accepts provider=openai|gemini; openai is default for compatibility. Unknown values fail closed. No automatic switch to another paid provider.
2. Existing login, CSRF, rate limits, entitlement/admin and explicit consent are enforced before inference.
3. Studio resets consent on switching provider and after each request. Only manually typed prompt text goes upstream; never local drafts, persisted goals, student identifiers, photos, cart, payment, or email.
4. Gemini uses only official Google generativelanguage.googleapis.com with server-side key in HTTP header, one output candidate, bounded tokens, 30-second timeout and no external tools.
5. Blocked, incomplete and untraceable responses fail closed. Display plain text only. Require provider responseId.
6. Mock response tests are not evidence of real authenticated Gemini inference.

## Verification
- Execute npm run check && npm test from apps/seva-enterprise.
- Validate synthetic input and failure fixtures without transmitting secrets.
- With an approved staging backend: GET /health, authenticate synthetic users, verify entitlements/consent, independently call each configured provider and record redacted response ID, timestamp and release commit.
- Verify persistent DBRELAY restart, offsite backup/restore, same-origin/CORS/session security, and physical Android behavior.
- Never forward cookie-authenticated API calls from unrelated static Vercel origins without approved origin/auth design.
- Live payments and outbound marketing remain off.

## Machine learning and deep learning: independent workstream
Define a permitted dataset and provenance, opt-in processing, retention, train/validation/test split, quality baseline, drift evaluation, reproducibility, monitoring and rollback before any model training. Use synthetic data for initial experiments. Customer, student, payment and Lastre records are never training data by default.

Official refs: https://ai.google.dev/api/generate-content and https://render.com/docs/mcp-server
