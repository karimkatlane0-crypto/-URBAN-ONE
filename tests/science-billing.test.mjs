import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import {verifyStripeEvent,applyStripeEvent,getEntitlement,reserveAnalysis,releaseAnalysis,beginCheckout,billingReady,TERMS_VERSION} from '../packages/billing/science-paid.mjs';
const now=Math.floor(Date.now()/1000),user={userId:'user-buyer',email:'buyer@example.invalid'};
const runtime={STRIPE_LIVEMODE:'true',STRIPE_ACCOUNT_ID:'acct_test',SCIENCE_PRICE_ID:'price_science',SCIENCE_PAYMENT_LINK_ID:'plink_science',SCIENCE_PAYMENT_LINK_URL:'https://buy.stripe.com/science',STRIPE_WEBHOOK_SECRET:'test-webhook-secret',SCIENCE_BILLING_ENABLED:'true'};
function database(){
 const sql=new DatabaseSync(':memory:');
 for(const name of readdirSync('db/science-migrations').filter(n=>n.endsWith('.sql')))sql.exec(readFileSync('db/science-migrations/'+name,'utf8'));
 const wrap=statement=>({bind(...values){return {statement,values,async first(){return statement.get(...values)||null},async run(){return statement.run(...values)}}}});
 return {prepare(query){return wrap(sql.prepare(query))},async batch(statements){sql.exec('BEGIN');try{for(const s of statements)s.statement.run(...s.values);sql.exec('COMMIT')}catch(e){sql.exec('ROLLBACK');throw e;}}};
}
const event=(type,object,suffix=type)=>({id:'evt_'+suffix,created:now,livemode:true,type,data:{object}});
const subscription=(overrides={})=>({id:'sub_science',customer:'cus_buyer',status:'active',items:{data:[{price:{id:'price_science'},quantity:1}]},...overrides});
const invoice=(overrides={})=>({id:'in_science',customer:'cus_buyer',parent:{subscription_details:{subscription:'sub_science'}},currency:'eur',status:'paid',amount_paid:2900,lines:{data:[{pricing:{price_details:{price:'price_science'}},quantity:1,period:{start:now-1,end:now+2600000}}]},...overrides});
const session=token=>({id:'cs_science',customer:'cus_buyer',subscription:'sub_science',mode:'subscription',status:'complete',payment_status:'paid',payment_link:'plink_science',amount_total:2900,currency:'eur',client_reference_id:token});
async function init(){const db=database();const env={...runtime,DB:db};const checkout=await beginCheckout(db,user,env,TERMS_VERSION);assert.equal(checkout.status,200);const token=new URL(checkout.url).searchParams.get('client_reference_id');return {db,env,token};}
async function grant({db,env,token}){for(const e of [event('checkout.session.completed',session(token)),event('customer.subscription.created',subscription()),event('invoice.paid',invoice())])await applyStripeEvent(db,e,env);}

test('signatures require exact bytes, freshness and a matching v1 digest',()=>{
 const raw=Buffer.from(JSON.stringify(event('invoice.paid',invoice()))),secret='test-secret';
 const digest=createHmac('sha256',secret).update(now+'.').update(raw).digest('hex');
 assert.equal(verifyStripeEvent(raw,`t=${now},v1=${digest}`,secret).type,'invoice.paid');
 assert.throws(()=>verifyStripeEvent(Buffer.concat([raw,Buffer.from(' ')]),`t=${now},v1=${digest}`,secret));
 assert.throws(()=>verifyStripeEvent(raw,`t=${now-400},v1=${digest}`,secret));
 assert.throws(()=>verifyStripeEvent(raw,`t=${now},v1=invalid`,secret));
});
test('a redirect, unpaid checkout, wrong link, or payment without an authenticated checkout intent cannot grant access',async()=>{
 const f=await init();
 for(const [n,patch] of Object.entries({unpaid:{payment_status:'unpaid'},wrong:{payment_link:'plink_other'},missing:{client_reference_id:'unknown'}}))await applyStripeEvent(f.db,event('checkout.session.completed',{...session(f.token),...patch},n),f.env);
 await applyStripeEvent(f.db,event('invoice.paid',invoice()),f.env);await applyStripeEvent(f.db,event('customer.subscription.created',subscription()),f.env);
 assert.equal((await getEntitlement(f.db,user)).allowed,false);
});
test('all event delivery permutations converge on a paid entitlement',async()=>{
 for(const order of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]){
  const f=await init(),events=[event('checkout.session.completed',session(f.token)),event('customer.subscription.created',subscription()),event('invoice.paid',invoice())];
  for(const i of order)await applyStripeEvent(f.db,events[i],f.env);
  const e=await getEntitlement(f.db,user);assert.equal(e.allowed,true);assert.equal(e.remaining,50);
 }
});
test('duplicate events are idempotent and do not reset used quota',async()=>{
 const f=await init();await grant(f);const e=await getEntitlement(f.db,user);await reserveAnalysis(f.db,e.usageKey);
 const r=await applyStripeEvent(f.db,event('invoice.paid',invoice()),f.env);assert.equal(r.duplicate,true);assert.equal((await getEntitlement(f.db,user)).remaining,49);
});
test('wrong mode, foreign account and an unrelated price cannot authorize a buyer',async()=>{
 const f=await init();await assert.rejects(applyStripeEvent(f.db,{...event('invoice.paid',invoice()),livemode:false},f.env));
 await assert.rejects(applyStripeEvent(f.db,{...event('invoice.paid',invoice()),account:'acct_other'},f.env));
 await applyStripeEvent(f.db,event('customer.subscription.created',subscription({items:{data:[{price:{id:'price_other'},quantity:1}]}})),f.env);
 assert.equal((await getEntitlement(f.db,user)).allowed,false);
});
test('cancellation cannot be undone by late active snapshots; expired access fails closed',async()=>{
 const f=await init();await grant(f);
 await applyStripeEvent(f.db,event('customer.subscription.deleted',subscription({status:'canceled'}),'deleted'),f.env);
 await applyStripeEvent(f.db,{...event('customer.subscription.updated',subscription(),'old'),created:now-5},f.env);
 assert.equal((await getEntitlement(f.db,user)).allowed,false);
 const g=await init();await grant(g);assert.equal((await getEntitlement(g.db,user,(now+2600001)*1000)).allowed,false);
});
test('usage reservations cannot exceed 50 and an unsuccessful analysis can be released',async()=>{
 const f=await init();await grant(f);const {usageKey}=await getEntitlement(f.db,user);
 const claims=await Promise.all(Array.from({length:65},()=>reserveAnalysis(f.db,usageKey)));assert.equal(claims.filter(Boolean).length,50);
 assert.equal((await getEntitlement(f.db,user)).remaining,0);await releaseAnalysis(f.db,usageKey);assert.equal((await getEntitlement(f.db,user)).remaining,1);
});
test('a verified renewal resets allowance through a new paid period, never through a redirect',async()=>{
 const f=await init();await grant(f);const old=await getEntitlement(f.db,user);await reserveAnalysis(f.db,old.usageKey);
 const object=invoice({lines:{data:[{price:{id:'price_science'},quantity:1,period:{start:now+2600000,end:now+5200000}}]}});
 await applyStripeEvent(f.db,event('invoice.paid',object,'renewal'),f.env);
 assert.equal((await getEntitlement(f.db,user)).remaining,49);
 const renewed=await getEntitlement(f.db,user,(now+2600001)*1000);assert.equal(renewed.remaining,50);assert.notEqual(renewed.usageKey,old.usageKey);
});
test('checkout requires identity, accepted terms and a ready backend; active customers are not sold a duplicate plan',async()=>{
 const db=database(),env={...runtime,DB:db};
 assert.equal((await beginCheckout(db,null,env,TERMS_VERSION)).status,401);
 assert.equal((await beginCheckout(db,user,{...env,SCIENCE_BILLING_ENABLED:'false'},TERMS_VERSION)).status,503);
 assert.equal((await beginCheckout(db,user,env,false)).status,400);
 const f=await init();await grant(f);assert.equal((await beginCheckout(f.db,user,f.env,TERMS_VERSION)).status,409);
 assert.equal(billingReady({...env,STRIPE_WEBHOOK_SECRET:''}),false);
 assert.equal((await getEntitlement(db,{userId:'owner',email:'karimkatlane0@gmail.com'})).state,'owner');
});

test('localized checkout currency is validated through the configured price, not a euro-only amount check',async()=>{
 const f=await init();
 await applyStripeEvent(f.db,event('checkout.session.completed',{...session(f.token),currency:'usd',amount_total:3200}),f.env);
 await applyStripeEvent(f.db,event('customer.subscription.created',subscription()),f.env);
 await applyStripeEvent(f.db,event('invoice.paid',invoice({currency:'usd',amount_paid:3200})),f.env);
 assert.equal((await getEntitlement(f.db,user)).allowed,true);
});
