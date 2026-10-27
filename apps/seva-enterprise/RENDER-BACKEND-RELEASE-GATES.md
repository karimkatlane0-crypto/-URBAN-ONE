# SEVA Enterprise backend — Render opt-in blueprint (27 October 2026)

The production Vercel URL is a **static website** and does not host Node's persistent SQLite API. The Render blueprint stages a separate paid-capable server, not a replacement for the public website. **No Render service has been created or billed by writing this file.**

## Connecting it (requires owner approval)
1. Connect Render plugin/account (not connected during this implementation).
2. Import repo -URBAN-ONE and review the proposed Blueprint and any charges before creating service.
3. Confirm the assigned HTTPS origin and put exactly `https://...onrender.com/` as `SEVA_PUBLIC_URL`. This is required at startup.
4. Configure a server-only `OPENAI_API_KEY` for a funded project; never send it to frontend, API response, GitHub or chat. All billing/sales flags remain false until reviewed.
5. Only one SQLite service instance, persistent disk. **Render free web services cannot attach persistent disks.** Select a supported paid plan with explicit approval.
6. GET /health and /api/public/status; 2 synthetic accounts, access isolation, goal changes, DBRELAY snapshots and incremental changes, durable restart.
7. Validate offsite backup and restore. A local persistent disk is not a backup and can incur downtime on deploy.
8. Test provider response from an authenticated user with a permitted entitlement (or configured admin) and record an OpenAI Response id, not a pasted key.
9. Connect production frontend only after proper same-origin/session, CSRF, CORS, cookies, security review and data protection. Do **not** proxy authenticated APIs between unrelated origins without secure design.

## Explicit NO-GO limits
- There is no logged-in Cloud DBRELAY, no API entitlement, no OpenAI inference, no paid checkout, no bank verification or App Store release merely by importing source.
- The separate SEPA branch PR #107 is not this release, and is not merged implicitly.
- No claims of financial or customer readiness before auditing tax, sales contracts and GDPR.
- Preserve the static SEVA PWA already READY even if the backend is unavailable.

Official Render persistence guide: https://render.com/docs/disks
Official Render Blueprints: https://render.com/docs/blueprint-spec
