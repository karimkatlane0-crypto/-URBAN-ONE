import {isSevaToolAvailable,filterUnavailableNavigation} from './functional-status.js';
import {STUDIO_LANGUAGES} from './studio-languages.js';

// Use the complete approved artwork without cropping or redrawing it.
// The original and previous assets are retained in assets/brand-history.
export const SEVA_BRAND_STYLE=`
#seva-experience .seva-orbit-mark{display:block;flex:none;width:42px;height:42px}
#seva-experience .seva-orbit-mark img{display:block;width:42px;height:42px;object-fit:contain}
#seva-brand-opening[hidden]{display:none}
#seva-copyright{box-sizing:border-box;position:relative;width:100%;padding:24px max(24px,calc((100% - 1280px)/2));border-top:1px solid #cbd5d5;background:#fff;color:#192f3d;font:12px/1.65 system-ui,sans-serif;overflow-wrap:anywhere}
#seva-copyright p{margin:5px 0;color:inherit}#seva-copyright p+p{color:#526571}#seva-copyright a{color:inherit;text-underline-offset:3px}
#seva-copyright a:focus-visible{outline:3px solid #216c79;outline-offset:4px}
@media print{#seva-copyright{background:white;color:#172a24}}
`;

export function bindSevaBrandOpening(){
 const opening=document.getElementById('seva-brand-opening');
 if(!opening||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const key='seva-brand-opening-20261111';
 try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'seen');}catch{}
 const logo=opening.querySelector('img'),button=document.getElementById('seva-brand-enter');
 let closed=false,timer;
 const close=()=>{
  if(closed)return;
  closed=true;opening.hidden=true;clearTimeout(timer);
  document.removeEventListener('keydown',close,true);
  document.removeEventListener('pointerdown',close,true);
  logo.removeEventListener('load',ready);logo.removeEventListener('error',close);
  if(document.activeElement===button)document.querySelector('.seva-identity')?.focus();
 };
 const ready=()=>{if(!closed){clearTimeout(timer);timer=setTimeout(close,1800);}};
 opening.hidden=false;
 document.addEventListener('keydown',close,true);
 document.addEventListener('pointerdown',close,true);
 button.addEventListener('click',close,{once:true});
 logo.addEventListener('load',ready,{once:true});logo.addEventListener('error',close,{once:true});
 timer=setTimeout(close,3500);
 if(logo.complete){if(logo.naturalWidth)ready();else close();}
}

export function sevaBrandOpening(en=false){
 return '<section id="seva-brand-opening" aria-label="SYNAPSY · di Karim Katlane" hidden><div class="seva-brand-card"><img src="/assets/seva-logo.png" width="1536" height="1536" alt="SYNAPSY" fetchpriority="high"><p>di Karim Katlane</p><small class="seva-opening-rights">© 2026 Karim Katlane</small><button type="button" id="seva-brand-enter">'+(en?'Enter SYNAPSY':'Entra in SYNAPSY')+' →</button></div></section><script>('+bindSevaBrandOpening.toString()+')();</script>';
}

// One presentation layer for every SEVA view. No account data or provider calls.
export const SEVA_EXPERIENCE = {
  name:'SYNAPSY',
  edition:'CONNECTED SPACE',
  displayName:'SYNAPSY · Connected space',
  editionSince:'2026-11-14',
  canonicalOrigin:'https://seva.karimkatlane0.chatgpt.site',
  entries:['/app?section=home','/app?section=crm','/kkubera','/studio/diritti','/music','/titans/operazioni'],
  legacyReleases:['v150','v200','v201']
};

// Six work areas in the shared navigation. Specialist tools stay searchable.
export const SYNAPSY_PRIMARY_NAV = [
  ['workspace','/app?section=home','Oggi','Today'],
  ['crm','/app?section=crm','Clienti','Clients'],
  ['kkubera','/kkubera','KKUBERA','KKUBERA'],
  ['synapsy-studio','/studio/diritti','Studio','Studio'],
  ['music','/music','Musica','Music'],
  ['titans-operations','/titans/operazioni','TITANS','TITANS']
];

export const SEVA_EXPERIENCE_TOOLS = [
  ['europe','/europa','Europa · studenti e associazioni','Europe · students and associations'],
  ['workspace','/app?section=home','Oggi · attività e prossimi passi','Today · tasks and next steps'],
  ['music','/music','Musica · i tuoi brani','Music · your tracks'],
  ['synapsy-runtime','/titans/manifesto','TITANS · stato operativo AI','TITANS · AI operational status'],
  ['synapsy-studio','/studio/diritti','Studio · idee, opere e diritti','Studio · ideas, works and rights'],
  ['synapsy-deals','/studio/trattative','Trattative · proposte e versioni','Negotiations · proposals and versions'],
  ['synapsy-gallery','/galleria','Galleria · schede pubblicate','Gallery · published cards'],
  ['kkubera3','/kkubera/3','KKUBERA · richieste e abbinamenti','KKUBERA · requirements and matches'],
  ['kkubera4','/kkubera/4','KKUBERA 4 · civici e disponibilità','KKUBERA 4 · addresses and availability'],
  ['titans-operations','/titans/operazioni','TITANS · controlli con ricevuta','TITANS · checks with receipts'],
  ['integrations','/integrazioni','Tutte le integrazioni · cronologia e stato','All integrations · history and status'],
  ['start','/start','Inizia da qui · percorso guidato','Start here · guided workflow'],
  ['flows','/flussi','Flussi, CRM e notifiche','CRM workflows and notifications'],
  ['functional','/funzionalita','Cosa funziona e cosa manca','What works and what is missing'],
  ['site-search','/cerca','Cerca in SYNAPSY','Search SYNAPSY'],
  ['aura','/aura','AURA · valuta una scelta','AURA · assess a decision'],
  ['listen','/listen','Ascolto · leggi e ascolta','Listening · read and listen'],
  ['home','/superapp','Il tuo punto di partenza','Your starting point'],
  ['updates','/aggiornamenti','Plancia di lancio · qualità e risultati','Launch dashboard · quality and results'],
  ['engage','/engage','Partecipa · campagne e compensi','Participate · campaigns and rewards'],
  ['needs','/bisogni','I miei bisogni · obiettivi e compensi','My needs · targets and rewards'],
  ['matching','/matching','Matching · interesse e proposte','Matching · interest and proposals'],
  ['premium','/premium','Premium · Candidature','Premium · Applications'],
  ['gmas','/gmas','GMAS · ricerca web e proposte accessibili','GMAS · web search and accessible offers'],
  ['goals','/app?section=goals','Crea e segui un obiettivo','Create and track a goal'],
  ['crm','/app?section=crm','Gestisci relazioni e contatti','Manage relationships and contacts'],
  ['search','/app?section=search','Cerca prodotti e servizi','Find products and services'],
  ['table-orders','/tavoli','Ordini al tavolo · prova','Table ordering · demo'],
  ['kkubera','/kkubera','KKUBERA · immobili, visite e richieste','KKUBERA · properties, viewings and requirements'],
  ['kkubera-catalog','/kkubera/1','KKUBERA · catalogo immobili','KKUBERA · property catalogue'],
  ['kkubera-compare','/kkubera/confronto','Confronto offerte · calcolo locale','Offer comparison · local calculation'],
  ['kkubera-visits','/kkubera/2','KKUBERA · immobili e calendario','KKUBERA · properties and calendar'],
  ['kkubera-property','/kkubera/immobili','KKUBERA · analisi dei costi','KKUBERA · cost analysis'],
  ['mobile-apps','/mobile','Uso sul telefono · guida web','On your phone · web guide'],
  ['shared-value','/valore-condiviso','Valore condiviso · proposta','Shared value · proposal'],
  ['migrazione','/migrazione','Migrazione CRM · Drive e file','CRM migration · Drive and files'],
  ['translator','/traduci','Traduttore AI · testo e lingue','AI translator · text and languages'],
  ['studio','/studio','Lingue e composizione · risposte da rivedere','Languages and composition · drafts to review'],
  ['ai','/app?section=ai','Assistente AI','AI assistant'],
  ['senses','/senses','Accessibilità · voce e immagini','Accessibility · voice and images'],
  ['totem','/app?section=business&offer=totem','Totem e digital signage · richiesta','Totems and digital signage · enquiry'],
  ['messages','/app?section=messages','Conversazioni e bozze','Conversations and drafts'],
  ['service','/app?section=service','Assistenza · richieste e consegne','Support · requests and delivery'],
  ['arena','/arena','Arena · sport e obiettivi','Arena · sports and goals'],
  ['automation','/automation','Follow-up e prossime attività','Follow-up and next actions'],
  ['cms','/cms#editor','Crea contenuti nel CMS','Create content in the CMS'],
  ['payments','/payments','Pagamenti · servizi concordati','Payments · agreed services'],
  ['decisioni','/decisioni','Analizza i risultati marketing','Analyse marketing results'],
  ['titans','/titans','Piano TITANS · ruoli, dati e budget','TITANS plan · roles, data and budget'],
  ['databaseunitary','/databaseunitary','I miei dati','My data'],
  ['infrastructure','/infrastructure','Infrastruttura · configurazione e prove','Infrastructure · configuration and evidence'],
  ['executive','/app?section=execution','Esecuzione · budget e controlli AI','Execution · AI budget and controls'],
  ['cac','/titans/calcolo-cac.html','CAC · costo di acquisizione','CAC · acquisition cost'],
  ['budget','/titans/pianificatore.html','Budget · stime e costi','Budget · estimates and costs'],
  ['commerce','/commerce','E-commerce · kit e integrazioni','E-commerce · kit and integrations'],
  ['checkout','/acquista','Checkout · servizi concordati','Checkout · agreed services'],
  ['restaurants','/ristoranti','Ristoranti · ricerca e richieste','Restaurants · search and requests'],
  ['connections','/connections','Impostazioni · collegamenti e prove','Settings · connections and evidence'],
  ['developers','/developers','Sviluppatori · API e MCP','Developers · API and MCP']
].filter(item=>isSevaToolAvailable(item[1]));

export function sevaExperienceInfo(){
  return {...SEVA_EXPERIENCE,build:typeof SEVA_EXPERIENCE_BUILD==='string'?SEVA_EXPERIENCE_BUILD:'source',singleSource:true};
}

const experienceEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Italian-only tools offer the translated public overview. Keep this list
// inside the function: the same function is embedded in the browser script.
export function sevaLanguageURL(input,en,home=false){
  const current=new URL(input,'https://seva.karimkatlane0.chatgpt.site');
  const italianOnly=['/app','/tavoli','/kkubera','/kkubera/1','/kkubera/2','/kkubera/3','/kkubera/visite','/kkubera/immobili','/kkubera/cataloghi','/territorio','/territorio/azioni','/gmas','/music','/studio/diritti','/studio/trattative','/titans/manifesto','/mobile','/valore-condiviso','/checkout/bonifico','/funzionalita'];
  if(current.pathname==='/galleria'||current.pathname.startsWith('/galleria/'))italianOnly.push(current.pathname);
  const target=new URL(home||current.pathname==='/app'||(!en&&italianOnly.includes(current.pathname))?'/global':current.pathname,current.origin);
  target.searchParams.set('lang',en?'it':'en');
  return target.pathname+target.search;
}

// Do not attach a translation query to tools that have no translated interface.
export function synapsyNavigationURL(input,language='it'){
  const target=new URL(input,'https://seva.karimkatlane0.chatgpt.site');
  if(language==='en'&&(target.pathname==='/global'||sevaLanguageURL(target.href,false)!=='/global?lang=en'))target.searchParams.set('lang','en');
  else if(target.pathname==='/studio'&&language!=='it'&&Object.hasOwn(STUDIO_LANGUAGES,language))target.searchParams.set('lang',language);
  return target.pathname+target.search+target.hash;
}

export function bindSevaExperience(build,languageURL=sevaLanguageURL){
  const root=document.getElementById('seva-experience');
  if(!root)return;
  const en=document.documentElement.lang==='en', t=(it,english)=>en?english:it;
  const menu=document.getElementById('seva-tool-menu');
  function selected(){
    const current=new URL(location.href);
    if(current.pathname==='/app')for(const languageLink of root.querySelectorAll('[data-seva-language]'))languageLink.href=languageURL(current.href,en);
    for(const link of root.querySelectorAll('[data-seva-destination]')){
      const target=new URL(link.href,location.href);
      const sameArea=target.pathname==='/kkubera'&&current.pathname.startsWith('/kkubera/')||target.pathname==='/studio/diritti'&&current.pathname==='/studio/trattative'||target.pathname==='/titans/operazioni'&&['/titans','/titans/manifesto'].includes(current.pathname);
      const active=sameArea||target.pathname===current.pathname&&(target.pathname!=='/app'||(target.searchParams.get('section')||'home')===(current.searchParams.get('section')||'home'));
      if(active)link.setAttribute('aria-current',sameArea?'location':'page');else link.removeAttribute('aria-current');
    }
  }
  selected();window.addEventListener('popstate',selected);
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>document.documentElement.style.setProperty('--seva-header-height',root.getBoundingClientRect().height+'px')).observe(root);
  root.addEventListener('click',event=>{
    const languageLink=event.target.closest('[data-seva-language]');
    if(languageLink&&new URL(location.href).pathname==='/app')languageLink.href=languageURL(location.href,en);
    if(event.target.closest('a[href]')){menu.open=false;const languages=document.getElementById('seva-languages');if(languages)languages.open=false;queueMicrotask(selected);}
  });
  menu.addEventListener('toggle',()=>{if(menu.open){selected();for(const id of ['command-access','seva-quick-actions']){const other=document.getElementById(id);if(other)other.open=false;}}});
  for(const id of ['command-access','seva-quick-actions']){const other=document.getElementById(id);other?.addEventListener('toggle',()=>{if(other.open)menu.open=false;});}
  document.addEventListener('click',event=>{if(menu.open&&!root.contains(event.target))menu.open=false;});
  document.addEventListener('focusin',event=>{if(menu.open&&!root.contains(event.target))menu.open=false;});
  root.addEventListener('keydown',event=>{if(event.key==='Escape'){const languages=document.getElementById('seva-languages');const opened=languages?.open?languages:menu.open?menu:null;if(opened){opened.open=false;opened.querySelector('summary').focus();}}});
  const theme=document.getElementById('seva-unified-theme'),key='seva-appearance-v1';
  function applyTheme(value){
    const light=value!=='dark';document.documentElement.dataset.sevaTheme=light?'metal':'dark';
    theme.setAttribute('aria-pressed',String(!light));theme.textContent=t('Tema scuro','Dark theme');
  }
  let choice='metal';try{choice=localStorage.getItem(key)||'metal';}catch{}
  applyTheme(choice);
  theme.addEventListener('click',()=>{const value=document.documentElement.dataset.sevaTheme==='metal'?'dark':'metal';applyTheme(value);try{localStorage.setItem(key,value);}catch{}});
  window.addEventListener('storage',event=>{if(event.key===key)applyTheme(event.newValue);});
  // One public observation feeds the header and update page. Applying a release
  // remains a user action so the existing draft/navigation guards stay effective.
  const update=document.getElementById('seva-update'),refresh=document.getElementById('seva-update-refresh');
  const releaseStatus=document.getElementById('seva-release-status'),releaseTime=document.getElementById('seva-release-time');
  let checking=false,lastAttempt=null,lastSuccessfulAt=null,latestBuild=null,interval=null,active=true,generation=0,controller=null,lastState=null;
  const online=()=>typeof navigator==='undefined'||navigator.onLine!==false;
  const clock=value=>new Date(value).toLocaleString(en?'en-GB':'it-IT',{timeZone:'Europe/Rome',dateStyle:'short',timeStyle:'medium'});
  function publish(state){
    lastState=state;
    const observation={schema:'seva-release-observation',version:1,state,checkedAt:lastAttempt===null?null:new Date(lastAttempt).toISOString(),lastSuccessfulAt,build,latestBuild,intervalSeconds:60};
    const messages={checking:t('Controllo della versione…','Checking the version…'),current:t('Versione allineata','Version is current'),update_available:t('Nuova versione disponibile','New version available'),offline:t('Offline · verifica sospesa','Offline · checks paused'),error:t('Versione non verificabile · nuovo tentativo automatico','Version check failed · retrying automatically')};
    if(releaseStatus&&releaseStatus.textContent!==messages[state])releaseStatus.textContent=messages[state];
    if(releaseTime){releaseTime.textContent=lastSuccessfulAt?t('Ultima verifica: ','Last verified: ')+clock(lastSuccessfulAt)+' · '+t('ora di Roma','Rome time'):t('Nessuna verifica riuscita in questa sessione','No successful check in this session');releaseTime.dateTime=lastSuccessfulAt||'';}
    update.hidden=!latestBuild||latestBuild===build;
    window.SEVA_RELEASE_OBSERVATION=observation;
    if(typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('seva:release-status',{detail:observation}));
  }
  async function checkRelease(force=false){
    if(!active||document.visibilityState!=='visible'||checking)return;
    if(!online()){publish('offline');return;}
    if(!force&&lastAttempt!==null&&Date.now()-lastAttempt<60000)return;
    checking=true;lastAttempt=Date.now();const requestGeneration=++generation;
    const currentController=new AbortController();controller=currentController;
    const timeout=setTimeout(()=>currentController.abort(),10000);publish('checking');
    try{
      const response=await fetch('/api/experience',{credentials:'omit',cache:'no-store',redirect:'error',signal:currentController.signal});
      if(!response.ok)throw Error('unavailable');
      const info=await response.json();
      if(!['SYNAPSY','SEVA Intelligence Studio'].includes(info.name)||!/^[a-f0-9]{16}$/.test(info.build))throw Error('invalid');
      if(!active||requestGeneration!==generation)return;
      latestBuild=info.build;lastSuccessfulAt=new Date().toISOString();publish(latestBuild===build?'current':'update_available');
    }catch{if(active&&requestGeneration===generation)publish(online()?'error':'offline');}
    finally{clearTimeout(timeout);if(requestGeneration===generation){checking=false;controller=null;}}
  }
  function pause(){if(interval!==null){clearInterval(interval);interval=null;}}
  function resume(){if(active&&document.visibilityState==='visible'&&interval===null)interval=setInterval(()=>checkRelease(),60000);}
  refresh.addEventListener('click',()=>location.reload());
  window.addEventListener('seva:release-check',()=>checkRelease(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){resume();checkRelease();}else pause();});
  window.addEventListener('online',()=>{resume();checkRelease(lastState==='offline'||lastState==='error');});
  window.addEventListener('offline',()=>{generation++;controller?.abort();controller=null;checking=false;lastAttempt=null;publish('offline');});
  window.addEventListener('pagehide',()=>{active=false;pause();generation++;controller?.abort();controller=null;if(checking)lastAttempt=null;checking=false;});
  window.addEventListener('pageshow',()=>{active=true;resume();checkRelease();});
  resume();checkRelease();
}

export const SEVA_EXPERIENCE_STYLE=`
#seva-experience{position:sticky;top:0;display:block;padding:0;margin:0;width:100%;max-width:none;z-index:50;background:var(--sy-surface,#fff);border-bottom:1px solid var(--sy-line,#cbd5d5);color:var(--sy-ink,#192f3d);font:14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;isolation:isolate}
#seva-experience *{box-sizing:border-box}#seva-experience a{color:inherit;text-decoration:none}#seva-experience button,#seva-experience summary{font:inherit;cursor:pointer}
#seva-experience .seva-bar{min-height:76px;max-width:1440px;margin:auto;padding:12px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px}
#seva-experience .seva-identity{display:flex;align-items:center;gap:11px;flex-shrink:0}#seva-experience .seva-identity strong{display:block;font-size:20px;letter-spacing:.12em;line-height:1.2}
#seva-experience .seva-identity small{display:block;font-size:9px;letter-spacing:.08em;margin-top:4px;line-height:1.4;color:var(--sy-muted,#526571)}
#seva-experience .seva-main-nav,#seva-experience .seva-preferences{margin:0;display:flex;align-items:center;gap:3px}
#seva-experience .seva-main-nav>a,#seva-experience summary,#seva-experience button,#seva-experience .seva-preferences a{display:flex;align-items:center;justify-content:center;min-height:44px;padding:10px 12px;border:1px solid transparent;border-radius:6px;background:transparent;color:inherit}
#seva-experience summary{list-style:none;border-color:var(--sy-line,#cbd5d5)}#seva-experience summary::-webkit-details-marker{display:none}
#seva-tool-menu,#seva-experience .seva-main-nav{position:static}#seva-tool-menu:not([open]) .seva-tools-panel{display:none}
#seva-experience .seva-tools-panel{position:absolute;top:100%;left:50%;transform:translateX(-50%);width:min(420px,calc(100vw - 32px));padding:24px;background:var(--sy-surface,#fff);border:1px solid var(--sy-line,#cbd5d5);border-radius:10px;box-shadow:0 20px 50px #0a23352b;max-height:calc(100dvh - 110px);overflow:auto;overscroll-behavior:contain}
#seva-experience label{display:block;font-weight:650;margin:0 0 8px}#seva-experience input{width:100%;height:46px;border:1px solid var(--sy-line,#cbd5d5);border-radius:6px;background:var(--sy-bg,#f3f5f3);color:inherit;font:inherit;padding:10px 13px}
#seva-experience .seva-menu-language{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 18px;padding-bottom:14px;border-bottom:1px solid var(--sy-line,#cbd5d5);color:var(--sy-muted,#526571);font-size:13px}
#seva-experience .seva-menu-language a{display:inline-flex;align-items:center;min-height:44px;padding:8px 12px;border:1px solid var(--sy-line,#cbd5d5);border-radius:6px;color:inherit;font-weight:650}
#seva-experience .seva-menu-language{flex-wrap:wrap;align-items:stretch}
#seva-experience .seva-current-language,#seva-experience .seva-menu-language a{gap:8px;min-width:0;flex:1 1 120px;overflow-wrap:anywhere}
#seva-experience .seva-current-language{display:flex;align-items:center;padding:8px 0;font-size:13px;line-height:1.4}
#seva-experience .seva-current-language small{display:block;font-size:11px;color:var(--sy-muted,#52675c)}
#seva-experience .seva-language-flag{flex:none;font:20px/1 "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
#seva-experience .seva-studio-language-link{display:flex;gap:8px;align-items:center;justify-content:space-between;min-height:44px;margin:8px 0;padding:10px 12px;border:1px solid var(--sy-line,#cbd5d5);border-radius:6px;font-size:13px;line-height:1.5}
#seva-experience .seva-studio-language-link small{display:block;color:var(--sy-muted,#52675c);font-size:12px}
#seva-experience .seva-language-preference{font-size:11px;line-height:1.5;color:var(--sy-muted,#52675c);margin:8px 0 0}
#seva-experience .seva-language-preference[hidden]{display:none}
#seva-experience #seva-tool-count{margin:10px 0;color:var(--sy-muted,#526571);font-size:12px}
#seva-experience .seva-tool-list{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#seva-experience .seva-tool-list a{display:block;padding:13px;border:1px solid var(--sy-line,#cbd5d5);border-radius:6px;min-height:46px}
#seva-experience .seva-tool-list a[hidden]{display:none}
#seva-experience .seva-preferences{gap:2px;font-size:12px}#seva-experience .seva-account{border:1px solid var(--sy-line,#cbd5d5)}
#seva-experience .seva-menu-settings{display:flex;align-items:start;justify-content:space-between;gap:12px;flex-wrap:wrap}
#seva-experience #seva-languages[open]{width:100%;order:2}
#seva-experience #seva-languages:not([open]) .seva-languages-panel{display:none}
#seva-experience #seva-languages>summary{justify-content:flex-start;gap:8px}
#seva-experience .seva-languages-panel{position:static;width:100%;margin-top:12px;padding:16px;border:1px solid var(--sy-line,#cbd5d5);border-radius:6px;background:var(--sy-surface,#fff);color:inherit}
#seva-experience .seva-languages-heading{margin:0 0 12px;font-weight:650}
#seva-experience .seva-languages-panel nav{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0}
#seva-experience .seva-languages-panel nav a{display:flex;align-items:center;gap:9px;min-height:44px;padding:9px;border:1px solid var(--sy-line,#cbd5d5);border-radius:6px;font-size:13px}
#seva-experience .seva-locale-flag{font-size:20px}#seva-experience .seva-locale-check{margin-left:auto}
#seva-experience .seva-translator-link{display:inline-flex;align-items:center;min-height:44px;margin-top:10px;font-weight:650}
#seva-experience .seva-languages-note{font-size:12px;margin:8px 0 0}
#seva-update{padding:12px 24px;background:var(--sy-soft,#dfedeb);text-align:center;color:inherit}#seva-update[hidden]{display:none}#seva-update button{display:inline-flex;margin-left:12px;border:1px solid var(--sy-line,#cbd5d5)}
#seva-experience .seva-freshness{display:none}
body[data-seva-unified] #sevaAppearance{display:none}
body[data-seva-unified]:not([data-synapsy-surface]) :is(.hub-header,.arena-header,.studio-header){display:none}
html:has(#seva-experience){scroll-padding-top:calc(var(--seva-header-height,76px) + 16px)}
body[data-seva-unified]>aside{top:var(--seva-header-height,76px);height:calc(100dvh - var(--seva-header-height,76px))}
body[data-seva-unified]>aside>.logo,body[data-seva-unified]>aside>.caption{display:none}
@media(max-width:820px){html:has(#seva-experience){--seva-header-height:112px}}
@media(max-width:650px){#seva-experience .seva-tool-list{grid-template-columns:1fr}body[data-seva-unified]>aside{position:relative;top:auto;height:auto}}
@media print{#seva-experience{display:none}body[data-seva-unified]>aside{display:none}}
`;

// A language preference is a browser setting. Never redirect an open workspace,
// copy private query parameters, or infer that an untranslated page changed language.
export function bindSevaLanguagePreference(languages){
 const root=document.getElementById('seva-experience'),link=document.getElementById('seva-studio-language-link'),name=document.getElementById('seva-studio-language-name'),flag=document.getElementById('seva-studio-language-flag'),note=document.getElementById('seva-language-preference');
 if(!root||!link||!name||!flag||!note||!languages||typeof languages!=='object')return;
 const key='synapsy-language-v1',valid=value=>typeof value==='string'&&Object.hasOwn(languages,value)?value:null;
 const current=valid(document.documentElement.lang)||'it',en=current==='en';let saved=null;
 try{
  saved=valid(localStorage.getItem(key));
  const query=new URL(location.href).searchParams,explicit=query.getAll('lang').length===1?valid(query.get('lang')):null;
  // Persist only after the requested language was actually rendered. Existing
  // beforeunload/draft guards stay responsible for navigation and cancellation.
  if(explicit===current){localStorage.setItem(key,current);saved=current;}
 }catch{}
 function show(){
  const code=saved||current;
  link.href='/studio?lang='+encodeURIComponent(code);name.textContent=languages[code][0];flag.textContent=languages[code][2];
  note.hidden=!saved;note.textContent=saved?(en?'Language saved on this device: ':'Lingua salvata su questo dispositivo: ')+languages[saved][0]+'.':'';
 }
 show();
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){saved=valid(event.newValue);show();}});
}

export function sevaLanguageMenu(language='it'){
  const current=Object.hasOwn(STUDIO_LANGUAGES,language)?language:'it';
  const [name,,flag]=STUDIO_LANGUAGES[current];
  const labels={it:['Lingue','Studio in 8 lingue. Alcune aree operative restano in italiano.'],en:['Languages','Studio in 8 languages. Some workspace areas remain in Italian.'],es:['Idiomas','Studio en 8 idiomas. Algunas áreas de trabajo siguen en italiano.'],fr:['Langues','Studio en 8 langues. Certains espaces de travail restent en italien.'],de:['Sprachen','Studio in 8 Sprachen. Einige Arbeitsbereiche bleiben auf Italienisch.'],pt:['Idiomas','Studio em 8 idiomas. Algumas áreas de trabalho permanecem em italiano.'],ar:['اللغات','الاستوديو متاح بثماني لغات. تظل بعض مساحات العمل باللغة الإيطالية.'],zh:['语言','Studio 提供 8 种语言。部分工作区仍为意大利语。']};
  const [label,note]=labels[current];
  const translate={it:'Traduttore AI',en:'AI translator',es:'Traductor IA',fr:'Traducteur IA',de:'KI-Übersetzer',pt:'Tradutor IA',ar:'مترجم بالذكاء الاصطناعي',zh:'AI 翻译'}[current];
  return `<details id="seva-languages"><summary aria-label="${label} · ${name}" title="${label}"><span aria-hidden="true">${flag}</span><span class="seva-language-label">${label}</span><span aria-hidden="true">⌄</span></summary><div class="seva-languages-panel" dir="${current==='ar'?'rtl':'ltr'}"><p class="seva-languages-heading">${label} <span>8</span></p><nav aria-label="${label}">${Object.entries(STUDIO_LANGUAGES).map(([code,[nativeName,,nativeFlag]])=>`<a data-seva-locale="${code}" href="/studio?lang=${code}" lang="${code}" hreflang="${code}"${code===current?' aria-current="true"':''}><span class="seva-locale-flag" aria-hidden="true">${nativeFlag}</span><bdi>${nativeName}</bdi>${code===current?'<span class="seva-locale-check" aria-hidden="true">✓</span>':''}</a>`).join('')}</nav><a class="seva-translator-link" href="/traduci?to=${current}">✦ ${translate} →</a><p class="seva-languages-note">${note}</p></div></details>`;
}

export function withSevaExperience(html,url){
  if(typeof html!=='string'||!html.includes('</head>')||html.includes('id="seva-experience"'))return html;
  html=filterUnavailableNavigation(html);
  const current=new URL(url,'https://seva.karimkatlane0.chatgpt.site'),lang=(html.match(/<html\b[^>]*\blang="([^"]+)"/)||[])[1]||'it',en=lang==='en',t=(it,english)=>en?english:it;
  const route=path=>experienceEscape(synapsyNavigationURL(path,lang));
  const primary=([id,path,it,english],index)=>`<a class="${index<2?'seva-primary-visible':'seva-mobile-secondary'}" data-seva-tool="${id}" data-seva-destination href="${route(path)}">${experienceEscape(en?english:it)}</a>`;
  const mobile=([id,path,it,english])=>`<a data-seva-destination href="${route(path)}">${experienceEscape(en?english:it)}</a>`;
  const language=sevaLanguageURL(current.href,en,html.includes('class="recovery-links"'));
  const translationTarget=lang!=='it'&&Object.hasOwn(STUDIO_LANGUAGES,lang)?lang:'en';
  const overviewLanguage=!en&&language==='/global?lang=en'&&current.pathname!=='/global';
  const currentLocale=Object.hasOwn(STUDIO_LANGUAGES,lang)?lang:'it',currentLanguage=STUDIO_LANGUAGES[currentLocale],otherLocale=en?'it':'en',otherLanguage=STUDIO_LANGUAGES[otherLocale];
  const build=sevaExperienceInfo().build;
  const observerError=experienceEscape('for(const id of ["seva-release-status","updates-status"]){const node=document.getElementById(id);if(node)node.textContent='+JSON.stringify(t('Controllo versione non disponibile. Ricarica la pagina per riprovare.','Version checks unavailable. Reload the page to retry.'))+';}const button=document.getElementById("updates-check");if(button)button.disabled=true;');
  // Every route uses the same shell. Historic decoration remains available as
  // assets, but is not injected into operational or documentation pages.
  const sharedStyle=SEVA_EXPERIENCE_STYLE+SEVA_COMMAND_STYLE+SEVA_BRAND_STYLE;
  const rights='<footer id="seva-copyright"><p><strong>SYNAPSY</strong> · © 2026 Karim Katlane. '+t('Tutti i diritti riservati.','All rights reserved.')+'</p><nav class="synapsy-footer-links" aria-label="'+t('Informazioni SYNAPSY','SYNAPSY information')+'"><a href="'+route('/support')+'">'+t('Assistenza','Support')+'</a><a href="'+route('/titans/manifesto')+'">'+t('Stato operativo','Operational status')+'</a><a href="'+route('/privacy')+'">Privacy</a><a href="'+route('/terms')+'">'+t('Termini e licenze','Terms and licences')+'</a></nav><p>'+t('Contenuti originali di Karim Katlane. Materiali e servizi di terzi restano soggetti ai rispettivi diritti e condizioni.','Original content by Karim Katlane. Third-party materials and services remain subject to their respective rights and terms.')+'</p></footer>';
  const header=`<header id="seva-experience" data-build="${build}" data-edition="${SEVA_EXPERIENCE.edition}"><div class="seva-bar">
<a class="seva-identity" href="${route('/superapp')}" aria-label="${experienceEscape(SEVA_EXPERIENCE.displayName)}"><span class="seva-orbit-mark" aria-hidden="true"><img src="/assets/seva-logo.png" width="1536" height="1536" alt="" fetchpriority="high"></span><span><strong>SYNAPSY</strong><small>${t('IL TUO SPAZIO DI LAVORO','YOUR WORKSPACE')}</small><small class="seva-owner-credit">di Karim Katlane</small></span></a>
<nav class="seva-main-nav" aria-label="${t('SYNAPSY · navigazione comune','SYNAPSY · shared navigation')}">${SYNAPSY_PRIMARY_NAV.map(primary).join('')}<details id="seva-tool-menu"><summary>Menu <span aria-hidden="true">⌄</span></summary><div class="seva-tools-panel">
<div class="seva-mobile-destinations">${SYNAPSY_PRIMARY_NAV.slice(2).map(mobile).join('')}</div>
<div class="seva-menu-actions"><a href="${route('/cerca')}" data-command-open aria-haspopup="dialog" aria-controls="seva-command-dialog">${t('Cerca una funzione','Find a function')} <span aria-hidden="true">⌕</span></a><a data-seva-translator href="${route('/traduci?to='+translationTarget)}">${t('Traduttore · testo e lingue','Translator · text and languages')}</a><a data-seva-destination href="${route('/titans/manifesto')}">${t('Stato operativo','Operational status')}</a><a data-seva-destination href="${route('/connections')}">${t('Impostazioni e collegamenti','Settings and connections')}</a></div>
<div class="seva-menu-language" role="group" aria-label="${t('Lingua della pagina','Page language')}"><span class="seva-current-language"><span class="seva-language-flag" aria-hidden="true">${currentLanguage[2]}</span><span><small>${t('Pagina attuale','Current page')}</small><bdi lang="${currentLocale}">${experienceEscape(currentLanguage[0])}</bdi></span></span><a data-seva-language data-seva-locale="${otherLocale}" href="${experienceEscape(language)}" lang="${otherLocale}" hreflang="${otherLocale}"><span class="seva-language-flag" aria-hidden="true">${otherLanguage[2]}</span><bdi>${overviewLanguage?'English · panoramica pubblica':otherLanguage[0]}</bdi></a></div><p class="seva-languages-note">${t('Alcune aree operative restano in italiano. Il cambio lingua apre una pagina tradotta, quando disponibile.','Some workspace areas remain in Italian. Language selection opens a translated page where available.')}</p><a id="seva-studio-language-link" class="seva-studio-language-link" href="/studio?lang=${currentLocale}"><span><span>${t('Studio e compositore · 8 lingue','Studio and composer · 8 languages')}</span><small><span id="seva-studio-language-flag" class="seva-language-flag" aria-hidden="true">${currentLanguage[2]}</span> <bdi id="seva-studio-language-name">${experienceEscape(currentLanguage[0])}</bdi></small></span><span aria-hidden="true">→</span></a><p id="seva-language-preference" class="seva-language-preference" role="status" aria-live="polite" hidden></p><div class="seva-menu-settings"><button type="button" id="seva-unified-theme" aria-pressed="false">${t('Tema scuro','Dark theme')}</button></div>
</div></details></nav><div class="seva-preferences"><a class="seva-account" href="${route('/account')}">Account</a></div></div>
<div class="seva-freshness"><span id="seva-release-status" role="status" aria-live="polite" aria-atomic="true">${t('Controllo automatico della versione','Automatic version checks')}</span><time id="seva-release-time"></time><a href="${route('/aggiornamenti')}">${t('Dettagli aggiornamenti','Update details')}</a></div><div id="seva-update" role="status" hidden>${t('È disponibile un aggiornamento di SYNAPSY. Salva le bozze prima di aggiornare.','A SYNAPSY update is available. Save your drafts before refreshing.')}<button type="button" id="seva-update-refresh">${t('Aggiorna la pagina','Refresh page')}</button></div></header>`;
  return html
    .replace('</head>','<meta name="author" content="Karim Katlane"><meta name="copyright" content="© 2026 Karim Katlane — original content owned by the project author; third-party rights reserved"><style id="seva-experience-style">'+sharedStyle+'</style></head>')
    .replace(/<body\b([^>]*)>(\s*<a\b[^>]*class="[^"]*\b(?:skip|skip-link|[\w]+-skip)\b[^"]*"[^>]*>[\s\S]*?<\/a>)?/i,(_,attrs,skip='')=>'<body'+attrs+' data-seva-unified="true">'+skip+header)
    .replace(/<\/body>(?=\s*<\/html>\s*$)/i,()=>rights+renderSevaCommand(en)+'<script>('+bindSevaCommand.toString()+')();</script><script defer src="/assets/seva-experience.js?v='+build+'" onerror="'+observerError+'"></script></body>');
}

// Share the observer across pages without adding its full source to every HTML
// document. Read the page build so a release served later still detects old tabs.
export function sevaExperienceScript(){
  return '('+bindSevaExperience.toString()+')(document.getElementById("seva-experience")?.dataset.build,('+sevaLanguageURL.toString()+'));\n('+bindSevaLanguagePreference.toString()+')('+JSON.stringify(STUDIO_LANGUAGES)+');';
}

// Navigation only: the command centre opens existing tools, without submitting data.
export function bindSevaCommand(){
 const dialog=document.getElementById('seva-command-dialog');
 if(!dialog)return;
 const input=document.getElementById('seva-command-query'),count=document.getElementById('seva-command-count');
 const links=[...dialog.querySelectorAll('[data-command-result]')],en=document.documentElement.lang==='en';
 const normalise=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 let opener=null,restoreFocus=true;
 function filter(){
  const terms=normalise(input.value).trim().split(/\s+/).filter(Boolean);let visible=0;
  for(const link of links){const match=terms.length?terms.every(term=>normalise(link.dataset.commandSearch).split(/[^a-z0-9]+/).some(word=>word.startsWith(term))):link.dataset.commandFeatured==='true';link.hidden=!match;if(match)visible++;}
  count.textContent=visible+(en?(visible===1?' tool available':' tools available'):(visible===1?' strumento disponibile':' strumenti disponibili'));
  document.getElementById('seva-command-empty').hidden=visible!==0;
  const all=document.getElementById('seva-command-all');if(all){const target=new URL('/cerca',location.origin);if(en)target.searchParams.set('lang','en');if(input.value.trim())target.searchParams.set('q',input.value.trim());all.href=target.pathname+target.search;}
 }
 function open(trigger){
  if(dialog.open)return;opener=trigger;restoreFocus=true;
  document.getElementById('seva-tool-menu')?.removeAttribute('open');
  document.getElementById('command-access')?.removeAttribute('open');
  document.getElementById('seva-quick-actions')?.removeAttribute('open');
  input.value='';filter();dialog.showModal();input.focus();
 }
 document.addEventListener('click',event=>{const trigger=event.target.closest('[data-command-open]');if(trigger){event.preventDefault();open(trigger);}});
 document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&!event.altKey){event.preventDefault();if(dialog.open)dialog.close();else open(document.activeElement);}
 });
 dialog.querySelector('[data-command-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(restoreFocus)opener?.focus();});
 // Workspace links use client-side navigation. Release the modal before the
 // document's navigation guard runs, including when that guard keeps a draft.
 // Do not steal the destination heading's focus when the close event arrives.
 dialog.addEventListener('click',event=>{
  const link=event.target.closest?.('[data-command-result]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  restoreFocus=false;dialog.close();
 });
 input.addEventListener('input',filter);
 input.addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'){const first=links.find(link=>!link.hidden);if(first){event.preventDefault();first.focus();}}
  if(event.key==='Enter'){event.preventDefault();const visible=links.filter(link=>!link.hidden);if(visible.length===1)visible[0].click();else document.getElementById('seva-command-all')?.click();}
 });
 for(const link of links)link.addEventListener('keydown',event=>{
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  event.preventDefault();const visible=links.filter(item=>!item.hidden),index=visible.indexOf(link);
  if(event.key==='ArrowUp'&&index===0){input.focus();return;}
  const next=event.key==='Home'?0:event.key==='End'?visible.length-1:event.key==='ArrowDown'?Math.min(index+1,visible.length-1):Math.max(0,index-1);
  visible[next]?.focus();
 });
 filter();
}

export function renderSevaCommand(en=false){
 const t=(it,english)=>en?english:it;
 const destination=path=>synapsyNavigationURL(path,en?'en':'it');
 const featured=SYNAPSY_PRIMARY_NAV.map(item=>item[0]);
 const synonyms={functional:'funzionalita kubernets kubernetes mlops pipeline spid tavoli mancanze',needs:'bisogni budget desideri compensi accumulo credits acquisti wallet',gmas:'gmas matching ai web negozi ecommerce ristoranti ipovedenti ciechi ascolta parla engagement cac indicizzazione',senses:'voce ascolto ciechi ipovedenti accessibilità voice vision accessibility',goals:'goals piano azioni obiettivi plan',ai:'chat intelligenza artificiale assistant',crm:'crm clienti contatti customers contacts',search:'ricerca trova cerca search',cms:'cms sito website editor', 'mobile-apps':'app smartphone installa android ios iphone',infrastructure:'kubernets kubernetes cluster pipeline devops',databaseunitary:'dbu mlops dlops dati pipeline',executive:'agents agenti agentic automatica automazione budget',budget:'budget spesa costi api dbu',messages:'messaggistica sms whatsapp risposte',automation:'automatismi automazione follow-up',payments:'pay pagamento pagamenti stripe wallet',checkout:'check-out checkout pay pagamento',commerce:'ecommerce e-commerce negozio shop',restaurants:'prenotazioni ristorante thefork', 'kkubera-visits':'prenotazioni visite calendario immobili'};
 return '<dialog id="seva-command-dialog" aria-labelledby="seva-command-title" aria-describedby="seva-command-help"><div class="seva-command-heading"><div><p class="seva-command-kicker">SYNAPSY</p><h2 id="seva-command-title">'+t('Cerca una funzione.','Find a function.')+'</h2></div><button type="button" data-command-close aria-label="'+t('Chiudi ricerca','Close search')+'">'+t('Chiudi','Close')+' <span aria-hidden="true">×</span></button></div><p id="seva-command-help">'+t('Apri un’area di lavoro o cerca una funzione specifica. Ogni strumento indica il proprio ambito.','Open a work area or search for a specific function. Each tool describes its scope.')+'</p><label for="seva-command-query">'+t('Cerca in SYNAPSY','Search SYNAPSY')+'</label><input id="seva-command-query" type="search" autocomplete="off" placeholder="'+t('Prova: clienti, immobili, musica…','Try: clients, properties, music…')+'" aria-controls="seva-command-results" autofocus><p id="seva-command-count" role="status" aria-live="polite"></p><div id="seva-command-results">'+SEVA_EXPERIENCE_TOOLS.map(([id,path,it,english])=>'<a data-command-result data-command-featured="'+featured.includes(id)+'" data-command-search="'+experienceEscape(it+' '+english+' '+(synonyms[id]||''))+'" href="'+experienceEscape(destination(path))+'"><span>'+experienceEscape(t(it,english))+'</span><span aria-hidden="true">↗</span></a>').join('')+'</div><p id="seva-command-empty" hidden>'+t('Nessun risultato. Prova con AI, voce, obiettivi o contatti.','No results. Try AI, voice, goals or contacts.')+'</p><p><a id="seva-command-all" href="'+destination('/cerca')+'">'+t('Cerca in tutte le pagine →','Search all pages →')+'</a></p><p class="seva-command-footer">'+t('Tab per navigare · Esc per chiudere · Ctrl / ⌘ K per aprire','Tab to navigate · Esc to close · Ctrl / ⌘ K to open')+'</p></dialog>';
}

export const SEVA_COMMAND_STYLE=`
#seva-experience .seva-command-trigger{background:#b9edf2;color:#092332;border:1px solid #b9edf2;border-radius:10px;padding:10px 14px;font-weight:750;min-height:44px;white-space:nowrap}
#seva-command-dialog{width:min(640px,calc(100vw - 24px));max-height:calc(100dvh - 32px);padding:28px;border:1px solid #7a98b6;border-radius:24px;background:#0d1b2c;color:#edf5ff;box-shadow:0 35px 100px #0009;font:16px/1.6 system-ui,sans-serif}
#seva-command-dialog::backdrop{background:#020916cc;backdrop-filter:blur(8px)}
.seva-command-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.seva-command-heading h2{font:750 clamp(24px,5vw,32px)/1.2 system-ui;margin:4px 0 12px;letter-spacing:-.035em;color:#fff}
#seva-command-dialog .seva-command-kicker{font:700 11px/1.5 system-ui;letter-spacing:.16em;color:#a9e8ff;margin:0 0 8px}
#seva-command-dialog button{background:#182c43;color:#eff7ff;border:1px solid #6887a5;border-radius:9px;min-height:44px;padding:9px 13px;font:600 14px system-ui}
#seva-command-dialog label{display:block;font-weight:650;margin:18px 0 8px}
#seva-command-dialog input{box-sizing:border-box;width:100%;background:#061220;color:#fff;border:1px solid #89a8c4;border-radius:12px;padding:14px 16px;font:18px/1.5 system-ui;min-height:52px}
#seva-command-dialog input::placeholder{color:#adc1d5}
#seva-command-dialog p{color:#c0d2e5;margin:8px 0;font-size:15px}
#seva-command-results [hidden]{display:none!important}
#seva-command-results{display:grid;gap:7px;margin-top:14px}
#seva-command-results a{display:flex;justify-content:space-between;align-items:center;gap:14px;border:1px solid #3c5671;border-radius:11px;background:#15273d;color:#f3f7ff;padding:13px 15px;text-decoration:none;min-height:52px;font-weight:600}
#seva-command-results a:hover{border-color:#a9e8ff;background:#213e57}
#seva-command-dialog .seva-command-footer{border-top:1px solid #3c5671;padding-top:16px;margin-top:20px;font-size:12px}
html[data-seva-theme=metal] #seva-command-dialog{background:#f1f7fc;color:#163148}html[data-seva-theme=metal] #seva-command-dialog :is(h2,p,label){color:#163148}html[data-seva-theme=metal] #seva-command-dialog :is(input,button,a){background:#fff;color:#163148;border-color:#6b88a1}
@media(max-width:650px){#seva-experience .seva-main-nav{flex-wrap:wrap;gap:4px}#seva-experience .seva-command-trigger{font-size:12px;padding:9px 10px}#seva-command-dialog{padding:20px}.seva-command-heading{gap:10px}}
@media print{#seva-command-dialog,.seva-command-trigger{display:none!important}}

body[data-seva-unified] .shell .hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.85fr);gap:48px;align-items:center;padding:70px 28px 54px;min-height:620px}
body[data-seva-unified] .shell .hero h1{font-size:clamp(48px,6.4vw,84px);line-height:1.02;margin:22px 0 28px}
body[data-seva-unified] .shell .hero .cosmic-kicker{color:#c0eff5;font-size:11px;letter-spacing:.2em}
body[data-seva-unified] .shell .hero .eyebrow{font-size:10px;color:#e4a3d6;letter-spacing:.14em}
.command-deck{background:linear-gradient(150deg,#162f45ed,#0b192dea);border:1px solid #8eb7d265;box-shadow:0 24px 80px #0005;border-radius:24px;padding:28px;backdrop-filter:blur(18px);min-width:0}
.command-deck-top{display:flex;justify-content:space-between;align-items:center;font:700 11px/1.5 system-ui;letter-spacing:.16em;color:#bdd6e9}
.command-deck-dot{width:8px;height:8px;border-radius:50%;background:#c3f0eb;box-shadow:0 0 16px #adffff66}
.command-deck h2{font:700 clamp(25px,3vw,34px)/1.16 system-ui;color:#f6fbff;letter-spacing:-.035em;margin:22px 0 24px}
.command-deck a{display:flex;align-items:center;gap:13px;text-decoration:none;padding:18px 0;border-top:1px solid #627c9366;color:#f6fbff;min-height:76px}
.command-deck a>span:nth-child(2){flex:1}.command-deck a:hover strong{text-decoration:underline;text-underline-offset:4px}
.command-deck-index{font:500 12px/1.5 ui-monospace,monospace;color:#a8d5e4}.command-deck strong{font:650 17px/1.4 system-ui;display:block}.command-deck small{font:400 14px/1.6 system-ui;color:#c4d5e4;display:block;margin-top:5px}.command-deck p{font:400 12px/1.65 system-ui;color:#c4d5e4;border-top:1px solid #627c9366;margin:0;padding-top:16px}
html[data-seva-theme=metal] .command-deck{background:linear-gradient(145deg,#faffffed,#dcebf3ee);border-color:#6e91aa;box-shadow:0 20px 50px #10344e12}html[data-seva-theme=metal] .command-deck :is(h2,strong,small,p,span,a){color:#18374a}
html[data-command-contrast] :is(#seva-command-dialog,#seva-command-dialog *,#seva-experience .seva-command-trigger,.command-deck,.command-deck *){background:#000!important;color:#fff!important;box-shadow:none!important;border-color:#fff!important}html[data-command-contrast] #seva-command-results a{color:#ffeb80!important}
@media(max-width:900px){body[data-seva-unified] .shell .hero{gap:24px;padding-inline:0;grid-template-columns:minmax(0,1.2fr) minmax(260px,1fr)}.command-deck{padding:22px}}
@media(max-width:720px){body[data-seva-unified] .shell .hero{grid-template-columns:minmax(0,1fr);padding:40px 0 30px;gap:30px;min-height:0}body[data-seva-unified] .shell .hero h1{font-size:clamp(46px,12vw,70px)}.command-deck{padding:24px}.command-deck h2 br{display:none}.command-deck a{min-height:80px}}
@media print{.command-deck{background:#fff;color:#172a24;box-shadow:none;break-inside:avoid}.command-deck :is(h2,strong,small,p,span,a){color:#172a24}}
`;

// Signature presentation shared by the hub, workspace and public tools.
// System fonts and CSS artwork need no external font or image requests.
export const SEVA_SIGNATURE_STYLE=`
html:not([data-command-contrast]) body[data-seva-unified]{--signature-gold:#ead2a4;--signature-paper:#faf4e9;--signature-ink:#111d2a;--signature-muted:#b9c7d7;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
html:not([data-command-contrast]) #seva-experience{background:#08121ef5;border-bottom-color:#ead2a433;backdrop-filter:blur(20px)}
#seva-experience .seva-bar{max-width:1400px;padding-inline:40px;min-height:94px}
#seva-experience .seva-identity strong{font-weight:650;letter-spacing:.25em}
#seva-experience .seva-identity small{font-size:10px;letter-spacing:.17em}
html:not([data-command-contrast]) #seva-experience .seva-identity img{border:1px solid #ead2a480;box-shadow:0 0 0 5px #ead2a409;border-radius:50%;padding:5px}
html:not([data-command-contrast]) #seva-experience .seva-command-trigger{background:#ead2a4;border-color:#ead2a4;color:#152132;border-radius:7px}
html:not([data-command-contrast]) #seva-experience .seva-account{border-color:#ead2a459!important;font-size:13px}
html:not([data-command-contrast]) body[data-seva-unified] .shell{width:min(1360px,100%);padding-inline:48px}
html:not([data-command-contrast]) body[data-seva-unified].seva-cosmic::before{background-image:linear-gradient(90deg,#06101bea,#07121be0),var(--seva-sky)}
html:not([data-command-contrast]) .seva-cosmic .cosmic-scene{opacity:.22;pointer-events:none}
body[data-seva-unified] .shell .hero{grid-template-columns:minmax(0,1.2fr) minmax(330px,.8fr);gap:76px;min-height:720px;padding:68px 0 60px}
body[data-seva-unified] .shell .hero-copy{max-width:730px}
body[data-seva-unified] .shell .hero .cosmic-kicker{display:flex;align-items:center;gap:15px;font-size:11px;letter-spacing:.24em;margin:0 0 40px}
body[data-seva-unified] .shell .hero .cosmic-kicker::before{content:'';display:block;width:36px;height:1px;background:currentColor}
html:not([data-command-contrast]) body[data-seva-unified] .shell .hero .cosmic-kicker{color:#ead2a4}
body[data-seva-unified] .shell .hero h1{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:clamp(58px,6.65vw,94px);letter-spacing:-.065em;line-height:1.04;margin:0 0 27px;max-width:800px}
body[data-seva-unified] .shell .hero h1 em{font-weight:400;font-style:italic}
html:not([data-command-contrast]) body[data-seva-unified] .shell .hero h1{color:#faf4e9}
html:not([data-command-contrast]) body[data-seva-unified] .shell .hero h1 em{color:#ead2a4}
body[data-seva-unified] .shell .hero .lede{font-size:17px;line-height:1.85;max-width:520px;text-shadow:none}
body[data-seva-unified] .shell .hero .actions{margin-top:30px;gap:12px}
body[data-seva-unified] .shell .hero .actions .button{min-height:54px;padding:14px 22px;border-radius:8px;font-size:14px}
html:not([data-command-contrast]) body[data-seva-unified] .shell .hero .actions .button:first-child{background:#ead2a4;border-color:#ead2a4;color:#152132;box-shadow:0 4px 30px #ead2a40a}
html:not([data-command-contrast]) body[data-seva-unified] .shell .hero .actions .button:first-child:hover{background:#fae8c7;border-color:#fae8c7}
.signature-shortcuts{display:flex;flex-wrap:wrap;gap:10px 24px;margin-top:18px;font-size:13px}
.signature-shortcuts a{display:inline-flex;align-items:center;min-height:44px;text-decoration:none;border-bottom:1px solid #ead2a44d}
.signature-shortcuts a:hover{text-decoration:underline;text-underline-offset:5px}
html:not([data-command-contrast]) .signature-shortcuts a{color:#e7d8bf}
body[data-seva-unified] .shell .hero .fine{font-size:12px;line-height:1.75;max-width:460px}
.signature-caption{display:flex;justify-content:space-between;gap:16px;align-items:center;margin:10px 0 18px;font-size:10px;letter-spacing:.16em;text-transform:uppercase}
html:not([data-command-contrast]) .signature-caption{color:#bdcbdc}
.signature-art{position:relative;display:grid;place-items:center;width:100%;height:192px;overflow:hidden;margin:-6px 0 12px;isolation:isolate}
.signature-art::before{content:'';position:absolute;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle,#ead2a414,transparent 70%)}
.signature-orbit{position:absolute;width:236px;height:104px;border:1px solid #ead2a455;border-radius:50%;transform:rotate(-25deg)}
.signature-orbit:nth-child(2){transform:rotate(40deg);width:205px;height:110px;border-color:#b2d8ea4d}
.signature-orbit:nth-child(3){transform:rotate(100deg);width:178px;height:114px;border-color:#e696c54d}
.signature-orbit::after{content:'';width:6px;height:6px;position:absolute;left:28px;top:9px;border-radius:50%;background:#ead2a4;box-shadow:0 0 18px #ead2a477}
.signature-core{position:relative;display:grid;place-items:center;width:75px;height:75px;border:1px solid #ead2a49c;border-radius:50%;background:radial-gradient(circle at 32% 25%,#344355,#111b2a 72%);box-shadow:inset 0 0 18px #ead2a41a,0 0 50px #c5b18412;color:#ead2a4;font:44px/1 Georgia,serif}
html:not([data-command-contrast]) body[data-seva-unified] .command-deck{background:linear-gradient(150deg,#142234f0,#0b1625f5);border:1px solid #ead2a447;border-radius:18px;box-shadow:0 28px 80px #0003;padding:28px 30px;backdrop-filter:blur(12px)}
.command-deck .command-deck-top{font-size:10px;letter-spacing:.19em}
html:not([data-command-contrast]) .command-deck .command-deck-top{color:#e2cfad}
.command-deck .command-deck-dot{background:#ead2a4;box-shadow:none}
.command-deck h2{font:400 31px/1.2 Georgia,serif;letter-spacing:-.035em;margin:0 0 20px}
.command-deck a{padding:16px 0;min-height:84px;border-top-color:#ead2a42e}
.command-deck strong{font-size:15px;font-weight:600;letter-spacing:.015em}
.command-deck small{font-size:13px;line-height:1.6}
html:not([data-command-contrast]) .command-deck-index{color:#ead2a4}
.command-deck p{font-size:11px;line-height:1.7;padding-top:15px;border-top-color:#ead2a42e}
body[data-seva-unified] .shell .section{padding-block:64px}
body[data-seva-unified] .shell .section-heading{align-items:start;gap:50px}
body[data-seva-unified] .shell .section-heading h2,body[data-seva-unified] .shell .faq h2{font:400 clamp(32px,3.3vw,46px)/1.15 Georgia,serif;letter-spacing:-.04em;max-width:610px}
body[data-seva-unified] .shell .section-heading p{font-size:15px;line-height:1.8}
html:not([data-command-contrast]) body[data-seva-unified] .shell :is(.section-heading .eyebrow,.trust-line span::before){color:#ead2a4}
html:not([data-command-contrast]) body[data-seva-unified] :is(.arena-card,.quick-card,.pathway,.tool-card,#serviceOperations .intent-grid>.notice){background:linear-gradient(135deg,#142235f5,#0c1728f5)!important;border-color:#8f9fb844!important;box-shadow:none!important}
body[data-seva-unified] :is(.arena-card,.quick-card,.pathway,.tool-card){border-radius:12px!important}
html:not([data-command-contrast]) body[data-seva-unified] :is(.arena-card,.quick-card,.pathway,.tool-card):hover{border-color:#ef95c9!important;background:linear-gradient(135deg,#2c243e,#141b2e)!important;box-shadow:0 12px 32px #0002!important}
body[data-seva-unified] .shell .tool-card{padding:26px;min-width:0}
body[data-seva-unified] .shell .tool-card h3{font-size:20px;letter-spacing:-.02em;line-height:1.35}
html:not([data-command-contrast]) body[data-seva-unified] .shell .tool-state{background:#203b3e;color:#c9eee1!important;border:1px solid #55817b;padding:4px 8px;border-radius:4px;font-size:11px;letter-spacing:0}
html:not([data-command-contrast]) body[data-seva-unified] .shell .tool-state[data-state=preparation]{background:#382f22;color:#f1d7a3!important;border-color:#826d42}
html:not([data-command-contrast]) body[data-seva-unified] .shell .tool-state[data-state=connection]{background:#35283d;color:#ebc1e8!important;border-color:#85648a}
html:not([data-command-contrast]) body[data-seva-unified] .shell .filter-group button[aria-pressed=true]{background:#ead2a4;color:#172432;border-color:#ead2a4}
html:not([data-command-contrast]) body[data-seva-unified] .shell .cosmic-flow{background:#101d2c;border-color:#ead2a433;border-radius:12px;box-shadow:none}
body[data-seva-unified] .shell .cosmic-flow h2{font:400 28px/1.2 Georgia,serif}
html:not([data-command-contrast]) body[data-seva-unified] .shell .share-band{background:#e9d5af;color:#152332;border:0;border-radius:12px}
html:not([data-command-contrast]) body[data-seva-unified] .shell .share-band :is(h2,p,.eyebrow,label){color:#152332}
html:not([data-command-contrast]) body[data-seva-unified] .shell .share-band .button{background:#132235;color:#fff;border-color:#132235}
html:not([data-command-contrast]) body[data-seva-unified] .shell .share-band input{background:#faf5eb;color:#162334;border-color:#6b6a63}
html:not([data-command-contrast]) #seva-command-dialog{background:linear-gradient(145deg,#142438,#0a1524);border-color:#ead2a473;border-radius:18px}
#seva-command-dialog .seva-command-heading h2{font:400 clamp(30px,5vw,40px)/1.15 Georgia,serif;letter-spacing:-.04em}
html:not([data-command-contrast]) #seva-command-dialog .seva-command-kicker{color:#ead2a4}
html:not([data-command-contrast]) #seva-command-dialog input:focus{border-color:#ead2a4}
html:not([data-command-contrast]) #seva-command-results a{background:#162439;border-color:#8f9fb83d;border-radius:8px}
html:not([data-command-contrast]) #seva-command-results a:hover{background:#283047;border-color:#ead2a4}
html:not([data-command-contrast]) body[data-seva-unified]>main:has(>#view){background:linear-gradient(155deg,#18263b,#101a2b 500px);border:1px solid #9aabc32b}
html:not([data-command-contrast]) body[data-seva-unified]>aside{background:#0c1726;border:1px solid #9aabc32b;border-radius:12px}
html:not([data-command-contrast]) body[data-seva-unified]>aside nav [data-page].active{background:#ead2a4;color:#172332}
html:not([data-command-contrast]) body[data-seva-unified] #view :is(.panel,.metric,.intent){background:#132238;border-color:#8f9fb844}
body[data-seva-unified] #view .hero h1{font-family:Georgia,serif;font-weight:400;letter-spacing:-.045em}
html:not([data-command-contrast]) body[data-seva-unified] #view :is(button.primary,button.accent){background:#ead2a4;border-color:#ead2a4;color:#172332}
/* A complete light counterpart, with no pale text left on light surfaces. */
html[data-seva-theme=metal]:not([data-command-contrast]) #seva-experience{background:#f7f3eaf5;color:#172b3d;border-bottom-color:#9d8e754d}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified].seva-cosmic::before{background:#f3f1e9}
html[data-seva-theme=metal]:not([data-command-contrast]) .seva-cosmic .cosmic-scene{opacity:.06}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified] .shell .hero :is(h1,h1 em,.cosmic-kicker),html[data-seva-theme=metal]:not([data-command-contrast]) .signature-shortcuts a{color:#233a4c}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified] .command-deck{background:linear-gradient(145deg,#fdfbf6,#e9ecee);border-color:#8d877a80}
html[data-seva-theme=metal]:not([data-command-contrast]) .command-deck :is(.command-deck-top,.command-deck-index),html[data-seva-theme=metal]:not([data-command-contrast]) .signature-caption{color:#405568}
html[data-seva-theme=metal]:not([data-command-contrast]) .signature-orbit{border-color:#64788d80}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified] :is(.arena-card,.quick-card,.pathway,.tool-card,#serviceOperations .intent-grid>.notice){background:linear-gradient(135deg,#fffdf8,#eaf0f2)!important;color:#173447!important;border-color:#8b9cac80!important}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified] :is(.arena-card,.quick-card,.pathway,.tool-card):hover{background:#fff1f8!important;border-color:#9c547b!important}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified] .shell :is(.section-heading .eyebrow,.trust-line span::before){color:#6a4d29}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified] .shell .cosmic-flow{background:#f7f7f1;color:#173447;border-color:#8b9cac80}
html[data-seva-theme=metal]:not([data-command-contrast]) #seva-command-dialog{background:#f8f5ed;border-color:#8b9cac}
html[data-seva-theme=metal]:not([data-command-contrast]) #seva-command-dialog .seva-command-kicker{color:#614a29}
html[data-seva-theme=metal]:not([data-command-contrast]) #seva-command-results a{background:#fff;color:#173447;border-color:#93a3b3}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified]>main:has(>#view),html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified] #view :is(.panel,.metric,.intent){background:#f7f7f1;color:#173447}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified]>aside{background:#e9edf0;color:#173447}
html[data-seva-theme=metal]:not([data-command-contrast]) body[data-seva-unified]>aside :is(nav [data-page],.aside-bottom){color:#173447}
html[data-command-contrast] .signature-art{display:none}
html[data-command-contrast] #seva-experience :is(a.seva-join,a[aria-current=page]){color:#ffeb80!important;border-color:#fff!important}
html[data-command-contrast] .cosmic-scene{display:none}
html[data-command-contrast] body[data-seva-unified]::before{background:#000!important;background-image:none!important}
html[data-seva-theme=metal]:not([data-command-contrast]) .command-deck .signature-core{color:#ead2a4}
/* Page zoom must reflow content even when viewport media queries do not change. */
html[data-command-scale]:not([data-command-scale="100"]) #seva-experience{position:relative}
html[data-command-scale]:not([data-command-scale="100"]) #seva-experience .seva-bar{flex-wrap:wrap;gap:12px;padding:16px 20px}
html[data-command-scale]:not([data-command-scale="100"]) #seva-experience .seva-main-nav{order:3;width:100%;justify-content:flex-start;flex-wrap:wrap}
html[data-command-scale]:not([data-command-scale="100"]) #seva-experience :is(button,summary,.seva-account){white-space:nowrap}
html[data-command-scale]:not([data-command-scale="100"]) #seva-experience .seva-preferences{margin-left:auto}
html[data-command-scale]:not([data-command-scale="100"]) body[data-seva-unified] .shell .hero{grid-template-columns:minmax(0,1fr);gap:32px;min-height:0;padding-block:36px}
html[data-command-scale]:not([data-command-scale="100"]) body[data-seva-unified] .shell .hero h1{font-size:clamp(38px,7vw,64px)}
html[data-command-scale]:not([data-command-scale="100"]) body[data-seva-unified] :is(.tool-grid,.quick-grid,.status-grid,.share-band,.faq,.cosmic-flow){display:grid;grid-template-columns:minmax(0,1fr)}
html[data-command-scale]:not([data-command-scale="100"]) body[data-seva-unified] .section-heading{display:block}
html[data-command-scale]:not([data-command-scale="100"]) body[data-seva-unified] .section-heading p{margin-top:18px}
html[data-command-scale]:not([data-command-scale="100"]) .command-sheet{max-height:calc(100dvh / var(--command-zoom,1) - 180px)}
html[data-command-scale]:not([data-command-scale="100"]) #seva-command-dialog{max-width:calc(100% - 24px);max-height:calc(100dvh / var(--command-zoom,1) - 32px)}
html[data-command-scale]:not([data-command-scale="100"]) #seva-experience .seva-tools-panel{width:calc(100% - 32px);max-height:calc(100dvh / var(--command-zoom,1) - 120px)}
html[data-command-scale]:not([data-command-scale="100"]) body[data-seva-unified]>aside{position:relative;inset:auto;width:auto;height:auto;margin:8px}
html[data-command-scale]:not([data-command-scale="100"]) body[data-seva-unified]>aside nav{display:flex;flex-wrap:wrap}
html[data-command-scale]:not([data-command-scale="100"]) body[data-seva-unified]>main:has(>#view){margin:8px;padding-inline:20px}
@media(max-width:1100px){body[data-seva-unified] .shell .hero{gap:36px;grid-template-columns:minmax(0,1.15fr) minmax(290px,.85fr)}html:not([data-command-contrast]) body[data-seva-unified] .shell{padding-inline:32px}#seva-experience .seva-bar{padding-inline:28px}}
@media(max-width:800px){body[data-seva-unified] .shell .hero{grid-template-columns:minmax(0,1fr);gap:36px;min-height:0;padding-block:46px}body[data-seva-unified] .shell .hero h1{font-size:clamp(52px,9vw,76px)}.command-deck{max-width:none}.signature-art{height:160px}.signature-shortcuts{gap:6px 22px}body[data-seva-unified] .shell .hero .cosmic-kicker{margin-bottom:28px}}
@media(max-width:540px){html:not([data-command-contrast]) body[data-seva-unified] .shell{padding-inline:22px}#seva-experience .seva-bar{padding:12px 16px}#seva-experience .seva-identity img{width:44px;height:44px}#seva-experience .seva-identity strong{font-size:18px}#seva-experience .seva-identity small{font-size:8px;letter-spacing:.09em}body[data-seva-unified] .shell .hero{padding-top:36px}body[data-seva-unified] .shell .hero h1{font-size:clamp(43px,11vw,59px);letter-spacing:-.06em}body[data-seva-unified] .shell .hero .actions .button{padding:13px 16px;font-size:13px}body[data-seva-unified] .shell .hero .lede{font-size:16px;line-height:1.8}body[data-seva-unified] .shell .section{padding-block:44px}html:not([data-command-contrast]) body[data-seva-unified] .command-deck{padding:24px}body[data-seva-unified] .shell .section-heading{display:block}.signature-caption{font-size:9px}}
@media(prefers-reduced-motion:reduce){.signature-art,.signature-art *{animation:none;transition:none}}
@media print{.signature-art,.signature-caption{display:none}body[data-seva-unified] .shell .hero{min-height:0;padding-block:20px}html:not([data-command-contrast]) body[data-seva-unified] .shell .hero :is(h1,h1 em,.cosmic-kicker){color:#172b3d}html:not([data-command-contrast]) body[data-seva-unified] .command-deck{background:#fff;color:#172b3d;box-shadow:none}}
`;
