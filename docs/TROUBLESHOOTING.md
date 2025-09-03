# 🔧 Troubleshooting Guide

> **Common issues, solutions, and debugging tips for NimbusAI**

## 🎯 **Quick Diagnosis**

### **Check These First:**
1. **JSON Syntax** - Is your config file valid JSON?
2. **File Paths** - Are you pointing to the correct directory?
3. **Config Location** - Is the config file in the right place?
4. **Selector Syntax** - Are your CSS selectors correct?

---

## ❌ **Common Issues & Solutions**

### **1. Configuration Issues**

#### **❌ Problem: Invalid JSON in config file**
```
Error: Invalid JSON in extraction-config.json: Unexpected token }
```

**✅ Solution:**
- Check for missing commas between properties
- Ensure all strings are properly quoted
- Validate JSON syntax using an online validator
- Look for trailing commas in arrays/objects

**Example Fix:**
```json
// ❌ Wrong - Missing comma
{
  "selectors": {
    "main": "main"
    "above_fold": ".container"  // Missing comma
  }
}

// ✅ Correct
{
  "selectors": {
    "main": "main",
    "above_fold": ".container"
  }
}
```

#### **❌ Problem: Config file not found**
```
Error: Config file not found: extraction-config.json
```

**✅ Solution:**
- Ensure config file exists in target directory
- Check file name spelling (must be exactly `extraction-config.json`)
- Verify you're running from the correct directory
- Create config file using the template if missing

#### **❌ Problem: Circular inheritance**
```
Error: Circular inheritance detected in config resolution
```

**✅ Solution:**
- Check `inherit: true/false` settings
- Ensure parent configs don't inherit from children
- Verify directory structure makes sense
- Use `inherit: false` for root configs

### **2. Extraction Issues**

#### **❌ Problem: No content extracted (0 blocks)**
```
📊 Extraction summary: 0 above-fold blocks, 0 rest-of-page blocks
```

**✅ Solutions:**

**Check Selectors:**
```json
// ❌ Wrong - Descendant selector instead of separate elements
"above_fold": ["h1 div"]

// ✅ Correct - Separate elements
"above_fold": ["h1", "div"]
```

**Check Container Detection:**
```bash
# Test if containers exist
grep -r "main" your-file.html
grep -r "container" your-file.html
```

**Check File Path:**
```bash
# Verify file exists and is readable
ls -la your-file.html
```

#### **❌ Problem: Wrong content extracted**
```
# Getting navigation instead of main content
```

**✅ Solution:**
- Use more specific selectors
- Check if main container exists
- Verify selector specificity

```json
// ❌ Too broad
"main": "div"

// ✅ More specific
"main": "main.content"
// or
"main": "div.page-content"
```

#### **❌ Problem: Above-fold extraction not working**
```
⚠️ Content class 'main' not found, using full main element
🎯 Found above-fold container: .container (using FIRST occurrence)
```

**✅ Solutions:**

**Check Above-fold Selector:**
```json
// ❌ Wrong - Class without dot
"above_fold": "container"

// ✅ Correct - Class with dot
"above_fold": ".container"
```

**Check HTML Structure:**
```html
<!-- Make sure this exists in your HTML -->
<div class="container">
  <h1>Your content here</h1>
</div>
```

### **3. Metadata Issues**

#### **❌ Problem: No metadata extracted**
```json
{
  "head": {
    "title": "",
    "metaDescription": "",
    "favicon": ""
  }
}
```

**✅ Solutions:**

**Check Metadata Rules:**
```json
// ❌ Wrong - Missing quotes
"title": title

// ✅ Correct - Properly quoted
"title": "title"
```

**Check HTML Head:**
```html
<!-- Make sure these exist -->
<title>Your Page Title</title>
<meta name="description" content="Your description">
<link rel="icon" href="/favicon.ico">
```

**Check Selector Syntax:**
```json
// ❌ Wrong - Missing quotes around attribute value
"meta_description": "meta[name=description]"

// ✅ Correct - Properly quoted
"meta_description": "meta[name='description']"
```

#### **❌ Problem: Favicon not found**
```json
{
  "favicon": ""
}
```

**✅ Solutions:**

**Check Favicon Rules:**
```json
// ✅ Correct - Multiple selectors
"favicon": "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
```

**Check HTML:**
```html
<!-- Make sure one of these exists -->
<link rel="icon" href="/favicon.ico">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

### **4. File and Path Issues**

#### **❌ Problem: File not found**
```
Error: ENOENT: no such file or directory
```

**✅ Solutions:**
- Check file path spelling
- Verify file exists
- Use absolute paths if relative paths fail
- Check file permissions

#### **❌ Problem: Permission denied**
```
Error: EACCES: permission denied
```

**✅ Solutions:**
- Check file permissions
- Run with appropriate user permissions
- Ensure directory is writable
- Check if file is locked by another process

### **5. Performance Issues**

#### **❌ Problem: Slow extraction**
```
# Taking too long to process files
```

**✅ Solutions:**

**Limit Files:**
```bash
# Process only one file for testing
gulp nimbus:scan:map --folder ../dist/local --limit 1
```

**Optimize Selectors:**
```json
// ❌ Too broad - extracts everything
"rest_of_page": ["div"]

// ✅ More specific - extracts only what you need
"rest_of_page": ["div.content", "div.feature"]
```

**Check File Size:**
```bash
# Check if files are too large
ls -lh *.html
```

---

## 🔍 **Debugging Techniques**

### **1. Enable Verbose Logging**
```bash
# Run with detailed output
gulp nimbus:scan:map --folder ../dist/local --limit 1 --verbose
```

### **2. Test Individual Components**
```javascript
// Test config resolution
const { resolveConfig } = require('./tasks/scan/modules/config-manager.js');
const config = await resolveConfig('../dist/local');
console.log('Config:', config);

// Test extraction
const { extractContent } = require('./tasks/extract/index.js');
const content = await extractContent('test.html', config);
console.log('Content:', content);
```

### **3. Validate HTML Structure**
```bash
# Check if selectors exist in HTML
grep -n "main" your-file.html
grep -n "container" your-file.html
grep -n "h1" your-file.html
```

### **4. Test CSS Selectors**
```javascript
// Test selectors in browser console
document.querySelectorAll('h1');
document.querySelectorAll('.container');
document.querySelectorAll('a[href="/start-repair.html"]');
```

### **5. Check Output Files**
```bash
# View extracted JSON
cat .nimbus/maps/your-file.json | jq '.head'
cat .nimbus/maps/your-file.json | jq '.above_fold_blocks'
```

---

## 🛠️ **Diagnostic Commands**

### **Check System Status**
```bash
# Check if all dependencies are installed
npm list

# Check Node.js version
node --version

# Check if gulp is working
gulp --version
```

### **Validate Configuration**
```bash
# Check JSON syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('extraction-config.json', 'utf8')))"

# Validate config structure
node -e "
const config = JSON.parse(require('fs').readFileSync('extraction-config.json', 'utf8'));
console.log('Config valid:', !!config.selectors && !!config.extraction_rules);
"
```

### **Test File Discovery**
```bash
# Check if HTML files are found
find ../dist/local -name "*.html" | head -5

# Check file permissions
ls -la ../dist/local/*.html
```

---

## 🎯 **Common Selector Mistakes**

### **1. Missing Quotes**
```json
// ❌ Wrong
"above_fold": ["a[href=/start-repair.html]"]

// ✅ Correct
"above_fold": ["a[href='/start-repair.html']"]
```

### **2. Wrong Selector Type**
```json
// ❌ Wrong - Descendant selector
"above_fold": ["h1 div"]

// ✅ Correct - Separate elements
"above_fold": ["h1", "div"]
```

### **3. Missing Class Dots**
```json
// ❌ Wrong
"above_fold": "container"

// ✅ Correct
"above_fold": ".container"
```

### **4. Overly Broad Selectors**
```json
// ❌ Wrong - Too broad
"rest_of_page": ["div"]

// ✅ Correct - More specific
"rest_of_page": ["div.content", "div.feature"]
```

---

## 🚀 **Performance Optimization**

### **1. Limit File Processing**
```bash
# Process only one file for testing
gulp nimbus:scan:map --folder ../dist/local --limit 1

# Process specific files
gulp nimbus:scan:map --folder ../dist/local --limit 5
```

### **2. Optimize Selectors**
```json
// ❌ Inefficient - Too many selectors
"rest_of_page": ["h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "span", "a", "img"]

// ✅ Efficient - Only what you need
"rest_of_page": ["h3", "li", "a", "img"]
```

### **3. Use Specific Selectors**
```json
// ❌ Broad - Processes everything
"above_fold": ["div"]

// ✅ Specific - Only target elements
"above_fold": ["div.hero", "div.banner"]
```

---

## 📞 **Getting Help**

### **1. Check Logs**
```bash
# View detailed logs
gulp nimbus:scan:map --folder ../dist/local --limit 1 2>&1 | tee debug.log
```

### **2. Validate Configuration**
```bash
# Test config file
node -e "
try {
  const config = JSON.parse(require('fs').readFileSync('extraction-config.json', 'utf8'));
  console.log('✅ Config is valid JSON');
  console.log('Selectors:', config.selectors);
  console.log('Extraction rules:', config.extraction_rules);
} catch (e) {
  console.log('❌ Config error:', e.message);
}
"
```

### **3. Test Individual Components**
```bash
# Test file discovery
node -e "
const { discoverHtmlFiles } = require('./tasks/scan/modules/file-discovery.js');
discoverHtmlFiles('../dist/local', { limit: 1 }).then(files => {
  console.log('Found files:', files);
});
"
```

### **4. Check HTML Structure**
```bash
# Verify HTML structure
grep -A 5 -B 5 "main" your-file.html
grep -A 5 -B 5 "container" your-file.html
```

---

## 🎯 **Prevention Tips**

### **1. Start Simple**
- Begin with basic selectors (`h1`, `p`, `a`)
- Test extraction results
- Gradually add more specific selectors

### **2. Use Browser Dev Tools**
- Inspect elements to find exact selectors
- Test selectors in browser console
- Verify selector specificity

### **3. Test Incrementally**
- Test one extraction rule at a time
- Verify results before adding more rules
- Use `--limit 1` for quick testing

### **4. Document Your Configs**
- Add comments explaining complex selectors
- Document why specific rules are needed
- Keep configs organized and readable

### **5. Validate Early**
- Check JSON syntax before running
- Test selectors in browser console
- Verify file paths and permissions

---

**This troubleshooting guide covers the most common issues you'll encounter. For additional help, check the logs, validate your configuration, and test individual components to isolate the problem.**

