const text=(value,max=190)=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=max?value.trim():null;
const iso=value=>{const d=new Date(value);return Number.isFinite(d.getTime())?d.toISOString():null;};

/** SYNAPSY is canonical. Only stable opaque IDs and operationally necessary fields are mapped. */
export function mapSynapsyProfile(record){
  if(!record||typeof record!=='object'||Array.isArray(record))throw new TypeError('Profile record is required');
  const customerId=text(record.customer_id,128),tenantId=text(record.tenant_id,128);
  if(!customerId||!tenantId)throw new TypeError('Canonical customer_id and tenant_id are required');
  const profile={external_id:customerId,properties:{synapsy_tenant_id:tenantId}};
  const email=text(record.email,254),phone=text(record.phone_e164,32);
  if(email)profile.email=email.toLowerCase();
  if(phone)profile.phone_number=phone;
  for(const key of ['first_name','last_name','locale']){
    const value=text(record[key],80);if(value)profile[key]=value;
  }
  return Object.freeze(profile);
}

/** Missing, stale, ambiguous or revoked consent always denies marketing eligibility. */
export function isKlaviyoMarketingConsentValid(consent,{channel='email',now=new Date()}={}){
  if(!consent||typeof consent!=='object'||Array.isArray(consent))return false;
  const grant=consent[channel];
  if(!grant||typeof grant!=='object'||grant.granted!==true||grant.status!=='granted')return false;
  if(grant.revokedAt||grant.suppressed===true)return false;
  if(!text(grant.source,120)||!text(grant.method,80)||!text(grant.evidenceId,160))return false;
  const occurredAt=iso(grant.occurredAt);
  if(!occurredAt||new Date(occurredAt)>new Date(now))return false;
  if(grant.expiresAt&&(!iso(grant.expiresAt)||new Date(grant.expiresAt)<=new Date(now)))return false;
  return true;
}

export function buildKlaviyoEvent({tenantId,customerId,eventId,eventName,eventTime,properties={},consent}){
  const tenant=text(tenantId,128),customer=text(customerId,128),id=text(eventId,160),name=text(eventName,120),time=iso(eventTime);
  if(!tenant||!customer||!id||!name||!time)throw new TypeError('Tenant, customer, idempotency ID, event name and valid event time are required');
  if(!isKlaviyoMarketingConsentValid(consent,{channel:'email'}))throw new Error('MARKETING_CONSENT_NOT_VERIFIED');
  if(!properties||typeof properties!=='object'||Array.isArray(properties))throw new TypeError('Event properties must be an object');
  return Object.freeze({unique_id:id,metric:name,profile:{external_id:customer},
    properties:{...properties,synapsy_tenant_id:tenant,source_system:'SEVA'},time});
}
