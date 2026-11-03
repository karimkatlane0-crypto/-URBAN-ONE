# SEVA v26 — Amazon owner setup

Published site: https://seva.karimkatlane0.chatgpt.site

Owner panel: https://seva.karimkatlane0.chatgpt.site/amazon/setup (owner sign-in required).

Public student guide: https://seva.karimkatlane0.chatgpt.site/amazon

This source snapshot matches Sites commit `94f271bbe87bc1fa7fd26e02b67bd46bdae473c2`, version 26, successfully published on 3 November 2026. It does not deploy or replace the separate Enterprise Node app or the URBAN ONE Worker.

Source archive: [seva-source-94f271b.tar.gz](seva-source-94f271b.tar.gz), SHA-256 `5e013e6bb39aa3828759bf1a76f30d8b5ba48517cb8ed9b1e1142b19f5c6a909` (82 files).

The archive contains application source, compiled Worker, tests, scripts, package files and database schema/migrations. It omits screenshots, historical provider payloads, private attachments and plugin submission packages. The Sites project ID is preserved for provenance; do not deploy to the owner's project from an unrelated account.

Verification: 128 tests passed; build and Worker ESM validation passed. Browser QA was unavailable due to the existing infrastructure timeout. The setup panel is read-only and owner-protected. No Amazon account settings, payouts, API credentials, subscriptions or campaigns were activated.

See [release evidence](evidence.json) and [alignment notes](ALIGNMENT.md). For local checks after extracting the archive: `node scripts/compile.mjs`, `npm test`, `npm run build`, `npm run validate`.
