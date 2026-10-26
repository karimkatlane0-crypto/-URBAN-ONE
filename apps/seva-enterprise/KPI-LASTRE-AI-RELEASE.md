# SEVA IS CALLED — Original Intelligence: KPI/KPMI × Lastre AI × CRM

**Change:** SEVA Phase II+/III source extension, October 26, 2026.
**Purpose:** Reconnect the original goal-oriented AI, buyer intentions, financial analysis, and A–T–G–M–S without changing the billing contracts or misrepresenting transactions.

## Customer experience
1. **Analisi KPI/KPMI:** login → Analytics KPI → goal totals, progress, blocked items, saved campaign proposals, consented marketing and Lastre intent counts. All queries use session owner ID and SQLite parameterized SQL. Progress is actual goal state, not estimated effectiveness. **Saved quote totals are not revenue, Stripe payouts, commissions or achieved savings.**
2. **Lastre private first:** login → Lastre AI + CRM → enter category (buy / rent / lease / credit information / other), description and budget; only clicking "Salva nel CRM privato" with affirmative CRM checkbox persists a draft, scoped to the user. It can be deleted. No supplier receives the draft automatically.
3. **Images:** users can preview several files locally. Analysis is possible only after an explicit separate checkbox and click. Browser resizes the *first selected* image and converts it to bounded JPEG to strip original embedded metadata. Server validates JPEG header, maximum 1 MiB, user session, subscription entitlement/admin permission, server API key, and rate limit.
4. **OpenAI vision:** provider Responses API receives the selected JPEG and buyer description with `store:false`, returns an explanatory answer and audit ID only. No photos or AI image results are persisted, no product purchase is executed, and no guarantee of accurate photo recognition, pricing or financing. Provider can still process the image in accordance with its applicable terms; do not select photos of private or sensitive information.
5. **Accounting:** buyer annual €50, seller annual €500, formula A €50/month remain independent; T/G/M/S is simulation only. Buyer-funded marketing refunds are never automatically executed.
6. **SEVA DBRELAY:** original goal/campaign change feed remains unchanged; Lastre intentions use a separate, owner-scoped CRM endpoint instead of an unsafe migration of the existing event table. Integrating Lastre events into incremental DBRELAY requires a future versioned migration.

## API
- Authenticated `GET /api/analytics/overview`
- Authenticated `GET /api/lastre/intents`, `POST /api/lastre/intents`, `DELETE /api/lastre/intents/:id`
- Authenticated `POST /api/lastre/analyze` (explicit image consent and active entitlement)
- Existing goal, DBRELAY, Stripe and commercial quote endpoints are not removed.

## Database protection and recovery
- Consistent SQLite backup: `cd apps/seva-enterprise && node --experimental-sqlite maintenance.mjs backup ./data/seva.sqlite ./private-backups/seva-YYYYMMDD.sqlite`
- Restore **into an unused database path only**: `node --experimental-sqlite maintenance.mjs restore ./private-backups/seva-YYYYMMDD.sqlite ./data/seva-restored.sqlite`
- Backup uses `node:sqlite` backup API, runs integrity checks, stores files with permissions 0600 and refuses overwriting existing backups. Restore verifies before and after copy and refuses overwrite.
- Backup directory must be on a secured durable storage volume not publicly served; separately configure encrypted off-host retention, backup scheduling, rotation and periodically prove real restore. This change does not provision any cloud storage or background scheduling.

## Release gates
- [ ] Confirm published HTTPS origin, persistent mounted disk and successful restore from real production backup.
- [ ] Validate the server has secret-only `OPENAI_API_KEY` and a genuine authenticated OpenAI vision answer with redacted response ID.
- [ ] Exercise browser photo resizing and consent, accessibility, large-image rejection, Android device.
- [ ] Complete multi-account penetration/privacy checks and GDPR consent/erasure requirements; decide retention.
- [ ] Verify Stripe Checkout (buyer/ecommerce) TEST→signed webhook→plan-specific entitlement and cancellation before customer sales.
- [ ] Approve financial marketing and cashback language; no automatic buyer fund pooling or guaranteed refund.
- [ ] Match the original SEVA Work app before replacing or publishing its frontend. Do not override Work files or secrets from GitHub.

**Status:** Source integration and CI are not proof of real provider, device, public site or commercial production readiness.

## Existing SEVA Campus compatibility

The repository already includes a separately maintained SEVA Campus/student identity source from PR #86. This extension **does not substitute university verification, infer student identity from images, or grant payment access by merely creating a student profile**. Lastre CRM is scoped to the authenticated SEVA user and requires its own opt-in, regardless of campus registration. A current institutional enrollment verification provider and age/consent checks must be validated separately before claiming globally verified student IDs.
