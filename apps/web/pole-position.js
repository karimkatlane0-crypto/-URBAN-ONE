/* Shared offline model for the Web and packaged mobile preview. No network or payment calls. */
(function(root){
'use strict';
const HOUR=3600000;
function instant(value){const n=Date.parse(value);if(!Number.isFinite(n))throw Error('Data e ora non valide.');return n;}
function windowState(publishedAt,now=Date.now()){
 const start=instant(publishedAt);if(!Number.isFinite(now))throw Error('Orologio non valido.');
 return {state:now<start?'SCHEDULED':now<start+24*HOUR?'EARLY_24H':'GENERAL',endsAt:new Date(start+24*HOUR).toISOString()};
}
function addSlot(slots,input,now=Date.now()){
 const start=instant(input.start);const minutes=Number(input.minutes),feeCents=Number(input.feeCents);
 if(start<=now)throw Error('Scegli un orario futuro.');
 if(!Number.isInteger(minutes)||minutes<15||minutes>180)throw Error('Durata: da 15 a 180 minuti.');
 if(!Number.isSafeInteger(feeCents)||feeCents<0||feeCents>100000)throw Error('Tariffa non valida.');
 if(typeof input.terms!=='string'||!input.terms.trim()||input.terms.length>1500)throw Error('Indica condizioni e cancellazione (massimo 1500 caratteri).');
 const end=start+minutes*60000;
 if(slots.some(s=>start<instant(s.end)&&end>instant(s.start)))throw Error('Questo slot si sovrappone a una visita.');
 return [...slots,{id:'slot-'+(slots.length+1),start:new Date(start).toISOString(),end:new Date(end).toISOString(),feeCents,terms:input.terms.trim()}];
}
function requestVisit(requests,slot,now=Date.now()){
 if(instant(slot.start)<=now)throw Error('Slot scaduto.');
 if(requests.some(r=>r.slotId===slot.id&&r.state!=='CANCELLED'))throw Error('Slot già richiesto in questa demo.');
 return [...requests,{id:'request-'+(requests.length+1),slotId:slot.id,state:'REQUESTED',feeCents:slot.feeCents,terms:slot.terms,paymentStatus:'NOT_PROCESSED',realBooking:false}];
}
function transition(request,state){
 const allowed={REQUESTED:['CONFIRMED','CANCELLED'],CONFIRMED:['CHECKED_IN','CANCELLED'],CHECKED_IN:['COMPLETED'],COMPLETED:[],CANCELLED:[]};
 if(!allowed[request.state]?.includes(state))throw Error('Passaggio di stato non consentito.');
 return {...request,state};
}
root.PolePosition=Object.freeze({windowState,addSlot,requestVisit,transition});
})(globalThis);
