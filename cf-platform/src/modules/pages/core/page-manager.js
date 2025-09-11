/**
 * Page Manager
 * Core business logic for page operations
 */

import { DataModel } from '../../datamodel/index.js';
import { PageModel } from '../../../models/page.js';
import { LOGS } from '../../logs/index.js';

export class PageManager {
  constructor(env, userId = null) {
    this.env = env;
    this.userId = userId;
    this.logger = LOGS.init('PAGE');
    
    // Model already registered globally
  }
  
  /**
   * Create a new page
   */
  async create(data) {
    const timer = this.logger.timer('create');
    
    try {
      // Initialize datastore
      const { Datastore } = await import('../../datastore/index.js');
      const datastore = new Datastore(this.env, this.logger);
      
      // Create page using DataModel
      const page = await DataModel.create('PAGE', datastore, {
        ...data,
        user_id: this.userId
      }, this.logger);
      
      timer.end({ pageId: page.get('page_id') });
      return {
        success: true,
        page: page.toJSON()
      };
      
    } catch (error) {
      this.logger.error('Failed to create page', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get page by ID
   */
  async get(pageId) {
    const timer = this.logger.timer('get');
    
    try {
      // Initialize datastore
      const { Datastore } = await import('../../datastore/index.js');
      const datastore = new Datastore(this.env, this.logger);
      datastore.auth(this.userId);
      
      // Get page using DataModel
      const page = await DataModel.get('PAGE', datastore, pageId, this.logger);
      
      timer.end({ pageId });
      return {
        success: true,
        page: page.toJSON()
      };
      
    } catch (error) {
      this.logger.error('Failed to get page', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * List pages with filtering
   */
  async list(options = {}) {
    const timer = this.logger.timer('list');
    
    try {
      // Initialize datastore
      const { Datastore } = await import('../../datastore/index.js');
      const datastore = new Datastore(this.env, this.logger);
      datastore.auth(this.userId);
      
      // Build query
      const query = DataModel.query('PAGE', datastore, this.logger);
      
      if (options.project_id) {
        query.where('project_id', options.project_id);
      }
      
      if (options.status) {
        query.where('status', options.status);
      }
      
      // Add pagination
      query.limit(Math.min(options.limit || 50, 100));
      query.offset(options.offset || 0);
      
      // Order by created date (newest first)
      query.orderBy('created_at', 'DESC');
      
      // Execute query
      const result = await query.list();
      const results = result.data || [];
      
      timer.end({ count: results.length });
      return {
        success: true,
        pages: results,
        count: results.length,
        offset: options.offset || 0,
        limit: options.limit || 50
      };
      
    } catch (error) {
      this.logger.error('Failed to list pages', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update page
   */
  async update(pageId, updates) {
    const timer = this.logger.timer('update');
    
    try {
      // Initialize datastore
      const { Datastore } = await import('../../datastore/index.js');
      const datastore = new Datastore(this.env, this.logger);
      datastore.auth(this.userId);
      
      // Load page
      const page = await DataModel.get('PAGE', datastore, pageId, this.logger);
      
      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        page.set(key, value);
      }
      
      // Save changes
      await page.save();
      
      timer.end({ pageId });
      return {
        success: true,
        page: {
          page_id: page.get('page_id'),
          title: page.get('title'),
          status: page.get('status'),
          updated_at: page.get('updated_at')
        }
      };
      
    } catch (error) {
      this.logger.error('Failed to update page', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Delete page (soft delete)
   */
  async remove(pageId) {
    const timer = this.logger.timer('remove');
    
    try {
      // Initialize datastore
      const { Datastore } = await import('../../datastore/index.js');
      const datastore = new Datastore(this.env, this.logger);
      datastore.auth(this.userId);
      
      // Load page
      const page = await DataModel.get('PAGE', datastore, pageId, this.logger);
      
      // Soft delete
      await page.delete();
      
      timer.end({ pageId });
      return {
        success: true,
        page: {
          page_id: page.get('page_id'),
          deleted_at: page.get('deleted_at')
        }
      };
      
    } catch (error) {
      this.logger.error('Failed to delete page', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
}
