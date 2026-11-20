/**
 * TITANS one-click request decision policy.
 *
 * Pure decision logic only: no network, contact import, message, payment,
 * provider call, or data sharing is performed here. Production callers must
 * authenticate the recipient server-side and persist the returned audit event
 * transactionally before exposing any resulting grant.
 */
export const TITANS_REQUEST_DECISIONS = Object.freeze(['accept', 'decline']);

const deny = reason => Object.freeze({ allowed: false, reason });

export function decideTitansRequest({
  request,
  actorId,
  actorAuthenticated,
  decision,
  now = Date.now()
} = {}) {
  if (!request || typeof request !== 'object') return deny('REQUEST_REQUIRED');
  if (typeof request.id !== 'string' || !request.id.trim()) return deny('REQUEST_ID_REQUIRED');
  if (request.status !== 'pending') return deny('REQUEST_NOT_PENDING');
  if (typeof request.recipientId !== 'string' || !request.recipientId.trim()) return deny('RECIPIENT_REQUIRED');
  if (actorAuthenticated !== true) return deny('ACTOR_NOT_AUTHENTICATED');
  if (typeof actorId !== 'string' || actorId !== request.recipientId) return deny('ACTOR_NOT_RECIPIENT');
  if (!Number.isFinite(Date.parse(request.expiresAt)) || Date.parse(request.expiresAt) <= now) {
    return deny('REQUEST_EXPIRED_OR_INVALID');
  }
  if (!TITANS_REQUEST_DECISIONS.includes(decision)) return deny('DECISION_NOT_ALLOWLISTED');

  const scopes = request.requestedScopes;
  if (!Array.isArray(scopes) || scopes.length === 0 ||
      scopes.some(scope => typeof scope !== 'string' || !scope.trim()) ||
      new Set(scopes).size !== scopes.length) {
    return deny('REQUEST_SCOPES_INVALID');
  }
  if (typeof request.purpose !== 'string' || !request.purpose.trim()) {
    return deny('REQUEST_PURPOSE_REQUIRED');
  }

  const decidedAt = new Date(now).toISOString();
  const auditEvent = Object.freeze({
    event: decision === 'accept' ? 'REQUEST_ACCEPTED' : 'REQUEST_DECLINED',
    requestId: request.id,
    actorId,
    decidedAt,
    purpose: request.purpose,
    scopes: Object.freeze([...scopes])
  });

  if (decision === 'decline') {
    return Object.freeze({
      allowed: true,
      decision,
      requestStatus: 'declined',
      grant: null,
      auditEvent
    });
  }

  return Object.freeze({
    allowed: true,
    decision,
    requestStatus: 'accepted',
    grant: Object.freeze({
      requestId: request.id,
      recipientId: request.recipientId,
      purpose: request.purpose,
      scopes: Object.freeze([...scopes]),
      grantedAt: decidedAt,
      expiresAt: request.expiresAt,
      revoked: false
    }),
    auditEvent
  });
}
