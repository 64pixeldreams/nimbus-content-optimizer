/**
 * Change password route
 */

import { Datastore } from '../../modules/datastore/index.js';
import { changePassword } from '../../modules/user/index.js';
import { LOGS } from '../../modules/logs/index.js';

export async function password(request, env, ctx, auth) {
  const logger = LOGS.init('routes.users.password');
  
  try {
    const { oldPassword, newPassword } = await request.json();
    
    if (!oldPassword || !newPassword) {
      return new Response(JSON.stringify({ 
        error: 'Old and new passwords required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const datastore = new Datastore(env, logger).auth(auth.user_id);
    
    const result = await changePassword(
      auth.user_id,
      oldPassword,
      newPassword,
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
      message: 'Password changed successfully' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    logger.error('Password change error', err);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
