# SEVA UNICO ENTERPRISE — SVAIAM × TITANS evidence-first integration plan
Date: 2026-11-13. Status: DESIGN / NOT VERIFIED. Source PR #147 is already MERGED (merge SHA 6ae459fbbf76c04aec39bf7c303c8841d7518a85). This branch is independent. NO LIVE deploy, agent execution, messages or payments.

## Inventory from repository tree and source inspection
| Audit nodes | Existing code / test paths | Assessment |
|---|---|---|
| 001–012 TITANS | apps/seva-enterprise/titans-command-center.mjs; test/titans-command-center.test.mjs | Planning endpoints, six named roles, preview and fail-closed execute exist in source. Execute responds 503; runtime not certified. |
| 013–024 AI/ML | titans-ml-readiness.mjs; test/titans-ml-readiness.test.mjs; generative-ai.mjs; developer-ai.mjs | Source/test files exist; external model inference, quota, model registry and serving NOT VERIFIED. |
| 025–034 KKUBERA | real-estate-api.mjs; docs/kkubera-real-estate-api.openapi.yaml; global-real-estate.mjs; test/real-estate-api.test.mjs | API/schema/test artifacts present; MLS licensing and live feed NOT VERIFIED. |
| 035–044 CRM/Telecom | communications.mjs; meta-pages-api.mjs; test/communications.test.mjs; test/meta-pages-api.test.mjs | Communications and Meta source/test artifacts present; Skebby/WhatsApp permissions and actual delivery NOT VERIFIED. |
| 045–052 Payments | server.mjs; billing.mjs; stripe-portal.mjs; test/stripe-lifecycle.test.mjs; test/stripe-plan-scoping.test.mjs | Code/tests present; Stripe TEST end-to-end and LIVE prohibition runtime NOT VERIFIED. |
| 053–060 Databases | dbrelay.mjs; test/dbrelay.test.mjs; test/dbrelay-sync.test.mjs; runtime.mjs | DBRELAY artifacts present; PostgreSQL, SQLite, D1 tenancy and restore NOT VERIFIED. |
| 061–068 DevSecOps | .github/workflows/ci.yml; .github/workflows/seva-enterprise.yml; test/enterprise.test.mjs | CI definitions exist; workflow successes referenced in PR #147, not per-node PASS. |
| 069–072 Web/Mobile | apps/seva-enterprise/public/; apps/seva-android/; apps/mobile/; .github/workflows/seva-android.yml | Source exists; device test, iOS parity and production gates NOT VERIFIED. |

**Certification remains 0/72 PASS** until evidence for each checkpoint includes commit SHA, code path, named test, CI run and relevant runtime/provider verification.

## SVAIAM patterns: design, not installed dependencies
1. **Channels:** Web, Android, authorized WhatsApp Business, voice, MCP, API/SDK. Require authenticated gateway and explicit channel opt-in.
2. **Control plane:** tenant_id from verified identity only; RBAC/ABAC; quotas; audit correlation_id; deny cross-tenant reads/writes.
3. **TITANS orchestrator:** deterministic plan and six specialist roles; tool allowlist; policy checks; signed human approvals; execution disabled by default. Preserve current 503 fail-closed behavior.
4. **Model gateway:** pluggable OpenAI/Gemini/open models; per-tenant budgets; consent/provenance; no silent provider fallback; offline test doubles. vLLM/OpenShift/OpenStack/watsonx are OPTIONAL evaluation candidates, NOT deployed.
5. **Knowledge/RAG:** document ACLs enforced before retrieval, provenance, citation links, retention rules and injection-resistance tests.
6. **Durable events:** FRONTEND -> API -> BACKEND -> DATABASE -> EVENT -> FOLLOW-UP -> AUDIT. Outbox, bounded retries, dead-letter queue, idempotency and correlation IDs; redact PII/secrets.
7. **Observability:** traces, per-tenant SLO, inference cost, model evaluation and audit evidence; no sensitive payload logging.
8. **Data sovereignty:** choose applicable EU/Italian hosting and GDPR controls based on verified contracts, not Indian data-residency requirements copied from SVAIAM.

## Proposed incremental BUILD / VERIFY gates
- G1: Generate machine-readable mapping NODE-001..072 to exact source symbols, tests, owner, dependency, commit and status; preserve NOT VERIFIED until checked.
- G2: Add negative tests for tenant spoofing, RBAC bypass, prompt injection, unauthorized tool use, duplicate events and idempotency.
- G3: Add read-only orchestrator capability discovery, plan trace and model/provider status with no secrets.
- G4: Stage sandbox E2E for TITANS planning, GMAS preview, CRM import preview, Stripe TEST signed webhook, and backup/restore on isolated data.
- G5: Review CI and evidence; independent human approval for any future merge or LIVE release.

## Hard stops
No merge of this branch, no deployment, no enabling TITANS execute, no Stripe LIVE, no messages, purchases, bookings or customer-data import. A green CI run is not proof of production integration.
