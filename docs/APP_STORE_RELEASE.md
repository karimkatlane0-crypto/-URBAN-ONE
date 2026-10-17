# URBAN ONE UNIVERSAL — Apple App Store release

Bundle ID: `com.urbanone.universal`
Version: `7.0.0`
Build: `7000001`

## What is automated

`.github/workflows/app-store-release.yml` regenerates the Capacitor iOS project, requires an App Store-compatible Xcode generation, archives the Release build, uses Apple cloud signing, and uploads the signed build to App Store Connect.

The workflow deliberately records `reviewStatus: NOT_SUBMITTED_BY_THIS_WORKFLOW`. A successful binary upload is not the same as App Review approval or public App Store availability.

## GitHub Environment

Create/protect environment `apple-app-store-production` and configure these secrets there:

- `APPLE_TEAM_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY_B64`

`APP_STORE_CONNECT_PRIVATE_KEY_B64` is the base64 representation of the downloaded `.p8` private key. Use an App Store Connect **team key** with the minimum role that supports the required app upload and provisioning operations. Do not commit the `.p8` file or any decoded private key to the repository.

## Apple account prerequisites

Before the workflow can succeed:

1. Apple Developer Program membership must be active, unless Apple has approved an eligible fee waiver.
2. The latest Apple agreements required for creating/uploading the app must be accepted by the Account Holder.
3. An App Store Connect app record must exist for `com.urbanone.universal`.
4. App Store Connect API access must be enabled and a team API key generated.
5. The bundle identifier must belong to the configured Apple Developer team.

## Review/publishing gates after upload

A successful workflow upload still leaves App Store Connect work:

- build processing completed by Apple;
- app name, subtitle, category, description and support/privacy URLs;
- screenshots and required promotional assets;
- App Privacy answers based on the actual production binary/backend;
- age rating and content-rights declarations;
- export-compliance/encryption answers;
- pricing/availability configuration if applicable;
- review contact and App Review notes;
- test account or review instructions when login is required;
- selection of the processed build;
- Submit for Review;
- Apple approval;
- release/availability confirmation.

Use `APP-STORE-PUBLISHED` only after App Store Connect shows the approved version available for distribution.

## B&B Network Pass review note

If the Network Pass is enabled, explain clearly to App Review that the paid entitlement is for accommodation consumed outside the app. Within included credits, eligible accommodation can show a EUR 0 stay charge; local taxes, extras, availability and credit rules remain applicable. Do not describe the offer as unlimited free accommodation.
