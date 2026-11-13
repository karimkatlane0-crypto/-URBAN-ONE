// SEVA Skebby adapter: prepares requests only. No network calls or credentials.
export function prepareSkebbySms({tenantId,recipients,text,consentRefs,approved=false,providerConfigured=false}) {
 if(typeof tenantId!=='string'||!tenantId.trim()) throw Error('Missing tenant');
 if(!Array.isArray(recipients)||recipients.length===0||recipients.length>100) throw Error('Invalid recipients');
 if(typeof text!=='string'||!text.trim()||text.length>1600) throw Error('Invalid text');
 if(!Array.isArray(consentRefs)||consentRefs.length!==recipients.length||
    consentRefs.some(x=>typeof x!=='string'||!x.trim())) throw Error('Consent missing');
 if(new Set(recipients).size!==recipients.length) throw Error('Duplicate recipients');
 if(recipients.some(x=>typeof x!=='string'||!/^\\+[1-9]\\d{6,14}$/.test(x))) throw Error('Invalid E164 recipient');
 if(!approved||!providerConfigured) throw Error('Human approval or provider configuration missing');
 return Object.freeze({tenantId,recipients:[...recipients],text,consentRefs:[...consentRefs],
   status:'PREPARED_NOT_SENT',provider:'skebby',networkExecuted:false});
}
export function acknowledgeSkebbyDelivery(prepared,{providerMessageId,deliveryState}) {
 if(prepared.status!=='PREPARED_NOT_SENT'||!providerMessageId||
    !['ACCEPTED','DELIVERED','FAILED'].includes(deliveryState)) throw Error('Invalid provider receipt');
 return {...prepared,status:deliveryState,providerMessageId};
}
