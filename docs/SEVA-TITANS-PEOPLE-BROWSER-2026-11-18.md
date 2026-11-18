# SEVA TITANS — People & Browser Hub

Date: 2026-11-18
Branch: feat/seva-titans-browser-contacts-hub-2026-11-18
Base commit: a6c104f64b4afbfe78931ee1239a5b225b455bbe

## Candidate scope
- Responsive standalone UI for Contacts, Browser launchpad and Connections.
- Local-only contact creation, search, CSV export, CSV/vCard import, explicit local deletion.
- Imported consent remains unknown; importing never grants marketing permission.
- Two Google identities remain separate and unconnected.
- Browser opens HTTP(S) destinations in new tabs; it does not capture credentials, cookies or sessions.
- Social integrations are restricted to official APIs and minimum scopes; no scraping or bulk sends.
- No backend writes, OAuth, cloud sync, contact transmission, Kubernetes deploy or production publication.

## Release gates
1. Run repository CI and real-browser tests on this branch.
2. Validate keyboard access, responsive layout, CSV escaping, duplicate policy and storage failure.
3. Add server-side auth, tenant isolation, RBAC, audit and encryption before contact sync.
4. Implement separate Google OAuth consent for each identity, minimum scopes, revocation and per-account audit.
5. Connect an authorized browser agent with domain allowlists, confirmation gates and execution receipts.
6. Prove tenant isolation and backup restore before production.

## Limitations
Static browser-side prototype only. Local storage is not a secure CRM vault. This is an original SEVA interface, not a copy of proprietary Google UI; it does not connect to Google, social networks, Codex or Vercel Agents.

## Status
BUILD: candidate authored on feature branch. VERIFY: pending branch CI and browser run. RELEASE: not authorized. SCALE: blocked on identity, backend, consent, security, provider approval and recovery evidence.
