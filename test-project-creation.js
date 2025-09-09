#!/usr/bin/env node
/**
 * Simple verification test for NimbusAI project
 * Tests that core functionality works end-to-end
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

console.log('🧪 NIMBUS AI - PROJECT VERIFICATION TEST');
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

// Test 1: Project structure exists
test('Project structure', () => {
  const requiredDirs = [
    'gulp',
    'cf-platform', 
    'docs',
    'specs',
    'dist'
  ];
  
  for (const dir of requiredDirs) {
    if (!existsSync(dir)) {
      throw new Error(`Missing directory: ${dir}`);
    }
  }
});

// Test 2: Gulp system works
test('Gulp scan functionality', () => {
  const result = execSync('node gulpfile.js scan --folder ../dist/local --limit 1', {
    cwd: './gulp',
    encoding: 'utf8'
  });
  
  // Gulp scan runs silently, so just check it doesn't throw
  if (result === undefined) {
    throw new Error('Gulp scan did not complete successfully');
  }
});

// Test 3: CF-Platform tests work
test('CF-Platform datastore', () => {
  const result = execSync('node tests/test-datastore.js', {
    cwd: './cf-platform',
    encoding: 'utf8'
  });
  
  if (!result.includes('✅ Passed: 8')) {
    throw new Error('Datastore tests failed');
  }
});

// Test 4: CF-Platform logs work
test('CF-Platform logs', () => {
  const result = execSync('node tests/test-logs.js', {
    cwd: './cf-platform',
    encoding: 'utf8'
  });
  
  if (!result.includes('✅ Passed: 9')) {
    throw new Error('Logs tests failed');
  }
});

// Test 5: Documentation exists
test('Documentation completeness', () => {
  const requiredDocs = [
    'README.md',
    'CURSOR_GET_STARTED.md',
    'docs/ARCHITECTURE.md',
    'cf-platform/README.md',
    'gulp/README.md'
  ];
  
  for (const doc of requiredDocs) {
    if (!existsSync(doc)) {
      throw new Error(`Missing documentation: ${doc}`);
    }
  }
});

// Test 6: Configuration files exist
test('Configuration files', () => {
  const requiredConfigs = [
    'gulp/profile.yaml',
    'gulp/_directive.yaml',
    'gulp/_tone-profiles.yaml',
    'cf-platform/wrangler.example.toml'
  ];
  
  for (const config of requiredConfigs) {
    if (!existsSync(config)) {
      throw new Error(`Missing configuration: ${config}`);
    }
  }
});

// Results
console.log('\n' + '=' * 50);
console.log('📊 VERIFICATION RESULTS');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Project is ready for development.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review and fix issues.');
  process.exit(1);
}
