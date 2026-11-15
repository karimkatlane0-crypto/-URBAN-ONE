import {REMOTE_REPORT_CONTENT} from './remote-report.js';
import {INDIA_CONTENT} from './india-news.js';
import {SOCIAL_CONTENT} from './social-kit.js';
import {isSevaToolAvailable} from './functional-status.js';
import {SEVA_EXPERIENCE_TOOLS} from './experience.js';
import {SEVA_DOCUMENT_PATHS} from './navigation.js';
import {PUBLIC_CONTENT} from './public-content.js';
import {STUDY_GUIDES_CONTENT} from './study-guides.js';
import {INVITE_CONTENT} from './invite.js';
import {AFFILIATE_CONTENT} from './affiliates.js';
import {COMMERCE_CONTENT} from './commerce-pages.js';
import {CAMPUS_CONTENT} from './campus.js';
import {CREATOR_CONTENT} from './campaigns.js';
import {SPORTS_CONTENT} from './sports.js';
import {GROWTH_CONTENT} from './growth-pages.js';
import {NETWORK_CONTENT} from './network.js';
import {AMAZON_CONTENT} from './amazon.js';

export const SEVA_SEARCH_SCHEMA={type:'object',additionalProperties:false,properties:{query:{type:'string',maxLength:160,description:'Words describing a SEVA page or tool; never credentials or personal records.'},language:{type:'string',enum:['it','en'],default:'it'},limit:{type:'integer',minimum:1,maximum:50,default:20},offset:{type:'integer',minimum:0,maximum:200,default:0}}};
const searchNormalise=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const searchPlain=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const searchEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const searchAliases={
 '/europa':'europa europe studenti students universita university associazioni associations immobili real estate housing student accommodation registri professionali official sources',
 '/premium':'premium pro candidature volontarie rosa clienti potenziali immobili bed breakfast bnb consenso nominativo revoca professionista consultazione 1 euro abbonamento 200 matching applications voluntary shortlist consent',
 '/territorio/azioni':'farmacie farmacia salute FVG licenza fonti settoriali pharmacy pharmacies health source availability azioni territoriali circoscrizione comune provincia regione stato europa prossimo passo followup crm fonte prova riesame territorial actions district municipality province region state europe followup review',
 '/workspace/backup':'backup workspace archivio esportazione copie recupero integrita checksum sezioni account crm obiettivi export archive recovery sections integrity',
 '/titans/completamento':'centro operativo personale dodici aree requisiti configurazione prova data audit stato completamento dashboard riconciliazione 22 blocchi sblocchi obiettivi dipendenze allegati',
 '/connections/telecom':'whatsapp template approvati messenger casella pagina risposta sms skebby consenso crm invio conferma ricevuta',
 '/territorio':'gps passeggiata settoriale inspire unione europea eu settori geografia fonti dati indirizzi numeri civici walking sectors european spatial data',
 '/onboarding/competenze':'15 quindici skill competenze enterprise titans onboarding plugin creator procedure mlops dlops kubernetes drive gps inspire',
 '/onboarding':'karim katlane enterprise onboarding skill manifesto manifest pubblico public world avvio workspace build verify execute release',
 '/kkubera/cataloghi':'cataloghi civici indirizzi trieste friuli venezia giulia ascot anncsu rest api disponibili disponibilita immobili catasto fonti indirizzario addresses property availability source',
 '/music':'spotify musica player ufficiale audio locale ascolto playlist brani album artisti podcast music listening',
 '/superapp':'seva enterprise intelligence studio home homepage dominio sito unico executive consulting advisors',
 '/studio':'seva enterprise studio internazionale international lingue languages contatti replies',
 '/servizi':'titans psd2 chiamata tariffa prezzo 5 call per request servizi partner onboarding urban one pagamento payment services plugin chatgpt titans cms commerce',
 '/rapporto':'enterprise release pubblicazione rapporto audit stato operativo wordpress windsor blocco remoto dbrelay kpm report status',
 '/start':'inizia percorso guidato introduzione obiettivo ai crm dati start guided workflow introduction',
 '/india':'india blogger news media press announcement hindi notizie comunicato',
 '/social':'linkedin instagram tiktok social reel blog india usa pass ticket concerto concert',
 '/sme':'small business pmi sme internazionale international growth startup linkedin usa india',
 '/funzionalita':'mancanze funzionalita collaudo kubernets kubernetes cluster pipeline spid cie ordini tavoli arena',
 '/developers':'api search rest openapi mcp plugin creator sviluppatori developer',
 '/integrazioni':'anthropic claude grafana temporal typesafe jev enterprise tutte integrazioni revisioni storico titans google contacts github wordpress shopify paypal microsoft vertex integrations history',
 '/connections':'anthropic claude grafana temporal typesafe jev raintank osservabilita workflow collegamenti integrazioni connessioni gmail drive github stripe wordpress stato openai chatgpt gemini google provider connections integrations',
 '/infrastructure':'kubernetes kubernets cluster deploy pipeline dbrelay',
 '/databaseunitary':'dbu database dbrelay dati data recupero ripristino backup cronologia telecom sim ateco recovery' ,
 '/aura':'aura utilita valore alternativa scelta usefulness value decision',
 '/senses':'ciechi ipovedenti voce immagini ascolto accessibilita openai ai multimodale blind low vision voice accessibility multimodal',
 '/gmas':'openai ai ricerca web fonti citazioni research sources citations',
 '/traduci':'openai ai traduzione lingue translation languages',
 '/app?section=ai':'openai chatgpt gemini google provider api personale chiave credito limiti consumo budget brief personal key credit spending',
 '/app?section=execution':'openai api personale ai esecuzione executive sequenza comandi obiettivi budget limiti consumo execution sequence commands goals personal spending',
 '/app?section=crm':'contatti clienti relazioni sincronizzazione cloud dispositivi telefono aggiornamento automatico sync refresh devices contacts customers',
 '/app?section=goals':'obiettivi azioni piani sincronizzazione cloud dispositivi telefono rilettura sync refresh devices goals actions plans',
 '/kkubera':'immobili soggiorni case urban one real estate stays properties europa europe gmas inspire civici francia france paesi bassi netherlands pdok booking bnb premium pro gps voce notifiche',
 '/kkubera/2':'immobili visite calendario real estate visits calendar',
 '/kkubera/3':'kkubera 3 richieste immobili clienti crm matching corrispondenze budget superficie visite requirements properties matching',
 '/kkubera/4':'kkubera 4 civici unita disponibilita vendita locazione affitto libero non libero unknown verifica fonte data gps passeggiata vocale addresses availability sale rental walk speech',
 '/titans/operazioni':'titans esecuzione controlli ricevute obiettivi ampiezza profondita avanti indietro breadth depth forward backward operations execution evidence',
 '/insights':'powerbi power bi microsoft analytics analisi advanced avanzati android videos video messenger whatsapp integrazioni convenienza internazionale'
};
const searchExtra={
 '/europa':['Europa · Studenti e associazioni','Europe · Students and associations'],
 '/premium':['Premium Pro · Candidature e richieste','Premium Pro · Applications and requests'],
 '/territorio/azioni':['Fonti settoriali · Farmacie e azioni territoriali','Sector sources · Pharmacies and territorial actions'],
 '/workspace/backup':['Copie del workspace · Archivio personale','Workspace copies · Personal archive'],
 '/titans/completamento':['Centro operativo · SYNAPSY','Operations centre · SYNAPSY'],
 '/connections/telecom':['Canali e invii · SYNAPSY','Channels and sending · SYNAPSY'],
 '/territorio':['Territorio · GPS e temi INSPIRE','Territory · GPS and INSPIRE themes'],
 '/onboarding/competenze':['15 competenze · SEVA Enterprise Onboarding','15 skills · SEVA Enterprise Onboarding'],
 '/onboarding':['Karim Katlane · Enterprise onboarding','Karim Katlane · Enterprise onboarding'],
 '/kkubera/cataloghi':['KKUBERA · Cataloghi e civici','KKUBERA · Address catalogs'],
 '/music':['Musica · File locali e Spotify','Music · Local files and Spotify'],
 '/superapp':['SYNAPSY · Il tuo spazio di lavoro','SYNAPSY · Your workspace'],
 '/kkubera/3':['KKUBERA 3 · Richieste e immobili','KKUBERA 3 · Requirements and properties'],
 '/kkubera/4':['KKUBERA 4 · Civici e disponibilità','KKUBERA 4 · Addresses and availability'],
 '/titans/operazioni':['TITANS · Controlli operativi','TITANS · Operational checks'],
 '/studio':['Studio internazionale · SEVA Enterprise','International studio · SEVA Enterprise'],
 '/creator-commissions':['Commissioni creator · calcolatore','Creator commissions · calculator'],
 '/global':['Tutti gli strumenti SEVA','All SEVA tools'],
 '/listen':['Ascolto · leggi e ascolta','Listening · read and listen'],
 '/fiducia':['Fiducia · metodo e limiti','Trust · approach and limits'],
 '/account':['Il tuo account SEVA','Your SEVA account'],
 '/identita':['Identità e attivazioni','Identity and activation'],
 '/orchestra':['Orchestra · coordinamento AI','Orchestra · AI coordination'],
 '/checkout/bonifico':['Bonifico · istruzioni per servizi concordati','Bank transfer · agreed-service instructions']
};
const searchDescriptions={
 '/europa':['Fonti ufficiali per studenti, associazioni e professionisti immobiliari in Europa, con copertura e limiti dichiarati.','Official sources for students, associations and real-estate professionals in Europe, with scope and limitations.'],
 '/premium':['Candidature volontarie, ricerca per criteri dichiarati e autorizzazioni verso un professionista nominato. Offerte da 1 € e 200 € in preparazione; recapiti e addebiti non attivi.','Voluntary applications, declared-criteria search and permission for a named professional. €1 and €200 offers in preparation; contact disclosure and charges are not active.'],
 '/territorio/azioni':['Consulta le farmacie FVG dalla fonte pubblica con licenza e date. Accedi per preparare attività nel tuo CRM e riesaminare le ricevute; disponibilità e apertura corrente restano da verificare.','Search FVG pharmacies from the public source with licence and dates. Sign in to prepare CRM activities and review receipts; availability and current opening status require separate verification.'],
 '/workspace/backup':['Pagina di accesso alle copie personali. Accedi con ChatGPT per esportare le sezioni previste, controllarne la copertura e verificare il file; l’esportazione non equivale a un ripristino completo dell’infrastruttura.','Entry page for personal copies. Sign in with ChatGPT to export the supported sections, review their coverage and verify the file; an export is not a full infrastructure restore.'],
 '/titans/completamento':['Dodici aree del tuo account con stato, prove datate, requisiti mancanti e prossimo passo. La lettura non attiva provider.','Twelve account areas with status, dated evidence, missing requirements and next steps. Reading does not activate providers.'],
 '/connections/telecom':['Configurazione riservata al titolare, casella Messenger e invii singoli WhatsApp o SMS con consenso CRM e conferma esplicita.','Owner-only configuration, Messenger inbox and single WhatsApp or SMS sends with CRM consent and explicit confirmation.'],
 '/kkubera/4':['Disponibilità dichiarate per unità, vendita e locazione distinte, fonte e scadenza della verifica. Passeggiata GPS e voce locale su richiesta.','Declared availability by unit, separate sale and rental states, source and review date. GPS walking and local speech on request.'],
 '/onboarding':['Tre percorsi operativi, skill pubblica e verifica su richiesta degli archivi del proprio account.','Three working paths, a public skill and on-demand checks of your own account records.'],
 '/kkubera/cataloghi':['Ricerca dei civici nella fonte regionale FVG/Ascot con provenienza e data. Gli indirizzi non attestano disponibilità commerciale.','Search civic addresses in the regional FVG/Ascot source with origin and date. Addresses do not establish commercial availability.'],
 '/music':['File audio del dispositivo e player ufficiale Spotify caricato solo su richiesta. Ricerca nel servizio esterno; diritti e disponibilità dipendono dal provider.','Device audio files and the official Spotify player loaded only on request. Search in the external service; rights and availability depend on the provider.'],
 '/app?section=crm':['CRM privato: rilettura dei dati salvati al ritorno nella scheda o online, con protezione dei moduli aperti. Stesso account sui tuoi dispositivi.','Private CRM: saved data is read again when the tab becomes visible or connectivity returns, with open forms protected. Use the same account on your devices.'],
 '/app?section=goals':['Rileggi gli obiettivi cloud su un dispositivo vuoto o con il piano allineato. Invia le modifiche con Sincronizza obiettivi e confronta gli eventuali conflitti.','Read cloud goals on an empty device or an aligned local plan. Send changes with Sync goals and review any conflicts.'],
 '/superapp':['Il punto di partenza dell’edizione Enterprise: obiettivi, CRM, servizi e stato delle integrazioni.','The Enterprise edition home: goals, CRM, services and integration status.'],
 '/studio':['Studio internazionale con risposte, lingue e percorsi AI secondo la configurazione personale disponibile.','International studio with replies, languages and AI workflows using an available personal configuration.'],
 '/app?section=ai':[
  'Prepara un brief per ChatGPT o Gemini. Gli account abilitati possono collegare una API OpenAI personale e confermare gli invii entro i limiti scelti. Disponibilità e credito dipendono dal provider.',
  'Prepare a brief for ChatGPT or Gemini. Eligible accounts can connect a personal OpenAI API key and confirm requests within their chosen limits. Availability and credit depend on the provider.'
 ],
 '/app?section=execution':[
  'Organizza gli obiettivi e prepara una sequenza con la tua API OpenAI. Richiede chiave personale, limiti AI e autorizzazione; il ciclo avanza mentre la pagina è aperta e visibile.',
  'Organise goals and prepare a sequence using your OpenAI API. A personal key, AI limits and authorisation are required; the sequence runs while the page is open and visible.'
 ],
 '/gmas':[
  'Cerca sul web con OpenAI e consulta le fonti citate. Le richieste AI richiedono accesso, una credenziale abilitata e conferma del consumo.',
  'Search the web with OpenAI and review cited sources. AI requests require sign-in, an enabled credential and confirmation of API usage.'
 ],
 '/senses':[
  'Usa voce e immagini del dispositivo. L’analisi OpenAI richiede accesso, una credenziale abilitata e un invio confermato; lettura e anteprima locali dipendono dal browser.',
  'Use device voice and images. OpenAI analysis requires sign-in, an enabled credential and a confirmed request; local speech and previews depend on the browser.'
 ],
 '/traduci':[
  'Prepara una traduzione di testo con OpenAI. Richiede accesso, una credenziale abilitata e conferma del consumo API.',
  'Prepare a text translation with OpenAI. Sign-in, an enabled credential and confirmation of API usage are required.'
 ],
 '/connections':[
  'Consulta lo stato dei collegamenti e i prossimi passi per OpenAI, Gemini, Google, pagamenti e canali. Ogni scheda distingue risorse esterne, funzioni disponibili e attivazioni da completare.',
  'Review connection status and next steps for OpenAI, Gemini, Google, payments and channels. Each card distinguishes external resources, available features and pending activation.'
 ],
 '/account':[
  'Apri la pagina di accesso SEVA. Per consultare o modificare il tuo profilo personale devi accedere con ChatGPT.',
  'Open the SEVA account entry page. Sign in with ChatGPT to view or edit your personal profile.'
 ]
};
const searchItalianOnly=new Set(['/flussi','/app','/tavoli','/kkubera/2','/kkubera/immobili','/kkubera/cataloghi','/territorio','/territorio/azioni','/workspace/backup','/music','/mobile','/valore-condiviso','/checkout/bonifico','/bisogni','/gmas','/creator-commissions']);

export function sevaSearchCatalog(language='it'){
 const en=language==='en',docs={...REMOTE_REPORT_CONTENT,...INDIA_CONTENT,...SOCIAL_CONTENT,...AMAZON_CONTENT,...NETWORK_CONTENT,...GROWTH_CONTENT,...SPORTS_CONTENT,...CREATOR_CONTENT,...CAMPUS_CONTENT,...PUBLIC_CONTENT,...COMMERCE_CONTENT,...AFFILIATE_CONTENT,...INVITE_CONTENT,...STUDY_GUIDES_CONTENT};
 const entries=new Map();
 const add=(path,title,description,kind='page')=>{
  if(!isSevaToolAvailable(path))return;
  const target=new URL(path,'https://seva.karimkatlane0.chatgpt.site');
  const key=target.pathname+target.search;
  if(entries.has(key))return;
  description=searchDescriptions[key]?.[en?1:0]||description;
  const italianOnly=searchItalianOnly.has(target.pathname);
  if(en&&!italianOnly)target.searchParams.set('lang','en');
  entries.set(key,{title:searchPlain(title),description:searchPlain(description),url:target.href,path:target.pathname+target.search+target.hash,kind,access:target.pathname==='/app'?'sign_in':'public',language:italianOnly?'it':language,keywords:searchNormalise(key+' '+title+' '+description+' '+(searchAliases[key]||searchAliases[target.pathname]||''))});
 };
 for(const [,path,it,english] of SEVA_EXPERIENCE_TOOLS){const key=new URL(path,'https://seva.invalid').pathname.slice(1),doc=docs[key]?.[language];add(path,en?english:it,doc?.intro||(en?'Open this SYNAPSY tool to see its features and availability.':'Apri lo strumento SYNAPSY per consultarne funzioni e disponibilità.'),'tool');}
 // Only public page metadata and generic workspace destinations enter this index.
 // Owner archives, account records, downloads and provider data are never indexed.
 for(const path of SEVA_DOCUMENT_PATHS){
  if(['/app','/amazon/setup','/creators/account','/kkubera/visite','/cerca'].includes(path))continue;
  const doc=docs[path.slice(1)]?.[language],extra=searchExtra[path];
  if(doc||extra)add(path,doc?.title||extra[en?1:0],doc?.intro||(en?'Explore this SYNAPSY page.':'Esplora questa pagina SYNAPSY.'));
 }
 return [...entries.values()];
}

export function searchSeva(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!Object.hasOwn(SEVA_SEARCH_SCHEMA.properties,k)))throw Error('Invalid search fields.');
 const {query='',language='it',limit=20,offset=0}=input;
 if(typeof query!=='string'||query.length>160||!['it','en'].includes(language)||!Number.isInteger(limit)||limit<1||limit>50||!Number.isInteger(offset)||offset<0||offset>200)throw Error('Invalid search parameters.');
 const terms=searchNormalise(query).split(' ').filter(Boolean),catalog=sevaSearchCatalog(language);
 const matches=catalog.map(item=>({item,score:terms.reduce((n,term)=>n+(searchNormalise(item.title).includes(term)?5:1),0)})).filter(({item})=>terms.every(term=>item.keywords.split(' ').some(word=>word.startsWith(term)))).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,language));
 return {scope:'seva_public_pages_and_tools',language,total:matches.length,offset,limit,hasMore:offset+limit<matches.length,results:matches.slice(offset,offset+limit).map(({item:{keywords,...item}})=>item),externalSearch:false,personalDataSearched:false};
}

export function bindSevaSiteSearch(){
 const form=document.getElementById('site-search-form');if(!form)return;
 const query=document.getElementById('site-search-query'),results=document.getElementById('site-search-results'),status=document.getElementById('site-search-status'),more=document.getElementById('site-search-more'),submit=document.getElementById('site-search-submit');
 const en=document.documentElement.lang==='en';let controller=null,generation=0,nextOffset=Number(more.dataset.next||0),activeQuery=query.value,hasMore=!more.hidden;
 const text=(it,english)=>en?english:it;
 function resetControls(){submit.disabled=false;more.disabled=false;more.hidden=!hasMore||query.value!==activeQuery;results.removeAttribute('aria-busy');}
 function renderItem(item){
  const li=document.createElement('li'),link=document.createElement('a'),h=document.createElement('h2'),p=document.createElement('p'),meta=document.createElement('small');
  const url=new URL(item.path,location.origin);if(url.origin!==location.origin)return null;
  link.href=url.pathname+url.search+url.hash;h.textContent=item.title;p.textContent=item.description;
  meta.textContent=(item.access==='sign_in'?text('Accesso con ChatGPT','ChatGPT sign-in'):text('Pagina pubblica','Public page'))+(en&&item.language==='it'?' · Italian interface':'');
  link.append(h,p,meta);li.append(link);results.append(li);return link;
 }
 async function search(append=false){
  if(append&&(!hasMore||query.value!==activeQuery||more.disabled))return;
  const current=++generation,requestedQuery=query.value,offset=append?nextOffset:0;controller?.abort();controller=new AbortController();
  submit.disabled=true;more.disabled=true;status.textContent=text('Ricerca in corso…','Searching…');results.setAttribute('aria-busy','true');
  try{
   const response=await fetch('/api/v1/search',{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:requestedQuery,language:en?'en':'it',limit:20,offset}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
   if(!response.ok)throw Error();const data=await response.json();if(current!==generation||query.value!==requestedQuery)return;
   if(!append){results.replaceChildren();document.getElementById('site-search-refine')?.remove();}
   const links=data.results.map(renderItem);nextOffset=data.offset+data.results.length;activeQuery=requestedQuery;hasMore=data.hasMore;
   status.textContent=data.total?nextOffset+' / '+data.total+' '+text('risultati','results'):text('Nessun risultato per tutti i termini. Prova meno parole o un nome come OpenAI, Gemini, CRM o AURA.','No results matching all terms. Try fewer words or a name such as OpenAI, Gemini, CRM or AURA.');
   if(append)links.find(Boolean)?.focus();
   if(!append){const address=new URL('/cerca',location.origin);if(en)address.searchParams.set('lang','en');if(activeQuery.trim())address.searchParams.set('q',activeQuery.trim());history.replaceState(null,'',address.pathname+address.search);}
  }catch(error){if(current===generation&&error.name!=='AbortError')status.textContent=text('Ricerca non disponibile. I risultati precedenti restano consultabili. Riprova con Trova o Altri risultati.','Search unavailable. Previous results remain available. Retry with Find or More results.');}
  finally{if(current===generation)resetControls();}
 }
 form.addEventListener('submit',event=>{event.preventDefault();return search();});
 more.addEventListener('click',()=>search(true));
 query.addEventListener('input',()=>{generation++;controller?.abort();resetControls();status.textContent=text('Premi Trova per aggiornare i risultati.','Press Find to update results.');});
 window.addEventListener('pagehide',()=>{generation++;controller?.abort();resetControls();});
 window.addEventListener('pageshow',resetControls);
}

export function renderSevaSiteSearch(language='it',query=''){
 const en=language==='en',lang=en?'en':'it',t=(it,english)=>en?english:it,s=en?'?lang=en':'',q=typeof query==='string'?query.slice(0,160):'';
 const data=searchSeva({query:q,language:lang,limit:50});
 const remaining=data.hasMore?searchSeva({query:q,language:lang,limit:50,offset:data.results.length}).results:[];
 const fallback=remaining.length?`<noscript><h2>${t('Altri risultati','More results')}</h2><ul>${remaining.map(item=>`<li><a href="${searchEscape(item.path)}">${searchEscape(item.title)}</a></li>`).join('')}</ul></noscript>`:'';
 const cards=data.results.map(item=>`<li><a href="${searchEscape(item.path)}"><h2>${searchEscape(item.title)}</h2><p>${searchEscape(item.description)}</p><small>${item.access==='sign_in'?t('Accesso con ChatGPT','ChatGPT sign-in'):t('Pagina pubblica','Public page')}${en&&item.language==='it'?' · Italian interface':''}</small></a></li>`).join('');
 return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t('Cerca in SEVA','Search SEVA')} · Intelligence Studio</title><meta name="description" content="${t('Trova pagine, strumenti e integrazioni SEVA.','Find SEVA pages, tools and integrations.')}"><style>
 *{box-sizing:border-box}body{margin:0;background:#111820;color:#f5f4ec;font:16px/1.65 system-ui,sans-serif}.search-wrap{max-width:1050px;margin:auto;padding:48px 24px 72px}.search-wrap h1{font-size:clamp(36px,6vw,64px);line-height:1.05;letter-spacing:-.05em;margin:12px 0 20px}.search-wrap a{color:inherit}.search-kicker{color:#ffe600;letter-spacing:.15em;font-size:12px}.search-intro{max-width:700px;color:#cfd5db}.search-form{display:flex;align-items:end;gap:12px;margin:30px 0 12px}.search-field{flex:1;min-width:0}.search-field label{display:block;margin-bottom:8px}.search-form input{width:100%;min-height:50px;font:inherit;padding:12px;border:1px solid #80909f;border-radius:8px;background:#182430;color:#fff}.search-wrap button{min-height:50px;padding:12px 20px;border:0;border-radius:8px;background:#ffe600;color:#161b20;font:600 16px system-ui;cursor:pointer}.search-wrap button:disabled{opacity:.55}.search-shortcuts{display:flex;gap:20px;flex-wrap:wrap;margin:20px 0}.search-results{padding:0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.search-results li{min-width:0}.search-results a{height:100%;display:block;padding:22px;text-decoration:none;border:1px solid #56616d;border-radius:10px;background:#19232e;overflow-wrap:anywhere}.search-results a:hover{border-color:#ffe600}.search-results h2{margin:0 0 8px;font-size:20px}.search-results p{font-size:14px;color:#d0d8df;margin:0 0 14px}.search-results small{color:#ffe980}.search-wrap :focus-visible{outline:3px solid #ffe600;outline-offset:4px}[hidden]{display:none!important}html[data-seva-theme=metal] .search-wrap{color:#13271f}html[data-seva-theme=metal] .search-intro{color:#36515c}html[data-seva-theme=metal] .search-kicker{color:#645500}@media(max-width:650px){.search-form{align-items:stretch;flex-direction:column}.search-results{grid-template-columns:1fr}.search-wrap{padding:32px 18px}}
 </style></head><body><a href="#search-main" class="skip">${t('Vai al contenuto','Skip to content')}</a><main class="search-wrap" id="search-main"><p class="search-kicker">SEVA / ${t('RICERCA','SEARCH')}</p><h1>${t('Trova il prossimo passo.','Find your next step.')}</h1><p class="search-intro">${t('Pagine, strumenti e collegamenti in un unico indice. Cerca per nome o per attività e apri direttamente la funzione.','Pages, tools and links in one index. Search by name or activity and open the tool directly.')}</p><form class="search-form" id="site-search-form" action="/cerca" method="get" role="search"><input type="hidden" name="lang" value="${lang}"><div class="search-field"><label for="site-search-query">${t('Cerca in SEVA','Search SEVA')}</label><input id="site-search-query" name="q" type="search" maxlength="160" value="${searchEscape(q)}" placeholder="AURA, CRM, API, KKUBERA…" autocomplete="off" aria-describedby="site-search-scope"></div><button id="site-search-submit" type="submit">${t('Trova','Find')}</button></form><p id="site-search-scope" class="search-intro">${t('La ricerca riguarda il catalogo SEVA, senza leggere account, file personali o risultati dal web. I risultati contengono tutti i termini cercati. Inserisci il nome di una funzione, senza dati riservati.','Search covers the SEVA catalog, without reading accounts, personal files or web results. Results match all search terms. Enter a feature name without confidential data.')}</p><nav class="search-shortcuts" aria-label="${t('Percorsi rapidi','Quick links')}"><a href="/cerca${s}">${t('Tutti gli strumenti','All tools')}</a><a href="/gmas">${t('Ricerca web · GMAS','Web search · GMAS')}</a><a href="/connections${s}">${t('Stato collegamenti','Connection status')}</a><a href="/developers${s}">API & plugin</a></nav><p id="site-search-status" role="status" aria-live="polite">${data.total?data.results.length+' / '+data.total+' '+t('risultati','results'):t('Nessun risultato per tutti i termini. Prova meno parole o un nome come OpenAI, Gemini, CRM o AURA.','No results matching all terms. Try fewer words or a name such as OpenAI, Gemini, CRM or AURA.')}</p><ul class="search-results" id="site-search-results">${cards}</ul><button id="site-search-more" type="button" data-next="${data.results.length}"${data.hasMore?'':' hidden'}>${t('Altri risultati','More results')}</button>${data.hasMore?`<p id="site-search-refine">${t('Usa la ricerca per trovare altre pagine.','Use search to find more pages.')}</p>`:''}${fallback}</main><script>(${bindSevaSiteSearch.toString()})();</script></body></html>`;
}

export function withSevaOwnerNavigation(html,language='it'){
 const en=language==='en',suffix=en?'?lang=en':'';
 const nav='<nav aria-label="'+(en?'SEVA navigation':'Navigazione SEVA')+'" style="display:flex;flex-wrap:wrap;gap:20px;padding:16px 24px;border-bottom:1px solid #64748b"><a href="/superapp'+suffix+'" style="color:inherit">SEVA</a><a href="/cerca'+suffix+'" style="color:inherit">'+(en?'Search all pages':'Cerca in tutte le pagine')+'</a><a href="/account'+suffix+'" style="color:inherit">Account</a><a href="/connections'+suffix+'" style="color:inherit">'+(en?'Connections':'Collegamenti')+'</a><a href="/app?section=orders" style="color:inherit">'+(en?'CRM orders':'Ordini CRM')+'</a></nav>';
 return html.replace(/<body\b[^>]*>/i,tag=>tag+nav);
}
