/**
 * Update Page Function
 * Updates page content, status, or metadata
 */

import { DataModel } from '../../datamodel/index.js';
import { Datastore } from '../../datastore/index.js';
import { PageModel } from '../../../models/page.js';

export async function update(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  const { page_id, ...updates } = payload;

  if (!page_id) {
    return {
      success: false,
      error: 'Missing required field: page_id'
    };
  }

  // Allowed update fields
  const allowedFields = [
    'title',
    'status', 
    'content',
    'optimized_content',
    'metadata',
    'last_processed',
    'processing_time_ms',
    'error_message'
  ];

  // Filter to only allowed fields
  const filteredUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = value;
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return {
      success: false,
      error: 'No valid fields to update'
    };
  }

  try {
    // Initialize datastore (model already registered globally)
    const datastore = new Datastore(env, logger);
    
    // Load page
    const page = await DataModel.get('PAGE', datastore, page_id, logger);

    // Set auth context on the page instance for hooks
    page._authContext = auth;

    // Apply updates using the update method to trigger hooks
    await page.update(filteredUpdates);
    
    // CRITICAL: Must call save() to trigger hook execution (like PROJECT model does)
    await page.save();

    return {
      success: true,
      data: {
        page_id: page.get('page_id'),
        title: page.get('title'),
        status: page.get('status'),
        updated_at: page.get('updated_at')
      }
    };

  } catch (error) {
    logger?.error('Failed to update page', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * CloudFunction configuration
 */
export const updateConfig = {
  auth: true,
  validation: {
    page_id: { type: 'string', required: true },
    title: { type: 'string' },
    status: { type: 'string' },
    content: { type: 'string' },
    optimized_content: { type: 'string' },
    metadata: { type: 'object' },
    last_processed: { type: 'string' },
    processing_time_ms: { type: 'number' },
    error_message: { type: 'string' }
  }
};
