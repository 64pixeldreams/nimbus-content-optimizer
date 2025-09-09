/**
 * Login route - wraps auth module login endpoint
 */

import { login as authLogin } from '../../modules/auth/endpoints/login.js';

export async function login(request, env, ctx) {
  return authLogin(request, env);
}
