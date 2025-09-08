/**
 * Sync Utility
 * Handles synchronization between KV and D1
 */

/**
 * Prepare data for KV storage
 * @param {object} data - All model data
 * @param {object} modelDef - Model definition
 * @returns {object} Data ready for KV
 */
export function prepareKVData(data, modelDef) {
  const kvData = { ...data };
  
  // Add timestamps if enabled
  if (modelDef.options?.timestamps !== false) {
    if (!kvData.created_at) {
      kvData.created_at = new Date().toISOString();
    }
    kvData.updated_at = new Date().toISOString();
  }
  
  return kvData;
}

/**
 * Prepare data for D1 storage
 * @param {object} data - All model data
 * @param {object} modelDef - Model definition
 * @returns {object} Only fields that should sync to D1
 */
export function prepareD1Data(data, modelDef) {
  const d1Data = {};
  
  // Only include fields specified in syncFields
  if (modelDef.d1?.syncFields) {
    for (const field of modelDef.d1.syncFields) {
      if (data[field] !== undefined) {
        d1Data[field] = data[field];
      }
    }
  }
  
  return d1Data;
}

/**
 * Build D1 insert query
 * @param {string} table - Table name
 * @param {object} data - Data to insert
 * @returns {object} { query: string, bindings: array }
 */
export function buildInsertQuery(table, data) {
  const fields = Object.keys(data);
  const placeholders = fields.map(() => '?').join(', ');
  const values = Object.values(data);
  
  return {
    query: `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
    bindings: values
  };
}

/**
 * Build D1 update query
 * @param {string} table - Table name
 * @param {object} data - Data to update
 * @param {string} idField - Primary key field
 * @param {string} id - Record ID
 * @returns {object} { query: string, bindings: array }
 */
export function buildUpdateQuery(table, data, idField, id) {
  const fields = Object.keys(data).filter(f => f !== idField);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => data[f]);
  values.push(id);
  
  return {
    query: `UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`,
    bindings: values
  };
}
