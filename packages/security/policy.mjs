export const roles = Object.freeze({
  viewer: ['read:public','read:workspace'],
  operator: ['read:public','read:workspace','write:workspace','prepare:provider'],
  admin: ['*']
});

export function authorize({ role, scope }) {
  const grants = roles[role] || [];
  return grants.includes('*') || grants.includes(scope);
}

export function requireAuthorization(ctx) {
  if (!ctx?.userId) throw new Error('AUTH_REQUIRED');
  if (!authorize(ctx)) throw new Error('FORBIDDEN');
  return true;
}
