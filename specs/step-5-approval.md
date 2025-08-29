# Step 5: Approval Workflow

## Objective
Create a Gulp task that allows users to review, approve, or reject proposed changes before they are applied to HTML files.

## Input
- **Proposals**: From Step 3 (`.nimbus/work/<batch_id>/proposals/*.json`)
- **Previews**: From Step 4 (`.nimbus/work/<batch_id>/previews/*.html`)
- **User decisions**: Interactive approval choices

## Output
- **Approval records**: `.nimbus/work/<batch_id>/approvals/<page_id>.json` for each page
- **Batch status**: Updated batch.json with approval summary
- **Ready-to-apply changes**: Filtered proposals based on approvals

## Technical Requirements

### 1. Gulp Task Setup
- **Task name**: `nimbus:approve`
- **CLI options**:
  - `--batch <id>`: Batch ID to process (required)
  - `--pages <list>`: Comma-separated list of specific page IDs (optional)
  - `--mode <type>`: Approval mode: interactive|auto|reject (default: interactive)
  - `--confidence <threshold>`: Auto-approve changes above confidence threshold (0.0-1.0)

### 2. Interactive Approval Mode
Present each page for review with options:
```
🔍 APPROVAL REVIEW: watch-repairs-abbots-langley [local/friendly]
Route: /branches/watch-repairs-abbots-langley
Confidence: 90% | Changes: 9

📝 HEAD CHANGES (2):
✏️  Title: "Local Watch Shop..." → "Professional Watch Repairs in Abbots Langley..."
✏️  Meta: "Need watch repairs..." → "Expert watch repair service..."

✏️ CONTENT CHANGES (3):
✏️  H1 [main h1.splash-title]: → "Professional Watch Repairs in Abbots Langley"
✏️  P [main p:nth-of-type(1)]: → "Need expert watch repairs in Abbots Langley?..."
✏️  A [main a.btn:nth-of-type(1)]: → "GET FREE QUOTE (2 MINS)"

🔗 LINK CHANGES (1):
✏️  CTA [main a.btn:nth-of-type(1)]: "QUICK ESTIMATE" → "GET FREE QUOTE (2 MINS)"

🖼️ IMAGE CHANGES (2):
✏️  Alt [main img:nth-of-type(1)]: "" → "Professional watch repair service..."

📋 SCHEMA ADDED: LocalBusiness, BreadcrumbList

Options:
[A] Approve all changes
[R] Reject all changes  
[S] Selective approval (choose individual changes)
[P] Preview in browser
[N] Next page
[Q] Quit

Choice:
```

### 3. Selective Approval Mode
Allow granular control over individual changes:
```
🔍 SELECTIVE APPROVAL: watch-repairs-abbots-langley

📝 HEAD CHANGES:
[1] ✅ Title change (90% confidence) - APPROVED
[2] ✅ Meta description (85% confidence) - APPROVED

✏️ CONTENT CHANGES:
[3] ❓ H1 change (95% confidence) - [A]pprove / [R]eject: A
[4] ❓ P change (80% confidence) - [A]pprove / [R]eject: R
[5] ❓ CTA change (88% confidence) - [A]pprove / [R]eject: A

🔗 LINK CHANGES:
[6] ❓ CTA link (75% confidence) - [A]pprove / [R]eject: A

🖼️ IMAGE CHANGES:
[7] ❓ Alt text (95% confidence) - [A]pprove / [R]eject: A
[8] ❓ Alt text (90% confidence) - [A]pprove / [R]eject: A

📋 SCHEMA:
[9] ❓ LocalBusiness schema (85% confidence) - [A]pprove / [R]eject: A

Summary: 8 approved, 1 rejected
[S] Save decisions / [C] Cancel
```

### 4. Auto-Approval Mode
Automatically approve changes based on confidence threshold:
```bash
gulp nimbus:approve --batch test-batch --mode auto --confidence 0.8
```

Results in:
- Changes ≥ 80% confidence: Auto-approved
- Changes < 80% confidence: Requires manual review
- Summary report of auto-approval decisions

### 5. Approval Record Format
Save detailed approval decisions:
```json
{
  "page_id": "watch-repairs-abbots-langley",
  "batch_id": "test-plan-002",
  "approved_at": "2024-08-29T03:30:15.123Z",
  "approval_mode": "selective",
  "confidence_threshold": null,
  "decisions": {
    "head": {
      "title": { "approved": true, "confidence": 0.90, "reason": "manual" },
      "metaDescription": { "approved": true, "confidence": 0.85, "reason": "manual" }
    },
    "blocks": [
      { "index": 0, "approved": true, "confidence": 0.95, "reason": "manual" },
      { "index": 1, "approved": false, "confidence": 0.80, "reason": "manual" },
      { "index": 2, "approved": true, "confidence": 0.88, "reason": "manual" }
    ],
    "links": [
      { "index": 0, "approved": true, "confidence": 0.75, "reason": "manual" }
    ],
    "alts": [
      { "index": 0, "approved": true, "confidence": 0.95, "reason": "manual" },
      { "index": 1, "approved": true, "confidence": 0.90, "reason": "manual" }
    ],
    "schema": { "approved": true, "confidence": 0.85, "reason": "manual" }
  },
  "summary": {
    "total_changes": 9,
    "approved": 8,
    "rejected": 1,
    "approval_rate": 0.89
  },
  "notes": [
    "Rejected paragraph change - content too generic",
    "All other changes align with local SEO strategy"
  ]
}
```

### 6. Batch Status Update
Update batch.json with approval summary:
```json
{
  "batch_id": "test-plan-002",
  "status": "approvals_complete",
  "approval_summary": {
    "total_pages": 3,
    "pages_reviewed": 3,
    "pages_approved": 2,
    "pages_rejected": 0,
    "pages_partial": 1,
    "total_changes": 27,
    "changes_approved": 24,
    "changes_rejected": 3,
    "approval_rate": 0.89,
    "confidence_threshold": null,
    "approval_mode": "interactive"
  },
  "ready_for_apply": true
}
```

### 7. Progress Reporting
```
🔍 NIMBUS APPROVAL WORKFLOW
Batch: test-plan-002
Mode: interactive

📄 REVIEWING PAGES (3):
✅ home [landing/urgent] → 9/9 changes approved (100%)
⚠️  watch-repairs-abbots-langley [local/friendly] → 8/9 changes approved (89%)
✅ audemars-piguet-watch-repair [brand/professional] → 9/9 changes approved (100%)

📊 APPROVAL SUMMARY:
- Total changes: 27
- Approved: 24 (89%)
- Rejected: 3 (11%)
- Pages ready for apply: 3/3

🎉 Approval workflow complete! Ready for Step 6 (apply changes)
```

### 8. Integration with Preview System
- **[P] Preview option**: Opens HTML preview in browser during review
- **Visual context**: Show CSS selectors and confidence scores
- **Change reasoning**: Display AI notes for each decision

### 9. Approval States
Track approval status for each page:
- **pending**: Not yet reviewed
- **approved**: All changes approved
- **rejected**: All changes rejected  
- **partial**: Some changes approved, some rejected
- **auto**: Auto-approved based on confidence threshold

### 10. Rollback Support
Allow users to modify approval decisions:
```bash
# Re-review specific pages
gulp nimbus:approve --batch test-batch --pages page1,page2

# Change approval mode
gulp nimbus:approve --batch test-batch --mode auto --confidence 0.9
```

## Success Criteria
1. **Interactive review**: User-friendly approval interface
2. **Selective control**: Granular approval of individual changes
3. **Auto-approval**: Confidence-based automatic decisions
4. **Detailed records**: Complete audit trail of approval decisions
5. **Batch tracking**: Summary statistics and status updates
6. **Preview integration**: Seamless preview access during review
7. **Flexible workflow**: Support for different approval modes

## Implementation Notes
- Use `inquirer` or similar for interactive CLI prompts
- Implement keyboard shortcuts for efficient review
- Support batch operations for productivity
- Provide clear visual feedback on decisions
- Allow easy modification of approval decisions
- Generate comprehensive approval reports

## Dependencies
- `inquirer` (interactive CLI prompts)
- Existing: `fs-extra`, `chalk`

## Next Steps
After Step 5 is complete:
- Step 6: Apply approved changes to HTML files
- Step 7: Validation and rollback capabilities

