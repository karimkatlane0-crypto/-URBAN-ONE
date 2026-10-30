# SEVA IS CALLED — FASE II · DBRELAY 2.0

**Scope:** enterprise source integration in `apps/seva-enterprise/`. Separate from KKUBERA DBRELAY v2.1.4 (properties, visits and Stripe); no transfers between apps or implicit access to KKUBERA data.

## What has been implemented in the SEVA code

- Existing SQLite storage is the **server source of truth**, with WAL/foreign keys and user-scoped goals / campaign drafts.
- New `dbrelay_changes` append-only log: triggers record goal and campaign draft inserts, updates and deletes in the same SQLite transaction as the business write. Each change stores only owner ID, resource category, resource ID, action and sequence/time — never API keys, OpenAI prompts, image/photo bytes, payment details or goal descriptions.
- Authenticated, same-origin `GET /api/dbrelay/status`: user-specific counters and cursor plus explicit `externalRelayConnected:false` and `paymentsExecuted:false`.
- Authenticated `GET /api/dbrelay/snapshot`: consistent current goal and campaign data and high-water cursor. Snapshots reject more than 5,000 records; use standard resource endpoints instead in that case.
- Authenticated `GET /api/dbrelay/changes?after=0&limit=50`: pagination up to 100 event headers per request; owner-only and no private contents in the change feed. Client must refresh snapshot after receiving events.
- UI tab **DBRELAY** has a manual `Sincronizza dal server` action and displays persistence status, goal/campaign counts and synchronization cursor. Does not use localStorage for private data.
- The client acknowledges the cursor only after retrieving a complete snapshot. A failed snapshot is retried from the last applied cursor; a restored lower cursor forces a new snapshot. Large event backlogs use one current snapshot instead of draining all event pages. Logout invalidates pending sync requests and clears goal/editor state.
- No external synchronization or payments are performed, no new endpoint or credit/Stripe key is required, and no photos are uploaded. Session auth and existing safe cache policy remain in place.
- Data stored on persistent SQLite survives application process restarts; `:memory:` is only a test configuration.

## Acceptance and limitations

| Check | Requirement |
| --- | --- |
| Source | GitHub PR reviewed and merged only after isolated tests + global CI |
| Functional | insert/update/delete captured, paginated cursor and no duplicate sequence |
| Tenancy | two users cannot read each other's goal content or event feed |
| Recovery | persistent SQLite close/reopen restores stored goals and DBRELAY history |
| Security | anonymous 401, invalid cursor 400, input caps, no sensitive data in event payload, no external data transfer |
| Business | Annual buyer €50/year, e-commerce €500/year, A=€50/month, all unchanged |
| Live | REAL public HTTPS deployment, durable disk volume, monitored backups, authenticated OpenAI response and Stripe checkout-to-entitlement test remain to verify |

**Important:** DBRELAY 2.0 in this branch is a working **same-origin durable change feed for a single SEVA server**, not a cloud multi-primary database, live cross-device push notification service, or a certified connector to KKUBERA. Do not market cloud or production readiness without actual HTTPS + disk + backup/restore and mobile acceptance evidence.

## Deployment guardrails
1. Keep `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in a secret manager; never transmit keys via client, change logs or git.
2. Run one persistent SQLite writer or migrate to a separately validated transactional DB for multiple replicas. `SEVA_DB_PATH` must point to a real durable mounted volume, not ephemeral filesystem.
3. Use `maintenance.mjs backup|restore <source> <new-destination>` for a consistent SQLite copy including committed WAL pages. Both commands check integrity and foreign keys, prepare a private 0600 standalone database, and publish only to a new destination. Restore into a fresh offline path, then separately validate and switch the service; do not copy a live database file manually. These commands do not configure offsite storage or scheduled backups.
4. Verify separate Work website deployment and authenticated first AI answer; do not overwrite existing site or claim DBRELAY there until deployed.
5. Keep SEVA Stripe Checkout gates disabled until plan-specific purchase, paid signed webhook, entitlement and cancellation lifecycle are validated in TEST; no automatic refund marketing payouts.
