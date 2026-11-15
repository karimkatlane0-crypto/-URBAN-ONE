# SYNAPSY v284 — Calendario B&B

Pubblicato il 15 novembre 2026 alle 13:58:38 UTC.

- Sito: https://seva.karimkatlane0.chatgpt.site
- Calendario: https://seva.karimkatlane0.chatgpt.site/kkubera/booking
- Commit Sites: `0948e73115d85e087c32d867a8c747b1bda75c1a`
- Baseline: v283, `d1c9874fe298fca26d7be11a6fbbd9acbb7be45f`

## Risultato

Importazione manuale ICS, anteprima, sostituzione per unità e fonte, blocchi manuali, notti e sovrapposizioni con checkout esclusivo, annullamento, copia facoltativa sul dispositivo e backup JSON. ICS esportato per la sola unità selezionata, senza dati degli ospiti, UID originali, note o URL del provider. Pagina IT/EN con navigazione, ricerca, sitemap e privacy aggiornate.

L’importazione è un’istantanea locale: non verifica inventario, non crea prenotazioni e non sincronizza Booking.com. La connessione della struttura al provider resta da verificare.

## Verifiche

Gate finale: 2.188 test, 2.187 PASS, 1 skip, 0 failure. Build ESM valida. 155 pagine, 21.250 collegamenti, 1.729 ancore e 1.510 script controllati, zero errori. Audit dipendenze: zero vulnerabilità rilevate. Browser locale: importazione, sostituzione, undo, salvataggio/ripristino, file non supportato, download ICS, IT/EN, 320/390 CSS px senza overflow. Nessuna prova su dispositivo fisico o provider esterno.

La revisione indipendente ha chiuso due regressioni sulle anteprime del dispositivo e sulle bozze non applicate; le rispettive prove sono incluse.

## Conservazione

Questa cartella conserva i 16 file di sorgente/test/documentazione modificati. Il Worker generato, le credenziali, i rapporti personali e i dati runtime non sono inclusi. La copia è un delta verificabile, non un’applicazione autonoma. Il dossier v283 e tutti i file preesistenti restano invariati.

La reference TITANS corretta 0.1.2 è in `docs/titans-reference/2026-11-15/`: 21 prove Python PASS, di cui 20 negative; due wrapper Node rieseguono i medesimi controlli. Skill e OpenAPI originali invariati. Nessuna installazione di runtime o cluster è attestata.
