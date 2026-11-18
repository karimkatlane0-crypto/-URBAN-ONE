# Four-product integration contract — URBAN ONE / SEVA / SYNAPSY / KKUBERA

**Status:** shared consent foundation proposed in PR #189; product adapters and hosted integrations remain pending.
**Canonical repository:** `karimkatlane0-crypto/-URBAN-ONE`
**Method:** BUILD → VERIFY → EXECUTE → VERIFY → RELEASE → SCALE.

## Product registry

| Product ID | Product | Domain |
|---|---|---|
| `urban-one` | URBAN ONE | Technology and digital services |
| `seva` | SEVA | Commerce and digital services |
| `synapsy` | SYNAPSY | Intelligence and orchestration workspace |
| `kkubera` | KKUBERA | Property and hospitality marketplace |

The registry identifies product namespaces only. It does not prove that the products share a login, identity provider, database, deployment, or controller role. Consent remains product-scoped. Cross-product identity linking requires a separately verified account-linking flow and an explicit, disclosed user choice.

## Shared service boundary

All four product adapters must use the same server-side consent API and policy vocabulary:

- `GET /api/privacy/consent/{product}`
- `PUT /api/privacy/consent/{product}`
- `POST /api/privacy/consent/{product}/withdraw`
- `GET /api/privacy/consent/{product}/audit`

The API must be called with a verified authenticated subject and least-privilege `privacy:read` / `privacy:write` scopes. Never accept a user ID, role, product identity, or consent state from an untrusted browser header as proof of authority.

## Data and purpose boundaries

- Optional purposes (analytics, personalization, email, mobile, partners) default OFF independently in each product.
- Essential service processing is not blanket consent; document the applicable lawful basis and necessity for each operation.
- No data is shared across products merely because the same person uses more than one product.
- Partner sharing requires identified recipients or categories, specific purposes, data scope, retention and lawful-basis documentation.
- Revocation must propagate to the downstream processor and be reconciled; API state change alone is not proof of downstream cessation.
- AI inference, model training, automated decisions and human review must each have separate documented purpose, provider, data boundary and authorization. No customer-data training is enabled by this registry.

## Product adapter acceptance

### URBAN ONE
- Add the preference center to the authenticated user account.
- Gate analytics, personalization and partner export at the backend.
- Verify guest and authenticated flows do not bypass the gate.

### SEVA
- Connect the SEVA site/API to the central consent endpoint server-to-server.
- Gate analytics, creator attribution, marketing channels and commerce partner exports independently.
- Payment state or checkout completion must never imply marketing or analytics consent.

### SYNAPSY
- Connect the authenticated workspace identity to the consent service without exposing credentials.
- Require explicit consent and separate authorization before optional AI dispatch, analytics or communications.
- Existing TITANS deterministic account checks are not arbitrary agent execution or proof of AI provider readiness.

### KKUBERA
- Gate property recommendations/personalization, analytics and partner/merchant disclosures.
- Keep property requirements, contact details, visits and transaction records isolated by account and product.
- Never disclose property or customer records to a partner based on a generic partners toggle.

## Current evidence and known blockers (18 Nov 2026)

- The central consent implementation is in Draft PR #189; CI on its recorded head passed 297/297 tests.
- SYNAPSY's connected account tools report configured database tables but end-to-end verification is not complete for the listed modules.
- SYNAPSY runtime reports its executive authorization disabled, zero executive budget, personal AI credential not stored, and AI provider credit not verified. It does not support arbitrary code execution or unattended execution.
- SYNAPSY workspace summary: CRM revision 14, goals revision 13, 181 contacts, 241 goals (63 verified, 30 blocked); these are account summary counts, not proof of integration or data quality.
- KKUBERA account query returned zero registered properties and zero requirements at the time of check.
- SEVA payment readiness records LIVE payment limitations; live checkout-to-entitlement, automated fulfillment, tax registration and seller routing are not verified.
- SEVA site availability receipt is stale and checks public routes only, not provider health.
- WordPress is the intended canonical CMS, but no WordPress adapter deployment is evidenced by this contract.

## Tier-1 intelligence and advisor governance

The label "Tier-1" is a quality target, not a certification. The system must distinguish:
1. deterministic workflow automation;
2. model-assisted analysis with a verified provider response;
3. human-reviewed recommendations;
4. authorized external actions with immutable evidence.

Every AI task needs an owner, purpose, data classification, allowed tools, budget, model/provider, consent/legal-basis check, human approval threshold, audit record and rollback route. Do not advertise autonomous agents, unrestricted access, production integrations or certification without evidence.

## Release gates

1. Code review and complete CI.
2. Verified authentication and account isolation.
3. Durable encrypted database and tested recovery.
4. Product adapters deployed to staging.
5. Purpose-level backend enforcement for every provider path.
6. Revocation propagation, retry/dead-letter and reconciliation tests.
7. Accessibility, security, privacy and legal review.
8. Explicit production release approval.

No production deployment, provider activation, cross-product data migration, AI training, payment operation or external communication is authorized by this integration contract.
