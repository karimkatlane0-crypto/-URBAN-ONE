const ROLES = new Set(['owner','admin','operator','analyst','member','viewer']);

export function createPostgresMembershipResolver({ pool, roleScopes = {} } = {}) {
  if (!pool || typeof pool.connect !== 'function') throw new Error('IAM_MEMBERSHIP_POOL_REQUIRED');
  if (!roleScopes || typeof roleScopes !== 'object' || Array.isArray(roleScopes)) {
    throw new Error('IAM_ROLE_SCOPE_POLICY_INVALID');
  }
  const scopePolicy = new Map();
  for (const [role, scopes] of Object.entries(roleScopes)) {
    if (!ROLES.has(role) || !Array.isArray(scopes) ||
        scopes.some(scope => typeof scope !== 'string' || !scope || scope.length > 128)) {
      throw new Error('IAM_ROLE_SCOPE_POLICY_INVALID');
    }
    scopePolicy.set(role, Object.freeze([...new Set(scopes)]));
  }

  return async function resolveMembership({ actorId, tenantId } = {}) {
    if (typeof actorId !== 'string' || !actorId || actorId.length > 200 ||
        typeof tenantId !== 'string' || !tenantId) return null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await client.query(
        'SELECT role,status FROM super_ai.tenant_memberships WHERE tenant_id=$1 AND actor_id=$2 LIMIT 1',
        [tenantId, actorId]
      );
      await client.query('COMMIT');
      const row = result.rows?.[0];
      if (!row || row.status !== 'active' || !ROLES.has(row.role)) return null;
      const scopes = scopePolicy.get(row.role);
      if (!scopes) return null;
      return Object.freeze({
        tenantId,
        role: row.role,
        status: row.status,
        scopes
      });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  };
}
