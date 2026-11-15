# GitHub, website e app: prove disponibili

Verifica del 15 novembre 2026. Le prove seguenti riguardano il commit GitHub `9265943fbb00bee9249e222145f48ec76fd6cec0` e gli artifact indicati. Una prova riferita a un commit precedente non viene attribuita alla release Sites successiva.

## Repository e CI

Repository: [URBAN ONE](https://github.com/karimkatlane0-crypto/-URBAN-ONE). Branch predefinita: `main-@URBAN-ONE`. Alla lettura il riferimento era invariato rispetto al commit indicato.

| Prova | Esito osservato | Collegamento |
| --- | --- | --- |
| Test e verifica repository | Success | [ci](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/43642864891) |
| Suite SEVA Enterprise | Success | [SEVA Enterprise Phases II-III](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/43642864919) |
| GitHub Pages | Success | [pages build and deployment](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/43642863924) |
| Invio prova infrastrutturale | Failure | [SYNAPSY Infrastructure Proofs](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/43642892915) |

Il reporter si ferma perché richiede la configurazione di `SYNAPSY_WEBHOOK_SECRET`, con la stessa chiave di firma nel ricevitore. La chiave deve restare nelle configurazioni private dei due sistemi. Non è stata letta, impostata o inserita nel dossier. Il fallimento del reporter non annulla i run applicativi riusciti; non certifica neppure l'invio della prova al ricevitore.

Il dossier è conservato in una branch dedicata. I workflow di distribuzione e il codice applicativo esistenti non vengono sostituiti da questa documentazione.

## Website, Android e iOS

| Canale | Stato dimostrato | Verifica ancora necessaria |
| --- | --- | --- |
| SYNAPSY Website | Progetto Sites esistente; SHA e versione sono identificati nel manifest del dossier | La pubblicazione effettiva e la QA della relativa versione devono avere ricevute proprie |
| GitHub Pages | Run di pubblicazione riuscito sul commit sopra | Una navigazione live e le funzioni remote richiedono prove separate |
| Android locale | APK debug SEVA 2.5.0 disponibile nella release del 14 novembre | Installazione fisica, comportamento sul dispositivo e distribuzione Play non provati da quella release |
| Android Capacitor | Workflow per APK debug e AAB presente nel repository | Esecuzione sulla versione desiderata, firma e rilascio richiedono prove proprie |
| iOS Capacitor | Workflow che genera e archivia sorgente iOS | Compilazione firmata, dispositivo e approvazione App Store sono passi ulteriori |
| Apple App Store | Workflow manuale di archive/signing/upload ad App Store Connect | Account e credenziali Apple, ambiente protetto e processo di review |
| Google Play | Workflow manuale di firma e artifact AAB | Configurazione privata e pubblicazione sullo store; il workflow non pubblica automaticamente |

[Release APK Android debug osservata](https://github.com/karimkatlane0-crypto/-URBAN-ONE/releases/tag/seva-android-v2.5.0-offline-de6bf403). L'artifact è riferito a `de6bf403`, precedente al commit GitHub di riferimento. Non contiene automaticamente le modifiche della versione Sites 281 o successive.

## Fonti tecniche del repository

- [CI](https://github.com/karimkatlane0-crypto/-URBAN-ONE/blob/9265943fbb00bee9249e222145f48ec76fd6cec0/.github/workflows/ci.yml)
- [Reporter infrastruttura](https://github.com/karimkatlane0-crypto/-URBAN-ONE/blob/9265943fbb00bee9249e222145f48ec76fd6cec0/.github/workflows/synapsy-infrastructure-proof.yml)
- [Android Capacitor](https://github.com/karimkatlane0-crypto/-URBAN-ONE/blob/9265943fbb00bee9249e222145f48ec76fd6cec0/.github/workflows/android.yml)
- [Android offline](https://github.com/karimkatlane0-crypto/-URBAN-ONE/blob/9265943fbb00bee9249e222145f48ec76fd6cec0/.github/workflows/seva-android.yml)
- [Sorgente iOS](https://github.com/karimkatlane0-crypto/-URBAN-ONE/blob/9265943fbb00bee9249e222145f48ec76fd6cec0/.github/workflows/ios.yml)
- [App Store](https://github.com/karimkatlane0-crypto/-URBAN-ONE/blob/9265943fbb00bee9249e222145f48ec76fd6cec0/.github/workflows/app-store-release.yml)
- [Play signing](https://github.com/karimkatlane0-crypto/-URBAN-ONE/blob/9265943fbb00bee9249e222145f48ec76fd6cec0/.github/workflows/play-release.yml)

