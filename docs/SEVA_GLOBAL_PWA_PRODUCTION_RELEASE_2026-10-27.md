# SEVA Global — Web/Android PWA Production Release (27 October 2026)

## Verified release receipt
- Owner Vercel project: seva-executive-studio-preview (existing project).
- Production alias: https://seva-executive-studio-preview.vercel.app/
- Production deployment: dpl_CEWzfVzKbt2k7D7X4NJy3Y25LzD9 (target: production, state READY, aliases assigned without error).
- GitHub source: karimkatlane0-crypto/-URBAN-ONE, branch main-@URBAN-ONE.
- PR #108: https://github.com/karimkatlane0-crypto/-URBAN-ONE/pull/108 — merged; squash commit b40349776fa350bf96010ff89e57aff70344ea83.
- PR #108 GitHub Actions: ci SUCCESS; SEVA Enterprise Phases II–III SUCCESS on reviewed PR head c61d393cdaa3d4f996f0b6422da0a0b902ea3bc0.
- Vercel deployment contains 16 static source files including index.html, studio.js/css, PSDM module, mobile.html, manifest, service worker, backup-global.js and real PNG icons (192px and 512px).

## Public pages
- Studio home: https://seva-executive-studio-preview.vercel.app/
- Decision Studio: https://seva-executive-studio-preview.vercel.app/psdm.html
- Android installation guide: https://seva-executive-studio-preview.vercel.app/mobile.html

## What works in this STATIC release
- Mobile-friendly SEVA Studio shell and account-independent on-device goal draft creation/removal in localStorage.
- Manual backup of local drafts to JSON and human-confirmed import; no external upload.
- PSDM decision support: user-provided weights, alternatives, evidence, deterministic ranking and JSON export; no remote API execution.
- PWA manifest, offline caching of approved static files only (explicit API/checkout/session exclusions), splash/icon assets with SVG + PNG 192/512.
- Installation or home-screen shortcut from Chrome on supported Android devices; dependent on browser/device. User's physical-device acceptance NOT performed.

## What is not certified
- No proof of Google Play publication, production-signed native APK/AAB, device lab acceptance, Play Console readiness, or worldwide country-by-country distribution.
- No connection between the Vercel STATIC frontend and the independently hosted Node SQLite backend. DBRELAY, tenant sync, OpenAI AI calls, Codex execution and Stripe/SEPA payment collection are NOT enabled by this release.
- The separate ChatGPT Sites account chooser screenshot does not prove a completed login/session.
- No remote HTTP/browser E2E was recorded; Vercel deployment READY + assigned alias + source files alone are not full website-visitor acceptance.

## Android/Play release gate
1. On physical Android with Chrome: open Studio over HTTPS, use browser Install app/Add to Home screen, verify home-screen shortcut, launch, offline UI, local create/export/import, PSDM and delete. Validate service-worker update.
2. New Play native wrapper/TWA requires app signing, matching origin Digital Asset Links, bundle target API 36 and ownership of the Google Play developer account and production signing key. Existing SEVA 2.5 offline APK is a different app and cannot be declared globally Play-published.
3. Complete Data Safety, privacy notice, terms, customer support, content classification, Financial Features declarations if relevant, store listing/assets/country release and review. For new personal Play accounts opened after Nov 13, 2023, closed testing of 12 testers for at least 14 days is normally required before production access.
4. Play digital subscriptions must follow Google Play payments policy; EEA alternative billing requires enrollment, reporting, region handling and applicable fees. Do not embed universal bank-transfer checkout in a Play app without compliance.
5. Hosted AI service needs authenticated Node HTTPS backend, paid OpenAI Platform quota, server-managed key, real provider response ID; payments require full verified beneficiary/IBAN, legal basis and independently reconciled bank credits.

## Risk/rollback
- Prior production deployment: dpl_GTrNXPuHfb652KddGvEMBACDWpsd; Vercel rollback/promote requires deliberate authorized admin action.
- All account credentials and provider keys remain server-side; no secret added to global static assets.
- Commercial go-live: NO-GO, despite the static web release being READY.
