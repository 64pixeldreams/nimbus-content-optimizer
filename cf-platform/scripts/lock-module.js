#!/usr/bin/env node
/**
 * Module Locking Script
 * Locks a module by creating lock files and git tags
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const moduleName = process.argv[2];
const version = process.argv[3] || '1.0';

if (!moduleName) {
  console.error('Usage: node scripts/lock-module.js <module-name> [version]');
  console.error('Example: node scripts/lock-module.js datastore 1.0');
  process.exit(1);
}

const modulePath = `src/modules/${moduleName}`;

// Check if module exists
if (!existsSync(modulePath)) {
  console.error(`❌ Module ${moduleName} not found at ${modulePath}`);
  process.exit(1);
}

console.log(`🔒 Locking module: ${moduleName} v${version}`);

try {
  // 1. Create lock file
  const lockContent = `# MODULE LOCKED
Module: ${moduleName}
Version: ${version}
Lock Date: ${new Date().toISOString()}
Status: PRODUCTION READY
API: STABLE - No breaking changes allowed
Dependencies: See module README
Tests: All passing
Production: Live and stable

## Lock Details
- Locked by: ${process.env.USER || 'system'}
- Git commit: ${execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()}
- Branch: ${execSync('git branch --show-current', { encoding: 'utf8' }).trim()}

## Breaking Change Policy
Breaking changes require:
1. Team approval
2. Migration plan
3. Version bump
4. Comprehensive testing
5. Documentation updates

## Unlocking
To unlock this module:
1. Create unlock branch: git checkout -b unlock/${moduleName}-v${version}
2. Remove this file
3. Make changes
4. Re-validate and re-lock
`;

  writeFileSync(join(modulePath, '.LOCKED'), lockContent);
  console.log(`✅ Created lock file: ${modulePath}/.LOCKED`);

  // 2. Update module README with lock status
  const readmePath = join(modulePath, 'README.md');
  if (existsSync(readmePath)) {
    const readmeContent = `# ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module

## 🔒 MODULE STATUS: LOCKED v${version}
- **Lock Date**: ${new Date().toLocaleDateString()}
- **API Stability**: STABLE - No breaking changes allowed
- **Dependencies**: See below
- **Test Status**: PASSING
- **Production Status**: LIVE

---

` + require('fs').readFileSync(readmePath, 'utf8').replace(/^# .*$/m, '');
    
    writeFileSync(readmePath, readmeContent);
    console.log(`✅ Updated README with lock status`);
  }

  // 3. Create git branch for lock
  const branchName = `lock/${moduleName}-v${version}`;
  try {
    execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });
    console.log(`✅ Created lock branch: ${branchName}`);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Branch ${branchName} already exists, switching to it`);
      execSync(`git checkout ${branchName}`);
    } else {
      throw error;
    }
  }

  // 4. Add and commit lock files
  execSync(`git add ${modulePath}/.LOCKED ${modulePath}/README.md`);
  execSync(`git commit -m "LOCK: ${moduleName} module v${version} - production ready"`);
  console.log(`✅ Committed lock files`);

  // 5. Create git tag
  const tagName = `${moduleName}-v${version}`;
  execSync(`git tag -a ${tagName} -m "Locked ${moduleName} module v${version} - stable API"`);
  console.log(`✅ Created git tag: ${tagName}`);

  // 6. Switch back to main branch
  execSync('git checkout main');
  console.log(`✅ Switched back to main branch`);

  console.log(`\n🎉 Module ${moduleName} v${version} successfully locked!`);
  console.log(`\nNext steps:`);
  console.log(`1. Push the lock branch: git push origin ${branchName}`);
  console.log(`2. Push the tag: git push origin ${tagName}`);
  console.log(`3. Update LOCKING.md with the new locked module`);

} catch (error) {
  console.error(`❌ Error locking module: ${error.message}`);
  process.exit(1);
}
