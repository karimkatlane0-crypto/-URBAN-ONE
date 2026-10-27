# SEVA Global — Live HTTP smoke verification

This is a public-only HTTP test, not a SEVA Enterprise acceptance test.

- Workflow: `.github/workflows/seva-global-live-smoke.yml`.
- Runs on main changes to this probe, manual dispatch and scheduled 07:18 UTC daily.
- Checks real `https://seva-executive-studio-preview.vercel.app` responses for home, launch, PSDM, Android, JS and PWA manifest.
- Report as JSON artifact `seva-global-live-http-evidence`; a failed page makes CI fail. A Vercel READY badge does NOT override live HTTP failure.
- Does **not** send API tokens, bank data, email addresses or customer inputs.
- Backend health is optional using env `SEVA_BACKEND_ORIGIN` if a legitimate HTTPS service exists; it never tests account isolation, API entitlement, real provider response, Stripe/SEPA or bank settlement. Do not enable backend readiness without independent authentication and persistence checks.
- Fase 2 acceptance: real persistent HTTPS backend, two synthetic tenants, SQLite reboot/backups, authenticated provider response ID, funded OpenAI API project, no exposed key, controlled costs.
- Fase 3 acceptance: real phone install, Play-signed AAB, origin/fingerprint Digital Asset Links, store review and approved countries.
- Fase 4 acceptance: merchant verified and terms published, account owner can independently reconcile an actual settled SEPA transfer, duplicate/partial refunds and regional store policy reviewed.

This probe deliberately uses no customer tracking and cannot measure conversions.
