# SYNAPSY — conservazione pubblica della release v282

Questa cartella registra il delta selezionato della release Sites **282** del 15 novembre 2026. La versione **281** rimane la baseline conservata. Il progetto continua sullo stesso [sito SYNAPSY](https://seva.karimkatlane0.chatgpt.site).

## Riferimenti esatti

| Riferimento | Valore |
| --- | --- |
| Sorgente v282 | `82a5b7e86c00c514b7aff2927572ccb2c97147df` |
| Baseline v281 | `92369ddf7d097109991c980e720813893e23fdc0` |
| Versione salvata | `appgprj_6ade4dd9b604819190ac80a133057f77~appgver_6c56ba39bfc8819194b48aa4a8e01d73` |
| Deployment | `appgdep_6af99cef630081918f57876e8fde4ba4` |
| Pubblicazione terminale | `SUCCEEDED`, 2026-11-15 11:52:28.008401 UTC |
| Ambiente | Revisione 18 |
| Base GitHub ospitante | `9265943fbb00bee9249e222145f48ec76fd6cec0` |

La ricevuta del deployment e il gate software della sorgente sono registrati in [release-evidence.json](release-evidence.json). La pubblicazione riuscita non sostituisce la QA di ogni flusso esterno o su dispositivo fisico.

## Contenuto e uso

`source/` contiene **37 file**: tutti i 35 file sorgente/asset cambiati rispetto alla v281, escluso il worker compilato generale, più l'avviso di copyright e il dizionario delle lingue Studio. Sono copie byte per byte del commit sorgente; [source-manifest.json](source-manifest.json) registra percorso, dimensione, SHA-256 e Git blob SHA.

Sono inclusi il nuovo Premium, la migrazione e i metadati di schema, i punti di integrazione nell'applicazione, i test dedicati, logo/icone e l'archivio della grafica precedente. I file già esistenti sono copiati per intero per conservare il contesto delle modifiche. Le tabelle di schema non contengono record di utenti.

La cartella è un **delta di conservazione selettiva**, non un progetto autonomo: moduli e test possono dipendere dai file invariati della baseline Sites. Per ricostruire la release occorre quella baseline e il suo ambiente. Non sovrapporre questa cartella alle applicazioni Node/SQLite del repository ospitante e non eseguire migrazioni su un database diverso senza la relativa procedura di progetto.

La CI del repository ospitante continua a verificare le proprie applicazioni. Non viene presentata come una nuova esecuzione dei test del progetto Sites conservato in questa cartella.

## Comportamento della release

- Logo allegato preservato, con provenienza e archivio della grafica v281.
- Navigazione Italiano/English e Studio in otto lingue totali: IT, EN, ES, FR, DE, PT, AR, ZH.
- `/premium`: candidatura volontaria autenticata, scheda minimizzata senza nome/telefono, richieste nominative, approvazione/rifiuto/revoca.
- Offerte dichiarate da 1 euro per consultazione e 200 euro per Premium Pro; periodicità dell'abbonamento non definita.
- Il server mantiene chiusi il rilascio dei recapiti e l'addebito. Nessun flag client, privilegio del titolare o ricevuta manuale attiva questi percorsi.
- Verifica del possesso del recapito, prodotto/prezzo, pagamento, rimborso e distribuzione sui dispositivi richiedono prove proprie.

## Esclusioni e diritti

Non sono inclusi esportazioni di account, dati CRM, documenti privati, credenziali, upload grezzi, log delle connessioni, archivio completo di rilascio o worker compilato generale. L'originale del logo è un asset approvato per il sito e conservato nel relativo archivio di provenienza.

La registrazione avviene su una branch dedicata e aggiunge soltanto questo prefisso. Non unisce codice su main e non modifica i workflow esistenti. I diritti rimangono quelli dichiarati nell'[avviso sorgente](source/COPYRIGHT.md) e nei materiali di terzi: questa pubblicazione non introduce una nuova licenza.

## Documentazione

- [CI, website e piattaforme](CI_AND_PLATFORMS.md)
- [Audit allegati TITANS](ATTACHMENTS_REVIEW.md)
- [Privacy e perimetro](PRIVACY_AND_SCOPE.md)

Il rapporto operativo riservato del titolare è conservato separatamente e non fa parte di questo dossier pubblico.
