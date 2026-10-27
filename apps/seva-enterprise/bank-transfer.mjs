// SEVA voluntary SEPA bank-transfer orders. No banking API, no direct debit, no Stripe.
// NEVER activate access for a client's screenshot, stated CRO/TRN or return redirect.
// Activation only after an authorized operator independently verifies cleared funds.
import {randomUUID, createHash} from 'node:crypto';

export const BANK_PLAN_AMOUNTS=Object.freeze({
 enterprise_monthly:{amountCents:5000,months:1},
 buyer_annual:{amountCents:5000,months:12},
 ecommerce_annual:{amountCents:50000,months:12}
});
const bankError=(message,status=400)=>Object.assign(Error(message),{status});
const now=()=>Math.floor(Date.now()/1000);
const ibanClean=(raw)=>typeof raw==='string'?raw.replace(/\s/g,'').toUpperCase():'';
export function validateItalianIban(value){
 const iban=ibanClean(value);
 if(!/^IT[0-9]{2}[A-Z][0-9]{22}$/.test(iban))return false;
 const shifted=iban.slice(4)+iban.slice(0,4);
 let rem=0;
 for(const char of shifted){
  const digits=char>='A'&&char<='Z'?String(char.charCodeAt(0)-55):char;
  for(const c of digits)rem=(rem*10+Number(c))%97;
 }
 return rem===1;
}
export function bankConfig(env=process.env){
 const iban=ibanClean(env.SEVA_BANK_IBAN);
 const beneficiary=typeof env.SEVA_BANK_BENEFICIARY==='string'?env.SEVA_BANK_BENEFICIARY.trim():'';
 const eligible=validateItalianIban(iban)&&beneficiary.length>=3&&beneficiary.length<=140&&
  !/[\u0000-\u001f]/.test(beneficiary);
 const enabled=env.SEVA_BANK_ORDERS_ENABLED==='true'&&env.SEVA_BANK_LIVE_APPROVED==='true'&&eligible;
 return {enabled,iban:enabled?iban:null,beneficiary:enabled?beneficiary:null,
  status:enabled?'MANUAL_TRANSFER_AVAILABLE':'NOT_CONFIGURED_OR_APPROVED',
  automaticDebit:false,bankApiConnected:false,automaticAccess:false};
}
export function installBankOrders(db){
 db.exec("CREATE TABLE IF NOT EXISTS seva_bank_orders("+
  "id TEXT PRIMARY KEY,"+
  "user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,"+
  "plan TEXT NOT NULL CHECK(plan IN ('enterprise_monthly','buyer_annual','ecommerce_annual')),"+
  "amount_cents INTEGER NOT NULL CHECK(amount_cents>0),"+
  "reference TEXT NOT NULL UNIQUE,"+
  "status TEXT NOT NULL CHECK(status IN ('pending','credited','cancelled')),"+
  "created INTEGER NOT NULL,confirmed INTEGER,"+
  "access_until INTEGER,"+
  "bank_transaction_hash TEXT UNIQUE,"+
  "operator TEXT"+
 ");CREATE INDEX IF NOT EXISTS seva_bank_orders_owner ON seva_bank_orders(user_id,created);");
}
export function createBankOrders(store){
 const db=store.db;installBankOrders(db);
 function accessiblePlans(owner){
  return db.prepare("SELECT plan,MAX(access_until) AS until FROM seva_bank_orders WHERE user_id=? AND status='credited' AND access_until>? GROUP BY plan")
   .all(owner,now()).map(x=>({plan:x.plan,validUntil:x.until}));
 }
 function list(owner){
  return db.prepare("SELECT id,plan,amount_cents AS amountCents,reference,status,created,confirmed,access_until AS accessUntil FROM seva_bank_orders WHERE user_id=? ORDER BY created DESC LIMIT 30").all(owner);
 }
 function place(owner,plan,ack,env=process.env){
  const config=bankConfig(env);
  if(!config.enabled)throw bankError('Bank transfer orders unavailable pending verified merchant setup',503);
  if(ack!==true)throw bankError('Customer must explicitly accept the sale terms and SEPA manual payment instructions');
  const product=BANK_PLAN_AMOUNTS[plan];
  if(!product)throw bankError('Unknown SEVA bank transfer plan');
  if(!db.prepare('SELECT id FROM users WHERE id=?').get(owner))throw bankError('Authenticated customer required',401);
  const id=randomUUID();
  const reference='SEVA-'+id.slice(0,8).toUpperCase()+'-'+createHash('sha256').update(id).digest('hex').slice(0,6).toUpperCase();
  db.prepare("INSERT INTO seva_bank_orders(id,user_id,plan,amount_cents,reference,status,created) VALUES(?,?,?,?,?,'pending',?)")
   .run(id,owner,plan,product.amountCents,reference,now());
  store.audit(owner,'bank_order_created',id);
  return {id,plan,amountCents:product.amountCents,currency:'EUR',reference,status:'pending',
   beneficiary:config.beneficiary,iban:config.iban,bankTransferRequired:true,
   accessGranted:false,automaticDebit:false,
   notice:'Bonifico esterno volontario: nessuna somma addebitata da SEVA. Accesso solo dopo accredito bancario effettivo, verificato dal gestore.'};
 }
 // Called only by private, direct operator action AFTER reading provider/bank account
 // statements. Do not expose as an unauthenticated HTTP endpoint.
 function reconcile({orderId,amountCents,bankTransactionReference,operator,statementVerified}){
  if(statementVerified!==true)throw bankError('Actual bank credit must be independently verified');
  if(typeof operator!=='string'||operator.trim().length<3||operator.length>100)throw bankError('Operator required');
  if(typeof bankTransactionReference!=='string'||bankTransactionReference.trim().length<8||bankTransactionReference.length>120)
   throw bankError('Unique bank statement reference required');
  if(!Number.isInteger(amountCents)||amountCents<=0)throw bankError('Credited amount missing');
  const fingerprint=createHash('sha256').update(bankTransactionReference.trim()).digest('hex');
  db.exec('BEGIN IMMEDIATE');
  try{
   const order=db.prepare('SELECT * FROM seva_bank_orders WHERE id=?').get(orderId);
   if(!order||order.status!=='pending')throw bankError('Order missing or already reconciled',409);
   if(order.amount_cents!==amountCents)throw bankError('Bank credit amount mismatch',409);
   if(db.prepare('SELECT id FROM seva_bank_orders WHERE bank_transaction_hash=?').get(fingerprint))
    throw bankError('Bank transaction was already used',409);
   const months=BANK_PLAN_AMOUNTS[order.plan].months;
   const prev=db.prepare("SELECT MAX(access_until) AS until FROM seva_bank_orders WHERE user_id=? AND plan=? AND status='credited'").get(order.user_id,order.plan)?.until||0;
   const base=new Date(Math.max(now(),prev)*1000);
   base.setUTCMonth(base.getUTCMonth()+months);
   const accessUntil=Math.floor(base.getTime()/1000);
   db.prepare("UPDATE seva_bank_orders SET status='credited',confirmed=?,access_until=?,bank_transaction_hash=?,operator=? WHERE id=?")
    .run(now(),accessUntil,fingerprint,operator.trim(),orderId);
   store.audit(order.user_id,'bank_credit_confirmed',orderId);
   db.exec('COMMIT');
   return {orderId,status:'credited',validUntil:accessUntil,plan:order.plan};
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 return {place,list,accessiblePlans,reconcile};
}
