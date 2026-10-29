# SEVA — HTTPS, two accounts, restart and recovery

## Proven synthetic acceptance

`test/https-recovery.test.mjs` drives the actual production-mode Node backend through
a local HTTPS ingress. Each run creates its own temporary CA and explicitly trusts
it in the probe process; TLS validation stays enabled. A request without that trust
must fail before creating accounts or a private receipt.

The test then creates two synthetic accounts and goals through HTTPS, checks account
isolation, rejects a restart claim on the same process, backs up live SQLite, stops
and starts Node, and reauthenticates both accounts. Finally it restores the snapshot
to a **new** SQLite file, starts Node on that recovered file and repeats HTTPS login,
goal isolation, ownership-denial and DBRELAY cursor checks. The original database
is not overwritten. Backup and restore also reject existing target files.

Run from `apps/seva-enterprise`:

```bash
SEVA_HTTPS_RECOVERY_REPORT_PATH=/secure/synthetic-https-recovery.json \
  node --experimental-sqlite --test test/https-recovery.test.mjs
```

The JSON contains only phase results and scope labels. Temporary credentials, keys,
certificates and databases are removed by the test and must not be CI artifacts.
The Tier-1 workflow publishes the sanitized acceptance report alongside its existing
HTTP acceptance report. Full Enterprise tests include this test as well.

## Actual hosted acceptance — still required

This local HTTPS test does **not** certify a public origin, a cloud-provider restart
or offsite recovery. At the 29 October checkpoint, Render was discoverable but not
connected in the active session; no SEVA Replit app or actual Render URL was found.
The existing Vercel project remains a separate static deployment.

For the actual isolated staging service:

1. Connect the hosting account and inspect the existing service before creating
   anything. Confirm the runtime, persistent disk, one instance and any plan costs.
   Deploy the reviewed candidate containing the boot-ID endpoint and v2 probe;
   main before PR #123 does not have those changes.
2. Record the actual deployment ID and HTTPS origin. Configure `SEVA_PUBLIC_URL`
   with that origin and `SEVA_DB_PATH=/var/data/seva.sqlite`. Keep sales, bank orders,
   AI and external-provider credentials disabled for this storage-only acceptance.
3. From an authorized operator environment run `blackbox-g11.mjs prepare` against
   that exact HTTPS origin, with `SEVA_BLACKBOX_STAGING=YES`. Keep the private v2
   receipt outside source control and collect only its public evidence.
4. Restart the single staging Node instance through the provider. Preserve the
   volume. Record the provider operation/deployment receipt; run `verify` against
   the same origin and private receipt. A changed boot ID is necessary but is not
   itself an independent provider restart receipt.
5. On the authorized server, run `maintenance.mjs backup` using the actual SQLite
   source and a new private destination. Copy the verified snapshot to approved
   offsite storage if recovery from disk loss is in scope; another file on the same
   disk is not an offsite backup.
6. Run `maintenance.mjs restore` into a **new** private SQLite path. Do not overwrite
   the operating database. Point only the staging service at the recovered path,
   restart it through the provider and repeat the same HTTPS `verify` phase. Keep
   the original database and record rollback settings until acceptance completes.
7. Record deployment identity, origin, TLS result, provider restart evidence,
   snapshot integrity and two-account/cursor results. Do not mark the hosted gate
   complete until this evidence exists. Remove synthetic data and private receipts
   through the authorized staging retention procedure.

Commands for authorized server maintenance, using actual private paths:

```text
node --experimental-sqlite maintenance.mjs backup <live-db> <new-private-snapshot>
node --experimental-sqlite maintenance.mjs restore <verified-snapshot> <new-recovery-db>
```

No cloud service, API credit purchase, production data change or payment is caused
by adding or running the synthetic acceptance test.
