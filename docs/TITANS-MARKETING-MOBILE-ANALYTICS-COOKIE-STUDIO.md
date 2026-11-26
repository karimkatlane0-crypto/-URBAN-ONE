# TITANS Marketing Data, Mobile & Analytics/Cookie Studio

**Delivery:** BUILD candidate, draft PR only.  
**Scope:** responsive Studio UI, on-device click-to-call configuration, consent state primitives and automated unit tests.  
**Release boundary:** no production deployment, third-party analytics activation, CRM write, contact import, marketing send or external account connection.

## Included

- apps/web/titans-marketing-studio.html: mobile-first Studio dashboard and free/open-source provider shortlist.
- apps/web/titans-marketing-studio.js: versioned consent record, fail-closed category checks, analytics event allowlist and telephone target validation.
- tests/titans-marketing-studio.test.mjs: consent, privacy filtering and telephone target tests.

## Free/low-cost provider shortlist

| Provider | Intended use | Cost boundary |
|---|---|---|
| Matomo On-Premise | First-party web analytics and data ownership | Software free/open source; hosting and operations are not free |
| Google Analytics 4 | Acquisition, events and conversions | Standard version free; optional tracking requires consent handling |
| Microsoft Clarity | Heatmaps and session replay | Free service; treat as optional tracking |
| Google Search Console | Organic search and indexing | Free |
| Umami | Lightweight privacy-focused analytics | Open source self-host; hosting/operations excluded |
| CookieYes / Cookiebot | Consent management platform | Free tiers have feature/domain/page limits; verify current vendor terms |

Free-plan eligibility, limits and terms must be checked again at activation; this document does not guarantee a provider's future pricing.

## Privacy-by-default behaviour

- No third-party tracking scripts are included or loaded by this prototype.
- Analytics and marketing consent default to false.
- Rejecting optional categories keeps them disabled.
- Consent is versioned and stored locally so the choice can be remembered.
- Analytics event names and properties use an allowlist; direct identifiers such as email, phone and user IDs are discarded.
- Query strings are removed from page paths before analytics events are constructed.
- A future adapter must load each optional provider only after the applicable purpose-specific consent and must support withdrawal.
- The Studio is not a legal compliance certification. Production requires an inventory of actual cookies/tags, privacy and cookie notices, retention and DPA review, consent evidence, and jurisdiction-specific legal review.

Italian Garante guidance permits certain strictly aggregated first-party analytics only when the stated conditions are met. Third-party analytics and profiling/marketing tracking must not be treated as automatically exempt. The deployed configuration must be assessed against the actual provider, identifiers, purposes and data flows.

## Mobile phone behaviour

- Responsive/touch-friendly UI.
- Admin can configure a business phone number in E.164-style format.
- Number is stored only in the current browser's local storage.
- The call action uses the native tel: handler after an explicit user tap.
- No automatic call, SMS, WhatsApp, address-book access or server-side phone collection is implemented.
- No real business phone number is hardcoded.

## Not included / blocked

- No live GA4, Clarity, Matomo or Umami account connection.
- No consent-management vendor account connection or automatic cookie scan.
- No CRM integration, lead collection, marketing automation or ad platform sync.
- No server-side event pipeline, attribution model, identity resolution or tenant data store.
- No proof of accessibility, mobile device E2E, legal approval, production cookie scan or deployment.

## Verification

Run the targeted test file:

    node --test tests/titans-marketing-studio.test.mjs

Then run the repository gates:

    npm test
    npm run security:secrets
    npm run verify

A passing unit test suite does not prove provider connectivity, legal compliance or production readiness.

## Primary sources

- Italian Garante cookie FAQ: https://www.garanteprivacy.it/faq/Cookie
- Italian Garante cookie guidelines: https://www.garanteprivacy.it/documents/10160/0/LINEE+GUIDA+COOKIE+E+ALTRI+STRUMENTI+DI+TRACCIAMENTO+-+SCHEDA+DI+SINTESI.pdf
- EDPB cookie FAQ: https://www.edpb.europa.eu/contact/frequently-asked-questions_en
- Matomo free software: https://matomo.org/free-software/
- Google Analytics support: https://support.google.com/analytics/answer/11828307
- CookieYes setup: https://www.cookieyes.com/documentation/cookieyes-plugin-setup/
- Cookiebot free plan limits: https://support.cookiebot.com/hc/en-us/articles/360003807613-How-can-I-get-a-Free-subscription

## Governance

BUILD → VERIFY → AUTHORIZE → RELEASE → SCALE.

This branch is not merged. Production publication and activation of third-party providers remain blocked until tests, independent review, exact domain configuration, consent verification and explicit release authorization are complete.
