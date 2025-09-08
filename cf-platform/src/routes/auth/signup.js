/**
 * Signup route - wraps auth module signup endpoint
 */

import { signup as authSignup } from '../../modules/auth/endpoints/signup.js';

export async function signup(request, env, ctx) {
  return authSignup(request, env);
}
