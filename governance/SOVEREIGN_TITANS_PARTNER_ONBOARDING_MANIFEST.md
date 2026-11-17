# SOVEREIGN TITANS — KARIM KATLANE
## Partner Onboarding & Governance Manifest
**Versione:** 1.0  
**Data:** 17 novembre 2026  
**Ambito:** TITANS × SEVA × URBAN ONE

## 1. Missione
Coordinare sviluppo, verifica, rilascio e crescita dei progetti TITANS, SEVA e URBAN ONE attraverso processi tracciabili, autorizzazioni esplicite e prove verificabili.

## 2. Sequenza obbligatoria
1. **BUILD** — implementare le modifiche autorizzate, mantenendo separati ambienti, credenziali, dati e responsabilità.
2. **VERIFY** — verificare ogni gate con proprietario, criterio di accettazione, evidenza, risultato e stato.
3. **RELEASE** — rilasciare solo dopo il superamento dei controlli richiesti e l'approvazione esplicita del responsabile.
4. **SCALE** — ampliare utenti, partner, mercati e volumi soltanto dopo un rilascio verificato e monitorabile.

Nessuna fase successiva è considerata autorizzata dal solo completamento dichiarato della fase precedente.

## 3. Registro dei gate
Ogni gate deve riportare:
- ID e area;
- proprietario/responsabile;
- prerequisiti e criterio di chiusura;
- evidenza verificabile (URL, commit, run, test, log o ricevuta);
- risultato osservato;
- stato: **PASS**, **OPEN** o **BLOCKED**;
- data e prossimo passo.

**PASS** richiede evidenza controllabile. **OPEN** indica che la verifica non è conclusa o manca evidenza. **BLOCKED** indica un impedimento concreto. Non trasformare mai OPEN o BLOCKED in PASS per inferenza.

## 4. Regole di governance
- Non dichiarare merge, deployment, pubblicazione, pagamento, attivazione o integrazione senza conferma dalla fonte autorevole.
- Distinguere sempre codice implementato, test locale, CI, ambiente di staging e produzione.
- Non esporre segreti, token, chiavi private o credenziali nei repository, nei log o nei report.
- Le modifiche remote devono essere limitate allo scopo autorizzato; registrare branch, commit e risultato.
- Non aggirare limiti di quota, permessi, controlli di sicurezza o approvazioni.
- In caso di evidenza insufficiente, mantenere il gate OPEN e indicare esattamente cosa manca.
- Non eseguire azioni irreversibili o che incidono su clienti, pagamenti, campagne o dati personali senza autorizzazione esplicita.

## 5. Onboarding partner
Prima di abilitare un partner:
1. identificare partner, organizzazione, referente e finalità;
2. verificare identità, ruolo, titolarità e autorizzazioni necessarie;
3. definire ambito, dati accessibili, operazioni consentite e durata;
4. applicare il principio del privilegio minimo;
5. verificare accordi, informative, consensi e requisiti normativi applicabili;
6. eseguire test con dati sintetici o minimizzati;
7. registrare esito, responsabile, evidenze e procedura di revoca.

L'onboarding non concede automaticamente accesso a dati, CRM, sistemi di pagamento o ambienti di produzione.

## 6. Consenso, contatti e CRM
Per rubriche e file VCF, verificare separatamente:
- consenso al trattamento/importazione dei contatti;
- autorizzazione alla condivisione o comunicazione a terzi;
- autorizzazione marketing e comunicazioni promozionali.

Un consenso non implica gli altri. Prima di qualsiasi importazione: controllare integrità, duplicati, conflitti e minimizzazione dei dati. Nessuna scrittura CRM, campagna, iscrizione o abbonamento senza autorizzazione valida, ambito esplicito e verifica del sistema destinatario. In assenza di un'operazione CRM supportata o di permessi adeguati, limitarsi all'analisi e al report senza scrivere dati.

## 7. Sicurezza e pagamenti
- Conservare segreti e chiavi nei secret manager autorizzati; mai nel repository.
- Separare test e live, cataloghi, webhook, identità e permessi.
- Verificare il flusso completo pagamento → webhook autenticato → verifica server-side → entitlement/accesso → audit e gestione rimborsi.
- La presenza di un link di pagamento o di un metodo configurato non prova una transazione riuscita né l'attivazione automatica dell'accesso.
- Non dichiarare attivi metodi di pagamento senza verifica nel pannello autorevole e test end-to-end consentito.

## 8. Criteri specifici di rilascio
### URBAN ONE
Verificare merge sul branch previsto, CI post-merge, build firmata, provenienza/checksum, test dispositivo, configurazione Play Console, Data Safety e App Content. La pubblicazione in produzione è dichiarata solo dopo conferma effettiva di Google Play Console. Le chiavi private di firma non devono entrare nel repository.

### SEVA / SYNAPSY
Verificare autenticazione, separazione utenti e dati, backend HTTPS, persistenza e recupero, risposte OpenAI autenticate, pagamenti ed entitlement, API, integrazioni e pagine pubbliche. Un'interfaccia o una preview non prova la disponibilità del servizio end-to-end.

### TITANS
Mantenere un registro unico delle attività, dipendenze, blocchi, evidenze e approvazioni. Riconciliare gli archivi prima di dichiarare una baseline definitiva. Non duplicare o sovrascrivere dati senza controllo dei conflitti.

## 9. Comunicazione e report
Ogni aggiornamento deve distinguere:
- completato e verificato;
- implementato ma non verificato;
- aperto;
- bloccato;
- non verificabile con i permessi o gli strumenti disponibili.

Formato sintetico raccomandato:
| Gate | Owner | Evidenza | Risultato | Stato | Prossima azione |
|---|---|---|---|---|---|

## 10. Regola finale
**BUILD → VERIFY → RELEASE → SCALE**  
Nessun rilascio sulla base di promesse, simulazioni o dichiarazioni non corroborate. Ogni risultato deve essere riproducibile, attribuibile e verificabile.

**Ad Maiora Semper.**
