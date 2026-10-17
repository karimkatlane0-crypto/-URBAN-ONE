import {createHmac,timingSafeEqual} from 'node:crypto';

const DEFAULT_TOLERANCE_SECONDS=300;

function parseStripeSignature(header=''){
  const parts=String(header).split(',').map(part=>part.trim()).filter(Boolean);
  const timestamps=[];const signatures=[];
  for(const part of parts){
    const [key,value]=part.split('=',2);
    if(key==='t'&&value)timestamps.push(Number(value));
    if(key==='v1'&&value)signatures.push(value);
  }
  return {timestamp:timestamps.find(Number.isFinite),signatures};
}

function secureHexEqual(a,b){
  try{
    const left=Buffer.from(String(a),'hex');
    const right=Buffer.from(String(b),'hex');
    return left.length===right.length&&left.length>0&&timingSafeEqual(left,right);
  }catch{return false;}
}

export function verifyStripeSignature({payload,signatureHeader,secret,toleranceSeconds=DEFAULT_TOLERANCE_SECONDS,now=Math.floor(Date.now()/1000)}){
  if(!secret)throw new Error('STRIPE_WEBHOOK_SECRET_REQUIRED');
  const raw=Buffer.isBuffer(payload)?payload:Buffer.from(String(payload??''),'utf8');
  const {timestamp,signatures}=parseStripeSignature(signatureHeader);
  if(!Number.isFinite(timestamp)||!signatures.length)throw new Error('STRIPE_SIGNATURE_INVALID');
  if(Math.abs(now-timestamp)>toleranceSeconds)throw new Error('STRIPE_SIGNATURE_STALE');
  const expected=createHmac('sha256',secret).update(String(timestamp)).update('.').update(raw).digest('hex');
  if(!signatures.some(signature=>secureHexEqual(signature,expected)))throw new Error('STRIPE_SIGNATURE_INVALID');
  return true;
}

export function classifyStripeEvent(type=''){
  switch(type){
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return 'VERIFY_SUBSCRIPTION_BEFORE_GRANT';
    case 'invoice.paid':
      return 'CONTINUE_ENTITLEMENT';
    case 'invoice.payment_failed':
      return 'PAYMENT_RECOVERY';
    case 'customer.subscription.updated':
      return 'SYNC_SUBSCRIPTION';
    case 'customer.subscription.deleted':
      return 'REVOKE_ENTITLEMENT';
    default:
      return 'IGNORE';
  }
}

export function handleStripeWebhook({rawBody,headers={},env={},now}){
  const secret=env.STRIPE_WEBHOOK_SECRET;
  const signatureHeader=headers['stripe-signature']||headers['Stripe-Signature'];
  verifyStripeSignature({payload:rawBody,signatureHeader,secret,now});
  let event;
  try{event=JSON.parse(Buffer.isBuffer(rawBody)?rawBody.toString('utf8'):String(rawBody??''));}
  catch{throw new Error('STRIPE_EVENT_JSON_INVALID');}
  if(!event?.id||!event?.type)throw new Error('STRIPE_EVENT_INVALID');
  return {status:200,body:{received:true,eventId:event.id,type:event.type,action:classifyStripeEvent(event.type)}};
}
