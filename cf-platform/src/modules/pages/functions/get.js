/**
 * Get Page Function
 * Retrieves a single page by ID
 */

import { DataModel } from '../../datamodel/index.js';
import { Datastore } from '../../datastore/index.js';
import { PageModel } from '../../../models/page.js';

export async function get(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  const { page_id } = payload;

  if (!page_id) {
    return {
      success: false,
      error: 'Missing required field: page_id'
    };
  }

  try {
    // Initialize datastore and register model
    const datastore = new Datastore(env, logger);
    // Model already registered globally
    
    // Load page
    const page = await DataModel.get('PAGE', datastore, page_id, logger);

    return {
      success: true,
      data: {
        page_id: page.get('page_id'),
        title: page.get('title'),
        url: page.get('url'),
        status: page.get('status'),
        content: page.get('content'),
        optimized_content: page.get('optimized_content'),
        metadata: page.get('metadata'),
        project_id: page.get('project_id'),
        user_id: page.get('user_id'),
        created_at: page.get('created_at'),
        updated_at: page.get('updated_at'),
        last_processed: page.get('last_processed'),
        processing_time_ms: page.get('processing_time_ms'),
        error_message: page.get('error_message')
      }
    };

  } catch (error) {
    logger?.error('Failed to get page', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * CloudFunction configuration
 */
export const getConfig = {
  auth: true,
  validation: {
    page_id: { type: 'string', required: true }
  }
};