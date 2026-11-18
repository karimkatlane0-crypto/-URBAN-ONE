# SEVA — WordPress canonical CMS + Spotify integration

**Status:** implementation specification / staging-first. This document does not certify a live integration or authorize production changes.

## Decision

- WordPress is the canonical CMS.
- Spotify is integrated in two distinct ways:
  1. Official Spotify Embed for user-facing tracks, albums, playlists, artists and podcasts.
  2. Spotify Web API for server-side public catalog metadata, subject to current Spotify developer access and terms.
- Existing WordPress content and plugin configuration must be preserved.
- No credentials, tokens, customer data, affiliate tracking URLs or private account details belong in this repository.

## Environment inventory (observed 18 November 2026)

| Environment | WordPress site | Platform | State / limitation |
|---|---|---|---|
| Production candidate | https://zerounocms.wordpress.com | Simple | Launched; site-scoped MCP support is limited |
| Staging | https://teenage-wombat.wpcomstaging.com | Atomic | Not launched; site-scoped MCP support available |

A connected WordPress data-source record currently names `cognitive-open-banking-zero-uno.karimkatlane0.chatgpt.site/wordpress-source`, which does not match either site above. Reconcile the connector identity and canonical hostname before writing content or configuring production automation.

Staging plugin inventory: 10 total, 6 active, 4 inactive, no updates reported at inspection. Active plugins included Akismet, Gravatar Enhanced, Gutenberg, Jetpack, Page Optimize and WooCommerce. Do not install/activate another plugin merely to embed Spotify: use the native WordPress Embed block where supported.

## Architecture

```text
SEVA web / mobile
  |-- Spotify Embed (official iframe; no API secret)
  |
  +--> SEVA server adapter
         |-- Spotify Web API (server-side token handling)
         |-- WordPress REST API (staging first)
         +-- audit / consent / rate-limit / fail-closed policy

WordPress staging --> smoke tests --> independent acceptance
                                      |
                                      +--> separate production approval
```

## Spotify Embed

- Accept only canonical Spotify content URLs / URIs from an allowlisted content type.
- Render the official Spotify embed iframe or native WordPress Embed block.
- Lazy-load below-the-fold embeds and show a descriptive accessible fallback link.
- Do not scrape audio, download, proxy, re-host, or modify Spotify media.
- Do not require Spotify API credentials for a simple embed.
- Apply the site's privacy/consent rules to third-party iframe loading.

Official documentation:
- https://developer.spotify.com/documentation/embeds
- https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed
- https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api

## Spotify Web API

### Initial scope

Start with public catalog metadata only. Use the Client Credentials flow on the server for endpoints that do not access user-specific information. Keep client secret and access token in server-side secret storage; never in a browser bundle, WordPress post content, Git history or logs.

Do not request user-library, profile, email, playback-control or other user scopes for the initial catalog feature.

If a later feature genuinely requires user-specific resources, design it as a separate opt-in feature using Authorization Code with PKCE for public clients (browser/mobile) or the appropriate confidential-client authorization flow. Document each required scope and purpose before requesting consent.

Operational controls:
- cache tokens only until expiry, with a safety margin;
- never log bearer tokens or client secrets;
- handle 401/403/429, expiry and provider unavailability without failing open;
- bounded retries with backoff for rate limiting;
- validate and normalize Spotify IDs/URIs before calling the API;
- provide a no-API fallback to official Embed links.

Official documentation:
- https://developer.spotify.com/documentation/web-api
- https://developer.spotify.com/documentation/web-api/concepts/authorization
- https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow

Current account/app eligibility and developer terms must be checked in Spotify's dashboard before enabling API calls. A code path or mock test is not proof of Spotify approval.

## WordPress integration

- Build against the staging site first.
- Prefer a dedicated integration identity with only the capabilities required for the intended operation.
- Use a revocable application password or OAuth credential only after confirming the target site supports the selected authentication method; keep it server-side.
- Separate read-only content discovery from content create/update operations.
- Require explicit authorization for writes; start with draft-only content and preview.
- Sanitize HTML, validate embed URLs, use idempotency for retries and record a minimal audit event.
- Do not publish to production, change DNS, alter users/roles, activate plugins or modify payment settings in this workstream.

Official references:
- https://developer.wordpress.com/docs/api/getting-started/
- https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/
- https://developer.wordpress.org/rest-api/reference/application-passwords/

## Amazon Associates guardrails

Existing welcome evidence identifies the Associates tag `seva0a9-21`; that is not evidence of a qualifying sale, commission or payout.

- Use only provider-issued affiliate links and permitted placements.
- Put a clear affiliate disclosure adjacent to affiliate content.
- Distinguish click, qualifying order, approved commission and paid settlement.
- Do not create fake test orders or claim revenue from link clicks.
- Keep private tracking URLs out of public issues and source.

## Gmail and HubSpot guardrails

- Gmail: read-only minimum access for the first phase; no send, delete or modify permission.
- HubSpot: minimum object/property scopes, explicit purpose and consent, idempotent sync, audit trail.
- No bulk outreach, campaign send or automatic customer messaging in this workstream.

## Test and acceptance matrix

| Area | Required tests |
|---|---|
| Embed | valid/invalid URI, allowed content types, responsive sizing, lazy-load, accessibility fallback, consent behavior |
| Spotify API | token acquisition mocked, token expiry, 401, 403, 429, timeout, malformed response, secret redaction |
| WordPress | staging read, draft-only write, permission denial, sanitization, invalid embed rejection, rollback |
| Privacy | no secrets in bundle/logs, no unnecessary personal data, consent and purpose checks |
| Reliability | bounded retries, idempotency, provider outage fallback, audit event integrity |
| Release | unit/contract tests, `npm run verify`, `npm run security:secrets`, evidence capture, staging smoke test |

## Release gates

1. Reconcile canonical WordPress hostname and connected data-source identity.
2. Confirm staging site and access method.
3. Build adapters behind disabled-by-default feature flags.
4. Pass unit, contract, secret-scan and policy tests.
5. Deploy to staging only.
6. Run independent staging acceptance and attach timestamped evidence.
7. Obtain a separate production approval before any production credentials, content or deployment are changed.

**Current release decision: NO-GO for production.** No production deployment or live provider credential changes are authorized by this specification.
