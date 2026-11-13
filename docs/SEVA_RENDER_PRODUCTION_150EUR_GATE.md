# SEVA Enterprise — Render production preparation (NO DEPLOY)

Workspace: `tea-dbdq2tlg1s2s73amsm90` (Karím's workspace).
Authorized budget ceiling: EUR 150/month for Render only; excludes OpenAI and Stripe.
This is a **candidate configuration**, not a purchase order, deployed service, price quote, or authorization to activate Stripe LIVE.

## Verified inventory and limits
- Render web service listing returned null, including previews: no existing runtime could be identified.
- PostgreSQL 17 `seva-dbrelay` (Frankfurt) is available on Free, with expiration 2026-11-29, without HA or read replicas.
- `apps/seva-enterprise/server.mjs` currently persists state to SQLite via `SEVA_DB_PATH`; **do not substitute PostgreSQL** without migration and end-to-end tests.
- The public `seva.karimkatlane0.chatgpt.site` is a separately hosted site. A Render deployment does not automatically update it.

## Pricing gate
Official public reference: https://render.com/pricing
The candidate uses Render `standard` compute and 5 GB persistent disk. **No verified account-specific USD/EUR quote or invoice forecast has been obtained**. Do not provision paid resources until the actual web instance, disk, workspace fees, taxes, and potential network usage have been totaled in EUR and shown to be <= EUR 150/month. Reserve headroom for unexpected usage; reject configurations that exceed the ceiling. A free expiring database cannot serve as certified production persistence.

## Security and launch gates
1. Keep auto-deploy OFF; no production deployment until the plan, credentials and origin are reviewed.
2. Never commit `OPENAI_API_KEY`, Stripe keys, session secrets or database URLs. Use Render's private environment configuration.
3. Restrict CORS/origins and validate cookie/session behavior behind Render HTTPS.
4. Keep `SEVA_SALES_ENABLED=false`, `SEVA_ANNUAL_SALES_ENABLED=false`, `SEVA_BANK_ORDERS_ENABLED=false`, `SEVA_BANK_LIVE_APPROVED=false`.
5. OpenAI inference requires authenticated user, consent, quotas, API credit and trace ID; no inference is triggered by this blueprint.
6. Stripe remains TEST-only in isolated staging. Signed webhook, idempotency, subscription lifecycle, refund and cancellation must pass before a separate LIVE approval.
7. Set up encrypted backup of SQLite and **test restore**. Persistent disk is not a replacement for a verified backup/restore plan.
8. Verify Node runtime, health checks, audit, logging redaction, rate limits, vulnerability scans, and data retention.
9. Verify the production URL and route integration with the existing public SEVA origin.
10. Prepare rollback to prior commit and restore point, and document who authorizes it.

## GO/NO-GO
NO-GO until costs, real runtime, persistence, backup restore, authentication, AI and Stripe TEST evidence pass. This PR is configuration only and must not be merged or deployed automatically.
