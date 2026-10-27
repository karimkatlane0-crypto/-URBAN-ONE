const el=id=>document.getElementById(id);
const run=async(path,init={})=>{
 const res=await fetch(path,{credentials:'same-origin',cache:'no-store',...init});
 const data=await res.json().catch(()=>({error:'Risposta non valida'}));
 if(!res.ok)throw new Error(res.status===401?'Accedi prima al tuo account SEVA Enterprise.':data.error||('HTTP '+res.status));
 return data;
};
const text=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n;};
const money=c=>(c/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
let paymentText='';
function renderOrder(order){
 el('payment').hidden=false;const instructions=el('instructions');instructions.replaceChildren();
 const rows=[['Beneficiario',order.beneficiary],['IBAN',order.iban],['Importo',money(order.amountCents)],['Causale obbligatoria',order.reference]];
 paymentText=rows.map(r=>r.join(': ')).join('\n');
 for(const [name,value] of rows){const p=document.createElement('p');p.append(text('strong',name+': '));p.append(text('span',value));instructions.append(p);}
 el('paymentStatus').textContent='IN ATTESA DI BONIFICO — nessun accesso ancora concesso';
 el('payment').scrollIntoView({behavior:'smooth',block:'start'});
}
async function refresh(){
 try{
  const data=await run('/api/bank/orders');const list=el('orders');list.replaceChildren();
  if(!data.orders.length){list.append(text('p','Non ci sono ordini da mostrare.'));return;}
  for(const order of data.orders){
   const p=text('p',order.reference+' · '+money(order.amountCents)+' · '+(order.status==='credited'?'Accredito verificato':order.status==='pending'?'In attesa di accredito':'Annullato')+
    (order.accessUntil?' · Accesso fino al '+new Date(order.accessUntil*1000).toLocaleDateString('it-IT'):''));
   list.append(p);
  }
 }catch(e){el('orders').textContent=e.message;}
}
async function start(){
 try{
  const s=await run('/api/bank/status');
  const on=s.enabled===true;
  el('status').textContent=on?'ORDINI BONIFICO DISPONIBILI — verifica beneficiario':'PAGAMENTO SEPA NON ATTIVO — dati bancari o autorizzazione mancanti';
  el('request').disabled=!on;
 }catch(e){el('status').textContent='Servizio non verificato: '+e.message;}
 await refresh();
}
el('request').addEventListener('click',async()=>{
 el('error').textContent='';
 try{
  if(!el('agree').checked)throw new Error('Prima di procedere devi accettare esplicitamente le condizioni.');
  const data=await run('/api/bank/orders',{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({plan:el('plan').value,termsAccepted:true})});
  renderOrder(data.order);await refresh();
 }catch(e){el('error').textContent=e.message;}
});
el('copy').addEventListener('click',()=>{if(paymentText&&navigator.clipboard)navigator.clipboard.writeText(paymentText).then(()=>el('copy').textContent='Dati copiati').catch(()=>el('copy').textContent='Copia non disponibile');});
el('refresh').addEventListener('click',refresh);
start();
