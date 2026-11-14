import {MobileClient} from './client.mjs';
const $=id=>document.getElementById(id),client=new MobileClient();
let editId=null,partnerPending=null,archiveInput=null,archiveMode='export',lastScope=null;
const labels={planned:'Pianificato',checked_in:'Check-in registrato',checked_out:'Check-out registrato',cancelled:'Annullato',todo:'Da fare',doing:'In corso',done:'Completata'};
const messages={secure_browser_required:'Serve un browser moderno in un contesto HTTPS sicuro.',authentication_required:'Accedi prima a SEVA nello stesso dominio.',membership_required:'Account non abilitato: serve un’autorizzazione amministrativa.',mobile_not_ready:'Il servizio mobile non è attivo su questo dominio.',source_not_authorized:'La fonte indicata non è autorizzata dal server.',account_changed:'Account cambiato: vista e coda precedente cancellate per isolamento.',scope_binding_changed:'La sessione è cambiata: operazione bloccata e vista svuotata.',scope_binding_expired:'Autorizzazione scaduta: ricollega la sessione.',write_forbidden:'Il tuo ruolo non consente scritture.',archive_scope_mismatch:'Archivio di un altro account, tenant o dominio: ripristino rifiutato.',archive_decryption_failed:'Frase errata o archivio alterato.',passphrase_min_12:'Usa almeno 12 caratteri per la frase di cifratura.',record_already_queued_or_limit:'Esiste già una modifica per questa scheda, oppure la coda è piena.',unexpected_response:'Il dominio non ha restituito l’API JSON attesa.',stay_transition_forbidden:'Transizione soggiorno non consentita.',stay_dates_invalid:'La partenza deve seguire l’arrivo.',operation_in_progress:'Operazione già in corso.',rate_limited:'Limite richieste raggiunto: riprova più tardi.'};
function feedback(text,bad=false){$('feedback').textContent=text;$('feedback').dataset.error=String(bad);}
const element=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn)=>{const b=element('button',text);b.type='button';b.addEventListener('click',()=>perform(fn));return b;};
const source=()=>{const v=$('source').value.trim();if(!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/.test(v))throw Error('Indica un ID fonte autorizzata valido.');return v;};
const values=form=>Object.fromEntries([...new FormData(form)].filter(([k,v])=>k!=='consent'&&typeof v==='string'&&v.trim()).map(([k,v])=>[k,v.trim()]));
async function perform(fn){
  try{const p=fn();render();await p;render();}
  catch(e){render();feedback(messages[e.code]||(['TypeError','TimeoutError','AbortError'].includes(e.name)?'Connessione non riuscita. La coda non inviata resta in questa scheda.':e.message||'Operazione non riuscita.'),true);}
}
function recordList(target,records,kind){
  target.replaceChildren();if(!records.length){target.append(element('p','Nessun record da mostrare. Collega o aggiorna il workspace.','empty'));return;}
  for(const r of records){
    const p=r.payload||{},card=element('article',undefined,'record');
    card.append(element('span',kind==='crm'?'RELAZIONE':kind==='stay'?'SOGGIORNO':kind==='partner'?'DOMANDA PARTNER':'ATTIVITÀ','small-label'));
    card.append(element('h3',p.displayName||p.title||p.organization||p.bookingReference||r.id));
    if(kind==='crm')card.append(element('p',[p.company,p.email,p.phone].filter(Boolean).join(' · ')),element('p',[p.municipality,p.province,p.region,p.country].filter(Boolean).join(' / ')));
    if(kind==='stay')card.append(element('p',`${p.unit} · ${p.arrivalDate} → ${p.departureDate}`),element('p','Ospite: '+p.guestReference));
    if(kind==='partner')card.append(element('p',p.contactEmail||''),element('p','In attesa di revisione. Nessun addebito o accordo accettato.'));
    const meta=element('div',undefined,'meta');meta.append(element('span','Versione '+r.version,'tag'));
    if(p.status)meta.append(element('span',labels[p.status]||p.status,'tag'));card.append(meta);
    if(['owner','operator'].includes(client.identity?.role)){
      const actions=element('div',undefined,'actions');
      if(kind==='crm')actions.append(button('Modifica',()=>{editId=r.id;const f=$('crm-form');f.reset();editId=r.id;
        for(const [k,v] of Object.entries(p))if(f.elements[k])f.elements[k].value=v;
        $('crm-form-title').textContent='Modifica relazione · v'+r.version;f.elements.displayName.focus();}));
      if(kind==='task'&&p.status!=='done')actions.append(button('Prepara completamento',()=>{client.queue({kind:'task',recordId:r.id,payload:{...p,status:'done'},sourceId:source()});feedback('Completamento in coda: invia per confermare sul server.');}));
      if(kind==='stay'){
        const next=p.status==='planned'?'checked_in':p.status==='checked_in'?'checked_out':null;
        if(next)actions.append(button(next==='checked_in'?'Prepara check-in':'Prepara check-out',()=>{
          if(!confirm('Confermi l’operazione nel registro interno? Non genera pagamenti né prenotazioni esterne.'))return;
          client.queue({kind:'stay',recordId:r.id,payload:{...p,status:next},sourceId:source()});feedback('Operazione in coda: invia per registrarla sul server.');}));
        if(p.status==='planned')actions.append(button('Prepara annullamento',()=>{if(confirm('Annullare questo soggiorno nel registro interno?'))client.queue({kind:'stay',recordId:r.id,payload:{...p,status:'cancelled'},sourceId:source()});}));
      }
      if(actions.childElementCount)card.append(actions);
    }
    target.append(card);
  }
}
function render(){
  const currentScope=client.identity?client.identity.subject+'|'+client.identity.tenant:null;
  if(lastScope&&lastScope!==currentScope){for(const f of document.querySelectorAll('form'))f.reset();$('search').value='';$('source').value='';partnerPending=null;editId=null;}
  lastScope=currentScope;
  const s=client.snapshot(),writable=s.identity&&['owner','operator'].includes(s.identity.role),busy=s.busy;
  $('subject').textContent=s.identity?.subject||'Da collegare';$('tenant').textContent=s.identity?.tenant||'Non verificato';$('role').textContent=s.identity?.role||'Nessun permesso presunto';
  $('connection-badge').textContent=busy?'OPERAZIONE IN CORSO':s.identity?'SESSIONE STAGING':'NON COLLEGATO';
  $('count-crm').textContent=s.identity?s.records.filter(r=>r.kind==='crm').length:'—';$('count-stay').textContent=s.identity?s.records.filter(r=>r.kind==='stay').length:'—';
  $('count-queue').textContent=s.outbox.length;$('count-conflict').textContent=s.outbox.filter(x=>x.status==='conflict').length;
  for(const f of document.querySelectorAll('fieldset'))f.disabled=!writable||busy;
  for(const id of ['connect','lock'])$(id).disabled=busy;
  $('refresh').disabled=!s.identity||busy;$('sync').disabled=!writable||!s.outbox.some(x=>x.status==='pending')||busy;
  $('export').disabled=!s.identity||!s.outbox.length||busy;$('import').disabled=!writable||busy;
  const q=$('search').value.toLocaleLowerCase('it');
  recordList($('contacts'),s.records.filter(r=>r.kind==='crm'&&Object.values(r.payload).join(' ').toLocaleLowerCase('it').includes(q)),'crm');
  recordList($('stays-list'),s.records.filter(r=>r.kind==='stay'),'stay');recordList($('tasks-list'),s.records.filter(r=>r.kind==='task'),'task');
  recordList($('partners-list'),s.records.filter(r=>r.kind==='partner'),'partner');
  if(s.outbox.length)document.querySelector('.queue-details').open=true;
  const queue=$('queue');queue.replaceChildren();
  if(!s.outbox.length)queue.append(element('p','Nessuna modifica in coda.','empty'));
  for(const item of s.outbox){const card=element('article',undefined,'record');card.append(element('h3',item.mutation.payload?.displayName||item.mutation.payload?.title||item.mutation.payload?.bookingReference||item.mutation.recordId),element('p',item.status==='conflict'?'Conflitto: la versione server è cambiata. Scarta la proposta e rivedi la scheda aggiornata.':'In attesa di invio esplicito.'));card.append(button('Scarta proposta',()=>{client.discard(item.mutation.operationId);feedback('Proposta locale scartata; nessun record server cancellato.');}));queue.append(card);}
  if(busy)for(const b of document.querySelectorAll('.record button'))b.disabled=true;
}
$('connect').addEventListener('click',()=>perform(async()=>{await client.connect();feedback('Sessione verificata e dati letti. Il collegamento non certifica il rilascio Enterprise.');}));
$('refresh').addEventListener('click',()=>perform(async()=>{await client.connect();feedback('Dati del workspace aggiornati.');}));
$('sync').addEventListener('click',()=>perform(async()=>{await client.synchronize();feedback(client.outbox.length?'Invio terminato: rivedi i conflitti ancora in coda.':'Modifiche confermate dal server; coda vuota.');}));
$('lock').addEventListener('click',()=>perform(()=>{if((client.outbox.length||partnerPending)&&!confirm('Eliminare le bozze in memoria? Esporta prima la coda se serve conservarla.'))return;client.clear();partnerPending=null;for(const f of document.querySelectorAll('form'))f.reset();feedback('Vista svuotata. La sessione SEVA del browser non è stata terminata.');}));
$('search').addEventListener('input',render);
$('crm-form').addEventListener('reset',()=>{editId=null;$('crm-form-title').textContent='Nuova relazione';});
for(const [name,kind] of [['crm','crm'],['stay','stay'],['task','task']]){
  $(name+'-form').addEventListener('submit',event=>{event.preventDefault();perform(()=>{const f=event.target,p=values(f);if(kind==='stay')p.status='planned';client.queue({kind,payload:p,sourceId:source(),...(kind==='crm'&&editId?{recordId:editId}:{})});f.reset();feedback('Proposta preparata. Premi “Invia la coda” per scriverla sul server.');});});
}
$('partner-form').addEventListener('submit',event=>{event.preventDefault();perform(async()=>{
  const data={...values(event.target),sourceId:source(),consent:event.target.elements.consent.checked};
  if(partnerPending&&JSON.stringify(data)!==JSON.stringify(partnerPending.input))throw Error('La precedente domanda ha esito incerto: riprova con gli stessi dati prima di prepararne un’altra.');
  if(!partnerPending)partnerPending={input:data,request:{...data,operationId:crypto.randomUUID(),applicationId:crypto.randomUUID()}};
  await client.applyPartner(partnerPending.request);partnerPending=null;event.target.reset();feedback('Domanda registrata in attesa di revisione. Nessun contratto accettato e nessun addebito.');
});});
$('export').addEventListener('click',()=>{archiveMode='export';archiveInput=null;$('archive-title').textContent='Esporta coda cifrata';$('archive-dialog').showModal();$('archive-pass').focus();});
$('import').addEventListener('change',()=>perform(async()=>{const file=$('import').files[0];$('import').value='';if(!file)return;if(file.size>1600000)throw Error('Archivio troppo grande.');archiveInput=JSON.parse(await file.text());archiveMode='import';$('archive-title').textContent='Ripristina coda cifrata';$('archive-dialog').showModal();$('archive-pass').focus();}));
$('archive-cancel').addEventListener('click',()=>{$('archive-dialog').close();$('archive-pass').value='';archiveInput=null;});
$('archive-dialog').addEventListener('close',()=>{$('archive-pass').value='';archiveInput=null;});
$('archive-form').addEventListener('submit',event=>{event.preventDefault();const pass=$('archive-pass').value,input=archiveInput,mode=archiveMode;$('archive-dialog').close();perform(async()=>{
  if(mode==='export'){const data=await client.exportQueue(pass);const blob=new Blob([JSON.stringify(data)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='seva-coda-cifrata.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback('Archivio cifrato creato. Conserva la frase separatamente. Non è un backup del database.');}
  else{await client.importQueue(input,pass);feedback('Coda ripristinata per lo stesso account e dominio. Nessun dato inviato automaticamente.');}
});});
window.addEventListener('beforeunload',event=>{if(client.outbox.length||partnerPending){event.preventDefault();event.returnValue='';}});
window.addEventListener('offline',()=>feedback('Dispositivo offline. Nessun invio: la coda resta in memoria. Esportala prima di chiudere la scheda.',true));
window.addEventListener('online',()=>feedback('Rete disponibile. La sincronizzazione richiede una tua azione.'));
render();
