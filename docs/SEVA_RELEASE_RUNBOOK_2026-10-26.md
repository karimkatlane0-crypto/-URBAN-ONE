# SEVA · Web + Android Release Gate · 26 October 2026

## What this changes
- `render.yaml` defines a manually provisioned, single-instance Node staging service with persistent SQLite disk and sales disabled. **No Render account or charges were initiated by this GitHub commit.** Initial Render Blueprint deployment may still publish an internet-accessible URL; restrict staging use to synthetic data until customer identity, backup, privacy/retention and security gates pass.
- `apps/seva-android` is a distinct Java Android debug wrapper (min API 24, target API 36). It loads the **previously hosted private** `https://seva.karimkatlane0.chatgpt.site/` over HTTPS. It does not contain or deploy the separate Node Enterprise backend, persist customer records, embed API secrets, or verify user login. Non-SEVA HTTPS links open externally (important for third-party identity and Stripe SCA).
- `.github/workflows/seva-android.yml` assembles an Android debug APK, verifies package/target API, uploads a downloadable artifact and SHA-256. This APK is **not** production-signed or Play-reviewed.

## GO / NO-GO
1. Web: Render must be connected explicitly; paid persistent disk approved; secrets configured in a private manager; check `/health`, backed-up SQLite and authenticated multi-account behavior. SEVA private Sites version ≠ deployed Node Enterprise version.
2. AI: from an authenticated **hosted** Enterprise SEVA session, capture legitimate Responses API `id` and verify no data leak, quotas and error handling. Do not log prompts or secrets.
3. Stripe: use test mode with verified recurring EUR 50 monthly price and actual signed webhooks; test checkout → paid entitlement → cancellation/refund → access revoked. Monthly and annual products must remain distinct. No live payments before acceptance.
4. Students: institution identity provider or authoritative approval needed. No automatic student discount or identity certification.
5. Mobile: download debug APK from GitHub Actions artifact, install on a consenting Android test device, inspect Chrome/WebView SSO flow and Stripe external checkout without payment. Debug-build success does not establish Android app acceptance.
6. Production: signed release keystore, Play Data Safety, Financial Features where applicable, privacy, terms, device checks, provider approval, controlled deployment, support & incident runbook. Do not claim ready or published prematurely.

**Evidence:** prior repo SEVA 2.4.1 with students, cart, i18n, DBRELAY and hosted private Sites v2 reference. This change introduces a separate QA Android artifact path and repeatable Node hosting definition only.
