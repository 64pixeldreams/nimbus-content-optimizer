const gulp = require('gulp');
const { program } = require('commander');
const chalk = require('chalk');

// Import task modules
const scanTask = require('./tasks/scan');
const planTask = require('./tasks/plan');
const proposeTask = require('./tasks/propose');
const previewTask = require('./tasks/preview');
const approveTask = require('./tasks/approve');
const applyTask = require('./tasks/apply');
const checkTask = require('./tasks/check');
const urlDiscoveryTask = require('./tasks/discover-urls');
const proposeV2Task = require('./tasks/propose-v2');
const ctaJumboTestTask = require('./tasks/cta-jumbo-test');
const jumbotronOptimizerTask = require('./tasks/jumbotron-optimizer');
const progressiveOptimizerTask = require('./tasks/progressive-optimizer');

// Parse command line arguments
program
  .option('--folder <path>', 'Target folder to scan')
  .option('--limit <number>', 'Maximum pages to process', '10')
  .option('--batch <id>', 'Batch ID (new or existing)')
  .option('--main <selector>', 'Custom main content selector')
  .option('--dest <path>', 'Destination folder for applied changes')
  .option('--pages <list>', 'Comma-separated list of page IDs')
  .option('--git', 'Create git commit after applying changes')
  .option('--dry-run', 'Show what would be done without making changes')
  .option('--format <type>', 'Preview format: html|console', 'html')
  .option('--open', 'Open preview in browser')
  .option('--mode <type>', 'Approval mode: interactive|auto|reject', 'interactive')
  .option('--confidence <threshold>', 'Auto-approve confidence threshold (0.0-1.0)')
  .option('--backup', 'Create backup files before modification', true)
  .option('--tone <profile>', 'Override tone profile (local-expert, premium, startup, etc.)')
  .parse(process.argv);

const options = program.opts();

// Task: nimbus:scan:map
gulp.task('nimbus:scan:map', async () => {
  console.log(chalk.blue('🔍 Starting Nimbus content scanning...'));
  
  if (!options.folder) {
    console.error(chalk.red('❌ Error: --folder option is required'));
    process.exit(1);
  }
  
  try {
    await scanTask.run(options);
    console.log(chalk.green('✅ Content scanning completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Content scanning failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:plan
gulp.task('nimbus:plan', async () => {
  console.log(chalk.blue('📋 Starting Nimbus planning...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    await planTask.run(options);
    console.log(chalk.green('✅ Planning completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Planning failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:propose
gulp.task('nimbus:propose', async () => {
  console.log(chalk.blue('🤖 Starting AI content proposals...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    await proposeTask.run(options);
    console.log(chalk.green('✅ AI proposals completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ AI proposals failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:preview
gulp.task('nimbus:preview', async () => {
  console.log(chalk.blue('👀 Generating preview...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    await previewTask.run(options);
    console.log(chalk.green('✅ Preview generated successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Preview generation failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:approve
gulp.task('nimbus:approve', async () => {
  console.log(chalk.blue('✅ Processing approvals...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    await approveTask.run(options);
    console.log(chalk.green('✅ Approvals processed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Approval processing failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:apply
gulp.task('nimbus:apply', async () => {
  console.log(chalk.blue('🚀 Applying approved changes...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    await applyTask.run(options);
    console.log(chalk.green('✅ Changes applied successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Change application failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:check
gulp.task('nimbus:check', async () => {
  console.log(chalk.blue('🔍 Running post-apply validation...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    await checkTask.run(options);
    console.log(chalk.green('✅ Validation completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Validation failed:'), error.message);
    process.exit(1);
  }
});

// Default task
gulp.task('default', () => {
  console.log(chalk.blue('🎯 Nimbus Content Optimization System'));
  console.log('');
  console.log(chalk.yellow('Available tasks:'));
  console.log('  gulp nimbus:scan:map --folder <path> [--limit N] [--batch new|<id>]');
  console.log('  gulp nimbus:plan --folder <path> --batch <id>');
  console.log('  gulp nimbus:propose --batch <id> [--limit N]');
  console.log('  gulp nimbus:preview --batch <id>');
  console.log('  gulp nimbus:approve --batch <id> --pages all|<pageId1,pageId2>');
  console.log('  gulp nimbus:apply --batch <id> --dest <folder> [--git]');
  console.log('  gulp nimbus:check --batch <id>');
  console.log('  gulp nimbus:discover:urls');
  console.log('  gulp nimbus:propose:v2 --batch <id> [--limit N]');
  console.log('  gulp nimbus:cta:jumbo --batch <id> [--limit N] [--pages <list>]');
  console.log('  gulp nimbus:jumbotron --batch <id> [--limit N] [--tone <profile>]');
  console.log('');
  console.log(chalk.yellow('3-Tier Progressive Optimization:'));
  console.log('  gulp nimbus:meta --batch <id> [--pages <list>] [--tone <profile>]        # Tier 1: Meta-only (1-2s)');
  console.log('  gulp nimbus:above-fold --batch <id> [--pages <list>] [--tone <profile>]  # Tier 2: Above-fold (3-5s)');  
  console.log('  gulp nimbus:full-page --batch <id> [--pages <list>] [--tone <profile>]   # Tier 3: Full page (15-30s)');
  console.log('');
  console.log(chalk.yellow('Example:'));
  console.log('  gulp nimbus:scan:map --folder dist/local --limit 5 --batch new');
});

// Task: nimbus:propose:v2
gulp.task('nimbus:propose:v2', async () => {
  console.log(chalk.blue('🚀 Starting V2 Multi-Prompt AI proposals...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    await proposeV2Task.run(options);
    console.log(chalk.green('✅ V2 Multi-prompt proposals completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ V2 Multi-prompt proposals failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:propose:head (head-only optimization for rapid tone testing)
gulp.task('nimbus:propose:head', async () => {
  console.log(chalk.blue('⚡ Starting Head-Only AI optimization...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    // Use head-only mode for rapid testing
    const headOptions = { ...options, headOnly: true };
    await proposeV2Task.run(headOptions);
    console.log(chalk.green('✅ Head-only optimization completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Head-only optimization failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:meta (Tier 1: Meta-Only Optimization)
gulp.task('nimbus:meta', async () => {
  console.log(chalk.blue('⚡ Starting Tier 1: Meta-Only Optimization...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    const result = await progressiveOptimizerTask.runMetaOnly(options);
    console.log(chalk.green('✅ Tier 1: Meta-Only optimization completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Tier 1 optimization failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:above-fold (Tier 2: Above-Fold Optimization)
gulp.task('nimbus:above-fold', async () => {
  console.log(chalk.blue('🎯 Starting Tier 2: Above-Fold Optimization...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    const result = await progressiveOptimizerTask.runAboveFold(options);
    console.log(chalk.green('✅ Tier 2: Above-Fold optimization completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Tier 2 optimization failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:full-page (Tier 3: Full Page Optimization) 
gulp.task('nimbus:full-page', async () => {
  console.log(chalk.blue('🏆 Starting Tier 3: Full Page Optimization...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    const result = await progressiveOptimizerTask.runFullPage(options);
    console.log(chalk.green('✅ Tier 3: Full Page optimization completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Tier 3 optimization failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:discover:urls
gulp.task('nimbus:discover:urls', async () => {
  console.log(chalk.blue('🔍 Discovering URLs for strategic linking...'));
  
  try {
    await urlDiscoveryTask.run(options);
    console.log(chalk.green('✅ URL discovery completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ URL discovery failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:cta:jumbo
gulp.task('nimbus:cta:jumbo', async () => {
  console.log(chalk.blue('🚀 Starting CTA Jumbo Test - Ultra-Fast Above-the-Fold Testing...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    const result = await ctaJumboTestTask.run(options);
    
    if (result.ultra_fast_achieved) {
      console.log(chalk.green(`🏆 ULTRA-FAST GOAL ACHIEVED! (${result.test_time_ms}ms)`));
    } else {
      console.log(chalk.yellow(`⚡ Fast completion: ${result.test_time_ms}ms`));
    }
    
    console.log(chalk.green('✅ CTA Jumbo Test completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ CTA Jumbo Test failed:'), error.message);
    process.exit(1);
  }
});

// Task: nimbus:jumbotron
gulp.task('nimbus:jumbotron', async () => {
  console.log(chalk.blue('🚀 Starting Jumbotron AI Optimizer - Above-the-Fold Testing...'));
  
  if (!options.batch) {
    console.error(chalk.red('❌ Error: --batch option is required'));
    process.exit(1);
  }
  
  try {
    const result = await jumbotronOptimizerTask.run(options);
    
    console.log(chalk.green(`🎯 Optimized ${result.successful_tests} pages in ${result.test_time_ms}ms`));
    console.log(chalk.green('✅ Jumbotron AI Optimization completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Jumbotron AI Optimization failed:'), error.message);
    process.exit(1);
  }
});
