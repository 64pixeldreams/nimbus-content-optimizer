/**
 * Get API key info route - wraps api-key module info endpoint
 */

import { getKeyInfo } from '../../modules/api-key/endpoints/info.js';

export async function get(request, env, ctx, auth) {
  return getKeyInfo(request, env, ctx, auth, request.params);
}
