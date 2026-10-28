'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const storageKey = 'seva-studio-local-drafts-v1';
  const maxDrafts = 40;
  let serverReady = false, session = null, salesEnabled = false;
  let generativeProviders = {openai:false,gemini:false};
  let aiInFlight = false;

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
    const contentType=response.headers.get('content-type')||'';
    if (!/^application\/([a-z0-9.+-]*\+)?json\b/i.test(contentType)) {
      const e=Error('Il percorso non risponde con JSON SEVA: backend non verificato');
      e.status=502;
      throw e;
    }
    let result;
    try {result=await response.json();}
    catch {
      const e=Error('Risposta JSON non valida dal backend SEVA');
      e.status=502;
      throw e;
    }
    if (!result||typeof result!=='object'||Array.isArray(result)) {
      const e=Error('Risposta API SEVA non valida');
      e.status=502;
      throw e;
    }
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
    if (error.status===402) return 'Serve un accesso SEVA verificato e autorizzato. Nessun pagamento avviato.';
    if (error.status===429) return 'Limite temporaneo o credito del provider esaurito. Nessuna risposta AI generata.';
    if (error.status===503) return 'Servizio o provider non configurato. Nessuna risposta AI generata.';
    if (error.status===502) return 'Risposta del backend o del provider non valida. Controlla la connessione e la prova HTTPS.';
    return 'Richiesta non completata: '+(error.message||'errore temporaneo');
  }
  function showProviderStatus() {
    const selected=$('ai-provider').value;
    const configured=generativeProviders[selected]===true;
    $('provider-status').textContent=configured
      ? selected+' · configurato, non collaudato'
      : selected+' · non configurato';
    $('model-state').textContent=configured?'test live richiesto':'disattivo';
  }
  $('ai-provider').addEventListener('change',()=>{
    // Consent is provider-specific and expires when changing provider.
    $('ai-consent').checked=false;
    showProviderStatus();
  });
  async function refreshStatus() {
    serverReady=false;
    session=null;
    salesEnabled=false;
    generativeProviders={openai:false,gemini:false};
    $('service-dot').classList.remove('online');
    try {
      // A static CDN can serve index.html with HTTP 200 for missing /api routes.
      // Require both a real Node health response and the SEVA status contract.
      const health=await request('/health');
      if(health.ok!==true||health.service!=='seva')throw Error('SEVA health contract invalid');
      const status=await request('/api/public/status');
      if(status.name!=='SEVA'||typeof status.salesEnabled!=='boolean'||
        !status.generativeProviders||
        typeof status.generativeProviders.openai!=='boolean'||
        typeof status.generativeProviders.gemini!=='boolean')
        throw Error('SEVA status contract invalid');
      serverReady=true;
      $('service-dot').classList.add('online');
      $('service-state').textContent='Server SEVA raggiungibile';
      generativeProviders=status.generativeProviders;
      showProviderStatus();
      salesEnabled=status.salesEnabled===true;
    } catch {
      $('service-dot').classList.remove('online');
      $('service-state').textContent='Backend SEVA non verificato (anche se il sito statico risponde)';
      $('provider-status').textContent='Non verificato';
      $('model-state').textContent='disattivo';
      $('access-status').textContent='Non autenticato';
      $('checkout').disabled=true;
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
    if(aiInFlight)return;
    const prompt=$('ai-prompt').value.trim();
    if(!prompt)return;
    if(!$('ai-consent').checked){
      addChat('assistant','Seleziona il consenso esplicito per inviare il testo al provider AI configurato. Per la modalità senza invio usa «Genera schema locale».');
      return;
    }
    if(!serverReady){
      addChat('assistant','Backend SEVA HTTPS non verificato. Lo schema locale resta disponibile senza inviare dati.');
      return;
    }
    const provider=$('ai-provider').value;
    const expected=provider==='gemini'?'Gemini':'OpenAI';
    addChat('user',prompt);
    aiInFlight=true;
    const send=$('send-ai');
    send.disabled=true;send.textContent='…';
    $('ai-provider').disabled=true;
    try {
      const response=await request('/api/ai/generate',jsonOptions({prompt,consent:true,provider}));
      if(response.provider!==expected||typeof response.id!=='string'||!response.id.trim()||
        typeof response.model!=='string'||!response.model.trim()||
        typeof response.text!=='string'||!response.text.trim())
        throw Object.assign(Error('Tracciabilità AI non verificabile'),{status:502});
      addChat('assistant','Fonte: '+response.provider+' · '+response.model+' · risposta '+response.id+'\n'+response.text);
    } catch(error) { addChat('assistant',appError(error)); }
    finally {
      aiInFlight=false;
      send.disabled=false;send.textContent='Invia ↑';
      $('ai-provider').disabled=false;
      $('ai-consent').checked=false;
    }
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
