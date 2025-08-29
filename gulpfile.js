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
  
  if (!options.batch || !options.pages) {
    console.error(chalk.red('❌ Error: --batch and --pages options are required'));
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
  
  if (!options.batch || !options.dest) {
    console.error(chalk.red('❌ Error: --batch and --dest options are required'));
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
  console.log('');
  console.log(chalk.yellow('Example:'));
  console.log('  gulp nimbus:scan:map --folder dist/local --limit 5 --batch new');
});
