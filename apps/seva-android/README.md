# SEVA Android 2.4.2 — Offline Local-First QA

## Root cause of previous "Not found"

The old 2.4.1 debug APK was a **10 KB WebView shell** opening a hosted SEVA Work URL, which may display `Not found` on the user's Android browser. It had no bundled UI.

## Fixed in 2.4.2

- Bundle a functional offline-first goal workspace at `app/src/main/assets/seva-offline.html`; the Android launcher opens it using a secure virtual HTTPS base origin.
- No network requests are allowed or needed; manifest has no INTERNET permission.
- Root goal and up to 3 subgoal levels, criteria, evidence, statuses, editing/deletion, 250 goal limit.
- Data saved in local WebView storage **on this device only**, without accounts or synchronization. Data from previous SEVA hosted origin is not automatically migrated.
- System file-picker export of JSON via Storage Access Framework and validated text-paste JSON import.
- Logo from user's supplied SEVA brand icon. Separate Android ID `ai.seva.enterprise.local` prevents debug-signature update errors from old 2.4.1 APK. App appears as **SEVA Locale**.

No OpenAI API key, backend, university verification, remote login, Stripe checkout or live payments are included. This build must never be represented as the final commercial app. This local prototype is not automatically encrypted and is unsuitable for high-sensitivity user data.

## Verification

JDK 17, Gradle 8.13, Android SDK 36:

```sh
gradle -p apps/seva-android --no-daemon assembleDebug
```

GitHub Action `SEVA Android Debug APK` verifies package, API levels, embedded offline HTML, absence of Android INTERNET permission, JS syntax and publishes a **debug pre-release** download with SHA-256. Run Android **device-based manual QA** for create/edit/delete, 3-level limit, offline startup, persistence across restart, JSON SAF export/re-import, icon, navigation and accessibility.

Backend + Stripe + OpenAI production gates remain in `docs/SEVA_RELEASE_RUNBOOK_2026-10-26.md` and Issue #82.
