/**
 * Create Page Function
 * Creates a new page from extracted content data
 */

import { DataModel } from '../../datamodel/index.js';

export async function create(request, env, logger) {
  const { 
    project_id,
    url,
    title,
    content,
    extracted_data,
    metadata 
  } = request.data;

  // Validate required fields
  if (!project_id || !url) {
    return {
      success: false,
      error: 'Missing required fields: project_id, url'
    };
  }

  try {
    // Create new page
    const page = await DataModel.create('PAGE', request.datastore, {
      project_id,
      url,
      title: title || 'Untitled Page',
      status: 'extracted',
      content: content || '',
      extracted_data: extracted_data || {},
      metadata: metadata || {}
    }, logger);

    await page.save();

    return {
      success: true,
      data: {
        page_id: page.get('page_id'),
        project_id: page.get('project_id'),
        url: page.get('url'),
        title: page.get('title'),
        status: page.get('status'),
        created_at: page.get('created_at')
      }
    };

  } catch (error) {
    logger?.error('Failed to create page', error);
    return {
      success: false,
      error: error.message
    };
  }
}
