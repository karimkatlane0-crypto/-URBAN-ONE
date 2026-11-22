# Universal Instance Manager — EU Workspace Integration

Date: 2026-11-22

## Scope delivered

A shared static entry page is added at `apps/web/instance-manager.html`, with `instance-manager.css` and `instance-manager.js`. A common launcher is linked from these workspaces:

- UNIVERSAL 36 and URBAN ONE v7
- SEVA Intelligence Studio
- SEVA TITANS People & Browser
- SEVA CRM Studio
- SYNAPSY
- KKUBERA / Discovery
- URBAN ONE v10 Workspace
- INSIGHTS Free / INSIGHTS INSPIRE
- TITANS Enterprise Studio
- Financial Insights
- European Maps

The page uses same-origin authenticated API requests and only enables lifecycle controls after it verifies a reachable authenticated sandbox API, a simulation-only adapter, and the absence of cloud resources/network calls. It does not persist state in the browser or invent instance records.

## Runtime and release boundary

The standalone SEVA server implementation and sandbox adapter exist in `apps/seva-enterprise`. The two inspected Vercel projects are separate deployments:
- `titans-enterprise-studio` serves the repository-root portal (the universal portal is available under `/apps/web/universal-36.html`).
- `seva-executive-studio-preview` serves the SEVA TITANS People & Browser site.

At the time of this report, neither inspected Vercel deployment exposes `/api/instances/adapter`, `/api/instances/catalog`, or the instance lifecycle endpoints. Therefore the shared UI is deliberately fail-closed and reports that the API is not installed on that Vercel domain. No button can create an instance until a durable, authenticated backend is deployed and verified.

The current adapter is an in-process simulation. It is not a Docker/Kubernetes/cloud provisioner. The in-memory registry is not durable and is not suitable for production multi-replica operation.

## Verification plan

- Root CI validates all twelve workspace entry points and syntax-checks the browser module.
- SEVA CI validates the authenticated API lifecycle and tenant isolation in the standalone Node server.
- Vercel preview deployments must verify that the shared page and assets are served by each intended project.
- Production promotion remains gated on backend hosting, durable persistence, security review, and successful end-to-end checks.

## Explicit exclusions

No Synapsy payment state, KKUBERA property data, CRM records, personal data, credentials, or production secrets are transferred or modified by this UI integration. No production resource creation is performed.
