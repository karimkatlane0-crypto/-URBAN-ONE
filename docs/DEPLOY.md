# Deployment Gates

## Web
Static local-first shell. Publish only after CI tests pass and hosting auth policy is tested independently.

## Android
GitHub Actions `android.yml` installs Capacitor dependencies, creates/syncs Android, builds debug APK and produces SHA-256. Production signing is a later release gate.

## iOS
`ios.yml` prepares the native iOS source on macOS. App Store/TestFlight publication requires Apple signing/provisioning and is not declared by source generation alone.

## API / DB / Relay
Deploy API and DB migrations in staging first. Relay remains disabled until URL, token and owner mapping are present. Provider credentials must be supplied only as server-side secrets.
