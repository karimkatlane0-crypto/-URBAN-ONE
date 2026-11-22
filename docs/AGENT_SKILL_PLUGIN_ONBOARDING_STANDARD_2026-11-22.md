# SUPER.AI — Agent, Skill, Plugin and Model Onboarding Standard

**Version:** 1.0.0  
**Date:** 2026-11-22  
**Applies to:** SUPER.AI, UNIVERSAL 36, TITANS, INSIDERS, INSIGHTS.ai, SEVA, SYNAPSY, KKUBERA, URBAN ONE, GITA.IA and all approved connected tools.

## 1. Purpose

Provide one reusable, reviewable standard for onboarding agents, skills, plugins, models, provider endpoints, mobile deep links and external services. The standard separates a name, a skill, an installed connector, an authenticated account, a configured integration, a tested workflow and a production service.

No component is operational solely because it is named in a prompt, listed in a manifest, appears in UI, or has a connector installed.

## 2. Required onboarding manifest

Every candidate must have a versioned record containing:

| Field | Requirement |
|---|---|
| Registry ID | Stable unique ID; never reuse after retirement |
| Display name | User-approved exact label |
| Type | Agent, skill, plugin, model, provider, channel, API or deep link |
| Owner | Named accountable owner; otherwise UNASSIGNED |
| Purpose | One bounded business or technical objective |
| Version | Immutable release/version identifier |
| Source | Repository, official vendor endpoint, marketplace manifest or official docs |
| Environment | LOCAL, TEST, STAGING or PRODUCTION |
| Data classification | Public, internal, confidential, personal or restricted |
| Tenant scope | Explicit tenant/account boundary |
| Tools and permissions | Separate READ, DRAFT, WRITE, FINANCIAL and RELEASE scopes |
| Dependencies | Exact installed tools, services, libraries and versions |
| Trigger | Explicit user request, scheduled event or approved workflow |
| Inputs/outputs | Typed schema, validation and size limits |
| Security | Authentication, authorization, secrets, audit and threat model |
| Privacy | Purpose, lawful basis, consent, minimization, retention and deletion |
| Failure behavior | Timeout, retry, idempotency, compensation and fail-closed policy |
| Evaluation | Unit, integration, security, quality and regression tests |
| Evidence | Exact commit, CI run, artifact, provider record and timestamp |
| Rollback | Reversible change path and owner |
| Status | PROPOSED, DISCOVERED, INSTALLED, CONNECTED, CONFIGURED, VERIFIED, RELEASED or RETIRED |

Unknown values must be UNVERIFIED or UNASSIGNED; never infer them.

## 3. Lifecycle and status semantics

1. DISCOVERED — metadata found in an official source or plugin directory.
2. PROPOSED — intended use and acceptance criteria recorded.
3. INSTALLED — connector/package/skill installation confirmed by the host.
4. CONNECTED — authenticated account or provider connection confirmed.
5. CONFIGURED — environment, scopes, endpoints and schemas are set.
6. VERIFIED — independent tests pass on an exact version and environment.
7. RELEASED — explicitly approved deployment and operational acceptance.
8. RETIRED — access removed through approved change, data retention handled and evidence preserved.

Never skip states. INSTALLED is not CONNECTED; CONNECTED is not VERIFIED; VERIFIED is not RELEASED.

## 4. Agent and skill creation standard

Each agent/skill must include:
- name, description, version, owner and change history;
- clear activation triggers and explicit non-triggers;
- goal, subgoals, task decomposition and stop conditions;
- allowed tools and exact scopes; deny by default;
- input/output schema and untrusted-input handling;
- source hierarchy and provenance requirements;
- human approval points for external writes and consequential actions;
- error handling, retries, idempotency and rollback;
- evaluation cases, expected behavior and regression suite;
- data access, retention, deletion and privacy boundaries;
- model/provider requirements, fallback policy and cost/usage limits;
- a concise capability statement that does not overclaim.

A skill is instruction material, not a privileged runtime. It cannot grant credentials, permissions or access to other accounts.

## 5. Model and agent registry

Preserve project labels exactly. Do not invent meanings for undefined labels.

| Label | Intended responsibility | Current status |
|---|---|---|
| TITANS COMMAND | Orchestration and cross-workstream status | Governance role; cannot override controls |
| TITANS Sovereign | Enterprise governance and release policy | Private skill; not a production runtime |
| TITANS Partner Onboarding | Partner, website/mobile and CRM onboarding | Private TEST-only skill |
| ICON AGENTS | Agent identity, role, tool scopes and run evidence | Registry category; no separate installed runtime proved |
| GITA.IA | Goal decomposition, execution planning and task coordination | Project label; runtime not independently verified |
| ML.ia | ML lifecycle, data quality, evaluation and drift | Governance label; no production model deployment proved |
| LM.ia | Language model lifecycle, prompt/versioning and groundedness | Governance label; no production model deployment proved |
| Transformer.ia | Transformer model/provider workstream | Project label; provider connection not verified |
| Kubernetes.ia | Container orchestration workstream | Project label; no Kubernetes cluster connector found |
| Copilot.ia | Coding-assistant workstream | Project label; GitHub connector is not a separate Copilot runtime |
| SLE / LAS / LSE / GMAS | Owner-defined subsystems | Preserve exact labels; definitions UNVERIFIED |
| IAM | Identity, authentication, authorization, tenant membership and audit | Provider-neutral JWT verifier built; real provider config pending |

## 6. Plugin and provider standard

- Use official marketplace/connector metadata and exact IDs.
- Record enabled, installed, connected, admin-disabled and permission states separately.
- Use the least-privilege account and environment required.
- Do not copy tokens, API keys, signing keys or passwords into repository files, prompts, logs, query strings or reports.
- Require separate approvals for external data writes, contact imports, invitations, campaign sends, payment actions, exports, merges and releases.
- Verify webhooks cryptographically and process them idempotently.
- Use sandbox/test resources before production.
- A provider connector is not a provider certification or successful end-to-end test.

## 7. Deep-link and mobile onboarding

For Android App Links and iOS Universal Links:
- Verify control of HTTPS domains and canonical paths.
- Use exact package/bundle IDs and correct environment signing fingerprints.
- Verify assetlinks.json and apple-app-site-association.
- Allowlist destinations; reject open redirects and unknown schemes.
- Use opaque, short-lived, single-purpose tokens; never place credentials or personal data in URLs.
- Validate signature, audience, expiry, nonce/state, replay and server-side authorization.
- Test app-installed, app-not-installed, expiry, replay, tampering, logout, revocation and cross-tenant denial.
- A deep link is navigation, not authentication or consent.

## 8. Evaluation and proof requirements

Minimum acceptance:
- Schema/manifest validation.
- Unit and regression tests.
- Integration test against a disposable or approved TEST service.
- IAM and tenant-isolation tests.
- Secret scanning and dependency review.
- API contract, timeout, retry and idempotency tests.
- Accessibility and responsive browser tests.
- Mobile emulator and physical-device tests where relevant.
- Exact commit SHA and workflow artifacts.
- Independent verification not performed solely by the code-generation step.

Report every item as PASS, BLOCKED, IN PROGRESS or NOT VERIFIED with evidence, owner, timestamp, risk and retest requirement.

## 9. Executive approval gates

- READ: inspect only connected and authorized sources.
- DRAFT: prepare changes without sending or publishing.
- WRITE: requires explicit scope and target.
- FINANCIAL: requires explicit action-specific approval immediately before the action.
- RELEASE: requires all mandatory gates, rollback evidence and explicit human approval.
- SCALE: requires production monitoring, incident response, support ownership and measured outcomes.

No skill or agent may self-elevate permissions or override human approval.

## 10. Current integration notes

- TITANS Partner Onboarding remains TEST-only; Google Contacts and Microsoft Power BI are deferred until separately enabled and authorized.
- GitHub and OpenAI Developers are installed/available; their presence does not prove Copilot or a live model endpoint.
- Google Contacts and Google Drive were returned as admin-disabled.
- Microsoft Power BI was available but not installed in plugin discovery; no dataset refresh or workspace publication was verified.
- No dedicated Kubernetes or transformer model connector was found in plugin discovery.
- Google Maps public URL search is present; Google Maps Platform API, billing and credentials are not verified.
- The provider-neutral OIDC verifier is implemented and tested, but issuer/audience/JWKS and membership authority remain unconfigured.
- All production claims remain subject to the executive manifest and evidence matrix.

## 11. Required output for each onboarding review

1. Objective and intended user journey.
2. Registry record and exact source.
3. Installed/connected/configured state.
4. Permissions, data and privacy assessment.
5. Architecture and dependency map.
6. Forward and backward goal/subgoal/task decomposition.
7. Threat model and failure analysis.
8. Test matrix and reproducible evidence.
9. PASS/BLOCKED/NOT VERIFIED decision.
10. Next action, owner and required approval.

This standard is a BUILD/VERIFY artifact. It does not install plugins, provision infrastructure, connect external accounts or authorize production release.
