# SEVA IS CALLED — BLACK BOX Commercial Acceptance · 26 October 2026

**Decision:** `NO-GO` until externally measured acceptance is complete. This document prepares review; it does not deploy hosting, charge customers, certify compliance or change the original Work site.

## Execution chain (GOAL → EXECUTE → VERIFY → VALIDATE → RELEASE)

| Gate | Operator action | Evidence and PASS condition | Current status |
| --- | --- | --- | --- |
| G.1 HTTPS / durable runtime | Use the existing `render.yaml` staging blueprint only after approval of a paid disk/host. Set `SEVA_PUBLIC_URL` and durable `SEVA_DB_PATH`; exactly one SQLite instance. | Production commit + actual HTTPS origin + `GET /health` HTTP 200 + account A/B data isolation after server restart | BLOCKED — no hosted URL verified |
| G.2 OpenAI | Securely configure a scoped server-only `OPENAI_API_KEY`, available credits and model; authenticate synthetic user with entitlement in staging | Actual Responses API output, provider ID/model/timestamp, no API key in logs/Android | BLOCKED — real hosted response missing |
| G.3 Stripe TEST | Use **Sandbox di Katlane Karim**; after G.1 pass, register a webhook to the verified `https://HOST/api/stripe/webhook`, set signing secret in host protected settings | TEST subscription Checkout → signed webhook → owner/plan entitlement → dedupe → renewal / failed payment / cancellation / revocation, reconciliation receipts | BLOCKED — no sandbox webhook endpoint |
| G.4 Recovery | Run maintenance CLI; provision encrypted **offsite** backup outside the hosting disk. Rehearse restore into a different host and confirm data/DBRELAY after restart | Snapshot hash, protected storage receipt, isolated restore, A/B accounts/cursor and recovery objective recorded | PARTIAL — source and synthetic test only |
| G.5 Android E2E | Install a fullstack Android build matching the actual online origin and signing identity on a real device | Cold boot, login, AI, test purchase entitlement, offline/error/reconnect, screenshots, OS/app versions | BLOCKED — offline APK is not Enterprise fullstack |
| G.6 Live legal/release | Review tax registrations, mandatory disclosure, terms, privacy, cancellation, refunds, support, store billing eligibility and security | Owner-approved release record and explicit rollback with every gate PASS | NO-GO |

### Already inspected without changing customer LIVE settings

- Repository: `karimkatlane0-crypto/-URBAN-ONE`, branch `main-@URBAN-ONE`.
- Sandbox catalog: SEVA Enterprise EUR 50/month; SEVA Buyer EUR 50/year; SEVA E-commerce EUR 500/year; all three are **TEST**, not live entitlements.
- Stripe sandbox `GET /v1/webhook_endpoints` returned `data=[]` during the October 26 check.
- Existing Vercel Golden Age production deployment is a **separate public shell**, not this durable Node SQLite service.
- Historical source tests are not production BLACK BOX acceptance.

## Recovery CLI (source test only until operationally executed)

From `apps/seva-enterprise`, on the authorized service machine with Node 22+:

```bash
node --experimental-sqlite maintenance.mjs backup /var/data/seva.sqlite /var/data/backups/seva-20261026.sqlite
node --experimental-sqlite maintenance.mjs restore /var/data/backups/seva-20261026.sqlite /var/data/recovered/seva.sqlite
```

The implementation refuses overwrite, checks integrity and SEVA required tables, creates a consistent SQLite snapshot using `node:sqlite`, and restores into an unused path. It does **not** provision external encrypted storage or schedule backups. Do not treat a backup on the same Render disk as offsite recovery. The main branch must still merge this reviewed PR before the commands are available there.

### BLACK BOX receipt schema

Every proof requires the following record (never paste secrets, customer data, full cookies or credentials into a public issue):

```json
{
  "gate": "G.1",
  "commit": "<reviewed immutable SHA>",
  "environment": "staging",
  "version": "<build/package version>",
  "input": "<synthetic, redacted>",
  "expected": "<acceptance predicate>",
  "observed": "<measured result>",
  "evidence_location": "<private auditable source, not secret>",
  "measured_at": "<ISO-8601>",
  "result": "PASS | FAIL | BLOCCATO | NON VERIFICATO",
  "reviewer": "<authorized reviewer>"
}
```

**Safety:** Never put `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, financial identifiers, real customer data or signed webhooks in this public repository. Keep `SEVA_SALES_ENABLED=false` and `SEVA_ANNUAL_SALES_ENABLED=false` until signed acceptance of each gate. Do not reuse URBAN ONE/KKUBERA webhooks. Buyer/merchant/enterprise plans need **plan-scoped** entitlements; do not mark them complete merely because the current server tracks a boolean `active` access field.

### Gate ownership and order

1. Hosting approval and persistent disk + external `/health` / login / database restart acceptance.
2. Offsite encrypted backup and isolated restoration with two test users.
3. First real OpenAI authenticated response with proper consent / credit balance.
4. Stripe **TEST** verified destination, webhook signature and plan-scoped lifecycle.
5. Fullstack Android acceptance on the user's physical phone and incident rollback rehearsal.
6. Legal, fiscal, privacy, refund, support and payment store policy acceptance → signed GO/NO-GO.

Related issues: #82 commercial release; #93 timing relay and cross-project tenancy. Do not silently merge SEVA and KKUBERA data domains.
