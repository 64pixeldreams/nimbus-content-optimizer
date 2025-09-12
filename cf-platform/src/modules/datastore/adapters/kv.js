/**
 * KV Adapter for Datastore
 * Implements storage operations using Cloudflare KV
 * See specs/00-datastore.md for implementation details
 */

import { makeKey, validateClass } from '../utils/keys.js';
import { addAuthContext, checkAuthAccess } from '../utils/auth.js';

export class KVAdapter {
  constructor(env, logger) {
    this.env = env;
    this.logger = logger?.init('KV') || null;
    this.authContext = null;
  }

  /**
   * Set auth context for all operations
   * @param {string} userId - User ID for access control
   */
  setAuthContext(userId) {
    this.authContext = userId;
  }

  /**
   * Get KV namespace for a given class
   * @param {string} className - Entity class name
   * @returns {KVNamespace} Cloudflare KV namespace
   */
  getNamespace(className) {
    const mapping = {
      'USER': this.env.NIMBUS_USERS,
      'PROJECT': this.env.NIMBUS_PROJECTS,
      'PAGE': this.env.NIMBUS_PAGES,
      'APIKEY': this.env.NIMBUS_KEYS,
      'SESSION': this.env.NIMBUS_SESSIONS,
      'CACHE': this.env.NIMBUS_CACHE,
      'EMAIL': this.env.NIMBUS_EMAILS,
      'LIST': this.env.NIMBUS_LISTS,
      'LOG': this.env.NIMBUS_CACHE,  // Logs stored in cache namespace
      'VERIFY': this.env.NIMBUS_CACHE,  // Verification tokens stored in cache namespace
      'NOTIFICATION': this.env.NIMBUS_CACHE  // Notifications stored in cache namespace
    };
    
    if (!mapping[className]) {
      throw new Error(`Unknown class: ${className}`);
    }
    
    return mapping[className];
  }

  /**
   * Get an object from KV
   * @param {string} className - Entity class
   * @param {string} id - Entity ID
   * @returns {Promise<Object|null>} Object data or null if not found/no access
   */
  async get(className, id) {
    const timer = this.logger?.timer('get');
    
    try {
      validateClass(className);
      const kv = this.getNamespace(className);
      const key = makeKey(className, id);
      
      this.logger?.debug(`Getting ${className}:${id}`, { key });
      const data = await kv.get(key, 'json');
      
      // Check auth access
      if (data && !checkAuthAccess(data, this.authContext)) {
        this.logger?.debug(`Access denied for ${className}:${id}`);
        timer?.end({ found: true, access: false });
        return null;
      }
      
      timer?.end({ found: data !== null });
      return data;
    } catch (err) {
      this.logger?.error(`Failed to get ${className}:${id}`, err);
      timer?.end({ error: true });
      throw err;
    }
  }

  /**
   * Store an object in KV
   * @param {string} className - Entity class
   * @param {string} id - Entity ID
   * @param {Object} data - Data to store
   */
  async put(className, id, data) {
    const timer = this.logger?.timer('put');
    
    try {
      validateClass(className);
      const kv = this.getNamespace(className);
      const key = makeKey(className, id);
      
      // Add auth context
      const dataWithAuth = addAuthContext(data, this.authContext);
      
      this.logger?.debug(`Storing ${className}:${id}`, { key });
      await kv.put(key, JSON.stringify(dataWithAuth));
      
      timer?.end({ success: true });
    } catch (err) {
      this.logger?.error(`Failed to put ${className}:${id}`, err);
      timer?.end({ error: true });
      throw err;
    }
  }

  /**
   * Delete an object from KV
   * @param {string} className - Entity class
   * @param {string} id - Entity ID
   */
  async delete(className, id) {
    validateClass(className);
    const kv = this.getNamespace(className);
    const key = makeKey(className, id);
    
    // Check if user has access before deleting
    const existing = await this.get(className, id);
    if (!existing) {
      throw new Error('Not found or no access');
    }
    
    await kv.delete(key);
  }

  /**
   * Check if an object exists
   * @param {string} className - Entity class
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} True if exists and user has access
   */
  async exists(className, id) {
    const data = await this.get(className, id);
    return data !== null;
  }

  // List operations (stored as arrays in KV)

  /**
   * Get list items
   * @param {string} listName - List name (e.g., 'projects')
   * @param {string} pointer - List pointer (e.g., user ID)
   * @returns {Promise<Array>} List items
   */
  async queryListByPointer(listName, pointer) {
    // Lists use special key format: listName:pointer
    const key = `${listName}:${pointer}`;
    const kv = this.env.NIMBUS_LISTS; // All lists stored in dedicated namespace
    
    const list = await kv.get(key, 'json');
    return list || [];
  }

  /**
   * Add item to list
   * @param {string} listName - List name
   * @param {string} pointer - List pointer
   * @param {string} itemId - Item to add
   */
  async queryListAddItem(listName, pointer, itemId) {
    const list = await this.queryListByPointer(listName, pointer);
    
    if (!list.includes(itemId)) {
      list.push(itemId);
      const key = `${listName}:${pointer}`;
      await this.env.NIMBUS_LISTS.put(key, JSON.stringify(list));
    }
  }

  /**
   * Remove item from list
   * @param {string} listName - List name
   * @param {string} pointer - List pointer
   * @param {string} itemId - Item to remove
   */
  async queryListRemoveItem(listName, pointer, itemId) {
    const list = await this.queryListByPointer(listName, pointer);
    
    const index = list.indexOf(itemId);
    if (index > -1) {
      list.splice(index, 1);
      const key = `${listName}:${pointer}`;
      await this.env.NIMBUS_LISTS.put(key, JSON.stringify(list));
    }
  }

  /**
   * Clear entire list
   * @param {string} listName - List name
   * @param {string} pointer - List pointer
   */
  async queryListClear(listName, pointer) {
    const key = `${listName}:${pointer}`;
    await this.env.NIMBUS_LISTS.delete(key);
  }
}
