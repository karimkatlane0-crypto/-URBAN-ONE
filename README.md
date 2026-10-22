# URBAN ONE UNIVERSAL — v7.0.0 FINAL

Greenfield universal control plane for governed AI/data workflows, local-first Web/Android/iOS shells, consent, provenance, private contacts, real-estate search and public European spatial-data discovery.

## Final v7 scope

- local-first Web and Capacitor mobile shell;
- fail-closed AI/provider and relay configuration;
- RBAC, purpose-bound consent, sanitization and provenance receipts;
- private owner-scoped Skebby/Data contact normalization with name, surname, phone, email, zone and certificate/document fingerprinting (SHA-256 only; no raw ID in public source);
- exact civic-number real-estate matching (`12A`, `12 A`, `12-A`, `12/A` → `12/A`) with map-ready address queries;
- EU INSPIRE / data.europa.eu public geospatial discovery covering all 34 official INSPIRE themes;
- real-estate INSPIRE preset for addresses, cadastral parcels, buildings, land use, transport, orthoimagery, elevation, restrictions, natural risks, soil, statistical units and utility/governmental services;
- public spatial-data privacy guardrail: no owner-name, fiscal/tax identifier or identity-document enrichment from cadastral geometry.

## EU INSPIRE / public spatial data

URBAN ONE uses the European Data Portal metadata APIs and INSPIRE catalogues as a public discovery layer. It does not scrape protected national cadastral systems or bypass authentication, licensing or payment controls.

INSPIRE discovery/view availability does not mean every distribution is unrestricted or free for reuse. Provider-specific licences, attribution, access restrictions and any lawful charges remain authoritative.

See [`docs/EU_INSPIRE.md`](docs/EU_INSPIRE.md).

## API highlights

- `GET /health`
- `GET /api/universal/status`
- `POST /api/universal/prepare`
- `POST /api/contacts/import-preview` — private, scope `contacts:read`
- `POST /api/properties/search` — private, scope `properties:read`
- `GET /api/public/eu-spatial/policy` — public policy metadata
- `POST /api/public/eu-spatial/search-plan` — builds a fixed data.europa.eu geospatial search plan

See [`docs/API.md`](docs/API.md).

## Security defaults

- deny by default;
- no secrets in client bundles;
- provider adapters disabled until explicitly configured;
- high-risk actions remain separate execution gates;
- PII sanitized before model-provider handoff;
- public cadastral/spatial data is not treated as proof of legal ownership;
- private identity/contact data is not merged into the public INSPIRE path by default.

## Platforms

- Web/PWA: local-first shell
- Android: Capacitor local bundle; CI produces an installable debug APK for testing
- iOS: Capacitor local bundle; production signing/TestFlight requires Apple signing/provisioning

## Release gates

SOURCE → POLICY → CONSENT → SANITIZE → PROVENANCE → TEST → WEB/API → MOBILE → ANDROID BUILD → EVIDENCE → DEVICE TEST → PROVIDER CERTIFICATION → PRODUCTION SIGNING

Source, tests, Web/API, local-first mobile and public EU spatial gateway are verified by CI. Android artifacts are verified per workflow run. Production Android signing, iOS signing, live-provider certification and real-device acceptance remain separate external gates.

## Regulated / professional-use notice

URBAN ONE is not presented as a bank, payment institution, AIS/PIS provider, investment firm, accounting/tax practice, certified valuation practice or licensed real-estate brokerage. Regulated financial, tax, legal, brokerage, valuation and Open Banking functions require the appropriate providers, professionals, contracts, licences, security review and jurisdiction-specific compliance before production use.

## Servizi URBAN ONE per clienti B2B

Sono aperte **richieste di demo, analisi dei processi, incarichi software e proposte di progetti pilota**, in particolare per imprese, hospitality B&B, property management, dati e governance AI. Ogni servizio retribuito prevede **ambito, prezzo in EUR e contratto concordati prima dell'incasso Stripe**; non sono autorizzati rinnovi, commissioni o accessi a provider per il solo fatto di aver richiesto informazioni. Il progetto non dichiara partnership o sponsorizzazioni ufficiali con OpenAI/ChatGPT.

**[Consulta l'offerta commerciale e richiedi un preventivo](docs/URBAN_ONE_B2B_SERVICE_OFFERS.md)** · **[Apri richiesta commerciale](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/new)** (prefisso `[COMMERCIAL]`, senza dati riservati).

## Europe · B2B service enquiries (IT / EN / DE / FR / ES)

URBAN ONE offers **scoped software/process engagements and consent-aware pilots** for European businesses. All pricing is subject to a signed offer; no live Booking.com, Fabrick, InfoCert or other regulated integration is claimed by marketing content. No marketing emails or paid campaigns are initiated by the repository.

**Five-language landing-page source:** [Italiano](apps/web/europe-it.html) · [English](apps/web/europe-en.html) · [Deutsch](apps/web/europe-de.html) · [Français](apps/web/europe-fr.html) · [Español](apps/web/europe-es.html).

**[EU27 go-to-market, sales and compliance gates](docs/EU_MARKET_LAUNCH_2026.md)**. These are static source pages: website deployment and live reachability are separate verification steps. Business inquiries can use [a non-confidential GitHub Issue](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/new) or [email](mailto:karimkatlane0@gmail.com?subject=URBAN%20ONE%20EU%20enquiry).

## Enterprise licensing opportunity

URBAN ONE Enterprise is available for **qualified, non-binding international licence discussions** at a seller-selected **EUR 1,000,000 negotiable asking price**. This is not a certified market valuation, a completed sale or an online payment request. Any licence is conditional on verified intellectual-property rights, technical and regulatory diligence, agreed scope and a signed contract.

Read the [URBAN ONE Enterprise Global Licensing Opportunity](docs/URBAN_ONE_ENTERPRISE_GLOBAL_OFFER_EUR_1M.md). Prospective buyers may use public GitHub Issues for **non-confidential initial interest** and request a private channel before sharing business, financial or proprietary details.

## Collaboration

The repository supports technical review and European collaboration across AI, Open Banking, DevSecOps, data platforms, real estate/proptech, mobility/travel and enterprise integration. Do not post secrets, credentials, customer financial data or unnecessary personal data in public issues.

See [`PARTNERSHIPS.md`](PARTNERSHIPS.md) where available.
