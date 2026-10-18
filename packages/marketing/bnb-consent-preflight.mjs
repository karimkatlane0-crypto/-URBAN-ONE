// URBAN ONE — EU27 B&B direct-marketing preflight.
// Pure, dry-run validation. NEVER dispatches email, SMS, or other messages.
// Input records MUST come from a private consent-management service, never from
// public GitHub or client-side declarations. The caller verifies authenticity.

const EU27=new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);
const CHANNELS=new Set(['EMAIL','SMS']);
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164=/^\+[1-9]\d{6,14}$/;
function nonempty(s){return typeof s==='string'&&s.trim().length>0}
function timestamp(s){return typeof s==='string'&&/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(s)&&Number.isFinite(Date.parse(s))&&Date.parse(s)<=Date.now()}
function evidence(s){return nonempty(s)&&s.length<=512}
function key(channel,address){return channel+':'+String(address||'').trim().toLowerCase()}

// audience: verified private contact records; suppressed: private opt-out ledger
// countryReviews: independent country/channel legal clearance after review
export function preflightBnbConsentCampaign({
  audience=[],suppressed=[],countryReviews=[],campaign={}
}={}){
  if(!Array.isArray(audience)||audience.length>50000||!Array.isArray(suppressed)||
     !Array.isArray(countryReviews)||!campaign||typeof campaign!=='object')
    throw new Error('INVALID_PREFLIGHT_INPUT');
  const channel=campaign.channel;
  if(!CHANNELS.has(channel))throw new Error('INVALID_CHANNEL');
  if(!nonempty(campaign.id)||!nonempty(campaign.purpose)||
     !nonempty(campaign.senderIdentityRef)||!nonempty(campaign.privacyNoticeUrl))
    throw new Error('CAMPAIGN_METADATA_REQUIRED');
  // A work-in-progress campaign may be audited, never dispatched by this module.
  const deny=new Set(suppressed.map(x=>key(x.channel,x.address)));
  const allowedReviews=new Set(countryReviews.filter(x=>
    x?.approved===true&&x.channel===channel&&EU27.has(x.country)&&
    evidence(x.legalReviewRef)&&timestamp(x.reviewedAt)
  ).map(x=>x.country+':'+x.channel));
  const seen=new Set(),eligible=[],blocked=[];
  for(const rec of audience){
    const reasons=[];
    if(!rec||typeof rec!=='object'){blocked.push({id:null,reasons:['INVALID_RECORD']});continue}
    const address=String(rec.contact||'').trim();
    const recKey=key(channel,address);
    if(!nonempty(rec.recordId)||!nonempty(rec.organization))reasons.push('ORG_AND_RECORD_REQUIRED');
    if(!EU27.has(rec.country))reasons.push('EU_COUNTRY_REQUIRED');
    if(rec.channel!==channel)reasons.push('CHANNEL_MISMATCH');
    if(channel==='EMAIL'&&!EMAIL.test(address))reasons.push('EMAIL_INVALID');
    if(channel==='SMS'&&!E164.test(address))reasons.push('PHONE_E164_REQUIRED');
    if(deny.has(recKey)||rec.optOut===true||rec.revoked===true)reasons.push('SUPPRESSED');
    if(seen.has(recKey))reasons.push('DUPLICATE');
    if(rec.consentStatus!=='granted'||rec.consentChannel!==channel||
       rec.consentPurpose!==campaign.purpose||!timestamp(rec.consentedAt)||
       !evidence(rec.consentProofRef)||!evidence(rec.consentTextRef))
      reasons.push('CHANNEL_AND_PURPOSE_OPT_IN_PROOF_REQUIRED');
    if(!evidence(rec.sourceRef)||!timestamp(rec.sourceCheckedAt))
      reasons.push('CONTACT_PROVENANCE_REQUIRED');
    if(!allowedReviews.has(rec.country+':'+channel))reasons.push('COUNTRY_CHANNEL_LEGAL_REVIEW_REQUIRED');
    if(!nonempty(rec.unsubscriptionMethod))reasons.push('OPT_OUT_METHOD_REQUIRED');
    seen.add(recKey);
    if(reasons.length)blocked.push({id:rec.recordId||null,reasons});
    else eligible.push({id:rec.recordId,country:rec.country,channel,consentProofRef:rec.consentProofRef});
  }
  return Object.freeze({
    status:'DRY_RUN_ONLY',
    campaignId:campaign.id,
    channel,
    examined:audience.length,
    eligible,
    blocked,
    sendAuthorized:false,
    dispatchPerformed:false,
    providerConnected:false,
    requiredBeforeSend:['CONSENT_LEDGER_AUTHENTICITY_VERIFIED',
      'REVIEW_MESSAGE_AND_PRIVACY_NOTICE','PROVIDER_ACCOUNT_CONNECTED',
      'USER_APPROVES_EXACT_RECIPIENT_SET_AND_COST','CONFIRM_OPTOUT_SYNC']
  });
}
