// B&B partner B2B billing — proposal-only, no Stripe calls or customer charges.
// Server callers must verify contracts, Stripe Customers and reservation provenance
// against authoritative systems. Never trust public client booleans.
export const PARTNER_BILLING_PRODUCTS=Object.freeze({
  monthly:'prod_VSZuHukbW2SKsj',
  commission:'prod_VSZuJCXPhgNQgk',
  currency:'eur',
  status:'INACTIVE_PENDING_CONTRACT'
});

const ALLOWED_KINDS=new Set(['direct_booking','optional_service']);
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;
const PERIOD=/^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_AMOUNT_CENTS=100000000; // EUR 1m risk ceiling for an individual event

function validDate(s){
  return typeof s==='string'&&ISO_DATE.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'));
}
function intBetween(value,min,max){return Number.isSafeInteger(value)&&value>=min&&value<=max;}
function str(value){return typeof value==='string'&&value.trim().length>0;}
function periodContains(period,date){return date.slice(0,7)===period;}

// Caller supplies a previously signed contract and separately verified provider evidence.
// This function constructs an auditable *proposal*, never a Stripe invoice/subscription.
// This prevents UI inputs from being confused with contract or booking evidence.
export function quoteBnbPartnerBilling({agreement={},period,events=[],alreadyInvoicedEventIds=[]}={}){
  if(!PERIOD.test(period||''))throw new Error('INVALID_BILLING_PERIOD');
  if(!Array.isArray(events)||events.length>10000)throw new Error('INVALID_EVENTS');
  if(!Array.isArray(alreadyInvoicedEventIds))throw new Error('INVALID_LEDGER');
  const gates=[];
  if(agreement.status!=='signed'||!str(agreement.signedAgreementRef)||!validDate(agreement.signedOn))gates.push('SIGNED_PARTNER_CONTRACT_REQUIRED');
  if(!str(agreement.partnerId))gates.push('PARTNER_ID_REQUIRED');
  if(!validDate(agreement.effectiveFrom)||agreement.effectiveFrom>period+'-31')gates.push('CONTRACT_PERIOD_NOT_EFFECTIVE');
  if(agreement.currency!=='eur')gates.push('EUR_CURRENCY_REQUIRED');
  if(!intBetween(agreement.monthlyFeeCents,0,10000000))gates.push('AGREED_MONTHLY_PRICE_REQUIRED');
  if(!intBetween(agreement.commissionBps,0,10000))gates.push('AGREED_COMMISSION_RATE_REQUIRED');
  if(!str(agreement.stripeCustomerId)||!agreement.stripeCustomerId.startsWith('cus_')||
    agreement.stripeCustomerProviderVerified!==true||!str(agreement.stripeCustomerEvidenceRef))
    gates.push('VERIFIED_STRIPE_CUSTOMER_REQUIRED');
  if(agreement.billingApproved!==true||!str(agreement.billingApprovalRef))gates.push('EXPLICIT_BILLING_APPROVAL_REQUIRED');
  if(!intBetween(agreement.monthlyFeeCents,0,10000000)||
     !intBetween(agreement.commissionBps,0,10000)) {
    return {status:'BLOCKED',gates,period,monthlyFeeCents:0,commissionCents:0,subtotalCents:0,
      currency:'eur',eligibleEvents:[],excludedEvents:[],readyForInvoice:false,
      chargesCreated:0,invoiceCreated:false};
  }
  if(gates.length) return {status:'BLOCKED',gates,period,monthlyFeeCents:0,commissionCents:0,
    subtotalCents:0,currency:'eur',eligibleEvents:[],excludedEvents:[],
    readyForInvoice:false,chargesCreated:0,invoiceCreated:false};

  const invoiced=new Set(alreadyInvoicedEventIds);
  const seen=new Set();
  const eligibleEvents=[];
  const excludedEvents=[];
  let commissionCents=0;
  for(const event of events){
    const id=event?.externalEventId;
    let reason=null;
    if(!str(id))reason='EVENT_ID_REQUIRED';
    else if(seen.has(id)||invoiced.has(id))reason='DUPLICATE_OR_ALREADY_BILLED';
    else if(!ALLOWED_KINDS.has(event.kind))reason='EVENT_KIND_NOT_COMMISSIONABLE';
    else if(!validDate(event.completedOn)||!periodContains(period,event.completedOn))reason='OUTSIDE_PERIOD_OR_INVALID_DATE';
    else if(event.status!=='completed'&&event.status!=='fulfilled')reason='EVENT_NOT_COMPLETE';
    else if(event.paymentVerified!==true||event.providerVerified!==true||!str(event.providerEvidenceRef))
      reason='PROVIDER_AND_PAYMENT_VERIFICATION_REQUIRED';
    else if(event.commissionApprovedByContract!==true)reason='EVENT_NOT_COVERED_BY_CONTRACT';
    else if(event.channel==='booking.com'||event.channel==='ota')reason='OTA_BOOKING_EXCLUDED_BY_DEFAULT';
    else if(event.kind==='direct_booking'&&event.channel!=='direct')reason='NON_DIRECT_BOOKING';
    else if(event.refunded===true||event.disputed===true)reason='REFUND_OR_DISPUTE_PENDING';
    else if(!intBetween(event.commissionBaseCents,1,MAX_AMOUNT_CENTS))reason='INVALID_COMMISSION_BASE';
    if(str(id))seen.add(id);
    if(reason){excludedEvents.push({externalEventId:str(id)?id:null,reason});continue;}
    const feeCents=Math.floor((event.commissionBaseCents*agreement.commissionBps+5000)/10000);
    commissionCents+=feeCents;
    eligibleEvents.push({externalEventId:id,kind:event.kind,
      commissionBaseCents:event.commissionBaseCents,commissionCents:feeCents,
      providerEvidenceRef:event.providerEvidenceRef});
  }
  // Monetary figures are exclusive of VAT/taxes, which must be calculated by
  // configured Stripe Tax/accounting rules before any invoice is issued.
  return {status:'PROPOSAL_ONLY',period,currency:'eur',
    partnerId:agreement.partnerId,stripeCustomerId:agreement.stripeCustomerId,
    monthlyFeeCents:agreement.monthlyFeeCents,commissionCents,
    subtotalCents:agreement.monthlyFeeCents+commissionCents,
    eligibleEvents,excludedEvents,readyForInvoice:false,
    requiredBeforeInvoice:['LIVE_STRIPE_CUSTOMER_RETRIEVAL','CURRENT_CONTRACT_CHECK',
      'DURABLE_EVENT_AND_INVOICE_LEDGER','TAX_VAT_CHECK','AUTHORIZED_INVOICE_RELEASE'],
    chargesCreated:0,invoiceCreated:false};
}
