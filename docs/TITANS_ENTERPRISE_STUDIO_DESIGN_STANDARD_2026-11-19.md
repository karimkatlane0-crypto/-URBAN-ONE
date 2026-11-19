# TITANS Enterprise Intelligence Studio — Design & Implementation Standard

**Date:** 19 November 2026  
**Status:** BUILD IMPLEMENTED IN FEATURE BRANCH · VERIFY PENDING · RELEASE BLOCKED  
**Branch:** `feat/titans-enterprise-studio-2026-11-19`

## Purpose
Deliver one coherent enterprise control-plane experience for the TITANS ecosystem while preserving separate product ownership, data boundaries, authorization and release decisions.

## Experience architecture
- **SAI.IA — orchestration role:** task routing, coordination and AI service supervision.
- **GITA.ai — strategy role:** planning, context and decision support.
- **EY.ia — executive intelligence role:** KPI analysis, reporting and evidence presentation. Visual direction is EY-inspired; this project is not affiliated with or endorsed by EY.
- **UNIVERSAL36 — engineering role:** developer experience, GitHub/Copilot workflows and delivery engineering.
- **Products:** URBAN ONE, SEVA and SYNAPSY remain distinct products. Shared governance does not imply shared tenants, credentials, databases, payment ledgers or production permissions.

The names above describe the proposed architecture and visual identity. The page explicitly labels them as design roles, not active agents or connected integrations.

## Visual system
- Deep graphite/navy surfaces, warm ivory typography, champagne-gold emphasis and restrained blue/green/red operational signals.
- Manrope display typography and DM Sans interface typography, with system-font fallbacks.
- Editorial hierarchy, compact data tables, high-density cards, consistent spacing and responsive navigation.
- Motion is restrained and disabled under `prefers-reduced-motion`.
- Keyboard focus, skip navigation, semantic landmarks, table headers and accessible labels are required.
- No external brand logo or claim of partnership. Any EY-inspired styling must remain clearly unaffiliated.

## Implemented preview
- Web preview: `apps/web/titans-enterprise-studio.html`
- Mobile webview mirror: `apps/mobile/www/titans-enterprise-studio.html`
- Styles and behavior are colocated in matching `.css` and `.js` files.
- Root redirect and existing production entrypoint are intentionally unchanged. The new experience is not yet promoted to the production home route.

## Truthful data policy
The preview now reads the public GitHub pull-request #207 and Android compatibility workflow run through unauthenticated, read-only GitHub REST endpoints. It does not query MLOps, model providers, billing systems or project backends. If the public API is unavailable or rate-limited, the UI reports NOT VERIFIED and does not reuse stale values. It labels live data as not connected and identifies the MLOps pipeline as a reference flow. Project states are a dated governance snapshot and must be replaced only by authoritative, traceable data bindings.

No metric, health status, agent activity, deployment, test result, payment, webhook receipt or certification may be fabricated or inferred from the visual design.

## Integration contracts before live synchronization
1. Read-only, authenticated adapters for repository, commit, PR, workflow, artifact and ruleset metadata.
2. Per-project identity and authorization; no cross-project privilege escalation.
3. Evidence records with repository, branch, commit SHA, workflow/run/job IDs, artifact IDs, SHA-256, test counts, review state, owner and timestamp.
4. Server-side secret handling; never expose provider keys or webhook secrets in the browser.
5. Human approval gate before merge, release, deploy, payment activation or irreversible operation.
6. Audit log for every state transition and every human approval.
7. Explicit stale/unknown states when source data is unavailable or out of date.

## Verification and release gates
- [ ] `npm test`
- [ ] `npm run verify`
- [ ] `npm run security:secrets`
- [ ] Review responsive layout at phone, tablet and desktop breakpoints.
- [ ] Keyboard-only and screen-reader smoke test.
- [ ] Validate links and static hosting paths for both web and mobile mirrors.
- [ ] Independent security and privacy review.
- [ ] Confirm source-of-truth API contracts and permission model.
- [ ] Human approval before changing the production landing route.

## Governance
Follow **BUILD → VERIFY → RELEASE → SCALE**. A green CI run is not a release approval. No automatic mega-merge, no automatic closure of pull requests and no production deployment from this change.

## Follow-up quality patch — 19 November 2026
- Removed two preview-card links that returned HTTP 404; both now navigate to the evidence register until their dedicated workspaces have verified public routes.
- Added a narrow-screen navigation reflow so the fixed desktop sidebar no longer permanently reduces the phone viewport width.
- Added regression tests for both defects. This patch remains subject to CI and human review; it does not activate live integrations or change the production entrypoint.

## Live GitHub read-only connector — 19 November 2026
- Web and mobile views read PR #208 and Android compatibility run 44517664886 directly from public GitHub REST endpoints.
- No GitHub token, write scope, server secret, merge, workflow dispatch or deployment action is used.
- The UI shows PR state and CI result, with an explicit NOT VERIFIED fallback for API errors/rate limits.
- Repository, PR, CI and Vercel preview destinations are direct links. Vercel links are previews only.
- This is a bounded read-only integration, not a general GitHub connector, not a synchronized evidence register and not a live MLOps pipeline.
- Verification requires CI, browser/network testing, and checking the mobile mirror after deployment.

## Preview routing note — 19 November 2026
- Vercel project root serves the repository root and preserves the existing root entrypoint.
- TITANS preview routes are therefore explicit static paths: `/apps/web/titans-enterprise-studio.html` and `/apps/mobile/www/titans-enterprise-studio.html`.
- The preview cards use relative same-deployment paths so they work in the repository-root Vercel deployment and in the static Pages package.
- The production root redirect is unchanged.

- The verified Vercel branch preview alias is `https://titans-enterprise-studio-git-feat-tit-1f647a-karimkatlane0-7632.vercel.app`; the web and mobile cards link to the explicit static file paths under that preview alias.

## Product workspace destinations — 19 November 2026
- URBAN ONE `v10-workspace.html` and SEVA `seva-unified-studio.html` resolve with HTTP 200 on the branch preview and are linked as web previews.
- HTTP 200 confirms route availability only; it does not prove backend readiness, authentication, payments, data synchronization or production service health.
- SYNAPSY remains evidence-gated because no standalone public workspace route was verified in this pass.

## Unified cross-page visual system — 19 November 2026
- Replaced the former light executive theme with the TITANS Studio graphite/navy, warm-ivory and champagne-gold design language.
- The shared web and mobile `executive-system.css` files are byte-identical and style all current pages that load this shared stylesheet, including URBAN ONE Universal, SEVA Unified Studio, Science, Discovery, Pole Position/Premium, CRM and dashboard surfaces.
- The TITANS Studio Web and Mobile connected-services panels now distinguish:
  - GITA.IA / GITA.ai: architecture role; NOT CONNECTED.
  - Copilot.IA / GitHub Copilot: operational integration NOT VERIFIED.
  - GitHub.IA / repository: bounded public READ-ONLY integration.
- These labels describe verified implementation boundaries, not active agent certification. No provider credentials, write scopes, merge, deployment or release permissions were added.
- Regression tests cover service labels, truthful status states and byte-identical web/mobile theme assets.
