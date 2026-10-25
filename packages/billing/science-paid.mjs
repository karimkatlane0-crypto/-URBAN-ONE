import {createHmac, timingSafeEqual, randomUUID} from 'node:crypto';
export const MONTHLY_ANALYSES = 50;
export const TERMS_VERSION = '2026-10-25';
const id = value => typeof value === 'string' ? value : value?.id;
const price = line => id(line.price) || id(line.pricing?.price_details?.price);
export const isOwner = user => Boolean(user?.userId && user.email?.toLowerCase() === 'karimkatlane0@gmail.com');
export function billingReady(env) {return Boolean(env.DB && env.STRIPE_WEBHOOK_SECRET && env.SCIENCE_PAYMENT_LINK_ID && env.SCIENCE_PRICE_ID && env.SCIENCE_PAYMENT_LINK_URL && env.SCIENCE_BILLING_ENABLED === 'true');}
export function verifyStripeEvent(raw, signature, secret, now = Date.now()) {
 if (!secret || typeof signature !== 'string') throw Error('SIGNATURE_INVALID');
 const parts = signature.split(',').map(s=>s.trim().split('='));
 const timestamp = parts.find(([k])=>k==='t')?.[1];
 if (!/^\d+$/.test(timestamp || '') || Math.abs(now/1000-Number(timestamp))>300) throw Error('SIGNATURE_INVALID');
 const digest = createHmac('sha256',secret).update(timestamp+'.').update(raw).digest();
 if (!parts.some(([k,v])=>k==='v1' && /^[a-f0-9]{64}$/i.test(v||'') && timingSafeEqual(digest,Buffer.from(v,'hex')))) throw Error('SIGNATURE_INVALID');
 const event = JSON.parse(raw.toString('utf8'));
 if (!/^evt_/.test(event.id || '') || !Number.isInteger(event.created) || !event.data?.object || typeof event.type!=='string') throw Error('EVENT_INVALID');
 return event;
}
export async function applyStripeEvent(db,event,env) {
 if (event.livemode !== (env.STRIPE_LIVEMODE === 'true') || event.account && event.account !== env.STRIPE_ACCOUNT_ID) throw Error('EVENT_CONTEXT_INVALID');
 if (await db.prepare('SELECT id FROM science_billing_events WHERE id=?').bind(event.id).first()) return {duplicate:true};
 const object = event.data.object, statements=[];
 const prep = (sql,...values)=>db.prepare(sql).bind(...values);
 if (['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)) {
  if (object.payment_link===env.SCIENCE_PAYMENT_LINK_ID && object.mode==='subscription' && object.status==='complete' && object.payment_status==='paid' && /^[a-z]{3}$/.test(object.currency||'') && object.amount_total>0 && id(object.subscription) && id(object.customer)) {
   const token=object.client_reference_id;
   const intent=await prep('SELECT * FROM science_checkout_intents WHERE token=?',token||'').first();
   if (intent && (!intent.session_id || intent.session_id===object.id)) {
    statements.push(prep(`INSERT INTO science_subscriptions(id,user_id,customer_id) SELECT ?,user_id,? FROM science_checkout_intents WHERE token=? AND (session_id IS NULL OR session_id=?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id,customer_id=excluded.customer_id WHERE science_subscriptions.user_id IS NULL OR science_subscriptions.user_id=excluded.user_id`,id(object.subscription),id(object.customer),token,object.id));
    statements.push(prep('UPDATE science_checkout_intents SET session_id=?,subscription_id=? WHERE token=? AND (session_id IS NULL OR session_id=?)',object.id,id(object.subscription),token,object.id));
   }
  }
 } else if (event.type.startsWith('customer.subscription.')) {
  const items=object.items?.data || [];
  const eligible=items.length===1 && price(items[0])===env.SCIENCE_PRICE_ID && items[0].quantity===1;
  const exists=await prep('SELECT id FROM science_subscriptions WHERE id=?',object.id).first();
  if (eligible || exists) statements.push(prep(`INSERT INTO science_subscriptions(id,customer_id,status,eligible,updated_at,canceled) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET customer_id=excluded.customer_id,status=CASE WHEN excluded.updated_at>=science_subscriptions.updated_at THEN excluded.status ELSE science_subscriptions.status END,eligible=CASE WHEN excluded.updated_at>=science_subscriptions.updated_at THEN excluded.eligible ELSE science_subscriptions.eligible END,updated_at=MAX(science_subscriptions.updated_at,excluded.updated_at),canceled=MAX(science_subscriptions.canceled,excluded.canceled)`,object.id,id(object.customer),object.status||'pending',eligible?1:0,event.created,event.type==='customer.subscription.deleted'||object.status==='canceled'?1:0));
 } else if (['invoice.paid','invoice.payment_failed'].includes(event.type)) {
  const subscription=id(object.parent?.subscription_details?.subscription)||id(object.subscription);
  const lines=object.lines?.data||[];
  const line=lines.find(l=>price(l)===env.SCIENCE_PRICE_ID && l.quantity===1);
  if (subscription && line && /^[a-z]{3}$/.test(object.currency||'')) {
   if (event.type==='invoice.paid' && object.status==='paid' && object.amount_paid>0 && (object.amount_remaining??0)===0 && Number.isInteger(line.period?.start) && Number.isInteger(line.period?.end) && line.period.end>line.period.start) {
    statements.push(prep('INSERT OR IGNORE INTO science_paid_periods(key,subscription_id,start,end) VALUES(?,?,?,?)',subscription+':'+line.period.start,subscription,line.period.start,line.period.end));
    statements.push(prep(`INSERT INTO science_subscriptions(id,customer_id,paid_start,paid_through) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET paid_start=CASE WHEN excluded.paid_through>=science_subscriptions.paid_through THEN excluded.paid_start ELSE science_subscriptions.paid_start END,paid_through=MAX(science_subscriptions.paid_through,excluded.paid_through)`,subscription,id(object.customer),line.period.start,line.period.end));
   } else if(event.type==='invoice.payment_failed') statements.push(prep(`UPDATE science_subscriptions SET status=CASE WHEN paid_through<=? AND updated_at<=? THEN 'past_due' ELSE status END WHERE id=?`,event.created,event.created,subscription));
  }
 }
 statements.push(prep('INSERT OR IGNORE INTO science_billing_events(id,type,created_at) VALUES(?,?,?)',event.id,event.type,event.created));
 await db.batch(statements);
 return {received:true};
}
export async function getEntitlement(db,user,now=Date.now()) {
 if (!user?.userId) return {state:'signed_out',allowed:false};
 if (isOwner(user)) return {state:'owner',allowed:true};
 if (!db) return {state:'unavailable',allowed:false};
 const seconds=Math.floor(now/1000);
 const sub=await db.prepare(`SELECT s.id,s.user_id,p.start AS paid_start,p.end AS paid_through FROM science_subscriptions s JOIN science_paid_periods p ON p.subscription_id=s.id WHERE s.user_id=? AND s.eligible=1 AND s.status='active' AND s.canceled=0 AND p.start<=? AND p.end>? ORDER BY p.end DESC LIMIT 1`).bind(user.userId,seconds,seconds).first();
 if (!sub) return {state:'subscription_required',allowed:false};
 const key=user.userId+':'+sub.paid_start;
 const quota=await db.prepare('SELECT used FROM science_usage WHERE key=?').bind(key).first();
 return {state:'active',allowed:true,periodEnd:sub.paid_through,remaining:Math.max(0,MONTHLY_ANALYSES-(quota?.used||0)),usageKey:key};
}
export async function reserveAnalysis(db,key) {
 return db.prepare(`INSERT INTO science_usage(key,used) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET used=used+1 WHERE used<? RETURNING used`).bind(key,MONTHLY_ANALYSES).first();
}
export async function releaseAnalysis(db,key) {await db.prepare('UPDATE science_usage SET used=MAX(0,used-1) WHERE key=?').bind(key).run();}
export async function beginCheckout(db,user,env,termsAccepted) {
 if (!user?.userId) return {status:401,error:'SIGNIN_REQUIRED'};
 if (!billingReady(env)) return {status:503,error:'BILLING_NOT_READY'};
 if (termsAccepted !== TERMS_VERSION) return {status:400,error:'TERMS_REQUIRED'};
 const entitlement=await getEntitlement(db,user);
 if(entitlement.allowed) return {status:409,error:'ALREADY_ACTIVE'};
 const now=Math.floor(Date.now()/1000);
 const count=await db.prepare('SELECT COUNT(*) AS count FROM science_checkout_intents WHERE user_id=? AND created_at>?').bind(user.userId,now-3600).first();
 if(count.count>=5)return {status:429,error:'CHECKOUT_RATE_LIMITED'};
 const token=randomUUID().replaceAll('-','');
 await db.prepare('INSERT INTO science_checkout_intents(token,user_id,created_at,expires_at) VALUES(?,?,?,?)').bind(token,user.userId,now,now+86400).run();
 const url=new URL(env.SCIENCE_PAYMENT_LINK_URL);
 if(url.origin!=='https://buy.stripe.com')throw Error('CHECKOUT_URL_INVALID');
 url.searchParams.set('client_reference_id',token);
 return {status:200,url:url.href};
}
