# SEVA G.1.1 — Operational BLACK BOX acceptance

Target outcome: exactly **two synthetic accounts**, independent goal/DBRELAY data, persistence across a **real server process restart**. A local unit test does not establish hosted persistence or a legitimate domain.

## Implementation
- `blackbox-g11.mjs` provides two explicit phases: `prepare` (create synthetic accounts, distinct goals, record private reauthentication evidence) and `verify` (repeat authentication after service restart, check both records and forbid cross-account write).
- The CLI refuses plain HTTP public hosts, URLs with query/path/embedded credentials, and live usage unless `SEVA_BLACKBOX_STAGING=YES` is set. Local loopback is allowed **only** for synthetic CI tests.
- Any private evidence JSON contains synthetic passwords; it is written `0600` with no overwrite. Do **not** commit, email, attach, copy to GitHub issues or use customer credentials.
- No Stripe checkout, OpenAI provider, commission, bank, live payment or customer marketing is called.

## Runtime evidence (29 October 2026)

`GET /health` includes a random `bootId` generated once per Node process. The v2
private receipt records that identity during preparation. Verification refuses the
same identity with `RESTART_NOT_OBSERVED` before logging in. Both phases also require
a stable identity at their start and end; missing/invalid identities and old v1
receipts are rejected. Deploy the matching backend and collect a new receipt.

The cross-account update check accepts only an explicit ownership denial (400/404),
not an unrelated authentication, internal-server or transient failure.

A changed identity proves that a different process served the verification. Use an
isolated **single-instance staging service**: load-balanced replicas or routing to a
different deployment can also change the identity. Keep the hosting provider's
restart/deployment receipt as independent evidence of the operator restart action.
The report therefore includes `processChangeObserved:true` and
`operatorRestartEvidenceRequired:true`; it cannot certify a provider restart alone.

## Local CI gate
`test/blackbox-g11.test.mjs` starts SEVA in a distinct child process backed by a temporary SQLite file, performs `prepare`, terminates Node, starts a **new process** on the same database path, performs `verify`, checks owner isolation and unauthorized goal edits, then destroys all synthetic files.

The CI pass means: **LOCAL_PROCESS_RESTART=PASS**. It is NOT `REMOTE_STAGING_PERSISTENCE=PASS`.

## Actual staging acceptance instructions
Only after an authorized Node host and persistent volume are deployed (G.1):

1. Verify the stage-only HTTPS origin is reachable and has sales disabled, e.g. `https://seva-enterprise-stage.example.org`. This domain is an **example**, not an active URL.
2. Run in a secure operator terminal:
   ```bash
   cd apps/seva-enterprise
   SEVA_BLACKBOX_STAGING=YES node blackbox-g11.mjs prepare https://YOUR-VERIFIED-STAGING-HOST /secure/g11-private.json
   ```
3. Restart the **actual** hosted Node instance (do not delete/replace the attached persistent disk or SQLite data).
4. Run:
   ```bash
   SEVA_BLACKBOX_STAGING=YES node blackbox-g11.mjs verify https://YOUR-VERIFIED-STAGING-HOST /secure/g11-private.json
   ```
5. Redact sensitive material, collect audit receipt: commit SHA, Node version, deployment ID, exact origin, date, observed HTTP/DBRELAY status, restart evidence and PASS/FAIL. Only then mark G.1.1 `PASS`.
6. Delete staging-only synthetic identities and private receipt according to the security/retention plan. Do not run against production.

## Remaining G.1 blockers
This repository contains a draft Render blueprint requiring manual authorization and persistent disk. No Render deployment, HTTPS health response, external restart, Stripe TEST webhook or customer-facing Android online login is evidenced merely by merging this code. Do not mark release GO before G.1–G.6.

Reference: issue #82, `render.yaml`, `BLACKBOX-COMMERCIAL-ACCEPTANCE.md`.

