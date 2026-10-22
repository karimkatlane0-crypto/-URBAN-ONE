# Deployment Gates

## Web
Static local-first shell. Publish only after CI tests pass and hosting auth policy is tested independently.

The public repository entry `index.html` redirects to `apps/web/index.html`. Both branch-based Pages/Jekyll and the custom Actions deployment retain this same app path, avoiding a README home or broken relative page links when either publishes. `node scripts/build-pages.mjs` creates a fresh `dist/pages` containing only the entry and public Web assets. The custom workflow checks the entry and nested app/hospitality pages. This static host provides no API runtime; a 404 at `/api/integrations/readiness` does not activate providers.

For a combined local Web/API runtime, run `node services/api/server.mjs` with Node 22 or later and open `http://localhost:8787/`. `PORT` overrides the port. The server serves only public HTML/CSS/SVG/manifest assets from `apps/web`; repository files and secrets are excluded.

The Web and bundled Android home screens include a manual integration check at `/api/integrations/readiness`. On a static host or bundled mobile origin without that endpoint, the panel reports the server unavailable and preserves local tools. No backend URL, credentials or automatic provider calls are embedded in the mobile bundle. A remote authenticated backend for mobile remains a separate integration task.

Readiness reports credential presence separately from live verification. AI execution still requires a certified runtime; Fabrick and InfoCert remain offline mocks. This endpoint does not verify a payment, create a booking, sign a document or attest device installation. Private API routes continue to require authenticated scopes; the standalone server does not provide identity middleware.

## Android
GitHub Actions `android.yml` installs Capacitor dependencies, creates/syncs Android, builds debug APK and produces SHA-256. Production signing is a later release gate.

## iOS
`ios.yml` prepares the native iOS source on macOS. App Store/TestFlight publication requires Apple signing/provisioning and is not declared by source generation alone.

## API / DB / Relay
Deploy API and DB migrations in staging first. Relay remains disabled until URL, token and owner mapping are present. Provider credentials must be supplied only as server-side secrets.
