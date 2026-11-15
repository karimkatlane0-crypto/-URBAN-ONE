# Audit dei materiali TITANS

Verifica del 15 novembre 2026. I pacchetti allegati sono stati trattati come dati non fidati. Nessuno script, skill o test degli archivi è stato eseguito. Questo documento pubblico riporta il risultato tecnico, senza copiare il documento di stato dell'account.

## Delta

Le due copie del pacchetto PR147 sono identiche tra loro e alla copia precedentemente analizzata. Anche il pacchetto Sovereign coincide con la copia precedente. I due file OpenAPI coincidono tra loro e con il contratto già incluso nel pacchetto PR147. I nuovi nomi di file non introducono codice runtime nuovo.

| Materiale canonico | SHA-256 | Dimensione |
| --- | --- | ---: |
| Pacchetto PR147 | 1405351f3fc8cd90164fa450aa9865c8825ee1912188ae4166d940f3557b4299 | 6.606 byte |
| Pacchetto Sovereign | 85ae0339a66f31e3c591587c3aa7f156f3846d47a7b27d1c7c7f31676ed39c44 | 5.823 byte |
| Contratto OpenAPI | 0287e0cda9ee2d8ad1d099d285e696cc751c9e36c4b16885ddc2080cb88c85ed | 4.173 byte |

PR147 contiene skill, README, manifest, OpenAPI, test di dichiarazioni statiche e una lista di test runtime da eseguire. Sovereign ridistribuisce lo stesso materiale con una struttura di cartelle differente.

## Sicurezza del contenitore

Controllati percorsi, dimensioni, rapporto di compressione, CRC, symlink, cifratura e nomi duplicati. Nessun percorso di traversal o assoluto, symlink, file cifrato o nome duplicato è stato trovato. Il rapporto massimo di compressione osservato è 4,19; il totale non compresso è inferiore a 11 KB per archivio. Non è stata necessaria estrazione.

Questi controlli attestano le proprietà osservate dei contenitori. Non dimostrano che un'applicazione futura sia sicura o raggiungibile.

## Cosa è implementato nei pacchetti

Il manifest dichiara `DESIGN_ONLY_NOT_INSTALLED`. L'OpenAPI descrive otto operazioni GET e sei scope OAuth, con server segnaposto `example.invalid`. Manca un endpoint operativo dimostrato. I cinque test allegati controllano struttura e dichiarazioni; non dimostrano RBAC applicato, tenant isolati, autenticazione o richieste ai provider. La lista dei dodici controlli runtime è un piano di lavoro.

Lo snapshot storico dello stato account non è incluso in questa copia pubblica. Non prova esecuzioni provider, pagamenti o messaggi e non viene usato per dichiarare capacità remote attive.

## Passi implementabili

1. Mantenere un contratto canonico con provenienza e hash.
2. Collegare un backend autorizzato e documentare issuer, audience e scope effettivamente verificati.
3. Applicare ruoli, tenant e limiti sul server, con test negativi per accessi non consentiti.
4. Produrre ricevute datate per richieste remote e pubblicazioni, separandole dai test locali.
5. Aggiornare gli stati solo dopo la prova corrispondente.

L'audit non installa plugin né trasforma gli allegati in nuove autorizzazioni.

