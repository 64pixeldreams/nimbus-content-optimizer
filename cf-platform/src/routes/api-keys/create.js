/**
 * Create API key route - wraps api-key module create endpoint
 */

import { createKey } from '../../modules/api-key/endpoints/create.js';

export async function create(request, env, ctx, auth) {
  return createKey(request, env, ctx, auth);
}
