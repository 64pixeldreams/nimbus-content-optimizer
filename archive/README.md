# Nimbus - AI-Powered Content Optimization System

## Overview
Nimbus is a Gulp-based system that uses AI to optimize website content for SEO and conversion. It scans compiled HTML files, proposes improvements via AI, and applies changes safely with rollback capability.

## Project Structure
```
gulp/
├── README.md                    # This file - project overview & quick start
├── PROJECT-BRIEF.md            # High-level project overview & implementation tickets
├── profile.yaml                # Business configuration for Repairs by Post
├── gulpfile.js                 # Main Gulp configuration with all tasks
├── package.json                # Dependencies and scripts
├── specs/                      # Step-by-step implementation specifications
│   ├── step-1-scanning.md     # Content scanning and mapping specification
│   ├── technical-spec.md      # Detailed optimization rules and policies
│   └── ...                    # Future step specs (plan, propose, preview, etc.)
├── tasks/                      # Gulp task implementations
│   ├── scan.js                # Content scanning and mapping
│   ├── plan.js                # Profile and directive merging
│   ├── propose.js             # AI proposal generation
│   ├── preview.js             # Change preview generation
│   ├── approve.js             # Page approval management
│   ├── apply.js               # Safe change application
│   └── check.js               # Post-apply validation
├── worker/                     # Cloudflare Worker implementation
│   ├── ai-system-prompt.md    # AI instruction set and prompt templates
│   └── worker.js              # Worker code (to be implemented)
└── .nimbus/                   # Generated content maps & work batches
    ├── maps/                   # Content maps for scanned pages
    └── work/                   # Work batches with proposals and diffs
```

## Quick Start
1. Install dependencies: `npm install`
2. Configure `profile.yaml` for your business (already done for Repairs by Post)
3. Run scanning: `gulp nimbus:scan:map --folder dist/local --limit 5 --batch new`
4. Plan optimization: `gulp nimbus:plan --folder dist/local --batch <id>`
5. Get AI proposals: `gulp nimbus:propose --batch <id> --limit 5`
6. Preview changes: `gulp nimbus:preview --batch <id>`
7. Apply approved changes: `gulp nimbus:apply --batch <id> --dest dist`

## Current Status
- ✅ Project structure created and organized
- ✅ Business profile configured (Repairs by Post)
- ✅ Gulp configuration with all task definitions
- ✅ Step-by-step specifications created
- ✅ AI system prompt documented
- 🔄 Step 1: Basic scanning and content mapping (ready to implement)
- ⏳ Step 2: Content mapping refinement
- ⏳ Step 3: Profile and directive system
- ⏳ Step 4: Cloudflare Worker
- ⏳ Step 5: Gulp-Worker integration
- ⏳ Step 6: Preview system
- ⏳ Step 7: Safe application
- ⏳ Step 8: Validation and reporting

## Documentation Files
- **`PROJECT-BRIEF.md`**: Complete project overview with implementation tickets
- **`specs/technical-spec.md`**: Detailed optimization rules and policies
- **`worker/ai-system-prompt.md`**: AI instruction set and prompt templates
- **`specs/step-1-scanning.md`**: Current implementation specification

## Next Steps
1. **Install dependencies**: `cd gulp && npm install`
2. **Implement Step 1**: Create the scanning task in `tasks/scan.js`
3. **Test with sample**: Run scanning on the Abbots Langley page
4. **Validate output**: Ensure content maps are generated correctly

## Testing Strategy
Start with the `dist/local/watch-repairs-abbots-langley.html` file to validate:
- HTML parsing and content extraction
- Main content detection
- CSS selector generation
- Content map structure
- Issue detection (empty trust links, missing alts, etc.)

Once Step 1 is working, we'll move to the AI integration and content optimization phases.
