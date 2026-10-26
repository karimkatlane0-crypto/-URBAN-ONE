import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
process.env.SEVA_NO_LISTEN='1';process.env.SEVA_DB_PATH=':memory:';process.env.SEVA_SALES_ENABLED='false';
const {server}=await import('../server.mjs');server.listen(0);await once(server,'listening');after(()=>server.close());
const base=`http://127.0.0.1:${server.address().port}`;let cookie='';
const call=async(path,{method='GET',body,headers={}}={})=>{const r=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};};
test('31 live local HTTP health',async()=>{const r=await call('/health');assert.equal(r.status,200);assert.equal(r.data.ok,true);});
test('32 service does not advertise sales enabled',async()=>{const r=await call('/api/public/status');assert.equal(r.data.salesEnabled,false);});
test('33 anonymous goals forbidden',async()=>{const r=await call('/api/goals');assert.equal(r.status,401);});
test('34 HTTP signup sets httpOnly sameSite cookie',async()=>{const r=await call('/api/auth/register',{method:'POST',body:{email:'smoke@example.com',password:'Twelve+Secure-Pass123'}});assert.equal(r.status,201);assert.match(r.cookie,/HttpOnly/);assert.match(r.cookie,/SameSite=Lax/);cookie=r.cookie.split(';')[0];});
test('35 signed-in account can save and retrieve goals',async()=>{const r=await call('/api/goals',{method:'POST',body:{title:'Audit payment webhook',status:'doing'}});assert.equal(r.status,201);const d=await call('/api/goals');assert.equal(d.data.goals.length,1);assert.equal(d.data.goals[0].status,'doing');});
test('36 CSRF cross-origin request denied',async()=>{const r=await call('/api/goals',{method:'POST',headers:{Origin:'https://attacker.example'},body:{title:'Injected'}});assert.equal(r.status,403);});
test('CSRF rejects invalid and same-host wrong-scheme origins without a server error',async()=>{
 for(const Origin of ['null','not-a-url',base.replace('http:','https:')]){
  const r=await call('/api/goals',{method:'POST',headers:{Origin},body:{title:'Must not be saved'}});
  assert.equal(r.status,403);
 }
 assert.equal((await call('/api/goals')).data.goals.length,1);
});
test('37 payment checkout fail closed',async()=>{const r=await call('/api/billing/checkout',{method:'POST',body:{}});assert.equal(r.status,503);});
test('38 OpenAI unavailable without server secret',async()=>{const r=await call('/api/ai/generate',{method:'POST',body:{prompt:'hello'}});assert.equal(r.status,503);});
test('39 forged Stripe callback rejected without secret',async()=>{const r=await call('/api/stripe/webhook',{method:'POST',body:{id:'fake'}});assert.equal(r.status,503);});
test('40 client HTML route works',async()=>{const r=await fetch(base+'/');assert.equal(r.status,200);assert.match(await r.text(),/SEVA/);});
test('41 commercial price preview is public and does not charge',async()=>{const r=await call('/api/commercial/quote',{method:'POST',body:{months:2,marketingRequestedCents:10000}});assert.equal(r.status,200);assert.equal(r.data.quote.dueNowCents,10000);assert.equal(r.data.checkoutEnabled,false);});
test('42 invalid commercial preview is rejected',async()=>{const r=await call('/api/commercial/quote',{method:'POST',body:{months:-1}});assert.equal(r.status,400);});
test('43 redemption preview never initiates payout',async()=>{const r=await call('/api/commercial/redemption-preview',{method:'POST',body:{quorumTarget:3,quorumReachedCount:0,deadlineIso:'2027-01-01T00:00:00+01:00',nowIso:'2026-10-25T12:00:00+01:00',buyerId:'1',orderBuyerId:'1',buyerMarketingPaidCents:10000,verifiedMarketingDeliveredCents:10000,dedicatedRefundReserveCents:10000}});assert.equal(r.status,200);assert.equal(r.data.redemption.status,'WAITING_TIME_OR_QUORUM');assert.equal(r.data.paymentExecuted,false);});
test('44 new pricing interface is served',async()=>{const r=await fetch(base+'/commercial.html');assert.equal(r.status,200);assert.match(await r.text(),/Prezzo intelligente/);});
test('45 manifest is actually served with correct MIME',async()=>{const r=await fetch(base+'/manifest.webmanifest');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/application\/manifest\+json/);const m=await r.json();assert.equal(m.short_name,'SEVA');});
test('46 offline service worker served from same origin',async()=>{const r=await fetch(base+'/sw.js');assert.equal(r.status,200);assert.match(await r.text(),/Never cache \/api/);});
test('47 HTTP campaigns block anonymous user',async()=>{const r=await fetch(base+'/api/commercial/campaigns');assert.equal(r.status,401);});
test('48 save draft requires valid buyer consent for marketing',async()=>{const r=await call('/api/commercial/campaigns',{method:'POST',body:{quote:{months:1,marketingRequestedCents:10000,marketingConsentedCents:10000},terms:{quorumTarget:10,deadlineIso:'2027-12-31T00:00:00Z',marketingConsentConfirmed:false}}});assert.equal(r.status,400);});
test('49 authenticated customer saves consented draft, without payment',async()=>{const r=await call('/api/commercial/campaigns',{method:'POST',body:{quote:{months:1,marketingRequestedCents:10000,marketingConsentedCents:5000},terms:{quorumTarget:10,deadlineIso:'2027-12-31T00:00:00Z',marketingConsentConfirmed:true}}});assert.equal(r.status,201);assert.equal(r.data.paymentExecuted,false);});
test('50 customer reads their saved draft',async()=>{const r=await call('/api/commercial/campaigns');assert.equal(r.status,200);assert.equal(r.data.campaigns.length,1);assert.equal(r.data.campaigns[0].quote.marketingCents,5000);assert.equal(r.data.campaigns[0].status,'draft');});
test('51 backend lists monthly sales plan and gates by configuration',async()=>{const r=await call('/api/public/status');assert.equal(r.data.salesPlan,'MONTHLY_ONLY');assert.equal(r.data.salesPrice,'€50/mese');assert.equal(r.data.automaticRefundsEnabled,false);});
test('52 annual buyer checkout stays disabled without deployment gate',async()=>{const r=await call('/api/billing/checkout/annual',{method:'POST',body:{plan:'buyer'}});assert.equal(r.status,503);});
test('53 annual ecommerce checkout stays disabled without deployment gate',async()=>{const r=await call('/api/billing/checkout/annual',{method:'POST',body:{plan:'ecommerce'}});assert.equal(r.status,503);});
test('54 public status distinguishes annual tiers without claiming verified checkout',async()=>{const r=await call('/api/public/status');assert.equal(r.data.annualCheckoutEnabled,false);assert.deepEqual(r.data.annualPlans.map(x=>x.price),['€50/anno','€500/anno']);assert.equal(r.data.checkoutVerified,false);});

test('55 DBRELAY endpoint blocks unauthenticated requests',async()=>{
 const r=await fetch(base+'/api/dbrelay/snapshot');assert.equal(r.status,401);
});
test('56 DBRELAY status exposes only own persisted dataset metadata',async()=>{
 const r=await call('/api/dbrelay/status');assert.equal(r.status,200);
 assert.equal(r.data.service,'SEVA-DBRELAY');assert.equal(r.data.externalDataTransfer,false);
 assert.equal(r.data.paymentsExecuted,false);
});
test('57 DBRELAY initial snapshot contains current goal with no private cache',async()=>{
 const r=await call('/api/dbrelay/snapshot');assert.equal(r.status,200);
 assert.equal(r.data.goals.length,1);assert.equal(r.data.goals[0].title,'Audit payment webhook');
});
test('58 DBRELAY change feed emits IDs not private goal payload',async()=>{
 const r=await call('/api/dbrelay/changes?after=0&limit=10');assert.equal(r.status,200);
 assert.ok(r.data.changes.length>0);assert.equal(r.data.dataIncluded,false);
 assert.equal(JSON.stringify(r.data).includes('Audit payment webhook'),false);
});
test('59 DBRELAY malformed cursor returns 400',async()=>{
 const r=await call('/api/dbrelay/changes?after=-1&limit=10');assert.equal(r.status,400);
});

const studentInput={displayName:'Synthetic Student',university:'Example University',course:'Engineering',academicYear:'2026/2027',consent:true,declaration:true,noticeVersion:'2026-10-26',version:0};
test('60 student profile requires cookie authentication, forged identity headers do not count',async()=>{const r=await fetch(base+'/api/student',{headers:{'oai-authenticated-user-id':'forged-user'}});assert.equal(r.status,401);});
test('61 authenticated customer creates student profile',async()=>{const r=await call('/api/student',{method:'PUT',body:studentInput});assert.equal(r.status,200);assert.match(r.data.profile.studentId,/^SEVA-STU-/);assert.equal(r.data.profile.verificationStatus,'self_declared');});
test('62 student stale updates are rejected via HTTP',async()=>{const r=await call('/api/student',{method:'PUT',body:studentInput});assert.equal(r.status,409);});
test('63 student profile cannot be verified by client input',async()=>{const r=await call('/api/student',{method:'PUT',body:{...studentInput,version:1,verificationStatus:'verified'}});assert.equal(r.status,400);});
test('64 student write CSRF is rejected',async()=>{const r=await call('/api/student',{method:'PUT',headers:{Origin:'https://attacker.invalid'},body:{...studentInput,version:1}});assert.equal(r.status,403);});
test('65 signed-in student can delete their profile',async()=>{const r=await call('/api/student',{method:'DELETE',body:{version:1}});assert.equal(r.status,200);assert.equal((await call('/api/student')).data.profile,null);});

test('BLACK BOX partner opportunities require session authentication',async()=>{
 const r=await fetch(base+'/api/commerce/affiliate/opportunities');
 assert.equal(r.status,401);
});
test('BLACK BOX partner opportunities are read-only and never advertise earned income',async()=>{
 const r=await call('/api/commerce/affiliate/opportunities');
 assert.equal(r.status,200);
 assert.deepEqual(r.data.opportunities,[]);
 assert.equal(r.data.incomePaidCents,0);
 assert.equal(r.data.settlementExecuted,false);
 const post=await call('/api/commerce/affiliate/opportunities',{method:'POST',body:{commissionCents:100}});
 assert.equal(post.status,404);
});

test('Double Flywheel HTTP purchase preview is explicitly unfunded and charges nothing',async()=>{
 const r=await call('/api/commercial/marketing-benefit-preview',{method:'POST',body:{purchaseCents:10000,verifiedMerchantBudgetCents:10000,exclusiveAllocatedCents:0,contractCapCents:10000}});
 assert.equal(r.status,200);
 assert.equal(r.data.preview.potentialBenefitCents,0);
 assert.equal(r.data.preview.customerDueAtCheckoutCents,10000);
 assert.equal(r.data.preview.paymentExecuted,false);
 assert.equal(r.data.settlementExecuted,false);
 assert.equal(r.data.receiptVerifiedByServer,false);
});
test('Double Flywheel UI is served with explicit non-guaranteed benefit language',async()=>{
 const r=await fetch(base+'/commercial.html');assert.equal(r.status,200);
 const html=await r.text();
 assert.match(html,/Double Flywheel/);
 assert.match(html,/Non attesta|non prova un acquisto gratuito/i);
});


test('OMNICHANNEL: notifications require authenticated account',async()=>{
 const r=await fetch(base+'/api/notifications');
 assert.equal(r.status,401);
 const p=await fetch(base+'/api/notifications/preferences');
 assert.equal(p.status,401);
});
test('OMNICHANNEL: default is opt-out and no remote push',async()=>{
 const r=await call('/api/notifications/preferences');
 assert.equal(r.status,200);
 assert.equal(r.data.preferences.inApp,false);
 assert.equal(r.data.preferences.backgroundPush,false);
 assert.equal(r.data.preferences.whatsAppAutomatic,false);
});
test('OMNICHANNEL: explicit opt-in receives a generic verified-goal alert',async()=>{
 let r=await call('/api/notifications/preferences',{method:'PUT',body:{inApp:true,browser:false}});
 assert.equal(r.status,200);
 const goal=await call('/api/goals',{method:'POST',body:{title:'Synthetic-private-mission',status:'done'}});
 assert.equal(goal.status,201);
 r=await call('/api/notifications');
 assert.equal(r.status,200);
 assert.ok(r.data.notifications.length>=1);
 assert.equal(r.data.notifications[0].kind,'goal_done');
 assert.equal(JSON.stringify(r.data).includes('Synthetic-private-mission'),false);
});
test('OMNICHANNEL: account B cannot read notifications for account A',async()=>{
 const res=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'other-notify@example.invalid',password:'LongSyntheticPassword-12345'})});
 assert.equal(res.status,201);
 const bCookie=res.headers.get('set-cookie').split(';')[0];
 const other=await fetch(base+'/api/notifications',{headers:{Cookie:bCookie}});
 assert.equal(other.status,200);
 assert.deepEqual((await other.json()).notifications,[]);
});
test('OMNICHANNEL: notice IDs cannot be acknowledged by another account',async()=>{
 const a=await call('/api/notifications');
 const id=a.data.notifications[0].id;
 const other=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'other-notify@example.invalid',password:'LongSyntheticPassword-12345'})});
 const otherCookie=other.headers.get('set-cookie').split(';')[0];
 const r=await fetch(base+'/api/notifications/read',{method:'POST',headers:{Cookie:otherCookie,'content-type':'application/json'},body:JSON.stringify({id})});
 assert.equal(r.status,404);
 const mine=await call('/api/notifications/read',{method:'POST',body:{id}});
 assert.equal(mine.status,200);
});
test('OMNICHANNEL: opt-out erases only own alerts',async()=>{
 const r=await call('/api/notifications',{method:'DELETE'});
 assert.equal(r.status,200);
 const p=await call('/api/notifications/preferences');
 assert.equal(p.data.preferences.inApp,false);
 assert.equal((await call('/api/notifications')).data.notifications.length,0);
});
test('OMNICHANNEL: mobile page and cached module exist',async()=>{
 const html=await (await fetch(base+'/')).text();
 assert.match(html,/Canali e avvisi/);
 assert.match(html,/WhatsApp/);
 const script=await fetch(base+'/notifications-ui.js');
 assert.equal(script.status,200);
 assert.match(await script.text(),/initializeNotifications/);
});


test('SEVA 100+ communication route blocks anonymous draft generation',async()=>{
 const r=await fetch(base+'/api/communications/draft',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
  channel:'whatsapp',purpose:'customer_support',subject:'Consulenza',context:'Supporto obiettivi, dettagli verificati'
 })});
 assert.equal(r.status,401);
});
test('SEVA 100+ marketing draft without permission is rejected before OpenAI',async()=>{
 const r=await call('/api/communications/draft',{method:'POST',body:{
  channel:'whatsapp',purpose:'offer',subject:'Servizio',context:'Descrizione del servizio'
 }});
 assert.equal(r.status,403);
});
test('SEVA 100+ non-paying synthetic account cannot make paid OpenAI request',async()=>{
 const r=await call('/api/communications/draft',{method:'POST',body:{
  channel:'email',purpose:'customer_support',subject:'Servizio',context:'Supporto ai clienti'
 }});
 assert.equal(r.status,402);
});
test('SEVA 100+ mobile command center and AI draft studio served as static shell',async()=>{
 const page=await fetch(base+'/');
 assert.equal(page.status,200);
 const html=await page.text();
 assert.match(html,/Il tuo centro operativo/);
 assert.match(html,/data-open-tab="communications"/);
 assert.match(html,/communicationForm/);
 assert.match(html,/approvazione|inviate|invio automatico/i);
 const js=await fetch(base+'/communications-ui.js');
 assert.equal(js.status,200);
 assert.match(await js.text(),/initializeCommunications/);
});


test('ORIGINAL SEVA: analytics access denied to anonymous users',async()=>{
 const r=await fetch(base+'/api/analytics/overview');assert.equal(r.status,401);
});
test('ORIGINAL SEVA: owner-specific KPI actual goal counts and no invented earnings',async()=>{
 const r=await call('/api/analytics/overview');assert.equal(r.status,200);
 assert.ok(r.data.goals.total>=1);
 assert.equal(r.data.disclaimers.proposalMoneyIsRevenue,false);
 assert.equal(r.data.disclaimers.savingsAreGuaranteed,false);
 assert.ok(Number.isFinite(r.data.goals.completionPercent));
});
test('ORIGINAL SEVA: CRM consent required, no photo bytes persisted',async()=>{
 const no=await call('/api/lastre/intents',{method:'POST',body:{category:'buy',description:'Need laptop',budgetCents:70000,consent:false}});
 assert.equal(no.status,400);
 const r=await call('/api/lastre/intents',{method:'POST',body:{category:'lease',description:'Synthetic leasing request',budgetCents:170000,consent:true}});
 assert.equal(r.status,201);
 assert.equal(r.data.photosStored,false);
 const b=await call('/api/lastre/intents');assert.equal(b.status,200);
 assert.ok(b.data.intents.some(x=>x.description==='Synthetic leasing request'));
 assert.equal(b.data.photosStored,false);
 const del=await call('/api/lastre/intents/'+r.data.id,{method:'DELETE'});
 assert.equal(del.status,200);assert.equal(del.data.deleted,true);
});
test('ORIGINAL SEVA: anonymous CRM denied and image processing refuses missing provider',async()=>{
 assert.equal((await fetch(base+'/api/lastre/intents')).status,401);
 const r=await call('/api/lastre/analyze',{method:'POST',body:{consentToAI:false}});
 assert.equal(r.status,503);
});
test('ORIGINAL SEVA: KPI, Lastre and AI opt-in sections bundled into mobile shell',async()=>{
 const resp=await fetch(base+'/');assert.equal(resp.status,200);
 const html=await resp.text();
 for(const section of ['data-tab="analytics"','data-tab="lastre"','id="lastreCRMConsent"','id="lastreAIConsent"','id="localPhoto"','id="kpiMeter"'])
  assert.ok(html.includes(section),section);
 const js=await fetch(base+'/original-intelligence-ui.js');assert.equal(js.status,200);
 const client=await js.text();
 assert.match(client,/localPrivacyJpeg/);
 assert.match(client,/initializeOriginalIntelligence/);
});
