/**
 * Pages Functions Index
 * Exports all page management functions (following Project module pattern)
 */

export { pageCreate, pageCreateConfig } from './create.js';
export { pageList, pageListConfig } from './list.js';
export { get as pageGet, getConfig as pageGetConfig } from './get.js';
export { update as pageUpdate, updateConfig as pageUpdateConfig } from './update.js';
export { pageLogs, pageLogsConfig } from './logs.js';
