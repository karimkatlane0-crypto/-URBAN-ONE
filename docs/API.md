# API Contract — v7.0.0 FINAL

## GET /health
Public liveness only. Returns the application version and does not expose credentials, provider configuration or private data.

## GET /api/universal/status
Returns fail-closed AI/relay configuration plus source capabilities. Current feature flags include private contacts, exact civic search, map-ready queries and EU INSPIRE public-data discovery across 34 themes.

## GET /api/public/eu-spatial/policy
Returns the public spatial-data policy: INSPIRE/data.europa.eu discovery is allowed, provider terms remain authoritative, and the public cadastral path does not perform natural-person ownership, tax-ID or certificate/document lookup.

## POST /api/public/eu-spatial/search-plan
Public, read-only query builder for the official European Data Portal Search API.

Input fields:
- `country`, `city`, `street`, `number`, `postalCode`;
- `themes`: `real_estate` (default), `all`, one theme key, or an array of INSPIRE theme keys;
- optional `page` and `limit` (capped at 100).

Behavior:
- fixed endpoint: `https://data.europa.eu/api/hub/search/search`;
- applies the European Data Portal geospatial-catalogue facet;
- covers all 34 official INSPIRE themes;
- returns a user-initiated search URL and policy metadata;
- does not scrape national cadastral websites, bypass access controls, or claim that cadastral geometry proves ownership;
- does not enrich owner names, fiscal/tax identifiers or identity-document fields.

## POST /api/universal/prepare
Prepares a sanitized, provenance-hashed envelope. Requires authenticated user context, RBAC scope `prepare:provider`, explicit consent, purpose, scope and source reference. It does not execute a provider request.

## POST /api/contacts/import-preview
Private owner-scoped contact normalization. Requires authenticated user context and scope `contacts:read`.

Input:
- `source`: defaults to `skebby`;
- `records`: provider/upload records. Skebby-compatible fields include `id`, `phoneNumber`, `name`, `surname`, `email`, `city`, `province`;
- optional certificate metadata: `certificateId`, `certificateIssuer`, `certificateValidTo`.

Behavior:
- keeps authorized name/surname/contact fields for the private import preview;
- validates phone/email and marks duplicates;
- never infers marketing consent;
- never returns or persists a raw certificate/document ID from normalization: only a SHA-256 fingerprint is produced;
- defaults to 500 records per preview batch unless a lower limit is supplied.

This endpoint does not contact Skebby itself and does not send SMS. Provider credentials stay server-side in the dedicated adapter/configuration.

## POST /api/properties/search
Private property search. Requires authenticated user context and scope `properties:read`.

Input:
- `records`: workspace property records or data fetched from the private DB layer;
- `query`: `country`, `city`, `street`, `number`, `postalCode`, plus optional `status`, `minAreaSqm`, `maxPriceCents`.

Behavior:
- Unicode/diacritic tolerant street and city comparison;
- exact house-number matching after canonicalization (`12A`, `12 A`, `12-A`, `12/A` → `12/A`);
- postal-code filter when supplied;
- returns a provider-neutral `mapQuery` string ready for a configured maps/geocoder adapter;
- does not claim that every European civic address is indexed.

## POST /api/stripe/webhook
Server-only Stripe Billing webhook endpoint. The HTTP server passes the unmodified raw request body to signature verification before JSON parsing.

Requirements:
- HTTPS deployment of the API service;
- server-side `STRIPE_WEBHOOK_SECRET` from the matching Stripe LIVE webhook endpoint;
- `Stripe-Signature` header must validate using HMAC-SHA256;
- signatures older than the configured five-minute tolerance are rejected;
- the signing secret must never be committed to GitHub, included in clients/mobile builds, or written to logs.

Handled lifecycle events:
- `checkout.session.completed` and `checkout.session.async_payment_succeeded` → verify the Stripe subscription/payment state before granting entitlement;
- `invoice.paid` → continue entitlement after provider-side verification;
- `invoice.payment_failed` → enter payment-recovery handling;
- `customer.subscription.updated` → synchronize subscription state;
- `customer.subscription.deleted` → revoke entitlement when cancellation is effective.

Unknown event types are acknowledged as `IGNORE`. A verified webhook delivery is evidence of event authenticity, not by itself proof that a user is entitled. Event IDs must be persisted idempotently and application entitlement changes must be based on authoritative Stripe object state before production access is granted.

## Database additions
`db/schema.sql` includes:
- private owner-scoped `contacts` with consent/RPO fields and certificate fingerprint storage;
- `property_address_index` for canonical country/city/street/civic/postal keys plus optional coordinates and geocode provenance.

## High-risk actions
Payments/PIS, outbound communications, marketing eligibility, provider lookups, privileged DB writes and any restricted cadastral access remain separate execution gates. They must never be inferred from a successful preview/search/prepare response.
