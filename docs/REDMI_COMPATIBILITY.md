# Redmi compatibility acceptance

The goal is support for Redmi devices that meet both APK requirements and actual acceptance checks. `minSdk=24` is an installation floor, not a blanket certification of every Android 7/MIUI device. WebView/Chrome compatibility must also be tested.

## Automated Android baseline

The `android-compatibility` pull-request/manual workflow builds the local-first debug APK and tests API 24 and API 36 Google API x86_64 emulators. Evidence JSON includes the actual APK SHA-256, API level, result and individual checks. It performs installation, local WebView launch, EUR calculator initialization and interaction, missing-backend fallback and process relaunch. A failed or absent report is not a pass.

The smoke script refuses physical devices and ambiguous device lists. It uses no user account, guest records, live provider credentials or payment calls. Emulator testing is not Xiaomi firmware or ARM hardware certification. The production-signed candidate must be retested independently.

## Physical Redmi acceptance (pending)

Record model, Android API, MIUI/HyperOS build, WebView version, APK SHA-256 and signature/channel. Verify install/update signature compatibility, cold start, EUR calculation, scrolling/touch, rotation/back navigation, app close/reopen, network loss/recovery, and authorized login/session renewal when an authenticated backend is connected. Record pass/fail and timestamp for the exact candidate. Keep serials, accounts, tokens and personal screenshots out of public evidence.

An emulator pass permits only `ANDROID_EMULATOR_BASELINE=PASS` for those images. Set `REDMI_DEVICE_ACCEPTANCE=PASS` only after physical-device evidence. Live Booking/Fabrick/InfoCert/AI and Play publication retain independent gates.
