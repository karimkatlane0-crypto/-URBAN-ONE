import { createApiServer } from './server.mjs';
import { createJwtAuthenticator } from './jwt-authenticator.mjs';
import { createPostgresMembershipResolver } from './postgres-membership-resolver.mjs';

/**
 * Runtime composition for an approved OIDC/JWKS authority and an already
 * provisioned PostgreSQL pool. It creates no resources and performs no
 * migrations. Missing IAM configuration remains fail-closed.
 */
export function createPlatformApiServer({
  env = process.env,
  pool,
  roleScopes,
  fetchImpl,
  nowSeconds
} = {}) {
  const resolveMembership = createPostgresMembershipResolver({ pool, roleScopes });
  const authenticate = createJwtAuthenticator({ env, resolveMembership, fetchImpl, nowSeconds });
  return createApiServer({ env, authenticate });
}
