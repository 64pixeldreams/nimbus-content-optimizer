# 🎛️ Configuration Guide

> **Complete reference for NimbusAI configuration system**

## 🎯 **Overview**

NimbusAI uses a **hierarchical, config-driven system** that allows you to define exactly how content should be extracted from your HTML files. The configuration system supports:

- **🔗 Inheritance** - Parent/child config relationships
- **⚡ Surgical Precision** - Target specific elements with CSS selectors
- **📋 Metadata Control** - Define which head elements to extract
- **🎯 Content Dimensions** - Extract structured business data automatically
- **🎛️ Flexible Rules** - Override any setting at any level

## 📁 **Configuration Files**

### **File Locations**
```
dist/
├── extraction-config.json          # Root configuration
└── local/
    └── extraction-config.json      # Local overrides (inherits from parent)
```

### **File Structure**
```json
{
  "_comment": "NIMBUS CONTENT EXTRACTION CONFIGURATION",
  "_instructions": [...],
  "inherit": false,
  "selectors": {
    "main": "main",
    "above_fold": ".container"
  },
  "extraction_rules": {
    "above_fold": ["h1", "h2", "p"],
    "rest_of_page": ["h3", "li", "a"]
  },
  "metadata_rules": {
    "title": "title",
    "favicon": "link[rel='icon']"
  }
}
```

## 🔗 **Inheritance System**

### **How Inheritance Works**

**Parent Config (`dist/extraction-config.json`):**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main",
    "above_fold": ".container"
  },
  "extraction_rules": {
    "above_fold": ["h1", "h2", "p"],
    "rest_of_page": ["h3", "li", "a"]
  }
}
```

**Child Config (`dist/local/extraction-config.json`):**
```json
{
  "inherit": true,
  "selectors": {},  // Empty = use parent
  "extraction_rules": {
    "above_fold": ["h1", "p", "a[href='/contact.html']"]  // Override specific rules
  }
}
```

**Result:** Child inherits parent selectors, but overrides above_fold extraction rules.

### **Inheritance Rules**
- **`inherit: true`** - Merge with parent config
- **`inherit: false`** - Use only this config (root configs)
- **Empty values** - Use parent value
- **Non-empty values** - Override parent value

## 🎯 **Selectors Configuration**

### **Main Selector**
**Purpose:** Target the main content area (excludes navigation, header, footer)

```json
{
  "selectors": {
    "main": "main"  // Target <main> element
  }
}
```

**Common Examples:**
- `"main"` - Standard HTML5 main element
- `".content"` - Content wrapper class
- `"#main-content"` - Main content ID
- `"article"` - Article element
- `".page-content"` - Page content class

**Leave Empty:** Auto-detection will be used

### **Above-Fold Selector**
**Purpose:** Target the hero/banner section for above-fold optimization

```json
{
  "selectors": {
    "above_fold": ".container"  // Target first .container element
  }
}
```

**Common Examples:**
- `".hero"` - Hero section class
- `".banner"` - Banner section class
- `".container"` - Container class (first occurrence)
- `".jumbotron"` - Bootstrap jumbotron
- `".splash"` - Splash section
- `".hero-section"` - Hero section class

**Leave Empty:** No above-fold separation (all content treated as one block)

## ⚡ **Extraction Rules**

### **Above-Fold Rules**
**Purpose:** Control exactly which elements get extracted from the above-fold area

```json
{
  "extraction_rules": {
    "above_fold": [
      "h1",
      "h2", 
      "p",
      "a[href='/start-repair.html']",
      "button.cta"
    ]
  }
}
```

### **Rest-of-Page Rules**
**Purpose:** Control which elements get extracted from the rest of the page

```json
{
  "extraction_rules": {
    "rest_of_page": [
      "h3",
      "li",
      "a",
      "img",
      "blockquote",
      "div.testimonial"
    ]
  }
}
```

### **CSS Selector Types**

#### **Simple Tags**
```json
["h1", "p", "img", "button", "a"]
```

#### **With Classes**
```json
["h1.headline", "btn.cta", "div.banner", "p.intro"]
```

#### **Child Selectors**
```json
["div.hero > p", "section > h2", "ul.features > li"]
```

#### **Descendant Selectors**
```json
["div.content h3", "section a", "article p"]
```

#### **Attribute Selectors**
```json
[
  "div[class*='banner']",           // Contains 'banner'
  "a[href*='contact']",             // Contains 'contact'
  "a[href='/start-repair.html']",   // Exact href
  "input[type='submit']",           // Input type
  "[class*='btn']",                 // Any element with 'btn' in class
  "[class*='cta']"                  // Any element with 'cta' in class
]
```

#### **Complex Selectors**
```json
[
  "div.hero h1.title",              // Hero div with h1.title
  "section.features ul li",         // Features section list items
  "div[data-section='testimonials'] p",  // Testimonials section paragraphs
  "a.btn-primary[href*='signup']"   // Primary button with signup link
]
```

## 📋 **Metadata Rules**

### **Purpose**
Control which metadata elements get extracted from the `<head>` section

### **Basic Configuration**
```json
{
  "metadata_rules": {
    "title": "title",
    "meta_description": "meta[name='description']",
    "canonical": "link[rel='canonical']",
    "favicon": "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
  }
}
```

### **Complete Metadata Rules**
```json
{
  "metadata_rules": {
    "title": "title",
    "meta_description": "meta[name='description']",
    "canonical": "link[rel='canonical']",
    "og_title": "meta[property='og:title']",
    "og_description": "meta[property='og:description']",
    "og_image": "meta[property='og:image']",
    "twitter_title": "meta[name='twitter:title']",
    "twitter_description": "meta[name='twitter:description']",
    "twitter_image": "meta[name='twitter:image']",
    "favicon": "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
  }
}
```

### **Metadata Field Types**

#### **Title Elements**
- **`title`** - Page title (`<title>`)
- **`og_title`** - Open Graph title
- **`twitter_title`** - Twitter card title

#### **Description Elements**
- **`meta_description`** - Meta description
- **`og_description`** - Open Graph description
- **`twitter_description`** - Twitter card description

#### **Image Elements**
- **`og_image`** - Open Graph image
- **`twitter_image`** - Twitter card image

#### **Link Elements**
- **`canonical`** - Canonical URL
- **`favicon`** - Favicon URL (supports multiple selectors)

### **Special Handling**

#### **Favicon Extraction**
```json
{
  "favicon": "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
}
```
- **Multiple selectors** - Checks in order, uses first found
- **Returns href attribute** - Not content like other meta tags

#### **Title Extraction**
```json
{
  "title": "title"
}
```
- **Returns text content** - Not attributes like other elements

#### **Meta Tag Extraction**
```json
{
  "meta_description": "meta[name='description']"
}
```
- **Returns content attribute** - Standard for meta tags

## 🎯 **Real-World Examples**

### **E-commerce Product Page**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main.product-page",
    "above_fold": ".product-hero"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.product-title",
      "p.price",
      "button.add-to-cart",
      "img.product-image",
      "div.rating"
    ],
    "rest_of_page": [
      "h3.features",
      "div.reviews",
      "li.specifications",
      "p.description"
    ]
  },
  "metadata_rules": {
    "title": "title",
    "meta_description": "meta[name='description']",
    "og_image": "meta[property='og:image']",
    "favicon": "link[rel='icon']"
  }
}
```

### **Service Business Landing Page**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main",
    "above_fold": ".hero-section"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.headline",
      "h2.subheadline",
      "p.intro",
      "button.cta-primary",
      "div.guarantee"
    ],
    "rest_of_page": [
      "h3.services",
      "li.features",
      "div.testimonial",
      "a.contact-link"
    ]
  }
}
```

### **Blog Post**
```json
{
  "inherit": false,
  "selectors": {
    "main": "article",
    "above_fold": ".post-header"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.post-title",
      "p.excerpt",
      "img.featured",
      "div.author-info"
    ],
    "rest_of_page": [
      "h2",
      "h3",
      "p",
      "blockquote",
      "ul",
      "ol",
      "img"
    ]
  }
}
```

### **Local Business Page (Inheritance Example)**
```json
// Parent config (dist/extraction-config.json)
{
  "inherit": false,
  "selectors": {
    "main": "main",
    "above_fold": ".container"
  },
  "extraction_rules": {
    "above_fold": ["h1", "h2", "p", "a", "img"],
    "rest_of_page": ["h3", "li", "a", "img", "div"]
  }
}

// Local config (dist/local/extraction-config.json)
{
  "inherit": true,
  "extraction_rules": {
    "above_fold": [
      "h1",
      "p",
      "a[href='/start-repair.html']"  // Only extract specific CTA
    ]
  }
}
```

## 🎯 **Content Dimensions Configuration**

Content Dimensions extract structured business data from web pages. See **[Content Dimensions Guide](./CONTENT-DIMENSIONS.md)** for complete documentation.

### **Basic Dimensions Setup**
```json
{
  "content_dimensions": {
    "location": {
      "enabled": true,
      "extraction_method": "url_pattern",
      "source": "{absoluteurl}",
      "pattern": "/watch-repairs-([^/]+)\\.html$",
      "extract": "$1"
    },
    "service": {
      "enabled": true,
      "extraction_method": "static_value",
      "value": "watch repair"
    }
  }
}
```

### **Available Extraction Methods**
- **`url_pattern`** - Extract from file paths using regex
- **`content_selector`** - Extract from HTML elements
- **`static_value`** - Use fixed values
- **`metadata`** - Lookup from extracted metadata

### **Metadata Source Variables**
- `{meta-title}` - Page title
- `{meta-description}` - Meta description  
- `{og-title}` - Open Graph title
- `{canonical-url}` - Canonical URL
- `{absoluteurl}` - File path

## 🚀 **Advanced Configuration**

### **Surgical Precision Extraction**
```json
{
  "extraction_rules": {
    "above_fold": [
      "h1.splash-title",                    // Specific class
      "div.hero > p.intro",                 // Child selector
      "a[href='/start-repair.html']",       // Exact href
      "button[class*='cta']",               // Partial class match
      "div[data-section='guarantee']"       // Data attribute
    ]
  }
}
```

### **Conditional Extraction**
```json
{
  "extraction_rules": {
    "above_fold": [
      "h1",
      "p:not(.hidden)",                     // Exclude hidden paragraphs
      "a:not([href*='external'])",          // Exclude external links
      "img[src*='hero']"                    // Only hero images
    ]
  }
}
```

### **Multiple Selector Types**
```json
{
  "extraction_rules": {
    "above_fold": [
      "h1, h2",                            // Multiple tags
      "p.intro, p.lead",                   // Multiple classes
      "div.hero h1, div.banner h2",        // Multiple contexts
      "a[href*='contact'], a[href*='phone']" // Multiple attributes
    ]
  }
}
```

## ⚠️ **Common Pitfalls**

### **1. Incorrect Selector Syntax**
```json
// ❌ Wrong - This is a descendant selector, not separate elements
"above_fold": ["h1 div"]

// ✅ Correct - Separate elements
"above_fold": ["h1", "div"]
```

### **2. Missing Quotes in Selectors**
```json
// ❌ Wrong - Missing quotes around attribute value
"above_fold": ["a[href=/start-repair.html]"]

// ✅ Correct - Properly quoted
"above_fold": ["a[href='/start-repair.html']"]
```

### **3. Inheritance Confusion**
```json
// ❌ Wrong - Child config with inherit: false loses parent settings
{
  "inherit": false,
  "selectors": {}  // Empty selectors = no main/above_fold detection
}

// ✅ Correct - Use inherit: true to merge with parent
{
  "inherit": true,
  "selectors": {}  // Inherits parent selectors
}
```

### **4. Overly Broad Selectors**
```json
// ❌ Wrong - Too broad, extracts everything
"rest_of_page": ["div"]

// ✅ Correct - Specific and targeted
"rest_of_page": ["div.testimonial", "div.feature", "div.contact"]
```

## 🛠️ **Configuration Best Practices**

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

### **5. Leverage Inheritance**
- Use parent configs for common settings
- Override only what's different in child configs
- Keep inheritance hierarchy simple

## 🎯 **Configuration Validation**

### **Automatic Validation**
The system automatically validates:
- **JSON Syntax** - Ensures valid JSON format
- **Required Fields** - Checks for essential configuration
- **Selector Validity** - Basic CSS selector validation
- **Inheritance Logic** - Prevents infinite loops

### **Error Messages**
```
❌ Invalid JSON in config file
✅ Fixed: Check JSON syntax and quotes

❌ Missing selectors in config
✅ Fixed: Add main and above_fold selectors

❌ Circular inheritance detected
✅ Fixed: Check inherit: true/false settings
```

---

**This configuration system provides surgical precision control over content extraction, enabling you to build sophisticated AI pipelines with exactly the data you need.**

