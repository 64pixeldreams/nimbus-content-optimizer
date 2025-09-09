/**
 * Delete user account route
 */

import { Datastore } from '../../modules/datastore/index.js';
import { deleteUser } from '../../modules/user/index.js';
import { LOGS } from '../../modules/logs/index.js';

export async function deleteAccount(request, env, ctx, auth) {
  const logger = LOGS.init('routes.users.delete');
  
  try {
    const datastore = new Datastore(env, logger).auth(auth.user_id);
    
    const result = await deleteUser(
      auth.user_id,
      datastore,
      logger
    );
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      message: result.message || 'Account scheduled for deletion' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    logger.error('Account deletion error', err);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
