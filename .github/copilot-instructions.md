# Repository agent instructions — URBAN ONE / UNIVERSAL 36

## Mission
Build and maintain a free, accessible, privacy-first universal entry point. Keep URBAN ONE, SEVA, SYNAPSY and TITANS as distinct products with separate owners, data, credentials, permissions, evidence and release gates.

## Operational aliases (not accounts)
- `@gita.ia`: governance and acceptance-criteria role.
- `@gthub.ia`: GitHub workflow, branch, CI and evidence role.
- `@copilot.ia`: implementation and test role.
These are labels for workstreams only. Do not represent them as GitHub users, installed Copilot agents, synchronized identities or connected integrations unless independently verified.

## Agent hand-off protocol
1. Governance role defines scope, risks, owner, acceptance criteria and prohibited actions.
2. Implementation role changes code on a dedicated branch and adds tests and documentation.
3. Verification role independently checks the exact commit, runs tests, security checks, accessibility/link checks and records evidence.
4. Release role prepares a PR and waits for explicit human approval. Never self-approve, auto-merge, publish, promote aliases or activate billing.
5. If any role or integration is unavailable, record NOT CONNECTED and continue only with available, auditable local work.

## INSIGHTS product rules
- Keep the core self-service dashboard free: no card, paywall, forced registration, auto-renewal or automatic charge.
- Keep optional professional services separate, quote-based and subject to an accepted written agreement.
- Label sample inputs and scenarios; never present user-entered values as independently verified accounts.
- Do not claim EY/Ernst & Young affiliation, endorsement, certification or use protected branding. "Executive-style" means editorial structure only.
- No bank, Open Banking, PSD2/AIS/PIS, Power BI, ERP, AI provider or payment integration is live without authenticated end-to-end evidence and permission.
- Minimize data collection. Do not commit customer data, personal data, credentials, tokens, keys or financial account identifiers.

## Quality and governance
- Follow BUILD → VERIFY → RELEASE → SCALE.
- Add or update automated tests for every functional change.
- Run `npm test`, `npm run verify`, `npm run evidence`, and `npm run security:secrets` where available.
- Keep mobile layout, keyboard access, semantic headings, contrast, link integrity and no-tracking defaults.
- Record evidence, residual risks and blocked gates. A green CI is not production certification.
- No secrets in source, no external writes without explicit authorization, no production alias changes without human release approval.
