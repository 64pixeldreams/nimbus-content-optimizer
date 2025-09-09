/**
 * Get Page Function
 * Retrieves a page by ID with full content
 */

import { DataModel } from '../../datamodel/index.js';

export async function get(request, env, logger) {
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

    return {
      success: true,
      data: {
        page_id: page.get('page_id'),
        project_id: page.get('project_id'),
        url: page.get('url'),
        title: page.get('title'),
        status: page.get('status'),
        content: page.get('content'),
        extracted_data: page.get('extracted_data'),
        optimized_content: page.get('optimized_content'),
        metadata: page.get('metadata'),
        last_processed: page.get('last_processed'),
        processing_time_ms: page.get('processing_time_ms'),
        error_message: page.get('error_message'),
        created_at: page.get('created_at'),
        updated_at: page.get('updated_at')
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
