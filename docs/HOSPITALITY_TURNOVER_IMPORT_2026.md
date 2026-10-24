# URBAN ONE — Import prenotazioni e check-in / check-out

## Verifica allegati — 24 ottobre 2026
Entrambi i file `Google Gemini psd2(1).txt` e `Google Gemini psd2(20261024-113550)` contengono soltanto `https://gemini.google.com/`. Non includono prenotazioni, date, API, credenziali o diritti d'accesso PMS e non consentono di automatizzare arrivi e partenze.

## File supportato: CSV privato senza dati personali
Per preparare in automatico le attività del giorno, esportare dal proprio PMS o calendario autorizzato un CSV con ESATTAMENTE questi campi:

```csv
reservation_id,property_id,arrival_date,departure_date
BOOK-001,PROPERTY-01,2026-10-24,2026-10-27
BOOK-002,PROPERTY-02,2026-10-23,2026-10-24
```

Il campione è inventato. Non inserire dati reali in GitHub. Non aggiungere nominativi, documenti d'identità, email, telefoni, indirizzi, note ospiti, codici bancari o chiavi API. Ogni riga deve identificare soltanto la prenotazione, la struttura e le date.

## Esecuzione sul dispositivo del gestore
Usare Node.js 22+ da una copia privata e autorizzata del progetto, con il CSV di prenotazioni accessibile solo all'operatore:

```bash
node scripts/hospitality-turnover.mjs --date 2026-10-24 < /private/bookings.csv
```

La data scelta deve rappresentare il giorno nel fuso locale della struttura. Viene generato un elenco JSON di attività `scheduled`, `due_today` oppure `overdue_unconfirmed`. Il comando non chiama servizi esterni, non conserva dati su disco e non invia email né messaggi. Può essere eseguito periodicamente su un computer privato quando l'esportazione è aggiornata. Nessun job in GitHub Actions deve contenere dati reali degli ospiti.

## Che cosa è automatizzato e che cosa NO
- SÌ: lettura del CSV autorizzato, validazione rigorosa, generazione ripetibile delle attività previste di arrivo e partenza.
- NO: marcatura dell'effettivo check-in sulla base del solo calendario, identificazione dell'ospite, rilascio delle chiavi, verifica fisica del check-out, addebito Stripe, comunicazioni Alloggiati Web, modifiche PMS/Booking e report alle autorità.
- L'operatore autorizzato deve confermare l'effettiva presenza e l'identità al check-in; una data pianificata non è prova dell'evento.
- Il portale Alloggiati Web richiede procedure ufficiali e ricevute separate e non è automatizzato da questo codice.

## Completamento futuro per reale funzionamento continuativo
1. Ottenere un CSV di esempio privo di dati personali dal PMS reale e verificare gli header.
2. Collegare l'importer a un backend privato autenticato e a un registro persistente idempotente per ogni struttura.
3. Configurare un trigger schedulato sul backend privato, non su GitHub Pages.
4. Aggiungere conferme operatore per check-in, check-out, chiavi e pulizie, oltre a comunicazioni solo tramite provider ufficiali autorizzati.
5. Testare su una struttura con consenso e autorizzazione, verificare le ricevute delle comunicazioni e il ciclo completo.

**Stato verificato:** modulo per pianificare task con CSV privato; NON servizio PMS/Booking live o check-in fisico automatico.
