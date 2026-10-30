# DBRELAY — verified source corrections, 30 October 2026

Scope: `apps/seva-enterprise` in `karimkatlane0-crypto/-URBAN-ONE`.
Baseline: `e07bef786c453a5a2b28a3bb23c064042e1be49b`.

## Corrected behavior

1. A successful event-feed fetch followed by a failed snapshot used to advance the browser cursor without applying the new state. The client now commits its cursor only after the snapshot succeeds. It retries interrupted transfers, refreshes after a lower restored cursor, and uses one full snapshot for large backlogs.
2. Logout resets synchronization, clears goals/editor state, and invalidates requests still in flight. A new account starts with a fresh snapshot; private goal data is kept in memory.
3. Goal and campaign insert/update/delete events are transactional and account-scoped. Campaign update and delete triggers are installed on existing databases at startup. Cascaded subgoal deletions emit tombstones; rolled-back transactions do not emit committed events.
4. Restore used to copy only the SQLite main file. Committed WAL changes could therefore be missing from an otherwise valid recovered database. Both backup and restore now use SQLite's online backup API, validate integrity and foreign keys, produce a standalone 0600 file, and refuse replacement of an existing destination.
5. The two-account restart probe now requires a changed random process ID and a healthy database. Running it twice against the same process fails. Cross-account write denial must be HTTP 403 or 404, rather than counting arbitrary failures as success.

## Local evidence

Runtime: Node 24.22.1, temporary SQLite databases and synthetic identities only.

| Command | Result |
| --- | --- |
| `cd apps/seva-enterprise && npm run check` | PASS |
| `cd apps/seva-enterprise && npm test` | 316/316 PASS |
| Repository root `npm test` | 203/203 PASS |
| Repository root `npm run verify` | PASS |

The tests cover HTTP access control, two isolated accounts across a real child-process restart, WAL-aware recovery, no-clobber publication, transactional event capture, cursor retry and invalidation during an account change. They do not call external AI or payment providers.

## Related screenshot reconciled

The integration commit `ed3dc1497fd5ab3a7657c52e7f88112dfa0094d4` shown in the supplied screenshot is now an ancestor of the integration repository's default branch `main-@URBAN-ONE` at `be1e119172f7fb6921c9311b08c24a9055a0621b` (GitHub comparison: ahead 0, behind 5). Its old “not yet integrated” caption no longer describes that branch. This ancestry does not establish a deployed app or connect the separate DBRELAY backends.

## Hosted release remains unverified

No Render service access or verified Render HTTPS origin was available in this session. No hosted restart, persistent-volume recovery, scheduled/offsite backup, authenticated provider AI response, Android-device flow or live release was performed. OAuth profile-access screenshots do not prove those runtime capabilities.

For hosted acceptance use `BLACKBOX-G11-HOSTED-RESTART.md` with a newly generated v2 private receipt, the deployed candidate commit, one persistent SQLite service instance and the hosting provider's restart evidence. Restore to a fresh offline destination and validate both accounts before switching to it. Keep private receipts and databases outside Git and the web root.

Decision: source checks PASS; hosted/commercial release NO-GO pending measured evidence. “Tier-1” is a requested quality goal, not an external certification or guarantee.
