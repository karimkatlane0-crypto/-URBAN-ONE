# Session authentication before asynchronous persistence

The session boundary now waits for `store.fromSession(token)` before any
session-protected route reads the user. The existing SQLite implementation
continues to return a synchronous `{id, email}` record; a future asynchronous
lookup can return the same record through a Promise.

Missing tokens and missing/invalid identities return the existing HTTP 401
`Please sign in` response. Synchronous lookup failures and rejected lookups
produce HTTP 503 with a fixed message. Database details and supplied error
statuses do not reach the response or the server error logger. Only `id` and
`email` pass through the boundary, including for SQLite's null-prototype rows.

All 42 existing session-auth call sites await this boundary. Six regression
tests cover 45 method/path combinations, delayed lookup, malformed identities,
sanitized failures, extra-field exclusion and two users resolving concurrently
in reverse order. The full application suite has 322 passing tests.

This is one prerequisite for PostgreSQL migration. It does not add a PostgreSQL
driver, change the database, or make other persistence methods asynchronous.
Registration, login, logout, entitlement reads, Bearer-key authentication,
transaction design, DBRELAY cursors and migrations require their own reviewed
changes. The existing Render configuration and disabled sales gates are intact.

Validation:

```sh
npm run check
npm test
```

All tests use local synthetic accounts and SQLite fixtures. No provider API,
production account, cloud database or payment was used for this change.
