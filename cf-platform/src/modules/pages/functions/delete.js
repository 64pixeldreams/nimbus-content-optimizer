/**
 * Delete Page Function
 * Soft deletes a page (marks as deleted)
 */

import { DataModel } from '../../datamodel/index.js';

export async function remove(request, env, logger) {
  const { page_id } = request.data;

  if (!page_id) {
    return {
      success: false,
      error: 'Missing required field: page_id'
    };
  }

  try {
    // Load page
    const page = await DataModel.get('PAGE', request.datastore, page_id, logger);

    // Soft delete (sets deleted_at timestamp)
    await page.delete();

    return {
      success: true,
      data: {
        page_id: page.get('page_id'),
        deleted_at: page.get('deleted_at')
      }
    };

  } catch (error) {
    logger?.error('Failed to delete page', error);
    return {
      success: false,
      error: error.message
    };
  }
}
