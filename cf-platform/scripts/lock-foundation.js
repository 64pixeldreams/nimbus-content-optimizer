#!/usr/bin/env node
/**
 * Lock Foundation Modules
 * Locks all foundation modules in the correct order
 */

import { execSync } from 'child_process';

const foundationModules = [
  'datastore',    // No dependencies
  'logs',         // No dependencies  
  'datamodel',    // Depends on datastore, logs
  'auth'          // Depends on datastore, logs
];

console.log('🔒 Locking Foundation Modules');
console.log('============================\n');

let allLocked = true;

for (const module of foundationModules) {
  console.log(`\n🔍 Validating ${module}...`);
  
  try {
    // Validate module
    execSync(`node scripts/validate-module.js ${module}`, { stdio: 'inherit' });
    
    console.log(`\n🔒 Locking ${module}...`);
    
    // Lock module
    execSync(`node scripts/lock-module.js ${module} 1.0`, { stdio: 'inherit' });
    
    console.log(`✅ ${module} locked successfully!`);
    
  } catch (error) {
    console.error(`❌ Failed to lock ${module}: ${error.message}`);
    allLocked = false;
    break;
  }
}

console.log('\n' + '='.repeat(50));

if (allLocked) {
  console.log('🎉 All foundation modules locked successfully!');
  console.log('\nNext steps:');
  console.log('1. Push all lock branches: git push origin --all');
  console.log('2. Push all tags: git push origin --tags');
  console.log('3. Update LOCKING.md with locked modules');
  console.log('4. Test the locked modules in development');
} else {
  console.log('❌ Some modules failed to lock. Please fix issues and try again.');
  process.exit(1);
}
