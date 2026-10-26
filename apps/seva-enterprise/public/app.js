import {studentPanelHTML,bindStudentPanel} from './students.js';
import {initializeNotifications} from './notifications-ui.js';
import {initializeCommunications} from './communications-ui.js';
import {initializeOriginalIntelligence} from './original-intelligence-ui.js';
const $=id=>document.getElementById(id);let user=null,goals=[],editing=null,registerMode=false,access=false,publicStatus=null;
function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
async function api(path,method='GET',data){const res=await fetch(path,{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,credentials:'same-origin'});const body=await res.json();if(!res.ok)throw Error(body.error||'Errore di connessione');return body;}
function showLogin(){ $('students').textContent='';dbrelayCursor=null;user=null;$('workspace').hidden=true;$('loginScreen').hidden=false;$('logout').hidden=true;}
function showWorkspace(){ $('loginScreen').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;$('welcome').textContent=`Accesso verificato · ${user.email}`;}
async function sync(){try{publicStatus=await api('/api/public/status');const readiness=document.getElementById('commandReadiness');if(readiness)readiness.textContent='API raggiungibile · checkout '+(publicStatus.checkoutVerified?'convalidato':'da validare');$('system').textContent=publicStatus.aiConfigured?'OpenAI configurato':'OpenAI da collegare';$('buy').disabled=!publicStatus.salesEnabled;$('buyBuyer').disabled=!publicStatus.annualCheckoutEnabled;$('buyEcommerce').disabled=!publicStatus.annualCheckoutEnabled;$('billingStatus').textContent=`${access?'Accesso attivo':'Accesso non attivo'} · ${publicStatus.salesEnabled?'Vendite disponibili':'Vendite sospese fino a collaudo'} · ${publicStatus.stripeConfigured?'Stripe backend configurato':'Stripe backend non configurato'}`;}catch{$('system').textContent='Backend non verificato';}}
async function refresh(){const me=await api('/api/me');user=me.user;access=me.access;showWorkspace();const data=await api('/api/goals');goals=data.goals;renderGoals();await sync();}
$('authBtn').onclick=async()=>{try{const b={email:$('email').value,password:$('password').value};await api(registerMode?'/api/auth/register':'/api/auth/login','POST',b);await refresh();toast('Accesso SEVA riuscito');}catch(e){toast(e.message)}};
$('switchAuth').onclick=()=>{registerMode=!registerMode;$('authTitle').textContent=registerMode?'Crea account SEVA':'Accedi a SEVA';$('authBtn').textContent=registerMode?'Registrati':'Accedi';$('switchAuth').textContent=registerMode?'Hai già un account? Accedi':'Crea un account SEVA';};
$('logout').onclick=async()=>{try{await api('/api/auth/logout','POST');showLogin();}catch(e){toast(e.message)}};
function treeDepth(id){let n=0,current=goals.find(x=>x.id===id),seen=new Set();while(current?.parent_id&&!seen.has(current.id)){seen.add(current.id);n++;current=goals.find(x=>x.id===current.parent_id);}return n;}
function isDescendant(possible,id){let c=goals.find(x=>x.id===possible);const seen=new Set();while(c?.parent_id&&!seen.has(c.id)){seen.add(c.id);if(c.parent_id===id)return true;c=goals.find(x=>x.id===c.parent_id);}return false;}
function renderGoals(){const total=goals.length;$('metricTotal').textContent=total;$('metricDone').textContent=goals.filter(x=>x.status==='done').length;$('metricDoing').textContent=goals.filter(x=>x.status==='doing').length;$('metricBlocked').textContent=goals.filter(x=>x.status==='blocked').length;
 const label={todo:'Da avviare',doing:'In corso',blocked:'Bloccato',done:'Verificato'};
 function renderGroup(parent,depth=0){return goals.filter(x=>(x.parent_id||null)===parent).map(g=>`<div class="goal" role="button" tabindex="0" data-id="${g.id}" style="margin-left:${Math.min(depth,3)*16}px"><span class="state ${g.status}">${label[g.status]}</span><b>${escapeHTML(g.title)}</b>${g.criteria?`<p>Criterio: ${escapeHTML(g.criteria.slice(0,110))}</p>`:''}<small>${depth?'↳ '.repeat(depth):'GOAL · '} ${new Date(g.updated*1000).toLocaleDateString('it-IT')}</small></div>${renderGroup(g.id,depth+1)}`).join('');}
 $('goalList').innerHTML=total?renderGroup(null):'<p class="muted">Nessun obiettivo. Inizia con una missione verificabile.</p>';
 $('goalList').querySelectorAll('.goal').forEach(el=>{const edit=()=>editGoal(el.dataset.id);el.addEventListener('click',edit);el.addEventListener('keydown',e=>{if(e.key==='Enter')edit();});});
 $('gParent').innerHTML='<option value="">Obiettivo principale</option>'+goals.filter(g=>g.id!==editing&&!isDescendant(g.id,editing)&&treeDepth(g.id)<3).map(g=>`<option value="${g.id}">${'— '.repeat(treeDepth(g.id))}${escapeHTML(g.title)}</option>`).join('');}
function editGoal(id){editing=id;const g=goals.find(x=>x.id===id);if(!g)return;$('formTitle').textContent='Modifica obiettivo';renderGoals();$('gTitle').value=g.title;$('gParent').value=g.parent_id||'';$('gDescription').value=g.description||'';$('gCriteria').value=g.criteria||'';$('gEvidence').value=g.evidence||'';$('gStatus').value=g.status;$('deleteGoal').hidden=false;document.querySelector('.editor').scrollIntoView({behavior:'smooth',block:'nearest'});}
function resetGoal(){editing=null;$('formTitle').textContent='Nuovo obiettivo';$('goalForm').reset();$('deleteGoal').hidden=true;renderGoals();}
$('newGoal').onclick=resetGoal;$('resetGoal').onclick=resetGoal;
$('goalForm').onsubmit=async(e)=>{e.preventDefault();const data={title:$('gTitle').value,parent_id:$('gParent').value||null,description:$('gDescription').value,criteria:$('gCriteria').value,evidence:$('gEvidence').value,status:$('gStatus').value};try{await api(editing?'/api/goals/'+editing:'/api/goals',editing?'PUT':'POST',data);const r=await api('/api/goals');goals=r.goals;resetGoal();toast('Obiettivo salvato con successo');}catch(err){toast(err.message)}};
$('deleteGoal').onclick=async()=>{if(!editing||!confirm('Eliminare questo obiettivo e tutti i sotto-obiettivi?'))return;try{await api('/api/goals/'+editing,'DELETE');goals=(await api('/api/goals')).goals;resetGoal();toast('Obiettivo eliminato');}catch(e){toast(e.message)}};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=async()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x===b));document.querySelectorAll('.section').forEach(s=>s.hidden=s.id!==b.dataset.tab);if(b.dataset.tab==='rewards')try{const r=await api('/api/rewards');$('rewardList').innerHTML=r.rewards.length?r.rewards.map(x=>`<p>${escapeHTML(x.kind)} · €${(x.amount_cents/100).toFixed(2)} · ${escapeHTML(x.approval)}</p>`).join(''):'Nessuna ricompensa registrata. Nessun accredito dichiarato.';}catch(e){toast(e.message)}if(b.dataset.tab==='billing')await sync();if(b.dataset.tab==='dbrelay')await refreshDBRelay();if(b.dataset.tab==='students'){$('students').innerHTML=studentPanelHTML()+'<p>Il profilo non approva la richiesta di verifica accademica del negozio. <a href="/shop.html">Apri richiesta studenti e carrello →</a></p>';await bindStudentPanel();}});
$('generate').onclick=async()=>{$('generate').disabled=true;$('aiResult').textContent='Richiesta autenticata in corso…';try{const r=await api('/api/ai/generate','POST',{prompt:$('aiPrompt').value});$('aiResult').textContent=r.text+`\n\n✓ Risposta autentica · ${r.provider} · ${r.model} · ${r.id}`;}catch(e){$('aiResult').textContent='Risposta AI non disponibile: '+e.message;}finally{$('generate').disabled=false}};
$('buy').onclick=async()=>{try{const r=await api('/api/billing/checkout','POST',{});if(!r.url?.startsWith('https://checkout.stripe.com/'))throw Error('Checkout URL non valido');location.href=r.url;}catch(e){toast(e.message)}};
async function annualCheckout(plan){try{const r=await api('/api/billing/checkout/annual','POST',{plan});if(!r.url?.startsWith('https://checkout.stripe.com/'))throw Error('Checkout URL non valido');location.href=r.url;}catch(e){toast(e.message);}}
$('buyBuyer').onclick=()=>annualCheckout('buyer');
$('buyEcommerce').onclick=()=>annualCheckout('ecommerce');
let dbrelayCursor=null;
async function refreshDBRelay(){
 const button=$('dbrelayRefresh');button.disabled=true;
 try{
  const status=await api('/api/dbrelay/status');
  let changes=0;let newSnapshot=false;
  if(dbrelayCursor===null){
   const snapshot=await api('/api/dbrelay/snapshot');dbrelayCursor=snapshot.cursor;
   goals=snapshot.goals;renderGoals();newSnapshot=true;
  } else {
   let pageCount=0,more=true;
   while(more&&pageCount++<30) {
    const page=await api('/api/dbrelay/changes?after='+encodeURIComponent(dbrelayCursor)+'&limit=100');
    changes+=page.changes.length;dbrelayCursor=page.nextCursor;more=page.hasMore;
   }
   if(changes){const snapshot=await api('/api/dbrelay/snapshot');goals=snapshot.goals;renderGoals();dbrelayCursor=snapshot.cursor;}
   if(more)throw Error('Molte modifiche presenti: esegui nuovamente la sincronizzazione');
  }
  $('dbrelayStatus').textContent='Database '+status.database+' · '+(status.persistent?'persistente':'in memoria (test)')+' · '+status.goals+' obiettivi · '+status.campaigns+' proposte';
  $('dbrelayDetails').textContent='Cursor '+dbrelayCursor+' · '+(newSnapshot?'Snapshot iniziale verificato':changes+' eventi sincronizzati')+' · Relay esterni non connessi · Pagamenti non avviati';
 }catch(e){$('dbrelayStatus').textContent='DBRELAY non disponibile: '+e.message;}finally{button.disabled=false;}
}
$('dbrelayRefresh').onclick=refreshDBRelay;
function csvEscape(t){return '"'+String(t??'').replace(/"/g,'""')+'"';}
function exportData(kind){let content='',mime='text/plain';if(kind==='json'){content=JSON.stringify({app:'SEVA',version:1,exportedAt:new Date().toISOString(),goals},null,2);mime='application/json';}else if(kind==='csv'){content=[['id','parent_id','title','description','criteria','evidence','status'].join(','),...goals.map(g=>['id','parent_id','title','description','criteria','evidence','status'].map(k=>csvEscape(g[k])).join(','))].join('\n');mime='text/csv';}else{content=goals.map(g=>`${'  '.repeat(treeDepth(g.id))}• ${g.title} [${g.status}]\n  Criteri: ${g.criteria||'Da definire'}\n  Evidenze: ${g.evidence||'Da verificare'}`).join('\n\n');}const blob=new Blob([content],{type:mime+';charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`SEVA-goals-${new Date().toISOString().slice(0,10)}.${kind}`;a.click();URL.revokeObjectURL(url);}
document.querySelectorAll('[data-export]').forEach(el=>el.onclick=()=>exportData(el.dataset.export));
$('localPhoto').onchange=e=>{const previews=$('photoPreview');previews.textContent='';for(const file of [...e.target.files].slice(0,8)){if(!file.type.startsWith('image/'))continue;const img=document.createElement('img');img.alt=file.name;const url=URL.createObjectURL(file);img.src=url;img.onload=()=>URL.revokeObjectURL(url);previews.append(img);}};
(async()=>{await sync();try{await refresh();}catch{showLogin();}if(new URLSearchParams(location.search).get('checkout')==='success'){toast('Checkout completato: accesso attivo solo dopo webhook Stripe verificato.');history.replaceState({},'',location.pathname);}})();

// PWA install: only when browser offers it. Offline cache excludes authenticated APIs.
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;const b=$('install');b.hidden=false;});
$('install').onclick=async()=>{if(!deferredInstall)return;const event=deferredInstall;deferredInstall=null;await event.prompt();$('install').hidden=true;};
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')) navigator.serviceWorker.register('/sw.js').catch(()=>{});
initializeNotifications({api,toast});
initializeCommunications({api,toast});
initializeOriginalIntelligence({api,toast});
