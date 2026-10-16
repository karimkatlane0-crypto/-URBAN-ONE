# URBAN ONE UNIVERSAL — v7.0.0 RC1 · Release Control

## Baseline policy
This is a greenfield rebuild. Legacy v6.x code is **not trusted as a dependency** and is treated as superseded reference material only.

## Verified gates
- SOURCE: PASS — greenfield source tree created.
- POLICY/RBAC: PASS — deny-by-default roles and scopes.
- CONSENT: PASS — purpose-bound consent gate.
- SANITIZE: PASS — PII/secret redaction before external AI handoff.
- PROVENANCE: PASS — canonical envelope + SHA-256.
- TESTS: PASS — 9/9 local tests.
- WEB SHELL: PASS — local-first static shell.
- API RUNTIME: PASS — `/health` and `/api/universal/status` respond locally.
- MOBILE BOOT POLICY: PASS — Capacitor uses local `www`; no private `server.url` bootstrap.
- PIS SAFETY: PASS — requires human approval + SCA receipt before preparation.
- RELAY SAFETY: PASS — fail-closed until gateway URL/token/owner are configured.

## Open external gates
- GitHub publication: OPEN — connector returns HTTP 403 `Resource not accessible by integration`.
- Android native artifact: OPEN — build workflow prepared; no new APK from v7 yet.
- Android device retest: OPEN — requires v7 APK.
- iOS signing/TestFlight/App Store: OPEN — requires Apple signing/provisioning.
- Provider live certification: OPEN — OpenAI/Gemini/PSD2/relay are not declared live without receipts.
- Final release/email: OPEN — must wait for all required gates.

## Release source
`URBAN_ONE_UNIVERSAL_v7.0.0_RC1_SOURCE_2026-10-15.zip`

SHA-256:
`39e7bd26a1fdf0594cd3364c72c34e0c6e5748fffe0c1419f917875b51177a51`

## Universal access definition
Universal access means one governed control plane across approved Web, Android, iOS, API, DB, relay, AI, finance and real-estate modules. It does not bypass authentication, consent, authorization, provider certification, or secrets boundaries.
