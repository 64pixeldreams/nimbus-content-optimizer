/**
 * Hook Manager
 * Executes lifecycle hooks for models
 */

/**
 * Execute a hook if defined
 * @param {object} modelDef - Model definition
 * @param {string} hookName - Hook to execute
 * @param {object} instance - Model instance
 * @param {any} data - Additional data for hook
 * @param {object} env - Environment
 * @param {object} logger - Logger instance
 */
export async function executeHook(modelDef, hookName, instance, data, env, logger) {
  if (!modelDef.hooks?.[hookName]) {
    return;
  }
  
  const timer = logger?.timer(`hook.${hookName}`);
  
  try {
    await modelDef.hooks[hookName](instance, data, env, logger);
    timer?.end({ model: modelDef.name, hook: hookName });
  } catch (error) {
    logger?.error(`Hook ${hookName} failed`, error);
    timer?.end({ error: true });
    // Don't throw - hooks shouldn't break operations
  }
}

/**
 * Get available hooks
 * @returns {string[]} List of hook names
 */
export function getAvailableHooks() {
  return [
    'beforeCreate',
    'afterCreate',
    'beforeUpdate',
    'afterUpdate',
    'beforeDelete',
    'afterDelete',
    'afterGet',
    'afterList'
  ];
}
