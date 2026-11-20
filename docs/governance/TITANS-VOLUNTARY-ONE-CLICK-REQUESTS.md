# TITANS — Voluntary one-click request decisions

**State:** BUILD candidate; automated test file added; VERIFY pending.
**Release:** not authorized.
**Boundary:** this policy module performs no network request, import, message, payment, provider call, or data transfer.

## User experience
1. A requester creates one request addressed to one authenticated recipient.
2. The request displays its purpose, exact fields/scopes, requesting account, expiry, and withdrawal route.
3. The recipient chooses one action: **ACCEPT** or **DECLINE**.
4. ACCEPT approves only the displayed request, purpose, and listed scopes. It is not acceptance of general terms, marketing, unrelated processing, or future requests.
5. DECLINE records the decision and creates no grant.
6. A pending request expires; a decision cannot be replayed or changed through the same request.
7. The recipient can revoke an accepted grant; downstream access must check revocation at every use.

## Security contract
- The backend authenticates the actor and verifies that the actor is the exact intended recipient. Client-supplied actor IDs are never trusted.
- Request state transition and audit event must be persisted atomically.
- Enforce one-time transition from pending to accepted or declined using a conditional database update / compare-and-swap.
- ACCEPT creates a grant limited to the exact request purpose and scopes. No wildcard or inherited scopes.
- DECLINE creates no grant.
- Expiry, revocation, duplicate decisions, wrong recipient, missing purpose, invalid scopes, and unavailable consent ledger fail closed.
- Do not trigger contact import, sync, message, marketing dispatch, payment, or external sharing from the decision endpoint. Those are separate actions with separate approval and consent checks.
- Audit only the minimum metadata required; avoid copying contact payloads into logs.

## Proposed authenticated API
- POST /api/titans/requests — create a pending request; recipient and scope validation.
- GET /api/titans/requests/inbox — list requests for the authenticated recipient.
- POST /api/titans/requests/:id/decision — body { decision: accept | decline }; actor comes from verified server session.
- POST /api/titans/grants/:id/revoke — revoke a grant.
- GET /api/titans/requests/:id/receipt — retrieve the authenticated participant's receipt.

Every response includes request ID, state, timestamp, purpose, scope list and audit reference. The API must not expose another tenant's requests.

## Current code in this branch
- packages/titans/request-decision.mjs: pure fail-closed decision evaluator.
- tests/titans-request-decision.test.mjs: tests for recipient authentication, one-click accept/decline, scope minimization, expiry, replay prevention and no implicit side effects.

The module is not an authentication adapter, durable ledger, API route, or production UI. The current PR must remain a BUILD candidate until those layers and independent tests are complete.

## Remaining VERIFY work
1. Add authenticated server routes and database transaction / unique transition constraint.
2. Add inbox UI with one-click ACCEPT / DECLINE and accessible confirmation/status.
3. Add revocation propagation, retention and export.
4. Test two synthetic tenants and adversarial cross-account requests.
5. Run npm test, npm run verify, npm run security:secrets, browser tests and backup/restore tests on the PR head.
6. Verify no analytics/marketing tag loads before the relevant user's optional consent.
7. Confirm no contact, message, payment or provider action occurs as a side effect of ACCEPT alone.

**Release gate:** staging acceptance plus separate explicit human authorization. No production activation is authorized.
## Staging API implementation added in the follow-up BUILD

- `packages/titans/request-ledger.mjs` adds a SQLite request/grant/audit ledger with atomic `BEGIN IMMEDIATE` transitions, recipient ownership, expiry, exact allowlisted purpose/scopes, one-time decisions, receipt lookup and recipient-controlled revocation.
- `services/api/titans-http.mjs` adds a staging-only Bearer-token boundary. Identity and scopes are resolved from server-owned SHA-256 token hashes in `TITANS_STAGING_ACTORS_JSON`; client actor IDs are ignored.
- `services/api/server.mjs` mounts `/api/titans/*` only as a private API route. Staging requires `TITANS_STAGING_ENABLED=true`, an absolute `TITANS_DB_PATH`, and at least two server-configured synthetic/authorized actors.
- API routes: create request, recipient inbox, ACCEPT/DECLINE, participant receipt, recipient revocation.
- Tests cover two-party isolation, wrong-recipient denial, exact scope grants, decline-without-grant, expiry, replay, revocation, audit-chain verification and fail-closed auth.

**Important boundary:** this is a private staging API and SQLite ledger, not D1 and not a production IAM service. No user-facing inbox/buttons, downstream data enforcement, OAuth/SSO, external provider action, contact sync or production deployment is included yet. A grant record does not itself execute or authorize a provider action unless that provider adapter checks the grant at the point of use.

## Partner Skill Creator BUILD

- `packages/titans/skill-manifest.mjs` validates versioned skill drafts against allowlisted purpose, scopes and tools.
- `apps/web/titans-skill-studio.html` creates and exports a local JSON draft only.
- Tool allowlist is limited to read/search/analyze/draft/propose capabilities; send, payment, export, deploy, merge, delete, shell and provider-write actions are excluded.
- Drafts are marked DRAFT, executionEnabled=false, publishable=false, signature=null and requiresHumanApproval=true.
- This is not a sandbox runtime, signing service, marketplace publication or install mechanism.
