/* SEVA local draft portability. No network calls, no remote backup. */
(()=>{'use strict';
 const key='seva-studio-local-drafts-v1';
 const exp=document.getElementById('backup-export');
 const inp=document.getElementById('backup-import');
 const msg=document.getElementById('backup-status');
 if(!exp||!inp||!msg)return;
 const say=v=>{msg.textContent=v};
 const get=()=>{const a=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(a))throw Error('Bozze non valide');return a};
 const clean=items=>{
  if(!Array.isArray(items)||items.length>40)throw Error('Massimo 40 obiettivi');
  const ids=new Set();
  return items.map(x=>{
   if(!x||typeof x!=='object'||typeof x.id!=='string'||x.id.length>100||!x.id||ids.has(x.id))throw Error('ID bozza mancante o duplicato');
   ids.add(x.id);
   if(typeof x.title!=='string'||x.title.trim().length<1||x.title.length>160||
      typeof x.criteria!=='string'||x.criteria.trim().length<1||x.criteria.length>500)throw Error('Formato titolo/criteri non valido');
   return {id:x.id,title:x.title.trim(),criteria:x.criteria.trim()};
  });
 };
 exp.addEventListener('click',()=>{
  try{
   const data={format:'seva-studio-local-v1',exportedAt:new Date().toISOString(),goals:clean(get())};
   const objUrl=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
   const a=document.createElement('a');a.href=objUrl;a.download='SEVA-obiettivi-backup.json';
   document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(objUrl),1000);say('File di backup creato sul dispositivo.');
  }catch(e){say('Esportazione non disponibile: '+e.message);}
 });
 inp.addEventListener('change',async()=>{
  try{
   const file=inp.files?.[0];if(!file)return;
   if(file.size>200000)throw Error('File troppo grande');
   const data=JSON.parse(await file.text());
   if(data?.format!=='seva-studio-local-v1')throw Error('Formato di backup non riconosciuto');
   const goals=clean(data.goals);
   if(!window.confirm('Sostituire le bozze locali con '+goals.length+' obiettivi dal file? Questa azione sovrascrive i dati locali.')){say('Importazione annullata.');return;}
   localStorage.setItem(key,JSON.stringify(goals));
   say('Importazione locale completata: '+goals.length+' obiettivi.');window.location.reload();
  }catch(e){say('Importazione rifiutata: '+e.message);}finally{inp.value='';}
 });
})();