# SEVA IS CALLED — Dalla PRIMISSIMA versione alla versione Executive 100+

Consolidamento: 26 ottobre 2026. Repository principale: `karimkatlane0-crypto/-URBAN-ONE`, branch `main-@URBAN-ONE`. La repository `karimkatlane0-crypto/URBAN-ONE` **senza trattino iniziale** rimane dedicata a KKUBERA e non viene fusa.

## Origine e provenienza
- Sito Work/ChatGPT Sites originale: `https://seva.karimkatlane0.chatgpt.site/`. **Non è stato possibile ottenere HTTP 200 in questo controllo**. Il codice GitHub NON è automaticamente sincronizzato con quella versione.
- Funzioni dal concept iniziale: gerarchia GOAL / SUB GOAL / SUB SUB GOAL / livello 3, criteri, prove, stati, salvataggio, esportazione, preparazione richiesta AI; Lastre fotografiche volontarie e intenzioni acquisto/affitto/leasing/credito; attenzione al risultato dimostrato anziché dichiarato.
- Fonte recuperata: PR #87 `seva-analytics-lastre-ai-20261026` ancora aperta. Le sue componenti Analytics/Lastre sono state **portate sul branch più recente** senza fondere l'originale vecchio (che avrebbe sovrascritto gli aggiornamenti successivi su account/entitlement e backup).

## Matrice di continuità e stato

| Istanza / periodo | Invarianti preservati | Implementazione aggiornata | Prova |
| --- | --- | --- | --- |
| Prima SEVA su Sites | Obiettivi gerarchici, criteri, stato, esportazione, Lastre locali, AI | `public/app.js`, `index.html`; Lastre e Analytics recuperate | test di codice / HTTP |
| SEVA II–III | Account, goal isolation, SQLite, DBRELAY e cursor | `core.mjs`, `dbrelay.mjs` | CI locale; HTTPS remoto non certificato |
| PR #95 | Backup SQLite consistente e restore isolato | `maintenance.mjs` mantenuta | test sintetici, non offsite |
| PR #96 | Stripe plan-scoped, Buyer 50 EUR/anno, E-commerce 500 EUR/anno, Enterprise 50 EUR/mese | `core.mjs`, `server.mjs` preservati | TEST signed provider + webhook remoto ancora mancanti |
| PR #97 | Commissioni partner solo su vendite qualificate, carrelli incompleti 0 | `affiliate-ledger.mjs` | CI, nessuna liquidazione |
| PR #98 | Due account e riavvio effettivo processo Node | `blackbox-g11.mjs` | PASS locale, non hosted |
| PR #99 | Double Flywheel per marketing finanziato da fondi indipendenti | `marketing-flywheel.mjs` | solo preventivo ipotetico, non cashback |
| PR #100 | Opt-in notifiche private; WhatsApp volontario | `notification-center.mjs`, `notifications-ui.js` | no true background Web Push |
| PR #101 | Executive mobile UX, studio messaggi AI beni/servizi | `communications.mjs`, `communications-ui.js` | no delivery automatica esterna |
| Questa consolidazione | KPI/KPMI; Lastre CRM e visione AI col consenso separato | `analytics.mjs`, `lastre.mjs`, `original-intelligence-ui.js` | CI da verificare; provider esterno non testato |

## Original Intelligence — Lastre AI
- Foto **non salvate** sul server. L'utente sceglie una foto dal proprio telefono: prima dell'eventuale invio a OpenAI l'immagine viene ricampionata su canvas e convertita in JPEG senza metadati originali; dimensione limitata. Serve un consenso dedicato `consentToAI=true` per la trasmissione. La risposta non dimostra un acquisto, prezzo reale, riconoscimento ufficiale o autorizzazione al credito.
- Il CRM memorizza unicamente intenzione/descrizione/budget con `consent=true`, separato dal consenso OpenAI e dalla bozza messaggi marketing. CRUD per account, cancellazione e test cross-user. Nessuna foto è inserita nel database.
- KPI/KPMI mostrano goal totali, verificati, bloccati, progresso percentuale ricavato dai record, proposte/marketing dichiarati come **simulazioni** e conteggi Lastre per account. Il valore di un preventivo non equivale a fatturato Stripe.

## Versioni Android e Hosted — distinguere
- `SEVA Locale 2.4.2` è debug/offline e comprende un planner locale, senza login Enterprise, foto Lastre online, AI, Stripe e notifiche recenti. **Non è il risultato finale integrato**.
- La PWA Enterprise è aggiornata nel codice del repository, ma senza host Node HTTPS con disco SQLite persistente e deploy verificato non è operativa dal vecchio URL Sites.
- Stripe sandbox catalogo preparato, webhook esterno non registrato al controllo precedente; LIVE **NO-GO**. Non accettare contratti di terzi, non eseguire addebiti e non pretendere commissioni senza prove.
- OpenAI provider reale necessita una risposta autenticata da sito ospitato, ID risposta/model/date, e controllo effettivo crediti/permessi.
- Android Enterprise online necessita nuova build firmata, QA su smartphone reale e conformità Google Play/SEE. Non confondere APK offline con Enterprise.

## Azione → Risultato → Prova BLACK BOX
Ogni verifica deve riportare: commit/versione, ambiente, input sintetico, risultato atteso, osservato, evidenza, data, PASS/FAIL/BLOCCATO/NON VERIFICATO. Annotare nel tracking issue #82.

## Gate esterni ancora aperti
1. **G.1** hosting persistente con autorizzazione economica esplicita, HTTPS `/health` HTTP200 e isolamento dopo restart reale.
2. **G.2** risposta OpenAI reale da sessione autenticata, anche per Lastre previo consenso.
3. **G.3** Checkout Stripe TEST → webhook firmato → accesso/annullamento account specifico; LIVE disabilitato.
4. **G.4** backup protetto fuori server e restore indipendente.
5. **G.5** build Android Enterprise online e test smartphone fisico.
6. **G.6** termini, privacy/consensi, assistenza, prezzi e imposte, policy Play/SEE, release sign-off del titolare.

**La continuità della storia del prodotto e il codice sorgente aggiornato non sono prova di pubblicazione della stessa app su ChatGPT Sites.**
