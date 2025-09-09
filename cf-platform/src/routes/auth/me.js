/**
 * Me route - wraps auth module me endpoint
 */

import { me as authMe } from '../../modules/auth/endpoints/me.js';

export async function me(request, env, ctx, auth) {
  return authMe(request, env, ctx, auth);
}
