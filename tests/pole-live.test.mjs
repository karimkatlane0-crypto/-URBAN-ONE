import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PoleStore,resolvePoleActor,poleReadiness} from '../services/api/pole-store.mjs';
import {createPoleTestCheckout} from '../services/api/pole-checkout.mjs';
import {handlePoleApi} from '../services/api/pole-http.mjs';
const now=Date.parse('2026-10-23T10:00:00Z');
const at=ms=>new Date(ms).toISOString();
const owner={id:'ownerA',role:'owner',ownerVerified:true};
const ownerB={id:'ownerB',role:'owner',ownerVerified:true};
const visitor={id:'visitorA',role:'visitor'};
const visitorB={id:'visitorB',role:'visitor'};
const createDossier=db=>db.execute('dossier.create',owner,{
  title:'Immobile fittizio',description:'Esempio con dati sintetici',purpose:'Vendita',publishedAt:at(now-1000)},now);
function createSlot(db,id,start=now+86400000){
  return db.execute('slot.create',owner,{dossierId:id,start:at(start),minutes:30,
    feeCents:1500,terms:'Accompagnamento demo: condizioni di annullamento concordate.'},now);
}
test('staging dossier is owner-gated, scoped and uses exactly 24h window',()=>{
  const db=new PoleStore();
  assert.throws(()=>db.execute('dossier.create',{...owner,ownerVerified:false},{title:'x'},now),/OWNER_AUTHORITY_REQUIRED/);
  assert.throws(()=>db.execute('dossier.create',visitor,{title:'x'},now),/OWNER_AUTHORITY_REQUIRED/);
  const d=createDossier(db);
  assert.equal(db.execute('dossier.read',visitor,{dossierId:d.id},now).early24h,true);
  assert.equal(db.execute('dossier.read',visitor,{dossierId:d.id},now+86400000).early24h,false);
  assert.throws(()=>db.execute('slot.create',ownerB,{dossierId:d.id,start:at(now+50000000),
    minutes:30,feeCents:0,terms:'yes'},now),/FORBIDDEN/);
  db.close();
});
test('staging slot overlap and double booking rejected transactionally; cancellation releases slot',()=>{
  const db=new PoleStore(),d=createDossier(db);
  const slot=createSlot(db,d.id);
  assert.throws(()=>createSlot(db,d.id,now+86400000+60000),/SLOT_OVERLAP/);
  const v=db.execute('visit.request',visitor,{slotId:slot.id},now);
  assert.equal(v.paymentStatus,'NOT_PROCESSED');
  assert.equal(v.realPayment,false);
  assert.throws(()=>db.execute('visit.request',visitorB,{slotId:slot.id},now),/SLOT_TAKEN/);
  assert.throws(()=>db.execute('visit.transition',visitor,{visitId:v.id,nextState:'CONFIRMED'},now),/FORBIDDEN/);
  const confirmed=db.execute('visit.transition',owner,{visitId:v.id,nextState:'CONFIRMED'},now);
  assert.equal(confirmed.state,'CONFIRMED');
  assert.throws(()=>db.execute('visit.transition',owner,{visitId:v.id,nextState:'COMPLETED'},now),/INVALID_TRANSITION/);
  assert.equal(db.execute('visit.transition',visitor,{visitId:v.id,nextState:'CANCELLED'},now).state,'CANCELLED');
  assert.equal(db.execute('visit.request',visitorB,{slotId:slot.id},now).state,'REQUESTED');
  assert.throws(()=>db.execute('visit.request',visitor,{slotId:slot.id},now),/SLOT_TAKEN/);
  db.close();
});
test('check-in / check-out equivalent completion never implies payment or ownership',()=>{
  const db=new PoleStore(),d=createDossier(db),slot=createSlot(db,d.id);
  const v=db.execute('visit.request',visitor,{slotId:slot.id},now);
  for(const next of ['CONFIRMED','CHECKED_IN','COMPLETED'])db.execute('visit.transition',owner,{visitId:v.id,nextState:next},now);
  const value=db.execute('visit.read',visitor,{visitId:v.id},now);
  assert.equal(value.state,'COMPLETED');assert.equal(value.paymentStatus,'NOT_PROCESSED');
  assert.equal(value.realPayment,false);
  assert.throws(()=>db.execute('visit.read',visitorB,{visitId:v.id},now),/FORBIDDEN/);
  db.close();
});
test('messages persist in private visit and deny unrelated actors',()=>{
  const db=new PoleStore(),d=createDossier(db),slot=createSlot(db,d.id);
  const v=db.execute('visit.request',visitor,{slotId:slot.id},now);
  assert.throws(()=>db.execute('message.send',visitorB,{visitId:v.id,message:'Intrusion'},now),/FORBIDDEN/);
  db.execute('message.send',visitor,{visitId:v.id,message:'Richiesta fittizia'},now);
  db.execute('message.send',owner,{visitId:v.id,message:'Ricevuto'},now+1);
  assert.equal(db.execute('message.list',visitor,{visitId:v.id},now).messages.length,2);
  assert.throws(()=>db.execute('message.list',ownerB,{visitId:v.id},now),/FORBIDDEN/);
  db.close();
});
test('tokens are SHA256 digests in staging configuration, not raw secrets or trust in request body',()=>{
  const secret='a'.repeat(48);
  const env={POLE_STAGING_ENABLED:'true',POLE_STAGING_ACTORS_JSON:JSON.stringify([{
    tokenHash:createHash('sha256').update(secret).digest('hex'),id:owner.id,role:'owner',ownerVerified:true}])};
  assert.equal(resolvePoleActor('Bearer '+secret,env).id,'ownerA');
  assert.throws(()=>resolvePoleActor('Bearer '+'b'.repeat(48),env),/AUTH_REQUIRED/);
  assert.throws(()=>resolvePoleActor('Bearer '+secret,{...env,POLE_STAGING_ENABLED:'false'}),/STAGING_DISABLED/);
  assert.equal(poleReadiness(env).production,false);
  assert.equal(poleReadiness(env).externalDbRelay,'NOT_CONFIGURED');
});
const payEnv={
  POLE_STAGING_ENABLED:'true',POLE_TEST_CHECKOUT_ENABLED:'true',
  POLE_STRIPE_TEST_SECRET_KEY:'sk_test_placeholder_for_mock_not_real',
  POLE_STRIPE_TEST_VISIT_PRICE_ID:'price_testvisit123',
  POLE_STRIPE_TEST_SUBSCRIPTION_PRICE_ID:'price_testsub123',
  POLE_CHECKOUT_SUCCESS_URL:'https://example.org/thanks',
  POLE_CHECKOUT_CANCEL_URL:'https://example.org/cancel'
};
test('test-mode Stripe Checkout respects configured products, no payment-method overrides and never grants access',async()=>{
  let calls=0;
  const mock=async(url,opts)=>{
    calls++;
    assert.equal(url,'https://api.stripe.com/v1/checkout/sessions');
    assert.match(opts.body,/mode=payment/);
    assert.match(opts.body,/line_items%5B0%5D%5Bprice%5D=price_testvisit123/);
    assert.doesNotMatch(opts.body,/payment_method_types/);
    return {ok:true,json:async()=>({id:'cs_test_ABC123',url:'https://checkout.stripe.com/c/pay/mock'})};
  };
  const result=await createPoleTestCheckout({kind:'visit',actor:visitor,visitId:'visitXYZ',termsAccepted:true,env:payEnv,fetchFn:mock});
  assert.equal(calls,1);
  assert.equal(result.paymentStatus,'NOT_VERIFIED');
  assert.equal(result.fulfillmentAuthorized,false);
  await assert.rejects(()=>createPoleTestCheckout({kind:'subscription',actor:owner,termsAccepted:false,env:payEnv,fetchFn:mock}),/TERMS_NOT_ACCEPTED/);
  assert.equal(calls,1);
  await assert.rejects(()=>createPoleTestCheckout({kind:'visit',actor:visitor,visitId:'visitXYZ',termsAccepted:true,
    env:{...payEnv,POLE_STRIPE_TEST_SECRET_KEY:'sk_live_forbidden'},fetchFn:mock}),/STRIPE_TEST_KEY_REQUIRED/);
  assert.equal(calls,1);
});
test('subscription Checkout is opt-in, isolated from visitors and only uses a recurring test price',async()=>{
  const result=await createPoleTestCheckout({kind:'subscription',actor:owner,termsAccepted:true,env:payEnv,
    fetchFn:async(url,opts)=>{
      assert.match(opts.body,/mode=subscription/);
      assert.match(opts.body,/price_testsub123/);
      return {ok:true,json:async()=>({id:'cs_test_XYZ',url:'https://checkout.stripe.com/c/pay/xyz'})};
    }});
  assert.equal(result.subscriptionActive,false);
  await assert.rejects(()=>createPoleTestCheckout({kind:'subscription',actor:visitor,termsAccepted:true,env:payEnv,
    fetchFn:()=>{throw Error('should never be called');}}),/FORBIDDEN/);
});
test('public API reveals only staged capability metadata and fail-closes when disabled',async()=>{
  const status=await handlePoleApi({method:'GET',path:'/api/pole/status',env:{}});
  assert.equal(status.body.mode,'DISABLED');
  assert.equal(status.body.whatsappBroadcast,'OPT_IN_MANUAL_SHARE_ONLY');
  const blocked=await handlePoleApi({method:'POST',path:'/api/pole/dossier/create',headers:{authorization:'Bearer '+'x'.repeat(48)},body:{},env:{}});
  assert.equal(blocked.status,503);
});
