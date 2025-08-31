# 🧠 Semantic HTML Rewriter System
**TASK 2: Build semantic HTML rewriter system - convert HTML to Markdown for AI, preserve Bootstrap classes and formatting**

## 🎯 Problem Statement

Current content optimization fails because:
- **JSON parsing errors** from complex HTML with quotes, newlines, special chars
- **Lost formatting** when AI rewrites content blocks  
- **Bootstrap classes stripped** during content transformation
- **Inline elements broken** (badges, icons, links) in AI output

## 💡 Solution: Semantic Rewriter Pipeline

Replace current enhanced extraction → JSON → AI approach with:
**HTML → Semantic Markdown → AI → HTML** pipeline that preserves all formatting.

## 🛠️ Technical Implementation

### Dependencies to Install
```bash
npm install turndown marked cheerio
```

### Core Components

#### 1️⃣ `extractContentBlocks()`
- Use Cheerio to extract semantic content blocks
- Target: `p`, `h1`, `h2`, `h3`, `ul`, `ol`, `div` with content
- Filter out empty/navigation blocks

#### 2️⃣ `htmlToSemanticMarkdown()`  
- Convert complex HTML tags to semantic placeholders
- Map: `<span class="badge bg-info">` → `<badge>`
- Map: `<i class="fa fa-check">` → `<icon>`
- Map: `<a class="btn">` → `<link>`
- Use Turndown to convert to clean Markdown

#### 3️⃣ `promptRewrite(markdown)`
- Send clean Markdown to AI with semantic placeholders
- AI rewrites content while preserving `<badge>`, `<icon>`, `<link>` tags
- No JSON escaping issues - pure Markdown format

#### 4️⃣ `semanticMarkdownToHtml()`
- Convert AI Markdown back to HTML using Marked
- Restore semantic placeholders to original HTML tags
- Map: `<badge>` → `<span class="badge bg-info">`
- Preserve all Bootstrap 5 classes and attributes

#### 5️⃣ `replaceInDOM()`
- Update Cheerio DOM with rewritten HTML
- Maintain DOM structure and positioning

## 📋 Implementation Plan

### Phase 1: Core Rewriter Module
- [ ] Create `lib/semantic-rewriter.js`
- [ ] Implement tag mapping system
- [ ] Build HTML ↔ Markdown converters
- [ ] Add comprehensive tests

### Phase 2: Integration 
- [ ] Replace enhanced extraction in `tasks/scan.js`
- [ ] Update content prompt in `worker/worker-openai.js`
- [ ] Modify progressive optimizer to use new system
- [ ] Test with existing Tier 2/3 optimizations

### Phase 3: Validation
- [ ] Test Bootstrap class preservation
- [ ] Verify icon/badge/link functionality  
- [ ] Compare AI output quality vs current system
- [ ] Performance benchmarking

## 🧪 Test Cases

```javascript
// 1. Preserve semantic placeholders
expect(markdown).toContain('<badge>');
expect(markdown).toContain('<icon>');

// 2. AI maintains placeholders
expect(aiOutput).toContain('<link>');

// 3. Final HTML has Bootstrap classes
expect(finalHTML).toContain('badge bg-info');
expect(finalHTML).toContain('fa fa-check');
```

## 📊 Success Metrics

- ✅ **Zero JSON parsing errors** in content optimization
- ✅ **100% Bootstrap class preservation** after AI rewrite
- ✅ **Functional icons/badges/links** in output HTML
- ✅ **Improved AI content quality** with clean Markdown input
- ✅ **Tier 3 full-page optimization working** without failures

## 🔄 Rollback Plan

If implementation fails:
```bash
git checkout fix-inline-link-scanning
git branch -D semantic-rewriter-system
```

Current working system preserved on `fix-inline-link-scanning` branch.

## 🎯 Expected Outcome

**Rock-solid content optimization pipeline** that:
- Handles complex HTML without breaking
- Preserves all visual formatting and interactivity
- Produces higher quality AI rewrites
- Scales to production batch processing

---
**Priority: HIGH** - Fixes critical Tier 3 optimization failures
**Effort: 2-3 hours** - Well-defined technical approach
**Risk: LOW** - Rollback plan ensures no regression
