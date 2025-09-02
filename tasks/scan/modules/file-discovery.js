/**
 * File Discovery Module
 * Handles HTML file discovery and filtering
 */

const path = require('path');
const glob = require('glob');

/**
 * Discover HTML files in a folder
 * @param {string} folder - Folder path to scan
 * @param {number} limit - Maximum number of files to return
 * @returns {Promise<string[]>} Array of HTML file paths
 */
async function discoverFiles(folder, limit) {
  const pattern = path.join(folder, '**/*.html').replace(/\\/g, '/');
  const files = glob.sync(pattern);
  return files.slice(0, limit);
}

module.exports = {
  discoverFiles
};
