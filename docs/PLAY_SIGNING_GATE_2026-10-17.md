# URBAN ONE v7.0.0 — Google Play Production Signing Gate Evidence

Date: 2026-10-17

## Release identity

- Application ID: `com.urbanone.universal`
- Version name: `7.0.0`
- Version code: `7000001`
- Target SDK: `36`
- Intended release channel: Google Play production

## Live signing-gate execution

A controlled one-shot execution of `.github/workflows/play-release.yml` was triggered to verify whether the protected production signing environment was actually ready.

- Trigger commit: `f104d0e91aebd88ba4dc96e00025305ea9d92761`
- Workflow: `play-release-candidate`
- Workflow run: `39028962846`
- Job: `signed-aab`
- Job ID: `117385415082`
- Result: `FAILURE`

The job successfully completed runner setup, checkout, Node setup and Java setup, then failed at `Validate signing secrets are configured`.

At execution time all four required production signing inputs were empty/unavailable in the `google-play-production` environment:

- `PLAY_UPLOAD_KEYSTORE_B64`
- `PLAY_UPLOAD_KEYSTORE_PASSWORD`
- `PLAY_UPLOAD_KEY_ALIAS`
- `PLAY_UPLOAD_KEY_PASSWORD`

Because the workflow is fail-closed, all downstream production-signing steps were skipped: mobile dependency install, Android generation, policy preflight, release AAB build, upload-key signing, checksum/manifest generation, provenance attestation and signed artifact upload.

## Safety restoration

The temporary one-shot push trigger was removed immediately after the diagnostic execution. The production workflow was restored to manual `workflow_dispatch` only.

- Restore commit: `5ea25dd7107d98d45bc4d283aa79be798186e052`
- Restored workflow content SHA: `e944291176a623e89385596faa7f8492b5f36857`

No keystore, password, private certificate or service-account credential was committed to the repository.

## Current evidence-based release state

- Source / CI baseline: `PASS`
- Android API 36 preflight: `PASS`
- Unsigned/release AAB build capability: `PASS`
- Production upload-key signing: `BLOCKED — SIGNING SECRETS NOT CONFIGURED`
- Exact signed AAB checksum / provenance: `NOT YET PRODUCED`
- Exact signed-candidate real-device acceptance: `OPEN`
- Play Console policy/content declarations: `OPEN`
- Play Console production artifact acceptance: `NOT VERIFIED`
- Google review submission: `NOT VERIFIED`
- Production rollout: `NOT VERIFIED`
- `PRODUCTION_PUBLISHED`: `NO`

## Required next gates

1. Configure the four `PLAY_UPLOAD_*` values directly as protected secrets in the GitHub Environment `google-play-production`. Do not paste them into chat or commit them to Git.
2. Execute `play-release-candidate` and require a fully successful signed-AAB job.
3. Verify the generated AAB signature, SHA-256, release manifest and provenance attestation.
4. Perform real-device acceptance on that exact signed release candidate.
5. Complete Google Play Console account, Play App Signing, Data safety, privacy policy, account deletion (if applicable), Financial features, content rating, target audience, ads, app access and other required declarations from verified behavior.
6. Upload the accepted production AAB and resolve every blocking Play Console error/warning.
7. Submit the production release for Google review.
8. Record `SUBMITTED-FOR-REVIEW`, then `IN-PRODUCTION-ROLLOUT`, and use `PRODUCTION-PUBLISHED` only after Google Play Console provides authoritative production-availability evidence.
