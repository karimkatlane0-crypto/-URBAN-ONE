const $ = id => document.getElementById(id);
const cents = id => Math.round(Number($(id).value || 0) * 100);
const intval = id => Number($(id).value);
const eur = n => new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n/100);
const val = (id) => $(id).checked;
async function send(url,body){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error || 'Richiesta rifiutata');return data;}
let lastQuoteInput=null;
function makeQuoteInput(){const mode=$('goalMode').value;const goal={mode,...((mode==='fixed'||mode==='negotiated')?{amountCents:cents('goalFee')}:mode==='calculated'?{verifiedGoals:intval('verifiedGoals'),amountPerGoalCents:cents('perGoal'),capCents:cents('goalCap')}:{})};return {months:intval('months'),goal,marketingRequestedCents:cents('marketingRequested'),marketingConsentedCents:cents('marketingConsented'),verifiedSavingCents:cents('saving'),savingEvidenceReference:$('savingEvidence').value};}
$('quoteForm').addEventListener('submit',async e=>{e.preventDefault();$('quoteResult').textContent='Calcolo...';try{lastQuoteInput=makeQuoteInput();const {quote:q}=await send('/api/commercial/quote',lastQuoteInput);$('quoteResult').textContent=`Abbonamento: ${eur(q.subscriptionCents)}\nGoal G: ${eur(q.goalCents)}\nMarketing autorizzato M: ${eur(q.marketingCents)}\nMarketing da autorizzare: ${eur(q.marketingPendingApprovalCents)}\nRisparmio provato S: -${eur(q.savingCents)}\nTOTALE OGGI: ${eur(q.dueNowCents)}\n\n${q.warning}`;}catch(err){$('quoteResult').textContent=err.message;}});
$('redeemForm').addEventListener('submit',async e=>{e.preventDefault();$('redeemResult').textContent='Verifica...';try{const deadlineIso = new Date($('deadline').value).toISOString();const {redemption:r}=await send('/api/commercial/redemption-preview',{quorumTarget:intval('quorumTarget'),quorumReachedCount:intval('quorumActual'),deadlineIso,nowIso:new Date().toISOString(),buyerId:'demo-self',orderBuyerId:'demo-self',buyerMarketingPaidCents:cents('marketingPaid'),verifiedMarketingDeliveredCents:cents('marketingDelivered'),dedicatedRefundReserveCents:cents('refundReserve'),earlyRedemptionContracted:val('earlyContracted'),buyerRequestedEarlyRedemption:val('earlyRequested'),deadlineRedemptionContracted:val('deadlineContracted'),explicitRefundTermsAccepted:val('termsAccepted'),marketingReceiptsVerified:val('receiptsVerified'),legalAndTaxApproval:val('complianceApproved'),verifiedRefundRail:val('providerVerified')});$('redeemResult').textContent=`Esito: ${r.status}\nEvento: ${r.trigger || 'nessuno'}\nRiscatto massimo documentato: ${eur(r.amountCents)}\nEseguibile secondo la simulazione: ${eur(r.redeemableCents)}\nImporto effettivamente trasferito: €0,00\n\nIl valore mostrato non rappresenta un diritto effettivo o una promessa di pagamento. Le caselle sono simulazioni, non verifiche documentali reali.`;}catch(err){$('redeemResult').textContent=err.message;}});

$('saveDraft').addEventListener('click',async()=>{try{const deadlineIso=new Date($('deadline').value).toISOString();const quote=makeQuoteInput();const data=await send('/api/commercial/campaigns',{quote,terms:{quorumTarget:intval('quorumTarget'),deadlineIso,marketingConsentConfirmed:val('marketingConfirmed')}});$('quoteResult').textContent=`Proposta salvata nello spazio privato · ID ${data.id} · stato DRAFT.\nNon è un ordine o un pagamento. Controlla contratto, scadenza e budget prima di acquistare.`;}catch(e){$('quoteResult').textContent='Salvataggio non effettuato: '+e.message+' · Per salvare occorre accedere a SEVA.';}});

$('fundedForm').addEventListener('submit',async e=>{
 e.preventDefault();
 $('fundedResult').textContent='Calcolo preventivo non vincolante...';
 try{
  const simulate=val('fundedSimulation');
  const request={
   purchaseCents:cents('fundedPurchase'),
   verifiedMerchantBudgetCents:cents('fundedBudget'),
   exclusiveAllocatedCents:cents('fundedAllocated'),
   contractCapCents:cents('fundedCap'),
   customerMarketingContributionCents:cents('customerMarketing'),
   partnerAgreementRef:$('fundedAgreement').value.trim(),
   fundingReceiptRef:$('fundedReceipt').value.trim(),
   purchaseCompleted:simulate,paymentConfirmed:simulate,partnerAgreementActive:simulate,
   customerTermsAccepted:simulate,partnerConfirmed:simulate,deliveryVerified:simulate,
   refundWindowCleared:simulate,budgetProvenReserved:simulate
  };
  const {preview:p}=await send('/api/commercial/marketing-benefit-preview',request);
  $('fundedResult').textContent='Esito simulazione: '+p.status+
   '\nPrezzo dovuto al checkout: '+eur(p.customerDueAtCheckoutCents)+
   '\nBeneficio partner massimo POTENZIALE: '+eur(p.potentialBenefitCents)+
   '\nCosto netto ipotetico dopo rimborso verificato: '+eur(p.potentialNetAfterSettlementCents)+
   '\nCashback realmente accreditato: '+eur(p.confirmedCashbackPaidCents)+
   '\n\n'+p.explanation;
 }catch(error){$('fundedResult').textContent='Calcolo non eseguito: '+error.message;}
});

if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')) navigator.serviceWorker.register('/sw.js').catch(()=>{});