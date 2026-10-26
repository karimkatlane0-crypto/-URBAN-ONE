/** Voluntary owner-scoped notifications. Browser alerts only in foreground.
 * No background push subscription, automated WhatsApp or data export.
 */
export function initializeNotifications({api,toast}) {
 const $=id=>document.getElementById(id);
 const prefs=$('optInApp'),browser=$('optBrowser'),list=$('notificationList');
 async function loadPrefs(){
  const r=await api('/api/notifications/preferences');
  prefs.checked=r.preferences.inApp;
  browser.checked=r.preferences.browser;
  $('notificationStatus').textContent=r.preferences.inApp?
   'Avvisi SEVA attivi. Push con app chiusa: non disponibile.':
   'Avvisi SEVA disattivati.';
 }
 async function loadList(){
  const r=await api('/api/notifications');
  list.replaceChildren();
  if(!r.notifications.length){list.textContent='Nessun avviso.';return;}
  for(const item of r.notifications){
   const row=document.createElement('div');
   row.className='goal';row.setAttribute('role','listitem');
   const label=document.createElement('span');
   label.textContent=item.message+' · '+new Date(item.created*1000).toLocaleString('it-IT');
   row.appendChild(label);
   if(!item.readAt){
    const button=document.createElement('button');button.className='outline';
    button.type='button';button.textContent='Segna letto';
    button.addEventListener('click',async()=>{
     try{await api('/api/notifications/read','POST',{id:item.id});await loadList();}
     catch(e){toast(e.message);}
    });
    row.appendChild(button);
   }
   list.appendChild(row);
  }
 }
 $('saveNotifications').addEventListener('click',async()=>{
  const inApp=prefs.checked;let browserEnabled=browser.checked;
  try{
   if(browserEnabled&&!inApp)throw Error('Occorre attivare prima gli avvisi SEVA.');
   if(browserEnabled){
    if(!('Notification' in window)||!window.isSecureContext)
     throw Error('Notifiche del dispositivo non disponibili senza HTTPS e browser compatibile.');
    const permission=await Notification.requestPermission();
    if(permission!=='granted'){browserEnabled=false;toast('Permesso browser negato.');}
   }
   await api('/api/notifications/preferences','PUT',{inApp,browser:browserEnabled});
   await loadPrefs();await loadList();toast('Preferenze aggiornate; nessun messaggio inviato.');
  }catch(e){toast(e.message);}
 });
 $('checkNotifications').addEventListener('click',async()=>{
  try{await loadList();}catch(e){toast(e.message);}
 });
 $('eraseNotifications').addEventListener('click',async()=>{
  if(!confirm('Revocare il consenso e cancellare tutti gli avvisi SEVA?'))return;
  try{await api('/api/notifications','DELETE');await loadPrefs();await loadList();toast('Avvisi eliminati.');}
  catch(e){toast(e.message);}
 });
 $('shareWhatsapp').addEventListener('click',()=>{
  const note=$('shareNote').value.trim().slice(0,300);
  if(!note){toast('Scrivi il messaggio da condividere.');return;}
  // WhatsApp opens only after explicit click; the customer chooses the recipient and presses Send.
  window.open('https://wa.me/?text='+encodeURIComponent(note),'_blank','noopener,noreferrer');
 });
 const tab=document.querySelector('[data-tab="notifications"]');
 tab.addEventListener('click',async()=>{
  try{await loadPrefs();await loadList();}catch(e){toast(e.message);}
 });
}
