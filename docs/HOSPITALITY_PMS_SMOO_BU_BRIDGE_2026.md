# URBAN ONE — Smoobu / Booking.com / Alloggiati Web: check-in/out controllato

Data: 24 ottobre 2026. Stato: **software locale integrato, PMS e Alloggiati NON LIVE**.

## Situazione verificata

- `packages/bnb/pms-smoobu-readonly.mjs` genera richieste HMAC di sola lettura per Smoobu, ma non le invia e non contiene credenziali reali.
- `packages/hospitality/turnover-import.mjs` genera task da CSV pseudonimo.
- **Nuovo:** `packages/hospitality/pms-smoobu-turnover.mjs` trasforma la risposta JSON Smoobu *già ottenuta privatamente dal gestore autorizzato* in task di arrivo e partenza, senza copiare nome, telefono, email, note, link ospiti o prezzi.
- **Nuovo:** `scripts/smoobu-turnover.mjs` permette l'elaborazione locale, con validazione completa e blocco delle risposte paginate incomplete.
- Il gestionale effettivamente utilizzato dall'operatore **non è identificato**; Smoobu rimane solo candidato tecnico. Non ci sono prove di account collegato o credenziali API autorizzate. Il controllo Gmail non ha trovato conferme pertinenti.
- Smoobu API diretta richiede account API abilitato (normalmente piano a pagamento); **non è autorizzata nessuna nuova spesa** prima della revisione di dicembre e approvazione distinta.
- Booking.com consiglia alle singole strutture la connessione via channel manager e mantiene sospesa l'attivazione di nuovi connectivity provider.

## Esecuzione PRIVATA — nessun dato ospite su GitHub

Prima ottenere da un gestore **già autorizzato** una risposta completa a `GET /api/reservations?from=...&to=...` sulla propria postazione o sul backend privato, configurato con chiavi in un vault. Il JSON Smoobu può contenere molti dati personali: non va copiato in chat o caricato nel repository.

Da un computer del gestore con Node.js 22+, usare solo ID tecnici:

```bash
node scripts/smoobu-turnover.mjs --date 2026-10-24 --apartment 50017 --property PROPERTY-01 --authorized-export < /private/smoobu-response.json
```

`50017` è un identificativo **fittizio** della documentazione, da sostituire con l'ID dell'alloggio realmente autorizzato. La data è quella locale della struttura. Il JSON deve contenere `page_count: 1` e prenotazioni complete; non vengono recuperate altre pagine automaticamente. Gli ID prenotazione sono trasformati in riferimenti pseudonimi.

Il processo non comunica con Smoobu né con Booking.com, non modifica alcuna prenotazione, non genera chiavi smartlock e non dichiara effettuato alcun check-in/out.

## Flusso operativo per arrivare a LIVE

1. **PMS reale:** identificare quale gestionale/channel manager usa effettivamente la struttura e il diritto del gestore all'accesso API. Se diverso da Smoobu, preparare un adapter specifico.
2. **Collegamento privato:** autorizzazione della proprietà, contratto e DPA ove richiesti; server HTTPS con autenticazione, ruoli, limitazione d'ambito per struttura, gestione segreti, cifratura, audit e prova E2E in lettura delle prenotazioni. Segregare dati ospiti dal repository e dal client pubblico.
3. **Check-in autentico:** task automatico, riscontro effettivo dell'ospite e del documento al momento dell'accesso secondo il quadro normativo applicabile; conservare separatamente evidenza operatore con minima quantità di dati e condizioni di accesso. **Non considerare sufficiente** una foto documento inviata prima e un codice/keybox.
4. **Alloggiati Web:** solo dopo i permessi effettivi del gestore, usare il web service della Polizia di Stato o un PMS autorizzato, gestendo errori, ricevute, conservazione delle evidenze ed eventuale invio manuale alternativo. **Non usare GitHub Pages per trasmettere dati identificativi**. Il portale indica invio entro 24 ore dall'arrivo o all'arrivo per permanenze inferiori a 24 ore. Attenersi alle istruzioni della Questura competente.
5. **Check-out autentico:** data e ora pianificate avviano attività per riconsegna chiavi, pulizia e verifica locale; un operatore deve attestare l'uscita reale; solo dopo una riconciliazione autorizzata si può eventualmente aggiornare il PMS.
6. **Continuità:** backend privato persistente con cron/scheduler, code idempotenti, riconciliazione di modifiche/cancellazioni, privacy by design, metriche e allarmi. Non usare GitHub Actions pubblico come database dei soggiorni.

## Stati distinti

`PMS_CONNECTIVITY=NOT_VERIFIED`
`SMOOBU_REQUEST_SIGNING=SOURCE_READY_NOT_LIVE`
`SMOOBU_EXPORT_PROJECTION=CODE_TESTED`
`IN_PERSON_IDENTITY_CHECK=REQUIRES_REAL_OPERATOR`
`ALLOGGIATI_WS=NOT_CONNECTED`
`GUEST_DATA_SUBMISSION=NOT_PERFORMED`
`BOOKING_COM_DIRECT_PROVIDER=NOT_APPROVED`
`SMART_LOCKS=NOT_CONNECTED`

## Fonti primarie verificate

- https://connect.booking.com/
- https://docs.smoobu.com/
- https://support.smoobu.com/hc/it/articles/360003170740-Usa-l-API-di-Smoobu-crea-una-chiave-API-configura-i-webhook-e-firma-le-richieste
- https://alloggiatiweb.poliziadistato.it/PortaleAlloggiati/
- https://alloggiatiweb.poliziadistato.it/portalealloggiati/FAQ.aspx
- https://www.giustizia-amministrativa.it/web/guest/-/105486-1372?_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_M2jdZL26fejg_viewSingleAsset=true

**Non incollare API key, secret HMAC, credenziali Alloggiati Web o documenti personali in chat, repo o email.**
