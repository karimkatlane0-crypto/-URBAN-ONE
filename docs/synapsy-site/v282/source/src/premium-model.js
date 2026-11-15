// Only explicit, self-declared criteria enter this catalog. No CRM import,
// browser-history inference, purchased lists, scraping or identity enrichment.
export const PREMIUM_POLICY = 'synapsy-premium-2026-11-15';
export const PREMIUM_COUNTRIES = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','CH','GB'];
export const PREMIUM_SECTORS = ['property','bnb'];
export const PREMIUM_INTENTS = ['buy','rent','sell','mandate','stay'];
export const PREMIUM_BUDGETS = ['under_1000','1000_10000','10000_100000','over_100000','unspecified'];
export const PREMIUM_HORIZONS = ['now','three_months','later'];
export const premiumError = (message,status=400,code='invalid_request') => Object.assign(Error(message),{premiumStatus:status,premiumCode:code});
export function premiumText(value,max,required=true) {
 if(typeof value!=='string'||value.length>max||(required&&!value.trim())||/[\u0000-\u001f\u007f<>]/.test(value))throw premiumError('Controlla i campi di testo.');
 return value.trim();
}
export function premiumCity(value,required=true){const text=premiumText(value,70,required);if(text&&!/^[\p{L}\p{M} .’'()\-]+$/u.test(text))throw premiumError('Indica soltanto il comune, senza indirizzo, recapiti o CAP.');return text;}
export function premiumValidateCandidate(body,now) {
 const firstName=premiumText(body.firstName,60),lastName=premiumText(body.lastName,80),phone=premiumText(body.phone,18);
 if(!/^\+[1-9]\d{7,14}$/.test(phone))throw premiumError('Indica il tuo numero in formato internazionale, per esempio +39 seguito dal numero.');
 if(!PREMIUM_SECTORS.includes(body.sector)||!PREMIUM_INTENTS.includes(body.intent)||!PREMIUM_COUNTRIES.includes(body.country)||!PREMIUM_BUDGETS.includes(body.budgetBand)||!PREMIUM_HORIZONS.includes(body.horizon))throw premiumError('Scegli settore, finalità, Paese, fascia e periodo tra le opzioni disponibili.');
 if((body.sector==='property'&&body.intent==='stay')||(body.sector==='bnb'&&!['stay','mandate'].includes(body.intent)))throw premiumError('La finalità deve corrispondere al settore.');
 if(body.serviceConsent!==true||typeof body.listed!=='boolean')throw premiumError('Leggi l’informativa e conferma la gestione della tua richiesta.');
 const marketing=body.marketing;
 if(!marketing||Array.isArray(marketing)||Object.keys(marketing).length!==3||!['email','whatsapp','messenger'].every(k=>typeof marketing[k]==='boolean'))throw premiumError('Scegli separatamente le preferenze facoltative per ciascun canale.');
 return {firstName,lastName,phone,sector:body.sector,intent:body.intent,country:body.country,city:premiumCity(body.city),budgetBand:body.budgetBand,horizon:body.horizon,marketing:{email:marketing.email,whatsapp:marketing.whatsapp,messenger:marketing.messenger},policy:PREMIUM_POLICY,serviceConsentAt:now,marketingRecordedAt:now,source:'self_declared',phoneVerified:false};
}
export function premiumOfferCatalog(){return {
 schema:'synapsy-premium-offers',version:1,reviewedOn:'2026-11-15',merchant:'Karim Katlane',currency:'eur',
 consultation:{id:'premium-contact-consultation',amountCents:100,currency:'eur',unit:'one_authorized_contact_consultation',chargeEnabled:false,accessEnabled:false,taxTreatment:'to_confirm',requirements:['person_approval','verified_contact','published_sale_terms','configured_price','verified_payment','access_and_refund_test']},
 subscription:{id:'premium-pro',amountCents:20000,currency:'eur',interval:null,chargeEnabled:false,automaticRenewal:false,taxTreatment:'to_confirm',requirements:['billing_interval','included_services','published_sale_terms','configured_price','verified_payment']},
 application:{priceCents:0,publication:'voluntary_structured_card_without_name_or_phone',retentionDays:90,contactVerification:'not_implemented',source:'self_declared',automaticOutreach:false,marketingConsentFromCookies:false,thirdPartyCosts:'separate'},
 privacy:'/premium#privacy',workspace:'/premium',api:'/api/premium',catalog:'/api/premium/catalog',terms:'/premium#offers'
};}
export function premiumOwnCandidate(row,now){
 if(!row)return null;const data=JSON.parse(row.data_json),expired=row.expires_at<=now;
 return {id:row.id,revision:row.revision,firstName:data.firstName||'',lastName:data.lastName||'',phone:data.phone||'',sector:data.sector||'property',intent:data.intent||'buy',country:data.country||'IT',city:data.city||'',budgetBand:data.budgetBand||'unspecified',horizon:data.horizon||'later',marketing:data.marketing||{email:false,whatsapp:false,messenger:false},published:row.listed===1&&!expired,expiresAt:row.expires_at,createdAt:row.created_at,updatedAt:row.updated_at,source:'self_declared',phoneVerified:false,policy:data.policy||PREMIUM_POLICY,withdrawn:!data.firstName,expired};
}
export function premiumCard(row){const data=JSON.parse(row.data_json);return {id:row.id,sector:data.sector,intent:data.intent,country:data.country,city:data.city,budgetBand:data.budgetBand,horizon:data.horizon,expiresAt:row.expires_at,source:'self_declared'};}
export function premiumConsultationView(row,now){return {id:row.id,revision:row.revision,candidateId:row.candidate_id,professionalName:row.professional_name,company:row.company,purpose:row.purpose,status:row.status,expired:row.expires_at<=now,createdAt:row.created_at,expiresAt:row.expires_at,approvedAt:row.approved_at||null,paymentStatus:'unpaid',amountCents:100,currency:'eur',contact:null,chargeEnabled:false,accessEnabled:false};}
export function premiumOpenAPI(){return {openapi:'3.1.0',info:{title:'SYNAPSY Premium voluntary matching',version:'1.0.0',description:'Account-scoped self-declarations and named-recipient approvals. No payment or contact disclosure is enabled in this release.'},servers:[{url:'https://seva.karimkatlane0.chatgpt.site'}],paths:{'/api/premium/offers':{get:{summary:'Public offer and activation prerequisites',responses:{200:{description:'Offer configuration'}}}},'/api/premium':{get:{summary:'Read own candidate and own consultation requests',responses:{200:{description:'Private workspace'},401:{description:'Sign in required'}}},post:{summary:'Save self-declaration, request, approve, decline, revoke marketing, revoke sharing or withdraw',description:'Requires Sign in with ChatGPT, same-origin JSON and X-SEVA-Workspace from the current browser session. operationId is mandatory; stale revisions return 409. Candidate owner grants consent; professional cannot approve their own request. Privacy withdrawals remain available beyond the operational quota.',responses:{200:{description:'Updated private workspace'},400:{description:'Invalid fields'},403:{description:'Action not authorized'},409:{description:'Stale state or conflicting operation'}}}},'/api/premium/catalog':{get:{summary:'Read a bounded shortlist of voluntary cards without names or phone numbers',parameters:['sector','intent','country','city'].map(name=>({name,in:'query',required:false,schema:{type:'string'}})),responses:{200:{description:'At most 50 matching cards; not a market-wide count'},401:{description:'Sign in required'}}}},'/api/premium/checkout':{post:{summary:'Payment activation gate',responses:{409:{description:'New offer billing, contact verification and fulfillment gates are not complete; no payment is initiated'}}}}}};}
