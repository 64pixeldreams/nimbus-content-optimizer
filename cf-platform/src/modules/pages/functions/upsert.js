/**
 * Page Upsert CloudFunction
 * Creates or updates a page based on deterministic identity
 */

import { PageManager } from '../core/page-manager.js';

export async function upsert(requestContext) {
  const { env, logger, payload, auth } = requestContext;

  try {
    const {
      project_id,
      url,
      page_id: providedPageId,
      title,
      content,
      extracted_data,
      metadata,
      status
    } = payload;

    // Initialize helpers
    const pages = new PageManager(env, auth.user_id);
    const { DataModel } = await import('../../datamodel/index.js');
    const { Datastore } = await import('../../datastore/index.js');
    const { ProjectModel } = await import('../../../models/project.js');

    const datastore = new Datastore(env, logger);
    // Ensure models are registered (index.js registers globally, but safe)
    DataModel.registerModel(ProjectModel);

    // Build deterministic page_id if not provided
    let pageId = providedPageId;
    let domainForId = null;

    if (!pageId) {
      // Load project to get domain
      const project = await DataModel.get('PROJECT', datastore, project_id, logger);
      domainForId = project?.get('domain') || '';

      const cleanDomain = String(domainForId || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
      const cleanUrl = String(url || '').toLowerCase().replace(/[^a-z0-9\/]/gi, '_');

      // Short stable hash of domain+url (8 chars)
      const hash = await cryptoHash8(`${domainForId || ''}${url || ''}`);
      pageId = `page:${cleanDomain}_${cleanUrl}_${hash}`;
    }

    // Try to find page by id first
    let existing = null;
    try {
      const page = await DataModel.get('PAGE', datastore, pageId, logger);
      if (page) existing = page;
    } catch (_) {
      // ignore not found
    }

    // If not found by id, try lookup by (project_id, url)
    if (!existing) {
      const query = DataModel.query('PAGE', datastore, logger)
        .where('project_id', project_id)
        .where('url', url)
        .limit(1);
      const list = await query.list();
      if (list?.data && list.data.length > 0) {
        existing = list.data[0];
        // Prefer canonical id from existing row
        pageId = existing.page_id || pageId;
      }
    }

    if (existing) {
      // UPDATE path - only set provided fields
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (extracted_data !== undefined) updates.extracted_data = extracted_data;
      if (metadata !== undefined) updates.metadata = metadata;
      if (status !== undefined) updates.status = status;

      const result = await pages.update(pageId, updates);
      return {
        success: true,
        data: {
          operation: 'updated',
          page: result?.data || result?.page || { page_id: pageId },
          synced_at: new Date().toISOString()
        }
      };
    }

    // CREATE path
    const createPayload = {
      page_id: pageId,
      project_id,
      url,
      title,
      status: status || 'extracted',
      content,
      extracted_data,
      metadata
    };
    const createResult = await pages.create(createPayload);
    return {
      success: true,
      data: {
        operation: 'created',
        page: createResult?.page || createResult?.data || { page_id: pageId },
        synced_at: new Date().toISOString()
      }
    };

  } catch (error) {
    logger.error('Page upsert failed', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export const upsertConfig = {
  auth: true,
  validation: {
    project_id: { type: 'string', required: true },
    url: { type: 'string', required: true },
    page_id: { type: 'string' },
    title: { type: 'string' },
    content: { type: 'text' },
    extracted_data: { type: 'json' },
    metadata: { type: 'json' },
    status: { type: 'string' }
  }
};

// Helpers
async function cryptoHash8(input) {
  // Use subtle crypto if available (Workers), fallback to simple hash if not
  try {
    const enc = new TextEncoder();
    const data = enc.encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(digest));
    const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    return hex.substring(0, 8);
  } catch (_) {
    // Fallback (non-crypto environment)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0').substring(0, 8);
  }
}


