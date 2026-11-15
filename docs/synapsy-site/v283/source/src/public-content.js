import {renderServiceCallOffer} from './service-call-offer.js';
import {renderFreeServiceTools,renderEnterpriseOnboardingOffer} from './payment-center.js';

function serviceCatalogueContent(language='it'){
 const en=language==='en',t=(it,eng)=>en?eng:it,suffix=en?'?lang=en':'';
 return {
  title:t('Strumenti gratuiti. Assistenza con un risultato concordato.','Free tools. Assistance with an agreed result.'),
  tag:'SYNAPSY · SEVA · SERVIZI',
  intro:t('Inizia dagli strumenti disponibili. Se serve assistenza sul tuo sito, definisci il risultato e il perimetro prima di pagare.','Start with the available tools. If you need assistance on your site, define the result and scope before paying.'),
  sections:[
   [t('1. Usa gli strumenti gratuiti','1. Use the free tools'),renderFreeServiceTools(language)],
   [t('2. Concorda l’assistenza','2. Agree the assistance'),renderEnterpriseOnboardingOffer(language)+`<details id="onboarding-partner"><summary>${t('Altri percorsi e onboarding partner','Other journeys and partner onboarding')}</summary><h3>URBAN ONE — ${t('Onboarding partner','Partner onboarding')}</h3><p>${t('Preparazione dei requisiti, raccolta delle evidenze e prossimi passi con i provider. Per attività diverse dall’incarico Enterprise descritto sopra, prezzo, tempi e prestazioni dipendono da un accordo separato.','Prepare requirements, evidence and next steps with providers. For work outside the Enterprise assignment above, price, timing and deliverables require a separate agreement.')}</p><p>${t('InfoCert, Fabrick e gli altri provider gestiscono contratti, abilitazioni e costi propri. Un pagamento SEVA non li attiva.','InfoCert, Fabrick and other providers manage their own contracts, activation and costs. A SEVA payment does not activate them.')}</p><a class="btn" href="/app?section=business">${t('Descrivi un altro bisogno','Describe another need')} →</a>${renderServiceCallOffer(language)}</details>`],
   [t('3. Paga solo il servizio concordato','3. Pay only for the agreed service'),`<div id="servizi-concordati"><p>${t('Controlla il risultato da consegnare, il totale, le imposte comprese, i tempi e le condizioni del preventivo. Il link da 500 € resta utilizzabile anche per altri incarichi già concordati: l’importo da solo non identifica la prestazione.','Check the deliverable, total, included taxes, timing and quote terms. The €500 link remains available for other agreed assignments: the amount alone does not identify the service.')}</p><a class="btn" href="/acquista${suffix}">${t('Ho un accordo: apri i pagamenti','I have an agreement: open payments')} →</a><p>${t('La richiesta non avvia addebiti. Pagamento, verifica dell’incasso e consegna sono passaggi distinti. Nessun abbonamento o accesso automatico viene attivato.','An enquiry starts no charge. Payment, receipt verification and delivery are separate steps. No subscription or automatic access is activated.')}</p><p><a href="/terms${suffix}">${t('Termini','Terms')}</a> · <a href="/payments${suffix}">${t('Stato dei pagamenti','Payment status')}</a> · <a href="/support${suffix}">${t('Assistenza','Support')}</a></p></div>`]
  ]
 };
}
export const PUBLIC_CONTENT = {
  "servizi": {"it":serviceCatalogueContent('it'),"en":serviceCatalogueContent('en')},
  "terms": {
    "it": {
      "title": "Termini e condizioni",
      "tag": "SEVA · VERSIONE 1.1",
      "intro": "Le regole del workspace gratuito e delle richieste di collaborazione. In vigore dal 3 novembre 2026. Avviso sul diritto d’autore e sezione Premium aggiornati il 15 novembre 2026.",
      "sections": [
        ["Premium Pro · Candidature e condizioni proposte", "<p><a href=\"/premium\">Premium Pro</a> consente candidature personali volontarie, ricerca per criteri dichiarati e richieste di autorizzazione da un operatore identificato con nome e società dichiarati. L’identità professionale e il possesso del telefono non sono verificati. La candidatura e la richiesta di autorizzazione sono gratuite. Non sono garantiti clienti, disponibilità immobiliari, incarichi o conversioni.</p><p>Le proposte economiche del 15 novembre 2026 sono 1 € per consultazione di un contatto autorizzato e 200 € per Premium Pro, con periodicità e servizi inclusi ancora da definire. Il trattamento fiscale e le condizioni commerciali vanno confermati. Questi due nuovi servizi non consentono ancora acquisti, addebiti, rinnovi o consultazione dei recapiti. I checkout dei servizi precedenti restano distinti.</p><p>Non caricare dati di terzi, elenchi acquistati o dati ricavati da profili personali. Le preferenze promozionali sono facoltative; una richiesta nominativa e la sua eventuale approvazione non autorizzano campagne indiscriminate.</p>"],
        ["Competenze pubbliche e passeggiate settoriali", "<p>Il plugin SEVA Enterprise Onboarding e il <a href=\"/onboarding/competenze\">catalogo delle competenze</a> forniscono procedure da consultare. Copiare un testo non installa un servizio, non concede nuovi permessi e non attiva provider, cluster o agenti persistenti. L’uso operativo dipende dagli strumenti autorizzati nell’applicazione ospite. La disponibilità dei testi sul sito è distinta dall’approvazione nella directory pubblica dei plugin.</p><p><a href=\"/territorio\">Territorio</a> organizza i temi INSPIRE e prepara un piano locale con coordinate scelte dall’utente. La distanza mostrata è in linea d’aria; indicazioni a piedi e condizioni dei percorsi dipendono dal servizio cartografico aperto e dalla situazione reale. Il catalogo dei temi non garantisce che ogni dataset europeo sia collegato, completo o aggiornato. Civici e dati geografici non dimostrano disponibilità commerciale degli immobili.</p>"],
        ["KKUBERA 4 · Disponibilità per unità", "<p><a href=\"/kkubera/4\">KKUBERA 4</a> registra dichiarazioni private su singole unità. Vendita e locazione hanno stati separati, con fonte, data della prova e data di ricontrollo. Un civico può comprendere più unità; non autorizza a estendere uno stato a tutto l’edificio. Mancanza di dati significa disponibilità sconosciuta. Prove scadute richiedono una nuova verifica. Il salvataggio non conferma il contenuto presso un provider, non crea un annuncio e non accerta proprietà o diritti. Nessun feed commerciale è attivato da questa funzione.</p><p>Le indicazioni a piedi aprono Google Maps soltanto su richiesta, con l’indirizzo e l’eventuale posizione rilevata. Controlla sul servizio esterno che la destinazione risolta sia corretta. La lettura vocale usa una voce locale compatibile, se disponibile sul dispositivo; non viene attivata una sottoscrizione Push.</p>"],
        [
          "1. Chi offre SEVA",
          "<p>SEVA è un progetto indipendente di Karim Katlane, contattabile a <a href=\"mailto:karimkatlane0@gmail.com\">karimkatlane0@gmail.com</a>. Queste condizioni riguardano il sito, il workspace e gli strumenti gratuiti di calcolo e stato SEVA collegati a ChatGPT o Codex.</p><p>OpenAI, ChatGPT, Codex ed EY sono nomi dei rispettivi titolari. La loro menzione non indica affiliazione, certificazione, rappresentanza o partnership con SEVA.</p>"
        ],
        [
          "2. Cosa puoi usare",
          "<p>SEVA Base è gratuito: organizza obiettivi, criteri ed evidenze; registra richieste e offerte manuali; prepara un brief AI; conserva un registro assistenza; esporta i tuoi dati. Puoi scegliere di sincronizzare gli obiettivi nel tuo account.</p><p>Il registro assistenza personale non invia messaggi ai tuoi clienti. “Contatta SEVA”, Community e Business inviano invece la richiesta al titolare e permettono di leggere la risposta nel workspace.</p>"
        ],
        [
          "3. Accesso e uso responsabile",
          "<p>Il workspace richiede l’accesso tramite ChatGPT. Rispetta le condizioni e i requisiti di età del servizio di accesso; se non hai la capacità di concludere autonomamente un accordo, occorre l’assistenza di chi ne ha titolo. Proteggi il tuo account e usa un dispositivo adeguato.</p><p>Inserisci soltanto contenuti che puoi utilizzare legittimamente. Non caricare password, documenti d’identità, dati sanitari o finanziari di terzi; non utilizzare il servizio per spam, frodi, discriminazione o accessi non autorizzati. Le dichiarazioni accademiche inserite dall’utente non sono verifiche universitarie.</p>"
        ],
        [
          "4. Dati e contenuti",
          "<p>I diritti sui tuoi contenuti restano tuoi. SEVA li tratta per rendere disponibili le funzioni richieste secondo l’<a href=\"/privacy\">informativa privacy</a>. Non vengono concessi diritti di pubblicazione promozionale dei tuoi contenuti o del tuo nome con la sola registrazione.</p><p>Foto, contatti nelle richieste e catalogo manuale rimangono nel browser. Schede e attività CRM sono salvate online quando lo scegli. Conserva una copia esportata quando ti serve. L’eliminazione locale non cancella i dati salvati online: usa i controlli delle relative sezioni o chiedi assistenza.</p>"
        ],
        [
          "5. AI, modelli ed evidenze",
          "<p>SEVA prepara testo che scegli di copiare o scaricare e inviare al tuo provider AI. Non esegue inferenza automatica nel workspace pubblico, non raccoglie chiavi API fuori dal pilota BYOK volontario e non include abbonamenti o credito ChatGPT, OpenAI o altri provider.</p><p>I 10.000 comandi sono combinazioni di istruzioni da consultare e adattare, non 10.000 agenti autonomi. Verifica le risposte AI e le fonti prima di usarle. Una spunta o un’evidenza inserita dall’utente non costituisce certificazione indipendente.</p>"
        ],
        [
          "6. Prezzi e pagamenti",
          "<p>SEVA Base non prevede addebiti. I checkout Stripe TEST sono riservati al titolare per collaudo: importi e rinnovi sono simulati e non acquistano servizi commerciali.</p><p>Le offerte Enterprise, Acquisti ed E-commerce a pagamento non sono ancora ordinabili online. Una richiesta di preventivo non è un ordine, non autorizza addebiti e non iscrive a rinnovi. Prima di qualsiasi acquisto devono essere comunicati venditore, servizio incluso, prezzo totale, imposte, durata, consegna, assistenza e condizioni applicabili.</p><p>Gli eventuali costi del tuo provider AI sono separati e dipendono dal contratto che hai con quel provider.</p>"
        ],
        [
          "7. Assistenza, modifiche e disponibilità",
          "<p>Puoi scrivere all’indirizzo sopra indicato o utilizzare <a href=\"/app?section=contact\">Contatta SEVA</a>. Non è un servizio di emergenza e non è promesso un tempo di risposta contrattuale. Segnala errori o barriere di accessibilità con il percorso seguito e il risultato atteso, evitando dati riservati.</p><p>Le funzioni possono essere aggiornate. La versione e la data di queste condizioni sono pubblicate qui; le modifiche non trasformano il servizio gratuito in un abbonamento senza una tua scelta espressa. In caso di sospensione per abusi o problemi di sicurezza, sarà fornita una spiegazione quando possibile e compatibile con la sicurezza.</p>"
        ],
        [
          "8. Diritti e controversie",
          "<p>Nessuna clausola limita diritti inderogabili, garanzie previste dalla legge o responsabilità che non possano essere escluse. Non sono promessi guadagni, risultati economici, credito, decisioni professionali o disponibilità continua.</p><p>Il riferimento è la legge italiana, senza privare il consumatore delle tutele inderogabili del proprio paese quando applicabili. Restano ferme le regole di competenza a tutela del consumatore. Per prima cosa puoi inviare un reclamo al contatto SEVA; ciò non limita l’accesso alle autorità o al giudice competente.</p>"
        ],
        [
          "Offerta SEVA CMS mensile",
          "<p>SEVA CMS: 250 € al mese, IVA applicabile esclusa. Il primo abbonamento comprende un mese di calendario gratuito, con data di scadenza indicata nel checkout. Dal secondo mese il pagamento si rinnova mensilmente dopo accettazione espressa. L’offerta riguarda gli strumenti del workspace ospitato e l’editor CMS; pubblicazione su siti esterni e assistenza personalizzata richiedono un accordo distinto.</p><p>Il checkout è predisposto ma la vendita non è aperta: restano da completare credenziali server, configurazione IVA e collaudo con il provider. Nessun account esistente viene abbonato o addebitato automaticamente. L’eventuale durata proposta di tre anni richiede un accordo separato esplicito e non decorre dall’uso del sito gratuito. SEPA dipende dall’abilitazione del provider e dal mandato del cliente. Abbonamenti ChatGPT e consumo API AI sono separati.</p>"
        ],
        [
          "Link di affiliazione Amazon",
          "<p>La <a href=\"/amazon\">guida studenti Amazon di SEVA</a> contiene un link pubblicitario di affiliazione, segnalato chiaramente. In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei. Questo non costituisce un’approvazione o una certificazione Amazon.</p><p>Il link include un codice di affiliazione pubblico e il browser può comunicare l’origine del sito SEVA. SEVA non trasmette profilo, matricola o email tramite questo link e non incorpora script o pixel di tracciamento Amazon. Se scegli di aprire Amazon, si applicano le sue informative privacy e cookie. Amazon gestisce idoneità, abbonamento, pagamento e disdetta. Nessun pagamento Amazon viene elaborato da SEVA.</p>"
        ],
        [
          "API personale — pilota BYOK",
          "<p>Il pilota consente agli account abilitati di collegare una chiave OpenAI dedicata. I consumi sono fatturati dal provider al progetto della chiave, separatamente da SEVA e da ChatGPT. La disponibilità del modello e del credito dipende dal tuo account. SEVA non passa alla chiave del titolare se la tua richiesta fallisce.</p><p>La chiave viene trasmessa via HTTPS al server SEVA e conservata cifrata, associata al tuo account. Il server la decifra esclusivamente per l’invio che confermi a OpenAI. Questa è custodia server, non cifratura end-to-end. Non è inclusa negli export o restituita al browser dopo il salvataggio. Chi gestisce l’infrastruttura mantiene responsabilità di accesso amministrativo.</p><p>Solo il brief confermato è inviato al provider; SEVA non archivia prompt o risposte di questo percorso. Chiede al provider di non conservare la risposta come oggetto recuperabile, ma si applicano comunque le sue condizioni di trattamento e conservazione. SEVA registra identificativi, orari, esiti e conteggi dei token, senza testo o chiave: i record più vecchi di 30 giorni vengono rimossi alla richiesta successiva; se non usi più il servizio puoi chiederne la cancellazione al titolare.</p><p>Puoi rimuovere il collegamento da SEVA. La rimozione riguarda l’archivio attivo; eventuali copie di backup seguono i tempi dell’infrastruttura. Per invalidare la chiave anche nelle copie o presso altri servizi devi revocarla nel tuo account OpenAI. Le richieste già inviate possono completarsi e generare consumi. Limiti del pilota: 20 tentativi al giorno UTC, uno al minuto, 12.000 caratteri di input e 900 token di output; si applica anche il limite prudenziale in USD impostato in AI e fonti. Nessun invio o nuovo tentativo automatico.</p>"
        ],
        [
          "Campagne, compensi e trattenuta SEVA",
          "<p><a href=\"/engage\">Il percorso campagne</a> serve a proporre una valutazione volontaria remunerata di prodotti o servizi. Prima di aderire la persona vede attività, criteri, condizioni, compenso netto proposto e trattenuta SEVA. L’attività non richiede un acquisto o un giudizio positivo. Il responsabile deve essere autorizzato dal negozio e indicare condizioni e termine di pagamento.</p><p>Il registro non custodisce fondi, non incassa il budget e non esegue trasferimenti automatici. La copertura del budget e le ricevute inserite sono dichiarazioni del responsabile, del partecipante o del titolare SEVA; non sono una verifica indipendente del provider. La trattenuta è il riparto proposto del budget per l’attività accettata, distinto dal programma commissioni creator. Le ricevute dichiarate non vengono presentate come missione conclusa con incassi riconciliati.</p>"
        ],
        [
          "Ascolto, dispositivi e permessi",
          "<p>La modalità <a href=\"/senses\">Parla, ti ascolto</a> offre dettatura, lettura, foto, registrazione locale di audio/video e posizione su richiesta, secondo la compatibilità del browser. I permessi si scelgono separatamente. Il consenso a una funzione non autorizza le altre né un invio automatico di dati.</p><p>Leggi e copia le <a href=\"/senses#deviceTerms\">condizioni specifiche del servizio Ascolto</a>. Le richieste AI confermate richiedono accesso e configurazione del provider; possono generare costi API separati. Chiamate e messaggi vengono completati nelle app esterne scelte dall’utente.</p>"
        ],
        [
          "Diritto d’autore e licenze",
          "<div id=\"copyright\"><p><strong>© 2026 Karim Katlane. Tutti i diritti riservati.</strong></p><p>SEVA Intelligence Studio è un progetto di Karim Katlane. Titolare, ideatore e inventore dichiarato del progetto: Karim Katlane. Account proprietario del sito: karimkatlane0@gmail.com. La dicitura di inventore è un’attribuzione del titolare, non attesta un brevetto o un riconoscimento ufficiale. Il sito ufficiale unico è https://seva.karimkatlane0.chatgpt.site; i numeri di revisione identificano la cronologia dello stesso sito. L’avviso riguarda i contenuti originali tutelabili e i diritti di cui Karim Katlane è titolare: testi, contributi creativi al logo e alla grafica, organizzazione originale delle pagine, documentazione e codice del progetto, nei limiti previsti dalla legge.</p><p>Salve le eccezioni di legge e le licenze espressamente indicate, la riproduzione, distribuzione, modifica e utilizzazione commerciale di tali materiali richiedono l’autorizzazione scritta di Karim Katlane. Per richieste di utilizzo: <a href=\"mailto:karimkatlane0@gmail.com\">karimkatlane0@gmail.com</a>.</p><p>Restano esclusi i contenuti degli utenti, le immagini astronomiche, i marchi, i dati, il software open source e gli altri materiali di terzi: appartengono ai rispettivi titolari o sono disponibili secondo il proprio regime di pubblico dominio e le licenze applicabili. I crediti, gli obblighi di attribuzione e le licenze già concesse restano validi. L’avviso non attribuisce a Karim Katlane diritti esclusivi su questi materiali.</p><p>Il logo corrente è stato fornito dal titolare il 15 novembre 2026. L’originale e la versione precedente sono conservati nella cronologia del progetto. L’attribuzione non sostituisce la verifica dei diritti applicabili. Per eventuali contenuti assistiti dall’AI, la protezione dipende dalla legge e dai contributi creativi umani effettivi. Idee, metodi e funzionalità in quanto tali non diventano esclusivi attraverso questo avviso.</p><p>La pubblicazione di questa dicitura non costituisce una registrazione, un deposito ufficiale, una registrazione del marchio o una certificazione della titolarità e non impedisce tecnicamente la copia.</p></div>"
        ]
      ]
    },
    "en": {
      "title": "Terms and conditions",
      "tag": "SEVA · VERSION 1.1",
      "intro": "Rules for the free workspace and collaboration enquiries. Effective 3 November 2026. Copyright notice and Premium section updated on 15 November 2026.",
      "sections": [
        ["Premium Pro · Applications and proposed terms", "<p><a href=\"/premium?lang=en\">Premium Pro</a> supports voluntary personal applications, declared-criteria searches and permission requests from a professional using a self-declared name and company. Professional identity and phone ownership are unverified. Applications and permission requests are free. Customers, property availability, mandates and conversions are not guaranteed.</p><p>The proposals dated 15 November 2026 are €1 per authorised contact consultation and €200 for Premium Pro, with billing period and included services still to be defined. Tax treatment and sale terms require confirmation. These two new offers do not yet enable purchases, charges, renewals or access to contact details. Existing service checkouts remain separate.</p><p>Do not upload other people’s details, purchased lists or personal-profile data. Promotional preferences are optional; a named request or approval does not authorize indiscriminate campaigns.</p>"],
        ["Public skills and sector walks", "<p>The SEVA Enterprise Onboarding plugin and <a href=\"/onboarding/competenze?lang=en\">skill catalog</a> provide procedures to consult. Copying text does not install a service, grant new permissions or activate providers, clusters or persistent agents. Operational use depends on authorized tools in the host application. Public text availability on this website is separate from approval in a public plugin directory.</p><p><a href=\"/territorio\">Territory</a> organizes INSPIRE themes and prepares a local plan with user-selected coordinates. The displayed distance is straight-line distance; walking directions and route conditions depend on the mapping service opened and actual conditions. The theme catalog does not guarantee every European dataset is connected, complete or current. Addresses and spatial data do not establish commercial property availability.</p>"],
        ["KKUBERA 4 · Availability by unit", "<p><a href=\"/kkubera/4?lang=en\">KKUBERA 4</a> records private declarations about individual units. Sale and rental have separate states, with a source, evidence date and review date. An address may contain several units; one unit’s state does not apply to the entire building. Missing data means unknown availability. Expired evidence requires another check. Saving does not confirm the content with a provider, create a listing or establish ownership or rights. This feature activates no commercial feed.</p><p>Walking directions open Google Maps only on request, with the address and optional measured origin. Check the resolved destination on the external service. Speech uses a compatible local voice when the device offers one; it does not activate a Push subscription.</p>"],
        [
          "1. Who provides SEVA",
          "<p>SEVA is an independent project by Karim Katlane. Contact: <a href=\"mailto:karimkatlane0@gmail.com\">karimkatlane0@gmail.com</a>. These terms cover the SEVA website, workspace and connected free calculation and readiness tools in ChatGPT or Codex.</p><p>OpenAI, ChatGPT, Codex and EY belong to their respective owners. Mentioning them does not imply affiliation, certification, representation or partnership with SEVA.</p>"
        ],
        [
          "2. Available features",
          "<p>SEVA Basic is free: organize goals, acceptance criteria and evidence; record requests and manually entered offers; prepare an AI brief; keep a service register; export your data. You can choose to sync goals to your account.</p><p>Your personal service register does not message your customers. Contact SEVA, Community and Business enquiries are sent privately to the project owner, with replies available in your workspace.</p>"
        ],
        [
          "3. Access and responsible use",
          "<p>The workspace requires ChatGPT sign-in. Follow the sign-in provider’s terms and age requirements. If you cannot independently enter an agreement, involve an authorized parent or representative. Protect your account and choose a suitable device.</p><p>Only submit content you are entitled to use. Do not submit passwords, identity documents, sensitive health data or third-party financial records. Do not use SEVA for spam, fraud, discrimination or unauthorized access. Student declarations are not university verification.</p>"
        ],
        [
          "4. Your content and data",
          "<p>You retain your rights in your content. Processing is described in the <a href=\"/privacy?lang=en\">privacy notice</a> and supports the features you request. Signing up does not grant permission to publish your name or content for promotion.</p><p>Photos, contacts in personal requests and your manual catalog remain in your browser. CRM records and activities are saved online when you choose to save them. Export a copy when needed. Local deletion does not delete online records: use the relevant section’s controls or request assistance.</p>"
        ],
        [
          "5. AI and evidence",
          "<p>SEVA prepares a brief for you to copy or download and submit to your own AI provider. The public workspace does not run automatic AI inference, collect API keys outside the opt-in BYOK pilot or include ChatGPT, OpenAI or other provider subscriptions or credit.</p><p>The 10,000 commands are combinations of instructions to consult and adapt, not 10,000 autonomous agents. Check AI answers and sources before relying on them. User-recorded evidence is not independent certification.</p>"
        ],
        [
          "6. Prices and payments",
          "<p>SEVA Basic carries no charge. Stripe TEST checkouts are owner-only trials: amounts and renewals are simulated and do not buy commercial services.</p><p>Paid Enterprise, Purchasing and E-commerce plans are not available to order online. A proposal enquiry is not an order and does not authorize charges or renewals. Any future purchase must first specify the seller, scope, total price, taxes, duration, delivery, support and applicable conditions.</p><p>Your AI provider’s fees are separate and depend on your own provider agreement.</p>"
        ],
        [
          "7. Support and changes",
          "<p>Email the contact above or use <a href=\"/app?section=contact\">Contact SEVA</a>. This is not an emergency service and no contractual response time is offered. Report errors and accessibility barriers with reproduction steps and the expected outcome, without confidential data.</p><p>Features may change. The version and effective date of these terms are displayed here. Changes do not convert free access into a paid subscription without your express choice. Where possible and consistent with security, we will explain suspensions due to abuse or security issues.</p>"
        ],
        [
          "8. Rights and disputes",
          "<p>Nothing here limits mandatory rights, statutory guarantees or liability that cannot lawfully be excluded. SEVA does not promise earnings, economic outcomes, credit, professional decisions or uninterrupted availability.</p><p>Italian law applies without removing any mandatory consumer protections applicable in your country. Mandatory consumer jurisdiction rules remain unaffected. You can raise a complaint with SEVA; this does not restrict recourse to a competent authority or court.</p>"
        ],
        [
          "SEVA CMS monthly offer",
          "<p>SEVA CMS: €250 per month excluding applicable VAT. The first subscription includes one free calendar month, with the exact end date shown at checkout. From month two, billing renews monthly after explicit acceptance. Hosted workspace tools and the CMS editor are the proposed scope; deployment to external sites and bespoke assistance require a separate agreement.</p><p>The checkout is prepared but sales are not open: server credentials, tax configuration and complete provider validation are still required. No existing account is enrolled or charged automatically. Any proposed three-year term requires a separate explicit agreement and is not started by using the free site. SEPA depends on provider eligibility and a customer mandate. ChatGPT subscriptions and AI API usage are separate.</p>"
        ],
        [
          "Amazon affiliate links",
          "<p>The <a href=\"/amazon?lang=en\">SEVA Amazon student guide</a> contains a clearly labelled advertising affiliate link. As an Amazon Associate I earn from qualifying purchases. This does not constitute an endorsement or certification by Amazon.</p><p>The link includes a public affiliate tag and may send the SEVA website origin through the browser. SEVA does not send your profile, student number or email through this link and embeds no Amazon tracking script or pixel. When you choose to open Amazon, its own privacy and cookie policies apply. Amazon manages offer eligibility, subscription, payment and cancellation. No Amazon payment is processed by SEVA.</p>"
        ],
        [
          "Personal API — BYOK pilot",
          "<p>Enabled accounts can connect a dedicated OpenAI API key. The provider bills the key’s project separately from SEVA and ChatGPT. Model availability and credit depend on your account. SEVA never falls back to the owner’s key.</p><p>The key is sent over HTTPS to the SEVA server and stored encrypted, scoped to your account. The server decrypts it to send requests you explicitly confirm to OpenAI. This is server custody, not end-to-end encryption. The key is excluded from exports and never returned to the browser after storage; infrastructure administrators retain administrative responsibilities.</p><p>Only the confirmed brief is sent to OpenAI. SEVA does not store prompt or response text for this feature. Provider response storage is disabled, but the provider’s own processing and retention terms still apply. SEVA stores request identifiers, times, status and token counts without keys or content. Records older than 30 days are removed on the next request; inactive users may request deletion from the controller.</p><p>Disconnecting removes the credential from the active SEVA store. Infrastructure backups follow infrastructure retention; revoke the key in OpenAI to invalidate it everywhere. In-flight requests may complete and incur costs. Pilot limits: 20 attempts per UTC day, one per minute, 12,000 input characters and 900 output tokens. A separate conservative spending cap is configured in AI and sources. No automatic calls or retries.</p>"
        ],
        [
          "Campaigns, compensation and the SEVA fee",
          "<p><a href=\"/engage\">The campaign workflow</a> supports proposals for voluntary paid product or service assessments. Before joining, a person sees the task, acceptance criteria, terms, proposed net compensation and SEVA fee. No purchase or positive opinion is required. The manager must be authorized by the merchant and specify payment terms and timing.</p><p>The register does not hold funds, collect the budget or execute automatic transfers. Budget coverage and entered receipts are declarations by the manager, participant or SEVA operator, not independent provider verification. The fee is a proposed allocation for accepted work and is separate from the creator commission programme. Declared receipts are not presented as reconciled completion.</p>"
        ],
        [
          "Listening, devices and permissions",
          "<p><a href=\"/senses?lang=en\">Speak, I’m listening</a> offers dictation, reading, photos, local audio/video recording and on-demand location, subject to browser support. Permissions are separate. Consent to one feature does not authorise others or automatic data submission.</p><p>Read and copy the <a href=\"/senses?lang=en#deviceTerms\">Listening service conditions</a>. Confirmed AI requests require sign-in and provider setup and may incur separate API charges. Calls and messages are completed in the external apps chosen by the user.</p>"
        ],
        [
          "Copyright and licences",
          "<div id=\"copyright\"><p><strong>© 2026 Karim Katlane. All rights reserved.</strong></p><p>SEVA Intelligence Studio is a project by Karim Katlane. Project owner, creator and declared inventor: Karim Katlane. Site owner account: karimkatlane0@gmail.com. The inventor designation is an attribution by the owner, not evidence of a patent or official recognition. The single official website is https://seva.karimkatlane0.chatgpt.site; revision numbers identify the history of that same site. This notice covers eligible original content and rights held by Karim Katlane, including text, creative contributions to the logo and graphics, original page arrangements, documentation and project code, to the extent protected by law.</p><p>Subject to statutory exceptions and expressly stated licences, reproduction, distribution, modification and commercial use of these materials require written permission from Karim Katlane. Permission requests: <a href=\"mailto:karimkatlane0@gmail.com\">karimkatlane0@gmail.com</a>.</p><p>User content, astronomical images, trademarks, data, open-source software and other third-party materials are excluded. They remain subject to their respective ownership, public-domain status and applicable licences. Existing credits, attribution requirements and previously granted licences remain valid. This notice does not grant Karim Katlane exclusive rights over those materials.</p><p>The current logo was supplied by the owner on 15 November 2026. The original and preceding version are preserved in project history. Attribution does not replace verification of applicable rights. For any AI-assisted material, protection depends on applicable law and actual human creative contributions. Ideas, methods and functionality as such do not become exclusive through this notice.</p><p>Publishing this notice is not an official registration, deposit, trademark registration or certification of ownership, and does not technically prevent copying.</p></div>"
        ]
      ]
    }
  },
  "privacy": {
    "it": {
      "title": "Informativa privacy",
      "tag": "DATI E DIRITTI · VERSIONE 1.0",
      "intro": "Come sono trattati i dati nelle funzioni attualmente disponibili. Aggiornata il 15 novembre 2026.",
      "sections": [
        ["Premium · Candidature volontarie e consensi distinti", "<p>Karim Katlane, titolare indicato in questa informativa, gestisce le candidature in <a href=\"/premium\">Premium</a>. Il servizio salva l’identificativo dell’account, nome, cognome, telefono fornito dalla persona, settore, esigenza, Paese, comune, fascia di budget, periodo e scelte di consenso. La persona chiede la gestione della candidatura e sceglie separatamente se rendere i soli criteri visibili agli utenti autenticati. Nome e telefono non sono restituiti agli operatori in questa versione. Non importiamo il CRM, cronologie di ricerca, cookie di profilazione o profili social nel catalogo.</p><p>La gestione della richiesta è svolta su richiesta dell’interessato; pubblicazione dei criteri, preferenze promozionali per canale e futura comunicazione a un operatore nominato richiedono scelte distinte. I consensi promozionali sono facoltativi e revocabili; la scelta sugli analytics non li sostituisce. La futura comunicazione del recapito richiederà condizioni complete e verifica separata del servizio.</p><p>Le richieste mostrano alla persona nome e società dichiarati dall’operatore, finalità, stato e date. La persona può approvare, rifiutare o revocare dal proprio account. Nessun messaggio esterno o pagamento parte da questi controlli. Revoche e ritiro restano disponibili oltre il limite operativo giornaliero.</p><p>La candidatura scade 90 giorni dopo il salvataggio; al ritiro il contenuto personale è svuotato subito. Alla scadenza viene esclusa dalle letture e svuotata al successivo uso autenticato del servizio. Un record vuoto con identificativo e revisione rimane per la continuità dell’account. Le richieste perdono validità entro 30 giorni, comunque entro la scadenza della candidatura; la cronologia di richieste e operazioni rimane fino a 90 giorni dalla creazione ed è rimossa al successivo uso. Il registro tecnico conserva identificativi, azione, data e impronta della richiesta, non una copia dei recapiti.</p><p>La pagina Premium non alimenta le statistiche delle ricerche individuali. I dati passano attraverso l’infrastruttura del sito descritta sotto. Per accesso, rettifica o cancellazione completa, compresa la continuità tecnica, usa i controlli disponibili o contatta il titolare. I diritti e i recapiti dell’autorità sono descritti nelle sezioni seguenti.</p>"],
        ["Territorio, GPS e catalogo delle competenze", "<p>In <a href=\"/territorio\">Territorio</a>, la lettura GPS avviene soltanto quando premi il pulsante dedicato e il browser concede il permesso. Le coordinate inserite o rilevate e il piano della passeggiata restano nella memoria della pagina; questi controlli non le inviano al server SYNAPSY e non avviano un tracciamento continuo. Puoi cancellarle dalla pagina o esportare il piano sul dispositivo. Se scegli di aprire Google Maps, origine e destinazione sono trasmesse a Google per la richiesta di indicazioni, insieme ai normali dati tecnici della connessione; si applicano le informative di Google. La verifica del catalogo FVG consulta metadati della fonte senza inviare la tua posizione. I collegamenti INSPIRE aprono fonti pubbliche e non trasmettono le coordinate del piano.</p><p>Il <a href=\"/onboarding/competenze\">catalogo delle 15 competenze</a> contiene istruzioni generiche pubbliche, senza copie dei tuoi file Drive o record del workspace. Ricerca, filtro e copia del testo sono locali alla pagina. Il plugin SEVA Enterprise Onboarding distribuisce istruzioni e non aggiunge un proprio server API o archivio: quando una procedura usa altri strumenti autorizzati, i dati sono trattati da quei servizi secondo le rispettive condizioni e autorizzazioni. L’apertura delle pagine e dei sorgenti genera le normali richieste HTTP del sito.</p>"],
        ["KKUBERA 4 · Archivio privato e posizione", "<p>Le schede di disponibilità salvano nel tuo account unità, indirizzo, stati separati di vendita e locazione, fonti, date e note. La ricevuta e il registro delle modifiche conservano le revisioni e i dati prima e dopo l’operazione. Archiviare una scheda la conserva per il recupero; non equivale alla cancellazione definitiva. L’esportazione JSON contiene i dati del tuo archivio: scegli dove conservarla.</p><p>La passeggiata collegata al civico richiede la posizione soltanto con il pulsante dedicato. La rilevazione resta nella memoria della pagina ed è rimossa al cambio di contesto, quando nascondi la pagina o la chiudi. Con Apri indicazioni a piedi scegli di condividere con Google l’indirizzo e l’eventuale partenza. Numero dell’interno, stati e note non sono inclusi nel link. La voce locale legge i dati visibili soltanto su richiesta e si arresta al cambio di scheda o all’uscita. Nessun audio viene caricato da questo controllo.</p>"],
        ["Musica locale e player Spotify facoltativo", "<p>In <a href=\"/music\">Musica</a>, i file audio scelti restano nel dispositivo e nella memoria della pagina. Il player Spotify viene caricato soltanto quando incolli un collegamento valido e premi il pulsante dedicato, dopo l’avviso. Il browser contatta Spotify, che riceve dati tecnici come indirizzo IP, informazioni del browser e contenuto scelto e può usare cookie, anche di terze parti. Si applicano <a href=\"https://www.spotify.com/legal/privacy-policy/\">privacy Spotify</a> e <a href=\"https://www.spotify.com/legal/cookies-policy/\">cookie Spotify</a>. La scelta vale per il caricamento corrente; non salviamo una preferenza o una cronologia Spotify. Chiudi il player per interrompere le richieste successive del riquadro. I cookie già impostati sono gestiti dal browser e dal provider. La ricerca apre il servizio Spotify e gli trasmette il testo inserito.</p>"],
        ["Verifica onboarding e ricerca dei civici", "<p>La verifica in <a href=\"/onboarding\">Onboarding</a> legge soltanto gli archivi dell’account autenticato e mostra conteggi, revisioni e stato. Non salva una nuova ricevuta cloud; l’esito può essere scaricato sul dispositivo e viene rimosso dalla vista quando la pagina passa in secondo piano. In <a href=\"/kkubera/cataloghi\">Cataloghi e civici</a>, la ricerca invia al server SYNAPSY e alla fonte regionale il comune, la via e il civico scelti. Non aggiunge i dati al CRM, non consulta proprietari e non attesta disponibilità degli immobili. Non inserire nomi o note personali nei criteri di ricerca. Le richieste HTTP sono trattate dalle rispettive infrastrutture secondo le loro informative.</p>"],

        ["Ordini CRM e pagamenti dei servizi", "<p>Il titolare può collegare un contatto CRM a un ordine per una prestazione SEVA concordata. Il registro conserva riferimento del contatto, servizio, accordo, descrizione, importo, valuta, identificativi tecnici Stripe, stati e date del pagamento e prova della consegna inserita dal titolare. La gestione dell’ordine e del servizio richiesto è distinta dal marketing. Non inserire documenti personali, dati sensibili o credenziali nelle descrizioni e nelle prove.</p><p>Il link Stripe dell’ordine contiene un riferimento casuale senza nome, email o dettagli dell’accordo. Condividilo soltanto con il destinatario previsto. Stripe tratta i dati forniti nel proprio checkout; SEVA riceve notifiche firmate e conserva i soli riferimenti necessari alla registrazione, al controllo dei duplicati e alla gestione di rimborsi o contestazioni. Nessun numero completo di carta o CVC viene salvato da SEVA.</p><p>Il registro è riservato al titolare e separato dalla rubrica: rimuovere un contatto non cancella automaticamente ordini e ricevute collegati. Le bozze non salvate restano nella memoria della pagina. Gli ordini si possono esportare dal registro; per rettifica o cancellazione completa contatta il titolare, tenendo conto di eventuali obblighi di conservazione applicabili. Non è attiva una scadenza automatica per questi record. Il collegamento non invia email o messaggi e non avvia bonifici, addebiti ricorrenti o accrediti.</p>"],
        ["Copie di recupero CRM", "<p>Dal rilascio del 12 novembre 2026 i salvataggi CRM conservano automaticamente fino alle ultime 20 revisioni nel database dello stesso account, inclusa la copia precedente al primo aggiornamento. Le copie possono contenere contatti rimossi e prove storiche di consenso; sono accessibili soltanto all’account autenticato e vengono eliminate progressivamente alla rotazione delle revisioni. Non costituiscono un backup esterno. Il download non riattiva consensi. Per richieste di cancellazione che comprendano la cronologia, contatta il titolare.</p>"],
        [
          "Titolare e contatto",
          "<p>Il titolare dei trattamenti effettuati per il progetto SEVA è Karim Katlane. Per domande e diritti privacy scrivi a <a href=\"mailto:karimkatlane0@gmail.com?subject=SEVA%20-%20Privacy\">karimkatlane0@gmail.com</a>. Puoi contattarci anche senza un account ChatGPT. Se usi il workspace, è disponibile <a href=\"/app?section=contact\">Contatta SEVA</a>.</p>"
        ],
        [
          "Dati, finalità e basi giuridiche",
          "<div class=\"table-wrap\"><table><thead><tr><th>Dati</th><th>Uso</th><th>Base</th></tr></thead><tbody><tr><td>Identificativo account e stato di accesso; email per riconoscere il titolare</td><td>Accesso e separazione dei workspace</td><td>Esecuzione del servizio richiesto</td></tr><tr><td>Obiettivi sincronizzati, criteri, evidenze e registro assistenza</td><td>Salvataggio e gestione nel tuo account</td><td>Esecuzione del servizio richiesto</td></tr><tr><td>Nome, messaggio, risposta e date di una richiesta</td><td>Assistenza, proposta commerciale o collaborazione richiesta da te</td><td>Servizio richiesto o misure precontrattuali</td></tr><tr><td>Profilo studente: nome, università, corso, anno; email universitaria e matricola facoltative</td><td>Profilo volontario dichiarato dall’utente</td><td>Consenso, revocabile eliminando il profilo</td></tr><tr><td>Riferimenti Stripe, importi e stato del collaudo riservato al titolare</td><td>Verificare e riconciliare pagamenti TEST e accessi di prova</td><td>Legittimo interesse alla sicurezza e al collaudo del servizio</td></tr></tbody></table></div><p>Il conferimento dei dati minimi è necessario soltanto per la funzione che richiedi. Puoi consultare le pagine pubbliche senza compilare il profilo o inviare richieste. SEVA non usa questi dati per pubblicità comportamentale o vendita di elenchi di contatti.</p>"
        ],
        [
          "Cosa resta nel browser",
          "<p>Richieste personali, foto, contatti nelle richieste, catalogo e piano locale sono conservati nello spazio del browser associato al tuo account. Le schede e le attività del CRM sono salvate online nel tuo account quando scegli di salvarle. In KKUBERA/2, immobili, fonti e date desiderate delle visite sono salvati online nel tuo account quando usi i pulsanti di salvataggio. Puoi esportarli o rimuoverli dal calendario; preparare un messaggio non lo invia. Gli obiettivi vanno sul server quando scegli la sincronizzazione; il registro assistenza, il profilo studente e le richieste al titolare sono online quando li salvi.</p><p>I file TXT/Markdown per il brief AI sono letti localmente. La bozza resta in memoria; non è inviata automaticamente al provider AI. I link inseriti non importano il contenuto delle pagine. Gli export salvati sul tuo dispositivo sono copie sotto il tuo controllo.</p><p>Le schede domanda/offerta per i partner restano nel browser dello stesso account. Puoi eliminarle singolarmente, esportare il dataset o cancellare il workspace locale. I collegamenti alle fonti non vengono aperti dal confronto. Preparare un brief AI non lo invia: la chiamata al provider richiede la tua azione separata.</p><p>Il calcolo budget marketing/acquisto in Globale usa solo i valori inseriti nella memoria della pagina. Non trasferisce fondi né modifica prezzi. Il riepilogo TXT viene scaricato sul dispositivo solo quando lo richiedi.</p><p>PSDMAKING calcola statistiche sui dati inseriti nella memoria della pagina. Il calcolo locale funziona senza attivare le quattro scelte di esportazione: conteggi, importi, contesto e zona, tutte disattivate inizialmente. La posizione approssimata del dispositivo viene richiesta solo con il pulsante dedicato; non localizza i contatti. Copia, download TXT e salvataggio JSON includono soltanto le categorie selezionate; escludere gli importi esclude anche le metriche finanziarie derivate. Il tipo di dati dichiarati o scenario resta indicato nel riepilogo e nell’archivio. Il JSON viene salvato sul dispositivo solo su tua richiesta. L’apertura di un file JSON è locale e non riattiva le scelte operative. La revoca delle scelte blocca nuove esportazioni; una copia negli appunti già richiesta può ancora completarsi. La revoca non cancella file o copie negli appunti già creati. L’ID dell’archivio identifica un’esportazione e non prova identità o consenso. Nessun salvataggio automatico nel cloud o invio automatico a Gmail o Skebby.</p>"
        ],
        [
          "Chi può ricevere i dati",
          "<p>Il titolare può leggere le richieste inviate tramite Contatta SEVA, Community e Business per rispondere. L’accesso amministrativo ai dati tecnici è limitato alla gestione del servizio; la separazione per account non equivale a cifratura end-to-end.</p><p>La piattaforma ChatGPT Sites e l’infrastruttura Cloudflare supportano accesso, hosting e archivio. Stripe tratta le informazioni inserite nel checkout TEST e nei link LIVE per servizi una tantum già concordati. SEVA conserva riferimenti e stato, non numeri completi di carta o CVC. I link LIVE prevedono gestione manuale della prestazione; l’abbonamento Entry automatico non è disponibile.</p><p>Per i servizi propri dei fornitori valgono anche le loro informative: <a href=\"https://openai.com/it-IT/policies/eu-privacy-policy/\">OpenAI</a>, <a href=\"https://www.cloudflare.com/privacypolicy/\">Cloudflare</a>, <a href=\"https://stripe.com/privacy\">Stripe</a>. Aprire un provider AI e inviarvi un brief è una scelta distinta dell’utente.</p>"
        ],
        [
          "Conservazione e cancellazione",
          "<p>I dati locali rimangono fino alla loro eliminazione tramite SEVA o le impostazioni del browser. In Dati e privacy puoi eliminare il workspace locale dell’account corrente, comprese le copie locali di sincronizzazione. Gli altri account sul dispositivo non vengono cancellati.</p><p>I record online restano per rendere disponibile la funzione richiesta finché li mantieni nel workspace. Puoi eliminare profilo studente e richieste nelle rispettive sezioni; per gli obiettivi rimuovi le voci e sincronizza la modifica, per il registro assistenza usa i suoi controlli. In KKUBERA/2 puoi rimuovere una richiesta oppure un immobile insieme alle sue date; eventuali messaggi già inviati si gestiscono separatamente in Contatta SEVA. Non è attivo un termine automatico di scadenza per tutti i record. Per cessazione dell’uso o cancellazione completa contatta il titolare.</p><p>DBRELAY conserva nel medesimo database fino a 20 revisioni recenti degli obiettivi sincronizzati, comprese le evidenze. Una modifica o un ripristino crea una nuova revisione; le copie più vecchie vengono rimosse quando si supera questo limite. Rimuovere una voce dal piano attivo non la elimina subito dalle revisioni conservate. Non è previsto un termine automatico in giorni: per cancellare anche la cronologia contatta il titolare. Puoi leggere e ripristinare le tue copie da Piano &amp; AI. Esporta JSON per una copia separata; la cronologia nello stesso database non è un backup esterno.</p><p>Eventuali dati necessari a gestire una contestazione o un obbligo di legge possono essere conservati limitatamente a tale necessità. Copie tecniche e log di piattaforma seguono i cicli e le informative dei fornitori; SEVA non promette una cancellazione istantanea di tali copie.</p>"
        ],
        [
          "Infrastruttura e trasferimenti",
          "<p>L’infrastruttura può comportare trattamenti fuori dallo Spazio economico europeo. OpenAI descrive nelle proprie condizioni i meccanismi di adeguatezza e le clausole contrattuali tipo; gli altri fornitori pubblicano le proprie misure e informative. Per informazioni sulle garanzie applicabili al tuo caso puoi contattare il titolare e i fornitori attraverso i link sopra.</p><p>SEVA non dichiara una residenza esclusivamente europea dei dati né una certificazione di conformità. Nessun contenuto del workspace è trasmesso automaticamente da SEVA a un modello AI pubblico.</p>"
        ],
        [
          "I tuoi diritti",
          "<p>Nei casi previsti puoi chiedere accesso, rettifica, cancellazione, limitazione e portabilità, opporti ai trattamenti basati sul legittimo interesse e revocare un consenso senza incidere sul trattamento precedente. Puoi presentare reclamo al <a href=\"https://www.garanteprivacy.it/\">Garante per la protezione dei dati personali</a> o all’autorità competente.</p><p>Le richieste ricevono riscontro entro i termini previsti dal GDPR, normalmente un mese, con comunicazione di eventuali proroghe motivate. Potrebbero servire informazioni proporzionate per identificare il record corretto: non inviare documenti d’identità senza una richiesta specifica e un canale adeguato.</p><p>SEVA non prende decisioni automatizzate con effetti giuridici o analogamente significativi, né certifica identità, merito creditizio o iscrizioni universitarie.</p>"
        ],
        [
          "Cookie e aggiornamenti",
          "<p>Consulta la <a href=\"/cookies\">pagina cookie e memoria locale</a>. L’uso del servizio non comporta consenso marketing. La versione aggiornata dell’informativa è disponibile su questa pagina e può essere scaricata.</p>"
        ],
        [
          "Strumenti SEVA in ChatGPT",
          "<p>Gli strumenti facoltativi SEVA ricevono ipotesi numeriche o conteggi aggregati forniti nella conversazione. Calcolano e restituiscono risultati senza salvarli nel database SEVA. Non leggono spazi privati, account Stripe o dati bancari e non eseguono pagamenti. ChatGPT tratta conversazione e connessione secondo le proprie informative. Inserisci solo dati aggregati e non riservati. L’hosting del sito può conservare log tecnici delle richieste.</p>"
        ],
        [
          "Link di affiliazione Amazon",
          "<p>La <a href=\"/amazon\">guida studenti Amazon di SEVA</a> contiene un link pubblicitario di affiliazione, segnalato chiaramente. In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei. Questo non costituisce un’approvazione o una certificazione Amazon.</p><p>Il link include un codice di affiliazione pubblico e il browser può comunicare l’origine del sito SEVA. SEVA non trasmette profilo, matricola o email tramite questo link e non incorpora script o pixel di tracciamento Amazon. Se scegli di aprire Amazon, si applicano le sue informative privacy e cookie. Amazon gestisce idoneità, abbonamento, pagamento e disdetta. Nessun pagamento Amazon viene elaborato da SEVA.</p>"
        ],
        [
          "CRM privato",
          "<p>Quando scegli di salvare una scheda CRM, SEVA conserva nome, email e organizzazione facoltative, settore, stato della relazione, fonte e finalità, prova registrata, attività collegate, scadenze ed esiti nel tuo account autenticato. Sono supportati fino a 200 contatti e 500 attività. Gli altri visitatori non possono leggere questo workspace. Il gestore del sito amministra l’infrastruttura sottostante.</p><p>Inserisci solo informazioni pertinenti che hai titolo a gestire. Non inserire credenziali, documenti di identità, dati bancari o dati personali sensibili. Una scheda salvata non iscrive nessuno al marketing e non crea un account utente. Le schede restano fino alla tua eliminazione; eliminare un contatto rimuove anche le sue attività dal CRM attivo. Puoi scaricare JSON o CSV prima di eliminare. Le copie esportate restano sotto la tua responsabilità.</p><p>Il registro consensi facoltativo aggiunge canale, recapito, titolare, finalità, riferimento della prova, informativa, date, scadenza e revoca. Sono dichiarazioni dell’operatore, non certificazioni. Le registrazioni restano nel tuo account e nell’export JSON; non vengono sincronizzate con WhatsApp, Facebook o Skebby. Gli eventi salvati si correggono aggiungendo una revoca o una nuova prova. Eliminare la scheda elimina anche il registro nel CRM attivo.</p><p>Puoi associare un obiettivo principale esistente a una scheda già salvata nel CRM. Il collegamento conserva soltanto gli identificativi dell’obiettivo e della scheda nel browser dell’account corrente; non copia nomi, email, note o consensi. La scheda resta nel CRM cloud e il collegamento diretto viene risolto soltanto nel CRM dell’account autenticato. Il mapping locale non è incluso negli export degli obiettivi, nei brief AI o nella sincronizzazione cloud. Scollegare o annullare lo scollegamento modifica soltanto l’associazione: non cambia il piano, la scheda, le attività o i consensi. La cancellazione del workspace locale rimuove anche i collegamenti di quell’account; non elimina il CRM cloud. I file JSON già scaricati restano sotto il tuo controllo. Il collegamento non certifica identità, consenso o relazione commerciale.</p><p>Il CSV o VCF della rubrica temporanea viene elaborato solo nella pagina del browser, senza salvataggio nel CRM cloud. La navigazione o il comando Svuota rimuovono la rubrica dalla pagina. Aprire un collegamento WhatsApp comunica a WhatsApp il numero selezionato.</p><p>Il titolare del sito può copiare esplicitamente nome e riferimento di una richiesta volontaria ricevuta da SEVA nel proprio CRM. La richiesta originale rimane separata. Le scadenze non inviano promemoria. I dettagli dei contatti e le prove di consenso non sono inclusi nelle metriche pubbliche o negli export aggregati Power BI, che contengono solo conteggi per settore su tua scelta.</p>"
        ],
        [
          "Ascolto, dispositivi e scelte separate",
          "<p>Nel CRM puoi scrivere una nota, leggere un file di testo nella pagina o scegliere la dettatura. La dettatura si avvia solo su tua richiesta e con il permesso del microfono; la disponibilità dipende dal browser. Il riconoscimento vocale può usare un servizio esterno del browser o del dispositivo: consulta le sue impostazioni e informative. Puoi fermare la dettatura e revocare il permesso nelle impostazioni del dispositivo.</p><p>La bozza resta nel modulo finché non scegli di salvarla come attività nella scheda CRM selezionata; il file originale non viene caricato. I dati CRM salvati online sono associati al tuo account e consultabili accedendo con lo stesso account da un altro dispositivo. Le bozze non salvate e le copie locali non si trasferiscono automaticamente. Proteggi i dispositivi e conserva gli export separatamente.</p><p>La gestione della richiesta, l’eventuale uso di un provider AI e il marketing sono scelte distinte. La registrazione di una nota o l’uso del servizio non autorizzano messaggi promozionali. Se gestisci contatti altrui, registra separatamente la prova appropriata per finalità e canale e rispetta eventuali revoche; la registrazione nel CRM non certifica il consenso. La scelta di inviare un brief a un provider AI resta separata e soggetta alle informative di quel provider.</p>"
        ],
        [
          "Bozze di ricerca e immagini",
          "<p>La schermata di ricerca conserva descrizione, budget facoltativo, zona, vincoli e foto in anteprima nella memoria del browser, finché svuoti la bozza, ricarichi o chiudi la pagina. La bozza e la foto non sono caricate o analizzate automaticamente. Aggiungere un obiettivo di ricerca salva esplicitamente il testo nel piano locale; la foto non è inclusa.</p><p>Solo se premi «Usa la mia posizione» e concedi il permesso, il browser legge la posizione del dispositivo e SEVA inserisce nel campo coordinate arrotondate a due decimali. Puoi modificarle o cancellarle; il testo della posizione può essere incluso nel brief, in un obiettivo salvato o nella richiesta che scegli di inviare.</p><p>Aprire il link di ricerca Google invia a Google descrizione, zona e budget nell’indirizzo della ricerca. Non includere informazioni private nella query. Caricamento in Lens e invio all’AI avvengono sul sito o nell’app del provider, quando scegli di eseguirli. Si applicano termini e privacy del provider. I brief scaricati contengono il tuo testo, non la foto.</p>"
        ],
        [
          "API personale — pilota BYOK",
          "<p>Il pilota consente agli account abilitati di collegare una chiave OpenAI dedicata. I consumi sono fatturati dal provider al progetto della chiave, separatamente da SEVA e da ChatGPT. La disponibilità del modello e del credito dipende dal tuo account. SEVA non passa alla chiave del titolare se la tua richiesta fallisce.</p><p>La chiave viene trasmessa via HTTPS al server SEVA e conservata cifrata, associata al tuo account. Il server la decifra esclusivamente per l’invio che confermi a OpenAI. Questa è custodia server, non cifratura end-to-end. Non è inclusa negli export o restituita al browser dopo il salvataggio. Chi gestisce l’infrastruttura mantiene responsabilità di accesso amministrativo.</p><p>Solo il brief confermato è inviato al provider; SEVA non archivia prompt o risposte di questo percorso. Chiede al provider di non conservare la risposta come oggetto recuperabile, ma si applicano comunque le sue condizioni di trattamento e conservazione. SEVA registra identificativi, orari, esiti e conteggi dei token, senza testo o chiave: i record più vecchi di 30 giorni vengono rimossi alla richiesta successiva; se non usi più il servizio puoi chiederne la cancellazione al titolare.</p><p>Puoi rimuovere il collegamento da SEVA. La rimozione riguarda l’archivio attivo; eventuali copie di backup seguono i tempi dell’infrastruttura. Per invalidare la chiave anche nelle copie o presso altri servizi devi revocarla nel tuo account OpenAI. Le richieste già inviate possono completarsi e generare consumi. Limiti del pilota: 20 tentativi al giorno UTC, uno al minuto, 12.000 caratteri di input e 900 token di output; si applica anche il limite prudenziale in USD impostato in AI e fonti. Nessun invio o nuovo tentativo automatico.</p>"
        ],
        [
          "Sequenza Executive e budget personale",
          "<p>Limiti AI: il server conserva nel tuo account mese autorizzato (Europe/Rome), tetti scelti, stato di pausa e quote prudenziali per richiesta. Il limite iniziale è zero e ogni nuovo mese richiede conferma. Il controllo comprende API personale, AI del titolare e ricerca web avviate da SEVA. Le quote restano impegnate anche dopo un errore o esito incerto; non sono fatture o saldi. I riferimenti tecnici senza testo delle richieste restano per evitare duplicazioni e mantenere il registro, fino alla cancellazione richiesta al titolare. Pausa blocca nuovi invii; quelli già autorizzati possono completarsi. Imposte, cambio, usi esterni e massimali bancari non sono controllati da SEVA.</p><p>Se scegli di preparare i comandi Executive, SEVA conserva nel tuo account una copia del titolo, criterio ed evidenze degli obiettivi selezionati, il brief, le risposte AI, le ricevute e le quote prudenziali di budget. I dati restano nell’archivio attivo fino alla richiesta di cancellazione al titolare; esporta i risultati prima della richiesta. Le altre persone che visitano il sito non possono leggerli. Il gestore amministra l’infrastruttura.</p><p>L’avvio autorizza gli invii dei soli comandi selezionati alla tua API OpenAI per 24 ore, entro il limite impostato, mentre la pagina resta aperta e visibile. Pausa impedisce nuovi invii; una richiesta partita può completarsi. Gli errori fermano il ciclo e non generano un nuovo tentativo automatico. I risultati non modificano lo stato degli obiettivi.</p><p>Il budget SEVA non è un saldo monetario e non misura il credito OpenAI. Le quote sono stime prudenziali del costo dei token; imposte e altri utilizzi del tuo account restano separati. REEDEEM apre le pagine del provider: SEVA non riceve codici, non attiva il beneficio, non compra crediti e non collega organizzazioni per tuo conto.</p>"
        ],
        [
          "Conferme tecniche WhatsApp",
          "<p>Quando il titolare configura il canale WhatsApp Business, SEVA può ricevere notifiche firmate degli stati inviato, consegnato, letto o fallito. Conserva soltanto riferimenti trasformati in digest, stato e date per il controllo tecnico e per evitare duplicati. I digest sono riferimenti pseudonimi, non dati dichiarati anonimi. Il testo dei messaggi, il numero del destinatario, i nomi e il payload completo non vengono archiviati dal ricevitore SEVA.</p><p>Gli aggregati sono riservati al titolare. Non è attiva una scadenza automatica di questi record; per la cancellazione contatta il titolare tramite i recapiti sopra. Configurazione e notifiche non comportano iscrizione al marketing, invio automatico o attivazione di gruppi. Aprire una bozza in WhatsApp trasferisce il testo scelto al servizio esterno; il destinatario e l’invio vengono confermati in WhatsApp.</p>"
        ],
        [
          "Account con la sola email",
          "<p>L’accesso resta gestito da ChatGPT. In <a href=\"/account\">Account</a> salvi l’email di contatto e, se lo scegli, nome, telefono, organizzazione, comune, paese e categoria. L’email di contatto non modifica quella di accesso. Identità, recapiti e ruolo dichiarato non sono verificati. Salviamo ID dell’account e del profilo, revisione, data e versione dell’informativa per gestire la funzione richiesta. La presa visione non è consenso marketing o analytics.</p><p>Puoi conservare facoltativamente intestatario dichiarato, IBAN e nome della banca per eventuali accrediti in euro concordati. Il controllo di paese, lunghezza e checksum dell’IBAN non verifica titolarità, valuta, adesione della banca o diritto a ricevere denaro. Il salvataggio non collega un provider, esegue trasferimenti o crea un saldo. Le coordinate non vengono inserite nel CRM, nel catalogo Premium, nelle pagine pubbliche o inviate automaticamente a banche.</p><p>Il profilo è riservato all’account autenticato; gli amministratori tecnici possono accedere ai record per gestire il servizio. I dati rimangono fino alla modifica o eliminazione richiesta. Per cancellare le coordinate scegli “Nessuna coordinata salvata” e salva; per rimuovere tutto il profilo usa “Elimina profilo”. L’esportazione comprende le coordinate presenti: conserva il file privatamente. Gli altri dati del workspace, le candidature Premium e gli eventuali obblighi contrattuali hanno gestione separata.</p>"
        ],
        [
          "Registro di preparazione SPID",
          "<p>Il titolare può salvare nel <a href=\"/identita#spid-procedura\">registro SPID</a> il percorso scelto, il nome del fornitore e brevi riferimenti ai passaggi svolti. Si conservano anche identificativo dell’account, revisione e data per erogare il servizio richiesto e gestire modifiche concorrenti. Sono dichiarazioni del titolare, non attestazioni di identità.</p><p>Il registro è riservato al titolare e all’amministrazione tecnica; rimane fino alla cancellazione dalla stessa pagina. È possibile esportarlo prima della cancellazione. Non inserire documenti di identità, password, codici OTP o chiavi: il registro non li richiede. Le bozze non salvate restano nella pagina. Non invia domande ai fornitori, non firma accordi e non abilita autenticazioni o pagamenti.</p>"
        ],
        [
          "Statistiche facoltative del sito",
          "<p>Con il tuo consenso raccogliamo solo il percorso pubblico senza parametri (per esempio /global), il tipo di evento (pagina vista o clic verso account, spazio, CRM, AI, campagne, assistenza o pagamenti) e il giorno UTC. I dati incrementano direttamente contatori aggregati: non salviamo eventi individuali, email, ID account, identificativi visitatore, IP, user agent, provenienza, ricerche o contenuti del workspace nella tabella analytics. Le richieste HTTP sono comunque trattate dall’infrastruttura, che può conservare log tecnici secondo le proprie informative.</p><p>Il titolare usa questi conteggi per capire quali pagine e percorsi sono utilizzati; la base scelta per questa raccolta facoltativa è il consenso. Il report è riservato al titolare, esportabile in CSV e limitato agli ultimi 90 giorni UTC. I contatori più vecchi vengono cancellati alla raccolta o consultazione successiva. Non misuriamo utenti unici, conversioni commerciali o pagamenti verificati con questi clic.</p>"
        ],
        [
          "Voce, fotocamera e foto selezionate",
          "<p>In <a href=\"/senses\">Sento, vedo, parlo</a> fotocamera e dettatura si avviano con un pulsante e si fermano quando la pagina passa in secondo piano. La dettatura può usare il servizio del browser e inviare l’audio al suo fornitore. La lettura usa soltanto voci dichiarate locali dal dispositivo, quando disponibili.</p><p>Gli scatti e le foto scelte vengono ridimensionati nel browser. Testo, foto e risposta restano nella memoria della pagina, senza salvataggio automatico nel workspace. Solo la richiesta confermata invia a OpenAI il testo visibile e l’eventuale singola foto selezionata, con la configurazione API scelta e i relativi costi. SEVA richiede store:false al provider; ciò non è una garanzia di assenza di conservazione tecnica da parte del provider. La funzione non invia audio all’API, non trasmette video in diretta e non condivide il resto dell’account. Le nuove funzioni Audio e video permettono registrazioni locali di massimo 60 secondi e 25 MiB e la riproduzione di file scelti dal dispositivo: nessun invio AI o salvataggio automatico. La posizione GPS è richiesta una volta e resta nella pagina, salvo la tua scelta di aggiungerla al testo di una domanda e inviarla. Ferma tutte le attività scarta la registrazione in corso; Elimina audio e video rimuove il file dalla pagina. I permessi del browser si revocano nelle sue impostazioni. Le <a href=\"/senses#deviceTerms\">condizioni del servizio Ascolto</a> sono leggibili e copiabili.</p><p>Con Salva sessione puoi scaricare un file JSON contenente il testo, la singola foto selezionata, la risposta visibile e il riferimento storico alla ricevuta. Il file rimane sotto il tuo controllo sul dispositivo; non include audio o video. Apri sessione salvata legge il file localmente e chiede conferma prima di sostituire una pagina con dati. Riaprire una risposta non esegue né verifica una nuova richiesta AI.</p>"
        ],
        [
          "Campagne a beneficio diretto",
          "<p>In <a href=\"/engage\">Campagne e compensi</a> il responsabile salva proposta, criteri, condizioni e riparto del budget. La persona che aderisce condivide con quel responsabile e con il titolare SEVA il proprio riferimento di partecipazione, interesse e periodo dichiarati, valutazione, stato del consenso promozionale e conferma eventuale di ricezione del compenso. Gli identificativi tecnici degli account restano sul server e non sono pubblicati.</p><p>Il link di una campagna aperta mostra la proposta, senza risposte o ricevute dei partecipanti. Le promozioni sono facoltative: la revoca non cancella la partecipazione. Il ritiro prima dell’accettazione rimuove la risposta e l’interesse dal registro attivo; i riferimenti di operazioni e stati restano per documentare la gestione. Dopo l’accettazione puoi revocare le promozioni e richiedere assistenza per rettifiche o cancellazione. Non è prevista una scadenza automatica di questo registro. Per accesso o cancellazione completa contatta SEVA.</p><p>I recapiti non vengono importati in questa funzione. Le bozze WhatsApp, email e SMS sono aperte soltanto su tua scelta; i provider ricevono il testo quando apri il compositore. Gli indicatori esportati contengono conteggi e importi dichiarati della singola campagna, senza identità o risposte.</p>"
        ]
      ]
    },
    "en": {
      "title": "Privacy notice",
      "tag": "DATA AND RIGHTS · VERSION 1.0",
      "intro": "How data is handled in the features currently available. Updated 15 November 2026.",
      "sections": [
        ["Premium · Voluntary applications and separate consent", "<p>Karim Katlane, the controller identified in this notice, handles applications in <a href=\"/premium?lang=en\">Premium</a>. The service stores account identifier, self-provided first and last name, phone, sector, request, country, city, budget band, timing and consent choices. The person requests application management and separately chooses whether only their criteria are visible to signed-in users. Names and phone numbers are not returned to professionals in this version. CRM records, search histories, profiling cookies and social profiles are not imported into this directory.</p><p>Application management is carried out at the person’s request; criteria listing, channel-specific promotional preferences and any future disclosure to a named professional require separate choices. Promotional consent is optional and can be withdrawn; analytics choices do not replace it. Future contact disclosure requires complete terms and separate service verification.</p><p>Requests show the professional’s self-declared name and company, purpose, status and dates to the person. They may approve, decline or revoke from their own account. These controls do not send external messages or payments. Withdrawal remains available beyond the daily operational quota.</p><p>A candidate card expires 90 days after saving; withdrawal immediately clears its personal content. On expiry it is excluded from reads and cleared on the next authenticated use of the service. An empty record with identifier and revision remains for account continuity. Requests become invalid within 30 days and no later than the card’s expiry; request and operation history is retained up to 90 days from creation and removed on the next use. The technical register keeps identifiers, action, date and a request fingerprint, rather than copies of contact details.</p><p>The Premium page does not contribute individual-search analytics. Data is processed through the site infrastructure described below. Use the controls or contact the controller for access, correction or complete deletion, including technical continuity records. Rights and supervisory authority contacts are provided below.</p>"],
        ["Territory, GPS and the skill catalog", "<p>In <a href=\"/territorio\">Territory</a>, GPS is read only after you press its button and the browser grants permission. Entered or measured coordinates and the walk plan remain in page memory; these controls do not send them to the SYNAPSY server or start continuous tracking. You can clear them from the page or export the plan to your device. If you choose to open Google Maps, origin and destination are sent to Google for directions, along with normal connection data; Google’s notices apply. The FVG catalog check reads source metadata without sending your position. INSPIRE links open public sources and do not transmit the plan’s coordinates.</p><p>The <a href=\"/onboarding/competenze?lang=en\">15-skill catalog</a> contains generic public instructions, without copies of your Drive files or workspace records. Search, filtering and text copying are local to the page. The SEVA Enterprise Onboarding plugin distributes instructions and adds no API server or storage service of its own: when a procedure uses other authorized tools, those services process the data under their own terms and permissions. Opening pages and source files generates the site’s normal HTTP requests.</p>"],
        ["KKUBERA 4 · Private records and location", "<p>Availability records store unit, address, separate sale and rental states, sources, dates and notes in your account. Receipts and change records retain revisions and data before and after each operation. Archiving preserves a record for recovery; it is not permanent deletion. JSON exports include your records: choose where to keep them.</p><p>The civic walking feature requests location only through its dedicated button. The reading remains in page memory and is cleared when the context changes, the page becomes hidden or it closes. Open walking directions shares the address and optional origin with Google at your request. Unit labels, states and notes are excluded from the link. Local speech reads visible data only on request and stops on a record change or exit. This control uploads no audio.</p>"],
        ["Local music and the optional Spotify player", "<p>In <a href=\"/music\">Music</a>, selected audio files stay on your device and in page memory. The Spotify player loads only after you paste a valid link and press its button, following the notice. Your browser contacts Spotify, which receives technical data such as IP address, browser information and selected content and may use cookies, including third-party cookies. <a href=\"https://www.spotify.com/legal/privacy-policy/\">Spotify privacy</a> and <a href=\"https://www.spotify.com/legal/cookies-policy/\">Spotify cookies</a> apply. The choice applies to the current load; we do not save a Spotify preference or history. Close the player to stop subsequent requests from the frame. Existing cookies are managed by your browser and the provider. Search opens the Spotify service and sends the text you enter.</p>"],
        ["Onboarding checks and address search", "<p>The <a href=\"/onboarding?lang=en\">Onboarding</a> check reads only the authenticated account’s records and shows counts, revisions and status. It does not save a new cloud receipt; results can be downloaded to your device and are removed from view when the page is hidden. <a href=\"/kkubera/cataloghi\">Address catalogs</a> send the municipality, street and civic number you choose to the SYNAPSY server and regional source. This does not add CRM records, consult property owners or establish property availability. Do not enter personal names or notes in search criteria. HTTP requests are processed by the relevant infrastructure under its own notices.</p>"],

        ["CRM orders and service payments", "<p>The owner can link a CRM contact to an order for an agreed SEVA service. The register stores the contact reference, service, agreement, description, amount, currency, Stripe technical identifiers, payment status and dates, and delivery evidence entered by the owner. Order and service management are separate from marketing. Do not enter personal documents, sensitive information or credentials in descriptions or evidence.</p><p>The order’s Stripe link contains a random reference without a name, email or agreement details. Share it only with the intended recipient. Stripe processes information entered in its checkout; SEVA receives signed notifications and retains the references needed for recording, duplicate checks, refunds and disputes. SEVA does not store full card numbers or CVC.</p><p>The register is owner-only and separate from the address book: removing a contact does not automatically delete linked orders and receipts. Unsaved drafts remain in page memory. Orders can be exported from the register; contact the owner for correction or complete deletion, subject to applicable retention obligations. These records have no automatic expiry. The connection does not send emails or messages or initiate bank transfers, recurring charges or payouts.</p>"],
        ["CRM recovery copies", "<p>From the release on 12 November 2026, CRM saves automatically retain up to the latest 20 revisions in the same account database, including the baseline before its first update. Copies can contain removed contacts and historical consent evidence. They are accessible only to the authenticated account and rotate out as new revisions are saved. They are not an external backup. Downloads do not reactivate consent. Contact the controller for deletion requests that include history.</p>"],
        [
          "KKUBERA/2 property calendar",
          "<p>Property references, sources and proposed viewing times are saved in your signed-in account when you select Save. You can export them or remove a viewing or a property and its viewings. Preparing a message does not send it. Messages already sent through Contact SEVA are handled separately. No property feed, confirmed appointment or payment is created by saving a proposed date.</p>"
        ],
        [
          "Controller and contact",
          "<p>The controller for SEVA project processing is Karim Katlane. For privacy questions or rights requests email <a href=\"mailto:karimkatlane0@gmail.com?subject=SEVA%20-%20Privacy\">karimkatlane0@gmail.com</a>, including without a ChatGPT account. Signed-in users can also use <a href=\"/app?section=contact\">Contact SEVA</a>.</p>"
        ],
        [
          "Data, purposes and legal bases",
          "<div class=\"table-wrap\"><table><thead><tr><th>Data</th><th>Purpose</th><th>Basis</th></tr></thead><tbody><tr><td>Account identifier and sign-in status; email to recognize the owner</td><td>Access and workspace separation</td><td>Providing the requested service</td></tr><tr><td>Synced goals, criteria, evidence and service register</td><td>Account storage and management</td><td>Providing the requested service</td></tr><tr><td>Name, enquiry, reply and dates</td><td>Requested support, business proposal or collaboration</td><td>Requested service or precontractual steps</td></tr><tr><td>Student name, university, course and year; optional university email and student number</td><td>Voluntary self-declared student profile</td><td>Consent, withdrawable by deleting the profile</td></tr><tr><td>Stripe references, amounts and owner-only test status</td><td>Test payment and entitlement reconciliation</td><td>Legitimate interest in service testing and security</td></tr></tbody></table></div><p>Minimum data is needed only for the feature you request. Public pages can be read without submitting a profile or enquiry. SEVA does not use this data for behavioral advertising or selling contact lists.</p>"
        ],
        [
          "What stays in your browser",
          "<p>Personal requests, photos, contacts within requests, catalog and local plans remain in account-scoped browser storage. CRM records and activities are saved online in your account when you choose to save them. Goals reach the server when you choose to sync. The service register, student profile and enquiries to the owner are saved online when you save them.</p><p>TXT/Markdown AI source files are read locally. The brief remains in memory and is not automatically sent to an AI provider. Links do not import webpage content. Downloaded exports are copies under your control.</p><p>Partner demand/supply records stay in the browser storage for the same account. Delete individual records, export the dataset or clear the local workspace. Matching does not fetch source links. Preparing an AI brief does not send it: calling a provider requires a separate action.</p><p>The marketing budget/purchase calculation in Global uses only values entered into page memory. It does not transfer funds or change prices. A TXT summary downloads to your device only when requested.</p><p>PSDMAKING calculates statistics from data entered in page memory. Local calculation works without enabling the four export choices: counts, amounts, context and area, all initially off. Approximate device location is requested only with its dedicated button; it does not locate contacts. Copying, TXT download and JSON save include only selected categories; excluding amounts also excludes derived financial metrics. The declared or scenario data type remains shown in the summary and archive. JSON is saved to your device only on your request. Opening a JSON file is local and does not reactivate operational choices. Revoking the choices blocks new exports; a clipboard copy already requested may still complete. Revocation does not delete files or clipboard copies already created. The archive ID identifies an export and does not prove identity or consent. There is no automatic cloud save or automatic sending to Gmail or Skebby.</p>"
        ],
        [
          "Who receives data",
          "<p>The owner reads Contact SEVA, Community and Business submissions to respond. Administrative access supports service operation; account separation is not end-to-end encryption.</p><p>ChatGPT Sites and Cloudflare infrastructure provide access, hosting and storage. Stripe processes details entered in the TEST checkout and LIVE links for one-time services agreed in advance. SEVA stores references and status, not full card numbers or CVCs. LIVE service fulfilment is handled manually; automatic Entry subscriptions are unavailable.</p><p>Providers also have notices for their own services: <a href=\"https://openai.com/it-IT/policies/eu-privacy-policy/\">OpenAI</a>, <a href=\"https://www.cloudflare.com/privacypolicy/\">Cloudflare</a>, <a href=\"https://stripe.com/privacy\">Stripe</a>. Sending an AI brief through your own provider account is a separate choice.</p>"
        ],
        [
          "Retention and deletion",
          "<p>Local records remain until deleted through SEVA or browser settings. In Dati e privacy, local deletion removes the current account’s workspace and local sync copies, leaving other accounts on the device untouched.</p><p>Online records remain available for the requested feature while you keep them in the workspace. Delete student profiles and enquiries in their sections; remove goals and sync the change; use service-register controls for its records. There is no automatic expiry for all records. For cessation of use or full deletion, contact the controller.</p><p>DBRELAY retains up to 20 recent revisions of synced goals, including evidence, in the same database. A change or restore creates a new revision; older copies are removed when this limit is exceeded. Removing an item from the active plan does not immediately remove it from retained revisions. There is no automatic age-based expiry: contact the controller to delete the history as well. Read and restore your copies in Piano &amp; AI. Export JSON for a separate copy; history in the same database is not an external backup.</p><p>Information necessary for a dispute or legal obligation may be retained only as needed for that purpose. Platform logs and technical copies follow providers’ retention cycles and notices; SEVA does not promise instant erasure of those copies.</p>"
        ],
        [
          "Infrastructure and international transfers",
          "<p>The infrastructure may process data outside the European Economic Area. OpenAI describes adequacy and standard contractual clause mechanisms; other providers publish their own safeguards. Contact the controller or the linked providers for safeguards relevant to your circumstances.</p><p>SEVA does not claim exclusive European data residency or compliance certification. It does not automatically send workspace content to a public AI model.</p>"
        ],
        [
          "Your rights",
          "<p>Where applicable, request access, correction, erasure, restriction and portability, object to legitimate-interest processing and withdraw consent without affecting prior processing. You may complain to the <a href=\"https://www.garanteprivacy.it/\">Italian data protection authority</a> or another competent authority.</p><p>Requests are handled within GDPR deadlines, normally one month, with notice of any justified extension. Proportionate information may be needed to locate the right record; do not send identity documents without a specific request and suitable channel.</p><p>SEVA does not make automated decisions producing legal or similarly significant effects and does not certify identity, creditworthiness or university enrollment.</p>"
        ],
        [
          "Cookies and updates",
          "<p>See <a href=\"/cookies?lang=en\">cookies and local storage</a>. Using SEVA is not consent to marketing. The updated notice is available and downloadable here.</p>"
        ],
        [
          "SEVA tools in ChatGPT",
          "<p>The optional SEVA tools receive numeric scenario assumptions or aggregate conversion counts supplied in the conversation. They calculate and return results without saving them in the SEVA database. They do not read private workspaces, Stripe accounts or bank data and do not execute payments. ChatGPT handles the conversation and connection under its own policies. Enter only aggregate, non-sensitive data. Site hosting may retain technical request logs.</p>"
        ],
        [
          "Amazon affiliate links",
          "<p>The <a href=\"/amazon?lang=en\">SEVA Amazon student guide</a> contains a clearly labelled advertising affiliate link. As an Amazon Associate I earn from qualifying purchases. This does not constitute an endorsement or certification by Amazon.</p><p>The link includes a public affiliate tag and may send the SEVA website origin through the browser. SEVA does not send your profile, student number or email through this link and embeds no Amazon tracking script or pixel. When you choose to open Amazon, its own privacy and cookie policies apply. Amazon manages offer eligibility, subscription, payment and cancellation. No Amazon payment is processed by SEVA.</p>"
        ],
        [
          "Private CRM",
          "<p>When you choose to save a CRM record, SEVA stores the contact name, optional email and organisation, sector, relationship status, source and purpose, recorded evidence, linked activities, due dates and outcomes in your authenticated account. Up to 200 contacts and 500 activities are supported. Other visitors cannot read this workspace. The site operator administers the underlying infrastructure.</p><p>Enter only relevant information you are authorised to manage. Do not upload credentials, identity documents, banking information or sensitive personal data. A saved record does not subscribe anyone to marketing or create a user account. Records remain until you delete them; deleting a contact also deletes its linked activities from the active CRM. Download JSON or CSV before deletion if needed. Exported copies are your responsibility.</p><p>The optional consent log adds channel, recipient reference, controller, purpose, evidence reference, notice, dates, expiry and revocation. These are operator declarations, not certifications. Records remain in your account and JSON export; they are not synchronised with WhatsApp, Facebook or Skebby. Saved events are corrected by appending a revocation or new evidence. Deleting the contact also deletes its consent log from the active CRM.</p><p>You can associate an existing top-level goal with a record already saved in the CRM. The link stores only the goal and record identifiers in the current account’s browser; it does not copy names, email addresses, notes or consent records. The record remains in the cloud CRM, and the direct link resolves only within the authenticated account’s CRM. The local mapping is excluded from goal exports, AI briefs and cloud synchronisation. Unlinking or undoing an unlink changes only the association: it does not change the plan, record, activities or consents. Clearing the account’s local workspace also removes its links; it does not delete the cloud CRM. Previously downloaded JSON files remain under your control. A link does not certify identity, consent or a business relationship.</p><p>The temporary contacts CSV or VCF is processed only in the browser page, without saving it to the cloud CRM. Navigation or Clear removes the directory from the page. Opening a WhatsApp link sends the selected number to WhatsApp.</p><p>The site owner may explicitly copy the name and reference of an incoming voluntary SEVA inquiry into their CRM. The original inquiry remains separate. Activity dates do not send reminders. Contact details and consent evidence are excluded from public metrics and aggregate Power BI exports, which contain only sector counts when you choose to export them.</p>"
        ],
        [
          "Listening, devices and separate choices",
          "<p>In the CRM you may write a note, read a text file into the page or choose dictation. Dictation starts only when you request it and grant microphone permission; availability depends on your browser. Speech recognition may use an external browser or device service: review its settings and notices. You can stop dictation and revoke microphone permission in your device settings.</p><p>The draft remains in the form until you choose to save it as an activity on the selected CRM record; the original file is not uploaded. CRM data saved online is associated with your account and can be accessed on another device using the same account. Unsaved drafts and local copies do not transfer automatically. Protect your devices and keep exports separately.</p><p>Handling a request, using an AI provider and marketing are separate choices. Saving a note or using the service does not authorise promotional messages. If you manage other people’s contacts, record appropriate evidence separately by purpose and channel and respect withdrawals; a CRM entry does not certify consent. Sending a brief to an AI provider remains a separate choice under that provider’s notices.</p>"
        ],
        [
          "Research drafts and images",
          "<p>The search workspace keeps descriptions, optional budget, area, constraints and photo previews in browser memory until you clear the draft, reload or close the page. No research draft or photo is automatically uploaded or analysed. Adding a research goal explicitly stores its text in your local plan; the photo is not included.</p><p>Only when you select Use my location and grant permission, the browser reads the device location and SEVA places coordinates rounded to two decimal places in the area field. You can edit or clear them; the area can be included in a brief, a saved goal or a request you choose to send.</p><p>Clicking the Google search link sends the description, area and budget in its URL to Google. Do not include private information in a search query. Lens uploads and AI submissions happen on the provider’s website or app, when you choose to perform them. Provider terms and privacy policies apply. Downloaded briefs contain your text, not the photo.</p>"
        ],
        [
          "Personal API — BYOK pilot",
          "<p>Enabled accounts can connect a dedicated OpenAI API key. The provider bills the key’s project separately from SEVA and ChatGPT. Model availability and credit depend on your account. SEVA never falls back to the owner’s key.</p><p>The key is sent over HTTPS to the SEVA server and stored encrypted, scoped to your account. The server decrypts it to send requests you explicitly confirm to OpenAI. This is server custody, not end-to-end encryption. The key is excluded from exports and never returned to the browser after storage; infrastructure administrators retain administrative responsibilities.</p><p>Only the confirmed brief is sent to OpenAI. SEVA does not store prompt or response text for this feature. Provider response storage is disabled, but the provider’s own processing and retention terms still apply. SEVA stores request identifiers, times, status and token counts without keys or content. Records older than 30 days are removed on the next request; inactive users may request deletion from the controller.</p><p>Disconnecting removes the credential from the active SEVA store. Infrastructure backups follow infrastructure retention; revoke the key in OpenAI to invalidate it everywhere. In-flight requests may complete and incur costs. Pilot limits: 20 attempts per UTC day, one per minute, 12,000 input characters and 900 output tokens. A separate conservative spending cap is configured in AI and sources. No automatic calls or retries.</p>"
        ],
        [
          "Executive sequence and personal budget",
          "<p>AI limits: the server stores the authorised month (Europe/Rome), selected caps, pause state and conservative request reservations within your account. The initial limit is zero; each new month needs confirmation. The cap covers personal API, owner AI and web search sent by SEVA. Reservations remain committed after an error or uncertain outcome and are not invoices or balances. Content-free technical references remain to prevent duplicates and maintain the register until deletion is requested from the controller. Pause stops new requests; already-authorised requests may finish. Tax, currency exchange, external use and bank limits are outside this control.</p><p>When you prepare Executive commands, SEVA stores selected goal titles, criteria, evidence, briefs, AI responses, receipts and conservative budget reservations in your private account. Active records remain until you request deletion from the controller; export results first. Other visitors cannot read them. The operator administers the infrastructure.</p><p>Starting authorizes only the selected commands to your personal OpenAI API for 24 hours, within your chosen limit and while this page is open and visible. Pause stops new requests; an in-flight request may complete. Errors stop the sequence without automatic retries. Results do not change goal status.</p><p>The SEVA budget is not a monetary balance or a measurement of OpenAI credit. Reservations conservatively estimate token cost; taxes and other account use are separate. REEDEEM opens provider pages: SEVA does not receive codes, activate the benefit, purchase credits or link organizations on your behalf.</p>"
        ],
        [
          "WhatsApp technical status receipts",
          "<p>When the owner configures the WhatsApp Business channel, SEVA can receive signed notifications of sent, delivered, read or failed status. It stores only digest-based references, status and dates for technical checks and duplicate handling. The digests are pseudonymous references, not data claimed to be anonymous. Message text, recipient phone numbers, names and the full payload are not stored by the SEVA receiver.</p><p>Aggregates are restricted to the owner. These records have no automatic expiry; contact the controller using the details above to request deletion. Configuration and notifications do not subscribe anyone to marketing, send messages automatically or activate groups. Opening a draft in WhatsApp transfers the selected text to the external service; the recipient and sending action are confirmed in WhatsApp.</p>"
        ],
        [
          "Email-only account",
          "<p>ChatGPT handles sign-in. In <a href=\"/account?lang=en\">Account</a> save your contact email and, optionally, your name, phone, organisation, city, country and category. The contact email does not change your sign-in email. Identity, contacts and declared role are not verified. Account and profile IDs, revision, date and notice version are stored to operate the requested feature. Acknowledging the notice is not marketing or analytics consent.</p><p>You may optionally retain a declared account holder, IBAN and bank name for agreed future euro credits. Country, length and checksum checks do not verify ownership, currency, bank participation or a right to receive funds. Saving does not connect a provider, transfer money or create a balance. Receiving details are not added to CRM, the Premium catalogue, public pages or automatically sent to banks.</p><p>The profile is private to the authenticated account; technical administrators can access records to operate the service. Details remain until you update or delete them. To clear receiving details, choose “No receiving details” and save; use “Delete profile” to remove the entire profile. Exports include any saved receiving details: keep the file private. Other workspace data, Premium applications and any contractual obligations are managed separately.</p>"
        ],
        [
          "SPID preparation record",
          "<p>The owner may save the selected route, provider name and short references to completed steps in the <a href=\"/identita?lang=en#spid-procedura\">SPID record</a>. Account identifier, revision and update time support the requested service and concurrent editing. Entries are owner declarations, not identity attestations.</p><p>The record is private to the owner and technical administration and remains until deletion from the same page. It can be exported before deletion. Do not enter identity documents, passwords, OTP codes or keys: the record does not require them. Unsaved drafts remain on the page. It does not submit provider applications, sign agreements or enable authentication or payments.</p>"
        ],
        [
          "Optional site analytics",
          "<p>With your consent we collect only the public path without parameters (for example /global), the event type (page view or click toward account, workspace, CRM, AI, campaigns, support or payments) and the UTC day. These directly increment aggregate counters: the analytics table stores no individual events, email, account ID, visitor identifier, IP, user agent, referrer, searches or workspace content. HTTP requests are still processed by the infrastructure, which may keep technical logs under its own notices.</p><p>The controller uses these counts to understand which pages and paths are used; consent is the chosen basis for this optional collection. The report is owner-only, exportable to CSV and limited to the last 90 UTC days. Older counters are deleted at the next collection or report request. These clicks do not measure unique users, commercial conversions or verified payments.</p>"
        ],
        [
          "Voice, camera and selected photos",
          "<p>In <a href=\"/senses?lang=en\">Hear, see, speak</a>, camera and dictation start from a button and stop when the page moves to the background. Dictation may use your browser’s service and send audio to its provider. Reading uses only voices declared local by the device, when available.</p><p>Snapshots and selected photos are resized in the browser. Text, photo and reply remain in page memory, without automatic workspace storage. Only a confirmed request sends the visible text and optional single selected photo to OpenAI, using the selected API configuration and its charges. SEVA requests store:false; this does not guarantee the absence of provider technical retention. The feature does not send audio to the API, stream live video or share the rest of your account.</p><p>Save session downloads a JSON file containing the text, single selected photo, visible reply and historical receipt reference. The file stays under your control on your device; it does not include audio or video. Open saved session reads the file locally and asks before replacing a page containing data. Reopening a reply does not execute or verify a new AI request.</p><p>Audio and video clips are recorded locally (up to 60 seconds and 25 MiB) and selected files play on the device without AI upload. GPS requests one location, held in page memory unless you explicitly add it to a question and send it. Stop all activities discards a recording in progress. Remove audio and video clears the page file. Revoke browser permissions in browser settings. See the listening conditions at /senses?lang=en#deviceTerms.</p>"
        ],
        [
          "Direct-benefit campaigns",
          "<p>In <a href=\"/engage\">Campaigns and compensation</a>, the manager saves the proposal, criteria, terms and budget allocation. A participant shares a participation reference, self-declared interest and timing, assessment, promotional preference and any receipt confirmation with that manager and the SEVA operator. Technical account identifiers stay server-side and are not published.</p><p>An open campaign link shows the proposal without participant responses or receipts. Promotional consent is optional and can be withdrawn independently of participation. Withdrawing before acceptance removes the response and interest from the active record; operation references and states remain for the record. After acceptance, promotional consent can still be withdrawn; contact SEVA for corrections or deletion. There is no automatic expiry for this register. Contact SEVA for full access or deletion requests.</p><p>This function does not import contact details. WhatsApp, email and SMS drafts open only on your action; the provider receives the text when you open its composer. Single-campaign exports contain aggregate counts and declared amounts without identities or responses.</p>"
        ]
      ]
    }
  },
  "cookies": {
    "it": {
      "title": "Cookie e analytics",
      "tag": "LE TUE SCELTE · VERSIONE 2.0",
      "intro": "Cookie necessari, statistiche facoltative e controllo dei dati. Aggiornato il 14 novembre 2026.",
      "sections": [
        ["Spotify solo su richiesta", "<p>Il player ufficiale in <a href=\"/music#spotify\">Musica</a> è facoltativo e rimane assente fino al clic sul pulsante dedicato. Prima del caricamento trovi l’avviso relativo al contatto con Spotify e ai suoi cookie, anche di terze parti. Questa scelta è distinta dagli analytics SYNAPSY e vale per il player corrente. Per interromperlo usa Chiudi player Spotify; per i cookie già presenti usa le impostazioni del browser o del provider. Consulta <a href=\"https://www.spotify.com/legal/cookies-policy/\">l’informativa cookie Spotify</a>.</p>"],

        [
          "Cosa usa SEVA",
          "<p>SEVA usa il cookie tecnico <code>seva_cookie_choice</code> per ricordare la scelta sugli analytics per sei mesi in questo browser: <code>v1.yes</code> significa consenso, <code>v1.no</code> solo necessari. Non contiene un identificativo personale. SYNAPSY non aggiunge propri cookie pubblicitari o pixel di marketing. Il player Spotify facoltativo ha le condizioni separate descritte sotto.</p><p>La memoria locale del workspace conserva i piani dell’account corrente e le copie di sincronizzazione. Nel CMS pubblico le bozze vengono salvate nel browser solo quando scegli Salva bozza; non sono isolate per account. Questi salvataggi funzionali sono separati dagli analytics.</p>"
        ],
        [
          "Analytics facoltativi",
          "<p>Con il tuo consenso raccogliamo solo il percorso pubblico senza parametri (per esempio /global), il tipo di evento (pagina vista o clic verso account, spazio, CRM, AI, campagne, assistenza o pagamenti) e il giorno UTC. I dati incrementano direttamente contatori aggregati: non salviamo eventi individuali, email, ID account, identificativi visitatore, IP, user agent, provenienza, ricerche o contenuti del workspace nella tabella analytics. Le richieste HTTP sono comunque trattate dall’infrastruttura, che può conservare log tecnici secondo le proprie informative.</p><p>Il titolare usa questi conteggi per capire quali pagine e percorsi sono utilizzati; la base scelta per questa raccolta facoltativa è il consenso. Il report è riservato al titolare, esportabile in CSV e limitato agli ultimi 90 giorni UTC. I contatori più vecchi vengono cancellati alla raccolta o consultazione successiva. Non misuriamo utenti unici, conversioni commerciali o pagamenti verificati con questi clic.</p>"
        ],
        [
          "Accesso e servizi esterni",
          "<p>Il servizio di accesso e la piattaforma di hosting possono utilizzare cookie o meccanismi tecnici per sessione, sicurezza e disponibilità. Sono gestiti dalla piattaforma, non dal codice applicativo SEVA. Le condizioni dei fornitori sono collegate nell’<a href=\"/privacy\">informativa privacy</a>.</p><p>Quando apri Stripe, ChatGPT, Gemini o GitHub navighi su un servizio distinto, soggetto ai suoi controlli. SEVA non può impostare preferenze o eliminare cookie su quei domini.</p>"
        ],
        [
          "Come cancellare",
          "<p>Per rimuovere i dati locali dell’account corrente: entra nel workspace, apri Connessioni ed “Elimina dati locali”, dopo aver esportato ciò che vuoi conservare. Per eliminare tutti i dati del dominio, usa le impostazioni del browser. Uscire dall’account non elimina i dati locali.</p><p>La cancellazione locale non elimina record sul server, file esportati o dati conservati da altri servizi. Consulta la privacy per i controlli online e il contatto del titolare.</p>"
        ],
        [
          "Scegliere e revocare",
          "<p>Gli analytics partono soltanto dopo Consenti analytics. Solo necessari permette di usare normalmente il servizio senza inviare statistiche. Il pulsante Preferenze cookie, disponibile su ogni pagina, permette di cambiare la scelta; la casella analytics parte disattivata. La revoca ferma gli invii successivi e non cancella i conteggi aggregati già raccolti, che non sono collegati alla persona.</p><p><button type=\"button\" class=\"btn\" data-open-cookie-preferences>Apri preferenze cookie</button></p><p>La scelta vale su questo browser e dominio, senza essere collegata all’account. Su un altro browser puoi scegliere diversamente. Se cancelli il cookie la scelta verrà richiesta di nuovo. Riferimento: <a href=\"https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876\">Linee guida del Garante</a>.</p>"
        ],
        [
          "Link di affiliazione Amazon",
          "<p>La <a href=\"/amazon\">guida studenti Amazon di SEVA</a> contiene un link pubblicitario di affiliazione, segnalato chiaramente. In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei. Questo non costituisce un’approvazione o una certificazione Amazon.</p><p>Il link include un codice di affiliazione pubblico e il browser può comunicare l’origine del sito SEVA. SEVA non trasmette profilo, matricola o email tramite questo link e non incorpora script o pixel di tracciamento Amazon. Se scegli di aprire Amazon, si applicano le sue informative privacy e cookie. Amazon gestisce idoneità, abbonamento, pagamento e disdetta. Nessun pagamento Amazon viene elaborato da SEVA.</p>"
        ]
      ]
    },
    "en": {
      "title": "Cookies and analytics",
      "tag": "YOUR CHOICES · VERSION 2.0",
      "intro": "Necessary cookies, optional analytics and control over your data. Updated 15 November 2026.",
      "sections": [
        ["Spotify only on request", "<p>The official player in <a href=\"/music#spotify\">Music</a> is optional and remains absent until you press its dedicated button. Before loading, you see the notice about contacting Spotify and its cookies, including third-party cookies. This choice is separate from SYNAPSY analytics and applies to the current player. Use Close Spotify player to stop it; manage existing cookies in your browser or with the provider. Read the <a href=\"https://www.spotify.com/legal/cookies-policy/\">Spotify cookie notice</a>.</p>"],

        [
          "What SEVA uses",
          "<p>SEVA uses the necessary <code>seva_cookie_choice</code> cookie to remember your analytics choice for six months in this browser: <code>v1.yes</code> means consent and <code>v1.no</code> necessary only. It contains no personal identifier. SYNAPSY adds no advertising cookies or marketing pixels of its own. The optional Spotify player has the separate conditions described below.</p><p>Workspace local storage keeps the current account’s plans and sync copies. In the public CMS, drafts are saved in the browser only when you choose Save draft; they are not isolated by account. These functional records are separate from analytics.</p>"
        ],
        [
          "Optional analytics",
          "<p>With your consent we collect only the public path without parameters (for example /global), the event type (page view or click toward account, workspace, CRM, AI, campaigns, support or payments) and the UTC day. These directly increment aggregate counters: the analytics table stores no individual events, email, account ID, visitor identifier, IP, user agent, referrer, searches or workspace content. HTTP requests are still processed by the infrastructure, which may keep technical logs under its own notices.</p><p>The controller uses these counts to understand which pages and paths are used; consent is the chosen basis for this optional collection. The report is owner-only, exportable to CSV and limited to the last 90 UTC days. Older counters are deleted at the next collection or report request. These clicks do not measure unique users, commercial conversions or verified payments.</p>"
        ],
        [
          "Sign-in and other services",
          "<p>The sign-in and hosting platform may use technical cookies or mechanisms for sessions, security and availability. These are managed by the platform rather than SEVA application code. Provider notices are linked in our <a href=\"/privacy?lang=en\">privacy notice</a>.</p><p>Opening Stripe, ChatGPT, Gemini or GitHub takes you to a separate service with its own controls. SEVA cannot change preferences or erase cookies on those domains.</p>"
        ],
        [
          "Deleting data",
          "<p>To remove the current account’s local data, open Connessioni in your workspace and select Elimina dati locali after exporting anything you need. Browser settings can remove all data for the domain. Signing out does not erase local data.</p><p>Local deletion does not remove server records, exported files or data held by other services. See privacy for online controls and the controller’s contact.</p>"
        ],
        [
          "Choosing and withdrawing",
          "<p>Analytics start only after Allow analytics. Necessary only lets you use the service normally without sending statistics. Cookie preferences, available on every page, lets you change the choice; the analytics checkbox is off by default. Withdrawal stops further sends and does not erase previously collected aggregate counts, which are not linked to you.</p><p><button type=\"button\" class=\"btn\" data-open-cookie-preferences>Open cookie preferences</button></p><p>The choice applies to this browser and domain, without an account link. You can choose differently in another browser. If you clear the cookie, you will be asked again. Reference: <a href=\"https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876\">Italian authority guidelines</a>.</p>"
        ],
        [
          "Amazon affiliate links",
          "<p>The <a href=\"/amazon?lang=en\">SEVA Amazon student guide</a> contains a clearly labelled advertising affiliate link. As an Amazon Associate I earn from qualifying purchases. This does not constitute an endorsement or certification by Amazon.</p><p>The link includes a public affiliate tag and may send the SEVA website origin through the browser. SEVA does not send your profile, student number or email through this link and embeds no Amazon tracking script or pixel. When you choose to open Amazon, its own privacy and cookie policies apply. Amazon manages offer eligibility, subscription, payment and cancellation. No Amazon payment is processed by SEVA.</p>"
        ]
      ]
    }
  },
  "partners": {
    "it": {
      "title": "Costruiamo un caso utile.",
      "tag": "PARTNER · IMPRESE · COMMUNITY",
      "intro": "Da Trieste, una proposta aperta a organizzazioni e collaboratori internazionali: un problema definito, un progetto pilota, una prova del risultato.",
      "sections": [
        [
          "Invita un negozio o un creator",
          "<p>Condividi una pagina pubblica da cui provare il servizio gratuito e proporre un pilota volontario.</p><a class=\"btn\" href=\"/join\">Apri l’invito</a>"
        ],
        [
          "Parti da una domanda o da una foto",
          "<p>Descrivi un prodotto, un servizio o un argomento, aggiungi una foto in anteprima e prepara una ricerca web o un brief AI. Apri Google per usare Lens e caricare lì la foto; per l’analisi AI usa il tuo account ChatGPT o Gemini.</p><p>La bozza resta nella memoria del browser. SEVA non analizza o carica automaticamente la foto. Risultati, prezzi e disponibilità sono da verificare.</p><a class=\"btn\" href=\"/app?section=search\">Apri ricerca SEVA →</a>"
        ],
        [
          "CRM per relazioni reali",
          "<p>Organizza aziende, contatti, fonti, attività e prossimi passi nel tuo account privato. Per indicare Cliente o Partner serve una prova registrata della relazione. SEVA non certifica la relazione e non crea clienti automaticamente.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=crm\">Apri il CRM privato →</a><a class=\"btn light\" href=\"/app?section=business\">Invia una richiesta Business →</a></div>"
        ],
        [
          "Opportunità di affiliazione per settore",
          "<p>Esplora TheFork Italia, viaggi, shopping, formazione e programmi per le imprese. Filtra le fonti ufficiali e prepara un percorso di candidatura privato.</p><p>I programmi elencati sono opportunità da valutare; non attestano una partnership SEVA o un pagamento automatico.</p><a class=\"btn\" href=\"/affiliates\">Esplora le affiliazioni →</a>"
        ],
        [
          "Tre percorsi di collaborazione",
          "<div class=\"cards\"><article><span class=\"number\">01</span><h3>Imprese e negozi</h3><p>Organizzare bisogni, cataloghi manuali e assistenza. Il punto di partenza è un processo reale da migliorare.</p></article><article><span class=\"number\">02</span><h3>Community e formazione</h3><p>Proporre percorsi di studio, accessibilità e partecipazione, con condivisione volontaria dei dati.</p></article><article><span class=\"number\">03</span><h3>Sviluppatori</h3><p>Contribuire a test, esperienza utente, documentazione e integrazioni da concordare. <a href=\"/developers\">Percorso tecnico →</a></p></article></div>"
        ],
        [
          "Il progetto pilota",
          "<ol><li>Descrivi il problema e chi ne beneficia.</li><li>Concordiamo perimetro, dati minimi e risultato misurabile.</li><li>Prima del lavoro a pagamento ricevi una proposta scritta con prezzo, tempi e responsabilità.</li><li>Il risultato viene valutato sulle prove raccolte e sui limiti osservati.</li></ol><p>La manifestazione d’interesse è gratuita e non vincolante. Non apre un abbonamento, non concede accesso a dati di terzi e non rende pubblica la tua organizzazione.</p>"
        ],
        [
          "Cosa è disponibile",
          "<p>Il workspace Base è aperto. Sono disponibili obiettivi, esportazione, registro assistenza e richieste private. L’AI si usa attraverso l’account personale del provider. Le pagine pubbliche sono in italiano e inglese; il workspace è attualmente in italiano.</p><p>Servizi Enterprise, integrazioni dedicate, SLA, assistenza gestita e distribuzione mobile richiedono una valutazione specifica. Non sono inclusi per il solo fatto di richiedere informazioni.</p>"
        ],
        [
          "Segui le tue collaborazioni",
          "<p>Crea un piano privato per un’impresa, un club, una community o un fornitore tecnologico. Ogni percorso comprende referente, proposta e risposta, accordo e risultati, con criteri ed evidenze modificabili. Se esiste già un accordo, documentane perimetro e conferma della controparte.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=partnerships\">Crea percorso privato →</a><a class=\"btn light\" href=\"/sports\">Calcio e basket</a></div><p class=\"small\">Il piano non invia richieste e non certifica partnership. Puoi esportarlo o scegliere la sincronizzazione degli obiettivi nel tuo account.</p>"
        ],
        [
          "Parliamone",
          "<p>Indica organizzazione, paese, problema, risultato atteso e contatto professionale. Condividi inizialmente solo informazioni non riservate.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=business\">Invia richiesta privata</a><a class=\"btn light\" href=\"mailto:karimkatlane0@gmail.com?subject=SEVA%20-%20Proposta%20di%20collaborazione\">Scrivi via email</a></div><p class=\"small\">La richiesta nel workspace viene salvata nel tuo account; l’email apre il tuo programma di posta e viene inviata solo da te. Nessun partner esterno è annunciato come acquisito.</p>"
        ],
        [
          "Confronta domanda e offerta",
          "<p>Raccogli schede private con organizzazione, esigenza o offerta, caratteristiche, modalità, zona, importo e fonte. Il confronto mostra criteri soddisfatti, incompatibilità e informazioni mancanti; puoi preparare un percorso di verifica o un brief AI testuale.</p><p>Il dataset resta nel browser del tuo account ed è importabile ed esportabile in JSON. Non è una rete pubblica di partner. Nessun abbinamento invia messaggi o conclude accordi; le immagini non sono analizzate dal confronto.</p><a class=\"btn\" href=\"/app?section=partnerships\">Apri domanda e offerta →</a>"
        ]
      ]
    },
    "en": {
      "title": "Build a useful case with us.",
      "tag": "PARTNERS · BUSINESSES · COMMUNITY",
      "intro": "From Trieste, an invitation to organizations and international collaborators: define a problem, agree a pilot and evaluate the evidence.",
      "sections": [
        [
          "Invite a shop or creator",
          "<p>Share one public entry page for a free trial and a voluntary pilot proposal.</p><a class=\"btn\" href=\"/join?lang=en\">Open the invitation</a>"
        ],
        [
          "Start with a question or photo",
          "<p>Describe a product, service or topic, add an optional photo preview, and prepare a web search or an AI brief. Open Google to use Lens and upload the photo there; use your own ChatGPT or Gemini account for AI analysis.</p><p>SEVA keeps this draft in browser memory. It does not analyse or upload the photo automatically. Search results, prices and availability remain to be checked.</p><a class=\"btn\" href=\"/app?section=search\">Open search workspace →</a>"
        ],
        [
          "CRM for real relationships",
          "<p>Keep companies, contacts, sources, activities and next steps in your private account. A customer or partner label requires a recorded supporting reference. SEVA does not certify that relationship or create customers automatically.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=crm\">Open private CRM →</a><a class=\"btn light\" href=\"/app?section=business\">Send a business request →</a></div>"
        ],
        [
          "Affiliation opportunities across sectors",
          "<p>Explore TheFork Italia, travel, shopping, learning and business programmes. Filter official sources and prepare a private application plan.</p><p>Programme listings are opportunities to evaluate; they do not establish a SEVA partnership or an automatic payment.</p><a class=\"btn\" href=\"/affiliates?lang=en\">Explore affiliation pathways →</a>"
        ],
        [
          "Three ways to collaborate",
          "<div class=\"cards\"><article><span class=\"number\">01</span><h3>Businesses and shops</h3><p>Organize needs, manual catalogs and service requests. Start with a real process you want to improve.</p></article><article><span class=\"number\">02</span><h3>Community and learning</h3><p>Suggest study, accessibility and participation projects with voluntary data sharing.</p></article><article><span class=\"number\">03</span><h3>Developers</h3><p>Contribute to testing, user experience, documentation and scoped integrations. <a href=\"/developers?lang=en\">Technical pathway →</a></p></article></div>"
        ],
        [
          "A focused pilot",
          "<ol><li>Describe the problem and who benefits.</li><li>Agree scope, minimum data and a measurable outcome.</li><li>Before paid work, receive a written proposal covering price, timing and responsibilities.</li><li>Evaluate results against collected evidence and observed limitations.</li></ol><p>Expressions of interest are free and non-binding. They do not create subscriptions, grant access to third-party data or make your organization public.</p>"
        ],
        [
          "Available today",
          "<p>The Basic workspace is open, with goals, export, a service register and private enquiries. AI is used through your own provider account. Public pages are in Italian and English; the workspace is currently in Italian.</p><p>Enterprise services, dedicated integrations, SLAs, managed support and mobile distribution require a separate assessment. Enquiring does not include these services.</p>"
        ],
        [
          "Track your collaborations",
          "<p>Create a private plan for a business, club, community or technology provider. Each plan covers the contact, proposal and response, agreement and outcomes, with editable criteria and evidence. If an agreement already exists, document its scope and confirmation from the other party.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=partnerships\">Create a private plan →</a><a class=\"btn light\" href=\"/sports?lang=en\">Football and basketball</a></div><p class=\"small\">The plan does not send enquiries or certify partnerships. Export it or choose goal synchronization in your account. The workspace UI is currently in Italian.</p>"
        ],
        [
          "Start a conversation",
          "<p>Tell us your organization, country, problem, expected outcome and business contact. Begin with non-confidential information only.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=business\">Send a private enquiry</a><a class=\"btn light\" href=\"mailto:karimkatlane0@gmail.com?subject=SEVA%20-%20Partnership%20enquiry\">Email us</a></div><p class=\"small\">Workspace enquiries are saved in your account. Email opens your mail app and is sent only by you. No external partner is announced as secured.</p>"
        ],
        [
          "Compare demand and supply",
          "<p>Collect private records with an organisation, need or offer, features, delivery mode, location, amount and source. Compare met criteria, conflicts and missing information, then prepare an evidence plan or a text AI brief.</p><p>The dataset stays in your account’s browser storage and supports JSON import and export. It is not a public partner network. Matching does not send messages or conclude agreements; images are not analysed by this comparison. The workspace currently uses Italian.</p><a class=\"btn\" href=\"/app?section=partnerships\">Open demand and supply →</a>"
        ]
      ]
    }
  },
  "developers": {
    "it": {
      "title": "Verificare, prima di dichiarare.",
      "tag": "SVILUPPATORI · DEVOPS · DOCUMENTAZIONE",
      "intro": "Un punto di ingresso per contribuire a SEVA con test riproducibili, dati minimi e confini chiari.",
      "sections": [
        [
          "Il servizio pubblicato",
          "<p>Questo SEVA usa ChatGPT Sites per ospitare il sito e l’accesso, un Worker per le API e un archivio D1 per i record associati all’account. Il progetto URBAN ONE su GitHub comprende anche altre applicazioni: un suo commit non aggiorna automaticamente questo Site.</p><p><a class=\"btn light\" href=\"https://github.com/karimkatlane0-crypto/-URBAN-ONE\">Apri il repository URBAN ONE ↗</a></p><p>La disponibilità pubblica del repository non concede automaticamente una licenza su ogni componente: controlla la licenza applicabile prima di riusare codice, nomi o contenuti.</p>"
        ],
        [
          "Come contribuire",
          "<ol><li>Descrivi un problema riproducibile con risultato atteso e osservato.</li><li>Usa dati sintetici; rimuovi credenziali, identificativi personali e schermate riservate.</li><li>Proponi una modifica limitata con prova del risultato.</li><li>Se riguarda sicurezza o privacy, scrivi privatamente al titolare prima di pubblicare dettagli.</li></ol><p>Le proposte non concedono accessi di amministrazione o autorizzazioni a operare sui dati degli utenti.</p>"
        ],
        [
          "Stato verificabile",
          "<p>Il 2 novembre 2026 è stato completato un acquisto Stripe TEST Enterprise con carta: checkout pagato, evento ricevuto, accesso TEST mostrato e rinnovo disattivato. Non è una vendita reale. La verifica degli altri metodi, dei servizi commerciali e della pubblicazione mobile resta separata.</p><p>Il sito espone <a href=\"/api/status\">uno stato tecnico pubblico</a>. Le API personali richiedono accesso e contesto dell’account; non sono una API pubblica per agenti esterni.</p>"
        ],
        [
          "Per agenti e strumenti di ricerca",
          "<p>La <a href=\"/llms.txt\">scheda pubblica per strumenti AI</a> raccoglie solo collegamenti e limiti del prodotto. Non concede autorizzazioni a inviare messaggi, acquistare, leggere workspace privati o impersonare l’utente.</p><p><a href=\"mailto:karimkatlane0@gmail.com?subject=SEVA%20-%20Segnalazione%20tecnica\">Segnala un problema tecnico</a> · <a href=\"/press\">Materiali per presentare SEVA</a></p>"
        ],
        [
          "Strumenti di calcolo SEVA",
          "<p>Il sito espone tre strumenti in sola lettura: seva_growth_scenario, seva_conversion_interval e seva_payment_readiness. I primi due calcolano da ipotesi o conteggi aggregati; il terzo restituisce evidenze datate del software, non una verifica live Stripe. Nessuno crea ordini, addebita carte o invia accrediti. Il plugin iniziale è privato del titolare: non è una pubblicazione nella directory pubblica.</p>"
        ],
        [
          "Open source e servizio ospitato",
          "<p>Il kit di integrazione scaricabile è gratuito con licenza MIT. Il servizio SEVA CMS ospitato ha un prezzo distinto di 250 €/mese + IVA applicabile, con primo mese gratuito quando la vendita sarà attiva. Non si dichiara open source l’intera piattaforma ospitata.</p><p>Versionamento del codice, isolamento per account, eventi di pagamento firmati e controlli automatici di regressione supportano lo sviluppo. OpenAI, ChatGPT e Codex sono servizi indipendenti: non sono dichiarati partnership, certificazioni, abbonamenti inclusi o budget AI illimitato.</p><a href=\"/downloads/LICENSE.txt\">Licenza MIT</a> · <a href=\"/cms#open-source\">CMS e offerta sviluppatori</a>"
        ]
      ]
    },
    "en": {
      "title": "Verify before you claim.",
      "tag": "DEVELOPERS · DEVOPS · DOCUMENTATION",
      "intro": "A starting point for contributing reproducible tests, minimal data and clearly scoped changes.",
      "sections": [
        [
          "The hosted service",
          "<p>This SEVA uses ChatGPT Sites for hosting and sign-in, a Worker for APIs and D1 for account-scoped records. The URBAN ONE GitHub project also contains other applications: a commit there does not automatically update this Site.</p><p><a class=\"btn light\" href=\"https://github.com/karimkatlane0-crypto/-URBAN-ONE\">Open the URBAN ONE repository ↗</a></p><p>A public repository does not automatically license every component. Check the applicable license before reusing code, names or content.</p>"
        ],
        [
          "Contributing",
          "<ol><li>Describe a reproducible issue, expected behavior and actual behavior.</li><li>Use synthetic data; remove credentials, personal identifiers and private screenshots.</li><li>Propose a focused change with evidence of the result.</li><li>Report security and privacy details privately to the owner before publishing.</li></ol><p>A contribution does not grant administrative access or permission to act on user data.</p>"
        ],
        [
          "Verifiable status",
          "<p>On 2 November 2026, an Enterprise Stripe TEST card subscription completed: paid checkout, delivered event, visible TEST access and renewal disabled. This was not a real sale. Other payment methods, commercial fulfillment and mobile publication require separate verification.</p><p>The Site exposes <a href=\"/api/status\">public technical status</a>. Personal APIs require sign-in and account context; they are not an external public agent API.</p>"
        ],
        [
          "For AI and research tools",
          "<p>The <a href=\"/llms.txt\">public AI-tool fact sheet</a> lists links and product limits only. It does not grant permission to send messages, make purchases, read private workspaces or impersonate users.</p><p><a href=\"mailto:karimkatlane0@gmail.com?subject=SEVA%20-%20Technical%20report\">Report a technical issue</a> · <a href=\"/press?lang=en\">Materials to introduce SEVA</a></p>"
        ],
        [
          "SEVA calculation tools",
          "<p>The Site exposes three read-only tools: seva_growth_scenario, seva_conversion_interval and seva_payment_readiness. The first two calculate from supplied assumptions or aggregate counts; the third returns dated software evidence, not a live Stripe verification. No tool creates orders, charges cards or sends payouts. The initial plugin is private to the owner; this is not a public directory listing.</p>"
        ],
        [
          "Open source and hosted service",
          "<p>The downloadable integration kit is licensed under MIT and remains free. The hosted SEVA CMS service is separately priced at €250/month plus applicable VAT, with the first month free when sales open. The complete hosted platform is not represented as open source.</p><p>Version-controlled source, account isolation, signed payment events and automated regression checks support development. OpenAI, ChatGPT and Codex remain independent services; no partnership, certification, bundled subscription or unlimited AI budget is claimed.</p><a href=\"/downloads/LICENSE.txt\">MIT licence</a> · <a href=\"/cms?lang=en#open-source\">CMS and developer offer</a>"
        ]
      ]
    }
  },
  "press": {
    "it": {
      "title": "SEVA, in parole concrete.",
      "tag": "PRESS KIT · CONDIVISIONE VOLONTARIA",
      "intro": "Immagine social e testi originali pronti da adattare ai tuoi canali. Materiali aggiornati al 7 novembre 2026.",
      "sections": [
        [
          "Un obiettivo. Il prossimo passo.",
          "<img src=\"/assets/seva-social-20261107.png\" alt=\"SEVA Intelligence Studio — Un obiettivo. Il prossimo passo.\" style=\"width:100%;height:auto;border-radius:12px\" loading=\"lazy\"><div class=\"actions\"><a class=\"btn\" href=\"/assets/seva-social-20261107.png\" download=\"seva-social-20261107.png\">Scarica immagine</a><a class=\"btn light\" href=\"/downloads/seva-launch-it-20261107.txt\" download>Scarica post e script</a><a class=\"btn light\" href=\"/growth-kit\">Adatta al tuo canale</a></div>"
        ],
        [
          "Descrizione breve",
          "<blockquote>SEVA è il workspace di Karim Katlane per trasformare un obiettivo in passi, criteri ed evidenze. Offre accesso Base gratuito, strumenti di organizzazione e un brief da usare con il proprio account AI.</blockquote><p>Link ufficiale: <a href=\"https://seva.karimkatlane0.chatgpt.site/\">seva.karimkatlane0.chatgpt.site</a></p>"
        ],
        [
          "Messaggio pronto da condividere",
          "<blockquote>Un progetto da iniziare. Un’idea da mettere in ordine. Un risultato da verificare. Con SEVA puoi organizzare obiettivi, conservare le prove e scegliere il prossimo passo. Scopri il progetto: <a href=\"/invite\">Apri l’invito SEVA</a>.</blockquote><p>Scarica i testi e scegli dove condividerli. Le pubblicazioni sui tuoi profili restano una tua scelta.</p>"
        ],
        [
          "Scheda essenziale",
          "<ul><li>Progetto e referente: SEVA · Karim Katlane · Trieste, Italia.</li><li>Pubblico: persone, negozi, community e organizzazioni interessate a progetti pilota.</li><li>Lingue pubbliche: italiano e inglese. Workspace: italiano.</li><li>Accesso: browser, con ChatGPT per il workspace personale.</li><li>Accesso Base gratuito. Provider esterni e servizi a pagamento hanno condizioni e costi separati.</li><li>AI: brief inviato manualmente al proprio provider, costi separati.</li></ul>"
        ],
        [
          "Uso corretto dei materiali",
          "<p>È consentito riprodurre questi testi originali per presentare SEVA citando il link e senza alterarne i fatti. Non è consentito far apparire OpenAI, ChatGPT, Codex, Amazon o EY come partner o certificatori di SEVA.</p><p>La disponibilità del press kit non dimostra pubblicazione su media terzi, pubblico raggiunto, partnership concluse, fatturato o distribuzione mondiale verificata.</p><p>Per interviste o collaborazione editoriale: <a href=\"mailto:karimkatlane0@gmail.com?subject=SEVA%20-%20Stampa\">karimkatlane0@gmail.com</a>.</p>"
        ]
      ]
    },
    "en": {
      "title": "SEVA, in practical terms.",
      "tag": "PRESS KIT · VOLUNTARY SHARING",
      "intro": "A social image and original copy ready to adapt to your channels. Materials updated 7 November 2026.",
      "sections": [
        [
          "One goal. Your next step.",
          "<img src=\"/assets/seva-social-20261107.png\" alt=\"SEVA Intelligence Studio — Un obiettivo. Il prossimo passo.\" style=\"width:100%;height:auto;border-radius:12px\" loading=\"lazy\"><div class=\"actions\"><a class=\"btn\" href=\"/assets/seva-social-20261107.png\" download=\"seva-social-20261107.png\">Download image</a><a class=\"btn light\" href=\"/downloads/seva-launch-en-20261107.txt\" download>Download posts and script</a><a class=\"btn light\" href=\"/growth-kit?lang=en\">Adapt to your channel</a></div>"
        ],
        [
          "Short description",
          "<blockquote>SEVA is Karim Katlane’s workspace for turning goals into steps, acceptance criteria and evidence. It offers free Basic access, organization tools and a brief to use with your own AI provider account.</blockquote><p>Official link: <a href=\"https://seva.karimkatlane0.chatgpt.site/?lang=en\">seva.karimkatlane0.chatgpt.site</a></p>"
        ],
        [
          "Ready-to-share message",
          "<blockquote>A project to start. An idea to organise. A result to check. With SEVA, organise goals, keep evidence and choose your next step. Discover the project: <a href=\"/invite?lang=en\">Open the SEVA invitation</a>.</blockquote><p>Download the copy and choose where to share it. Publishing on your profiles remains your choice.</p>"
        ],
        [
          "Essential facts",
          "<ul><li>Project and contact: SEVA · Karim Katlane · Trieste, Italy.</li><li>Audience: individuals, shops, communities and organizations interested in pilots.</li><li>Public languages: Italian and English. Workspace: Italian.</li><li>Access: browser, with ChatGPT sign-in for the personal workspace.</li><li>Free Base access. External providers and paid services have separate terms and costs.</li><li>AI: manually submit a brief to your own provider; costs are separate.</li></ul>"
        ],
        [
          "Using these materials",
          "<p>You may reproduce this original copy to introduce SEVA, with attribution to its official link and without changing the facts. Do not present OpenAI, ChatGPT, Codex, Amazon or EY as SEVA partners or certifiers.</p><p>Availability of a press kit is not evidence of third-party media coverage, audience reach, concluded partnerships, revenue or verified worldwide distribution.</p><p>For interviews or editorial collaboration: <a href=\"mailto:karimkatlane0@gmail.com?subject=SEVA%20-%20Press\">karimkatlane0@gmail.com</a>.</p>"
        ]
      ]
    }
  },
  "support": {
    "it": {
      "tag": "SEVA · ASSISTENZA",
      "title": "Ricevi assistenza per SEVA.",
      "intro": "Contatta Karim Katlane per il sito SEVA e i suoi strumenti gratuiti in ChatGPT o Codex.",
      "sections": [
        ["SEVA Enterprise Onboarding · 15 competenze", "<p>Per il <a href=\"/onboarding/competenze\">catalogo e il plugin SEVA Enterprise Onboarding</a>, indica il nome della competenza, la versione del pacchetto e il passaggio che richiede assistenza. Per <a href=\"/territorio\">GPS e Territorio</a>, descrivi il problema del permesso o del piano usando coordinate di esempio di luoghi pubblici. Usa i contatti del titolare indicati sotto; non inviare chiavi, file riservati o la tua posizione precisa.</p>"],
        [
          "Contatta il titolare",
          "<p><a class=\"btn\" href=\"https://wa.me/393519754943\" target=\"_blank\" rel=\"noopener noreferrer\">Apri WhatsApp · +39 351 975 4943 ↗</a></p><p>Il numero è indicato dal titolare per contattare SEVA. Non serve salvarlo in rubrica. Aprendo il link passi a WhatsApp e scegli se inviare il messaggio; nessun invio o consenso marketing automatico. La disponibilità dell’account e la risposta dipendono da WhatsApp e dal titolare. Puoi sempre usare email o richiesta nel workspace.</p><p><a href=\"mailto:karimkatlane0@gmail.com\">karimkatlane0@gmail.com</a></p><p>Puoi scrivere senza accedere. Se usi il workspace puoi anche inviare una richiesta privata tramite Contatta SEVA. Non è un servizio di emergenza e non è promesso un tempo di risposta contrattuale.</p><p><a href=\"/app?section=contact\">Contatta SEVA nel tuo workspace</a></p>"
        ],
        [
          "Descrivi il problema",
          "<p>Indica pagina o strumento, risultato atteso, cosa è accaduto e orario approssimativo. Usa dati di esempio aggregati. Non inviare password, credenziali di pagamento, documenti di identità o dati finanziari riservati.</p>"
        ],
        [
          "Disponibilità e richieste sui dati",
          "<p><a href=\"/payments\">Disponibilità pagamenti</a> · <a href=\"/privacy\">Privacy</a> · <a href=\"/terms\">Termini</a></p><p>I tre strumenti SEVA calcolano scenari, intervalli di conversione e informazioni datate sullo stato del servizio. Non leggono account privati dei provider e non eseguono pagamenti. Il plug-in attuale è privato; l’approvazione nella directory pubblica non è attestata.</p>"
        ]
      ]
    },
    "en": {
      "tag": "SEVA · SUPPORT",
      "title": "Get help with SEVA.",
      "intro": "Contact Karim Katlane about the SEVA website and its free tools in ChatGPT or Codex.",
      "sections": [
        ["SEVA Enterprise Onboarding · 15 skills", "<p>For the <a href=\"/onboarding/competenze?lang=en\">SEVA Enterprise Onboarding catalog and plugin</a>, include the skill name, package version and step you need help with. For <a href=\"/territorio\">GPS and Territory</a>, describe permission or planning issues using sample coordinates of public places. Use the owner’s contacts below; do not send keys, private files or your precise location.</p>"],
        [
          "Contact the project owner",
          "<p><a class=\"btn\" href=\"https://wa.me/393519754943\" target=\"_blank\" rel=\"noopener noreferrer\">Open WhatsApp · +39 351 975 4943 ↗</a></p><p>This number was supplied by the owner for SEVA enquiries. You do not need to save it in your contacts. Opening the link takes you to WhatsApp, where you choose whether to send; there is no automatic sending or marketing consent. Account availability and replies depend on WhatsApp and the owner. Email and workspace enquiries remain available.</p><p><a href=\"mailto:karimkatlane0@gmail.com\">karimkatlane0@gmail.com</a></p><p>Email is available without signing in. If you use the workspace, you can also send a private request through Contact SEVA. No emergency service or contractual response time is offered.</p><p><a href=\"/app?section=contact\">Contact SEVA in your workspace</a></p>"
        ],
        [
          "Describe the issue",
          "<p>Include the page or tool, what you expected, what happened and the approximate time. Use aggregate example inputs. Do not send passwords, payment credentials, identity documents or private financial records.</p>"
        ],
        [
          "Availability and data requests",
          "<p><a href=\"/payments?lang=en\">Payment availability</a> · <a href=\"/privacy?lang=en\">Privacy</a> · <a href=\"/terms?lang=en\">Terms</a></p><p>The three SEVA tools calculate scenarios, conversion intervals and dated readiness information. They do not read private provider accounts or execute payments. The current plugin is private; public directory approval has not been established.</p>"
        ]
      ]
    }
  },
  "join": {
    "it": {
      "tag": "SEVA · SETTIMANA DEL PRIMO PASSO",
      "title": "Un obiettivo. Un prossimo passo. Inizia gratis.",
      "intro": "Dal 3 al 9 novembre 2026 prova SEVA Base gratuitamente e trasforma un obiettivo utile in un’azione con criterio e prova.",
      "sections": [
        [
          "La promozione attiva",
          "<div class=\"cards\"><article><span class=\"number\">01</span><h3>Scegli un obiettivo</h3><p>Usa un obiettivo personale, per il negozio o per la community. Mantieni il perimetro abbastanza piccolo da agire questa settimana.</p></article><article><span class=\"number\">02</span><h3>Definisci il successo</h3><p>Aggiungi un criterio di accettazione osservabile prima di iniziare.</p></article><article><span class=\"number\">03</span><h3>Registra il risultato</h3><p>Salva la prova, poi decidi se ripetere, correggere o fermarti.</p></article></div><div class=\"actions\"><a class=\"btn\" href=\"/app?section=home\">Avvia il mio obiettivo gratuito</a><button class=\"btn light\" data-copy-link=\"https://seva.karimkatlane0.chatgpt.site/join\">Copia il link della promozione</button></div><p class=\"small\">Periodo promozionale: 3–9 novembre 2026. SEVA Base è già gratuito: la promozione non aggiunge abbonamenti, sconti, premi, rinnovi automatici o iscrizioni marketing. Non è richiesta una carta.</p>"
        ],
        [
          "Scegli il primo passo",
          "<div class=\"cards\"><article><span class=\"number\">01</span><h3>Per il tuo negozio</h3><p>Descrivi un bisogno, un link pubblico al negozio e il risultato da misurare. Dopo l’accesso puoi inviare una proposta privata.</p><a class=\"btn\" href=\"/app?section=business\">Proponi un pilota negozio</a></article><article><span class=\"number\">02</span><h3>Per creator e community</h3><p>Proponi un progetto creativo o di community con una prossima azione chiara. Partecipare non pubblica il tuo nome.</p><a class=\"btn\" href=\"/app?section=community\">Proponi una collaborazione</a></article><article><span class=\"number\">03</span><h3>Prova i numeri</h3><p>Confronta un budget mensile e l’incertezza della conversione con dati aggregati di esempio. Non serve un account.</p><a class=\"btn\" href=\"/growth\">Apri il calcolatore</a></article></div>"
        ],
        [
          "Un link da condividere",
          "<blockquote>SEVA invita negozi e creator a un pilota volontario: un obiettivo, una prossima azione e una prova del risultato. L’accesso Base è gratuito. Esplora il progetto e valuta se può esserti utile.</blockquote><div class=\"actions\"><button class=\"btn\" data-copy-link=\"https://seva.karimkatlane0.chatgpt.site/join\">Copia link di invito</button><a class=\"btn light\" href=\"/campaigns\">Prepara un messaggio mirato</a></div><p>Scegli tu i destinatari e invii personalmente l’invito. Questa pagina non raccoglie contatti dal web, non invia messaggi di massa e non iscrive nessuno automaticamente.</p>"
        ],
        [
          "Amazon: la guida per studenti",
          "<p>La guida SEVA ti aiuta a valutare l’offerta studenti Amazon.it in base al tuo bisogno, al budget e alle condizioni attuali. Contiene un link pubblicitario di affiliazione. In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei.</p><div class=\"actions\"><a class=\"btn\" href=\"/amazon\">Apri la guida Amazon per studenti →</a><a class=\"btn light\" href=\"/students\">Esplora SEVA Campus</a></div><p class=\"small\">Idoneità, prezzi, iscrizione ed eventuali pagamenti sono gestiti da Amazon. L’accesso gratuito a SEVA non richiede un acquisto. Nessuna certificazione universitaria o sponsorizzazione è implicata.</p>"
        ],
        [
          "Accesso e pagamenti",
          "<p>Le pagine pubbliche sono aperte. Il workspace personale richiede l’accesso con ChatGPT e mantiene separati i dati degli account. Un invito non concede accessi amministrativi o ai dati altrui.</p><p><strong>SEVA CMS · 250 € al mese + IVA, primo mese gratuito.</strong> Il percorso in preparazione comprende salvataggio online degli obiettivi, profilo studenti e registro assistenza privato. Crediti AI e assistenza personale non sono inclusi. Il rinnovo mensile richiederà adesione esplicita e sarà gestibile dal portale Stripe.</p><p>SEVA Base resta gratuito durante la preparazione. Il piano non è ancora acquistabile; commissioni automatiche e accrediti ai venditori non sono attivi.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=billing\">Verifica il piano nel tuo account →</a></div><p><a href=\"/payments\">Disponibilità pagamenti</a> · <a href=\"/privacy\">Privacy</a> · <a href=\"/terms\">Termini</a> · <a href=\"/support\">Assistenza</a></p>"
        ]
      ]
    },
    "en": {
      "tag": "SEVA · FIRST STEP WEEK",
      "title": "One goal. One next step. Start free.",
      "intro": "From 3 to 9 November 2026, try SEVA Basic free and turn one useful goal into an action with an acceptance criterion and evidence.",
      "sections": [
        [
          "The active promotion",
          "<div class=\"cards\"><article><span class=\"number\">01</span><h3>Choose one goal</h3><p>Use a personal, shop or community goal. Keep the scope small enough to act on this week.</p></article><article><span class=\"number\">02</span><h3>Define success</h3><p>Add one observable acceptance criterion before you begin.</p></article><article><span class=\"number\">03</span><h3>Record the outcome</h3><p>Save the evidence, then decide whether to repeat, revise or stop.</p></article></div><div class=\"actions\"><a class=\"btn\" href=\"/app?section=home\">Start my free goal</a><button class=\"btn light\" data-copy-link=\"https://seva.karimkatlane0.chatgpt.site/join?lang=en\">Copy promotion link</button></div><p class=\"small\">Promotion period: 3–9 November 2026. SEVA Basic is already free: this promotion adds no paid subscription, discount, prize, automatic renewal or marketing enrollment. No card is required.</p>"
        ],
        [
          "Choose your first step",
          "<div class=\"cards\"><article><span class=\"number\">01</span><h3>For your shop</h3><p>Describe one need, a public shop link and the result you want to measure. Send a private proposal after signing in.</p><a class=\"btn\" href=\"/app?section=business\">Propose a shop pilot</a></article><article><span class=\"number\">02</span><h3>For creators and communities</h3><p>Propose a creative or community project with a clear next action. Joining does not publish your name.</p><a class=\"btn\" href=\"/app?section=community\">Propose a collaboration</a></article><article><span class=\"number\">03</span><h3>Try the numbers</h3><p>Compare a monthly budget and conversion uncertainty using aggregate sample data. No account is required.</p><a class=\"btn\" href=\"/growth?lang=en\">Open the calculator</a></article></div>"
        ],
        [
          "A link you can share",
          "<blockquote>SEVA invites shops and creators to a voluntary pilot: one goal, one next step and evidence of the result. Basic access is free. Explore the project and decide whether it helps you.</blockquote><div class=\"actions\"><button class=\"btn\" data-copy-link=\"https://seva.karimkatlane0.chatgpt.site/join?lang=en\">Copy invitation link</button><a class=\"btn light\" href=\"/campaigns?lang=en\">Prepare a tailored message</a></div><p>You choose the recipients and send the invitation yourself. This page does not scrape contacts, send bulk messages or enroll anyone automatically.</p>"
        ],
        [
          "Amazon: the student guide",
          "<p>The SEVA guide helps you evaluate the Amazon.it student offer against your needs, budget and current conditions. It contains an advertising affiliate link. As an Amazon Associate I earn from qualifying purchases.</p><div class=\"actions\"><a class=\"btn\" href=\"/amazon?lang=en\">Open the Amazon student guide →</a><a class=\"btn light\" href=\"/students?lang=en\">Explore SEVA Campus</a></div><p class=\"small\">Amazon manages eligibility, prices, sign-up and any payments. Free access to SEVA requires no purchase. No university certification or sponsorship is implied.</p>"
        ],
        [
          "Access and payments",
          "<p>The public pages are open. Your personal workspace requires ChatGPT sign-in and keeps account data separate. An invitation grants no administrator access or access to another person’s data.</p><p><strong>SEVA CMS · €250 per month + VAT, first month free.</strong> The planned service includes online goal saving, a student profile and a private service register. AI credits and personal consulting are not included. Monthly renewal will require explicit consent and will be manageable through the Stripe portal.</p><p>SEVA Basic remains free during preparation. The plan cannot yet be purchased; automatic sales commissions and seller payouts are not active.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=billing\">Check the plan in your account →</a></div><p><a href=\"/payments?lang=en\">Payment availability</a> · <a href=\"/privacy?lang=en\">Privacy</a> · <a href=\"/terms?lang=en\">Terms</a> · <a href=\"/support?lang=en\">Support</a></p>"
        ]
      ]
    }
  },
  "global": {
    "it": {
      "tag": "SEVA · INTERNATIONAL",
      "title": "Un obiettivo concreto. Una community aperta.",
      "intro": "Il punto di ingresso per studenti, creator, negozi e sviluppatori. Scegli un percorso, prova gli strumenti disponibili e documenta il tuo primo risultato.",
      "sections": [
        [
          "Inizia qui",
          "<p>Le pagine pubbliche sono disponibili in italiano e inglese. L’accesso Base è attualmente gratuito; il workspace personale richiede un account ChatGPT e la sua interfaccia è in italiano.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=goals\">Crea il tuo primo obiettivo →</a><a class=\"btn light\" href=\"/global?lang=en\" lang=\"en\">Explore in English</a></div>"
        ],
        [
          "Parti da una domanda o da una foto",
          "<p>Descrivi un prodotto, un servizio o un argomento, aggiungi una foto in anteprima e prepara una ricerca web o un brief AI. Apri Google per usare Lens e caricare lì la foto; per l’analisi AI usa il tuo account ChatGPT o Gemini.</p><p>La bozza resta nella memoria del browser. SEVA non analizza o carica automaticamente la foto. Risultati, prezzi e disponibilità sono da verificare.</p><a class=\"btn\" href=\"/app?section=search\">Apri ricerca SEVA →</a>"
        ],
        [
          "CRM per relazioni reali",
          "<p>Organizza aziende, contatti, fonti, attività e prossimi passi nel tuo account privato. Per indicare Cliente o Partner serve una prova registrata della relazione. SEVA non certifica la relazione e non crea clienti automaticamente.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=crm\">Apri il CRM privato →</a><a class=\"btn light\" href=\"/app?section=business\">Invia una richiesta Business →</a></div>"
        ],
        [
          "Opportunità di affiliazione per settore",
          "<p>Esplora TheFork Italia, viaggi, shopping, formazione e programmi per le imprese. Filtra le fonti ufficiali e prepara un percorso di candidatura privato.</p><p>I programmi elencati sono opportunità da valutare; non attestano una partnership SEVA o un pagamento automatico.</p><a class=\"btn\" href=\"/affiliates\">Esplora le affiliazioni →</a>"
        ],
        [
          "Scegli il tuo percorso",
          "<div class=\"cards\"><article><span class=\"number\">01</span><h3>Studio e community</h3><p>Definisci un traguardo di studio, un’azione e una prova del risultato.</p><a href=\"/students\">Esplora SEVA Campus →</a></article><article><span class=\"number\">02</span><h3>Creator e negozi</h3><p>Prepara un progetto, un invito e uno scenario economico con ipotesi esplicite.</p><a href=\"/campaigns\">Prepara il piano →</a></article><article><span class=\"number\">03</span><h3>Sviluppatori</h3><p>Prova l’API REST pubblica per calcoli aggregati e informazioni sui servizi.</p><a href=\"/developers\">Guida API e specifica →</a></article></div>"
        ],
        [
          "SEVA e Microsoft Power BI",
          "<p>Scarica le query di importazione e usa il CSV dei tuoi aggregati. Il pacchetto include campioni datati e istruzioni; il collaudo nel tuo ambiente Microsoft resta da completare.</p><a class=\"btn light\" href=\"/insights#powerbi-import\">Apri il pacchetto Power BI →</a>"
        ],
        [
          "Il tuo primo risultato verificabile",
          "<ol><li>Scrivi un obiettivo, ad esempio completare un capitolo entro venerdì.</li><li>Scegli la prossima azione e un criterio: rispondere correttamente ad almeno 8 domande su 10.</li><li>Esegui l’azione e registra il risultato con una prova.</li></ol><p>Il primo passo è completo quando hai un obiettivo, un’azione e un criterio salvati nel tuo workspace. Il risultato dell’azione resta da verificare.</p>"
        ],
        [
          "Condividi un invito",
          "<blockquote>SEVA aiuta a trasformare un’intenzione in un obiettivo, un’azione e una prova. Esplora gli strumenti gratuiti e scegli il tuo primo passo.</blockquote><div class=\"actions\"><button class=\"btn\" data-copy-link=\"https://seva.karimkatlane0.chatgpt.site/global?lang=en\">Copia il link internazionale</button><button class=\"btn light\" data-copy-link=\"https://seva.karimkatlane0.chatgpt.site/global\">Copia il link italiano</button><a class=\"btn light\" href=\"/press\">Apri il press kit</a></div><p class=\"small\">Scegli tu dove condividere il link. Questi pulsanti copiano un indirizzo e non inviano messaggi.</p>"
        ],
        [
          "Servizi disponibili",
          "<p>Puoi usare gli strumenti Base, consultare le risorse pubbliche e proporre una collaborazione. Per servizi già concordati sono disponibili collegamenti Stripe una tantum da 50 € e 500 €.</p><p>L’abbonamento CMS da 250 € + IVA, con un mese gratuito e accesso automatico e gli accrediti automatici ai creator sono ancora in preparazione. La disponibilità dei provider dipende dal paese e dall’account; non è stata verificata in ogni paese.</p><div class=\"actions\"><a class=\"btn light\" href=\"/payments\">Verifica i pagamenti</a><a class=\"btn light\" href=\"/partners\">Proponi una collaborazione</a><a class=\"btn light\" href=\"/support\">Assistenza</a></div><p class=\"small\">SEVA è un progetto indipendente di Karim Katlane. <a href=\"/terms\">Termini</a> · <a href=\"/privacy\">Privacy</a></p>"
        ]
      ]
    },
    "en": {
      "tag": "SEVA · INTERNATIONAL",
      "title": "One concrete goal. An open community.",
      "intro": "A starting point for students, creators, shops and developers. Choose a pathway, try the available tools and document your first result.",
      "sections": [
        [
          "Start here",
          "<p>Public pages are available in English and Italian. Basic access is currently free; your personal workspace requires a ChatGPT account and its interface is in Italian.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=goals\">Create your first goal →</a><a class=\"btn light\" href=\"/global\" lang=\"it\">Esplora in italiano</a></div>"
        ],
        [
          "Start with a question or photo",
          "<p>Describe a product, service or topic, add an optional photo preview, and prepare a web search or an AI brief. Open Google to use Lens and upload the photo there; use your own ChatGPT or Gemini account for AI analysis.</p><p>SEVA keeps this draft in browser memory. It does not analyse or upload the photo automatically. Search results, prices and availability remain to be checked.</p><a class=\"btn\" href=\"/app?section=search\">Open search workspace →</a>"
        ],
        [
          "CRM for real relationships",
          "<p>Keep companies, contacts, sources, activities and next steps in your private account. A customer or partner label requires a recorded supporting reference. SEVA does not certify that relationship or create customers automatically.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=crm\">Open private CRM →</a><a class=\"btn light\" href=\"/app?section=business\">Send a business request →</a></div>"
        ],
        [
          "Affiliation opportunities across sectors",
          "<p>Explore TheFork Italia, travel, shopping, learning and business programmes. Filter official sources and prepare a private application plan.</p><p>Programme listings are opportunities to evaluate; they do not establish a SEVA partnership or an automatic payment.</p><a class=\"btn\" href=\"/affiliates?lang=en\">Explore affiliation pathways →</a>"
        ],
        [
          "Choose your pathway",
          "<div class=\"cards\"><article><span class=\"number\">01</span><h3>Study and community</h3><p>Set a study goal, choose an action and record evidence of the result.</p><a href=\"/students?lang=en\">Explore SEVA Campus →</a></article><article><span class=\"number\">02</span><h3>Creators and shops</h3><p>Prepare a project, an invitation and a budget scenario with explicit assumptions.</p><a href=\"/campaigns?lang=en\">Prepare your plan →</a></article><article><span class=\"number\">03</span><h3>Developers</h3><p>Try the public REST API for aggregate calculations and service information.</p><a href=\"/developers?lang=en\">API guide and specification →</a></article></div>"
        ],
        [
          "SEVA and Microsoft Power BI",
          "<p>Download the import queries and use your aggregate CSV. The package includes dated samples and setup instructions; validation in your Microsoft environment remains pending.</p><a class=\"btn light\" href=\"/insights?lang=en#powerbi-import\">Open the Power BI package →</a>"
        ],
        [
          "Your first verifiable result",
          "<ol><li>Write a goal, such as completing a chapter by Friday.</li><li>Choose the next action and a criterion: answer at least 8 out of 10 questions correctly.</li><li>Perform the action and record the result with evidence.</li></ol><p>Your setup is complete when you have saved a goal, an action and a criterion in your workspace. The action’s outcome still needs to be verified.</p>"
        ],
        [
          "Share an invitation",
          "<blockquote>SEVA helps turn an intention into a goal, an action and evidence. Explore the free tools and choose your first step.</blockquote><div class=\"actions\"><button class=\"btn\" data-copy-link=\"https://seva.karimkatlane0.chatgpt.site/global?lang=en\">Copy international link</button><button class=\"btn light\" data-copy-link=\"https://seva.karimkatlane0.chatgpt.site/global\">Copy Italian link</button><a class=\"btn light\" href=\"/press?lang=en\">Open the press kit</a></div><p class=\"small\">You choose where to share the link. These buttons copy an address and do not send messages.</p>"
        ],
        [
          "Available services",
          "<p>You can use Basic tools, explore public resources and propose a collaboration. One-time Stripe links for €50 and €500 are available for services already agreed.</p><p>CMS subscriptions at €250 + VAT, with one free month and automatic access and automatic creator payouts remain in preparation. Provider availability depends on the country and account; availability in every country has not been verified.</p><div class=\"actions\"><a class=\"btn light\" href=\"/payments?lang=en\">Check payment availability</a><a class=\"btn light\" href=\"/partners?lang=en\">Propose a collaboration</a><a class=\"btn light\" href=\"/support?lang=en\">Support</a></div><p class=\"small\">SEVA is an independent project by Karim Katlane. <a href=\"/terms?lang=en\">Terms</a> · <a href=\"/privacy?lang=en\">Privacy</a></p>"
        ]
      ]
    }
  },
  "ristoranti": {
    "it": {
      "tag": "RISTORANTI · RICHIESTE · CRM",
      "title": "Un tavolo, un incontro, un prossimo passo.",
      "intro": "Apri i ristoranti, definisci zona e budget, poi conserva la tua richiesta nel CRM personale.",
      "sections": [
        [
          "1. Trova un ristorante",
          "<p>Il pulsante apre direttamente la selezione TheFork per Trieste, con i locali, i menu e la disponibilità gestiti dal servizio.</p><div class=\"actions\"><a class=\"btn\" href=\"https://www.thefork.it/ristoranti/trieste-c558971\" target=\"_blank\" rel=\"noopener noreferrer\">Ristoranti a Trieste su TheFork ↗</a><a class=\"btn light\" href=\"https://www.thefork.it/\" target=\"_blank\" rel=\"noopener noreferrer\">Scegli un’altra città ↗</a></div><p class=\"small\">Fonte: TheFork Italia, consultata il 7 novembre 2026. Link esterni non affiliati: prenotazione, prezzo e disponibilità si confermano su TheFork. SEVA non riceve la prenotazione.</p>"
        ],
        [
          "2. Prepara la richiesta",
          "<p>Indica esigenza, budget, zona e fonte del ristorante. Puoi scrivere o usare la dettatura del dispositivo, quando disponibile. Controlla sempre il riepilogo.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=search&amp;sector=ristoranti\">Prepara richiesta ristorante →</a><a class=\"btn light\" href=\"/tavoli\">Prova ordini al tavolo →</a></div>"
        ],
        [
          "3. Continua nel tuo CRM",
          "<p>Nel riepilogo scegli «Prepara scheda e attività nel CRM». La scheda e l’attività restano una bozza modificabile: confermi tu il salvataggio. Un link pubblico a un locale non costituisce consenso a messaggi promozionali.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=crm\">Apri il CRM integrato →</a><a class=\"btn light\" href=\"/app?section=goals\">Organizza l’obiettivo →</a></div>"
        ],
        [
          "Un’attività da presentare?",
          "<p>Per il tuo sito puoi provare l’editor CMS gratuito e consultare la proposta di servizio. Ogni attivazione richiede una conferma del perimetro e delle condizioni.</p><div class=\"actions\"><a class=\"btn light\" href=\"/cms#offerta\">CMS · proposta e attivazione →</a></div>"
        ]
      ]
    },
    "en": {
      "tag": "RESTAURANTS · REQUESTS · CRM",
      "title": "A table, a meeting, a next step.",
      "intro": "Open restaurants, define your area and budget, then keep your request in your personal CRM.",
      "sections": [
        [
          "1. Find a restaurant",
          "<p>Open the TheFork selection for Trieste to see restaurants, menus and availability managed by the service.</p><div class=\"actions\"><a class=\"btn\" href=\"https://www.thefork.it/ristoranti/trieste-c558971\" target=\"_blank\" rel=\"noopener noreferrer\">Trieste restaurants on TheFork ↗</a><a class=\"btn light\" href=\"https://www.thefork.it/\" target=\"_blank\" rel=\"noopener noreferrer\">Choose another city ↗</a></div><p class=\"small\">Source: TheFork Italy, reviewed 7 November 2026. External, non-affiliate links: confirm booking, price and availability on TheFork. SEVA does not receive your booking.</p>"
        ],
        [
          "2. Prepare the request",
          "<p>Describe your need, budget, area and restaurant source. Use text or device dictation where supported, then review your summary.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=search&amp;sector=ristoranti\">Prepare a restaurant request →</a><a class=\"btn light\" href=\"/tavoli\">Try table ordering demo →</a></div>"
        ],
        [
          "3. Continue in your CRM",
          "<p>Choose «Prepara scheda nel CRM» in the Italian workspace summary. Review the editable contact and activity draft before saving. A public restaurant link is not consent to promotional messages.</p><div class=\"actions\"><a class=\"btn\" href=\"/app?section=crm\">Open integrated CRM →</a><a class=\"btn light\" href=\"/app?section=goals\">Organise your goal →</a></div>"
        ],
        [
          "Present your business",
          "<p>Try the free CMS editor and review the service proposal for your website. Scope and terms must be confirmed before activation.</p><div class=\"actions\"><a class=\"btn light\" href=\"/cms?lang=en#offerta\">CMS · proposal & activation →</a></div>"
        ]
      ]
    }
  }
};
