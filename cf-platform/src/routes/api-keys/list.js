/**
 * List API keys route - wraps api-key module list endpoint
 */

import { listKeys } from '../../modules/api-key/endpoints/list.js';

export async function list(request, env, ctx, auth) {
  return listKeys(request, env, ctx, auth);
}
