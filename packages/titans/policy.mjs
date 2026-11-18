export const TITANS_POLICY = Object.freeze({
  version: '1.0.1',
  denyByDefault: true,
  sideEffects: Object.freeze(['WRITE','SEND','SHARE','DELETE']),
  actions: Object.freeze(['READ','DRAFT','WRITE','SEND','SHARE','DELETE'])
});

export function assessTitansAction({provider, action, scope, grant, now = Date.now()} = {}) {
  const deny = reason => Object.freeze({allowed:false, reason});
  if (!TITANS_POLICY.actions.includes(action)) return deny('ACTION_NOT_ALLOWLISTED');

  // DRAFT is a local composition operation: it must not require a provider,
  // grant, consent record, or authenticated external actor.
  if (action === 'DRAFT') return Object.freeze({allowed:true, reason:'LOCAL_DRAFT_ONLY', externalSideEffect:false});

  // Every provider-backed action remains fail-closed.
  if (!provider || typeof provider !== 'object') return deny('PROVIDER_UNRESOLVED');
  if (provider.status !== 'connected') return deny('PROVIDER_NOT_CONNECTED');
  if (!grant || grant.revoked === true) return deny('GRANT_MISSING_OR_REVOKED');
  if (grant.providerId !== provider.id || grant.scope !== scope) return deny('GRANT_SCOPE_MISMATCH');
  if (!Number.isFinite(Date.parse(grant.expiresAt)) || Date.parse(grant.expiresAt) <= now) return deny('GRANT_EXPIRED_OR_INVALID');
  if (grant.authenticatedActor !== true) return deny('ACTOR_NOT_AUTHENTICATED');
  if (!Array.isArray(provider.scopes) || !provider.scopes.includes(scope)) return deny('PROVIDER_SCOPE_NOT_GRANTED');
  if (TITANS_POLICY.sideEffects.includes(action)) {
    if (grant.explicitActionApproval !== true) return deny('EXPLICIT_ACTION_APPROVAL_REQUIRED');
    if (typeof grant.consentRecordId !== 'string' || !grant.consentRecordId.trim()) return deny('CONSENT_EVIDENCE_REQUIRED');
  }
  return Object.freeze({allowed:true, reason:'SCOPED_GRANT_VALID', externalSideEffect:TITANS_POLICY.sideEffects.includes(action)});
}

export function summarizeProviderStates(providers = []) {
  return providers.map(p => Object.freeze({
    id:p.id,
    label:p.label,
    status:p.status,
    usable:p.status === 'connected'
  }));
}
