# URBAN ONE UNIVERSAL — v7.0.0 RC1 · Release Control

## Baseline policy
This is a greenfield rebuild. Legacy v6.x code is **not trusted as a dependency** and is treated as superseded reference material only.

## Verified gates
- SOURCE: PASS — greenfield source tree created.
- POLICY/RBAC: PASS — deny-by-default roles and scopes.
- CONSENT: PASS — purpose-bound consent gate.
- SANITIZE: PASS — PII/secret redaction before external AI handoff.
- PROVENANCE: PASS — canonical envelope + SHA-256.
- TESTS: PASS — 9/9 local tests and GitHub CI success.
- WEB SHELL: PASS — local-first static shell.
- API RUNTIME: PASS — `/health` and `/api/universal/status` respond locally.
- MOBILE BOOT POLICY: PASS — Capacitor uses local `www`; no private `server.url` bootstrap.
- PIS SAFETY: PASS — requires human approval + SCA receipt before preparation.
- RELAY SAFETY: PASS — fail-closed until gateway URL/token/owner are configured.
- GITHUB PUBLICATION: PASS — source published and merged into `main-@URBAN-ONE`.
- ANDROID DEBUG BUILD: PASS — GitHub Actions run `38857231450` completed successfully.

## Android artifact evidence
- Artifact ID: `12027896334`
- Artifact ZIP SHA-256: `94ffec377303dda78fea722d523958671410c62860b94e5c9bfc6df94e652ef3`
- APK SHA-256: `d80915cddf8a14ec442e120a1776f7520c2c5222e2cea6199255dfb9889f714a`
- APK type: debug, unsigned-for-production. Production signing remains a separate release gate.

## Open external gates
- Android device retest: OPEN — install and exercise the v7 APK on a real device/emulator.
- iOS signing/TestFlight/App Store: OPEN — requires Apple signing/provisioning.
- Provider live certification: OPEN — OpenAI/Gemini/PSD2/relay are not declared live without receipts.
- Final production release: OPEN — production signing/certification and required device/provider gates must be completed first.

## Release source
The original verified source bundle remains historical source evidence. Subsequent build-enablement commits pin the TypeScript toolchain and align the Android workflow with the successful build path.

## Universal access definition
Universal access means one governed control plane across approved Web, Android, iOS, API, DB, relay, AI, finance and real-estate modules. It does not bypass authentication, consent, authorization, provider certification, or secrets boundaries.
