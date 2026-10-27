# SEVA — Online network diagnostics (opt-in source candidate)

Prepared: 2026-10-27. Based on Kotlin/Compose code supplied in chat. The Gemini share content was inaccessible.
This directory is optional source for a future connected SEVA Enterprise Android variant, NOT part of the local SEVA 2.5.0 APK.

## Scope
- NetworkDiagnostics.kt: Room entity/DAO, transactional error threshold, OkHttp interceptor and Android notifications.
- DiagnosticsDashboard.kt: lifecycle-aware Compose screen and explicit Android 13+ notification permission button.
- Existing apps/seva-android/app/src/main remains Java and fully offline. No INTERNET permission is added.
- No Gmail, CRM, Gemini, OpenAI, banking or Stripe integration is activated by this source.

## Corrections from the pasted draft
- The undefined unsyncedErrors identifier is replaced by unsyncedCount.
- The notification is completed with content intent, build and notify, and channel/permission handling.
- Store only hostname, verb, status, timestamp and bounded error category; never URL paths, query parameters, tokens, headers, bodies or localized exception messages.
- The fifth UN-SYNCHRONIZED event triggers the alert ONCE on threshold crossing, not for every subsequent event. These are not claimed to be five consecutive offline errors.
- Record HTTP 429 and 5xx plus IOException, not every HTTP 4xx; preserve HTTP response/exception semantics.
- The recorder commits Room writes transactionally; logging failures do not replace the original network result.
- Permission is requested only from a user-tapped Compose button, not automatically on startup.
- Room Flow and lifecycle-aware Compose observation replace a one-time dashboard reload.

## Integration steps for a future ONLINE flavor only
1. Make a separate Kotlin/Compose-compatible product flavor or Android library; place the sources in that online source set. Pin and verify Kotlin, Compose compiler, KSP, Room runtime/ktx/compiler, OkHttp, AndroidX lifecycle and notification dependencies in CI. This directory alone is not compiled by the Java-only build.
2. Add android.permission.INTERNET and android.permission.POST_NOTIFICATIONS only to the ONLINE manifest, not to the existing offline manifest.
3. Initialize an encrypted/retention-governed Room database (NetworkDiagnosticsDatabase) and expose errorDao. Decide and implement retention, deletion/export, local backup exclusion and access control BEFORE customer data use.
4. Construct NetworkErrorRecorder(db) { count -> NetworkNotificationHelper.showNetworkErrorAlert(applicationContext, count) }; attach NetworkErrorInterceptor(recorder) only to a specifically authorized OkHttp client. No calls happen automatically.
5. Create DiagnosticsViewModel(dao), route navigation to a diagnostics screen, and test actual activity/permission behavior. A notification currently launches the app, not a verified diagnostics deep link.
6. Keep CRM Lastre voluntary and independent. Never send intentions, photos, contact details, student identities, payment data, prompts or provider credentials to telemetry. Any syncing/upload of logs is a separate opt-in authenticated feature, not built here.

## Acceptance gates
- [ ] Kotlin/Room/Compose compilation with pinned dependencies on Android CI.
- [ ] HTTP 429/5xx recorded; ordinary client 4xx ignored; IOException recorded then rethrown.
- [ ] Five pending events trigger ONE alert; sixth and later do not spam.
- [ ] Android 13+ denial and channel disabled: no notification.
- [ ] Persisted records survive restart; retention/deletion/export implemented.
- [ ] No URL path/query/header/prompt/PII in persisted logs.
- [ ] No user data, credentials or provider calls without explicit authenticated opt-in.
- [ ] Existing SEVA 2.5.0 build still has no INTERNET permission and unchanged behavior.
- [ ] Emulator and physical handset tested; production signing/Play checks separate.
- [ ] Live SEVA commercial release remains NO-GO until hosting, identity, verified AI, payments, consent and legal gates pass.

Verification level: candidate source only; NOT a compiled Kotlin module, NOT published to mobile devices, NOT Play approved.
Rollback: close the draft PR without merging; shipping offline app remains unchanged.
