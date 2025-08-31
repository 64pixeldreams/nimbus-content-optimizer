# Step 1: Basic Scanning and Content Mapping

## Objective
Create a Gulp task that scans compiled HTML files in the `dist/` folder and generates content maps for AI optimization.

## Input
- **Source**: `dist/local/*.html`, `dist/brands/*.html`, `dist/index.html`
- **Focus**: Start with `dist/local/watch-repairs-abbots-langley.html` as test case

## Output
- **Content maps**: `/.nimbus/maps/<pageId>.json` for each scanned page
- **Index file**: `/.nimbus/maps/index.json` listing all scanned pages

## Technical Requirements

### 1. Gulp Task Setup
- **Task name**: `nimbus:scan:map`
- **CLI options**:
  - `--folder <path>`: Target folder (e.g., `dist/local`)
  - `--limit N`: Maximum pages to scan (default: 10)
  - `--batch new|<id>`: Create new batch or use existing
  - `--main "#selector"`: Custom main content selector (optional)

### 2. HTML Parsing
- Use `cheerio` for HTML parsing (lightweight, jQuery-like API)
- Parse HTML files and extract DOM structure
- Handle malformed HTML gracefully

### 3. Main Content Detection
**Priority order for finding main content**:
1. `<main>` tag
2. `[role="main"]` attribute
3. `<article>` tag
4. `#content` ID
5. `.content` class
6. **Heuristic fallback**: Highest text-density container under `<body>`

**Exclude from main content**:
- `<header>`, `<nav>`, `<footer>`, `<aside>`
- `<script>`, `<style>`, `<link>`
- Global banners, navigation elements

### 4. Content Block Extraction
Extract these elements **in reading order** (top to bottom):

**Text blocks**:
- `<h1>`, `<h2>`, `<h3>`: Headings with text content
- `<p>`: Paragraphs with text content
- `<li>`: List items with text content
- `<blockquote>`: Blockquotes with text content

**Interactive elements**:
- `<a>`: Links with `href` and anchor text
- `<img>`: Images with `src`, `alt`, `width`, `height`

### 5. CSS Selector Generation
Generate **stable, unique selectors** for each element:
- Use `nth-of-type()` for repeated elements
- Include class names when available
- Ensure selectors can reliably target elements

**Examples**:
- `main h1.splash-title`
- `main h2:nth-of-type(1)`
- `main p:nth-of-type(3)`
- `main a.btn-success`

### 6. Content Map Schema
```json
{
  "path": "dist/local/watch-repairs-abbots-langley.html",
  "route": "/branches/watch-repairs-abbots-langley",
  "engine": "html",
  "main_selector": "main",
  "head": {
    "title": "Local Watch Shop In Abbots Langley by Repairs by Post",
    "metaDescription": "Need watch repairs in Abbots Langley? Repairs by Post is the best choice...",
    "canonical": "https://www.repairsbypost.com/branches/watch-repairs-abbots-langley",
    "ogImage": "",
    "twitterImage": ""
  },
  "blocks": [
    {
      "i": 0,
      "type": "h1",
      "text": "Local Watch Shop in Abbots Langley",
      "selector": "main h1.splash-title"
    },
    {
      "i": 1,
      "type": "h2", 
      "text": "Professional, Affordable Watch Repairs in Abbots Langley",
      "selector": "main h2:nth-of-type(1)"
    },
    {
      "i": 2,
      "type": "p",
      "text": "Need watch repairs in Abbots Langley? Repairs by Post is the best choice...",
      "selector": "main p:nth-of-type(1)"
    },
    {
      "i": 3,
      "type": "a",
      "anchor": "QUICK ESTIMATE (2 mins)",
      "href": "/start-repair.html",
      "selector": "main a.btn-success"
    },
    {
      "i": 4,
      "type": "img",
      "src": "https://dreamy-darwin-447c03.netlify.app/assets/img/watch_repair_near_me.png",
      "alt": "",
      "width": 600,
      "height": 221,
      "selector": "main img[width='600'][height='221']"
    }
  ],
  "links_present": [
    {"anchor": "Trustpilot", "href": ""},
    {"anchor": "Google Places", "href": ""}
  ],
  "images_present": [
    {"src": "...png", "alt": ""}
  ],
  "flags": {
    "usedHeuristicMain": false,
    "typosFound": ["braclet", "acredited"]
  }
}
```

### 7. Issue Detection
**Flag obvious problems**:
- Empty Trustpilot/Google review links
- Missing image alt text
- Missing image width/height attributes
- Basic typos (dictionary check)

## Success Criteria
1. **Can scan 5+ HTML files** without errors
2. **Generates unique content maps** for each page
3. **Captures local content** (city names, services, CTAs)
4. **Selectors are stable** and can reliably target elements
5. **Main content detection** works correctly
6. **Issue flags** are populated appropriately

## Implementation Notes
- Start with simple file discovery and HTML parsing
- Focus on getting the basic structure working first
- Test with the Abbots Langley page to validate output
- Ensure selectors are unique and targetable
- Handle edge cases gracefully (missing elements, malformed HTML)

## Dependencies
- `gulp` (v4)
- `cheerio` (HTML parsing)
- `glob` (file discovery)
- `fs-extra` (file operations)

## Next Steps
After Step 1 is complete and validated:
- Step 2: Refine content mapping and add more sophisticated issue detection
- Step 3: Implement profile and directive system
