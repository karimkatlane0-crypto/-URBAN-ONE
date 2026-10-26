# SEVA Campus — 26 ottobre 2026

Profilo studenti full stack aggiunto al sito privato SEVA e al backend Enterprise nel repository. GET/PUT/DELETE /api/student usa esclusivamente il proprietario autenticato, senza parametri owner nel client. D1 nel sito; SQLite nel backend Node. ID SEVA casuale stabile, aggiornamenti con versione e conflitti HTTP 409, export locale JSON, cancellazione del profilo attivo. Nome, ateneo, corso e anno accademico; email universitaria e matricola facoltative. Informativa e dichiarazione richieste a ogni salvataggio con versione e data registrate. Nessun documento acquisito, nessun invio ad università o AI, nessuno sconto o diritto automatico.

## Stato delle funzioni
| Funzione | Sito privato | Backend Enterprise |
| --- | --- | --- |
| Accesso | Identità ChatGPT tramite Sites | Sessione SEVA con cookie HttpOnly |
| Studenti | D1, profilo per identità Sites | SQLite, profilo per account SEVA |
| CRM e foto | Archivio browser esistente | Funzioni preesistenti del backend; foto locali |
| Obiettivi | Editor e albero locale esistenti | Persistenza e DBRELAY esistenti |
| AI | Configurazione preesistente; risposta autenticata hosted da verificare | API esistente, credenziali e deployment separati |
| Pagamenti | Non attivati | Gate preesistenti, non modificati |
| Verifica universitaria | NON collegata | NON collegata |

I due sistemi di identità non sono automaticamente collegati: nessuna correlazione per email. Il sito resta accessibile soltanto al proprietario finché non viene autorizzata una diversa platea.

## Verifica
33 test del sito: 24 regressioni esistenti più 9 scenari studenti (SQL reale e contratti HTTP Worker).
164 test Enterprise: 149 regressioni aggiornate (inclusa la versione 2.4 commerce/i18n) più 9 scenari condivisi e 6 test HTTP con vera sessione/cookie.
Controlli: isolamento account, firme di autenticazione affidate al rispettivo host, blocco dei campi di verifica imposti dal client, consenso, formato anno/email, limite byte, origine richieste, conflitti di versione, cancellazione e sanitizzazione errori.
UI nell'anteprima locale: creazione con dati sintetici e rilettura dopo reload mantenendo stesso ID. Database di anteprima distinto; nessun profilo reale creato. Build e validazione ESM riuscite. Screenshot di QA nel repository.
Il collaudo di scrittura con una vera identità ChatGPT sul deployment resta distinto dalle prove locali; non può essere sostituito da un token di servizio senza identità utente.

## Database e sviluppo
Migrazione D1 generata con Drizzle Kit 0.31.10; schema SQLite, migrazione e metadati inclusi. Il deployment Sites applica la migrazione prima di pubblicare il Worker. Non creare tabelle nei gestori delle richieste. Il server di anteprima usa esclusivamente un account sintetico e un database .wrangler escluso da Git; non viene incluso nell'artefatto Worker distribuito.

Nessuna certificazione EY dichiarata. Non è un documento universitario né una verifica accademica, KYC o eIDAS. Restano necessari un provider istituzionale autorizzato e il suo collaudo per un riconoscimento universitario reale.

## Concorrenza con SEVA 2.4
Integrate le modifiche concorrenti commerce/i18n del commit db936281cd26ecf87dc4bb8ef21bdc9fc017f9e5, preservando negozio in sei lingue, anagrafica, carrello e richiesta studenti pending. Il profilo /api/student è separato dalla domanda /api/commerce/student: nessuna approvazione o sincronizzazione automatica fra i due. Prezzi e checkout non modificati.

## Pubblicazione verificata
Sito SEVA privato versione 2, commit sorgente 5730a46ec2836a86bbe32d70d4b0583f919bcf46, pubblicazione riuscita il 26 ottobre 2026. D1 binding DB e tabella seva_student_profiles confermati dal servizio hosting. Sorgente completo della versione ospitata archiviato in releases/seva/student-source-5730a46.tar.gz. Il backend Node Enterprise 2.4.1 è depositato separatamente: non è il processo Node del sito Workers.
