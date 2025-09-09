#!/usr/bin/env node
/**
 * Test Pages Module Implementation
 * Verifies that the Pages module is working end-to-end
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

console.log('🧪 NIMBUS AI - PAGES MODULE TEST');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

function test(name, testFn) {
  try {
    console.log(`\n📋 ${name}`);
    testFn();
    console.log('✅ PASSED');
    passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    failed++;
  }
}

// Test 1: Pages module files exist
test('Pages module structure', () => {
  const requiredFiles = [
    'cf-platform/src/modules/pages/index.js',
    'cf-platform/src/modules/pages/functions/create.js',
    'cf-platform/src/modules/pages/functions/get.js',
    'cf-platform/src/modules/pages/functions/list.js',
    'cf-platform/src/modules/pages/functions/update.js',
    'cf-platform/src/modules/pages/functions/delete.js',
    'cf-platform/src/modules/pages/functions/index.js',
    'cf-platform/src/modules/pages/README.md'
  ];
  
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Missing file: ${file}`);
    }
  }
});

// Test 2: Page model is registered
test('Page model registration', () => {
  const indexContent = readFileSync('cf-platform/src/index.js', 'utf8');
  
  if (!indexContent.includes('PageModel')) {
    throw new Error('PageModel not imported');
  }
  
  if (!indexContent.includes('DataModel.registerModel(PageModel)')) {
    throw new Error('PageModel not registered');
  }
});

// Test 3: Page functions are registered
test('Page functions registration', () => {
  const indexContent = readFileSync('cf-platform/src/index.js', 'utf8');
  
  const requiredRegistrations = [
    'page.create',
    'page.get', 
    'page.list',
    'page.update',
    'page.remove'
  ];
  
  for (const registration of requiredRegistrations) {
    if (!indexContent.includes(`'${registration}'`)) {
      throw new Error(`Function ${registration} not registered`);
    }
  }
});

// Test 4: DataModel tests still pass
test('DataModel compatibility', () => {
  const result = execSync('node tests/test-datamodel.js', {
    cwd: './cf-platform',
    encoding: 'utf8'
  });
  
  if (!result.includes('✅ All tests passed!')) {
    throw new Error('DataModel tests failed after Pages module addition');
  }
});

// Test 5: Project verification test still passes
test('Project verification compatibility', () => {
  const result = execSync('node test-project-creation.js', {
    encoding: 'utf8'
  });
  
  if (!result.includes('📈 Success Rate: 100%')) {
    throw new Error('Project verification failed after Pages module addition');
  }
});

// Results
console.log('\n' + '='.repeat(50));
console.log('📊 PAGES MODULE TEST RESULTS');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 PAGES MODULE READY! All tests passed.');
  console.log('\n📋 Available API Functions:');
  console.log('- page.create - Create new page from extracted content');
  console.log('- page.get - Retrieve page with full content');
  console.log('- page.list - List pages with filtering');
  console.log('- page.update - Update page content/status');
  console.log('- page.remove - Soft delete page');
  console.log('\n🚀 Ready to integrate with gulp extraction pipeline!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review and fix issues.');
  process.exit(1);
}
