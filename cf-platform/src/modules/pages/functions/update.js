/**
 * Update Page Function
 * Updates page content, status, or metadata
 */

import { DataModel } from '../../datamodel/index.js';

export async function update(requestContext) {
  const { env, logger, payload, auth, datastore } = requestContext;
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
    // Load page
    const page = await DataModel.get('PAGE', datastore, page_id, logger);

    // Apply updates
    for (const [key, value] of Object.entries(filteredUpdates)) {
      page.set(key, value);
    }

    // Save changes
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
