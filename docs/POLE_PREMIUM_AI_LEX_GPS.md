# Pole Position Intelligence LAB — ML, LEX, GPS Walk, Premium Plugins

**2026-10-23 | source/lab release | NOT production, NOT legal advice**

## Implemented, verifiable

- Pure ML module `packages/real-estate/premium-taskforce.mjs`: a small supervised linear learner (gradient descent) trained only on synthetic labeled records, no external calls or personal-data collection. The resulting score describes demo similarity, **not** a certified market valuation, title assessment, credit score, legal classification or outcome probability. Providers branded OpenAI, Google DeepMind or third parties are **not connected** by this change; no autonomous learning.
- LEX workflow: `listing_sale`, `rental`, `succession`, `judicial_auction` offer preparatory checklists with human approval, plus non-signable sale/rental **contract outlines**. No legally binding contract, bid, registration, payment, conveyance, powers of attorney or tax return is generated or submitted. Jurisdiction-specific documents require locally qualified professionals, competent authorities and user validation.
- GPS helper `packages/geo/pole-walk.mjs` implements haversine and eligibility gate: foreground consent, independently verified premium entitlement, authorized publication, verified geo coordinates, opt-in, state active, alert cooldown. Real products must use backend-verified entitlements and verified source identifiers. No automatic notification to a civic with only an address guess.
- UI `apps/web/pole-premium.html`/`.js`, identical in `apps/mobile/www/`: no backend URL, token, API keys, real private contacts or charges embedded. ML and document demos execute offline. **GPS only starts on user click with checkbox, secure context and foreground visibility**, stops when page hidden or on demand; no location sent or stored, no background service/push.
- Safe public metadata `GET /api/public/pole/intelligence` reports model registry, workflows and all non-production gates; does not execute providers or grant purchases.
- Web and Capacitor mobile navigation links into the new module. Pages packaging allows the public `pole-premium.js` file only; no repository files, database or user secrets published. iOS workflow checks Web/mobile parity. Android rebuild triggered by changed mobile assets.

## Business model and platform channels

Suggested **commercial hypotheses**, not approved rates/products:

| Customer | Capability | Billing decision needed |
| --- | --- | --- |
| Visitor | On-site real-estate viewing by an authorized provider | Real-world service contract, payer/recipient verification and store-policy review |
| Private owner | Listing management/priority tools | Determine whether payment unlocks digital in-app functionality; Apple IAP / Google Play Billing policy & exceptions |
| Business partner | Software integration, geodata and workflow consulting | Written B2B agreement, tax/VAT, licensed datasets, support |
| Premium user | GPS walking alerts for opt-in listed civics | Store entitlement and authorized geocoded inventory; no push until explicit legal review |

**Freeze:** existing Stripe merchant accounts, methods, checkout links, products, subscription IDs, payout bank accounts and beneficiary mappings **untouched**. No price has been set and no LIVE charge performed for this module. The terms "LAS", "GMAS", "ML", "MML", "LLMM" are product concept labels and **not** evidence of live providers or transferable licenses.

Apple's App Review Guideline **3.1.3(d)** specifically gives real-estate tours as a person-to-person service payment example, separate from digital functionality IAP under **3.1.1**; national storefront/external-link rules still matter. Google Play's payments policy covers digital subscriptions subject to published exceptions/eligibility. Do not enable links that circumvent an app store without verifying the applicable marketplace and program eligibility.

## Legal caveats by country

A jurisdiction is required before preparing any checklist. In cross-border inheritance, European Commission guidance explains the roles of the **EU Succession Regulation 650/2012** and the **European Certificate of Succession**; Denmark and Ireland do **not** participate in that Regulation. Title transfer, property, wills, taxes, contract form and judicial auction procedures vary by country. No scraped court portal, unverified "discount auction" feed or impersonation of a judicial officer is permitted.

## ML governance / retraining gates

Do **not** continuously train on conversations, uploaded inheritance documents, citizen location or property owner/visitor personal data. A possible later pipeline requires explicit dataset licenses and controller purpose, permission or legal basis, model/dataset versioning, pseudonymization, train/validation/test splits, fairness/error analysis by country/language, adverse-impact checks, professional review and ability to disable/retrain/revert. A trained synthetic score is not deep learning; production deep learning and LLMs remain `NOT_CONNECTED` until keys, privacy terms, costs, monitoring, usage rights and evaluations are independently verified. Never claim a Google DeepMind partnership.

## GPS & consumer safety

Only foreground geolocation in the browser, stopped when not visible. No `ACCESS_BACKGROUND_LOCATION` Android permission, iOS background tracking capability, periodic polling, geofence notification service or retention of coordinates. Actual paid nearby-civic push alerts need platform notifications permission, verified ad data, safe cadence, user-selected neighborhoods, demonstrable entitlements and prior user consent. Ensure no stalking, private owner address exposure, unsolicited advertising or inferred occupancy from location data.

## Roadmap / release blockers

1. Licensed European property/civic datasets or owner-authorized property publication; region-by-region coverage proof, GDPR privacy and removal process.
2. Authenticated secure Web/Android/iOS backend, encrypted multi-tenant production database, token lifecycle, owner delegation and message moderation.
3. Human legal professionals and country-specific, editable templates; locally approved tax, agency, succession and auction protocols; user review before any contract.
4. Model/provider adapters, evaluation against opt-in licensed datasets, human-in-the-loop decisions; provider licenses before LLM execution.
5. Real premium entitlement gateway with receipts, transaction reconciliation, refund/cancel handling, Web vs Apple IAP vs Google Play Billing routing; no changes to existing Stripe config.
6. Consent/foreground GPS, verified geocoding, double opt-in for alerts, device/OS notification policy review, consumer safety and privacy documentation.
7. CI, security test, Android APK/AAB, iOS Capacitor artifact, production signing, real-device tests and explicit App/Play Store confirmations.

## Official references

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play payments: https://support.google.com/googleplay/android-developer/answer/9858738?hl=it
- Google Play location/background access: https://support.google.com/googleplay/android-developer/answer/9799150?hl=it
- EU succession and wills: https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/civil-justice/family-law/successions-and-wills_en
- INSPIRE: https://knowledge-base.inspire.ec.europa.eu/

This is a **prototype/source integration**. ML training is synthetic and local; GIS global sourcing, agent orchestration, external API providers, paid plugins, Stripe Billing and judicial/legal operations are not activated.
