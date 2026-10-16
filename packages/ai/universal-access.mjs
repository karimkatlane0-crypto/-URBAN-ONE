import {requireAuthorization} from '../security/policy.mjs';
import {sanitizeObject} from '../security/sanitize.mjs';
import {envelope} from '../core/provenance.mjs';
import {requireConsent} from '../core/consent.mjs';

export function prepareUniversalAccess({ctx, consent, sourceRef, purpose, scope, data}){
  requireAuthorization({...ctx, scope:'prepare:provider'});
  const consentReceipt=requireConsent({consent,purpose});
  const sanitized=sanitizeObject(data);
  const prepared=envelope({sourceRef,purpose,scope,data:sanitized});
  return {state:'prepared', providerCallPerformed:false, consent:consentReceipt, prepared};
}
