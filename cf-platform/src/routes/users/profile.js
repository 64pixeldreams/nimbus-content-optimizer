/**
 * User profile route - GET and PATCH
 */

import { Datastore } from '../../modules/datastore/index.js';
import { updateUser } from '../../modules/user/index.js';
import { LOGS } from '../../modules/logs/index.js';

export async function profile(request, env, ctx, auth) {
  const logger = LOGS.init('routes.users.profile');
  
  try {
    const datastore = new Datastore(env, logger).auth(auth.user_id);
    
    // GET - retrieve profile
    if (request.method === 'GET') {
      const user = await datastore.get('USER', auth.user_id);
      
      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'User not found' 
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Remove sensitive data
      const { password_hash, ...profile } = user;
      
      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PATCH - update profile
    if (request.method === 'PATCH') {
      const updates = await request.json();
      
      const result = await updateUser(
        auth.user_id,
        updates,
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
      
      return new Response(JSON.stringify(result.user), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (err) {
    logger.error('Profile route error', err);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
