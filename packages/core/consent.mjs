export function requireConsent({consent, purpose}){
  if(!consent?.granted) throw new Error('CONSENT_REQUIRED');
  if(consent.purpose && consent.purpose!==purpose) throw new Error('CONSENT_PURPOSE_MISMATCH');
  return {granted:true, at:consent.at||new Date().toISOString(), purpose};
}
