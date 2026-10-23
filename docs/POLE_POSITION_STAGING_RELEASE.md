# Pole Position · Staging backend, checkout e release gates

23 ottobre 2026 — implementazione **staging**, non servizio mondiale di produzione.

## Moduli effettivamente presenti

- Web e Capacitor mobile: \`apps/*/pole-position.html\` e \`pole-position.js\` (demo locale).
- API: \`services/api/pole-http.mjs\`, \`pole-store.mjs\`, \`pole-checkout.mjs\`, montati in \`server.mjs\`.
- Database: \`node:sqlite\` SQLite privato su volume persistente. Transazioni \`BEGIN IMMEDIATE\` su creazione slot/prenotazione; un solo \`visit_id\` occupa ogni slot. Audit delle azioni.
- Attori owner/visitor con token Bearer **SHA-256** configurati esclusivamente sul server e ruolo/autorità owner pre-verificata dall'operatore per test; **non** è un sistema IAM di produzione.
- Messaggi persistenti associati alle sole visite autorizzate, non WhatsApp e non notifiche push.
- Stripe: **test mode only**, \`POST /v1/checkout/sessions\`, per prezzi Stripe già creati e approvati in TEST; nessuna lista di metodi di pagamento modificata, nessun nuovo beneficiario, payout, Stripe Connect o Stripe LIVE API call.
- Link WhatsApp: click-to-share manuale, mai messaggistica bulk automatizzata né iscrizione ad alcun gruppo.

## Avvio in staging isolato

Node 22+; il modulo nativo \`node:sqlite\` può essere segnalato sperimentale sulla versione 22. Non usare GitHub Pages per dati privati. Montare un **volume privato con backup**, HTTPS, firewall e limiti di accesso:

\`\`\`sh
# Valori nel secret manager, NON nel repository e NON nel bundle mobile.
POLE_STAGING_ENABLED=true
POLE_DB_PATH=/var/lib/urban-one/pole.sqlite
POLE_STAGING_ACTORS_JSON='[{"tokenHash":"<sha256-di-token-generato-sul-server>","id":"owner_demo","role":"owner","ownerVerified":true},{"tokenHash":"<sha256-di-altro-token>","id":"visitor_demo","role":"visitor"}]'
# Per generare l'hash di un token casuale segreto >= 32 caratteri:
node -e "const c=require('node:crypto');const t=c.randomBytes(32).toString('base64url');console.log('Secret (conservare solo nel vault):',t);console.log('SHA-256:',c.createHash('sha256').update(t).digest('hex'))"
\`\`\`

Non inserire identificativi, documenti reali, indirizzi sensibili o dati degli utenti fino a completamento GDPR/DPA/retention e protezione del database. Le credenziali di staging devono essere revocabili, non distribuite pubblicamente e non usate in produzione.

## API (tutte le mutazioni POST JSON autenticato)

- \`GET /api/pole/status\` — stato pubblico, non prova di disponibilità del backend.
- \`POST /api/pole/dossier/create\` — owner con autorità pre-verificata, \`{title,description,purpose,publishedAt}\`.
- \`POST /api/pole/dossier/read\` — \`{dossierId}\`; documento pubblicabile da publishedAt; finestra 24h informativa.
- \`POST /api/pole/slot/create\` — owner, \`{dossierId,start,minutes,feeCents,terms}\`; tariffa **dimostrativa**.
- \`POST /api/pole/visit/request\` — visitor, \`{slotId}\`; un'assegnazione attiva per slot.
- \`POST /api/pole/visit/read\` — \`{visitId}\`; owner o visitor coinvolto.
- \`POST /api/pole/visit/transition\` — \`{visitId,nextState}\`, stati REQUESTED → CONFIRMED → CHECKED_IN → COMPLETED, CANCELLED prima del check-in. Solo owner conferma/segna arrivo/conclusione.
- \`POST /api/pole/message/send\` — \`{visitId,message}\`; solo parti autorizzate.
- \`POST /api/pole/message/list\` — \`{visitId}\`; massimo 100 messaggi.
- \`POST /api/pole/billing/checkout-test\` — \`{kind:"visit"|"subscription",visitId?,termsAccepted:true}\`; solo quando il gate test è abilitato sul server, mai in produzione.

Tutti gli endpoint privati richiedono \`Authorization: Bearer <token_staging>\`. Non esiste cookie di sessione, login social o connessione automatica all'account ChatGPT. I dati della demo Web non si sincronizzano ancora automaticamente con questi endpoint, per non esporre i token fittizi in una pagina pubblica.

## Stripe payment freeze

Non toccare account, iban/beneficiari, metodi abilitati, Payment Link, prodotti, price IDs già LIVE, checkout attuali, webhook esistenti, abbonamenti o split.

Solo sandbox con tutte queste impostazioni server: \`POLE_TEST_CHECKOUT_ENABLED=true\`, \`POLE_STRIPE_TEST_SECRET_KEY=sk_test_...\`, \`POLE_STRIPE_TEST_VISIT_PRICE_ID=price_...\`, \`POLE_STRIPE_TEST_SUBSCRIPTION_PRICE_ID=price_...\`, \`POLE_CHECKOUT_SUCCESS_URL=https://...\`, \`POLE_CHECKOUT_CANCEL_URL=https://...\`. Le due URL devono essere HTTPS e sulla stessa origine. La risposta contiene solo un Checkout Session \`cs_test_\` ospitato da Stripe. **Non** usa il prezzo arbitrario inserito dal visitatore, ma un Price Stripe TEST definito dall'operatore. La tariffa proposta sullo slot non equivale al prezzo effettivo di Checkout.

Nessuna sessione Checkout attesta pagamento riuscito; nessun webhook Stripe viene usato per abilitare automaticamente visite o abbonamenti. Lo stato resta \`NOT_VERIFIED\`/\`NOT_PROCESSED\` fino a implementare ledger privato, eventi firmati e reconciliati, idempotency, rimborsi, contratti e diritti di accesso.

### Distinzione giuridica e store

La visita di un immobile è distinta dall'intermediazione, da un deposito/caparra e dall'incasso del prezzo dell'immobile. Stabilire chi eroga e chi incassa la prestazione prima di attivare pagamenti reali, soprattutto per terzi. Un abbonamento per le funzionalità digitali nell'app può essere soggetto alle regole di Google Play Billing e Apple In-App Purchase; non inserire automaticamente link Stripe per l'abbonamento digitale nei binari store. Le visite personali in presenza possono avere regole diverse.

Riferimenti ufficiali:
- https://docs.stripe.com/api/checkout/sessions/create
- https://developer.apple.com/app-store/review/guidelines/
- https://support.google.com/googleplay/android-developer/answer/9858738?hl=it

## DBRELAY (gate esplicitamente non verificato)

Il nome **DBRELAY** non identifica oggi un servizio reale o un endpoint autenticato del repository. Non attribuire a SQLite il ruolo di DBRELAY esterno. Prima di qualunque adapter remoto servono documenti di proprietà del servizio, schema DB, autenticazione, isolamento multi-tenant, backup/ripristino, DPA/retention, timeout, error budgets e test E2E. Mai instradare dati privati attraverso il repository pubblico, Web Pages o un endpoint arbitrario. Il servizio staging è limitato a una singola istanza con volume persistente.

## Go-live gates non superati

- [ ] Identità reale e verifica proprietario/delegato; sessioni sicure, autorizzazioni e recupero account
- [ ] DB privato di produzione, backup/restore, migrazioni, test multiistanza, gestione privacy GDPR e concorrenza
- [ ] API HTTPS pubblicata su backend dedicato, autenticazione mobile/Web, UI che confermi solo transazioni reali
- [ ] Messaggi e notifiche con consenso; moderazione, anti-spam, privacy e audit
- [ ] Prezzi e contratti approvati per visita e abbonamento, fiscalità e rimborsi, merchant/beneficiario corretti
- [ ] Stripe LIVE test E2E + webhook autenticato + ledger, dispute/refund, prova merceologica e entitlement
- [ ] Billing in-app policy iOS/Android accertata per le rispettive offerte digitali
- [ ] Test browser visivi, accessibilità, dispositivi reali, AAB firmato, TestFlight e verifiche store
- [ ] WhatsApp Business consent and opt-in, template e provider effettivamente autorizzato per eventuali messaggi aziendali; niente invio su gruppi senza consenso

**Release flags:** \`WEB_DEMO_PUBLISHED\`; \`STAGING_API_SOURCE_READY\`; \`STRIPE_TEST_ADAPTER_SOURCE_READY\`; \`DBRELAY_EXTERNAL_UNVERIFIED\`; \`LIVE_BOOKINGS_NOT_ENABLED\`; \`LIVE_PAYMENT_NOT_ENABLED\`; \`PRODUCTION_ANDROID_IOS_NOT_VERIFIED\`.
