# URBAN ONE Science — verifica acquisto e accesso cliente
Data: 26 ottobre 2026 (Europe/Rome).
## Esito
Collaudo automatico della logica di fatturazione: **15/15 PASS** su SQLite in memoria con le migrazioni reali.
Collaudo completo Stripe Checkout → webhook Stripe → cliente autenticato sul sito: **NON ESEGUITO**, resta un requisito di accettazione aperto.
Gli eventi firmati nei test sono sintetici; non sono eventi generati da un pagamento Stripe. Nessun addebito di prova eseguito.
## Evidenze attuali
- Sito: https://urban-one-science.karimkatlane0.chatgpt.site
- Stripe collegato: Katlane Karim, solo modalità live esposta dalla connessione.
- Payment Link attivo; piano 29 EUR/mese, 50 analisi per periodo pagato condivise tra ospitalità, immobiliare e ricerca.
- Webhook abilitato sulla versione API 2026-08-26.dahlia: checkout completato e pagamento asincrono riuscito, creazione/modifica/cancellazione abbonamento, fattura pagata e pagamento fallito.
- Ricerca abbonamenti per il prezzo del piano: nessun risultato alla verifica.
- GET /api/billing/status in produzione: HTTP 200, signed_out, allowed=false, checkoutReady=true.
- POST /api/billing/checkout senza identità: HTTP 401 SIGNIN_REQUIRED.
- Il redirect di ritorno non costituisce prova di pagamento né autorizzazione all'accesso.
## Copertura verificata
1. Firma HMAC sui byte esatti, timestamp e firma errata.
2. Checkout non pagato, link errato o intento non associato non concedono accesso.
3. Le sei permutazioni di consegna dei tre eventi convergono.
4. Duplicati non ripristinano le quote.
5. Contesto account, modalità e prezzo errati sono respinti.
6. Cancellazione definitiva e scadenza negano accesso.
7. Prenotazioni atomiche: massimo 50, restituzione quota su errore.
8. Rinnovo anticipato mantiene la quota corrente e apre il nuovo periodo.
9. Identità, condizioni accettate, backend pronto e blocco abbonamento duplicato.
10. Valuta localizzata correlata al prezzo configurato.
11. Percorso sintetico firma → database → accesso solo all'identità cliente associata.
12. Checkout asincrono in attesa fino a evento di successo.
13. Cancellazione a fine periodo conserva il periodo già pagato.
14. Rinnovo fallito non estende il periodo pagato.
15. Intento consumato non associa una seconda sessione di checkout.
Riproduzione: `node --test tests/science-billing.test.mjs`.
## Collaudo Stripe da completare
Collegare una sandbox Stripe isolata. Usare risorse e credenziali di test separate, senza sostituire quelle live del sito pubblico.
1. Configurare piano, checkout e webhook in sandbox su un ambiente di staging isolato.
2. Accedere con un'identità cliente diversa dal proprietario: il bypass proprietario non prova l'accesso pagato.
3. Acquistare con un metodo di pagamento di test e conservare ID sessione, abbonamento, fattura ed eventi.
4. Dimostrare accesso negato prima e concesso dopo la conferma webhook; 50 analisi iniziali e 49 dopo una risposta completata.
5. Ritardare e ripetere gli eventi; verificare attesa nel ritorno dal checkout e assenza di doppio accesso o ripristino quota.
6. Provare rinnovo riuscito/fallito, cancellazione a fine periodo e scadenza.
7. Verificare il portale cliente con l'identità corretta e l'assenza di accesso da un altro account.
8. Eseguire una richiesta AI autenticata sul sito e annotarne l'esito senza registrare prompt, risposte o segreti.
I risultati di questi passaggi devono essere documentati prima di dichiarare completo il collaudo end-to-end.
## Qualità e fiscalità
Controlli riproducibili e tracciabilità delle evidenze; nessuna certificazione, revisione o affiliazione EY / Ernst & Young dichiarata.
Stripe automatic_tax risulta disabilitato nel Payment Link. Registrazioni fiscali e trattamento IVA devono essere verificati prima della vendita nei territori applicabili; il prezzo inclusivo non dimostra adempimenti fiscali.
## Dominio
Disponibilità e preventivi ottenuti dal servizio pubblico Vercel Registrar, 26 ottobre 2026:
| Dominio | Disponibile | Durata preventivo | Registrazione USD | Rinnovo USD per la stessa durata |
| --- | --- | --- | --- | --- |
| katlanescience.com | sì | 1 anno | 11,25 | 11,25 |
| urbanonescience.com | sì | 1 anno | 11,25 | 11,25 |
| katlane.app | sì | 1 anno | 14,99 | 15,00 |
| katlane.ai | sì | 2 anni | 160,00 | 160,00 |
Preferenza proposta: **katlanescience.com**, identificativo del fondatore e del prodotto. Nessun dominio acquistato né DNS modificato. Disponibilità e prezzi possono cambiare; verifica marchi non eseguita.
Fonte tecnica: https://vercel.com/docs/domains/registrar-api
La connessione del dominio al sito e le URL Stripe andranno verificate dopo registrazione e configurazione HTTPS, mantenendo attivo il dominio attuale durante la transizione.
