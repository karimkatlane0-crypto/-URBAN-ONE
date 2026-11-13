# SEVA — Android Trusted Web Activity candidate

Android entry point for the deployed SEVA Intelligence Studio · Enterprise web app.
It opens the same site and account routes used in the browser and by the installable PWA.

## Canonical web destination

- Origin: `https://seva.karimkatlane0.chatgpt.site`
- Launch URL: `https://seva.karimkatlane0.chatgpt.site/superapp`
- Web manifest: `https://seva.karimkatlane0.chatgpt.site/superapp.webmanifest`
- The manifest's `id` and `start_url` are `/superapp`; its `short_name` and this Android launcher label are `SEVA`.
- The public entry page links to `/account` and the personal workspace. Access and provider availability remain governed by the deployed site's authentication and service checks.

The Android launcher loads the deployed web version through Google Android Browser Helper. It does not bundle a second copy of SEVA, copy browser-local data between devices, or activate AI, payments or messaging providers. The selected browser owns the session and network access. Pages that need online data require a connection.

`apps/seva-android` remains the historical SEVA 2.5 offline debug application. Its local data, package and release assets are separate; this module does not replace or migrate that app.

## Android configuration

- minSdk 24, compileSdk and targetSdk 36, Android Gradle Plugin 8.13.2 and Java 17.
- Debug package: `ai.seva.global.debug`.
- Production package candidate: `ai.seva.global`.
- Existing versionCode `1` and versionName `1.0.0-beta` are unchanged.
- Cleartext traffic is disabled. No API keys, signing keys or provider credentials are embedded.
- `asset_statements` declares the app-to-web association for the single canonical HTTPS origin. No additional authentication or payment domains are marked as trusted.

## Production status: signing and website verification pending

The app-to-web declaration alone does **not** verify a Trusted Web Activity. The website must also publish the matching package and the actual signing certificate through Digital Asset Links (DAL). Without successful verification, the browser may show a Custom Tab with its URL bar.

At the 12 November 2026 check, the canonical web manifest returned the `/superapp` identity and `/.well-known/assetlinks.json` returned HTTP 404. This source change does not publish that file, create a signing key, or claim Google Play publication. Do not insert a guessed certificate fingerprint.

Before a production release:

1. Confirm the designated signing setup and exact package. For Play delivery, obtain the **Play App Signing certificate** fingerprint; the upload-key certificate and CI debug certificate are not interchangeable with it.
2. Publish `https://seva.karimkatlane0.chatgpt.site/.well-known/assetlinks.json` as public JSON with HTTP 200, without a redirect, containing `delegate_permission/common.handle_all_urls`, the intended package and its verified SHA-256 certificate fingerprint. Do not add the debug package to production association as a substitute for release signing.
3. Verify DAL using the installed release candidate and its actual signing certificate. Keep browser verification enabled. Confirm that the launcher reaches `/superapp`, that account sign-in and sign-out work, and that external authentication or payment pages retain their own browser origin.
4. Test launch, back navigation, an unavailable network and foreground return on real Android devices, including the minimum supported Android version. Confirm the account shown belongs to the person testing.
5. Build and sign the production AAB with the designated upload key, then complete the current Play Console declarations, device testing and review. This debug workflow performs no store upload.

## Build and verification

The dedicated workflow `.github/workflows/seva-global-android.yml` validates the canonical URL, HTTPS association, launcher metadata and target API before building:

```sh
gradle -p apps/seva-global-android :app:assembleDebug --no-daemon
```

It inspects the resulting APK with `aapt`, checks `ai.seva.global.debug` and targetSdk 36, and verifies the existing debug signature using `apksigner verify --verbose --print-certs`. The artifact retains the debug APK, metadata, signature verification and SHA-256. This verification does not sign or re-sign the APK. A successful build establishes source and packaging validity; device installation, DAL, release signing and store distribution require their own evidence.

The repository's `SEVA Global Public HTTP Smoke` workflow checks the canonical `/superapp`, `/mobile`, `/account`, `/sw.js` and `/superapp.webmanifest` responses, including the manifest's exact identity and start URL. Its report leaves account sign-in, Android/iOS installation, DAL, release signing and provider activation explicitly untested. HTTP success is a separate result from the Android build and real-device checks.

Official references:

- [Chrome Trusted Web Activity integration](https://developer.chrome.com/docs/android/trusted-web-activity/integration-guide)
- [Digital Asset Links statement location and format](https://developers.google.com/digital-asset-links/v1/create-statement)
- [Android app signing and Play App Signing](https://developer.android.com/studio/publish/app-signing)
