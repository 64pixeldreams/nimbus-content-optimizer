/**
 * Build D1 Schema from DataModel definitions
 * Run: node scripts/build-schema.js
 */

import { DataModel } from '../src/modules/datamodel/index.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

// Import all model definitions
import { UserModel } from '../src/models/user.js';
import { ProjectModel } from '../src/models/project.js';
import { PageModel } from '../src/models/page.js';

// Register all models
DataModel.register(UserModel);
DataModel.register(ProjectModel);
DataModel.register(PageModel);

// Generate schema
const schema = DataModel.generateAllSchemas();

// Write to file
const outputPath = resolve('./schema.sql');
writeFileSync(outputPath, schema, 'utf8');

console.log('✅ Schema generated successfully!');
console.log(`📄 Output: ${outputPath}`);
console.log('\nGenerated schema for models:');
console.log('- User');
console.log('- Project');
console.log('- Page');
