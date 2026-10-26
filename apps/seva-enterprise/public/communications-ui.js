/** SEVA professional communication studio, no automatic external deliveries. */
export function initializeCommunications({api,toast}) {
 const $=id=>document.getElementById(id);
 const form=$('communicationForm'),draft=$('communicationDraft'),state=$('communicationState');
 let generation=null;
 form.addEventListener('submit',async e=>{
  e.preventDefault();const button=$('communicationGenerate');button.disabled=true;
  state.textContent='Generazione AI autenticata in corso…';
  try{
   const data={
    channel:$('communicationChannel').value,
    purpose:$('communicationPurpose').value,
    subject:$('communicationSubject').value.trim(),
    context:$('communicationContext').value.trim(),
    language:'it',
    recipientPermissionConfirmed:$('recipientConsent').checked
   };
   const r=await api('/api/communications/draft','POST',data);
   if(r.externalDelivery!==false||r.sent!==false)throw Error('Risposta provider non conforme: invio non autorizzato.');
   draft.value=r.draft;generation=r;
   state.textContent='Bozza AI creata · '+r.provider+' · '+r.model+
     (r.id?' · '+r.id:'')+' · '+new Date(r.generatedAt).toLocaleString('it-IT')+
     ' · Non inviata; revisione umana necessaria.';
   toast('Bozza AI preparata: modifica e approva prima di inviare.');
  }catch(err){
   generation=null;state.textContent='Bozza AI non disponibile: '+err.message+
    '. Nessun messaggio è stato inviato.';
  }finally{button.disabled=false;}
 });
 $('communicationCopy').addEventListener('click',async()=>{
  if(!draft.value.trim()){toast('Nessuna bozza da copiare.');return;}
  try{await navigator.clipboard.writeText(draft.value.trim());toast('Testo copiato sul dispositivo.');}
  catch{toast('Copia non disponibile su questo browser. Seleziona il testo manualmente.');}
 });
 $('communicationWhatsApp').addEventListener('click',()=>{
  const message=draft.value.trim().slice(0,4000);
  if(!message){toast('Genera o scrivi un messaggio prima.');return;}
  if($('communicationPurpose').value==='offer'&&!$('recipientConsent').checked){
   toast('Per le offerte verifica prima i permessi del destinatario.');return;
  }
  const url='https://wa.me/?text='+encodeURIComponent(message);
  window.open(url,'_blank','noopener,noreferrer');
  state.textContent='Composer WhatsApp aperto su richiesta. Nessun invio automatico certificato.';
 });
 $('communicationEmail').addEventListener('click',()=>{
  const message=draft.value.trim().slice(0,4000);
  if(!message){toast('Genera o scrivi un messaggio prima.');return;}
  if($('communicationPurpose').value==='offer'&&!$('recipientConsent').checked){
   toast('Per le offerte verifica prima i permessi del destinatario.');return;
  }
  const subject=$('communicationSubject').value.trim().slice(0,120);
  window.location.href='mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message);
  state.textContent='Composer email aperto su richiesta. Devi scegliere il destinatario e premere Invia.';
 });
 for(const button of document.querySelectorAll('[data-open-tab]')){
  button.addEventListener('click',()=>{
   const target=document.querySelector('.tabs [data-tab="'+button.dataset.openTab+'"]');
   if(!target){toast('Sezione non disponibile.');return;}
   target.click();
   const section=document.getElementById(button.dataset.openTab);
   section?.scrollIntoView({behavior:'smooth',block:'start'});
  });
 }
}
