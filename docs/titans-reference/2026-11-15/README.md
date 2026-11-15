# TITANS Enterprise Read-Only — materiale di riferimento 0.1.2

**DESIGN_ONLY_NOT_INSTALLED. Questo ZIP non è un installer, un servizio API o un cluster Kubernetes.**

Contiene una skill di onboarding in sola lettura, il contratto proposto di otto
operazioni GET, un manifest descrittivo e controlli locali del contratto. La skill
`skills/seva-enterprise-onboarding/SKILL.md` è invariata, versione 1.0.0, e coincide
byte per byte con la competenza già presente nella sessione. La versione 0.1.2
riguarda soltanto questa revisione del materiale reference; il contratto API resta
0.1.0. Non vengono registrati tool, provider OAuth o endpoint attivi.

## Correzioni rispetto all'archivio ricevuto

- Il parser YAML controlla tutte le chiavi dei metodi: un `post` quotato, TRACE o
  un endpoint aggiuntivo non possono essere nascosti alle espressioni regolari.
- Tutti i server, compresi gli override per operazione, devono restare segnaposto;
  anche URL OAuth e riferimenti esterni sono controllati. Il validatore non apre URL.
- Gli `operationId` devono essere presenti e univoci. Scope dichiarati, richiesti e
  permessi del manifest devono essere coerenti, non vuoti e senza duplicati.
- Webhook e callback sono esclusi dal subset degli otto endpoint. Ogni endpoint
  deve richiedere il proprio scope: ad esempio, audit richiede `audit:read` e non
  può essere sostituito dal permesso generale `enterprise:read`.
- Chiavi YAML duplicate e dichiarazioni di installazione/pagamento/deployment
  incoerenti vengono respinte. Le prove negative verificano questi controlli.

## Eseguire i controlli locali

Prerequisiti già presenti nell'ambiente di audit: Python 3.11 o successivo e
PyYAML 6.x. Node.js serve soltanto per il wrapper compatibile. Nessuno script
installa dipendenze: se PyYAML manca, il controllo fallisce e va risolto nel proprio
ambiente di sviluppo, senza attribuire un risultato PASS.

```sh
python3 reference/tests/validate_contract.py
python3 reference/tests/test_contract_validation.py
node --test reference/tests/security.test.mjs
```

Se il Python corretto non è quello di sistema, impostare
`CODEX_PRIMARY_RUNTIME_PYTHON` nel solo ambiente del comando Node. L'audit usa un
namespace Linux senza rete esterna e copie locali; nessuna richiesta HTTP,
operazione provider o risorsa fatturabile è coinvolta.

## Significato dei risultati

PASS significa esclusivamente che il materiale soddisfa i controlli strutturali
implementati. Non è una validazione completa dello standard OpenAPI e non dimostra
autenticazione reale, PKCE, RBAC, isolamento dei tenant, redazione dei dati, audit
fail-closed, disponibilità del servizio o connettività Kubernetes.

Il piano `reference/tests/runtime-rbac-audit.todo.md` rimane da eseguire contro un
servizio TEST identificato e un identity provider di test. Restano da progettare
schemi di risposta specifici e limiti di paginazione per tutte le liste pertinenti.
Non sostituire `example.invalid` con un endpoint reale senza una nuova revisione
del servizio, dell'autorizzazione e delle relative prove.

## Contenuti mancanti per un runtime

Non sono inclusi backend, handler HTTP, configurazione OAuth, storage audit,
immagini container, Dockerfile, chart Helm, manifest Deployment/RBAC/Ingress,
kubeconfig, segreti o script di installazione. Il JSON infrastrutturale ricevuto
separatamente è un piano storico e non è incorporato come configurazione attiva.

Conservare l'archivio originale e questa revisione separatamente. Non reinstallare
la skill invariata per ottenere funzionalità che questo pacchetto non implementa.

La precedente reference 0.1.1 resta conservata come storico. La 0.1.2 aggiunge tre
prove negative per webhook, callback e assegnazione errata degli scope; la suite
comprende 21 casi (uno nominale e venti negativi), oltre al wrapper compatibile.
