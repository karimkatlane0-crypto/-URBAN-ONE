# Universal Command Center — BUILD record

Date: 25 November 2026  
Repository: `karimkatlane0-crypto/-URBAN-ONE`  
Base: `main-@URBAN-ONE`  
Feature branch: `feat/universal-command-center-responsive-20261125`  
Status: BUILD branch only; no merge, deploy or production release.

## Scope
- Single-page command center for ALL modules: Universal 36, SEVA Intelligence Studio, Advanced Insights, SYNAPSY, KKUBERA, TITANS, URBAN ONE and Universal Instance Manager.
- Internal module switching through one embedded workspace; internal module links remain in that workspace instead of opening another browser tab.
- Last selected module is restored in the current browser session.
- Web and mobile home pages expose the Command Center entry point.
- Mobile Advanced Insights now includes the full local KPI/scenario dashboard and its packaged dashboard document, rather than a placeholder-only status page.
- Screen diagnostics shown at startup and updated on resize/orientation change: viewport width/height, screen width/height in CSS pixels, device pixel ratio, orientation and responsive class (mobile/tablet/desktop).
- Existing module pages are reused; no duplicate business data, provider credentials, payment operations or external writes are introduced.

## Safety and limitations
- This is a navigation shell, not proof that embedded modules, APIs, CRM, payment rails, databases or provider connections are operational.
- Backend/API and authentication gates remain independent.
- External provider links may still leave the workspace when explicitly opened; module navigation is kept inside the shell.
- The shell does not activate payments, messaging, campaigns, synchronization, autonomous agents or production actions.
- Merge, deployment and release require passing CI, runtime smoke tests and the applicable release authorization.

## Verification
- Static test added: `tests/universal-command-center.test.mjs`.
- Verify all linked web/mobile module paths, home-page entry links, screen diagnostics and the mobile dashboard asset.
- CI and browser/device smoke tests must complete before merge.
- Runtime verification still required for iframe behavior, authentication/session continuity, keyboard accessibility and orientation changes.
