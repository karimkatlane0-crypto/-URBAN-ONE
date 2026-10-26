import {readStudent,saveStudent,deleteStudent} from './students.mjs';
import {studentDatabase} from './student-store.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createStore,verifyStripeSignature} from './core.mjs';
import {validateMonthlyPlan} from './billing.mjs';
import {getAnnualPlan,validateAnnualPlan} from './annual-billing.mjs';
import {dbrelayStatus,dbrelaySnapshot,dbrelayChanges} from './dbrelay.mjs';
import {quoteSEVA,evaluateMarketingRedemption} from './commercial.mjs';
import {previewFundedMarketingPurchase} from './marketing-flywheel.mjs';
import {createCommerce} from './commerce.mjs';
import {createAffiliateLedger} from './affiliate-ledger.mjs';
import {createNotificationCenter} from './notification-center.mjs';
import {validateCommercialDraft,produceDraft} from './communications.mjs';
import {validateRuntime,sameOrigin,databaseReady} from './runtime.mjs';

validateRuntime();
const root=resolve(fileURLToPath(new URL('./public/',import.meta.url)));
const store=createStore(process.env.SEVA_DB_PATH||'./data/seva.sqlite');
const commerce=createCommerce(store);
const affiliateLedger=createAffiliateLedger(store);
const notifications=createNotificationCenter(store);
const port=Number(process.env.PORT||3000);
const json=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2));
const limiter=new Map();
function rate(req,key,max=25){const now=Date.now();const id=key+':'+(req.socket.remoteAddress||'unknown');let row=limiter.get(id);if(!row||row.until<now){row={n:0,until:now+60000};limiter.set(id,row);}if(++row.n>max)throw Object.assign(Error('Rate limit reached'),{status:429});if(limiter.size>5000)for(const [k,v] of limiter)if(v.until<now)limiter.delete(k);}
async function rawBody(req,max=100000){const chunks=[];let n=0;for await(const chunk of req){n+=chunk.length;if(n>max)throw Object.assign(Error('Request too large'),{status:413});chunks.push(chunk);}return Buffer.concat(chunks).toString('utf8');}
function auth(req){const u=store.fromSession(cookies(req).seva_session);if(!u)throw Object.assign(Error('Please sign in'),{status:401});return u;}
function secureCookie(req){return process.env.NODE_ENV==='production'||req.headers['x-forwarded-proto']==='https'?'; Secure':'';}
function setSession(res,req,token){res.setHeader('Set-Cookie',`seva_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secureCookie(req)}`);}
function status(){return {name:'SEVA',version:'2.4.1',edition:'Enterprise candidate',phases:['II','III'],aiConfigured:Boolean(process.env.OPENAI_API_KEY),stripeConfigured:Boolean(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_WEBHOOK_SECRET),salesEnabled:process.env.SEVA_SALES_ENABLED==='true'&&Boolean(process.env.SEVA_MONTHLY_PRICE_ID),salesPrice:'€50/mese',salesPlan:'MONTHLY_ONLY',annualCheckoutEnabled:process.env.SEVA_SALES_ENABLED==='true'&&process.env.SEVA_ANNUAL_SALES_ENABLED==='true',annualPlans:[{id:'buyer',price:'€50/anno'},{id:'ecommerce',price:'€500/anno'}],checkoutVerified:false,automaticRefundsEnabled:false,rewards:'ledger only; payout disabled until separate agreement'};}
async function stripe(method,path,data){const key=process.env.STRIPE_SECRET_KEY;if(!key)throw Object.assign(Error('Stripe server credentials unavailable'),{status:503});const resp=await fetch('https://api.stripe.com/v1/'+path,{method,headers:{Authorization:`Bearer ${key}`,...(data?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body:data?new URLSearchParams(data):undefined,signal:AbortSignal.timeout(15000)});
 const body=await resp.json();if(!resp.ok)throw Object.assign(Error(body.error?.message||'Stripe unavailable'),{status:resp.status===401?503:502});return body;}
async function createCheckout(user){if(process.env.SEVA_SALES_ENABLED!=='true')throw Object.assign(Error('Sales closed pending fulfillment verification'),{status:503});
 const monthlyPriceId=process.env.SEVA_MONTHLY_PRICE_ID;
 if(!monthlyPriceId)throw Object.assign(Error('Monthly Stripe product is not configured'),{status:503});
 const p=await stripe('GET','prices/'+encodeURIComponent(monthlyPriceId));const prod=await stripe('GET','products/'+encodeURIComponent(p.product));
 validateMonthlyPlan(p,prod,monthlyPriceId);
 const url=process.env.SEVA_PUBLIC_URL;if(!url||!url.startsWith('https://'))throw Object.assign(Error('Verified HTTPS public URL required'),{status:503});
 const s=await stripe('POST','checkout/sessions',{'mode':'subscription','line_items[0][price]':p.id,'line_items[0][quantity]':'1','customer_email':user.email,'client_reference_id':user.id,'metadata[seva_user_id]':user.id,'metadata[seva_plan]':'enterprise_monthly','metadata[seva_price_id]':p.id,'subscription_data[metadata][seva_plan]':'enterprise_monthly','success_url':`${url}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,'cancel_url':`${url}/?checkout=cancel`});
 if(!s.id||!s.url)throw Object.assign(Error('Checkout response invalid'),{status:502});store.recordCheckout(user.id,s.id,'enterprise_monthly',p.id);return {url:s.url};}
async function createAnnualCheckout(user,planName){
 // Annual subscriptions are separate from the A=EUR50/month commercial quote and monthly SKU.
 if(process.env.SEVA_SALES_ENABLED!=='true'||process.env.SEVA_ANNUAL_SALES_ENABLED!=='true')
   throw Object.assign(Error('Annual SEVA sales are closed pending end-to-end verification'),{status:503});
 const cfg=getAnnualPlan(planName);
 const expectedPriceId=process.env[cfg.priceEnv],expectedProductId=process.env[cfg.productEnv];
 if(!expectedPriceId||!expectedProductId)throw Object.assign(Error('Annual Stripe plan not configured'),{status:503});
 const price=await stripe('GET','prices/'+encodeURIComponent(expectedPriceId));
 const product=await stripe('GET','products/'+encodeURIComponent(expectedProductId));
 validateAnnualPlan(planName,price,product,expectedPriceId,expectedProductId);
 const url=process.env.SEVA_PUBLIC_URL;
 if(!url||!url.startsWith('https://'))throw Object.assign(Error('Verified HTTPS public URL required'),{status:503});
 const checkout=await stripe('POST','checkout/sessions',{
   'mode':'subscription','line_items[0][price]':price.id,'line_items[0][quantity]':'1',
   'customer_email':user.email,'client_reference_id':user.id,
   'metadata[seva_user_id]':user.id,'metadata[seva_plan]':planName+'_annual',
   'metadata[seva_price_id]':price.id,
   'subscription_data[metadata][seva_plan]':planName+'_annual',
   'success_url':`${url}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
   'cancel_url':`${url}/?checkout=cancel`
 });
 if(!checkout.id||!checkout.url)throw Object.assign(Error('Annual Checkout response invalid'),{status:502});
 store.recordCheckout(user.id,checkout.id,planName+'_annual',price.id);
 return {url:checkout.url,plan:planName};
}
async function aiPlan(user,prompt){if(!process.env.OPENAI_API_KEY)throw Object.assign(Error('OpenAI server key not configured'),{status:503});if(!store.hasAccess(user.id)&&!(process.env.SEVA_ADMIN_EMAIL&&user.email===process.env.SEVA_ADMIN_EMAIL.toLowerCase()))throw Object.assign(Error('Active SEVA plan required'),{status:402});
 const data=store.listGoals(user.id).slice(0,80);let input='GOALS: '+JSON.stringify(data).slice(0,15000)+'\nUSER TASK: '+String(prompt||'Prepare a clear execution plan').slice(0,2000);
 const resp=await fetch(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5.1',instructions:'You are SEVA AI. Build an actionable goal-driven plan with numbered steps, acceptance criteria, evidence, responsible actor, realistic limitations and status. Never claim to have executed external actions. Answer in the user language. Do not reveal secrets.',input,store:false,max_output_tokens:1200}),signal:AbortSignal.timeout(40000)});
 let body=await resp.json();if(!resp.ok)throw Object.assign(Error('OpenAI request failed: '+(body.error?.message||resp.status)),{status:502});const output=body.output_text||body.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n');if(!output)throw Object.assign(Error('OpenAI response contained no text'),{status:502});store.audit(user.id,'ai_response',body.id||'');return {text:output,model:body.model||process.env.OPENAI_MODEL||'gpt-5.1',id:body.id,provider:'OpenAI',verified:true};}
async function route(req,res){const method=req.method||'GET';const url=new URL(req.url||'/', 'http://localhost');const path=url.pathname;
 if(path==='/health'){const ready=databaseReady(store.db);return json(res,ready?200:503,{ok:ready,service:'seva',timestamp:new Date().toISOString()});}
 if(path==='/api/public/status')return json(res,200,status());
 if(path==='/api/stripe/webhook'&&method==='POST'){
    if(!process.env.STRIPE_WEBHOOK_SECRET)return json(res,503,{error:'Webhook not configured'});
    const raw=await rawBody(req,1000000);if(!verifyStripeSignature(raw,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET))return json(res,400,{error:'Invalid signature'});
    const event=JSON.parse(raw);const result=store.processStripeEvent(event);return json(res,200,{received:true,result});
 }
 if(path.startsWith('/api/')&&method!=='GET'&&!sameOrigin(req))return json(res,403,{error:'Cross-origin request rejected'});
 if(path==='/api/communications/draft'&&method==='POST'){
  rate(req,'ai-communications',5);
  const u=auth(req);
  const data=validateCommercialDraft(JSON.parse(await rawBody(req,2200)));
  if(!store.hasAccess(u.id)&&!(process.env.SEVA_ADMIN_EMAIL&&u.email===process.env.SEVA_ADMIN_EMAIL.toLowerCase()))
   throw Object.assign(Error('Active SEVA plan required'),{status:402});
  const result=await produceDraft(data,{
   apiKey:process.env.OPENAI_API_KEY,
   model:process.env.OPENAI_MODEL||'gpt-5.1',
   baseUrl:process.env.OPENAI_BASE_URL||'https://api.openai.com/v1/responses'
  });
  store.audit(u.id,'communications_draft',result.id||'draft');
  return json(res,200,{...result,requiresHumanApproval:true,pricingVerified:false});
 }
 if(path==='/api/notifications/preferences'&&method==='GET'){
  const u=auth(req);return json(res,200,{preferences:notifications.prefs(u.id)});
 }
 if(path==='/api/notifications/preferences'&&method==='PUT'){
  rate(req,'notification-preferences',12);const u=auth(req);
  const body=JSON.parse(await rawBody(req,500));
  return json(res,200,{preferences:notifications.setPrefs(u.id,body)});
 }
 if(path==='/api/notifications'&&method==='GET'){
  rate(req,'notification-list',60);const u=auth(req);
  return json(res,200,notifications.list(u.id));
 }
 if(path==='/api/notifications/read'&&method==='POST'){
  rate(req,'notification-read',50);const u=auth(req);
  const body=JSON.parse(await rawBody(req,500));
  return json(res,200,notifications.acknowledge(u.id,body.id));
 }
 if(path==='/api/notifications'&&method==='DELETE'){
  rate(req,'notification-delete',6);const u=auth(req);
  return json(res,200,notifications.erase(u.id));
 }
 if(path==='/api/commerce/catalog'&&method==='GET')return json(res,200,{products:commerce.catalog(),pricingVerified:false});
 if(path==='/api/commerce/affiliate/opportunities'&&method==='GET'){const u=auth(req);return json(res,200,{opportunities:affiliateLedger.list(u.id),incomePaidCents:0,settlementExecuted:false,notice:'Internal audit candidates only; no partner payout, no automatic commission or charge on incomplete purchases.'});}
 if(path==='/api/commerce/profile'&&method==='GET'){const u=auth(req);return json(res,200,{profile:commerce.profile(u.id)});}
 if(path==='/api/commerce/profile'&&method==='PUT'){rate(req,'profile',20);const u=auth(req);return json(res,200,{profile:commerce.saveProfile(u.id,JSON.parse(await rawBody(req,3000)))});}
 if(path==='/api/commerce/profile'&&method==='DELETE'){rate(req,'eraseprofile',10);const u=auth(req);return json(res,200,commerce.deleteProfile(u.id));}
 if(path==='/api/commerce/student'&&method==='GET'){const u=auth(req);return json(res,200,{student:commerce.student(u.id)});}
 if(path==='/api/commerce/student/apply'&&method==='POST'){rate(req,'student-apply',3);const u=auth(req);return json(res,202,{student:commerce.applyStudent(u.id,JSON.parse(await rawBody(req,3000)))});}
 if(path==='/api/commerce/cart'&&method==='GET'){const u=auth(req);return json(res,200,{cart:commerce.getCart(u.id)});}
 if(path==='/api/commerce/cart'&&method==='PUT'){rate(req,'cart',40);const u=auth(req);return json(res,200,{cart:commerce.saveCart(u.id,JSON.parse(await rawBody(req,3000)))});}
 if(path==='/api/commerce/requests'&&method==='GET'){const u=auth(req);return json(res,200,{requests:commerce.quoteRequests(u.id)});}
 if(path==='/api/commerce/requests'&&method==='POST'){rate(req,'quote-request',10);const u=auth(req);return json(res,201,{request:commerce.requestQuote(u.id,JSON.parse(await rawBody(req,4000)))});}
 if(path==='/api/commerce/checkout'&&method==='POST'){
   rate(req,'commerce-checkout',6);const u=auth(req);const cart=commerce.getCart(u.id);
   if(cart.items.length!==1||cart.items[0]?.sku!=='enterprise-monthly')throw Object.assign(Error('Unpriced or student cart requires a quote and verification'),{status:409});
   return json(res,200,await createCheckout(u));
 }
 if(path==='/api/commerce/assist'&&method==='POST'){rate(req,'commerce-assist',5);const u=auth(req);const b=JSON.parse(await rawBody(req,2500));const intent=String(b.intent||'').slice(0,900);return json(res,200,await aiPlan(u,'Present no purchase or verified inventory claims. Recommend a SEVA catalog offering for this user intent: '+intent+'; catalog SKUs: goal-free, enterprise-monthly, student-monthly (needs verification), goal-once, goal-success, marketing-consented, time-service. Any price except €50/month or free must be quoted separately.'));}
 if(path==='/api/commercial/marketing-benefit-preview'&&method==='POST'){
   rate(req,'marketing-benefit-preview',20);
   const body=JSON.parse(await rawBody(req,12000));
   return json(res,200,{preview:previewFundedMarketingPurchase(body),settlementExecuted:false,receiptVerifiedByServer:false});
 }
 if(path==='/api/commercial/quote'&&method==='POST'){rate(req,'commercial',30);const body=JSON.parse(await rawBody(req,12000));return json(res,200,{quote:quoteSEVA(body),checkoutEnabled:false});}
 if(path==='/api/commercial/redemption-preview'&&method==='POST'){rate(req,'redemption',30);const body=JSON.parse(await rawBody(req,12000));return json(res,200,{redemption:evaluateMarketingRedemption(body),paymentExecuted:false});}
 if(path==='/api/commercial/campaigns'&&method==='GET'){const u=auth(req);return json(res,200,{campaigns:store.listCampaigns(u.id)});}
 if(path==='/api/commercial/campaigns'&&method==='POST'){rate(req,'campaign-draft',12);const u=auth(req);const body=JSON.parse(await rawBody(req,12000));const quote=quoteSEVA(body.quote||{});const terms=body.terms||{};if(quote.marketingCents>0&&!terms.marketingConsentConfirmed)throw Object.assign(Error('Explicit marketing consent required'),{status:400});const id=store.saveCampaign(u.id,quote,terms);return json(res,201,{id,status:'draft',paymentExecuted:false});}
 if(path==='/api/auth/register'&&method==='POST'){rate(req,'reg',5);const body=JSON.parse(await rawBody(req));const u=store.register(body.email,body.password);setSession(res,req,store.newSession(u.id));return json(res,201,{user:u});}
 if(path==='/api/auth/login'&&method==='POST'){rate(req,'login',10);const body=JSON.parse(await rawBody(req));const u=store.login(body.email,body.password);setSession(res,req,store.newSession(u.id));return json(res,200,{user:u});}
 if(path==='/api/auth/logout'&&method==='POST'){const token=cookies(req).seva_session;if(token)store.db.prepare('DELETE FROM sessions WHERE token=?').run(token);res.setHeader('Set-Cookie',`seva_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookie(req)}`);return json(res,200,{ok:true});}
 if(path==='/api/student'){
  const u=auth(req),db=studentDatabase(store.db);
  if(method==='GET')return json(res,200,{profile:await readStudent(db,u.id)});
  if(!['PUT','DELETE'].includes(method))return json(res,405,{error:'Method not allowed'});
  rate(req,'student-profile',20);
  if(!(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{error:'JSON required'});
  const b=JSON.parse(await rawBody(req,8192));
  if(method==='PUT')return json(res,200,{profile:await saveStudent(db,u.id,b)});
  return json(res,200,await deleteStudent(db,u.id,b?.version));
 }
 if(path==='/api/me'&&method==='GET'){const u=auth(req);return json(res,200,{user:u,access:store.hasAccess(u.id),activePlans:store.activePlans(u.id)});}
 if(path==='/api/dbrelay/status'&&method==='GET'){rate(req,'dbrelay-status',60);const u=auth(req);return json(res,200,dbrelayStatus(store,u.id));}
 if(path==='/api/dbrelay/snapshot'&&method==='GET'){rate(req,'dbrelay-snapshot',30);const u=auth(req);return json(res,200,dbrelaySnapshot(store,u.id));}
 if(path==='/api/dbrelay/changes'&&method==='GET'){rate(req,'dbrelay-changes',60);const u=auth(req);return json(res,200,dbrelayChanges(store,u.id,url.searchParams.get('after')??'0',url.searchParams.get('limit')??'50'));}
 if(path==='/api/goals'&&method==='GET'){const u=auth(req);return json(res,200,{goals:store.listGoals(u.id)});}
 if(path==='/api/goals'&&method==='POST'){rate(req,'goals',60);const u=auth(req);const body=JSON.parse(await rawBody(req));const id=store.saveGoal(u.id,body);notifications.publishGoal(u.id,id,body.status);return json(res,201,{id});}
 if(path.startsWith('/api/goals/')&&['PUT','DELETE'].includes(method)){const u=auth(req);const id=path.slice('/api/goals/'.length);if(!/^[0-9a-f-]{36}$/.test(id))return json(res,400,{error:'Invalid goal ID'});if(method==='DELETE'){store.deleteGoal(u.id,id);return json(res,200,{ok:true});}const previous=store.listGoals(u.id).find(x=>x.id===id);const b=JSON.parse(await rawBody(req));const updated=store.saveGoal(u.id,b,id);if(previous?.status!==b.status)notifications.publishGoal(u.id,id,b.status);return json(res,200,{id:updated});}
 if(path==='/api/ai/generate'&&method==='POST'){rate(req,'ai',6);const u=auth(req);const b=JSON.parse(await rawBody(req,6000));return json(res,200,await aiPlan(u,b.prompt));}
 if(path==='/api/billing/checkout'&&method==='POST'){rate(req,'checkout',6);const u=auth(req);return json(res,200,await createCheckout(u));}
 if(path==='/api/billing/checkout/annual'&&method==='POST'){rate(req,'checkout-annual',6);const u=auth(req);const body=JSON.parse(await rawBody(req,2000));return json(res,200,await createAnnualCheckout(u,body.plan));}
 if(path==='/api/rewards'&&method==='GET'){const u=auth(req);return json(res,200,{rewards:store.rewards(u.id),payoutsEnabled:false});}
 if(path.startsWith('/api/'))return json(res,404,{error:'Not found'});
 if(method!=='GET'&&method!=='HEAD')return json(res,405,{error:'Method not allowed'});
 const file=path==='/'?'/index.html':path;const full=resolve(root,'.'+file);if(!full.startsWith(root+'/')&&full!==root)return json(res,403,{error:'Denied'});
 try{const data=await readFile(full);const type=({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png'}[extname(full)]||'application/octet-stream');res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"});res.end(method==='HEAD'?undefined:data);}catch{return json(res,404,{error:'Not found'});}
}
const server=createServer((req,res)=>Promise.resolve(route(req,res)).catch(e=>{console.error(new Date().toISOString(),String(e.message));const code=e.status||(e instanceof RangeError||/Invalid|not found|unavailable|cycle|Maximum|Mismatch|already|constraint|UNIQUE/i.test(e.message)?400:500);json(res,code,{error:code===500?'Internal server error':e.message});}));
if(process.env.SEVA_NO_LISTEN!=='1')server.listen(port,()=>console.log(`SEVA listening on http://localhost:${port}`));
export {server,store};
