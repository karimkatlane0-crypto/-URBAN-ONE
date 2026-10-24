# URBAN ONE — Operator attestations and safe check-in / check-out release

Revision: 24 October 2026. **Software source only, not a deployed guest-identification or Alloggiati Web backend.**

## GOAL

Complete the operator-review layer that is missing between the already-tested check-in/out task planner and any future property-wide live integration. The code records **staff assertions with opaque evidence references**, never a fabricated official police receipt, real identity-verification certification, key release or payment.

Related:
- `packages/hospitality/turnover-import.mjs` — private CSV → date tasks
- `packages/hospitality/pms-smoobu-turnover.mjs` — privately authorized Smoobu JSON → pseudonymous date tasks
- `packages/hospitality/operator-evidence.mjs` — **new** operator attestation event reducer, not exposed as a public API
- `docs/HOSPITALITY_PMS_SMOOBU_BRIDGE_2026.md`
- GitHub issue #67 — remaining external LIVE blockers

## Workflow and explicit operational proof

Initial review state:
- `arrival: NOT_ATTESTED`
- `departure: NOT_ATTESTED`
- `alloggiati: NOT_SUBMITTED`
- `keys: NOT_AUTHORIZED`
- `pms: NOT_UPDATED`

Permitted staff events:
1. `ATTEST_VISUAL_ID_AT_ENTRANCE`: staff states they checked identity against a valid document **at access to the accommodation**. This is an operator attestation for audit, **not an independently verified identity-provider result**.
2. `ATTEST_DEPARTURE_OBSERVED`: separate authorized staff attestation, permitted only after an arrival attestation.
3. `RECORD_REPORTED_OFFICIAL_RECEIPT_REFERENCE`: a properly scoped reporting reviewer records only a pseudonymous `rcpt_...` reference for later reconciliation. This **never changes `actualAlloggiatiSubmissionPerformed` from false** or represents a confirmed official receipt.

Each event includes a **unique event ID**, an ISO UTC time, the authenticated staff's opaque ID and an `ev_...` reference. Exact duplicates are idempotent, conflicting replay blocked; guest name, identity document, booking notes, entry codes and other extra fields are not copied.

## CRITICAL AUTHENTICATION BOUNDARY

The library accepts `trustedAuth` only as the server's authenticated authorization decision. It does **not** authenticate anyone itself. Never expose this method as a browser/API endpoint that allows clients to send `authenticatedByServer: true`. Only a future **private trusted backend** may construct trustedAuth from actual login/session and authorization, including tenant/property isolation and proper `hospitality:attest` and `alloggiati:receipt_review` scopes.

The state is an in-memory reducer. Its journal is **NOT yet a durable, tamper-evident audit record**; it must be stored server-side with authenticated writes, transactions, encryption, event IDs, retention, backup and change-control. Manual operator assertions and `rcpt_...` references **must not be treated as authoritative proof** without verification.

No key release, PMS writes, payment, photo upload or police submission is implemented.

## Legal / regulatory and external dependencies

- Alloggiati Web requires the operator to report guests **within 24 hours after arrival**, or **at arrival** for stays shorter than 24 hours, through the official service. Its official FAQ requires storing digital receipts for **five years** and notes their ordinary availability for download for **30 days**. This source-only module does not process identifying data, SOAP or receipts. The producer must establish official service authentication and reconcile actual accepted submissions first.
- Consiglio di Stato 21 November 2025 judgment 9101: the guest identity/document match must be verified *de visu* at entry. Adequate real-time entrance video devices may be considered; a photo submitted in advance with unattended keybox admission is not sufficient. Operator must comply with the actual applicable requirements.
- Booking.com new Connectivity Provider onboarding remains paused and individual properties normally must use a connected channel manager.
- Smoobu direct API access requires a paid account, current HMAC request signatures and the property's consent. Official 2026 support pages give inconsistent HMAC mandatory deadlines (25 September and 31 October), so **sign every call now** rather than relying on old unsigned tokens; an existing signed read-only request builder is in source, not connected.
- No password, private HMAC key, guest photo, guest identifying information, financial data or actual Smoobu export may be uploaded to public GitHub, ChatGPT, public Pages or public issues.

Primary sources: 
- https://alloggiatiweb.poliziadistato.it/portalealloggiati/
- https://alloggiatiweb.poliziadistato.it/portalealloggiati/FAQ.aspx
- https://www.giustizia-amministrativa.it/web/guest/-/105486-1372?_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_M2jdZL26fejg_viewSingleAsset=true
- https://connect.booking.com/
- https://support.smoobu.com/hc/it/articles/360003170740-Usa-l-API-di-Smoobu-crea-una-chiave-API-configura-i-webhook-e-firma-le-richieste

## Remaining production acceptance criteria

- [ ] Identify actual property and connected PMS, operator authority and guest-data processing grounds.
- [ ] Obtain owner-approved provider plan/contract only if necessary; avoid new owner-funded costs and unauthorized live spend.
- [ ] Implement authenticated private server (session, verified staff, property RBAC, CSRF and rate limiting) and encrypted tenant-scoped durable audit store. **Do not bind operator-evidence directly to a public endpoint.**
- [ ] Test real PMS adapter with provider account, cancellations, pagination and updates; sandbox if supplied.
- [ ] Verify documented entrance identity workflow, not just an uploaded ID image or simulated staff state.
- [ ] Integrate official Alloggiati service in a private backend and verify **actual accepted receipt**, retries and reconciliation.
- [ ] Enforce check-out and room release using on-site staff evidence, then configure housekeeping scheduling without guest PII.
- [ ] Run end-to-end production acceptance with one operator-approved property, evidence that no duplicate reporting or charges occur and validated fallback for outages.

**Release classification:** `OPERATOR_ATTESTATION_SOURCE_READY`; `PMS_LIVE=false`, `ALLOGGIATI_LIVE=false`, `PHYSICAL_CHECKIN_AUTO=false`, `HOSTED_GUEST_BACKEND=false`.
