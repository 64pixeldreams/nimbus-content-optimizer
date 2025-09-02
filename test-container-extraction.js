/**
 * Test Container-Based Extraction
 * 
 * This script tests the new container-aware extraction feature in scanv2.js
 * It demonstrates how to extract above-fold content separately from the rest of the page
 */

const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function testContainerExtraction() {
  console.log(chalk.blue('\n🧪 Testing Container-Based Extraction\n'));

  // Test configurations with different sites and selectors
  const tests = [
    {
      name: 'Emergency Plumbing (AC Site)',
      folder: '../dist/local',
      file: 'emergency-plumbing-london.html',
      contentClass: 'main',           // Main content area
      aboveFoldClass: '.container'    // Hero/above-fold section
    },
    {
      name: 'Hublot Watch Repair (RBP Site)',
      folder: '../dist/brands',
      file: 'hublot-watch-repair.html',
      contentClass: '.content',       // Different selector
      aboveFoldClass: '.hero-section' // Different hero selector
    },
    {
      name: 'Generic Test (No specific selectors)',
      folder: '../dist/local',
      file: 'emergency-plumbing-london.html',
      contentClass: null,             // Use default behavior
      aboveFoldClass: null            // No above-fold separation
    }
  ];

  for (const test of tests) {
    console.log(chalk.yellow(`\n📋 Test: ${test.name}`));
    console.log(chalk.gray(`   File: ${test.file}`));
    console.log(chalk.gray(`   Content Class: ${test.contentClass || 'none (use default)'}`));
    console.log(chalk.gray(`   Above-Fold Class: ${test.aboveFoldClass || 'none (no separation)'}`));

    // Build command with optional parameters
    let command = `gulp scan --folder ${test.folder} --limit 1`;
    if (test.contentClass) {
      command += ` --contentClass "${test.contentClass}"`;
    }
    if (test.aboveFoldClass) {
      command += ` --aboveFoldClass "${test.aboveFoldClass}"`;
    }

    console.log(chalk.gray(`\n   Running: ${command}\n`));

    // Execute the scan
    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(chalk.red(`   ❌ Error: ${error.message}`));
          reject(error);
          return;
        }

        // Show output
        console.log(stdout);

        // Read the generated content map
        const mapFile = test.file.replace('.html', '.json');
        const mapPath = path.join('.nimbus/maps', mapFile);

        if (fs.existsSync(mapPath)) {
          const contentMap = fs.readJsonSync(mapPath);
          
          console.log(chalk.green('\n   ✅ Extraction Results:'));
          console.log(chalk.gray(`      Total blocks: ${contentMap.blocks.length}`));
          
          if (contentMap.above_fold_blocks) {
            console.log(chalk.cyan(`      Above-fold blocks: ${contentMap.above_fold_blocks.length}`));
            console.log(chalk.cyan(`      Rest of page blocks: ${contentMap.rest_of_page_blocks.length}`));
            
            // Show sample of above-fold content
            if (contentMap.above_fold_blocks.length > 0) {
              console.log(chalk.cyan('\n      Sample above-fold content:'));
              contentMap.above_fold_blocks.slice(0, 3).forEach(block => {
                if (block.type === 'h1' || block.type === 'h2') {
                  console.log(chalk.cyan(`        - ${block.type}: ${block.text}`));
                } else if (block.type === 'button') {
                  console.log(chalk.cyan(`        - Button: ${block.text}`));
                } else if (block.type === 'a') {
                  console.log(chalk.cyan(`        - Link: ${block.anchor}`));
                }
              });
            }
          } else {
            console.log(chalk.gray('      No container-based separation performed'));
          }
          
          // Show extraction config
          if (contentMap.extraction_config) {
            console.log(chalk.gray('\n      Extraction config:'));
            console.log(chalk.gray(`        content_class: ${contentMap.extraction_config.content_class || 'null'}`));
            console.log(chalk.gray(`        above_fold_class: ${contentMap.extraction_config.above_fold_class || 'null'}`));
          }
        }

        resolve();
      });
    }).catch(() => {
      // Continue with next test even if this one fails
    });
  }

  console.log(chalk.green('\n\n✨ Container extraction tests completed!\n'));
  console.log(chalk.blue('💡 Usage example:'));
  console.log(chalk.gray('   gulp scan --folder ../dist/local --contentClass "main" --aboveFoldClass ".container"'));
  console.log(chalk.gray('   gulp scan --folder ../dist/brands --contentClass ".content" --aboveFoldClass ".hero-section"'));
}

// Run the test
testContainerExtraction().catch(console.error);
