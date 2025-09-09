#!/usr/bin/env node
/**
 * Module Validation Script
 * Validates a module before locking
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('Usage: node scripts/validate-module.js <module-name>');
  console.error('Example: node scripts/validate-module.js datastore');
  process.exit(1);
}

const modulePath = `src/modules/${moduleName}`;

console.log(`🧪 Validating module: ${moduleName}`);

const checks = [];
let allPassed = true;

// Check 1: Module exists
checks.push({
  name: 'Module exists',
  test: () => existsSync(modulePath),
  error: `Module ${moduleName} not found at ${modulePath}`
});

// Check 2: Has README
checks.push({
  name: 'Has README',
  test: () => existsSync(join(modulePath, 'README.md')),
  error: `Module ${moduleName} missing README.md`
});

// Check 3: Has index.js
checks.push({
  name: 'Has index.js',
  test: () => existsSync(join(modulePath, 'index.js')),
  error: `Module ${moduleName} missing index.js`
});

// Check 4: No .LOCKED file
checks.push({
  name: 'Not already locked',
  test: () => !existsSync(join(modulePath, '.LOCKED')),
  error: `Module ${moduleName} is already locked`
});

// Check 5: Git is clean
checks.push({
  name: 'Git is clean',
  test: () => {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim() === '';
    } catch {
      return false;
    }
  },
  error: 'Git working directory is not clean. Commit or stash changes first.'
});

// Check 6: Run relevant tests
if (moduleName === 'datastore') {
  checks.push({
    name: 'Datastore tests pass',
    test: () => {
      try {
        execSync('node tests/test-datastore.js', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    error: 'Datastore tests failed'
  });
}

if (moduleName === 'datamodel') {
  checks.push({
    name: 'DataModel tests pass',
    test: () => {
      try {
        execSync('node tests/test-datamodel.js', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    error: 'DataModel tests failed'
  });
}

if (moduleName === 'logs') {
  checks.push({
    name: 'Logs tests pass',
    test: () => {
      try {
        execSync('node tests/test-logs.js', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    error: 'Logs tests failed'
  });
}

// Run all checks
console.log('\nRunning validation checks...\n');

for (const check of checks) {
  try {
    const passed = check.test();
    if (passed) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}: ${check.error}`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${check.name}: ${error.message}`);
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log(`🎉 Module ${moduleName} is ready for locking!`);
  console.log(`\nTo lock this module, run:`);
  console.log(`node scripts/lock-module.js ${moduleName}`);
} else {
  console.log(`❌ Module ${moduleName} failed validation and cannot be locked.`);
  console.log(`Please fix the issues above and try again.`);
  process.exit(1);
}
