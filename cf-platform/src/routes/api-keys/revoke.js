/**
 * Revoke API key route - wraps api-key module revoke endpoint
 */

import { revokeKey } from '../../modules/api-key/endpoints/revoke.js';

export async function revoke(request, env, ctx, auth) {
  return revokeKey(request, env, ctx, auth, request.params);
}
