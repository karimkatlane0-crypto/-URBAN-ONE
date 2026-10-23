'use strict';
// Pole Position front-end preview. No provider/model/billing integrations are invoked.
(()=>{
const $=id=>document.getElementById(id);
const legal={
 listing_sale:['Identifica Stato e poteri del venditore','Controlla provenienza, gravami, conformità urbanistica e catastale','Concorda condizioni, deposito, provvigioni e privacy con professionista','Richiedi revisione professionale prima di firma o pagamento'],
 rental:['Identifica Stato, locatore e diritto a concedere il godimento','Verifica tipologia di contratto, canone, deposito e durata secondo la legge locale','Predisponi inventario, obblighi fiscali e procedura di registrazione','Sottoponi la bozza a legale/consulente competente'],
 succession:['Identifica ultimo domicilio abituale, nazionalità ed eventuale elemento transfrontaliero','Verifica applicabilità del Regolamento UE 650/2012: Danimarca e Irlanda non partecipano','Valuta Certificato Successorio Europeo con notaio/legale','Verifica separatamente immobili, successione nazionale e imposte'],
 judicial_auction:['Identifica giurisdizione e portale giudiziario ufficiale','Controlla avviso, perizia e informazioni sull’occupazione','Fai verificare oneri, vincoli, cauzione e condizioni di aggiudicazione','Non inviare offerte, dati personali né pagamenti tramite la demo']
};
const prompts={
 sources:['Controllo qualità sorgente catastale o INSPIRE','Licenza e aggiornamento del dataset','Verifica manuale suffisso civico e CAP'],
 legal:['Identificazione del titolare o delegato','Revisione umana del documento','Validità nazionale e protezione dei dati'],
 agents:['Scomposizione in compiti verificabili','Controlli identità, provenienza e consensi','Nessuna azione esterna senza autorizzazione umana'],
 ml:['Prova su campioni sintetici con valutazione separata','Controllo bias, drift, falsi positivi e provenienza','Nessuna stima patrimoniale o decisione automatica'],
 gps:['Consenso esplicito e monitoraggio solo in primo piano','Coordinate verificate e annunci pubblicati da titolare autorizzato','Nessuna segnalazione commerciale senza titolo premium verificato'],
 billing:['Consentire prezzi e condizioni solo da contratto','Verificare Apple/Google Billing per funzionalità digitali','Non modificare Stripe LIVE e non incassare in demo']
};
let walkId=null;
let lastCall=0;
function say(id,s){$(id).textContent=s;}
function createPreview(){
 const type=$('documentType').value,country=$('documentCountry').value.trim().toUpperCase();
 if(!/^[A-Z]{2}$/.test(country)){say('draftStatus','Inserisci un codice Paese ISO di due lettere.');return;}
 const reference=$('reference').value.trim().replace(/[\r\n\t]/g,' ').slice(0,120)||'[riferimento fittizio]';
 const notes=[
 'BOZZA ISTRUTTORIA NON VINCOLANTE — NON È UN CONTRATTO',
 'Operazione: '+type+' · Paese: '+country,
 'Riferimento fittizio: '+reference,
 'Richiede verifica professionale, documenti e autorizzazione.',
 ...legal[type].map((item,index)=>(index+1)+'. '+item),
 'Non autorizza firme, successioni, partecipazione ad aste, offerte né incassi.'
 ];
 $('memo').textContent=notes.join('\n');
 say('draftStatus','Schema creato solo nel dispositivo. Nessun documento inviato o firmato.');
}
$('draftForm').addEventListener('submit',e=>{e.preventDefault();createPreview();});
$('agentSelect').addEventListener('change',()=>{
 const type=$('agentSelect').value;
 $('agentNotes').replaceChildren();
 for(const item of prompts[type]){const li=document.createElement('li');li.textContent=item;$('agentNotes').append(li);}
});
$('agentSelect').dispatchEvent(new Event('change'));
const training=[
 {v:[1,1,1,1],label:1},{v:[.9,.8,1,1],label:1},
 {v:[0,0,0,.2],label:0},{v:[.1,.1,.3,0],label:0},
 {v:[.8,.9,.6,.9],label:1},{v:[.2,.2,.1,.1],label:0}
];
let weights=[0,0,0,0],bias=0;
const sigmoid=x=>1/(1+Math.exp(-Math.max(-30,Math.min(30,x))));
for(let epoch=0;epoch<180;epoch++){
 const grad=[0,0,0,0];let db=0;
 for(const entry of training){
  const estimate=sigmoid(bias+weights.reduce((sum,w,k)=>sum+w*entry.v[k],0));
  db+=estimate-entry.label;
  for(let i=0;i<4;i++)grad[i]+=(estimate-entry.label)*entry.v[i];
 }
 for(let i=0;i<4;i++)weights[i]-=.3*grad[i]/training.length;
 bias-=.3*db/training.length;
}
$('mlForm').addEventListener('submit',e=>{
 e.preventDefault();
 const v=['budgetMatch','civicMatch','purposeMatch','sourceTrust'].map(id=>Number($(id).value)/100);
 if(v.some(n=>!Number.isFinite(n)||n<0||n>1)){say('mlOutput','Valori da 0 a 100.');return;}
 const p=sigmoid(bias+weights.reduce((s,w,i)=>s+w*v[i],0));
 say('mlOutput','Punteggio dimostrativo: '+Math.round(p*100)+'% · modello lineare ML su soli esempi sintetici. Non è un valore immobiliare, previsione di vendita o risultato certificato.');
});
const updateInfo=()=>{
 const entitled=false; // no client flag can create a paid entitlement
 say('premiumStatus',entitled?'Funzione premium verificata':'Premium non attivo: nessun prezzo, addebito o abbonamento creato. Le segnalazioni sui civici richiedono un entitlement verificato sul server.');
};
updateInfo();
const stopWalking=()=>{
 if(walkId!==null&&navigator.geolocation?.clearWatch)navigator.geolocation.clearWatch(walkId);
 walkId=null;
 $('startWalk').disabled=false;$('stopWalk').disabled=true;
 say('walkStatus','Monitoraggio disattivato. Nessuna posizione salvata o inviata.');
};
$('startWalk').addEventListener('click',()=>{
 if(walkId!==null)return;
 if(!window.isSecureContext||!navigator.geolocation){say('walkStatus','GPS disponibile solo in un contesto HTTPS sicuro e con geolocalizzazione supportata.');return;}
 if(!$('walkConsent').checked){say('walkStatus','Per iniziare occorre autorizzare esplicitamente l’uso GPS locale in primo piano.');return;}
 if(document.visibilityState!=='visible'){say('walkStatus','Apri la pagina in primo piano prima di avviare il GPS.');return;}
 $('startWalk').disabled=true;$('stopWalk').disabled=false;
 say('walkStatus','Richiesta autorizzazione GPS al dispositivo. Nessuna notifica civici perché non ci sono annunci geocodificati e premium verificati.');
 try{
  walkId=navigator.geolocation.watchPosition(
   pos=>{
    if(document.visibilityState!=='visible'){stopWalking();return;}
    if(Date.now()-lastCall<10000)return;
    lastCall=Date.now();
    const accuracy=Number.isFinite(pos.coords.accuracy)?Math.round(pos.coords.accuracy):'sconosciuta';
    say('walkStatus','GPS locale attivo · accuratezza stimata '+accuracy+' m. Nessuna coordinata trasmessa o memorizzata. Nessun annuncio verificato per alert premium.');
   },
   err=>{say('walkStatus','GPS non disponibile o autorizzazione negata: '+(err.code===1?'consenso negato':'segnale indisponibile')+'.');stopWalking();},
   {enableHighAccuracy:false,timeout:12000,maximumAge:15000}
  );
 }catch{stopWalking();say('walkStatus','Il dispositivo non consente questa modalità GPS.');}
});
$('stopWalk').addEventListener('click',stopWalking);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible'&&walkId!==null)stopWalking();});
window.addEventListener('pagehide',stopWalking);
})();
