# SEVA — Online network diagnostics (opt-in source candidate)

Prepared: 2026-10-27. Based on Kotlin/Compose code supplied in chat. The Gemini share content was inaccessible.
This directory is optional source for a future connected SEVA Enterprise Android variant, NOT part of the local SEVA 2.5.0 APK.

## Scope
- NetworkDiagnostics.kt: Room entity/DAO, transactional error threshold, OkHttp interceptor and Android notifications.
- DiagnosticsDashboard.kt: lifecycle-aware Compose screen and explicit Android 13+ notification permission button.
- Existing apps/seva-android/app/src/main remains Java and fully offline. No INTERNET permission is added.
- No Gmail, CRM, Gemini, OpenAI, banking or Stripe integration is activated by this source.
- Isolated Android Gradle library project: run gradle -p apps/seva-android/online-diagnostics --no-daemon assembleDebug. This generates an AAR when CI passes, never an APK; the SEVA Android workflow also compiles it separately before the existing offline APK.
- The library is not included by the app's Java Gradle build, and an AAR by itself cannot be installed on a phone.

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

## SYNAPSY configuration attachment — 14 November 2026

The supplied `SynapsyProdConfig.kt` is integrated in this Kotlin library under
`ai.seva.enterprise.config`, matching the existing Android namespace family.
The original attachment's SHA-256 is
`b376eb3dfe5118c16d217212403e46154355b2431bbe07581c027fc8496f065c`.

- `BASE_URL` is consumed by an explicit **Apri SYNAPSY nel browser** action in
  `MainDashboardScreen`. It opens only the canonical Site origin. The installed
  browser owns authentication; no JavaScript bridge, cookies, diagnostics records
  or app credentials are sent by this action.
- `SYNC_GATEWAY_URL` records the same-origin `/api/synapsy/` contract. This
  library does not call it, infer a connected account or start a sync job.
- `ENABLE_OFFLINE_ROOM_QUEUE` is `false`. The existing Room error log is not an
  authenticated outbox. Changing the flag alone cannot implement delivery,
  deduplication, conflict handling or an account boundary.
- `RESPECT_SYSTEM_SCREEN_READER` is a declared policy only. This library has no
  internal TTS engine or runtime screen-reader adapter. It does not suppress
  TalkBack or claim a handset accessibility test.

The source is part of the optional AAR build, not an installed Android app.
The existing `apps/seva-global-android` TWA continues to read its canonical
`/superapp` launch URL from Android resources. The existing offline Java APK
retains its network block and local data. No Room synchronization, automatic
payments or messaging, production signing, DAL verification or Play release is
activated by this attachment integration.

Validation for this change must distinguish the Kotlin AAR build from installation
and real-device tests. Neither a configuration constant nor a successful HTTP
response certifies either device execution or provider delivery.
