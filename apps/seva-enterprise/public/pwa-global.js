/* SEVA Global install assistant. Never simulates actual installation. */
(()=>{'use strict';
 let installEvent=null;
 const btn=document.getElementById('install-seva');
 const notice=document.getElementById('install-message');
 if(!btn||!notice)return;
 const info=message=>{
  notice.textContent=message;
  notice.hidden=false;
  setTimeout(()=>{notice.hidden=true},12000);
 };
 if('serviceWorker' in navigator && location.protocol==='https:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw-global.js',{scope:'/'}).catch(()=>info('La modalità offline non è disponibile su questo browser.')));
 }
 const displayMode=()=>matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
 if(displayMode())return;
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installEvent=event;btn.hidden=false;
 });
 btn.addEventListener('click',async()=>{
  if(!installEvent){info('Da Android: apri il menu Chrome e seleziona Installa app o Aggiungi a schermata Home.');return;}
  installEvent.prompt();
  const choice=await installEvent.userChoice.catch(()=>null);
  installEvent=null;
  if(choice?.outcome==='accepted')info('Installazione richiesta al browser. Verifica la nuova icona Android.');
  else info('Installazione non eseguita.');
  btn.hidden=true;
 });
 window.addEventListener('appinstalled',()=>{btn.hidden=true;installEvent=null;info('Browser: installazione dell’app rilevata.');});
 if(/android/i.test(navigator.userAgent))setTimeout(()=>{if(!installEvent&&!displayMode()){btn.hidden=false;btn.textContent='Installa su Android';}},1200);
})();
