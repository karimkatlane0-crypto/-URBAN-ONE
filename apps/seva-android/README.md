# SEVA Android 2.5.0 — Consolidata Locale (DEBUG)

Date: 2026-10-26. This Android APK is **a working local-first consolidation, NOT a production Enterprise AI/Stripe app**. Source in repository `karimkatlane0-crypto/-URBAN-ONE`. Original SEVA 2.4.2 remains separate.

## Bundled functional Android app (no online API)
- Root goals and up to 3 subgoal levels; acceptance criteria/evidence mandatory for verified goals; edit/delete; up to 250 goals; local WebView storage.
- KPI/KPMI on-device: goal completion percentage, pending goals, voluntary CRM intent count. Verified actual payouts displayed as €0 (app does not track bank transactions).
- Lastre CRM: local user-opt-in only; intention categories purchase/rent/lease/credit-information/other, description and budget. No photos or external AI are sent or stored by this CRM.
- Marketing Double Flywheel: purely hypothetical budget-dependent finance-safe preview; zero cashbacks/reimbursements/charges executed.
- Manual WhatsApp composer: only text entered by user; user taps and confirms, app opens external ACTION_VIEW. No automatic messages, bulk outreach or background push.
- Two local JSON backups via Android Storage Access Framework: goals and CRM intents.
- Credentials, banking data, Stripe secrets, API keys and online providers are NOT embedded. WebView blocks network and Android app does NOT request INTERNET permission. External WhatsApp viewer handles its own network.
- Package `ai.seva.enterprise.local.v25`, min API 24, target API 36, version 2.5.0, debug-signed; installed **side by side** with SEVA Locale 2.4.2 to prevent debug-signature update conflicts. To transfer goals: export JSON in 2.4.2, copy its JSON text into 2.5.0 "Ripristina backup" and validate. No automatic cross-app data migration. CRM is new and local-only.

## What is NOT included (still blocked)
The authenticated SEVA Enterprise Node + SQLite host, synced DBRELAY, real OpenAI, real image/photo analysis, Stripe checkout/webhook, payouts or automatic WhatsApp. Full updated source for those features exists in `apps/seva-enterprise/` merged through PR #102; it has NOT been deployed to the first ChatGPT Sites page and cannot be represented as included in this offline APK.

This debug APK is for manual device QA, and is not production-signed, Google Play reviewed or suitable for sensitive personal records. Export backups frequently.

## Direct download
GitHub Actions `.github/workflows/seva-android.yml` builds on Android source change, validates package and SHA-256, and on push to default branch creates a `seva-android-v2.5.0-offline-<8-commit-chars>` **prerelease** with binary and checksum. Only publish/share a direct asset link once that run and its `gh release view` result confirm it was uploaded.

## Required QA after download
Install on physical Android; check goal create/edit/delete, 3-level depth/cycle denial, reopened app persistence, both JSON exports, separate CRM consent, marketing preview €0 actual payout, WhatsApp tap & recipient selection and compatibility with the device. Verify checksum before installing. No actual purchases or mobile money. G1–G6 backend and legal acceptance remain open in issue #82.
