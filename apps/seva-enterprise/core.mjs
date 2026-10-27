import { createHmac, createHash, timingSafeEqual, randomUUID, randomBytes, scryptSync } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import {createBankOrders} from './bank-transfer.mjs';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {installStudentStore} from './student-store.mjs';
import {installDBRelay} from './dbrelay.mjs';
import {validateIntent} from './lastre.mjs';

export const priceId = 'price_1UUWSlRzfcoKq6cnfB1elOxQ';
export const productId = 'prod_VVXXVGhdpIodLC';
export function validateGoal(input) {
  const title=String(input?.title||'').trim();
  const desc=String(input?.description||'').trim();
  const criteria=String(input?.criteria||'').trim();
  const evidence=String(input?.evidence||'').trim();
  const status=String(input?.status||'todo');
  if(!title || title.length>160 || desc.length>3000 || criteria.length>1200 || evidence.length>1200 || !['todo','doing','blocked','done'].includes(status)) throw Error('Invalid goal');
  return {title,description:desc,criteria,evidence,status};
}
export function verifyStripeSignature(raw, header, secret, now=Math.floor(Date.now()/1000)) {
  if(!secret || !header) return false;
  const fields=Object.fromEntries(header.split(',').map(x=>x.trim().split('=').slice(0,2)));
  const ts=Number(fields.t);
  if(!Number.isFinite(ts)||Math.abs(now-ts)>300) return false;
  const values=header.match(/(?:^|,)v1=([a-f0-9]{64})(?=,|$)/g)||[];
  return values.some(part=>{
    const hex=part.split('v1=')[1];
    const expected=createHmac('sha256',secret).update(`${ts}.${raw}`).digest('hex');
    return timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(hex,'hex'));
  });
}
export function signedStripeHeader(raw, secret, ts=Math.floor(Date.now()/1000)) {
 return `t=${ts},v1=${createHmac('sha256',secret).update(`${ts}.${raw}`).digest('hex')}`;
}
export function hashPassword(password, salt=randomBytes(16).toString('hex')){
 if(typeof password!=='string'||password.length<12||password.length>128) throw Error('Password must be 12–128 characters');
 return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}
export function matchPassword(pwd, stored){
 try {const [mode,salt,hex]=stored.split(':'); if(mode!=='scrypt')return false;
 const a=scryptSync(pwd,salt,64),b=Buffer.from(hex,'hex');return a.length===b.length&&timingSafeEqual(a,b);}catch{return false;}
}
export function createStore(filename=':memory:'){
 if(filename!==':memory:') mkdirSync(dirname(filename),{recursive:true});
 const db=new DatabaseSync(filename);db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
 db.exec(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS goals(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,parent_id TEXT REFERENCES goals(id) ON DELETE CASCADE,title TEXT NOT NULL,description TEXT,criteria TEXT,evidence TEXT,status TEXT NOT NULL,updated INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS goal_user ON goals(user_id);
 CREATE TABLE IF NOT EXISTS checkout_bindings(session_id TEXT PRIMARY KEY REFERENCES checkout_sessions(session_id) ON DELETE CASCADE,user_id TEXT NOT NULL REFERENCES users(id),plan TEXT NOT NULL CHECK(plan IN ('enterprise_monthly','buyer_annual','ecommerce_annual')),price_id TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS plan_entitlements(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,plan TEXT NOT NULL CHECK(plan IN ('enterprise_monthly','buyer_annual','ecommerce_annual')),customer TEXT,subscription TEXT UNIQUE,active INTEGER NOT NULL DEFAULT 0,updated INTEGER NOT NULL,PRIMARY KEY(user_id,plan));
 CREATE INDEX IF NOT EXISTS plan_entitlements_owner ON plan_entitlements(user_id,active);
 CREATE TABLE IF NOT EXISTS entitlements(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,customer TEXT,subscription TEXT,active INTEGER NOT NULL DEFAULT 0,updated INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS checkout_sessions(session_id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS webhook_events(event_id TEXT PRIMARY KEY,kind TEXT NOT NULL,processed INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS rewards(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),source_event TEXT NOT NULL UNIQUE,kind TEXT NOT NULL,amount_cents INTEGER NOT NULL,approval TEXT NOT NULL DEFAULT 'pending',created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,user_id TEXT,action TEXT NOT NULL,detail TEXT,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS campaign_drafts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,quote_json TEXT NOT NULL,terms_json TEXT NOT NULL,snapshot_sha256 TEXT NOT NULL,status TEXT NOT NULL,created INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS campaign_owner ON campaign_drafts(user_id,created);`);
 db.exec("CREATE TABLE IF NOT EXISTS lastre_intents(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,category TEXT NOT NULL CHECK(category IN ('buy','rent','lease','credit','other')),description TEXT NOT NULL,budget_cents INTEGER NOT NULL CHECK(budget_cents>=0),consent_at INTEGER NOT NULL,created INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS lastre_owner ON lastre_intents(user_id,created);");
 installDBRelay(db);
 installStudentStore(db);
 const at=()=>Math.floor(Date.now()/1000), uid=()=>randomUUID();
 const audit=(user,action,detail='')=>db.prepare('INSERT INTO audit VALUES (?,?,?,?,?)').run(uid(),user,action,String(detail).slice(0,500),at());
 function register(email,password){email=String(email).trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254)throw Error('Invalid email');
 const id=uid();db.prepare('INSERT INTO users VALUES (?,?,?,?)').run(id,email,hashPassword(password),at());audit(id,'user_registered');return {id,email};}
 function login(email,password){const u=db.prepare('SELECT * FROM users WHERE email=?').get(String(email).toLowerCase().trim());if(!u||!matchPassword(String(password),u.password))throw Error('Invalid credentials');return {id:u.id,email:u.email};}
 function newSession(id){const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(token,id,at()+604800);return token;}
 function fromSession(token){if(!token)return null;return db.prepare('SELECT u.id,u.email FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=? AND s.expires>?').get(token,at())||null;}
 function listGoals(user){return db.prepare('SELECT id,parent_id,title,description,criteria,evidence,status,updated FROM goals WHERE user_id=? ORDER BY updated DESC').all(user);}
 function saveGoal(user,body,id){const g=validateGoal(body);const existing=id?db.prepare('SELECT * FROM goals WHERE id=? AND user_id=?').get(id,user):null;
 if(id&&!existing)throw Error('Goal not found');
 const parent=body?.parent_id===undefined?(existing?.parent_id||null):(body.parent_id||null);
 if(parent){let current=parent,level=1,seen=new Set([id]);while(current){if(seen.has(current))throw Error('Goal cycle');seen.add(current);const p=db.prepare('SELECT id,parent_id FROM goals WHERE id=? AND user_id=?').get(current,user);if(!p)throw Error('Parent unavailable');level++;if(level>4)throw Error('Maximum 3 subgoal levels');current=p.parent_id;}}
 const gid=id||uid();
 const map=new Map(listGoals(user).map(x=>[x.id,x]));map.set(gid,{id:gid,parent_id:parent});
 for(const item of map.values()) {let p=item,depth=0,seen=new Set();while(p.parent_id){if(seen.has(p.id))throw Error('Goal cycle');seen.add(p.id);depth++;if(depth>3)throw Error('Maximum 3 subgoal levels');p=map.get(p.parent_id);if(!p)throw Error('Missing parent');}}
 if(existing)db.prepare('UPDATE goals SET parent_id=?,title=?,description=?,criteria=?,evidence=?,status=?,updated=? WHERE id=?').run(parent,g.title,g.description,g.criteria,g.evidence,g.status,at(),gid);
 else db.prepare('INSERT INTO goals VALUES (?,?,?,?,?,?,?,?,?)').run(gid,user,parent,g.title,g.description,g.criteria,g.evidence,g.status,at());
 audit(user,id?'goal_updated':'goal_created',gid);return gid;}
 function deleteGoal(user,id){const result=db.prepare('DELETE FROM goals WHERE id=? AND user_id=?').run(id,user);if(!result.changes)throw Error('Goal not found');audit(user,'goal_deleted',id);}
 let bank;
 function activePlans(user){const stripe=db.prepare('SELECT plan FROM plan_entitlements WHERE user_id=? AND active=1 ORDER BY plan').all(user).map(x=>x.plan);return [...new Set([...stripe,...(bank?.accessiblePlans(user)||[]).map(x=>x.plan)])];}
 function hasPlanAccess(user,plan){return db.prepare('SELECT active FROM plan_entitlements WHERE user_id=? AND plan=?').get(user,plan)?.active===1||Boolean(bank?.accessiblePlans(user).some(x=>x.plan===plan));}
 function hasAccess(user){return db.prepare('SELECT active FROM entitlements WHERE user_id=?').get(user)?.active===1||activePlans(user).length>0;}
 function recordCheckout(user,session,plan=null,priceId=null){
  if(plan!==null&&(!['enterprise_monthly','buyer_annual','ecommerce_annual'].includes(plan)||!/^price_[a-zA-Z0-9]+$/.test(priceId||'')))throw Error('Checkout plan/price binding invalid');
  db.exec('BEGIN IMMEDIATE');
  try{
   const found=db.prepare('SELECT user_id FROM checkout_sessions WHERE session_id=?').get(session);
   if(found&&found.user_id!==user)throw Error('Checkout session already belongs to another owner');
   db.prepare('INSERT OR IGNORE INTO checkout_sessions VALUES (?,?,?)').run(session,user,at());
   if(plan!==null){
    const binding=db.prepare('SELECT user_id,plan,price_id FROM checkout_bindings WHERE session_id=?').get(session);
    if(binding&&(binding.user_id!==user||binding.plan!==plan||binding.price_id!==priceId))throw Error('Checkout binding mismatch');
    db.prepare('INSERT OR IGNORE INTO checkout_bindings VALUES (?,?,?,?)').run(session,user,plan,priceId);
   }
   db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
  audit(user,'checkout_created',session);
 }
 function getCheckoutOwner(session){return db.prepare('SELECT user_id FROM checkout_sessions WHERE session_id=?').get(session)?.user_id;}
 function processStripeEvent(event){
  if(!event?.id||typeof event.id!=='string'||!event?.type)throw Error('Bad webhook event');
  if(db.prepare('SELECT 1 FROM webhook_events WHERE event_id=?').get(event.id))return 'duplicate';
  const obj=event.data?.object||{};
  const checkoutSuccess=event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded';
  // Stripe invoice schema varies across API versions. New invoices attach the
  // subscription under parent.subscription_details rather than subscription.
  const invoiceSubscription=obj.subscription||obj.parent?.subscription_details?.subscription||null;
  let userId=null,active=null,subscription=null,customer=null,scopedPlan=null;
  const binding=checkoutSuccess?db.prepare('SELECT * FROM checkout_bindings WHERE session_id=?').get(obj.id):null;
  if(checkoutSuccess&&obj.mode==='subscription'&&obj.payment_status==='paid'){
    userId=getCheckoutOwner(obj.id);
    if(!userId||(obj.client_reference_id&&userId!==obj.client_reference_id))
      throw Error('Checkout owner mismatch');
    if(!obj.subscription||typeof obj.subscription!=='string')
      throw Error('Paid checkout requires subscription ID');
    if(binding){
      // Stripe signs the Checkout event. Metadata must match the exact locally
      // validated plan/price binding; never infer a plan from amount or client input.
      if(binding.user_id!==userId||obj.client_reference_id!==userId||
         obj.metadata?.seva_user_id!==userId||obj.metadata?.seva_plan!==binding.plan||
         obj.metadata?.seva_price_id!==binding.price_id)
        throw Error('Checkout plan/price/owner mismatch');
      scopedPlan=binding.plan;
    }
    subscription=obj.subscription;customer=obj.customer||null;active=true;
  }else if([
    'invoice.paid','invoice.payment_failed',
    'customer.subscription.deleted','customer.subscription.updated'
  ].includes(event.type)){
    subscription=event.type.startsWith('customer.subscription.')?obj.id:invoiceSubscription;
    if(subscription){
      const entitlement=db.prepare('SELECT user_id,plan,active FROM plan_entitlements WHERE subscription=?').get(subscription)||
        db.prepare('SELECT user_id,active FROM entitlements WHERE subscription=?').get(subscription);
      if(entitlement){
        userId=entitlement.user_id;scopedPlan=entitlement.plan||null;customer=obj.customer||null;
        if(event.type==='invoice.paid')active=true;
        if(event.type==='invoice.payment_failed'||event.type==='customer.subscription.deleted')active=false;
        // An "active" subscription status does NOT prove the invoice was paid.
        // Reactivation is granted only by invoice.paid or a paid Checkout.
        if(event.type==='customer.subscription.updated'&&
          ['canceled','unpaid','paused','incomplete_expired','past_due'].includes(obj.status))active=false;
      }
    }
  }
  // Receipt and entitlement MUST commit together. Replays are idempotent.
  db.exec('BEGIN IMMEDIATE');
  try{
    if(userId!==null&&active!==null){
      if(checkoutSuccess&&scopedPlan){
        const other=db.prepare('SELECT user_id,plan FROM plan_entitlements WHERE subscription=?').get(subscription);
        if(other&&(other.user_id!==userId||other.plan!==scopedPlan))throw Error('Subscription belongs to another account/plan');
        db.prepare('INSERT INTO plan_entitlements(user_id,plan,customer,subscription,active,updated) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,plan) DO UPDATE SET customer=COALESCE(excluded.customer,plan_entitlements.customer),subscription=excluded.subscription,active=excluded.active,updated=excluded.updated').run(userId,scopedPlan,customer,subscription,Number(active),at());
      }else if(scopedPlan){
        // Update only this exact subscription: delayed cancellation cannot revoke
        // a different plan or a later subscription for the same plan.
        db.prepare('UPDATE plan_entitlements SET customer=COALESCE(?,customer),active=?,updated=? WHERE user_id=? AND plan=? AND subscription=?').run(customer,Number(active),at(),userId,scopedPlan,subscription);
      }else if(checkoutSuccess){
        // Legacy synthetic fixtures remain compatible. New SEVA Checkouts MUST
        // pass plan/price binding and use the scoped path above.
        db.prepare('INSERT INTO entitlements(user_id,customer,subscription,active,updated) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET customer=COALESCE(excluded.customer,entitlements.customer),subscription=excluded.subscription,active=excluded.active,updated=excluded.updated').run(userId,customer,subscription,Number(active),at());
      }else{
        db.prepare('UPDATE entitlements SET customer=COALESCE(?,customer),active=?,updated=? WHERE user_id=? AND subscription=?').run(customer,Number(active),at(),userId,subscription);
      }
      audit(userId,active?'access_enabled':'access_disabled',event.type);
    }
    db.prepare('INSERT INTO webhook_events VALUES(?,?,?)').run(event.id,event.type,at());
    db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
  return userId&&active!==null?(active?'enabled':'disabled'):'recorded';
 }
 function saveCampaign(user,quote,terms={}){
   if(!Number.isInteger(terms.quorumTarget)||terms.quorumTarget<1||terms.quorumTarget>1000000)throw Error('Invalid quorum target');
   if(typeof terms.deadlineIso!=='string'||!/^\d{4}-\d\d-\d\dT/.test(terms.deadlineIso)||!/(Z|[+-]\d\d:\d\d)$/.test(terms.deadlineIso)||!Number.isFinite(Date.parse(terms.deadlineIso)))throw Error('Invalid deadline with timezone');
   if(quote.marketingCents>0&&terms.marketingConsentConfirmed!==true)throw Error('Explicit marketing consent required');
   const frozenTerms={quorumTarget:terms.quorumTarget,deadlineIso:terms.deadlineIso,marketingConsentConfirmed:terms.marketingConsentConfirmed===true};
   const payload=JSON.stringify({quote,terms:frozenTerms});const hash=createHash('sha256').update(payload).digest('hex');const id=uid();
   db.prepare('INSERT INTO campaign_drafts VALUES(?,?,?,?,?,?,?)').run(id,user,JSON.stringify(quote),JSON.stringify(frozenTerms),hash,'draft',at());
   audit(user,'campaign_draft_created',id);return id;
 }
 function listCampaigns(user){return db.prepare('SELECT id,quote_json,terms_json,snapshot_sha256,status,created FROM campaign_drafts WHERE user_id=? ORDER BY created DESC LIMIT 100').all(user).map(x=>({id:x.id,quote:JSON.parse(x.quote_json),terms:JSON.parse(x.terms_json),snapshotSha256:x.snapshot_sha256,status:x.status,created:x.created}));}
 function createIntent(user,input){
  const data=validateIntent(input),id=uid();
  db.prepare('INSERT INTO lastre_intents VALUES(?,?,?,?,?,?,?)').run(id,user,data.category,data.description,data.budgetCents,at(),at());
  audit(user,'lastre_intent_created',id);return id;
 }
 function listIntents(user){return db.prepare('SELECT id,category,description,budget_cents AS budgetCents,consent_at AS consentAt,created FROM lastre_intents WHERE user_id=? ORDER BY created DESC LIMIT 100').all(user);}
 function deleteIntent(user,id){
  if(!/^[0-9a-f-]{36}$/.test(String(id)))throw Object.assign(Error('Invalid intent ID'),{status:400});
  const changed=db.prepare('DELETE FROM lastre_intents WHERE id=? AND user_id=?').run(id,user).changes;
  if(changed)audit(user,'lastre_intent_deleted',id);
  return changed>0;
 }
 function rewards(user){return db.prepare('SELECT id,kind,amount_cents,approval,created FROM rewards WHERE user_id=? ORDER BY created DESC').all(user);}
 function recordReward(user,sourceEvent,kind,amount){if(!Number.isInteger(amount)||amount<0||amount>100000000)throw Error('Invalid reward amount');
 // Reward records are pending only; transfers require separate authorized program and verified payout provider.
 db.prepare('INSERT OR IGNORE INTO rewards VALUES(?,?,?,?,?,?,?)').run(uid(),user,sourceEvent,String(kind),amount,'pending',at());audit(user,'reward_pending',sourceEvent);}
 const service={db,persistent:filename!==':memory:',createIntent,listIntents,deleteIntent,register,login,newSession,fromSession,listGoals,saveGoal,deleteGoal,hasAccess,hasPlanAccess,activePlans,recordCheckout,getCheckoutOwner,processStripeEvent,rewards,recordReward,audit,saveCampaign,listCampaigns};
 bank=createBankOrders(service);service.bank=bank;return service;
}