# Step 6: Apply Changes

## Objective
Create a Gulp task that applies approved content changes to HTML files using surgical precision with CSS selectors.

## Input
- **Approval records**: From Step 5 (`.nimbus/work/<batch_id>/approvals/*.json`)
- **Original HTML files**: Source files to be modified
- **Content maps**: CSS selectors and element targeting data

## Output
- **Modified HTML files**: Updated files with approved changes applied
- **Backup files**: Original files preserved with `.backup` extension
- **Application report**: Summary of changes applied successfully
- **Error log**: Any changes that failed to apply

## Technical Requirements

### 1. Gulp Task Setup
- **Task name**: `nimbus:apply`
- **CLI options**:
  - `--batch <id>`: Batch ID to apply (required)
  - `--dest <path>`: Destination folder for modified files (optional, defaults to original location)
  - `--pages <list>`: Comma-separated list of specific page IDs (optional)
  - `--backup`: Create backup files before modification (default: true)
  - `--git`: Create git commit after applying changes
  - `--dry-run`: Show what would be applied without making changes

### 2. Change Application Strategy
Apply changes in this order to avoid selector conflicts:
1. **Schema markup**: Add to `<head>` section
2. **Head metadata**: Update title, meta description, etc.
3. **Content blocks**: Update text content using CSS selectors
4. **Link changes**: Update anchor text and href attributes
5. **Image alt text**: Update alt attributes

### 3. CSS Selector-Based Updates
Use precise CSS selector targeting:
```javascript
// Example: Update H1 text
const selector = 'main h1.splash-title';
const newText = 'Professional Watch Repairs in Abbots Langley';

// Find element and update
const element = $(selector);
if (element.length === 1) {
  element.text(newText);
  console.log(`✅ Updated: ${selector}`);
} else {
  console.warn(`⚠️  Selector matched ${element.length} elements: ${selector}`);
}
```

### 4. Safe Application Process
- **Backup creation**: Save original files with `.backup` extension
- **Selector validation**: Ensure selectors match exactly one element
- **Content verification**: Validate changes don't break HTML structure
- **Rollback capability**: Preserve ability to restore original files

### 5. Head Metadata Updates
```javascript
// Update page title
if (approvedChanges.head.title) {
  $('title').text(approvedChanges.head.title);
}

// Update meta description
if (approvedChanges.head.metaDescription) {
  $('meta[name="description"]').attr('content', approvedChanges.head.metaDescription);
}

// Add canonical URL if missing
if (approvedChanges.head.canonical && !$('link[rel="canonical"]').length) {
  $('head').append(`<link rel="canonical" href="${approvedChanges.head.canonical}">`);
}
```

### 6. Schema Markup Addition
```javascript
// Add JSON-LD schema to head
if (approvedChanges.schema) {
  const schemaScript = `<script type="application/ld+json">
${JSON.stringify(approvedChanges.schema, null, 2)}
</script>`;
  
  $('head').append(schemaScript);
}
```

### 7. Content Block Updates
```javascript
// Update content blocks
approvedChanges.blocks.forEach((block, index) => {
  if (!block.approved) return;
  
  const element = $(block.selector);
  if (element.length === 1) {
    element.text(block.new_text);
    console.log(`✅ Content block ${index + 1}: ${block.selector}`);
  } else {
    console.warn(`⚠️  Ambiguous selector (${element.length} matches): ${block.selector}`);
  }
});
```

### 8. Link Updates
```javascript
// Update links
approvedChanges.links.forEach((link, index) => {
  if (!link.approved) return;
  
  const element = $(link.selector);
  if (element.length === 1) {
    if (link.new_anchor) element.text(link.new_anchor);
    if (link.new_href) element.attr('href', link.new_href);
    console.log(`✅ Link ${index + 1}: ${link.selector}`);
  } else {
    console.warn(`⚠️  Ambiguous selector (${element.length} matches): ${link.selector}`);
  }
});
```

### 9. Image Alt Text Updates
```javascript
// Update image alt text
approvedChanges.alts.forEach((alt, index) => {
  if (!alt.approved) return;
  
  const element = $(alt.selector);
  if (element.length === 1) {
    element.attr('alt', alt.new_alt);
    console.log(`✅ Image alt ${index + 1}: ${alt.selector}`);
  } else {
    console.warn(`⚠️  Ambiguous selector (${element.length} matches): ${alt.selector}`);
  }
});
```

### 10. Error Handling and Validation
- **Selector validation**: Warn if selectors match 0 or >1 elements
- **HTML validation**: Check for broken structure after changes
- **Encoding preservation**: Maintain original HTML encoding
- **Whitespace preservation**: Keep original formatting where possible

### 11. Application Report
```
🔧 NIMBUS CHANGE APPLICATION REPORT
Batch: test-plan-002
Destination: dist/ (with backups)

📄 PROCESSING PAGES (3):
✅ home [landing/urgent] → 9/9 changes applied successfully
✅ watch-repairs-abbots-langley [local/friendly] → 8/9 changes applied (1 warning)
✅ audemars-piguet-watch-repair [brand/professional] → 9/9 changes applied successfully

📊 APPLICATION SUMMARY:
- Total changes attempted: 27
- Successfully applied: 26 (96%)
- Warnings/issues: 1 (4%)
- Files modified: 3
- Backups created: 3

⚠️  WARNINGS:
- watch-repairs-abbots-langley: Selector 'main p:nth-of-type(4)' matched 0 elements

✅ All files updated successfully!
💾 Git commit created: "Applied Nimbus optimizations - batch test-plan-002"
```

### 12. Backup and Rollback
```javascript
// Create backup before modification
const backupPath = originalPath + '.backup';
await fs.copy(originalPath, backupPath);

// Apply changes...

// Rollback capability
async rollback(batchId) {
  // Restore from .backup files
  const backupFiles = glob.sync('./**/*.backup');
  for (const backupFile of backupFiles) {
    const originalFile = backupFile.replace('.backup', '');
    await fs.copy(backupFile, originalFile);
  }
}
```

### 13. Git Integration
```javascript
// Optional git commit after successful application
if (options.git) {
  await exec('git add .');
  await exec(`git commit -m "Applied Nimbus optimizations - batch ${batchId}"`);
  console.log('📝 Git commit created');
}
```

### 14. Dry Run Mode
Show what would be applied without making changes:
```
🔍 DRY RUN - Changes that would be applied:

📄 watch-repairs-abbots-langley.html:
✅ Title: "Local Watch Shop..." → "Professional Watch Repairs in Abbots Langley..."
✅ Meta: "Need watch repairs..." → "Expert watch repair service in Abbots Langley..."
✅ H1 [main h1.splash-title]: → "Professional Watch Repairs in Abbots Langley"
✅ CTA [main a.btn:nth-of-type(1)]: → "GET FREE QUOTE (2 MINS)"
✅ Alt [main img:nth-of-type(1)]: → "Professional watch repair service..."
✅ Schema: LocalBusiness + BreadcrumbList markup

📊 SUMMARY: 26 changes would be applied to 3 files
```

### 15. File Handling
- **Preserve encoding**: Maintain UTF-8 or original encoding
- **Maintain formatting**: Keep original indentation and structure
- **Handle edge cases**: Empty files, malformed HTML, missing elements
- **Cross-platform paths**: Handle Windows/Unix path differences

## Success Criteria
1. **Surgical precision**: Changes applied exactly where intended
2. **Backup safety**: Original files preserved before modification
3. **Error resilience**: Graceful handling of selector mismatches
4. **Comprehensive reporting**: Clear summary of what was applied
5. **Rollback capability**: Ability to restore original files
6. **Git integration**: Optional commit creation after changes
7. **Validation**: HTML structure integrity maintained

## Implementation Notes
- Use `cheerio` for HTML manipulation (consistent with scanning)
- Implement robust error handling for selector edge cases
- Preserve original file formatting and encoding
- Create comprehensive application logs
- Support both in-place and destination folder updates
- Test with various HTML structures and edge cases

## Dependencies
- Existing: `cheerio`, `fs-extra`, `glob`
- Optional: `child_process` (for git operations)

## Next Steps
After Step 6 is complete:
- Step 7: Validation and quality checks
- Step 8: Rollback and recovery tools
- Complete end-to-end testing
