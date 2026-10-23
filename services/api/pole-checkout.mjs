// Stripe TEST-mode Checkout adapter. Existing payment methods, beneficiaries and products are never modified.
// No Checkout link is an entitlement. Production is hard-disabled until independent certification.
import {createHash} from 'node:crypto';
import {PoleError} from './pole-store.mjs';
const ALLOWED_ORIGINS=new Set(['https://checkout.stripe.com','https://checkout.stripe.dev']);
function configured(env,kind){
  if(env.POLE_TEST_CHECKOUT_ENABLED!=='true'||env.POLE_STAGING_ENABLED!=='true')
    throw new PoleError('CHECKOUT_NOT_ENABLED',503);
  if(!String(env.POLE_STRIPE_TEST_SECRET_KEY||'').startsWith('sk_test_'))
    throw new PoleError('STRIPE_TEST_KEY_REQUIRED',503);
  const price=kind==='visit'?env.POLE_STRIPE_TEST_VISIT_PRICE_ID:env.POLE_STRIPE_TEST_SUBSCRIPTION_PRICE_ID;
  if(!/^price_[A-Za-z0-9]+$/.test(price||''))throw new PoleError('APPROVED_TEST_PRICE_REQUIRED',503);
  let success,cancel;
  try{
    success=new URL(env.POLE_CHECKOUT_SUCCESS_URL);
    cancel=new URL(env.POLE_CHECKOUT_CANCEL_URL);
  }catch{throw new PoleError('RETURN_URL_REQUIRED',503);}
  if(success.protocol!=='https:'||cancel.protocol!=='https:'||success.origin!==cancel.origin)
    throw new PoleError('RETURN_URL_NOT_TRUSTED',503);
  return {price,success:success.toString(),cancel:cancel.toString()};
}
export async function createPoleTestCheckout({kind,actor,visitId,termsAccepted,env={},fetchFn=fetch}){
  if(!['visit','subscription'].includes(kind))throw new PoleError('INVALID_PURCHASE');
  if(termsAccepted!==true)throw new PoleError('TERMS_NOT_ACCEPTED',403);
  if(actor?.role!==(kind==='visit'?'visitor':'owner'))throw new PoleError('FORBIDDEN',403);
  if(kind==='visit'&&(!visitId||typeof visitId!=='string'))throw new PoleError('VISIT_REQUIRED');
  const conf=configured(env,kind);
  const form=new URLSearchParams({
    mode:kind==='visit'?'payment':'subscription',
    'line_items[0][price]':conf.price,
    'line_items[0][quantity]':'1',
    success_url:conf.success,
    cancel_url:conf.cancel,
    'metadata[pole_kind]':kind,
    'metadata[pole_actor_id]':actor.id,
    'metadata[pole_visit_id]':kind==='visit'?visitId:'',
    'metadata[pole_release]':'STAGING_ONLY'
  });
  // A repeating request for the same visit and actor must not create a second checkout session.
  const key=createHash('sha256').update('pole-v1:'+kind+':'+actor.id+':'+(visitId||'owner-plan')).digest('hex');
  const response=await fetchFn('https://api.stripe.com/v1/checkout/sessions',{
    method:'POST',
    headers:{authorization:'Bearer '+env.POLE_STRIPE_TEST_SECRET_KEY,
      'content-type':'application/x-www-form-urlencoded','idempotency-key':key},
    body:form.toString(),signal:AbortSignal.timeout(10000)
  });
  if(!response.ok)throw new PoleError('STRIPE_TEST_SESSION_FAILED',502);
  const data=await response.json();
  let url;
  try{url=new URL(data.url);}catch{throw new PoleError('INVALID_STRIPE_SESSION',502);}
  if(!ALLOWED_ORIGINS.has(url.origin)||!String(data.id||'').startsWith('cs_test_'))
    throw new PoleError('INVALID_STRIPE_SESSION',502);
  return {checkoutUrl:url.toString(),checkoutSessionId:data.id,mode:'STRIPE_TEST_ONLY',
    paymentStatus:'NOT_VERIFIED',fulfillmentAuthorized:false,subscriptionActive:false};
}
