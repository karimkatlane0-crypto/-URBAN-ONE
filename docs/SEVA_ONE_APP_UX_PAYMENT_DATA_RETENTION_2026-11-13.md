# SEVA ONE — Unified app and reversible consolidation

Date: 2026-11-13. Scope: PR #147. Status: proposed implementation; no LIVE activation.

## One app / one session
- Canonical SEVA domain and one account-aware responsive UX for web, Android and iOS/PWA.
- Main navigation: Search, CRM, Bookings, Commerce, TITANS, Evidence. No duplicate landing experiences or unnecessary redirects.
- Authenticated session with scoped permissions; device-specific authentication and token lifecycle verified separately. A common UI does not imply one unrestricted credential across providers.
- Accessible forms, keyboard and screen reader support, explicit progress/errors, confirmation for irreversible actions.
- One event trace: FRONTEND > API > BACKEND > DATABASE > EVENT > FOLLOW-UP > AUDIT.

## Reversible version and tag cleanup
- Inventory legacy Sites revisions, Git branches/tags and published deployments; record commit SHA, owner, dependencies and retention policy.
- Identify duplicates by content hash and verified references. Archive before considering deletion; retain recoverable history and rollback targets.
- Require dry-run deletion report, backup integrity verification, owner review, retention/legal-hold checks and explicit approval before deleting any version/tag. Do not delete current, protected, referenced or unverified releases.
- Avoid replacing or merging databases without tenant-isolation and restoration tests.

## Payment beneficiary and financial flows
- The beneficiary/bank details supplied by the owner are private operational configuration, not public source material. Never commit full IBAN, account ownership assertions, card credentials, payout tokens or signing secrets to GitHub.
- Use authenticated Stripe merchant payout settings; confirm account ownership, eligible destination, successful test flows and settlement evidence. Account configuration is not proof of successful payout.
- Hosted Checkout for approved offers, signed webhook, idempotency, subscription ledger, cancellation/refund, and commission reconciliation. Require explicit customer consent and owner approval for real charges/transfers.
- Do not assert equivalence with OpenAI's private billing system or third-party endorsement.

## Provider/plugin effectiveness
- Define capability registry per provider: not-connected, authorized, configured, TEST verified, LIVE verified. Record source, scope, last test, owner and error.
- Search only authorized/public data with provenance. CRM import must support dry run, deduplication, opt-in, export and rollback.
- Skebby/WhatsApp/Booking provider APIs remain gated by permissions, credentials and provider E2E tests.
- TITANS plans/preview can be prepared; execution requires scoped approval, budget/rate limits, tenant isolation and audit.

## Release gates
BUILD -> VERIFY (CI on exact SHA, API contracts, security and privacy, TEST provider flows, restore) -> REVIEW -> MERGE -> STAGING -> RELEASE approval.
NO-GO: automatic billing, live bookings, autonomous agents, mass messages and Kubernetes production until evidence supports each capability.
