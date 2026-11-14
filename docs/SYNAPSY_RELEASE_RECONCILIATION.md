# SYNAPSY — Riconciliazione del pacchetto di rilascio

14 novembre 2026 · Base verificata: `64ea2949cb128061918eef66aafeea520d5e894b`.

## Risultato e perimetro

Il pacchetto descritto come «tutti i flussi verificati» non ha evidenze sufficienti
per un rilascio operativo. La revisione riguarda gli allegati Python, Docker,
Kotlin e JavaScript, il registro delle ricevute e lo script `deploy_all.sh`
recuperato separatamente. Lo ZIP originale `synapsy-urban-one-turnkey-v2.zip` e
il verificatore originale `verify_all_integrations.py` non sono stati reperiti.
Non si attribuiscono loro contenuti o risultati non osservati.

Questa modifica aggiunge un controllo preventivo offline e corregge lo scanner
HTTP. Non integra il gateway Python nel runtime Node del repository e non
certifica operazioni dei provider, incassi, consegne o test su dispositivo.

## Componenti già corretti da preservare

| Componente | Stato osservato nella base |
| --- | --- |
| Branch predefinito | `main-@URBAN-ONE` |
| Workflow `.github/workflows/synapsy-infrastructure-proof.yml` | Acquisisce un evento CI reale e usa il reporter dedicato |
| Reporter `scripts/synapsy-infrastructure-proof.mjs` | Verifica identità dell'evento e ricevuta del destinatario |
| Dockerfile principale | Runtime Node sulla porta 8787 |
| Configurazione Kotlin nel modulo `online-diagnostics` | Coda Room disabilitata; limiti di TTS e accessibilità documentati |

Questi file vengono conservati. Il Dockerfile Python allegato non sostituisce
quello Node; il vecchio flag `ENABLE_OFFLINE_ROOM_QUEUE = true` non sostituisce
la configurazione Kotlin già corretta.

## Perché il vecchio comando non è utilizzabile

Lo script `deploy_all.sh` recuperato forza la copia del workflow, ignora errori
di copia, verifica, staging e commit con `|| true`, include intere directory
nello staging e tenta `git push origin main`. Può quindi sovrascrivere la
correzione infrastrutturale o includere lavoro estraneo anche dopo un test
fallito. Non contiene un deploy del container, un rollout Kubernetes o una
procedura di recupero verificata.

Cambiare soltanto `main` nel nome del branch non risolve questi difetti.
Il workflow corretto riceve l'esito della CI: non esegue il deploy del gateway.

## Nuovo controllo preventivo

`scripts/verify_synapsy_release.py` usa la libreria standard Python. Legge gli
allegati come dati, ne calcola le impronte, analizza alcuni costrutti Python
tramite AST e rileva i rischi specifici osservati nel vecchio script di deploy.
Non importa gli allegati e non esegue shell, chiamate provider, commit o push.

Esempio da adattare alla cartella che contiene gli allegati originali:

```bash
python3 scripts/verify_synapsy_release.py \
  --source-dir /percorso/allegati \
  --receipts /percorso/synapsy_verification_receipts.json \
  --deploy-script /percorso/deploy_all.sh \
  --repository . \
  --output /percorso/esterno/nuovo-rapporto.json
```

L'output deve essere nuovo e fuori dal repository ispezionato. I parametri
`--receipts`, `--deploy-script`, `--repository` e `--output` sono opzionali.
Senza `--output`, il JSON viene stampato su standard output.

| Esito | Significato | Codice di uscita |
| --- | --- | --- |
| `NO_GO` | Sono presenti rilievi che impediscono di qualificare questo pacchetto come pronto | 1 |
| `NOT_VERIFIED` | Mancano prove operative; assenza di rilievi non significa integrazione verificata | 2 |
| `INPUT_ERROR` | Input mancante, ambiguo o output non consentito | 2 |

Le euristiche sono mirate ai file esaminati e non costituiscono un audit di
sicurezza esaustivo. Il verificatore non dispone di un esito automatico GO LIVE.

## Impronta del registro: cosa è verificato

L'impronta interna dichiarata è:

`2f84bbf5e434a6ef2d1ab2b43dc38d08cda465b362f4bbf06d11ac498c9fcd04`

Corrisponde al digest SHA-256 del payload senza `master_integrity_sha256`,
serializzato in UTF-8 mediante `json.dumps(payload, sort_keys=True,
ensure_ascii=True)` con separatori predefiniti e nessuna indentazione.

L'impronta SHA-256 dei byte dell'intero file originale, invece, è:

`0111c0527444a04b31ebd1572d34fe620917c8c6f7cf94e32b4b742f657f2ab2`

Sono due oggetti diversi. La corrispondenza interna non autentica la provenienza
e non dimostra il contenuto operativo delle ricevute. Il verificatore conserva
questa distinzione con `proves_operations: false` e
`authenticated_provenance: false`, anche quando `integrity_check.status` è
`MATCH`.

## Difetti riprodotti nel gateway allegato

Le richieste sono state invocate in-process tramite ASGI. DNS, socket e
trasporti HTTPX sono stati bloccati; le risposte esterne erano stub dichiarati.
Le prove riguardano questi byte del gateway e non il runtime Node o il sito.

| Caso | Risultato osservato |
| --- | --- |
| Segreto webhook assente | Il default pubblico `change-me` permette una risposta `PAID` / `PROVISIONED` |
| Importo −500, valuta invalida e provider arbitrario | HTTP 200 con pagamento e consegna dichiarati |
| Replay identico | Nuova ricevuta, senza idempotenza dimostrata |
| Sync anonimo con −42 record | HTTP 200, `AUTOMATED_BACKGROUND` e conteggio negativo |
| Provider AI simulato HTTP 429 | HTTP 200, `LIVE_AI`, risposta vuota e zero token |
| Provider CMS simulato `200 {}` | `PUBLISHED_REMOTE` e URL galleria costruito localmente |
| Provider WhatsApp simulato `200 {}` | Invio dichiarato con identificativo `unknown` |
| Preflight CORS da origine arbitraria | Origine autorizzata con credenziali |

I casi confermano difetti; non sono otto integrazioni riuscite. Le correzioni
necessarie includono autenticazione e tenant, consenso e quote server-side,
persistenza e idempotenza di ordini/provisioning, contratti dei provider e
gestione di errori o risposte incomplete. Il sorgente allegato non contiene
adattatori SMS/Messenger né una sincronizzazione effettiva Drive/Gmail/BI.

## Scanner HTTP corretto

`scripts/run_synapsy_full_audit.js` è un modulo ES: importarlo non avvia richieste
o download. L'esecuzione riceve esplicitamente i collegamenti da controllare.
Accetta URL assoluti o relativi dello stesso origin, conserva le query, esclude
frammenti e origini esterne, rifiuta redirect come prova del percorso originale,
applica timeout e interrompe il download dei body dopo gli header.

Un catalogo vuoto o una richiesta non riuscita produce `INCOMPLETE`.
`COMPLETE` significa soltanto che le richieste HTTP selezionate sono riuscite.
Il rapporto indica sempre `HTTP_REACHABILITY` e mantiene non verificati il
contenuto delle pagine, i flussi applicativi e l'accessibilità dei dispositivi.
Non usa un numero fisso di 87 percorsi. Un HTTP 200 può ancora essere una shell
SPA o una pagina non pertinente: servono asserzioni applicative separate.

La funzione di download è esplicita. Il digest SHA-256 include la descrizione
della serializzazione ed è qualificato come non autenticato. L'esempio browser
nei commenti presuppone che il file sia effettivamente servito dallo stesso
origin; il suo inserimento nel repository non lo pubblica automaticamente su
SYNAPSY. Fornire soltanto link le cui richieste GET siano sicure da ripetere.

## Prove remote osservate nella base

- [CI generale, run 43631166755](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/43631166755): success.
- [Validazione reporter, run 43631166672](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/43631166672): success.
- [Consegna prova CI, run 43631188026](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/43631188026): failure. Il log del job `report` mostra `SYNAPSY_WEBHOOK_SECRET` non disponibile e `CONFIGURATION REQUIRED`.

Il job fallito non va trasformato in successo né riavviato senza la correzione
di configurazione. Per il collegamento servono la stessa chiave di firma nel
secret Actions e nella configurazione del ricevitore, una consegna accettata
e il confronto di run/commit nel sito. La procedura esistente è in
[SYNAPSY_INFRASTRUCTURE_PROOF.md](SYNAPSY_INFRASTRUCTURE_PROOF.md).

## Test ripetibili delle correzioni

```bash
node --test tests/synapsy-route-audit.test.mjs tests/synapsy-release-preflight.test.mjs
npm test
```

I test esercitano normalizzazione, redirect/login, richieste esterne, timeout,
rilascio dei body, catalogo vuoto, integrità alterata, input non eseguiti,
protezione dei file e branch. I provider rimangono simulati e non viene avviata
alcuna scansione del sito dal vivo.

## Prove richieste prima del rilascio operativo

| Area | Evidenza ancora necessaria per questo pacchetto |
| --- | --- |
| Infrastruttura | Ricevuta coerente con run/commit; prove distinte di deploy, restart e recovery |
| Pagamento → consegna | Evento provider TEST verificato, ordine persistito, provisioning e replay idempotente |
| Messaggi | Utente autorizzato, consenso nel CRM, risposta valida del provider e callback di consegna |
| AI | Identità e quota server-side, risposta valida, gestione 429/errori e contabilizzazione persistita |
| Drive/Gmail/BI | Acquisizione reale, scritture persistite, conteggi e cursori riconciliati |
| CMS/store | Risposta provider valida, documento persistito e pubblicazione remota riscontrata |
| Mobile/accessibilità | Build identificata e prova sul dispositivo con tecnologie assistive |
| Percorsi e pulsanti | Catalogo atteso e scenari funzionali con asserzioni, oltre alla raggiungibilità HTTP |
