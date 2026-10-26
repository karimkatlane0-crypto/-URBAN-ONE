# SEVA Android Debug QA Shell

Runs a restricted HTTPS WebView for the previously hosted private SEVA site. It is a test APK, **not** the full enterprise Node service or a final production release. See `docs/SEVA_RELEASE_RUNBOOK_2026-10-26.md`.

Build: JDK 17, Gradle 8.13, Android SDK 36: `gradle -p apps/seva-android assembleDebug`. CI workflow publishes the debug artifact. Do not add keys, tokens or student PII to the source.
