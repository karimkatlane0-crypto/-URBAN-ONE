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

## URBAN ONE Hospitality Operations · Check-in / Check-out EU

**Inbound B2B campaign:** process mapping, controlled demo and individually priced projects for hotel, guesthouse and B&B check-in/out workflows. A written contract and verified customer-initiated Stripe payment are required before delivery; SaaS subscriptions, optional-service commissions and any API integration require independent consent and provider authorization.

- [Italiano](apps/web/hospitality-it.html) · [English](apps/web/hospitality-en.html) · [Deutsch](apps/web/hospitality-de.html) · [Français](apps/web/hospitality-fr.html) · [Español](apps/web/hospitality-es.html)
- [Pilot technical limits and conversion plan](docs/HOSPITALITY_CHECKIN_CHECKOUT_EU.md)
- [Offline check-in/out workflow simulation](packages/bnb/guest-journey-offline.mjs) — demonstration only, no property guest data or payments.

This source is public on GitHub after a reviewed merge. A live hosted campaign, authorized customer contracts, paid SaaS, provider connections, external press pickup and receipts are separately verifiable stages. The ChatGPT plugin cannot be used to sell digital services under the currently published plugin policies.

## URBAN ONE Travel · 24h preview concept

- [Early Access Travel preview source](apps/web/travel-preview.html): proposal for a voluntary, rights-verified 24-hour early information window, followed by general release.
- [Facebook, Instagram, social and media campaign copy](press/TRAVEL_24H_SOCIAL_POSTS_2026.md): publicly accessible drafts; **not posted to external accounts**, no ad spend and no claimed affiliate relationship.
- [Fail-closed 24-hour preview policy simulation](packages/marketing/preview-policy.mjs): UTC timing tests, not production authentication or access to airfares.
- No Booking.com booking/inventory permissions, airline partnership, offer feed or guest data implied; any paid B2B work requires written agreement and Stripe payment verification.

## URBAN ONE B&B EU Pilot — non-binding requests now open

**[Express interest in a paid, independently quoted B&B check-in/out workflow pilot](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/39)**. No payment, consent to marketing, signed agreement or property-data access arises from an issue. Please share only public-safe business needs; use private communication for contracting.

**[Booking.com / CJ affiliate application brief](docs/BOOKING_CJ_PUBLISHER_APPLICATION_2026.md)**: formal approval, authentic affiliate link, provider-reported completed bookings and independent payout required. No affiliate earnings verified.

## Booking.com: B&B provider connectivity vs affiliate travel revenue

Two **different** routes: approved PMS/channel manager for property-authorized Booking inventory and reservations; separately, Booking.com’s publisher affiliate programme or Managed Affiliate Demand API for eligible tracked traveler referrals. Neither membership nor commission is currently verified. Never treat a low-cost-flight post, a Booking.com click or a Stripe service checkout as a payable affiliate booking.

**[Booking affiliate vs Connectivity source-backed roadmap](docs/BOOKING_AFFILIATE_VS_CONNECTIVITY_2026.md)** · [Official Booking.com affiliate programme](https://w1.booking.com/affiliate-program/v2/index.it.html) · [Managed Affiliate Demand API prerequisites](https://developers.booking.com/demand/docs/getting-started/prerequisites).

## European hospitality press and trade-association kit

Original materials are published for voluntary editorial consideration by hotel federations, B&B associations, regional tourism networks, specialist blogs and press desks. **No external association, news outlet, Booking.com, Fabrick, InfoCert or OpenAI endorsement is implied or claimed.**

- **[Press kit and factual editorial status](press/README.md)**
- **[Europe-wide announcement in IT / EN / DE / FR / ES](press/ANNOUNCEMENT_EU_2026.md)**
- **[Original vector banners](apps/web/assets/urban-one-press-1200x628.svg)** · [web banner](apps/web/assets/urban-one-banner-728x90.svg)
- **[Association cooperation proposal](press/ASSOCIATION_PARTNER_BRIEF.md)** · [official research gateways](press/ASSOCIATION_GATEWAYS_2026.md)
- **[Static press-room source page](apps/web/press.html)** — hosted domain deployment and editorial pickup require separate verification.

The press kit invites qualified, voluntary reviews and inbound enquiries. It authorizes **no bulk outreach**, third-party site publishing, association membership list access, paid promotion, referral charge, financial service or commercial partnership.

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

## Pole Position Immobiliare · dossier e visite tra privati

[Apri il prototipo locale](apps/web/pole-position.html): dossier del proprietario, anteprima informativa di 24 ore, slot visite, richieste, conferma/arrivo/conclusione e messaggi locali. Incluso nella shell Web e nel bundle mobile. Tutti i dati sono dimostrativi e volatili; nessun messaggio reale, prenotazione condivisa o pagamento viene attivato. [Modello di business e passaggi verso il servizio live](docs/POLE_POSITION_IMMOBILIARE.md). Metodi e configurazioni di pagamento esistenti invariati.


### Link Web Pole Position (anteprima pubblicabile)

- **[Apri Pole Position sul sito URBAN ONE](https://karimkatlane0-crypto.github.io/-URBAN-ONE/apps/web/pole-position.html)** — il percorso e gli asset sono inclusi nel build GitHub Pages; la raggiungibilità della versione corrente deve risultare dal job `Verify published public pages` del workflow [publish-hospitality-site](.github/workflows/publish-hospitality-site.yml).
- **[Home pubblica URBAN ONE](https://karimkatlane0-crypto.github.io/-URBAN-ONE/)** — ingresso alla shell Web.
- Demo con dossier e calendario; **nessuna** prenotazione multiutente, messaggistica server, DBRELAY live o visita a pagamento reale. Tariffe solo simulative e `paymentStatus=NOT_PROCESSED`.
- Backend reale: da sviluppare con autorizzazione proprietario, RBAC, database privato e booking atomico, conversazioni autenticate, audit e verifica transazioni lato server. Non aggiungere endpoint DBRELAY non definito; la sua integrazione richiede contratto API/autenticazione/scopi dei dati espliciti.
- **Invariante:** nessuna variazione a Stripe, metodi di pagamento, IBAN, checkout, split, webhook o abbonamenti esistenti.


### Pole Position · private staging API (source-ready)

The `services/api/pole-*.mjs` modules implement a gated Node 22/SQLite staging-only backend for authorized dossier publishing, atomic visit holds/transitions, private visit messaging and optional Stripe TEST Checkout sessions for visit services or owner subscriptions. They do **not** activate production real estate bookings, live payments or third-party DBRELAY. No existing Stripe payment methods, products, links, bank beneficiaries, subscriptions or webhook configuration are changed. The local-first Web and mobile demo remains separate from the authenticated API. See [staging & release runbook](docs/POLE_POSITION_STAGING_RELEASE.md) and [full-stack acceptance gates](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/48).


### Pole Position · Immobili d'Europa, Web + Android + iOS

[Catalogo local-first degli immobili europei](apps/web/europe-immobili.html): ricerca per civico con suffissi nazionali conservativi, filtri **in vendita / in affitto / venduto / affittato / in trattativa**, e checklist **Task Force · Advisory Intelligence**. I record sono sintetici; gli stati dichiarati non provano vendita, locazione o titolarità. La UI è replicata nel bundle Capacitor e nella home. Backend di staging: `/api/pole/listing/update` con controllo del proprietario e audit, **non produzione**. [Specifiche e limiti](docs/EUROPE_REAL_ESTATE_CIVICI.md). Nessuna modifica alle configurazioni Stripe LIVE.
