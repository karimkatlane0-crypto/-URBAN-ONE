# URBAN ONE — EU27 B&B consent-first marketing pilot

**Status:** not sent, no marketing provider connected, no B&B recipient has been authorized.

## Scope
An opt-in B&B partner program with commercial communications in the 27 EU Member States. No claim of exhaustive B&B coverage. HOTREC member associations may serve as publicly documented sector discovery routes; their membership is not direct-marketing permission for their members.

## Workflow
1. Independently verify B&B operator/legal entity, official site and business role.
2. Collect the address/number directly from a permitted source, record source and acquisition date, minimize retention.
3. Ask property representatives to opt in through a published form on an owned, verified domain. Obtain separate affirmative, unticked channel choices for EMAIL and SMS and disclose purpose, controller identity, privacy notice and withdrawal method. Store evidence privately.
4. Complete country-by-country ePrivacy/GDPR review for the intended purpose/channel, suppress all unsubscribed contacts, remove invalid and duplicate records.
5. Execute the `preflightBnbConsentCampaign` dry run server-side against verified private contact records. This function **cannot send** messages; it explicitly returns `sendAuthorized:false` even when candidate records pass screening.
6. Connect a compliant bulk email/SMS provider account through OAuth or secret-vault-protected API credentials. Configure sender authentication (SPF, DKIM, DMARC) and correct STOP/unsubscribe routes. SMS generally requires paid credits, provider-specific sender identity and country rules.
7. Have the operator approve the final recipient cohort, exact content, applicable costs, legal review and scheduled dispatch. Then use a separately designed privileged provider adapter with audit logs and test receipts; do not wire broad Gmail/Brevo/Twilio APIs directly to unauthenticated client flags.
8. Record actual provider receipts, bounces, complaints and opt-outs. Only verified sent states may be described as SENT.

## Example landing-page wording (must be reviewed for legal/local conditions)

**B&B partner updates — URBAN ONE**

By submitting this form, you request information about URBAN ONE's proposed B&B services. Our pricing (monthly service plus commissions on qualifying verified direct bookings) is offered subject to separate agreement. You may withdraw consent at any time.

- [ ] I agree to receive URBAN ONE B&B partnership email updates.
- [ ] I separately agree to receive URBAN ONE B&B partnership SMS updates.

Provide a working, accessible privacy notice, controller contact, purposes, legal grounds, recipients and retention details. **No pre-checked boxes.** Keep provider evidence of the form version, timestamps, channel and opt-out.

## Technical readme

- Engine: `packages/marketing/bnb-consent-preflight.mjs`.
- Tests: `tests/bnb-consent-preflight.test.mjs`.
- Required inputs: a trusted private consent ledger, dated country/channel legal reviews, a suppression list, and a verified campaign identity.
- The code must not be exposed as a publicly callable API accepting forged consent booleans.
- No real business identities, personal emails, phone numbers, signed forms, sending credentials or payment details are stored in public GitHub.
- The UE27 Excel workbook was a research/pilot tracker, not an authorized contact database.

## Commercial and security notes
Stripe Network Pass and B&B subscription/commission products are separate from marketing outreach. This branch creates neither Stripe objects nor charge/invoice actions. No B&B partners are onboarded and no revenue is guaranteed.

**Operational signal:** `MARKETING_CONSENT_PREFLIGHT_SOURCE_READY__NO_AUTHORIZED_RECIPIENTS__NO_SEND`.
