# URBAN ONE UNIVERSAL v7.0.0 — Google Play Release Gate

Last reviewed: 2026-10-16

This document is the release checklist for `com.urbanone.universal`. It separates source/build readiness from Google Play account, policy, identity and production-review gates.

## 1. Immutable release identity

- Application ID: `com.urbanone.universal`
- Version name: `7.0.0`
- Version code: `7000001`
- Android target: API 36 / Android 16
- Mobile runtime: Capacitor 8.5.3
- Production format: Android App Bundle (`.aab`)

Do not reuse version code `7000001` after Google Play accepts a release using it. Every subsequent Play upload must increment `versionCode`.

## 2. Current technical gates

- Source published on `main-@URBAN-ONE`: PASS
- CI/tests/evidence: PASS for current branch lineage
- Android API 36 preflight: PASS
- Debug APK build: PASS
- Release AAB build: PASS
- Reproducible private signing workflow: READY (`.github/workflows/play-release.yml`)
- Store-side upload/review: EXTERNAL GATE
- Real-device acceptance: REQUIRED BEFORE PRODUCTION

## 3. Signing model

Use Google Play App Signing for distribution. Keep the upload key private.

The repository MUST NOT contain keystores, private certificates, passwords, service-account JSON, API keys or provider secrets. The signed-build workflow reads these GitHub Environment secrets only:

- `PLAY_UPLOAD_KEYSTORE_B64`
- `PLAY_UPLOAD_KEYSTORE_PASSWORD`
- `PLAY_UPLOAD_KEY_ALIAS`
- `PLAY_UPLOAD_KEY_PASSWORD`

Recommended GitHub Environment: `google-play-production` with required reviewers before the signing job can access secrets.

The workflow must produce:

1. signed AAB;
2. strict signature verification;
3. SHA-256 checksum;
4. release manifest tied to the Git commit;
5. build-provenance attestation.

## 4. Google Play policy gates

### Target API

Starting 31 August 2026, new mobile apps and updates submitted to Google Play must target Android 16 / API 36 or higher. This release targets API 36.

Official reference:
https://support.google.com/googleplay/android-developer/answer/11926878

### Privacy policy and Data safety

Every Play app needs an accurate privacy policy in Play Console and inside the app. The privacy policy and Data safety answers must match actual app/SDK behavior, including collection, sharing, retention and deletion.

Official reference:
https://support.google.com/googleplay/android-developer/answer/10144311

Do not complete the Data safety form from assumptions. Derive it from the exact production binary, backend behavior, analytics/SDK configuration, Stripe/provider flows and data retention policy.

### Account deletion

If the production app permits users to create an account, Google Play requires an in-app account-deletion path and a public web resource where deletion can be requested. Associated user data must be deleted subject to clearly disclosed lawful retention requirements.

Official reference:
https://support.google.com/googleplay/android-developer/answer/13327111

If the production app does not create user accounts, document that fact in the release evidence rather than inventing a deletion flow.

### Financial features

The project contains PSD2/Open Banking and financial decision-support modules. If any financial feature is exposed or promoted in the Play production experience, complete the Play Console Financial features declaration accurately. Financial functionality does not become regulated banking/payment execution merely because it exists in software; live AIS/PIS remains separately gated by authorized providers, consent and SCA.

Google Play requires apps containing financial features to comply with its Financial Services policy and applicable regional law. Developer account-type requirements must also be checked: Google states that developers providing financial products/services must use an Organization developer account.

Official references:
https://support.google.com/googleplay/android-developer/answer/9876821
https://support.google.com/googleplay/android-developer/answer/13849271
https://support.google.com/googleplay/android-developer/answer/13634885

Do not classify the app as licensed banking, investment management, payment initiation or another regulated service unless the corresponding legal/provider authorization is actually in force.

### Contacts

URBAN ONE private-contact ingestion must not imply unrestricted access to the Android contacts database. The current mobile dependency set contains no contacts plugin. If a future release accesses device contacts, apply Google Play's Contacts Permissions policy and prefer the Android Contact Picker where broad access is unnecessary.

## 5. Play Console completion checklist

Before `Send for review` / production rollout:

- developer identity and account type verified;
- app record created with package `com.urbanone.universal`;
- Play App Signing configured;
- signed AAB uploaded;
- no bundle/version/signing errors;
- store title, short description and full description complete;
- high-resolution app icon, feature graphic, phone screenshots and required assets complete;
- support contact and privacy-policy URL valid and public;
- Data safety completed from verified behavior;
- account deletion declaration/path completed if applicable;
- Financial features declaration completed;
- content rating completed;
- target audience/content declarations completed;
- ads declaration completed;
- app access/reviewer instructions supplied for restricted features;
- permissions reviewed for least privilege;
- subscription/payment claims match Stripe and app behavior;
- real-device smoke test passed on the exact release candidate;
- release notes reviewed;
- no secrets/private PII embedded in AAB;
- production rollout strategy selected.

## 6. Release strategy

Prefer staged risk:

1. Internal testing — installation, startup, navigation, provider-disabled behavior.
2. Closed testing when required by the developer account or useful for acceptance.
3. Production review only after policy forms and exact-binary testing are complete.
4. Use a staged production rollout where Play supports it and monitor crashes, ANRs, authentication, billing and backend errors before expansion.

If the developer account is a new personal account and Play requires a closed test before production access, follow the exact requirement shown in that Play Console account; do not bypass it.

## 7. Provider boundaries

- Stripe LIVE capability does not prove PSD2/AIS/PIS live readiness.
- Paid software entitlement must be verified server-side.
- PIS/payment initiation requires explicit human approval and SCA where applicable.
- OpenAI/Gemini/other AI providers remain separate production-certification/configuration gates.
- Public INSPIRE/cadastral discovery must respect provider licences, access controls and privacy law.

## 8. Evidence rule

A release is `PRODUCTION-PUBLISHED` only after evidence exists for all of the following:

1. signed AAB checksum;
2. source commit;
3. CI/build success;
4. device acceptance;
5. Play Console accepted artifact/version;
6. policy declarations submitted;
7. review/rollout state shown by Play Console.

Until then, use the narrower state that is actually evidenced, such as `PLAY-READY`, `SUBMITTED-FOR-REVIEW`, or `IN-PRODUCTION-ROLLOUT`.
