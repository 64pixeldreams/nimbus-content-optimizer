/**
 * Logout route - wraps auth module logout endpoint
 */

import { logout as authLogout } from '../../modules/auth/endpoints/logout.js';

export async function logout(request, env, ctx, auth) {
  return authLogout(request, env, ctx, auth);
}
