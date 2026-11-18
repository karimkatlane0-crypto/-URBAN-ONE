# SEVA Intelligence Studio — Control Plane build record

Date: 18 November 2026  
Repository: `karimkatlane0-crypto/-URBAN-ONE`  
Base branch: `main-@URBAN-ONE`  
Feature branch: `feat/seva-studio-control-plane-2026-11-18`  
Scope: UI/UX governance snapshot and conflict-resolution map. Preview-only; no production deployment.

## Evidence captured

- GitHub repository and canonical branch were accessible. Reference commit: `66034eabc8f70de4f68e1ca01702c480343985b9`.
- Vercel team: Hobby plan. Project: `seva-executive-studio-preview`.
- Preview deployment `dpl_9KVLuAsVF9JJJdpYJJacAztnqGfX` is READY; its home returns HTTP 200.
- Preview `/health` and `/api/public/status` return HTTP 404.
- Vercel project environment-variable listing returned zero visible entries.
- Vercel project context lists no Git-linked projects.
- Existing production deployment `dpl_4acWso3TpnXYnevzhzQHocr6mUKe` is READY, but its content is an older static Studio snapshot; it was not modified.
- SYNAPSY account summary was read-only; no cloud writes or provider requests were made. Provider responses are not verified.
- Klaviyo read connector works; SEVA backend OAuth, webhook and staging E2E remain open (Issue #186).
- WordPress canonical production and staging are identified, but the connected WordPress source points to another host (Issue #183).
- Power BI import assets exist; no Microsoft workspace, gateway or scheduled refresh is verified.
- Google Drive connector is installed but DISABLED_BY_ADMIN; Google Drive folders were not inspected.
- Kubernetes cluster identity and deployment evidence are not established by the current audit (Issue #185).

## Conflict resolution plan

1. Keep one canonical Studio entry point; migrate existing Enterprise, Unified and CRM routes only after route parity and data continuity tests.
2. Bind Vercel preview to a reviewed Git commit and exact root/build configuration; do not promote to production.
3. Separate Vercel static frontend from persistent HTTPS backend. Use server-side secrets, authenticated API, PostgreSQL with tenant isolation/RLS, audit, backup and restore.
4. Keep SYNAPSY as canonical CRM and identity system; Klaviyo remains downstream and consent-gated.
5. Reconcile WordPress connector identity before staging writes; keep Spotify Embed and API authorization separate.
6. Connect Power BI only after Microsoft workspace authorization, least-privilege access and validated metric definitions.
7. Verify Kubernetes cluster ownership and staging controls before any deployment.
8. Preserve separate Google identities and per-account consent. No automatic Drive copy or cross-account sync.

## UI acceptance criteria

- Responsive layout, keyboard-accessible filters and search.
- Explicit PASS / READY / PARTIAL / BLOCKED / UNVERIFIED states.
- No live metric claims without a connected source.
- No client-side credentials, provider writes, checkout, messaging or deployment actions.
- Clear distinction between a READY deployment and a certified production service.

## Release decision

**NO-GO production.** This branch is a UI and governance improvement only. Production remains untouched. Merge and Vercel preview deployment require review and CI; provider, backend, Kubernetes, Power BI and Drive gates remain separate.
