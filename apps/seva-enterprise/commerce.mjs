/** SEVA Enterprise commerce: authenticated account profiles, student review and quote-first cart.
 * No charges, discounts, refunds or refunds/payouts are executed from this module.
 */
import {randomUUID, createHash} from 'node:crypto';

const skuSpecs=Object.freeze({
  'goal-free': {priceCents:0,kind:'free',maximum:1},
  'enterprise-monthly':{priceCents:5000,kind:'subscription',maximum:1},
  'student-monthly':{priceCents:null,kind:'student',maximum:1},
  'goal-once':{priceCents:null,kind:'quote',maximum:1},
  'goal-success':{priceCents:null,kind:'quote',maximum:1},
  'marketing-consented':{priceCents:null,kind:'marketing',maximum:1},
  'time-service':{priceCents:null,kind:'quote',maximum:1}
});
export const commerceCatalog = Object.freeze(Object.entries(skuSpecs).map(([sku,entry])=>Object.freeze({sku,...entry,currency:'EUR',checkoutEnabled:false})));
function failure(message,status=400){return Object.assign(new Error(message),{status});}
function str(s,max,required=false){if(typeof s!=='string')throw failure('Invalid text field');const v=s.trim();if(v.length>max||(required&&!v))throw failure('Invalid field length');return v;}
function bool(v){return v===true;}
function itemsFrom(input){
 if(!Array.isArray(input)||input.length>8)throw failure('Cart must contain no more than 8 products');
 const seen=new Set();return input.map(item=>{
   if(!item||typeof item!=='object'||!Object.hasOwn(skuSpecs,item.sku)||seen.has(item.sku))throw failure('Invalid or duplicate cart SKU');
   const q=item.quantity??1;if(q!==1)throw failure('Each catalog item permits one seat');
   seen.add(item.sku);return {sku:item.sku,quantity:1};
 });
}
export function summarizeCart(items,studentVerified=false){
 const products=itemsFrom(items);let committedCents=0,needsQuote=false,studentPending=false;
 for(const item of products){const spec=skuSpecs[item.sku];if(spec.kind==='student'){studentPending=!studentVerified;needsQuote=true;}else if(spec.priceCents===null)needsQuote=true;else committedCents+=spec.priceCents;}
 // Never represent a subscription and quote services as a single payable total.
 return {items:products,currency:'EUR',knownMonthlyCents:committedCents,
  purchaseDueNowCents:null,requiresHumanQuote:needsQuote,
  studentVerificationRequired:studentPending,checkoutEnabled:false,
  pricingNotice:'Illustrative catalog only. Final tax, payment and fulfillment must be separately confirmed.'};
}
export function createCommerce(store){
 const db=store.db;
 db.exec(`CREATE TABLE IF NOT EXISTS commerce_profiles(
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 full_name TEXT NOT NULL DEFAULT '',country TEXT NOT NULL DEFAULT '',city TEXT NOT NULL DEFAULT '',
 address TEXT NOT NULL DEFAULT '',postal_code TEXT NOT NULL DEFAULT '',
 marketing_consent INTEGER NOT NULL DEFAULT 0,updated INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS commerce_students(
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 institution TEXT NOT NULL,academic_email TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected','expired')),
 reviewer TEXT,reviewed INTEGER,submitted INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS commerce_carts(
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 items_json TEXT NOT NULL,updated INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS commerce_quote_requests(
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 snapshot_json TEXT NOT NULL,sha256 TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS commerce_quotes_owner ON commerce_quote_requests(user_id,created);`);
 const now=()=>Math.floor(Date.now()/1000);
 function profile(user){const p=db.prepare('SELECT full_name AS fullName,country,city,address,postal_code AS postalCode,marketing_consent AS marketingConsent,updated FROM commerce_profiles WHERE user_id=?').get(user);return p?{...p,marketingConsent:p.marketingConsent===1}:{fullName:'',country:'',city:'',address:'',postalCode:'',marketingConsent:false};}
 function saveProfile(user,input){
  if(!input||typeof input!=='object')throw failure('Invalid profile');
  // Explicit field allowlist — never accept/return government ID, date of birth, payment card or password.
  const name=str(input.fullName??'',120);const country=str(input.country??'',2).toUpperCase();
  if(country&&!/^[A-Z]{2}$/.test(country))throw failure('Country must be ISO 3166-1 alpha-2');
  const city=str(input.city??'',100),address=str(input.address??'',200),postcode=str(input.postalCode??'',24);
  const marketingConsent=bool(input.marketingConsent)?1:0;
  db.prepare(`INSERT INTO commerce_profiles VALUES(?,?,?,?,?,?,?,?)
   ON CONFLICT(user_id) DO UPDATE SET full_name=excluded.full_name,country=excluded.country,
   city=excluded.city,address=excluded.address,postal_code=excluded.postal_code,
   marketing_consent=excluded.marketing_consent,updated=excluded.updated`).run(user,name,country,city,address,postcode,marketingConsent,now());
  store.audit(user,'commerce_profile_updated',marketingConsent?'marketing_opt_in':'marketing_opt_out');
  return profile(user);
 }
 function deleteProfile(user){db.prepare('DELETE FROM commerce_profiles WHERE user_id=?').run(user);store.audit(user,'commerce_profile_deleted');return {deleted:true};}
 function student(user){const s=db.prepare('SELECT institution,academic_email AS academicEmail,status,submitted,reviewed FROM commerce_students WHERE user_id=?').get(user);return s||{status:'not_applied',institution:'',academicEmail:''};}
 function applyStudent(user,data){
  if(!data||!bool(data.confirmAdultStudent))throw failure('Student enrollment requires adult confirmation and request for verification');
  const institute=str(data.institution,120,true);const email=str(data.academicEmail??'',254);
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw failure('Invalid academic email');
  const prev=student(user);if(prev.status==='verified')throw failure('Verified application cannot be replaced',409);
  db.prepare(`INSERT INTO commerce_students(user_id,institution,academic_email,status,submitted)
     VALUES(?,?,?,'pending',?)
     ON CONFLICT(user_id) DO UPDATE SET institution=excluded.institution,academic_email=excluded.academic_email,
     status='pending',submitted=excluded.submitted,reviewer=NULL,reviewed=NULL`).run(user,institute,email,now());
  store.audit(user,'student_verification_requested');return {status:'pending',verified:false,discountEnabled:false};
 }
 function getCart(user){const row=db.prepare('SELECT items_json FROM commerce_carts WHERE user_id=?').get(user);const items=row?JSON.parse(row.items_json):[];return summarizeCart(items,student(user).status==='verified');}
 function saveCart(user,data){
  const items=itemsFrom(data?.items);
  // Mutually exclusive Stripe recurring offers; no mixed subscriptions that cannot be represented by a verified checkout.
  if(items.filter(i=>['enterprise-monthly','student-monthly'].includes(i.sku)).length>1)throw failure('Choose one subscription offer');
  db.prepare('INSERT INTO commerce_carts VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET items_json=excluded.items_json,updated=excluded.updated').run(user,JSON.stringify(items),now());
  store.audit(user,'cart_saved',String(items.length));return getCart(user);
 }
 function requestQuote(user,input){
  const cart=getCart(user);if(!cart.items.length)throw failure('Cart is empty');
  const p=profile(user);if(!p.fullName||!p.country)throw failure('Name and country required for quote');
  if(cart.items.some(i=>i.sku==='marketing-consented')&&!bool(input?.marketingBudgetConsent))throw failure('Marketing budget requires explicit consent');
  const note=str(input?.goalDescription??'',2000);const raw=JSON.stringify({cart:cart.items,profile:{fullName:p.fullName,country:p.country},
    goalDescription:note,marketingBudgetConsent:bool(input?.marketingBudgetConsent),studentStatus:student(user).status});
  const hash=createHash('sha256').update(raw).digest('hex'),id=randomUUID();
  db.prepare('INSERT INTO commerce_quote_requests VALUES(?,?,?,?,?,?)').run(id,user,raw,hash,'pending',now());
  store.audit(user,'commerce_quote_requested',id);
  return {id,status:'pending',snapshotSha256:hash,paymentExecuted:false,customerAccessGranted:false};
 }
 function quoteRequests(user){return db.prepare('SELECT id,sha256 AS snapshotSha256,status,created FROM commerce_quote_requests WHERE user_id=? ORDER BY created DESC LIMIT 100').all(user);}
 return {profile,saveProfile,deleteProfile,student,applyStudent,getCart,saveCart,requestQuote,quoteRequests,catalog:()=>commerceCatalog};
}
