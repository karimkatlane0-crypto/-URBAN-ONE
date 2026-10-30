# URBAN ONE v7 — Enterprise Remote Install Gate

Status: `ARCHITECTURE_READY / EMM_CONNECTION_REQUIRED`

## Objective

Deploy URBAN ONE to authorized organization-owned or organization-managed Android devices through Android Enterprise + an EMM/MDM + Managed Google Play.

This document does **not** claim that a remote installation has occurred. `REMOTE_INSTALL_ACTIVE` becomes true only after an authenticated EMM reports successful assignment/deployment to enrolled devices.

## Release lanes

### Public Play lane
- Application ID: `com.urbanone.universal`
- Artifact: production-signed Android App Bundle (AAB)
- Distribution: Google Play production tracks after policy review
- State: `PLAY_READY / NOT_YET_SUBMITTED`

### Enterprise managed lane
- Recommended enterprise Application ID: `com.urbanone.universal.enterprise`
- Distribution: Managed Google Play / private or managed app
- Device scope: enrolled Android Enterprise devices only
- Assignment: EMM device/user groups
- Install mode: required / force install where supported by the selected EMM and enrollment mode
- State: `EMM_CONNECTION_REQUIRED`

## Required control plane

1. Android Enterprise organization enrollment.
2. EMM/MDM tenant authenticated by an authorized administrator.
3. Managed Google Play bound to that enterprise.
4. URBAN ONE enterprise artifact published/approved for that enterprise.
5. Device or user group containing only authorized enrolled devices.
6. Required/force-install assignment created in the EMM.
7. Device deployment result read back from the EMM.

## Gate model

`ARCHITECTURE_READY`
→ `EMM_CONNECTED`
→ `MANAGED_PLAY_BOUND`
→ `ENTERPRISE_ARTIFACT_PUBLISHED`
→ `DEVICE_GROUP_ASSIGNED`
→ `FORCE_INSTALL_POLICY_APPLIED`
→ `DEPLOYMENT_CONFIRMED`

Only after the final readback may the project state be reported as `REMOTE_INSTALL_ACTIVE`.

## Security / DevSecOps requirements

- No EMM, Google, database, signing, API, or service-account secrets in Git.
- Use provider secret stores / GitHub Environments / enterprise vaults.
- Least-privilege service accounts and role assignments.
- Device assignment must be restricted to organization-authorized endpoints.
- Keep public Play and enterprise-managed release governance separate.
- Capture package ID, version code, version name, artifact SHA-256, EMM policy ID, target group ID, assignment timestamp, deployment status, and failure reason in the evidence ledger.
- No silent install to unmanaged third-party/personal devices.

## DBRELAY boundary

SEVA has an implemented **same-origin, authenticated DBRELAY 2.0** in `apps/seva-enterprise/` with SQLite change events, cursor recovery, account isolation and WAL-aware backup/restore. Its 2026-10-30 source-acceptance document reports local tests passing. **Hosted Render HTTPS, durable-volume restart/recovery and an externally authenticated deployment remain unverified**. This SEVA data relay is **not** an EMM/MDM connector and does not provision, enroll, assign policies to, or remotely install apps on Android devices.

A database relay must never be used to bypass Android Enterprise/EMM enrollment, Google Play authorization, user/organization authorization, or device policy controls.

## Provider-neutral deployment contract

The chosen EMM integration must provide equivalent operations for:

- authenticate administrator/service principal;
- discover Managed Google Play binding;
- locate or publish the enterprise application;
- create/read target device/user group;
- assign application with required/force-install intent;
- read deployment status per device;
- export auditable deployment evidence.

## Current blockers

- No EMM/MDM connector is currently attached to the ChatGPT workspace.
- No authorized Desktop Commander device is currently connected for local administrative execution.
- SEVA DBRELAY is implemented in source but has no proven hosted production/staging endpoint; no DBRELAY-to-EMM integration exists.
- No EMM deployment receipt has been produced.

Therefore the authoritative state remains:

> `ENTERPRISE_REMOTE_INSTALL — ARCHITECTURE_READY / EMM_CONNECTION_REQUIRED`
