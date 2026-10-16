# URBAN ONE UNIVERSAL — v7.0.0 FINAL · Release Control

## Baseline policy
This is the governed greenfield v7 line. Legacy v6.x material is superseded reference material and is not trusted as a runtime dependency.

## Verified gates
- SOURCE: PASS — v7.0.0 final source published on `main-@URBAN-ONE`.
- POLICY/RBAC: PASS — deny-by-default roles and scopes.
- CONSENT: PASS — purpose-bound consent gate.
- SANITIZE: PASS — PII/secret redaction before external AI handoff.
- PROVENANCE: PASS — canonical envelope + SHA-256 evidence.
- TESTS/CI: PASS — GitHub CI for the final mobile integration commit completed successfully.
- WEB SHELL: PASS — local-first static shell.
- API RUNTIME: PASS — `/health` and `/api/universal/status` are versioned for v7.0.0.
- MOBILE BOOT POLICY: PASS — Capacitor uses the local `www` bundle.
- PRIVATE CONTACT LAYER: PASS — Skebby/Data normalization is owner-scoped; certificate/document values are represented by SHA-256 fingerprints rather than raw IDs in public source.
- EXACT CIVIC SEARCH: PASS — canonical house-number matching and map-ready address queries are included.
- EU INSPIRE PUBLIC DATA: PASS — all 34 official INSPIRE themes are represented; data.europa.eu is the fixed public discovery endpoint; provider licence/access conditions remain authoritative.
- PUBLIC CADASTRAL PRIVACY: PASS — no owner-name, fiscal/tax-ID or identity-document enrichment is performed from public cadastral geometry.
- GITHUB PUBLICATION: PASS — final source is published on `main-@URBAN-ONE`.
- ANDROID DEBUG BUILD: PASS — GitHub Actions run `38910905230` completed successfully from source commit `1a12be87e7fdafa219f769ce022233defab54650`.

## Android artifact evidence
- Artifact ID: `12050760683`
- GitHub artifact digest: `sha256:a57423521bfcc99d1421b45d1802dcd5ce9f3b71ac8779a1429bcc99b50bf857`
- Extracted APK SHA-256: `b4e6d39e4b670096599247a5e068bb1722a2dea295e7f73b5f7261145391ffad`
- APK type: debug/test-installable, not production-store signed.

## EU public spatial-data scope
The app can build user-initiated geospatial discovery queries for addresses, cadastral parcels, buildings, land use, transport networks, orthoimagery, elevation, management/restriction zones, natural risks, soil, statistical units, utilities/governmental services and the remaining INSPIRE themes. It does not bypass national cadastral authentication, licensing, payment, purpose or privacy controls.

## Open external gates
- Android real-device acceptance: OPEN — install and exercise this exact APK on a target device.
- Android production signing/store release: OPEN — requires the production signing/release process.
- iOS signing/TestFlight/App Store: OPEN — requires Apple signing/provisioning.
- Live provider certification: OPEN — OpenAI/Gemini/PSD2/relay or other live providers require their own credentials, contracts and certification evidence before being declared production-live.

## Universal access definition
Universal access means one governed control plane across approved Web, Android, iOS, API, DB, relay, AI, finance, private contacts, real-estate and public spatial-data modules. It never bypasses authentication, consent, authorization, provider terms, licensing, certification or secrets boundaries.
