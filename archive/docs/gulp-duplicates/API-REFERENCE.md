# 📚 API Reference

> **Complete module documentation and interface reference**

## 🎯 **Overview**

This document provides comprehensive API documentation for all NimbusAI modules, including function signatures, parameters, return values, and usage examples.

## 🔍 **Scan Layer API**

### **📁 `gulp/tasks/scan/index.js`**

**Main orchestrator for the scanning process**

#### **`scanContent(folderPath, options)`**
```javascript
async function scanContent(folderPath, options = {})
```

**Parameters:**
- `folderPath` (string) - Path to folder containing HTML files
- `options` (object) - Configuration options
  - `limit` (number) - Maximum number of files to process
  - `customMainSelector` (string) - Override main selector
  - `customAboveFoldSelector` (string) - Override above-fold selector
  - `customContentClass` (string) - Override content class

**Returns:**
- `Promise<Object>` - Scan results with file processing summary

**Example:**
```javascript
const results = await scanContent('../dist/local', {
  limit: 5,
  customMainSelector: 'main',
  customAboveFoldSelector: '.hero'
});
```

---

### **📁 `gulp/tasks/scan/modules/config-manager.js`**

**Configuration management and inheritance system**

#### **`resolveConfig(folderPath, visited)`**
```javascript
async function resolveConfig(folderPath, visited = new Set())
```

**Parameters:**
- `folderPath` (string) - Path to resolve config for
- `visited` (Set) - Set of visited paths (prevents infinite loops)

**Returns:**
- `Promise<Object>` - Resolved configuration object

**Example:**
```javascript
const config = await resolveConfig('../dist/local');
// Returns: { selectors: {...}, extraction_rules: {...}, metadata_rules: {...} }
```

#### **`createConfig(folderPath, templatePath)`**
```javascript
async function createConfig(folderPath, templatePath)
```

**Parameters:**
- `folderPath` (string) - Path where config should be created
- `templatePath` (string) - Path to template config file

**Returns:**
- `Promise<void>` - Creates config file

**Example:**
```javascript
await createConfig('../dist/local', './templates/extraction-config.json');
```

#### **`validateConfig(config)`**
```javascript
function validateConfig(config)
```

**Parameters:**
- `config` (object) - Configuration object to validate

**Returns:**
- `Object` - Validated configuration with defaults

**Example:**
```javascript
const validated = validateConfig(rawConfig);
// Returns: { main: string|null, above_fold: string|null, extraction_rules: object|null, metadata_rules: object|null }
```

---

### **📁 `gulp/tasks/scan/modules/file-discovery.js`**

**HTML file discovery and filtering**

#### **`discoverHtmlFiles(folderPath, options)`**
```javascript
async function discoverHtmlFiles(folderPath, options = {})
```

**Parameters:**
- `folderPath` (string) - Path to search for HTML files
- `options` (object) - Discovery options
  - `limit` (number) - Maximum files to return
  - `exclude` (array) - File patterns to exclude

**Returns:**
- `Promise<Array>` - Array of HTML file paths

**Example:**
```javascript
const files = await discoverHtmlFiles('../dist/local', { limit: 10 });
// Returns: ['../dist/local/page1.html', '../dist/local/page2.html']
```

---

### **📁 `gulp/tasks/scan/modules/utils.js`**

**Shared utilities for scan operations**

#### **`normalizePath(path)`**
```javascript
function normalizePath(path)
```

**Parameters:**
- `path` (string) - Path to normalize

**Returns:**
- `string` - Normalized path

#### **`isValidHtmlFile(filePath)`**
```javascript
function isValidHtmlFile(filePath)
```

**Parameters:**
- `filePath` (string) - File path to validate

**Returns:**
- `boolean` - True if valid HTML file

---

## ⚙️ **Extract Layer API**

### **📁 `gulp/tasks/extract/index.js`**

**Main orchestrator for content extraction**

#### **`extractContent(filePath, options)`**
```javascript
async function extractContent(filePath, options = {})
```

**Parameters:**
- `filePath` (string) - Path to HTML file
- `options` (object) - Extraction options
  - `customMainSelector` (string) - Override main selector
  - `contentClass` (string) - Content class selector
  - `aboveFoldClass` (string) - Above-fold class selector
  - `extractionRules` (object) - Extraction rules
  - `metadataRules` (object) - Metadata extraction rules

**Returns:**
- `Promise<Object>` - Extracted content object

**Example:**
```javascript
const content = await extractContent('page.html', {
  customMainSelector: 'main',
  aboveFoldClass: '.hero',
  extractionRules: {
    above_fold: ['h1', 'p'],
    rest_of_page: ['h3', 'li']
  }
});
```

---

### **📁 `gulp/tasks/extract/modules/dom-isolator.js`**

**DOM isolation and content separation**

#### **`isolateMainContent($, mainSelector)`**
```javascript
function isolateMainContent($, mainSelector)
```

**Parameters:**
- `$` (Cheerio) - Cheerio instance
- `mainSelector` (string) - Main content selector

**Returns:**
- `Cheerio` - Isolated main content DOM

**Example:**
```javascript
const mainContent = isolateMainContent($, 'main');
```

#### **`isolateAboveFold($, aboveFoldSelector)`**
```javascript
function isolateAboveFold($, aboveFoldSelector)
```

**Parameters:**
- `$` (Cheerio) - Cheerio instance
- `aboveFoldSelector` (string) - Above-fold selector

**Returns:**
- `Cheerio` - Isolated above-fold DOM

**Example:**
```javascript
const aboveFold = isolateAboveFold($, '.container');
```

#### **`removeAboveFoldFromRest(restOfPage, aboveFold)`**
```javascript
function removeAboveFoldFromRest(restOfPage, aboveFold)
```

**Parameters:**
- `restOfPage` (Cheerio) - Rest-of-page DOM
- `aboveFold` (Cheerio) - Above-fold DOM

**Returns:**
- `Cheerio` - Rest-of-page with above-fold removed

---

### **📁 `gulp/tasks/extract/modules/block-extractor.js`**

**Surgical element extraction and block processing**

#### **`extractBlocks($, selectors, options)`**
```javascript
function extractBlocks($, selectors, options = {})
```

**Parameters:**
- `$` (Cheerio) - Cheerio instance
- `selectors` (array) - Array of CSS selectors
- `options` (object) - Extraction options
  - `context` (string) - Context for logging
  - `enhanceBlocks` (boolean) - Whether to enhance blocks
  - `processInlineElements` (boolean) - Whether to process inline elements

**Returns:**
- `Array` - Array of extracted blocks

**Example:**
```javascript
const blocks = extractBlocks($, ['h1', 'p', 'a'], {
  context: 'above_fold',
  enhanceBlocks: true
});
```

#### **`enhanceBlock(block, $, options)`**
```javascript
function enhanceBlock(block, $, options = {})
```

**Parameters:**
- `block` (object) - Block to enhance
- `$` (Cheerio) - Cheerio instance
- `options` (object) - Enhancement options

**Returns:**
- `object` - Enhanced block with metadata

#### **`processInlineElements(block, $)`**
```javascript
function processInlineElements(block, $)
```

**Parameters:**
- `block` (object) - Block to process
- `$` (Cheerio) - Cheerio instance

**Returns:**
- `object` - Block with processed inline elements

---

### **📁 `gulp/tasks/extract/modules/content-classifier.js`**

**Content classification and categorization**

#### **`classifyContent(blocks)`**
```javascript
function classifyContent(blocks)
```

**Parameters:**
- `blocks` (array) - Array of content blocks

**Returns:**
- `Array` - Classified blocks with content types

**Example:**
```javascript
const classified = classifyContent(blocks);
// Returns blocks with added: tag_type, nimbus_priority, extraction_method
```

#### **`determineContentType(block)`**
```javascript
function determineContentType(block)
```

**Parameters:**
- `block` (object) - Block to classify

**Returns:**
- `string` - Content type classification

---

### **📁 `gulp/tasks/extract/modules/content-finder.js`**

**Container detection and content finding**

#### **`findMainContent($, mainSelector)`**
```javascript
function findMainContent($, mainSelector)
```

**Parameters:**
- `$` (Cheerio) - Cheerio instance
- `mainSelector` (string) - Main content selector

**Returns:**
- `Cheerio` - Main content container

#### **`findAboveFoldContent($, aboveFoldSelector)`**
```javascript
function findAboveFoldContent($, aboveFoldSelector)
```

**Parameters:**
- `$` (Cheerio) - Cheerio instance
- `aboveFoldSelector` (string) - Above-fold selector

**Returns:**
- `Cheerio` - Above-fold container

---

### **📁 `gulp/tasks/extract/modules/metadata-extractor.js`**

**Head section metadata extraction**

#### **`extractHeadMetadata($, metadataRules)`**
```javascript
function extractHeadMetadata($, metadataRules = {})
```

**Parameters:**
- `$` (Cheerio) - Cheerio instance
- `metadataRules` (object) - Metadata extraction rules

**Returns:**
- `Object` - Extracted metadata object

**Example:**
```javascript
const metadata = extractHeadMetadata($, {
  title: "title",
  meta_description: "meta[name='description']",
  favicon: "link[rel='icon']"
});
// Returns: { title: "...", metaDescription: "...", favicon: "..." }
```

**Metadata Fields:**
- `title` - Page title
- `metaDescription` - Meta description
- `canonical` - Canonical URL
- `ogTitle` - Open Graph title
- `ogDescription` - Open Graph description
- `ogImage` - Open Graph image
- `twitterTitle` - Twitter title
- `twitterDescription` - Twitter description
- `twitterImage` - Twitter image
- `favicon` - Favicon URL

---

## 📊 **Data Structures**

### **Content Block Structure**
```javascript
{
  i: 1,                              // Index
  id: "2",                           // Unique ID
  type: "h1",                        // Element type
  tag_type: "H1",                    // Content classification
  text: "Expert Watch Repair",       // Text content
  selector: "isolated-container h1", // CSS selector
  nimbus_priority: "normal",         // Priority level
  extraction_method: "enhanced_container", // Extraction method
  inline_elements: [...],            // Nested elements
  enhanced: true,                    // Enhancement flag
  // Link-specific fields
  anchor: "SUBMIT REPAIR",           // Link text
  href: "/start-repair.html",        // Link URL
  link_type: "cta-money",           // Link classification
  conversion_priority: "high"        // Conversion priority
}
```

### **Metadata Structure**
```javascript
{
  title: "Expert Watch Repair In Ballynahinch",
  metaDescription: "For fast and reliable watch repair...",
  canonical: "https://www.repairsbypost.com/...",
  ogTitle: "Expert Watch Repair In Ballynahinch",
  ogDescription: "For fast and reliable watch repair...",
  ogImage: "",
  twitterTitle: "Expert Watch Repair In Ballynahinch",
  twitterDescription: "For fast and reliable watch repair...",
  twitterImage: "",
  favicon: "/favicon.ico"
}
```

### **Extraction Results Structure**
```javascript
{
  head: { /* metadata object */ },
  above_fold_blocks: [ /* array of blocks */ ],
  rest_of_page_blocks: [ /* array of blocks */ ],
  selector_map: { /* selector mapping */ },
  extraction_config: { /* config used */ }
}
```

---

## 🎯 **Usage Examples**

### **Basic Content Extraction**
```javascript
const { extractContent } = require('./tasks/extract/index.js');

const content = await extractContent('page.html', {
  customMainSelector: 'main',
  aboveFoldClass: '.hero',
  extractionRules: {
    above_fold: ['h1', 'h2', 'p'],
    rest_of_page: ['h3', 'li', 'a']
  }
});

console.log(`Extracted ${content.above_fold_blocks.length} above-fold blocks`);
console.log(`Extracted ${content.rest_of_page_blocks.length} rest-of-page blocks`);
```

### **Config Resolution**
```javascript
const { resolveConfig } = require('./tasks/scan/modules/config-manager.js');

const config = await resolveConfig('../dist/local');
console.log('Main selector:', config.main);
console.log('Above-fold selector:', config.above_fold);
console.log('Extraction rules:', config.extraction_rules);
```

### **Metadata Extraction**
```javascript
const { extractHeadMetadata } = require('./tasks/extract/modules/metadata-extractor.js');
const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('page.html', 'utf8');
const $ = cheerio.load(html);

const metadata = extractHeadMetadata($, {
  title: "title",
  meta_description: "meta[name='description']",
  favicon: "link[rel='icon']"
});

console.log('Page title:', metadata.title);
console.log('Favicon:', metadata.favicon);
```

### **Block Extraction**
```javascript
const { extractBlocks } = require('./tasks/extract/modules/block-extractor.js');

const blocks = extractBlocks($, ['h1', 'p', 'a[href*="contact"]'], {
  context: 'above_fold',
  enhanceBlocks: true
});

blocks.forEach(block => {
  console.log(`${block.type}: ${block.text}`);
  if (block.href) {
    console.log(`  Link: ${block.href}`);
  }
});
```

---

## ⚠️ **Error Handling**

### **Common Error Types**

#### **Configuration Errors**
```javascript
// Invalid JSON in config file
throw new Error('Invalid JSON in extraction-config.json: Unexpected token }');

// Missing required fields
throw new Error('Missing required field: selectors.main');
```

#### **Extraction Errors**
```javascript
// File not found
throw new Error('File not found: page.html');

// Invalid selector
throw new Error('Invalid CSS selector: h1 div');
```

#### **DOM Errors**
```javascript
// Container not found
console.warn('Content class "main" not found, using full main element');

// Above-fold not found
console.warn('Above-fold container ".container" not found');
```

### **Error Handling Best Practices**
```javascript
try {
  const content = await extractContent('page.html', options);
  // Process content
} catch (error) {
  console.error('Extraction failed:', error.message);
  // Handle error appropriately
}
```

---

## 🚀 **Performance Considerations**

### **Memory Management**
- **DOM Isolation** - Creates separate Cheerio instances to reduce memory usage
- **Block Processing** - Processes blocks individually to avoid memory spikes
- **Cleanup** - Properly disposes of large DOM objects

### **Processing Optimization**
- **Surgical Extraction** - Only extracts specified elements
- **Config Caching** - Caches resolved configurations
- **Batch Processing** - Processes multiple files efficiently

### **Scalability**
- **Modular Design** - Easy to scale individual components
- **Config-Driven** - No hardcoded limits or assumptions
- **Error Recovery** - Graceful handling of edge cases

---

**This API reference provides complete documentation for building custom extraction workflows and integrating NimbusAI into larger systems.**

