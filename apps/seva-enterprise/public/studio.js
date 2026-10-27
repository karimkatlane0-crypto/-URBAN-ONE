'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const storageKey = 'seva-studio-local-drafts-v1';
  const maxDrafts = 40;
  let serverReady = false, session = null, salesEnabled = false;

  function drafts() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(parsed) ? parsed.slice(0, maxDrafts) : [];
    } catch { return []; }
  }
  function saveDrafts(items) {
    try { localStorage.setItem(storageKey, JSON.stringify(items)); return true; }
    catch { return false; }
  }
  function safeText(parent,tag,value,cls) {
    const child=document.createElement(tag);
    if (cls) child.className=cls;
    child.textContent=String(value);
    parent.appendChild(child);
    return child;
  }
  function renderDrafts() {
    const list=$('goal-list');
    list.replaceChildren();
    const items=drafts();
    $('goal-count').textContent=String(items.length);
    if (!items.length) {
      safeText(list,'div','Ancora nessuna bozza. Inizia con un obiettivo concreto.','minor-notice');
      return;
    }
    for (const item of items) {
      const row=safeText(list,'div','','goal-item');
      safeText(row,'span','◎','goal-dot');
      const info=safeText(row,'div','','goal-info');
      safeText(info,'strong',item.title);
      safeText(info,'small','Verifica: '+item.criteria);
      const remove=safeText(row,'button','Rimuovi');
      remove.type='button';remove.setAttribute('aria-label','Rimuovi '+item.title);
      remove.addEventListener('click',()=>{saveDrafts(drafts().filter(x=>x.id!==item.id));renderDrafts();});
    }
  }
  function addChat(role,body) {
    const log=$('chat-log');
    const row=safeText(log,'div','','assistant-line'+(role==='user'?' user':''));
    safeText(row,'span',role==='user'?'●':'✦','chat-avatar');
    const content=safeText(row,'div','');
    safeText(content,'b',role==='user'?'Tu':'SEVA');
    safeText(content,'p',body);
    log.scrollTop=log.scrollHeight;
  }
  async function request(path,options={}) {
    const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});
    const result=await response.json().catch(()=>({error:'Risposta non valida dal server'}));
    if (!response.ok) {
      const e=Error(result.error||'Servizio non disponibile');
      e.status=response.status;
      throw e;
    }
    return result;
  }
  function jsonOptions(payload) {
    return {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)};
  }
  function appError(error) {
    if (error.status===401) return 'Effettua l’accesso al tuo account SEVA. Nessuna chiamata AI effettuata.';
    if (error.status===402) return 'Serve un abbonamento SEVA Enterprise verificato con Stripe. Nessun addebito avviato.';
    if (error.status===429) return 'Limite temporaneo o credito del provider esaurito. Nessuna risposta AI generata.';
    if (error.status===503) return 'Servizio o provider non configurato. Nessuna risposta AI generata.';
    return 'Richiesta non completata: '+(error.message||'errore temporaneo');
  }
  async function refreshStatus() {
    try {
      const status=await request('/api/public/status');
      serverReady=true;
      $('service-dot').classList.add('online');
      $('service-state').textContent='Server SEVA raggiungibile';
      $('provider-status').textContent=status.aiConfigured?'Chiave presente · da collaudare':'Non configurato';
      $('model-state').textContent=status.aiConfigured?'non collaudato':'disattivo';
      salesEnabled=status.salesEnabled===true;
    } catch {
      $('service-state').textContent='Anteprima / backend non raggiungibile';
      $('provider-status').textContent='Non verificato';
    }
    try {
      if (!serverReady) return;
      session=await request('/api/me');
      $('user-state').textContent='Sessione: '+session.user.email;
      $('access-status').textContent=session.access?'Piano attivo':'Non attivo';
    } catch {
      session=null;
      $('user-state').textContent='Accesso richiesto';
      $('access-status').textContent='Non autenticato';
    }
    const canSell=serverReady && salesEnabled && Boolean(session?.user);
    const checkout=$('checkout');
    checkout.disabled=!canSell;
    checkout.textContent=canSell?'Vai al checkout sicuro Stripe ↗':'Acquisto non ancora disponibile';
    if (canSell) $('purchase-state').textContent='L’eventuale acquisto sarà confermato solo da webhook Stripe firmato.';
  }
  $('goal-form').addEventListener('submit',event=>{
    event.preventDefault();
    const title=$('goal-title').value.trim(),criteria=$('goal-criteria').value.trim();
    if (!title||!criteria) return;
    const items=drafts();
    if(items.length>=maxDrafts){alert('Massimo 40 bozze locali. Rimuovi una bozza per aggiungerne altre.');return;}
    const id=crypto.randomUUID?crypto.randomUUID():String(Date.now())+String(Math.random());
    if(!saveDrafts([{id,title,criteria},...items])){alert('Salvataggio nel browser non disponibile.');return;}
    $('goal-form').reset();
    renderDrafts();
  });
  $('local-plan').addEventListener('click',()=>{
    const text=$('ai-prompt').value.trim() || drafts()[0]?.title || 'Definisci un obiettivo concreto';
    addChat('user',text);
    addChat('assistant','SCHEMA LOCALE — non generato da un modello AI.\n\nGOAL → '+text.slice(0,180)+
      '\n1. DEFINISCI: risultato, responsabile e data.\n2. ESEGUI: un’azione piccola e reversibile.\n3. VERIFICA: conserva una prova verificabile.\n4. VALIDATE: confronta prova e criterio.\n5. RELEASE: pubblica solo dopo controlli reali.');
  });
  $('ai-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const prompt=$('ai-prompt').value.trim();
    if(!prompt)return;
    if(!$('ai-consent').checked){
      addChat('assistant','Seleziona il consenso esplicito per inviare il testo al provider AI configurato. Per la modalità senza invio usa «Genera schema locale».');
      return;
    }
    addChat('user',prompt);
    const send=$('send-ai');send.disabled=true;send.textContent='…';
    try {
      const response=await request('/api/ai/generate',jsonOptions({prompt,consent:true}));
      addChat('assistant',response.text||'Il provider non ha restituito testo.');
    } catch(error) { addChat('assistant',appError(error)); }
    finally {send.disabled=false;send.textContent='Invia ↑';}
  });
  $('issue-key').addEventListener('click',async()=>{
    const output=$('api-key-out');
    output.hidden=false;output.textContent='Richiesta in corso…';
    try {
      const result=await request('/api/developer/keys',jsonOptions({name:'SEVA Studio key'}));
      output.textContent='Conserva in un gestore di segreti. La chiave NON verrà mostrata ancora:\n'+result.key+
        '\nScadenza: '+new Date(result.expires*1000).toLocaleDateString('it-IT')+'\nNon incollarla in chat o GitHub.';
    } catch(error){output.textContent=appError(error);}
  });
  $('checkout').addEventListener('click',async()=>{
    if(!serverReady||!salesEnabled||!session?.user)return;
    const button=$('checkout');button.disabled=true;
    try{
      const result=await request('/api/billing/checkout',jsonOptions({}));
      const url=new URL(result.url);
      if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('Destinazione Checkout non verificata');
      window.location.assign(url.href);
    } catch(error) {
      $('purchase-state').textContent=appError(error);
      button.disabled=false;
    }
  });
  renderDrafts();
  refreshStatus();
})();
