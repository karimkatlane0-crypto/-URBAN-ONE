# SOVEREIGN TITANS — Reference Architecture & Evidence Register

**Version:** 1.0  
**Date:** 22 November 2026  
**Repository workstream:** `feat/sovereign-titans-remote-access-20261122`  
**Status:** BUILD / architecture recorded; provider integrations NOT CONNECTED  
**Release authorization:** NOT GRANTED

## 1. Canonical architecture

```text
SOVEREIGN TITANS
        |
CENTRAL ORCHESTRATOR
        |
+-------+----------+----------+
|                  |          |
MAGNITODO        ULTIMATUM    ARIA
|                  |          |
+------------------+----------+
        |
      APASH
        |
   TRANSFORFER
        |
API GATEWAY / MCP / EVENTS
        |
+-------+----------+----------+
|                  |          |
MLOps             DLOps      DataOps
|                  |          |
+------------------+----------+
        |
SEVA / SYNAPSY / KKUBERA
        |
WEB / MOBILE / CLOUD
```

This diagram is the requested target topology. It is not evidence that the named agents, APIs, providers or downstream applications are currently connected or operational.

## 2. Component responsibilities and acceptance contracts

| Layer | Intended responsibility | Minimum evidence before marking REAL/ACTIVE |
|---|---|---|
| Sovereign TITANS | Governance, identity boundaries, policy, audit and lifecycle control | Approved threat model, policy tests, audit trail, recovery evidence |
| Central Orchestrator | Task decomposition, routing, policy enforcement, deadlines and trace propagation | Authenticated orchestration API, tenant-isolation tests, deterministic routing tests, traceable execution |
| MAGNITODO | Agent/service role to be confirmed by its owner | Verified owner, canonical endpoint, API/schema, auth scopes, capability tests and health evidence |
| ULTIMATUM | Agent/service role to be confirmed by its owner | Same provider onboarding evidence |
| ARIA | Agent/service role to be confirmed by its owner | Same provider onboarding evidence |
| APASH | Coordination/processing role to be confirmed | Verified contract, trust boundary, data classification and conformance tests |
| TRANSFORFER | Transfer/transport role to be confirmed | Verified protocol, encryption, destination controls, integrity checks and delivery receipts |
| API Gateway | Authenticated ingress/egress, quotas, schema validation, rate limits and routing | Deployed non-production gateway, auth and policy tests, egress controls, observability |
| MCP | Explicitly scoped tool discovery and invocation | Tool manifests, per-tool authorization, input/output schemas, sandboxing and audit |
| Events | Durable asynchronous delivery and replay | Schema registry, signing/integrity, idempotent consumers, retry/DLQ and replay tests |
| MLOps | Model registry, evaluation, deployment, drift and rollback | Versioned model artifacts, evaluation gates, lineage, canary/rollback evidence |
| DLOps | Dataset lifecycle, quality, lineage, access and reproducibility | Dataset contracts, quality checks, lineage, access policies and reproducible pipelines |
| DataOps | Ingestion, transformation, observability, governance and data products | Tested pipelines, freshness/quality SLAs, lineage, access and recovery evidence |
| SEVA | Commerce/intelligence application domain | Verified application APIs, tenant separation, end-to-end user and transaction tests |
| SYNAPSY | Business/workspace application domain | Verified service contract, authorization, audit and integration tests |
| KKUBERA | Marketplace/stays/real-estate application domain | Verified source permissions, listing provenance, payments/visit controls and E2E tests |
| Web / Mobile / Cloud | User channels and hosting/runtime substrate | Environment inventory, secure builds, device/browser E2E, deployment and recovery evidence |

## 3. Cross-cutting platform controls

All service-to-service calls must use authenticated workload identities, least-privilege scopes, tenant-aware authorization, TLS, bounded request sizes, deadlines, concurrency and quotas. Secrets must be held in an approved secret manager and never committed to source control or exposed to clients.

The gateway must enforce egress allowlists and validate DNS/IP destinations at connection time. Redirects must be revalidated. Application URL validation alone does not prevent SSRF or DNS rebinding.

MCP tools and agent actions must be individually authorized and sandboxed. WRITE, SEND, SHARE, DELETE, payment, publication and other externally consequential operations require explicit human approval and an auditable approval record. No arbitrary shell or unrestricted filesystem/network access is implied by this architecture.

Events must carry schema version, tenant scope, correlation/trace ID, idempotency key and provenance metadata. Sensitive payloads should be minimized; avoid credentials and session tokens in events and logs.

## 4. Remote routing and fallback policy

The existing branch implementation provides policy primitives for HTTPS endpoint validation, exact hostname allowlisting, tenant-scoped capability selection, freshness/health gating, ordered candidates and bounded retry delay for explicitly retryable idempotent operations.

These primitives do not make network calls and do not connect providers. Before production, add server-side identity, secret-manager integration, egress enforcement, DNS/IP and redirect validation, adapter contracts, timeouts, circuit breakers, quotas, sandbox execution, telemetry and independent security review.

Fallback is permitted only among providers configured for the same tenant and capability. Never fail over on authorization or policy denial, validation errors, or non-idempotent side effects. If no verified healthy candidate exists, fail closed.

## 5. Provider onboarding register

| Identity | Endpoint / owner / auth / API contract | Operational status |
|---|---|---|
| @magnitodo.ia | Not yet evidenced in repository | NOT CONNECTED |
| @ultimatum.ia | Not yet evidenced in repository | NOT CONNECTED |
| @aria.ia | Not yet evidenced in repository | NOT CONNECTED |
| @apash.ia | Not yet evidenced in repository | NOT CONNECTED |
| @TRANSFORFER.IA | Not yet evidenced in repository | NOT CONNECTED |

Do not infer that a handle is a domain, endpoint, organization, partnership or authorization. Onboarding requires authoritative documentation or confirmation from the owner, security review, credentials provisioned through an approved secret manager, sandbox tests and a recorded acceptance decision.

## 6. Evidence ledger — current branch

| Item | Evidence / status |
|---|---|
| Remote access policy primitives | IMPLEMENTED on the feature branch |
| Focused unit tests | 5/5 passed locally (Node 22.16.0) |
| GitHub Actions verification | PASS for commit `0e8bd067ff86fd8281aabbc25cb32353082ada59` (run 44992485447) |
| CI steps | security:secrets, test, verify, provenance, evidence — PASS |
| Evidence artifact | `evidence-ledger`, SHA-256 `e06f6428eb687c46f990fd66a922c4f61380d7ded3428869b44cb8e5ed26d0db` |
| Draft pull request | #244 OPEN · DRAFT |
| Provider adapters / live endpoints | NOT IMPLEMENTED / NOT VERIFIED |
| Gateway, MCP server and event bus deployment | NOT VERIFIED |
| MLOps / DLOps / DataOps runtime | NOT VERIFIED by this change |
| SEVA / SYNAPSY / KKUBERA end-to-end integration | NOT VERIFIED by this change |
| Production deployment / merge | NOT AUTHORIZED / NOT PERFORMED |

CI success verifies the repository workflow on that commit; it does not establish production readiness or external service connectivity. Any later commit requires its own verification.

## 7. Delivery sequence

1. **VERIFY DISCOVERY:** identify owners, authoritative endpoints, API specs, data classifications, regions, legal basis and service-level requirements for each provider.
2. **BUILD ADAPTERS:** implement one isolated adapter per provider against a common versioned contract; use sandbox credentials and synthetic tenant data.
3. **SECURITY GATES:** verify workload identity, tenant isolation, secret handling, egress/SSRF protections, sandboxing, audit, approval controls and recovery.
4. **PLATFORM GATES:** establish gateway, MCP registry, event schemas, MLOps/DLOps/DataOps lineage and observability.
5. **APPLICATION GATES:** run SEVA, SYNAPSY and KKUBERA end-to-end tests across web/mobile/cloud with explicit source provenance and transaction safety.
6. **RELEASE REVIEW:** independent verification, evidence bundle, human approval and a separately authorized release decision.

## 8. Governance

BUILD → VERIFY → RELEASE → SCALE.

This commit records the target architecture and current evidence state only. It does not activate providers, provision credentials, transfer external data, merge the pull request, deploy services or authorize production use.
