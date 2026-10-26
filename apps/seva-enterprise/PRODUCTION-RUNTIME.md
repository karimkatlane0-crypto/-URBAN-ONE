# SEVA independent runtime — 26 October 2026

SEVA remains in `apps/seva-enterprise`, separate from URBAN ONE and KKUBERA.
These changes prepare the Node backend; they do not update the existing Work site or Android APK.

## Startup and monitoring

In production set `SEVA_PUBLIC_URL` to the exact HTTPS origin, without credentials,
query, fragment or a subpath. Set `SEVA_DB_PATH` to an absolute file path on a
persistent mounted volume. Startup rejects missing/invalid settings before opening
the database. An absolute path alone does not prove the hosting volume is durable.
Use one service instance with the current SQLite design.

`/health` reads the database and returns 503 if that read fails. A successful health
check does not certify backup recovery, provider connectivity, or a commercial release.
Browser writes compare the entire configured origin, including scheme and port;
untrusted Host and forwarded headers cannot replace that configured origin.
Native requests without Origin still require route-specific authentication.

## Acceptance still required

1. Deploy this backend on an authorized persistent host and record its commit and HTTPS origin.
2. Register two synthetic accounts; verify isolation, goal edits and DBRELAY changes.
3. Restart the hosted service and repeat login/read checks on the same volume.
4. Complete offsite backup and isolated restore; PR #87 contains a separate recovery candidate and is not treated as integrated here.
5. Configure server-only OpenAI credentials and capture the authenticated response ID from the deployed origin.
6. Run a real Stripe sandbox purchase, signed webhook, entitlement, cancellation and revocation.
7. Test the matching online Android application on a physical device, including reconnection.

Keep sales disabled until these release checks are evidenced. No provider contract
acceptance, new payment, external relay certification or production deployment is
implied by source tests. Track the release decision in issue #82.
