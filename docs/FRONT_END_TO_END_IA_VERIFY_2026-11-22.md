# SUPER.AI — FRONT-END-TO-END.IA verification plan and evidence

**Date:** 2026-11-22  
**Branch:** `feat/super-ai-unified-platform-20261122`  
**PR:** [#250](https://github.com/karimkatlane0-crypto/-URBAN-ONE/pull/250)  
**Lifecycle:** BUILD → VERIFY → RELEASE → SCALE

## Scope

The front-end-to-end verification suite covers 26 static Web and Mobile routes across SUPER.AI, UNIVERSAL 36, TITANS, INSIDERS/Financial Insights, INSIGHTS.ai, SEVA Studio, SEVA CRM, SYNAPSY, KKUBERA/Discovery, Maps Europa, URBAN ONE Workspace and Instance Manager.

It validates the user-facing route graph and interactions, not merely page rendering.

## Browser checks

1. Page returns HTTP success and expected title.
2. Internal HTML links resolve and in-page anchors exist for the selected hub and product routes.
3. Keyboard navigation reaches a visible focus target.
4. axe-core automated WCAG 2.1 A/AA and WCAG 2.2 A/AA rules run on each target.
5. 390×844 viewport has no horizontal overflow.
6. No uncaught JavaScript page errors.
7. Workspace category filters narrow visible cards; a no-result search exposes the empty state; reset restores the complete catalog.
8. Maps Europa search action generates the expected Google Maps search URL only after explicit user click.
9. Instance Manager remains fail-closed without a verified authenticated backend and exposes no create-instance buttons.
10. Separate mobile route tests use the mobile package root, not the web root.

## BUILD changes

- Expanded `scripts/public-portals-browser-smoke.mjs` to include SUPER.AI hub/settings, INSIGHTS.ai, web and mobile workspaces, mobile hub/settings/home/discovery/Instance Manager, Maps Europa and SYNAPSY.
- Added same-origin route and fragment checks for selected product hubs and mobile routes.
- Added interaction tests for workspace filters/reset and Maps Europa search.
- Added mobile Maps Europa page: `apps/mobile/www/maps-europe.html`.
- Added mobile SYNAPSY page: `apps/mobile/www/synapsy.html`.
- Updated `apps/mobile/www/super-ai.html` so Maps Europa and SYNAPSY are real navigation links rather than a non-clickable placeholder or an indirect TITANS anchor.
- Updated `.github/workflows/public-portals-browser.yml` to serve both `apps/web` and `apps/mobile/www` and trigger when mobile pages change.

## Verification state

The browser suite is wired to GitHub Actions and uploads `release/browser-proof/portal-browser-report.json` plus page screenshots. The suite must complete on the final exact commit SHA before marking the expanded front-end gate PASS.

The automated suite does not prove:
- Public production deployment reflects this branch.
- Login, user profile, organization, role or settings persistence works.
- API writes, billing or entitlements work.
- External partner links are valid, authorized or commercially active.
- Physical-device Android WebView behavior is accepted.
- Every link across the entire repository has been exhaustively checked; route integrity checks are scoped to the listed targets.

## Acceptance gates

| Gate | Acceptance evidence |
|---|---|
| Web route rendering | HTTP 200 + expected title for every web target |
| Mobile route rendering | HTTP 200 + expected title for every mobile target |
| Navigation graph | No missing same-origin HTML routes or selected destination anchors |
| Interaction | Filter, empty-state reset, Maps search and fail-closed Instance Manager tests pass |
| Accessibility | No axe-core violations under configured WCAG tags |
| Responsive behavior | No horizontal overflow at 390×844 |
| Runtime stability | No uncaught page errors |
| Backend integration | Separate IAM + API + PostgreSQL + provider E2E evidence |
| Release | Human approval after all gates; no auto-merge/deploy |

## Release boundary

This is a BUILD/VERIFY artifact on an isolated feature branch. No merge, production deployment, live payment, customer-data mutation or release was performed.
