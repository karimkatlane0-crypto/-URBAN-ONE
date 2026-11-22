# TITANS GO ENTERPRISE GLOBAL — Commercial, Access & Direct Marketing Contract

**Status:** BUILD specification. Not a live payment, customer-data export, campaign send, or production release.
**Owner scope:** SUPER.AI · INSIGHTS.ai · TITANS Enterprise Studio · UNIVERSAL 36.

## 1. Commercial rules — approved facts only

All customer-facing services and modules are paid by default. There is no free plan, free trial, free tier, free file access, or free activation unless a separately approved offer explicitly says so. A module without an approved price, billing unit, tax treatment, currency, terms, and entitlement rule MUST remain unavailable for checkout and activation.

| Offer | Agreed price | Billing | Access entitlement | Guardrail |
|---|---:|---|---|---|
| TITANS Enterprise Studio — GO ENTERPRISE GLOBAL | **€10 per user, VAT included** | One-time payment; no subscription; no automatic renewal | Lifetime access to the TITANS website for the paid user | Grant only after provider-confirmed payment and entitlement record. Scope is website access; it does not imply unlimited third-party API, cloud compute, storage, support or partner costs. |
| SEVA contracted services | **€50 or €500** | One-time payment, quantity 1; no renewal | Service delivery only for a customer with an agreed service and quote/contract reference | These are not Entry purchases, AI credits, general membership, or automatic access. Never convert them into a generic subscription. |
| INSIGHTS.ai / Financial Insights | **€29/month is a previously discussed offer, not a confirmed universal price list** | Monthly only if the existing commercial offer is approved and published | Financial Insights scope only | Do not extend this price to CRM, marketing, commerce, BI, agents, files, APIs, or other modules. |
| Other SUPER.AI / INSIGHTS / TITANS modules | **Price not yet verified/approved** | To be explicitly defined per SKU | No entitlement until SKU approval and payment verification | Checkout and activation fail closed while price or terms are missing. |

Global sale does not mean one tax treatment worldwide. Show the correct seller identity, currency, applicable VAT/sales tax, invoice details, consumer/business terms, cancellation/refund rules and territorial restrictions for each buyer location. The €10 TITANS price remains VAT-included as agreed; tax handling outside the agreed market must be validated before sale there.

## 2. Payment lifecycle

Required flow: published SKU → authenticated buyer and tenant → server-calculated amount/currency/tax → provider checkout → signed webhook verification → idempotent payment event → durable billing ledger → entitlement grant → audit event → customer receipt/invoice.

- Never trust browser return URLs as proof of payment.
- Verify webhook signature, event account, livemode, currency, amount, customer, metadata, duplicate event ID and expected SKU.
- Persist payment and entitlement state transactionally in PostgreSQL; enforce unique provider event and payment IDs.
- Handle payment success, failure, refund, partial refund, dispute/chargeback, cancellation and expiry.
- Revoke or adjust access only from verified provider events and the entitlement policy; retain immutable audit history.
- TITANS €10 lifetime website entitlement is not recurring and must never create a renewal.
- SEVA €50/€500 contracted service must retain its quote/contract reference and never auto-provision general access.
- No real charge, product/price creation, payment-method activation or live Stripe mutation is included in this BUILD change.

## 3. Technical file access for INSIGHTS.ai and direct marketing

The platform must index and make searchable **all files that are technically available to the connected, authorized workspace**: current conversation attachments, explicitly accessible Library files, approved project folders, repository source/docs, issues, pull requests, CI artifacts, reports and approved connector records. Each item must carry source ID, path/title, tenant, owner, ACL, classification, consent/legal basis where relevant, last-modified time, retention rule and provenance.

Access is not universal by assertion:
- Read only files and records returned by an authorized connector or file scope. No bypass of workspace ACLs, private-chat boundaries, admin restrictions, encryption or paywalls.
- Never ingest passwords, API keys, private keys, tokens, payment-card data or other secrets into search indexes, prompts, analytics or marketing audiences. Secret scanning/redaction is mandatory.
- Respect file-level permissions, tenant boundaries, retention, legal holds, deletion requests and data residency.
- ChatGPT/OpenAI/Codex conversations and archives are included in the source catalog, but only technically exposed/exported resources can be indexed. A catalog entry is not proof of access.
- Search, summarize, classify, deduplicate, extract product facts and draft campaign assets from authorized sources. Preserve citations and source lineage.

## 4. Direct marketing — permitted workflow and hard controls

TITANS GO ENTERPRISE GLOBAL authorizes BUILD of the enterprise marketing workflow: product/offer catalog, audience segmentation, campaign drafts, landing-page content, lead scoring, suppression lists, attribution and reporting.

Before any real outbound communication or audience upload:
1. Resolve the source and controller for every contact record.
2. Record the lawful basis and channel-specific permission/consent; for consent-based processing, retain timestamp, collection source, notice/version and withdrawal.
3. Apply country-specific ePrivacy/marketing rules, existing-customer exceptions only where legally applicable, suppression/opt-out lists, age restrictions and do-not-contact controls.
4. Minimize fields; do not use sensitive personal data or infer sensitive traits for targeting.
5. Validate sender identity, unsubscribe mechanism, frequency caps, recipient geography and vendor/data-processing terms.
6. Preview and obtain campaign approval before sending or uploading audiences to Meta, Google, TikTok, LinkedIn, Microsoft Ads, Klaviyo, HubSpot or other third parties.
7. Record campaign ID, audience definition, source lineage, approval, send result, complaints, opt-outs and deletion/retention events.

The user instruction authorizes the enterprise BUILD and preparation of direct-marketing workflows. It does not override GDPR/ePrivacy obligations, third-party platform terms, contact consent, or technical connector permissions. Do not send campaigns, sync audiences, export contact files or disclose personal data to ad platforms as part of this change.

## 5. Global launch gates

- [ ] Published and legally reviewed global seller/terms/tax setup.
- [ ] TITANS €10 one-time SKU matches the agreed VAT-included price and lifetime website entitlement; no renewal.
- [ ] SEVA €50/€500 one-off service checkout requires quote/contract reference; no automatic access.
- [ ] Every other SKU has approved price, billing unit, tax, terms and entitlement; unpriced SKUs blocked.
- [ ] PostgreSQL billing ledger, versioned migrations, backup/restore and tenant isolation tested.
- [ ] Signed webhook, idempotency, refund/dispute, duplicate delivery and entitlement tests pass.
- [ ] File connectors enumerate actual scopes and enforce ACLs; secrets are redacted.
- [ ] Marketing lawful-basis/consent/suppression controls and audit evidence verified.
- [ ] Browser, mobile, accessibility, security and provider sandbox tests pass on the release SHA.
- [ ] Separate human RELEASE authorization before merge, production deployment, live billing, audience sync or campaign send.

**Decision:** BUILD TITANS GO ENTERPRISE GLOBAL and INSIGHTS.ai as a paid, source-traceable enterprise product. Do not label it LIVE/GO until every applicable gate above has evidence.
