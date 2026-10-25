# URBAN ONE / KKUBERA discovery implementation

Implemented a linked `/discovery.html` page and POST `/api/public/discovery/search` in the Node runtime. Three explicit journeys: tourism, rental, purchase. Guided structured search, missing-detail questions, ascending total-cost ordering, source/date/reason, comparison and provider-hosted actions. No LLM connection or natural-language interpretation is claimed. No demo inventory is shipped. Existing payment flows are unchanged.

## Server-side source contract

An operator can configure `DISCOVERY_CATALOG_FILE` to a private JSON file obtained from authorized source adapters. Do not commit this file. It contains `allowedHosts`, `records`, and optional `advertisers`. This is an administrator-maintained adapter boundary, not a self-certifying API integration. Do not populate authorization or terms flags without dated evidence. The browser cannot supply catalog, allowlist or approval state.

A record includes `mode` (`tourism`, `rent`, `buy`), `city`, `title`, `sourceName`, `sourceUrl`, `observedAt`, `publicationAuthorized`, `authorizationObservedAt`, and `price` (`amount`, `mandatoryFees`, `currency: EUR`, `basis: stay/month/purchase`). Amounts and fees share the stated basis; deposits, utilities, taxes or other costs not covered must be explicitly confirmed at the source. Both timestamps must be within 24 hours, a conservative internal policy, not a CJ requirement. Do not refresh timestamps without new observations. Only HTTPS URLs on the operator-maintained allowlist are exposed; credentials in URLs are rejected.

Tourism quotes must additionally match exact `arrival`, `departure` and `guests`. They identify `advertiser` and `linkKey`. An advertiser entry contains evidence for the seven existing readiness gates, provider-issued `links` keyed by `linkKey`, and an affiliate `disclosure`. All gates must pass before the action link appears. Source citations are distinct from affiliate actions. Non-affiliate request/visit actions use `inquiryUrl` from the authorized real-estate record. Availability is reconfirmed at the source; an inquiry is not a reserved appointment.

No catalog means `SOURCE_REQUIRED`. A missing/broken configured source returns 503 without sensitive details. Unmatched, stale, future-dated or unauthorized records are excluded. Responses project only public fields; no raw evidence or account data is returned. The frontend uses text nodes for source content.

## Remaining external gates

- Connect an authorized inventory feed or owner-approved property catalog, with current evidence and permitted public fields.
- Confirm actual CJ advertiser status in the authenticated account. The supplied 25 October manual report says Booking.com Italy is pending; this implementation is not a fresh account verification.
- Review accepted programme terms and obtain provider-issued links after approval. No API rights are inferred.
- Add a separately configured model for natural-language intent if required; current filtering is deterministic.
- Deploy the matching Node runtime and verify provider-permitted attribution, a qualifying completed service, commission validation and settlement independently.

The ChatGPT-hosted Site source preparation failed (`Unable to prepare the Site`), so no change to that deployment is claimed. This repository change is reviewable separately and does not establish a completed commercial journey, booking, commission or payout.
