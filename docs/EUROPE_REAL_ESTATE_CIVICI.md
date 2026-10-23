# URBAN ONE · Civici europei e stati degli immobili (Web, Android, iOS)

Data: 23 ottobre 2026 — funzionalità local-first e API di staging; **non** è una banca dati immobiliare europea operativa né una pubblicazione sugli store.

## Interfaccia e riduzione delle duplicazioni
- Un'unica schermata `europe-immobili.html` per cercare/provare immobili con campi Paese ISO, città, via, numero civico, CAP e stato.
- Gli stessi byte HTML sono presenti in `apps/web/` e `apps/mobile/www/`; ogni build Capacitor usa la copia mobile locale, senza server URL privato. La home e la demo visite Pole Position rimandano a questa schermata, senza creare un secondo calendario o sistema di pagamento.
- Ricerca su **record sintetici o forniti dall'utente**, non su un inventario europeo pubblicato; i dati della pagina si cancellano al refresh.
- Ricerca per civico esatto: `12A`, `12 A`, `12-A`, `12/A` sono un esempio di normalizzazione semplice. Per evitare falsi match non si unificano `8 bis`, `12/1`, `12-14`, `12 Stg 2`. Prima di produzione, validare ogni Paese con dataset e regole specifici. CAP opzionale, codici Paese a due lettere.
- La selezione comprende Paesi europei e territori indicativi; non certifica disponibilità di geocoding, stradari completi, catasti, annunci né che tutti i civici siano censiti.
- Stati: `sale` (in vendita), `rent` (in affitto), `reserved` (in trattativa), `sold` (venduto), `rented` (affittato), `unavailable`, `off_market`. Venduto/affittato sono dichiarazioni **non verificate**, non prove notarili o contratti.

## Backend Pole Position · staging
- `listing_profiles`: tabella aggiuntiva e compatibile con la base precedente. Registra stato, indirizzo normalizzato, fonte `OWNER_DECLARED_UNVERIFIED`, timestamp.
- `POST /api/pole/listing/update`: proprietario pre-verificato nello staging, `{dossierId, status?, address?, ownerDeclaration?}`. In caso di `sold` o `rented` impone `ownerDeclaration:true`; non certifica la transazione.
- `POST /api/pole/dossier/read`: restituisce indirizzo e `listingStatus` insieme alla fonte. Visite nuove e slot bloccati per annunci chiusi, ritirati o indisponibili.
- Le transizioni valide dipendono da `Vendita` o `Locazione`. Un immobile dichiarato venduto/affittato non si riapre silenziosamente nel backend; serve procedura amministrativa e prova separata.
- Autenticazione reale, documenti, procedure notarili, proprietà legale e disponibilità effettiva **non verificate**. Non usare questo staging per dati personali di clienti reali.

## Advisory Intelligence
La sezione “Task Force · Advisory Intelligence” contiene checklist di preparazione per geodati, titolo/contratti, valutazione, gestione visite, fiscalità e incassi. Non equivale all'ingaggio di EY, revisori, notai, mediatori, avvocati o agenti AI con esecuzione autonoma. Le valutazioni e le operazioni professionali richiedono verifiche e incarichi effettivi.

## Gate commerciali e release
Nessuna variazione a Stripe LIVE, IBAN, beneficiari, checkout, abbonamenti o metodi di pagamento. Nessuna visita a pagamento reale, conclusione di compravendita o incasso da questa UI.
- **Web:** GitHub Pages presenta soltanto il catalogo sintetico. Il workflow controlla URL, testo di disclaimer e collegamenti relativi.
- **Android:** Capacitor local-first, SDK e debug/AAB build verificabili con workflow dedicato; firma production, device E2E e Play Console sono gate separati.
- **iOS:** workflow automatico su main per test e generazione fonte nativa Xcode; firma, provisioning, TestFlight, dispositivo e App Store restano da verificare.
- **Copertura civici europea:** per ogni Paese provider ufficiale, accesso autorizzato, licenza, attribuzione, qualità, geocoding, matching e aggiornamento devono essere verificati separatamente. Non presumere che INSPIRE contenga tutti i proprietari o la disponibilità di tutti gli immobili.
- **Prima del go-live:** autenticazione reale, privacy GDPR, moderazione dei messaggi, autorizzazioni professionali e documentali, marketplace/business model, test di sicurezza, database multi-tenant, identità e audit.

## Riferimenti
- INSPIRE Addresses della Commissione europea: https://knowledge-base.inspire.ec.europa.eu/addresses_en
- Direttiva INSPIRE 2007/2/CE: https://eur-lex.europa.eu/eli/dir/2007/2/oj
- Staging precedente: [POLE_POSITION_STAGING_RELEASE.md](POLE_POSITION_STAGING_RELEASE.md).
