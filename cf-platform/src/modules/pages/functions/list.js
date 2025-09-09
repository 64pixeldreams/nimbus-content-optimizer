/**
 * List Pages Function
 * Lists pages with filtering and pagination
 */

import { DataModel } from '../../datamodel/index.js';

export async function list(request, env, logger) {
  const { 
    project_id,
    status,
    limit = 50,
    offset = 0 
  } = request.data;

  try {
    // Build query
    const query = DataModel.query('PAGE', request.datastore, logger);
    
    if (project_id) {
      query.where('project_id', project_id);
    }
    
    if (status) {
      query.where('status', status);
    }
    
    // Add pagination
    query.limit(Math.min(limit, 100)); // Max 100 items
    query.offset(offset);
    
    // Order by created date (newest first)
    query.orderBy('created_at', 'DESC');

    // Execute query (this returns metadata from D1)
    const results = await query.execute();

    // Format response with metadata only (no large content)
    const pages = results.map(page => ({
      page_id: page.page_id,
      project_id: page.project_id,
      url: page.url,
      title: page.title,
      status: page.status,
      last_processed: page.last_processed,
      created_at: page.created_at,
      updated_at: page.updated_at
    }));

    return {
      success: true,
      data: {
        pages,
        count: pages.length,
        offset,
        limit
      }
    };

  } catch (error) {
    logger?.error('Failed to list pages', error);
    return {
      success: false,
      error: error.message
    };
  }
}
