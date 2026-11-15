# KKUBERA - calendario B&B e percorso Booking.com

Aggiornamento del 15 novembre 2026. Baseline: Sites v283, commit `d1c9874fe298fca26d7be11a6fbbd9acbb7be45f`. La versione pubblicata e il nuovo commit sono restituiti dal workflow Sites dopo il gate di rilascio.

## Risultato

`/kkubera/booking` offre un calendario B&B in italiano e inglese. La ricerca soggiorni di `/kkubera` e il calendario delle visite immobiliari restano disponibili. Il nuovo strumento tratta periodi presenti in file o inseriti manualmente, senza dichiarare disponibilità commerciale, prenotazioni o connessioni provider.

Il file iCalendar viene letto nel browser dopo una scelta esplicita. L'anteprima precede l'applicazione. Sono mantenuti soltanto etichetta locale dell'unità, fonte scelta, inizio, fine, identificativi locali e data di importazione. I dati degli ospiti e il file originale non sono inviati al server né conservati dal calendario. I link segreti dei feed non vengono richiesti.

## Intervalli e integrità

- Subset esplicito: eventi `VEVENT` con `DTSTART;VALUE=DATE` e `DTEND;VALUE=DATE`; inizio incluso, fine esclusa. Il checkout non blocca la notte successiva.
- Limiti: 256 KiB per file ICS, 500 eventi, 1.000 periodi conservati; date comprese tra il 1900 e il 2199.
- Ricorrenze, orari, fusi, durate alternative e componenti non supportati causano un errore; non vengono importati silenziosamente solo alcuni eventi di un file non supportato.
- Gli eventi cancellati o trasparenti validi sono contati e saltati. Un file senza periodi utili non cancella automaticamente il calendario.
- Le sovrapposizioni sono verificate per unità, indipendentemente dalla fonte. L'assenza di sovrapposizioni significa soltanto assenza di conflitti nei periodi caricati.
- La sostituzione da ICS riguarda soltanto l'unità e la fonte selezionate e richiede una scelta esplicita. Il ripristino di un backup intero è distinto e mostra un'anteprima.
- L'esportazione ICS riguarda la singola unità e usa descrizioni generiche. Il backup JSON può contenere tutte le unità.

## Conservazione

La copia locale usa `synapsy.kkubera.stay.local.v1` soltanto con i controlli espliciti Salva, Carica ed Elimina. La persona viene informata che altri utenti dello stesso profilo del browser possono caricarla. Le modifiche successive non sono risalvate automaticamente. Il file JSON esportato resta sotto il controllo della persona. La pagina non salva questi dati in D1, nel CRM o in un account Booking.com.

Il percorso pubblico risponde a GET e HEAD, rifiuta POST e imposta `Cache-Control: no-store` e `Referrer-Policy: no-referrer`. Nessun dato di un file viene inserito nei parametri dell'URL. Navigazione, ricerca interna, sitemap e informativa privacy IT/EN includono la funzione. Il dominio canonico resta quello Sites finché il dominio personalizzato non è registrato e verificato.

## Connessione Booking.com

Verifica delle fonti ufficiali del 15 novembre 2026:

1. [Connectivity Portal](https://connect.booking.com/): nuove integrazioni di provider sospese; le singole strutture sono indirizzate al channel manager nell'Extranet.
2. [Connections API](https://developers.booking.com/connectivity/docs/connections-api/connections-overview): una richiesta pendente è distinta da una connessione accettata e dalle autorizzazioni per le singole funzioni.
3. [Managing endpoint access](https://developers.booking.com/connectivity/docs/managing-endpoint-access): accesso agli endpoint, credenziali, connessione della struttura e capacità autorizzate sono requisiti separati.
4. [IETF RFC 5545, 3.6.1](https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1): semantica inclusiva dell'inizio ed esclusiva della fine; formato distinto dal servizio di sincronizzazione.

Il Partner Help ufficiale sulla sincronizzazione dei calendari ha restituito HTTP 403 durante la ricerca. Non sono quindi presentati come verificati oggi intervalli di aggiornamento, soglie numeriche o idoneità della singola struttura.

Il calendario manuale è un'istantanea. Per prezzi, aggiornamenti automatici e prenotazioni serve una connessione autorizzata della struttura, da verificare nell'[Extranet Booking.com](https://admin.booking.com/). Nessun PMS è stato acquistato; nessuna prenotazione, pagamento o modifica a calendari esterni è stata eseguita.

## Verifica di rilascio

Il gate esegue build, suite del repository, validazione dell'artefatto, controllo dei collegamenti e audit delle dipendenze. Le prove specifiche riguardano il parser, i casi negativi, i confini delle date, la rimozione dei campi privati, le sovrapposizioni, l'anteprima e la conservazione locale. I risultati finali e la verifica browser sono registrati nel rapporto di consegna; non attestano una connessione reale a Booking.com o un collaudo su dispositivi fisici.


### Collaudo browser locale

Eseguito nel browser cloud su anteprima locale, con account sintetico e file di prova privi di persone reali:

- inserimento manuale 10-12 dicembre e confronto 12-14 dicembre senza conflitto sul checkout;
- anteprima/importazione di due eventi ICS; campo ospite sintetico e URL di prova non presenti nei dati mostrati;
- sostituzione della sola fonte Booking.com: una aggiunta, due rimozioni, un periodo manuale preservato; annullamento con tre periodi ripristinati;
- salvataggio sul dispositivo, ricaricamento, recupero con anteprima e conferma;
- rifiuto di un file con ricorrenza, lasciando i tre periodi precedenti;
- download ICS completato: 788 byte, tre VEVENT, nessuna etichetta unità, dato ospite o URL originale;
- pagina inglese; vista a 320 e 390 CSS px, viewport rispettivamente 305 e 375 px, senza overflow orizzontale; alla seconda larghezza presenti anche i tre periodi caricati.

La revisione indipendente ha richiesto la protezione delle anteprime del dispositivo da un salvataggio successivo e la conservazione dell'avviso per campi manuali non ancora applicati. Le regressioni sono coperte dai test UI mirati. Le prove non equivalgono a collaudo su iPhone/Android fisici o importazione in un calendario Booking.com reale.
