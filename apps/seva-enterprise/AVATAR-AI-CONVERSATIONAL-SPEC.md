# SEVA @Avatar.ai — Conversational Assistant BUILD Specification

**Status:** BUILD specification + isolated UI prototype; NOT connected to an AI provider  
**Scope:** SEVA only  
**Date:** 2026-11-21  
**Governance:** BUILD → VERIFY → RELEASE → SCALE  
**Release:** explicitly out of scope

## Product definition

@Avatar.ai is the conversational assistant embedded in SEVA. It gives citizens, professionals, SMEs and stakeholders one accessible conversational entry point to find help across SEVA's own services: onboarding, profiles, opt-in connections, directory, CRM, customer service and Insights.

The avatar is an interface and assistant identity, not a real person, not a verified employee, and not an autonomous decision-maker. The UI must disclose that the user is interacting with AI.

## User experience

- Persistent but dismissible assistant entry point in SEVA Studio.
- Dedicated conversation view with text chat, accessible transcript, typing/working status, retry and clear conversation controls.
- Context-aware entry points may pass only the minimum necessary SEVA context, with the user's awareness.
- Quick intents: find a service, understand SEVA, manage a profile, discover opted-in organizations, request a connection, open a support case, understand an Insights metric.
- Human handoff for complaints, account recovery, privacy requests, payments, legal/financial/health advice, suspected fraud, sensitive data, or low-confidence answers.
- Voice is a later optional capability, disabled until explicit microphone permission and a verified speech provider are configured.
- No synthetic human likeness or voice cloning of a real person without documented authorization.

## Safety, privacy and consent

- AI identity disclosure at first use and in the conversation header.
- No contact discovery, messaging, CRM mutation, invitations, payments, account changes or external submissions without explicit confirmation immediately before the action.
- Read-only by default. Every tool/action has a server-side authorization check, least privilege, tenant scope and audit event.
- Do not use private address-book contents as model context by default. A user must choose the relevant contact/context and confirm sharing.
- Minimize personal data in prompts; redact secrets, payment data and authentication tokens.
- Do not train models on user conversations unless a separate, explicit and revocable opt-in exists and the provider contract supports it.
- Retention is configurable and disclosed. Provide clear new-chat, export and delete controls; deletion must include provider-side retention limitations.
- Refuse requests to reveal another user's private contact details or cross-tenant CRM data.
- Show source/record provenance for answers derived from SEVA data. Distinguish verified facts from model-generated suggestions.
- Rate limit, abuse monitor, protect against prompt injection and treat retrieved content as untrusted data.

## Proposed service architecture

1. SEVA web/mobile client renders the assistant shell and transcript.
2. Authenticated SEVA API validates session, tenant, user role, consent and request size.
3. Conversation orchestrator applies system policy, tool allowlist, prompt-injection defenses and model/provider routing.
4. Retrieval layer queries only authorized SEVA records; tenant filters are enforced server-side and in the database.
5. Tool broker exposes narrow typed actions (read profile, list own cases, search opted-in public directory, draft connection request); mutating actions require confirmation tokens and idempotency.
6. Audit/telemetry stores minimal metadata, policy decisions, tool receipts and latency/error metrics, not secrets or unnecessary prompt copies.
7. Human support queue handles escalations.

Provider credentials stay server-side in a secrets manager; never in browser code, repository files, mobile bundles or logs. Provider selection, data residency, DPA, retention, model quality and costs must be reviewed before enabling a live model.

## Proposed API (not implemented by this spec)

- `POST /api/v1/assistant/conversations` — create an authenticated conversation.
- `GET /api/v1/assistant/conversations/:id` — retrieve own conversation under retention policy.
- `POST /api/v1/assistant/conversations/:id/messages` — send a message; stream response where supported.
- `POST /api/v1/assistant/actions/:id/confirm` — confirm one narrowly scoped proposed action.
- `POST /api/v1/assistant/conversations/:id/feedback` — optional feedback.
- `DELETE /api/v1/assistant/conversations/:id` — request deletion according to disclosed retention and provider constraints.
- `POST /api/v1/assistant/handoff` — open a human support handoff.

All endpoints require authentication, tenant scoping, CSRF/origin controls where applicable, validation, rate limits and audit. The server must reject client-supplied tenant/user ownership claims.

## Metrics and quality gates

- Availability, p50/p95 latency, error rate, token/cost per resolved conversation.
- Helpful-resolution rate measured with explicit user feedback and audited samples.
- Human handoff rate, abandonment, repeat-contact rate and unresolved-intent rate.
- Safety: unauthorized tool invocation, cross-tenant retrieval, PII leakage, prompt injection, unsafe automation and consent violations. Target: zero confirmed cross-tenant disclosure and zero unconfirmed external actions.
- Evaluate Italian first, then supported languages, including accessibility and low-bandwidth mobile scenarios.
- No vanity metric should be represented as customer success without a defined denominator and source.

## BUILD verification plan

1. Static UI: mobile layout, keyboard navigation, semantic transcript, screen-reader announcements and visible AI disclosure.
2. API auth: anonymous 401; invalid session rejected; tenant/user mismatch denied.
3. Data access: two synthetic tenants; retrieval and tool calls cannot cross boundaries.
4. Tool safety: read-only default; mutation blocked until explicit, scoped confirmation; replayed confirmation is idempotent.
5. Privacy: no contact-list injection, no secrets in prompts/logs, deletion/retention tests and provider contract review.
6. Resilience: timeout, retry, provider outage, malformed response, rate limiting and handoff.
7. Quality: curated Italian test set, factuality/source attribution, refusal and prompt-injection tests.
8. Accessibility: WCAG 2.2 AA target and Android/mobile browser acceptance.

## Current known status

- This branch adds the product specification and an isolated static UI prototype only.
- No live model/provider, voice service, conversation database, tool broker, CRM integration or human support queue is connected by this change.
- The prototype must label itself as preview and must not send user content to a provider.
- Production integration remains blocked pending backend/auth/tenant isolation, privacy review, provider and budget approval, independent tests and separate release authorization.

## Release gate

Do not deploy, merge, connect a live model, enable voice, transfer user data or publish this assistant based on this PR. Each requires independent verification and the relevant explicit authorization.
