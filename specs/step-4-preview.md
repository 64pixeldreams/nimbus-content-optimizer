# Step 4: Preview System

## Objective
Create a Gulp task that generates beautiful, human-readable previews of proposed content changes before they are applied to HTML files.

## Input
- **Proposals**: From Step 3 (`.nimbus/work/<batch_id>/proposals/*.json`)
- **Original content**: From content maps and HTML files

## Output
- **Preview files**: `.nimbus/work/<batch_id>/previews/<page_id>.html` for each page
- **Summary report**: Overview of all changes across the batch
- **Diff reports**: Side-by-side comparison of original vs proposed content

## Technical Requirements

### 1. Gulp Task Setup
- **Task name**: `nimbus:preview`
- **CLI options**:
  - `--batch <id>`: Batch ID to preview (required)
  - `--pages <list>`: Comma-separated list of specific page IDs (optional)
  - `--format <type>`: Output format: html|markdown|console (default: html)
  - `--open`: Automatically open preview in browser

### 2. Preview HTML Template
Generate styled HTML previews with:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Nimbus Preview: {page_title}</title>
  <style>
    /* Beautiful CSS for diff display */
    .preview-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .change-section { margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; }
    .change-header { background: #f5f5f5; padding: 15px; font-weight: bold; }
    .change-content { padding: 15px; }
    .diff-container { display: flex; gap: 20px; }
    .diff-before, .diff-after { flex: 1; }
    .diff-before { background: #fff5f5; border-left: 4px solid #ff6b6b; }
    .diff-after { background: #f5fff5; border-left: 4px solid #51cf66; }
    .confidence-badge { float: right; padding: 4px 8px; border-radius: 12px; }
    .high-confidence { background: #51cf66; color: white; }
    .medium-confidence { background: #ffd43b; color: black; }
    .low-confidence { background: #ff6b6b; color: white; }
  </style>
</head>
<body>
  <div class="preview-container">
    <!-- Preview content -->
  </div>
</body>
</html>
```

### 3. Change Categories
Organize changes by type:

#### 3.1 Head Metadata Changes
```html
<div class="change-section">
  <div class="change-header">
    📝 Head Metadata Changes
    <span class="confidence-badge high-confidence">85% confidence</span>
  </div>
  <div class="change-content">
    <div class="diff-container">
      <div class="diff-before">
        <h4>Before:</h4>
        <p><strong>Title:</strong> Local Watch Shop In Abbots Langley by Repairs by Post</p>
        <p><strong>Description:</strong> Need watch repairs in Abbots Langley? Repairs by Post is the best choice...</p>
      </div>
      <div class="diff-after">
        <h4>After:</h4>
        <p><strong>Title:</strong> Professional Watch Repairs in Abbots Langley | Free Collection & 12-Month Guarantee</p>
        <p><strong>Description:</strong> Expert watch repair service in Abbots Langley. Rolex, Omega, TAG Heuer specialists...</p>
      </div>
    </div>
  </div>
</div>
```

#### 3.2 Content Block Changes
```html
<div class="change-section">
  <div class="change-header">
    ✏️ Content Changes (5)
    <span class="confidence-badge high-confidence">90% confidence</span>
  </div>
  <div class="change-content">
    <div class="change-item">
      <p><strong>Selector:</strong> <code>main h1.splash-title</code></p>
      <div class="diff-container">
        <div class="diff-before">
          <p>Local Watch Shop in Abbots Langley</p>
        </div>
        <div class="diff-after">
          <p>Professional Watch Repairs in Abbots Langley</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 3.3 Link Changes
```html
<div class="change-section">
  <div class="change-header">
    🔗 Link Changes (2)
    <span class="confidence-badge medium-confidence">75% confidence</span>
  </div>
  <div class="change-content">
    <div class="change-item">
      <p><strong>Selector:</strong> <code>main a.btn:nth-of-type(1)</code></p>
      <div class="diff-container">
        <div class="diff-before">
          <p><strong>Text:</strong> QUICK ESTIMATE (2 mins)</p>
          <p><strong>URL:</strong> /start-repair.html</p>
        </div>
        <div class="diff-after">
          <p><strong>Text:</strong> GET FREE QUOTE (2 MINS)</p>
          <p><strong>URL:</strong> /start-repair.html</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 3.4 Image Alt Text Changes
```html
<div class="change-section">
  <div class="change-header">
    🖼️ Image Alt Text Changes (3)
    <span class="confidence-badge high-confidence">95% confidence</span>
  </div>
  <div class="change-content">
    <div class="change-item">
      <p><strong>Image:</strong> <code>main img:nth-of-type(1)</code></p>
      <p><strong>Source:</strong> https://dreamy-darwin-447c03.netlify.app/assets/img/watch_repair_near_me.png</p>
      <div class="diff-container">
        <div class="diff-before">
          <p><strong>Alt:</strong> <em>(empty)</em></p>
        </div>
        <div class="diff-after">
          <p><strong>Alt:</strong> Professional watch repair service in Abbots Langley - Rolex, Omega, TAG Heuer specialists</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 3.5 Schema Markup
```html
<div class="change-section">
  <div class="change-header">
    📋 Schema.org Markup
    <span class="confidence-badge high-confidence">88% confidence</span>
  </div>
  <div class="change-content">
    <p><strong>Schema Types:</strong> LocalBusiness, BreadcrumbList</p>
    <details>
      <summary>View Schema JSON</summary>
      <pre><code>{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "name": "Repairs by Post - Abbots Langley",
      ...
    }
  ]
}</code></pre>
    </details>
  </div>
</div>
```

### 4. Summary Statistics
```html
<div class="preview-summary">
  <h2>📊 Change Summary</h2>
  <div class="stats-grid">
    <div class="stat-item">
      <div class="stat-number">12</div>
      <div class="stat-label">Total Changes</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">85%</div>
      <div class="stat-label">Avg Confidence</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">3</div>
      <div class="stat-label">High Priority</div>
    </div>
  </div>
</div>
```

### 5. AI Reasoning Notes
```html
<div class="change-section">
  <div class="change-header">🤖 AI Optimization Notes</div>
  <div class="change-content">
    <ul>
      <li>Enhanced title with location-specific targeting for Abbots Langley</li>
      <li>Added LocalBusiness schema for local SEO optimization</li>
      <li>Strengthened CTAs with urgency and time-sensitive language</li>
      <li>Incorporated review count and ratings for trust building</li>
      <li>Added comprehensive alt text for better accessibility and SEO</li>
    </ul>
  </div>
</div>
```

### 6. Console Preview Mode
For quick terminal preview:
```
🔍 NIMBUS PREVIEW REPORT
Page: watch-repairs-abbots-langley [local/friendly]
Route: /branches/watch-repairs-abbots-langley
Confidence: 85%

📝 HEAD CHANGES (2):
✏️  Title: "Local Watch Shop In Abbots Langley..." → "Professional Watch Repairs in Abbots Langley..."
✏️  Meta: "Need watch repairs in Abbots Langley?..." → "Expert watch repair service in Abbots Langley..."

✏️ CONTENT CHANGES (5):
✏️  H1 [main h1.splash-title]: "Local Watch Shop..." → "Professional Watch Repairs..."
✏️  H2 [main h2:nth-of-type(1)]: "Professional, Affordable..." → "Expert Watch Repair Service..."

🔗 LINK CHANGES (2):
✏️  CTA [main a.btn:nth-of-type(1)]: "QUICK ESTIMATE" → "GET FREE QUOTE (2 MINS)"

🖼️ IMAGE CHANGES (3):
✏️  Alt [main img:nth-of-type(1)]: "" → "Professional watch repair service in Abbots Langley"

📋 SCHEMA ADDED: LocalBusiness, BreadcrumbList

🤖 AI NOTES:
- Enhanced title with location-specific targeting
- Added LocalBusiness schema for local SEO
- Strengthened CTAs with urgency language
```

### 7. Batch Preview Summary
```html
<div class="batch-summary">
  <h1>🎯 Batch Preview: test-plan-002</h1>
  <div class="batch-stats">
    <p><strong>Pages:</strong> 3 | <strong>Total Changes:</strong> 27 | <strong>Avg Confidence:</strong> 89%</p>
  </div>
  
  <div class="page-grid">
    <div class="page-card">
      <h3>home [landing/urgent]</h3>
      <p>9 changes • 84% confidence</p>
      <a href="home.html">View Preview →</a>
    </div>
    <div class="page-card">
      <h3>watch-repairs-abbots-langley [local/friendly]</h3>
      <p>9 changes • 90% confidence</p>
      <a href="watch-repairs-abbots-langley.html">View Preview →</a>
    </div>
  </div>
</div>
```

## Success Criteria
1. **Beautiful HTML previews**: Professional, readable change visualization
2. **Side-by-side diffs**: Clear before/after comparisons
3. **Organized by change type**: Head, content, links, images, schema
4. **Confidence indicators**: Visual confidence scoring
5. **AI reasoning**: Clear explanation of optimization decisions
6. **Batch overview**: Summary across all pages
7. **Console mode**: Quick terminal preview option

## Implementation Notes
- Start with HTML preview format
- Use CSS for beautiful diff styling
- Include confidence badges and color coding
- Add collapsible sections for detailed data
- Support opening previews in browser
- Generate batch-level summary pages

## Dependencies
- Existing: `fs-extra`, `chalk`
- Optional: `open` (for browser opening)

## Next Steps
After Step 4 is complete:
- Step 5: Approval workflow (approve/reject changes)
- Step 6: Apply changes to HTML files
