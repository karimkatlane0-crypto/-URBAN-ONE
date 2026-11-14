# SYNAPSY — Integrazione delle prove CI URBAN ONE

Versione 1.0.0 · 14 novembre 2026 · Node.js 22 o successivo.

## Cosa viene integrato

Il workflow `SYNAPSY Infrastructure Proofs` raccoglie l'esito reale del workflow
GitHub Actions `ci` nel repository `karimkatlane0-crypto/-URBAN-ONE`, ramo
`main-@URBAN-ONE`. Conserva repository, workflow, esecuzione, tentativo, commit,
esito e data di completamento. Usa il ricevitore già presente in SYNAPSY:

`POST https://seva.karimkatlane0.chatgpt.site/api/infrastructure/events/pipeline`

I controlli locali su push e pull request non usano segreti o provider. La
consegna avviene solo per un evento GitHub `workflow_run` concluso di `ci`,
originato da push o avvio manuale sul ramo principale del repository atteso.
Il job di consegna carica il reporter dal ramo principale attendibile e non
esegue il commit né gli artifact prodotti dal workflow osservato.

Il file allegato iniziale inviava tre `SUCCESS` fissi senza eseguire le prove e
usava un endpoint e una firma diversi dal contratto del sito. Questa versione
sostituisce quelle dichiarazioni con l'esito della CI realmente ricevuto da
GitHub. Non esegue deploy, riavvii o simulazioni di guasto.

## File e posizione

| File nello ZIP | Destinazione nel repository |
| --- | --- |
| `.github/workflows/synapsy-infrastructure-proof.yml` | Stesso percorso |
| `scripts/synapsy-infrastructure-proof.mjs` | Stesso percorso |
| `tests/synapsy-infrastructure-proof.test.mjs` | Stesso percorso |
| `README.md` | Guida di integrazione |

La presenza del workflow sul ramo predefinito è necessaria per ricevere gli
eventi `workflow_run`. Il solo download del kit non configura la connessione.

## Configurazione protetta

1. Predisporre una chiave casuale di 32 byte, rappresentata da 64 caratteri
   esadecimali minuscoli, tramite un gestore di segreti. Non inserirla nel
   sorgente, nei log, nelle issue o in chat.
2. In GitHub, aggiungerla come secret Actions `SYNAPSY_WEBHOOK_SECRET` nel
   repository URBAN ONE. Non è un token GitHub e non è la firma del webhook Meta.
3. Nel gestore delle variabili runtime del sito, configurare il segreto
   `SEVA_INFRASTRUCTURE_CONFIG`. Preservare un'eventuale sorgente `kubernetes`
   già presente; usare una chiave distinta per quella sorgente.
4. Il campo `pipeline` deve contenere esattamente questi identificativi e la
   stessa chiave del punto 2 nel campo `secret`:

```json
{
  "pipeline": {
    "source": "synapsy-urban-one-ci",
    "repository": "karimkatlane0-crypto/-URBAN-ONE",
    "workflow": "ci",
    "secret": "INSERIRE_SOLO_NEL_GESTORE_SEGRETI_LA_CHIAVE_HEX_DI_64_CARATTERI"
  }
}
```

5. Applicare la configurazione runtime secondo il flusso di pubblicazione del
   sito. Al prossimo completamento valido di `ci`, il reporter invierà
   l'esito. Accedere come titolare a `/infrastructure`, scegliere
   **Verifica collegamenti** e confrontare run, commit ed esito con GitHub.

Se la chiave manca o ha un formato errato, il job termina con
`CONFIGURATION REQUIRED` senza inviare richieste. La configurazione da sola
non dimostra una ricezione. Il collaudo dal vivo si conclude soltanto con la
ricevuta dello stesso run e commit nel sito.

## Firma, ricevuta e limiti

Il payload usa lo schema versione 1 del ricevitore esistente. L'ID evento è
un UUID deterministico per sorgente, repository, workflow, run e tentativo.
La firma è HMAC-SHA256 sui byte UTF-8 di `timestamp + "." + body`, con la
chiave decodificata dall'esadecimale. Gli header sono `X-SEVA-Timestamp` e
`X-SEVA-Signature: v1=HEX`.

La consegna riesce soltanto con HTTP 202, JSON valido, `accepted: true`,
`updated` booleano, lo stesso `eventId` e `externalJobsStarted: 0`. Redirect,
risposte HTML, errori HTTP, timeout e ricevute incoerenti terminano con errore.

Il ricevitore conserva solo l'ultimo segnale di ciascuna sorgente. Ordine e
freschezza della pipeline dipendono dalla data `updated_at` dell'evento GitHub
concluso, conservata come `completedAt`, non dall'ora di invio. Un rapporto
duplicato o precedente non aggiorna il record. Dopo 24 ore il segnale è
indicato come non recente. Non è una cronologia completa né un audit immutabile.

La firma autentica la sorgente configurata. Lo stato del sito mantiene
`independentlyVerified: false`: un risultato CI non certifica indipendentemente
il provider, il deploy del sito, un riavvio senza interruzioni o un recupero.

| Prova | Evidenza richiesta |
| --- | --- |
| CI | Run concluso, commit, tentativo ed esito GitHub corrispondenti alla ricevuta |
| Deploy | Ricevuta del provider, versione realmente distribuita e controllo della disponibilità |
| Riavvio | Operazione identificata e osservazioni prima/dopo nell'ambiente autorizzato |
| Recupero | Guasto autorizzato in ambiente di prova e osservazione del recupero |

## Verifica locale

```sh
node --test tests/synapsy-infrastructure-proof.test.mjs
```

I test del repository usano eventi e risposte sintetici. Nel progetto Sites,
la regressione aggiuntiva verifica anche mittente → Worker compilato → SQLite
→ lettura riservata al titolare. Queste prove non producono ricevute reali su
GitHub o nel database di produzione.

## Accessi ufficiali

- Sito principale: https://seva.karimkatlane0.chatgpt.site
- Centro operativo TITANS: https://seva.karimkatlane0.chatgpt.site/titans/completamento
- Azioni territoriali: https://seva.karimkatlane0.chatgpt.site/territorio/azioni
- Backup del workspace: https://seva.karimkatlane0.chatgpt.site/workspace/backup
- Verifica funzioni: https://seva.karimkatlane0.chatgpt.site/funzionalita#verifica
- Infrastruttura: https://seva.karimkatlane0.chatgpt.site/infrastructure#synapsy-proof
- Repository: https://github.com/karimkatlane0-crypto/-URBAN-ONE

Per iniziare a lavorare, aprire TITANS. Per condividere il progetto, usare il
sito principale. I collegamenti alle aree personali aprono l'account di chi
accede, senza condividere i dati del titolare.

## Provenienza e riferimenti

- Allegato di partenza: `synapsy-infrastructure-proof.yml`.
- SHA-256 originale: `58b9e47dffeee4eb2575c5af8179d93daa1a920e8c361daeafa0113022b4671d`.
- Contratto del ricevitore: sorgente Sites `src/infrastructure.js`.
- Documentazione GitHub: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run

La verifica della configurazione effettuata il 14 novembre 2026 prima del
rilascio non ha rilevato `SEVA_INFRASTRUCTURE_CONFIG` nel sito. Il secret di
GitHub non è stato letto né configurato in quella verifica. Lo stato corrente
va controllato dal titolare nei due ambienti e nella prima ricevuta.
