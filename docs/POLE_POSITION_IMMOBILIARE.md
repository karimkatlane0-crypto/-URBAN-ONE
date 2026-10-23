# Pole Position Immobiliare — dossier e visite tra privati

23 ottobre 2026 · prototipo locale Web/Android/iOS, non servizio live.

## Funzioni implementate

Dalla home aprire `pole-position.html`. Il proprietario simulato prepara un dossier per vendita o locazione, sceglie l'inizio della finestra informativa di 24 ore e aggiunge slot futuri con durata, tariffa EUR e condizioni. La pagina impedisce sovrapposizioni. Il visitatore simulato accetta le condizioni e richiede uno slot. Il proprietario può confermare, registrare l'arrivo e concludere la visita; l'annullamento è previsto prima dell'arrivo. Una richiesta annullata libera lo slot nella demo. Messaggi e dati sono volatili, locali alla singola pagina: usare solo identità e immobili fittizi. Web e bundle Capacitor includono gli stessi file del modulo.

La finestra va da publishedAt incluso a publishedAt + 24 ore escluso. Dopo passa a GENERAL; prima è SCHEDULED. È una visualizzazione informativa basata sull'orologio del dispositivo, senza promessa di prelazione, esclusiva o controllo accessi. Nessuna sincronizzazione multiutente, WhatsApp, Calendar, NotebookLM, Gemini o ICON è dichiarata operativa.

## Modello di business proposto

| Blocco | Proposta |
| --- | --- |
| Clienti | Proprietari/delegati autorizzati; potenziali acquirenti e locatari |
| Valore | Dossier strutturato, appuntamenti tracciabili, condizioni leggibili, messaggistica nel dossier |
| Canali | App URBAN ONE Web e shell mobile; ingresso volontario da link |
| Relazione | Self service assistito, operatore umano per controversie e negoziazioni |
| Ricavi | Servizio software al proprietario su preventivo; eventuale servizio di visita distinto, con prezzo e prestazione concordati |
| Risorse | Dossier, calendario, registro richieste, backend autenticato e audit da realizzare |
| Attività | Verifica autorità sul dossier, moderazione, gestione richieste e assistenza |
| Partner | Solo fornitori effettivamente contrattualizzati; nessuna affiliazione EY/Ernst & Young, Booking.com o Google implicita |
| Costi | Hosting, supporto, messaggi, verifica documenti e gestione contestazioni da misurare |

Nessun nuovo prezzo Pro/Ultra, abbonamento o percentuale di provvigione è approvato da questo prototipo. La visita può essere gratuita (default). Per la versione a pagamento vanno definite prestazione effettiva, soggetto che la eroga/incassa, trattamento fiscale e condizioni di cancellazione/rimborso applicabili. Una visita non attribuisce diritti sull'immobile, non conclude una vendita/locazione e non è una caparra.

## Pagamenti invariati

Il modulo non chiama API, checkout o Payment Link; non modifica Stripe, IBAN, beneficiari, metodi, prodotti, prezzi esistenti, webhook, split, rinnovi o abbonamenti. La tariffa visualizzata è una simulazione; `paymentStatus=NOT_PROCESSED` anche dopo una conferma demo. Nessun pagamento viene dedotto dall'arrivo o dalla conclusione della visita.

Un futuro collegamento richiede l'uso del flusso commerciale già autorizzato, senza nuove configurazioni implicite. Se l'incasso spetta a un proprietario terzo, non instradarlo al venditore software: beneficiario e mandato devono essere risolti prima dell'attivazione. Conferma reale e gestione rimborsi dipendono da evidenza server-side e termini concordati.

## Integrazione reale ancora necessaria

- Autenticazione proprietario/visitatore e verifica dei poteri sul dossier; documenti e indirizzo preciso protetti.
- Database privato con scope per dossier, retention e autorizzazioni; nessun documento personale nei sorgenti pubblici.
- Blocco atomico degli slot con scadenza delle richieste, UTC e visualizzazione Europe/Rome; prevenzione doppie prenotazioni tra dispositivi.
- Notifiche e messaggi autenticati, verifica disponibilità reale e conferma esplicita delle parti.
- Condizioni per servizio a pagamento e valutazione professionale del modello prima del lancio.
- Eventuali agenti soltanto per preparazione e assistenza; nessuna conferma, addebito o negoziazione autonoma.
- Build, test dispositivo, firma e pubblicazione store restano passaggi separati.

## Misurazione futura

Contare separatamente dossier autorizzati, slot offerti, richieste, conferme, presenze, annullamenti, contestazioni, incassi verificati e ricavi netti. Nessun dato commerciale misurato o previsione di ricavo viene presentato come risultato acquisito.
