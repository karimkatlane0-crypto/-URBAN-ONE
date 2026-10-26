/** Restored original SEVA intelligence: voluntary Lastre/photo and private KPI. */
export function initializeOriginalIntelligence({api,toast}){
 const $=id=>document.getElementById(id);
 const euro=cents=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(cents/100);
 async function refreshAnalytics(){
 $('kpiRefresh').disabled=true;
 try {
  const data=await api('/api/analytics/overview');
  $('kpiTotal').textContent=data.goals.total;
  $('kpiDone').textContent=data.goals.done;
  $('kpiCompletion').textContent=data.goals.completionPercent.toLocaleString('it-IT')+'%';
  $('kpiBlocked').textContent=data.goals.blocked;
  $('kpiMeter').style.width=Math.min(100,Math.max(0,data.goals.completionPercent))+'%';
  $('kpiProposals').textContent=data.proposals.total;
  $('kpiQuotes').textContent=euro(data.proposals.quotedCents);
  $('kpiMarketing').textContent=euro(data.proposals.marketingConsentedCents);
  $('kpiIntents').textContent=data.lastre.intentTotal;
  $('kpiStatus').textContent='Dati del tuo account · Nessuna operazione finanziaria eseguita';
 }catch(e){$('kpiStatus').textContent='Analytics non disponibili: '+e.message;}
 finally{$('kpiRefresh').disabled=false;}
}
$('kpiRefresh').onclick=refreshAnalytics;
async function refreshLastre(){
 try {
  const result=await api('/api/lastre/intents');
  const root=$('lastreIntentList');root.replaceChildren();
  if(!result.intents.length){root.textContent='Nessuna intenzione volontaria registrata.';return;}
  for(const intent of result.intents){
   const item=document.createElement('div');item.className='goal';
   const title=document.createElement('b');title.textContent=intent.category.toUpperCase()+' · '+euro(intent.budgetCents);
   const description=document.createElement('p');description.textContent=intent.description;
   const erase=document.createElement('button');erase.className='outline';erase.textContent='Elimina';
   erase.onclick=async()=>{if(!confirm('Eliminare questa intenzione dal CRM?'))return;try{await api('/api/lastre/intents/'+intent.id,'DELETE');await refreshLastre();}catch(e){toast(e.message)}};
   item.append(title,description,erase);root.append(item);
  }
 }catch(e){$('lastreIntentList').textContent='CRM non disponibile: '+e.message;}
}
$('lastreRefresh').onclick=refreshLastre;
$('lastreSave').onclick=async()=>{
 if(!$('lastreCRMConsent').checked){toast('Consenso esplicito al salvataggio richiesto');return;}
 const budget=Math.round(Number($('lastreBudget').value)*100);
 if(!Number.isSafeInteger(budget)||budget<0){toast('Budget non valido');return;}
 try{await api('/api/lastre/intents','POST',{category:$('lastreCategory').value,description:$('lastreDescription').value,budgetCents:budget,consent:true});
 $('lastreDescription').value='';$('lastreCRMConsent').checked=false;await refreshLastre();toast('Intenzione registrata nel CRM privato');}
 catch(e){toast(e.message)}
};
async function localPrivacyJpeg(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('Seleziona una foto JPG/PNG/WebP fino a 8MB');
 const bitmap=await createImageBitmap(file);
 try {
  const max=1000,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  const data=canvas.toDataURL('image/jpeg',0.72);
  if(data.length>1500000)throw Error('Foto ancora troppo grande: scegli una immagine più piccola');
  return data;
 }finally{bitmap.close?.()}
}
$('lastreAnalyze').onclick=async()=>{
 const selected=$('localPhoto').files?.[0];
 if(!selected){toast('Seleziona una foto per Lastre');return;}
 if(!$('lastreAIConsent').checked){toast('Autorizza espressamente questa analisi AI');return;}
 const description=$('lastreDescription').value.trim();if(!description){toast('Descrivi cosa vuoi ottenere dalla foto');return;}
 $('lastreAnalyze').disabled=true;$('lastreResult').textContent='Elaborazione AI richiesta con consenso esplicito…';
 try {
  const imageDataUrl=await localPrivacyJpeg(selected);
  const result=await api('/api/lastre/analyze','POST',{consentToAI:true,imageDataUrl,purpose:description});
  $('lastreResult').textContent=result.text+'\n\nRisposta '+(result.id||'senza ID')+' · foto non salvata nel CRM · nessun acquisto eseguito';
  $('lastreAIConsent').checked=false;
 }catch(e){$('lastreResult').textContent='Analisi non disponibile: '+e.message;}
 finally{$('lastreAnalyze').disabled=false;}
};

 // Existing core tab switcher handles visibility; these listeners only fetch owner-scoped data.
 document.querySelector('[data-tab="analytics"]').addEventListener('click',refreshAnalytics);
 document.querySelector('[data-tab="lastre"]').addEventListener('click',refreshLastre);
}
