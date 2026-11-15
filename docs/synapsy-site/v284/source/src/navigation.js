// Only known document addresses are repaired. API requests and writes keep
// their original routing, methods, authentication and error responses.
export const SEVA_DOCUMENT_PATHS = [
 '/europa','/onboarding','/onboarding/competenze','/premium','/territorio','/territorio/azioni','/workspace/backup','/kkubera/cataloghi',
 '/music','/kkubera/1','/kkubera/3','/kkubera/4','/kkubera/booking','/kkubera/confronto','/titans/operazioni','/titans/manifesto','/titans/completamento','/connections/telecom','/studio/diritti','/studio/trattative','/galleria',
 '/integrazioni','/rapporto','/flussi','/funzionalita','/cerca','/traduci','/superapp','/aggiornamenti','/gmas','/bisogni','/matching','/kkubera/2','/kkubera/visite','/kkubera/immobili','/mobile','/valore-condiviso','/checkout/bonifico',
 '/arena','/automation','/senses','/decisioni','/titans','/databaseunitary','/infrastructure','/orchestra',
 '/kkubera','/migrazione','/engage','/global','/studio','/app','/account','/identita','/connections','/cms','/servizi','/acquista','/ristoranti','/tavoli','/invite','/listen','/aura','/fiducia',
 '/affiliates','/amazon','/amazon/setup','/join','/support','/growth','/network',
 '/payments','/sports','/creators','/creators/account','/creator-commissions',
 '/campaigns','/students','/alerts','/broadcast','/terms','/privacy','/cookies',
 '/social','/sme','/india','/partners','/developers','/commerce','/growth-kit','/insights','/press',
 '/guide-computer-studenti','/guide-accessori-studio'
];
export const SEVA_NAVIGATION_ALIASES = {
 '/synapsy':'/superapp',
 '/v150':'/superapp','/v200':'/superapp','/v201':'/superapp','/devsecopsmegav201':'/superapp',
 '/intelligence-studio':'/studio','/studio-developers':'/studio',
 '/spid':'/identita#spid-procedura','/identity':'/identita','/attivazioni':'/identita#attivazioni',
 '/thefork':'/ristoranti','/defork':'/ristoranti','/restaurants':'/ristoranti','/home':'/superapp','/index.html':'/superapp','/dashboard':'/app','/workspace':'/app',
 '/crm':'/app?section=crm','/goals':'/app?section=goals','/obiettivi':'/app?section=goals',
 '/whatsapp':'/app?section=messages','/risposte':'/app?section=messages','/contatti':'/app?section=crm&focus=contacts','/ai':'/app?section=ai','/search':'/app?section=search','/ricerca':'/app?section=search',
 '/billing':'/app?section=billing','/settings':'/app?section=settings',
 '/execution':'/app?section=execution','/collegamenti':'/connections',
 '/android':'/insights#android','/advanced':'/insights#advanced',
 '/pagamenti':'/payments','/powerbi':'/insights','/power-bi':'/insights',
 '/woocommerce':'/commerce#create-woocommerce-store','/wordpress':'/commerce#woocommerce-plugin',
 '/terms-and-conditions':'/terms'
};

export function resolveSevaDocumentURL(input,method='GET') {
 if(!['GET','HEAD'].includes(method))return null;
 const url=new URL(input),path=url.pathname.replace(/\/+$/,'').toLowerCase()||'/';
 // Recover the two known SEVA links accidentally pasted together. Keep the
 // destination fixed and relative; this is not a general embedded-URL parser.
 if(url.pathname==='/app'&&[...url.searchParams].length===1&&url.searchParams.get('section')==='servicehttps://seva.karimkatlane0.chatgpt.site/arena')return '/app?section=service';
 if(url.pathname==='/arenahttps://seva.karimkatlane0.chatgpt.site/app'&&[...url.searchParams].length===1&&url.searchParams.get('section')==='service')return '/arena';
 const legacy=/^\/v(?:150|200|201)\/(arena|studio|app)$/.exec(path);
 const revision=/^\/v[1-9]\d{0,5}(?:\/(.+))?$/.exec(path);
 const revisedPath=revision?.[1]?'/'+revision[1]:null;
 const revisionTarget=revision&&!revisedPath?'/superapp':revisedPath&&(SEVA_DOCUMENT_PATHS.includes(revisedPath)||revisedPath==='/start'||revisedPath==='/live')?revisedPath:null;
 const destination=legacy?'/'+legacy[1]:SEVA_NAVIGATION_ALIASES[path]||revisionTarget;
 if(!destination)return SEVA_DOCUMENT_PATHS.includes(path)&&url.pathname!==path?path+url.search+url.hash:null;
 const target=new URL(destination,url.origin);
 // Keep language, campaign and research choices; alias sections take priority.
 for(const key of new Set(url.searchParams.keys()))if(!target.searchParams.has(key))
  for(const value of url.searchParams.getAll(key))target.searchParams.append(key,value);
 if(!target.hash)target.hash=url.hash;
 const resolved=target.pathname+target.search+target.hash;
 return resolved===url.pathname+url.search+url.hash?null:resolved;
}

export function renderNavigationRecovery(language='it',style='') {
 const en=language==='en',t=(it,eng)=>en?eng:it,suffix=en?'?lang=en':'';
 const links=[['/cerca'+suffix,t('Cerca in SEVA','Search SEVA')],['/global'+suffix,t('Tutti gli strumenti','All tools')],['/app?section=search',t('Cerca o prepara una richiesta','Search or prepare a request')],['/app?section=crm',t('CRM e relazioni','CRM and relationships')],['/app?section=goals',t('Obiettivi e azioni','Goals and actions')],['/connections'+suffix,t('Verifica i collegamenti','Check connections')],['/support'+suffix,t('Assistenza','Support')]];
 return `<!doctype html><html lang="${en?'en':'it'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${t('Ritrova il tuo percorso','Find your next step')} · SEVA</title><style>${style}.recovery-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin:30px 0}.recovery-links a{display:block;padding:22px;border:1px solid var(--line);border-radius:12px;text-decoration:none;font-weight:bold}main{padding:60px 0}</style></head><body><div class="wrap"><header><a class="brand" href="/global${suffix}">SEVA<span>✳</span></a></header><main><p class="eyebrow">${t('Collegamento da aggiornare','Link needs updating')}</p><h1>${t('Riparti da qui.','Continue from here.')}</h1><p>${t('Questa pagina non è disponibile a questo indirizzo. Scegli la funzione che cercavi: ti portiamo al percorso attuale.','This page is unavailable at this address. Choose the feature you need to open its current location.')}</p><nav class="recovery-links" aria-label="${t('Percorsi disponibili','Available destinations')}">${links.map(([href,label])=>`<a href="${href}">${label} →</a>`).join('')}</nav></main></div></body></html>`;
}
