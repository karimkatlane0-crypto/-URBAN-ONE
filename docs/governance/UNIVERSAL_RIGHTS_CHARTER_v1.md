# Universal Rights & Responsible Technology Charter

**Scope:** SEVA and URBAN ONE  
**Status:** Proposed governance baseline — implementation and legal review required  
**Operating method:** BUILD → VERIFY → RELEASE → SCALE

## 1. Foundational commitment

People come before technology and commercial interests. Products and services should respect human dignity, autonomy, equality, privacy, security, freedom of expression, accessibility, and fair participation. Technology should improve quality of life and distribute opportunities responsibly.

This charter is a product-governance commitment. It does not replace applicable law, legal advice, a data-protection impact assessment, or the assessment of a lawful basis for each processing activity.

## 2. Consent and privacy requirements

- Essential processing must be limited to what is objectively necessary to provide the requested service, maintain security, or meet a legal obligation, with the applicable lawful basis documented.
- Optional purposes must be separate, specific, explained in plain language, and OFF by default.
- No preselected optional consent, bundled consent, deceptive design, or coercive choice.
- Refusal of optional processing must not cause unjustified loss of core service or discriminatory treatment.
- Withdrawal must be as easy as giving consent and must stop consent-based processing prospectively without undue delay.
- Record the notice/version, purpose, choice, timestamp, and relevant policy version; do not collect unnecessary evidence or sensitive data.
- Partner sharing requires named or sufficiently identified recipients/categories, specific purposes, data categories, retention information, and a documented lawful basis. Consent is not assumed to be the only possible lawful basis.
- Analytics and personalization must not run before the required consent or other applicable lawful basis is established.
- Marketing preferences must be channel-specific. Email, SMS, and WhatsApp remain independently OFF until valid permission is obtained where required.
- Provide accessible privacy information, preference review, correction, export, and rights-request routes.

## 3. Universal product principles

1. Human dignity and autonomy.
2. Equal treatment and non-discrimination.
3. Privacy and data minimization by design and default.
4. Security, accountability, and transparent explanations.
5. Accessibility and meaningful user control.
6. Fair sharing of the benefits of innovation.
7. Human review and effective redress where automated decisions materially affect people.
8. No claim of compliance or certification without documented evidence.

## 4. Required consent model

| Key | Purpose | Default |
|---|---|---|
| essential | Necessary service operation, security, and legal obligations | Always limited to necessity; not an optional consent toggle |
| analytics | Optional analytics not otherwise lawfully exempt | OFF |
| personal | Optional personalization | OFF |
| email | Promotional email | OFF |
| mobile | Promotional SMS / WhatsApp | OFF |
| partners | Optional partner disclosures where consent is the required lawful basis | OFF |

The essential flag must never be interpreted as blanket permission for unrelated processing. The partners flag must not authorize undisclosed recipients or unspecified purposes.

## 5. BUILD → VERIFY → RELEASE → SCALE gates

### BUILD
- Implement a central, versioned preference service.
- Enforce consent server-side before optional processing, not only in the UI.
- Propagate withdrawal to analytics, marketing, personalization, and partner integrations.
- Keep audit records tamper-evident and access-controlled.
- Document controller/processor roles, retention, recipients, and lawful bases.

### VERIFY
- New user: every optional preference is OFF.
- Refusal: optional trackers and outbound marketing remain disabled.
- Partial choice: only individually enabled purposes activate.
- Withdrawal: downstream processing stops and integrations receive revocation.
- Partner disclosure: blocked unless recipient, purpose, data scope, and lawful basis are configured.
- Essential-only operation: core service works without optional consent wherever technically and legally possible.
- Test direct API calls, race conditions, stale consent versions, account deletion, and failure-safe behavior.
- Verify accessibility, clear language, and equivalent prominence of accept/reject controls.

### RELEASE
- Require code review, automated tests, security review, privacy/legal review, staging evidence, and an accountable release approval.
- Do not enable production integrations or trackers based solely on this document.

### SCALE
- Monitor consent integrity, withdrawal propagation, complaints, security incidents, and disparate impact.
- Reassess purposes, providers, and notices when integrations or data uses change.

## 6. Acceptance criteria

A release is blocked if any optional purpose activates by default, a revoked permission remains effective downstream, partner recipients or purposes are undisclosed, or a privacy/security/legal gate lacks evidence.

**Current status:** This document establishes proposed requirements only. It does not prove that application code, databases, integrations, staging, or production have been changed or certified.
