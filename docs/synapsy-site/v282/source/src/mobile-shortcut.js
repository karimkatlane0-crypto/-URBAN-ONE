// Public install metadata only: no account identifiers, credentials or private data.
export function sevaWebManifest(account=false,language='it'){
 const en=language==='en',suffix=en?'?lang=en':'';
 const icons=[192,512].map(size=>({src:'/assets/seva-icon-'+size+'.png',sizes:size+'x'+size,type:'image/png',purpose:'any'}));
 return {id:account?'/account':'/global',name:account?'SYNAPSY Account':'SYNAPSY · Intelligence Studio',short_name:account?'SYNAPSY Account':'SYNAPSY',lang:en?'en':'it',description:en?'Your SYNAPSY account and workspace.':'Il tuo account e il tuo spazio SYNAPSY.',start_url:(account?'/account':'/global')+suffix,scope:'/',display:'standalone',background_color:'#f3f4ee',theme_color:'#163126',icons,shortcuts:[
  {name:en?'My account':'Il mio account',short_name:'Account',url:'/account'+suffix,icons},
  {name:en?'Today':'Oggi',short_name:en?'Today':'Oggi',url:'/app?section=home',icons}
 ]};
}

export function accountShortcutHead(language='it'){
 return '<link rel="manifest" href="/account.webmanifest'+(language==='en'?'?lang=en':'')+'"><link rel="apple-touch-icon" href="/assets/seva-icon-192.png" sizes="192x192"><meta name="theme-color" content="#163126"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="SYNAPSY Account">';
}

export function accountShortcutMarkup(language='it'){
 const en=language==='en',t=(it,eng)=>en?eng:it;
 return `<section id="mobile-shortcut" aria-labelledby="shortcut-title"><p class="eyebrow">SYNAPSY · MOBILE</p><h2 id="shortcut-title">${t('Il tuo account, a un tocco.','Your account, one tap away.')}</h2><p>${t('Aggiungi SYNAPSY Account alla schermata Home del tuo telefono. La scorciatoia apre questa pagina: accedi con il tuo account per ritrovare il tuo spazio.','Add SYNAPSY Account to your phone’s Home Screen. The shortcut opens this page: sign in with your own account to return to your workspace.')}</p><div class="actions"><button class="btn" id="accountInstall" type="button">${t('Aggiungi alla schermata Home','Add to Home Screen')}</button><button id="accountShortcutCopy" type="button">${t('Copia link per un altro telefono','Copy link for another phone')}</button><a class="btn light" href="/mobile#mobile-device-check">${t('Controlla questo dispositivo','Check this device')}</a></div><p id="accountInstallStatus" role="status" aria-live="polite">${t('L’installazione si completa nelle indicazioni del browser.','Complete installation through your browser’s instructions.')}</p><p id="accountConnectionStatus" class="small" role="status" aria-live="polite"></p><label for="accountShortcutLink">${t('Link della scorciatoia','Shortcut link')}</label><input id="accountShortcutLink" type="url" readonly value="https://seva.karimkatlane0.chatgpt.site/account${en?'?lang=en':''}" style="width:100%;box-sizing:border-box" autocomplete="off"><details id="accountInstallGuide"><summary>${t('Istruzioni per Redmi, Android e iPhone','Instructions for Redmi, Android and iPhone')}</summary><ul><li><strong>Redmi / Xiaomi / Android:</strong> ${t('apri questa pagina in Chrome, tocca ⋮ → “Installa e crea scorciatoia” → “Installa”. In altre versioni scegli “Aggiungi a schermata Home” o “Installa app” e conferma. Il nome del comando può variare con il browser e HyperOS/MIUI.','open this page in Chrome, tap ⋮ → “Install and create shortcut” → “Install”. In other versions choose “Add to Home screen” or “Install app” and confirm. Menu names can vary by browser and HyperOS/MIUI.')}</li><li><strong>iPhone / iPad:</strong> ${t('apri questa pagina in Safari, tocca Condividi → Aggiungi alla schermata Home → Aggiungi. Se compare “Apri come app web”, puoi attivarlo.','open this page in Safari, tap Share → Add to Home Screen → Add. Enable “Open as Web App” if offered.')}</li><li><strong>${t('Altri browser','Other browsers')}:</strong> ${t('cerca “Aggiungi alla Home” nel menu. Se il comando non compare, apri il link in Chrome su Android o Safari su iPhone. Su computer usa l’icona di installazione o salva un preferito.','look for “Add to Home screen” in the menu. If unavailable, open the link in Chrome on Android or Safari on iPhone. On a computer use the install icon or save a bookmark.')}</li></ul></details><p class="small">${t('La web app è disponibile dal sito. L’installazione va confermata su ogni dispositivo; le voci mostrate nel menu rapido dipendono dal browser.','The web app is available from the website. Installation must be confirmed on each device; the shortcuts shown depend on the browser.')}</p><noscript><p>${t('Usa le istruzioni del browser qui sopra per aggiungere la scorciatoia.','Use the browser instructions above to add the shortcut.')}</p></noscript></section>`;
}

export function bindAccountShortcut(en=false){
 const button=document.getElementById('accountInstall'),status=document.getElementById('accountInstallStatus'),guide=document.getElementById('accountInstallGuide'),copy=document.getElementById('accountShortcutCopy'),link=document.getElementById('accountShortcutLink');
 if(!button||!status||!guide||!copy||!link)return;
 const arena=/^https:\/\/seva\.karimkatlane0\.chatgpt\.site\/arena(?:\?lang=en)?$/.test(String(link.value)),brand=arena?'SEVA Arena':'SYNAPSY';
 const publicLink='https://seva.karimkatlane0.chatgpt.site'+(arena?'/arena':'/account')+(en?'?lang=en':'');
 link.value=publicLink;
 let deferred=null,busy=false,installed=false;
 const standalone=()=>Boolean(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone);
 const fallback=()=>{
  guide.open=true;
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  status.textContent=ios?(en?'In Safari, tap Share → Add to Home Screen → Add.':'In Safari tocca Condividi → Aggiungi alla schermata Home → Aggiungi.'):(en?'In Chrome open ⋮ → Install and create shortcut → Install. Other versions offer Add to Home screen or Install app. See the instructions below.':'In Chrome apri il menu del browser ⋮ → Installa e crea scorciatoia → Installa. Altre versioni offrono Aggiungi a schermata Home o Installa app. Trovi le istruzioni qui sotto.');
 };
 const markInstalled=(fromEvent=false)=>{
  installed=true;deferred=null;button.disabled=true;
  button.textContent=fromEvent?(en?brand+' installed':brand+' installata'):(en?brand+' is open as an app':brand+' è aperta come app');
  status.textContent=fromEvent?(en?'The browser confirms that '+brand+' is installed on this device.':'Il browser conferma che '+brand+' è installata su questo dispositivo.'):(en?brand+' is open in app mode on this device.':brand+' è aperta in modalità app su questo dispositivo.');
 };
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;});
 window.addEventListener('appinstalled',()=>markInstalled(true));
 if(standalone())markInstalled();
 button.addEventListener('click',async()=>{
  if(busy||installed)return;
  if(standalone()){markInstalled();return;}
  if(!deferred){fallback();return;}
  const prompt=deferred;deferred=null;busy=true;button.disabled=true;
  try{
   await prompt.prompt();
   const result=await prompt.userChoice;
   if(!installed){
    status.textContent=result?.outcome==='accepted'?(en?'Installation requested. Complete the browser instructions on this phone.':'Installazione richiesta. Completa le indicazioni del browser su questo telefono.'):(en?'Installation cancelled. You can try again from the browser menu.':'Installazione annullata. Puoi riprovare dal menu del browser.');
    if(result?.outcome!=='accepted')guide.open=true;
   }
  }catch{if(!installed)fallback();}
  finally{busy=false;button.disabled=installed;}
 });
 copy.addEventListener('click',async()=>{
  link.value=publicLink;
  try{await navigator.clipboard.writeText(publicLink);status.textContent=en?'Link copied. Open it on another phone and add it to Home Screen.':'Link copiato. Aprilo su un altro telefono e aggiungilo alla schermata Home.';}
  catch{link.focus();link.select();status.textContent=en?'Select and copy the link, then open it on the other phone.':'Seleziona e copia il link, poi aprilo sull’altro telefono.';}
 });
 const connection=document.getElementById('accountConnectionStatus');
 const showConnection=()=>{if(connection)connection.textContent=navigator.onLine===false?(en?'Your browser reports no network. Cloud records require a connection.':'Il browser segnala assenza di rete. I dati cloud richiedono una connessione.'):navigator.onLine===true?(en?'Your browser reports an available network. Service access is checked when used.':'Il browser segnala una rete disponibile. L’accesso ai servizi si verifica durante l’uso.'):(en?'Network status is unavailable in this browser.':'Lo stato della rete non è disponibile in questo browser.');};
 if(connection){showConnection();window.addEventListener('online',showConnection);window.addEventListener('offline',showConnection);}
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
