// Deterministic PUBLIC-CAMPAIGN preview policy only.
// WARNING: NOT authentication, entitlement, reservation or server authorization.
// Apply this rule ONLY in a private, server-side, authenticated system after
// evidence of partner's right to publish. Never use a browser-only flag to guard confidential data.
export const PREVIEW_STATE='POLICY_SIMULATION_ONLY';
const DAY=24*60*60*1000;
const iso=x=>typeof x==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(x)&&Number.isFinite(Date.parse(x));
const mock=x=>typeof x==='string'&&/^mock-[a-zA-Z0-9_-]{1,48}$/.test(x);
export function evaluate24HourPreview({publishAt,now,scope='public_news',memberOptedIn=false,consentRef,rightsVerified=false}={}){
  if(!iso(publishAt)||!iso(now)) throw new Error('UTC_TIMESTAMP_REQUIRED');
  if(!['public_news','authorized_partner_offer'].includes(scope))throw new Error('UNAUTHORIZED_CONTENT_SCOPE');
  if(rightsVerified!==true)return {access:'blocked',reason:'PUBLISHER_RIGHTS_NOT_VERIFIED',simulation:true};
  const window=Date.parse(publishAt),date=Date.parse(now);
  if(date>=window)return {access:'public',reason:'PUBLIC_RELEASE_WINDOW',simulation:true};
  const previewStarts=window-DAY;
  if(date<previewStarts)return {access:'scheduled',reason:'BEFORE_24H_WINDOW',simulation:true};
  if(memberOptedIn===true&&mock(consentRef))return {access:'preview',reason:'OPT_IN_PREVIEW_WINDOW',simulation:true};
  return {access:'scheduled',reason:'NO_VERIFIED_PREVIEW_OPT_IN',simulation:true};
}
export function noPartnerDataAccess({providerAuthorized=false,propertyAuthorized=false}={}){
 if(providerAuthorized!==true||propertyAuthorized!==true)return {bookingAccess:false,guestDataAccess:false,otaPriceAccess:false,reason:'APPROVAL_REQUIRED'};
 return {bookingAccess:false,guestDataAccess:false,otaPriceAccess:false,reason:'PROVIDER_CERTIFICATION_AND_BACKEND_REQUIRED'};
}
