# URBAN ONE v7 — Play Release Preflight

Date: 2026-10-16

## Verified
- GitHub App installation 171968056 is accessible.
- A dedicated preflight branch was created through the GitHub integration.
- `.github/workflows/play-release.yml` exists on `main-@URBAN-ONE` and defines a manual workflow using environment `google-play-production`.
- Workflow includes secret presence checks, Android AAB build, jarsigner signing and verification, SHA-256 manifest, provenance attestation and artifact upload.

## Not yet verified
- Production signing secrets configured in GitHub environment.
- Successful execution of the signed Play release workflow.
- Signed AAB file and independent SHA-256 verification.
- Google Play Console review and production publication.

## Required next gates
1. Configure protected environment and four PLAY_UPLOAD_* secrets directly in GitHub (never commit secrets).
2. Run play-release-candidate manually on the intended commit.
3. Inspect job logs, downloaded AAB, signer certificate, SHA-256 and provenance.
4. Complete Play Console policy declarations and submit for review.
5. Mark PRODUCTION-PUBLISHED only after verified Google Play production availability.

This document is a preflight record, not a certification of a signed build or published release.
