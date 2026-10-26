/** SEVA partner attribution — INTERNAL-only candidate ledger.
 * Never creates charges, holds deposits, transfers commissions or contacts customers.
 * Requires independent partner terms, consent and verified completion/settlement.
 */
const STATES=new Set(['abandoned','initiated','paid','completed','refunded','disputed','canceled']);
const missing=(x)=>typeof x!=='string'||!x.trim()||x.length>120;
function bad(reason){throw new TypeError(reason);}
function cents(x,name){
 if(!Number.isSafeInteger(x)||x<0||x>100_000_000)bad(name+' must be a nonnegative number of EUR cents');
 return x;
}
export function evaluateAffiliateOpportunity(input={}){
 const state=input.stage;
 if(!STATES.has(state))bad('Invalid purchase stage');
 const value=cents(input.purchaseCents??0,'purchaseCents');
 const requested=cents(input.partnerApprovedCommissionCents??0,'partnerApprovedCommissionCents');
 if(requested>value)bad('Commission cannot exceed purchase amount');
 const base={currency:'EUR',purchaseStage:state,commissionPaidCents:0,transferExecuted:false,
  customerChargedCents:0,commissionRecognizedCents:0,eligibleForAutomaticPayout:false};
 if(['abandoned','initiated'].includes(state))
  return {...base,status:'NOT_EARNED_INCOMPLETE',reason:'No completed sale or payment obligation'};
 if(['refunded','disputed','canceled'].includes(state))
  return {...base,status:'REVERSED_OR_DISPUTED',reason:'Do not retain or pay disputed/reversed commissions'};
 if(state==='paid')
  return {...base,status:'AWAITING_FULFILLMENT',reason:'Paid does not mean fulfilled or partner-approved'};
 const evidence=Boolean(input.partnerAgreementActive===true&&input.termsAcceptedByAuthorizedParties===true&&
  input.trackingAuthorized===true&&input.partnerConfirmed===true&&input.refundWindowCleared===true&&
  !missing(input.partnerAgreementRef)&&!missing(input.partnerReceiptRef));
 if(!evidence||requested===0)
  return {...base,status:'BLOCKED_AGREEMENT_OR_EVIDENCE',reason:'Partner contract and verified qualifying settlement required'};
 // A partner-approved amount is a reconciliation CANDIDATE, never funds in a wallet.
 return {...base,status:'ELIGIBLE_FOR_MANUAL_RECONCILIATION',
  commissionRecognizedCents:requested,reason:'No Stripe application fee, transfer or payout was executed'};
}
function ref(value,label){
 if(typeof value!=='string'||!/^[A-Za-z0-9_.:@-]{1,120}$/.test(value))
  bad('Invalid '+label);
 return value;
}
export function createAffiliateLedger(store){
 const db=store.db;
 db.exec(`CREATE TABLE IF NOT EXISTS seva_partner_opportunities(
   owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   partner_id TEXT NOT NULL,
   conversion_ref TEXT NOT NULL,
   last_event_ref TEXT NOT NULL,
   purchase_stage TEXT NOT NULL,
   status TEXT NOT NULL,
   recognized_cents INTEGER NOT NULL DEFAULT 0,
   updated_at INTEGER NOT NULL,
   PRIMARY KEY(owner_id,partner_id,conversion_ref)
 );
 CREATE INDEX IF NOT EXISTS seva_partner_opportunities_owner ON seva_partner_opportunities(owner_id,updated_at);`);
 function record(owner,partner,conversion,event,data){
  ref(owner,'owner');ref(partner,'partner');ref(conversion,'conversion');ref(event,'event');
  const account=db.prepare('SELECT id FROM users WHERE id=?').get(owner);
  if(!account)bad('Authenticated owner missing');
  const outcome=evaluateAffiliateOpportunity(data);
  const previous=db.prepare('SELECT last_event_ref,purchase_stage,status FROM seva_partner_opportunities WHERE owner_id=? AND partner_id=? AND conversion_ref=?').get(owner,partner,conversion);
  if(previous?.last_event_ref===event)return {duplicate:true,status:previous.status,transferExecuted:false};
  if(previous?.status==='REVERSED_OR_DISPUTED'&&data.stage==='completed')
   throw new Error('Reversal is final until a separately authorized new conversion');
  db.prepare(`INSERT INTO seva_partner_opportunities VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(owner_id,partner_id,conversion_ref) DO UPDATE SET
    last_event_ref=excluded.last_event_ref,purchase_stage=excluded.purchase_stage,
    status=excluded.status,recognized_cents=excluded.recognized_cents,updated_at=excluded.updated_at`)
    .run(owner,partner,conversion,event,outcome.purchaseStage,outcome.status,outcome.commissionRecognizedCents,Date.now());
  return {...outcome,duplicate:false};
 }
 function list(owner){
  ref(owner,'owner');
  return db.prepare(`SELECT partner_id AS partnerId,conversion_ref AS conversionRef,
  purchase_stage AS purchaseStage,status,recognized_cents AS commissionCandidateCents,updated_at AS updatedAt
  FROM seva_partner_opportunities WHERE owner_id=? ORDER BY updated_at DESC LIMIT 100`).all(owner);
 }
 return {record,list};
}
