# SEVA — SEPA BNL, DBRELAY, OpenAI / Codex: release gate (27 ottobre 2026)

## Source e contesto
- Titolare richiede incassi in euro via bonifico BNL/BNP Paribas, senza Stripe. La sola sequenza "003986" NON è un IBAN italiano completo, non prova titolarità e non deve diventare istruzione di pagamento.
- Il sito ChatGPT Sites e l'app Enterprise Node sono runtime separati; un commit GitHub non aggiorna Sites.
- Vercel "seva-executive-studio-preview" READY non dimostra login, inferenza OpenAI, SQLite persistente o pagamenti.
- I pagamenti bancari non sono PSD2 AIS/PIS: il cliente dispone un bonifico SEPA autonomamente e il gestore verifica l'accredito.

## Implementazione predisposta (disattiva per default)
- apps/seva-enterprise/bank-transfer.mjs: IBAN IT validato con mod-97, catalogo esistente con importi fissi, ordini SQLite owner-scoped e codici causale unici.
- GET /api/bank/status non espone IBAN; GET/POST /api/bank/orders richiede sessione per consultare/creare un ordine pending.
- apps/seva-enterprise/public/bank.html e bank.js: interfaccia mobile che visualizza le istruzioni solo dopo configurazione autorizzata.
- apps/seva-enterprise/bank-reconcile.mjs: CLI privata interattiva per operatore che ha verificato sul conto bancario un accredito effettivo; mai esporre come API.
- Il cliente non può auto-confermare l'accredito con foto, ricevute, TRN o redirect; entitlements temporizzati e verificati manualmente, no auto-debito e no rinnovo automatico.
- Se SEVA_PAYMENT_METHOD=sepa, il checkout Stripe è bloccato. Nessuna modifica alle chiavi Stripe e nessun addebito attivato.
- DBRELAY rimane SQLite tenant-scoped con snapshot/changefeed per goals e campaigns; gli ordini bancari hanno API owner-scoped distinte.

## Configurazione privata del server HTTPS persistente
Non salvare le seguenti impostazioni (soprattutto IBAN e credenziali) nel repository pubblico o nella app Android:
- SEVA_PAYMENT_METHOD=sepa
- SEVA_BANK_ORDERS_ENABLED=true
- SEVA_BANK_LIVE_APPROVED=true SOLO dopo verifica bancaria, fiscale, privacy e commerciale
- SEVA_BANK_IBAN=IT... (27 caratteri validati, intero conto aziendale confermato)
- SEVA_BANK_BENEFICIARY=nome esatto intestatario bancario
- SEVA_BANK_TERMS_URL=https://dominio-verificato.example/termini
- SEVA_BANK_PRIVACY_URL=https://dominio-verificato.example/privacy
- SEVA_DB_PATH=/percorso/assoluto/privato/seva.sqlite
- SEVA_PUBLIC_URL=https://host-confermato.example
- Riconciliazione CLI separata e temporanea: SEVA_BANK_RECONCILE_ALLOWED=true, SEVA_BANK_OPERATOR=operatore autorizzato, accesso diretto TTY e conferma umana.

Prezzi attuali nel codice: Enterprise 50 EUR/mese, Acquirente 50 EUR/anno, E-commerce 500 EUR/anno. Nessuna variazione implicita a proposte di 29 EUR/mese. Le condizioni di vendita, i costi, l'IVA e la fatturazione richiedono verifica prima di richiedere pagamenti reali.

## Chiave e provider AI
- Il backend richiede OPENAI_API_KEY protetta sul server, con progetto con credito disponibile e limiti di spesa; ChatGPT login ≠ API key.
- Report black-box del 26 ottobre: errore HTTP 429 credit_balance_exhausted, che non viene risolto dalla sola creazione di una chiave nuova.
- Verificare prima la fatturazione del progetto, poi risposta reale da una sessione SEVA autenticata, ID provider e policy dati. Codex, ChatGPT Sites e Node API non condividono automaticamente identità o quote.
- Non registrare chiavi, cookie, token, prompt privati o parametri OAuth nei log o nella repository.

## Criteri GO/NO-GO
1. IBAN integrale e beneficiario certificati, server HTTPS con ambiente privato.
2. Due utenti di collaudo, isolamento, SQLite persistente dopo restart, DBRELAY, backup e ripristino offsite.
3. Informativa privacy, termini, fattura/tasse, rimborsi e assistenza resi disponibili e verificati.
4. Ordine pending e bonifico manuale, accredito comprovato dal gestore, importo esatto, riferimento univoco, no duplicazioni, scadenza accesso, contestazioni.
5. Chiamata OpenAI autenticata e id provider con credito disponibile, controlli costi e privacy.
6. Suite npm test, npm run check e CI verdi, collaudo su smartphone e controllo sicurezza.
7. Solo dopo evidenze, attivazione commerciale e pubblicazione backend vero.

Stato: codice preparato in PR #107; IBAN completo e hosting full-stack non configurati/verificati; nessun bonifico effettuato o incassato; LIVE commerciale NO-GO.
