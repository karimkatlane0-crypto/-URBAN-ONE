# Perimetro della copia pubblica

Questo dossier registra codice selezionato, manifest e prove pubblicabili. Il repository ospitante e il progetto Sites rimangono distinti: i sorgenti Sites non vengono sovrascritti nelle cartelle dell'applicazione Node/SQLite del repository ospitante.

## Esclusioni

Non sono inclusi database, credenziali, token, cookie, file ambiente, ricevute private, esportazioni di account, dati CRM, documenti privati, upload grezzi o log integrali delle connessioni. Non si copiano le cartelle private del progetto sorgente né il worker compilato contenente il bundle generale.

La verifica di pattern è un controllo aggiuntivo, non una certificazione di assenza di ogni dato sensibile. Le fonti selezionate devono avere revisione dei contenuti e hash nel manifest.

## Provenienza e limiti

Il manifest identifica commit sorgente e baseline. Le copie di file restano legate a quel commit, anche se il progetto viene aggiornato in seguito. Eventuali trasformazioni, omissioni e dipendenze devono essere dichiarate nel README. Un estratto non viene presentato come archivio completo o sostituto del deployment.

I test locali, i run CI, la pubblicazione di un artifact e una verifica su dispositivo sono prove differenti. Le etichette di stato riflettono solo quanto osservato. Un download Android precedente non dimostra la presenza delle modifiche Sites più recenti; un workflow iOS non dimostra una app pubblicata.

## Effetti della registrazione

La registrazione su branch dedicata non unisce codice su main, non attiva gateway, non crea prodotti, non pubblica campagne e non installa app sui dispositivi. Non richiede nuove chiavi. La licenza e i diritti del codice sorgente non vengono modificati dal dossier.

