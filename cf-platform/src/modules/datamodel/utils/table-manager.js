/**
 * Database Initializer
 * Handles automatic table creation and schema updates on app startup
 */

import { generateTableSchema } from './schema-generator.js';

/**
 * Initialize all tables for registered models
 * Called on app startup
 * @param {Map} modelRegistry - Registered models
 * @param {object} datastore - Datastore instance
 * @param {object} logger - Logger instance
 */
export async function initializeDatabase(modelRegistry, datastore, logger) {
  const timer = logger?.timer('db.initialize');
  let tablesCreated = 0;
  let tablesChecked = 0;
  
  try {
    logger?.log('Database initialization started');
    
    for (const [modelName, modelDef] of modelRegistry) {
      if (!modelDef.d1?.table) {
        continue; // Skip models without D1 tables
      }
      
      const tableName = modelDef.d1.table;
      tablesChecked++;
      
      try {
        // Check if table exists
        const checkQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;
        const result = await datastore.D1.execute(checkQuery, [tableName]);
        
        if (!result.results || result.results.length === 0) {
          // Table doesn't exist - create it
          const createSQL = generateTableSchema(modelDef);
          await datastore.D1.execute(createSQL);
          
          logger?.log('Table created', { model: modelName, table: tableName });
          tablesCreated++;
        } else {
          logger?.log('Table exists', { model: modelName, table: tableName });
        }
        
      } catch (error) {
        logger?.error('Table initialization failed', { 
          model: modelName, 
          table: tableName, 
          error: error.message 
        });
        // Continue with other tables
      }
    }
    
    logger?.log('Database initialization completed', { 
      tablesChecked, 
      tablesCreated 
    });
    timer?.end({ tablesChecked, tablesCreated, success: true });
    
  } catch (error) {
    logger?.error('Database initialization failed', error);
    timer?.end({ error: true });
    throw error;
  }
}
