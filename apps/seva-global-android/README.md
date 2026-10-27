# SEVA Global — Android Trusted Web Activity candidate

Independent Android package for the live static PWA, not an update of apps/seva-android (SEVA 2.5 offline debug).

## What this build does
- Launches https://seva-executive-studio-preview.vercel.app/ in the browser via Google Android Browser Helper.
- Build minSdk 24, compileSdk and targetSdk 36, Android Gradle Plugin 8.13.2 and Java 17.
- Debug package id ai.seva.global.debug, deliberately separate from unsigned production package candidate ai.seva.global.
- No in-app OpenAI API keys, Stripe keys, banking credentials or paid activation controls.
- Site currently only offers browser-local goals, decision support, backup, and organic trial pages.

## PRODUCTION STATUS: NO-GO
Digital Asset Links is NOT configured until an actual release signing certificate SHA-256 and verified Play App Signing fingerprint are available. **Do not invent a fingerprint.** Without successful DAL verification, users see a browser Custom Tab instead of the full-screen Trusted Web Activity.

To release to Google Play: obtain the official account and app signing setup; test on a real Android device, ensure assetlinks.json exists on the live origin and lists the exact production package and signing fingerprint; sign the AAB with the designated upload key; complete Play target API 36, data safety, financial features and billing policy, declarations, screenshots, country selection and review. This code does NOT claim Play publication or approval.

## Build tests
In CI run: gradle -p apps/seva-global-android :app:assembleDebug --no-daemon

Check package name, permissions and targetSdk with aapt; the debug APK opens **web** SEVA and needs network access in the browser. Do not upload debug APK as production AAB.

Official TWA setup: https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2
Official Android Play targets: https://support.google.com/googleplay/android-developer/answer/11926878
