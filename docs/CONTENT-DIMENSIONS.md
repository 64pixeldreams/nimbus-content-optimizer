# 🎯 Content Dimensions System

> **Extract structured business data automatically from web pages**

## 🚀 **Overview**

The Content Dimensions system extracts structured business intelligence from web pages automatically. Instead of just getting raw content, you get **meaningful data** like location, brand, service, product information that can power AI optimization workflows.

## 🎯 **What Are Content Dimensions?**

Content Dimensions are **structured data fields** extracted from web pages:

```json
{
  "dimensions": {
    "location": { "success": true, "value": "ashford", "error": null },
    "brand": { "success": true, "value": "rolex", "error": null },
    "service": { "success": true, "value": "watch repair", "error": null },
    "product": { "success": false, "value": null, "error": "SELECTOR_NOT_FOUND" }
  }
}
```

## 🔧 **Extraction Methods**

### **1. URL Pattern Extraction**
Extract data from file paths using regex patterns.

**Best for:** Consistent URL structures, file naming conventions

```json
{
  "location": {
    "enabled": true,
    "extraction_method": "url_pattern",
    "source": "{absoluteurl}",
    "pattern": "/watch-repairs-([^/]+)\\.html$",
    "extract": "$1"
  }
}
```

**Example:**
- **Input:** `/watch-repairs-ashford.html`
- **Output:** `"ashford"`

### **2. Content Selector Extraction**
Extract data from HTML elements using CSS selectors.

**Best for:** Content within specific HTML elements

```json
{
  "brand": {
    "enabled": true,
    "extraction_method": "content_selector",
    "source": "h1"
  }
}
```

**Example:**
- **HTML:** `<h1><b>Rolex</b> Watch Repair</h1>`
- **Output:** `"rolex watch repair"`

### **3. Static Value Extraction**
Use fixed values for all pages.

**Best for:** Known constants, site-wide services

```json
{
  "service": {
    "enabled": true,
    "extraction_method": "static_value",
    "value": "watch repair"
  }
}
```

**Example:**
- **Output:** `"watch repair"`

### **4. Metadata Lookup**
Extract from already-extracted metadata using source variables.

**Best for:** SEO metadata, structured head data

```json
{
  "brand": {
    "enabled": true,
    "extraction_method": "metadata",
    "source": "{meta-title}"
  }
}
```

**Available Sources:**
- `{meta-title}` - Page title
- `{meta-description}` - Meta description
- `{og-title}` - Open Graph title
- `{og-description}` - Open Graph description
- `{twitter-title}` - Twitter card title
- `{twitter-description}` - Twitter card description
- `{canonical-url}` - Canonical URL
- `{absoluteurl}` - File path

## 🎯 **Real-World Examples**

### **RBP Local Pages**
**URL:** `/watch-repairs-ashford.html`

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

**Result:**
```json
{
  "dimensions": {
    "location": { "success": true, "value": "ashford", "error": null },
    "service": { "success": true, "value": "watch repair", "error": null }
  }
}
```

### **RBP Brand Pages**
**URL:** `/rolex-watch-repair-london.html`

```json
{
  "content_dimensions": {
    "brand": {
      "enabled": true,
      "extraction_method": "url_pattern",
      "source": "{absoluteurl}",
      "pattern": "/([^/]+)-watch-repair-([^/]+)\\.html$",
      "extract": "$1"
    },
    "location": {
      "enabled": true,
      "extraction_method": "url_pattern", 
      "source": "{absoluteurl}",
      "pattern": "/([^/]+)-watch-repair-([^/]+)\\.html$",
      "extract": "$2"
    },
    "service": {
      "enabled": true,
      "extraction_method": "static_value",
      "value": "watch repair"
    }
  }
}
```

**Result:**
```json
{
  "dimensions": {
    "brand": { "success": true, "value": "rolex", "error": null },
    "location": { "success": true, "value": "london", "error": null },
    "service": { "success": true, "value": "watch repair", "error": null }
  }
}
```

### **E-commerce Product Pages**

```json
{
  "content_dimensions": {
    "product": {
      "enabled": true,
      "extraction_method": "content_selector",
      "source": "h1.product-title"
    },
    "brand": {
      "enabled": true,
      "extraction_method": "metadata",
      "source": "{meta-title}"
    },
    "category": {
      "enabled": true,
      "extraction_method": "content_selector",
      "source": ".breadcrumb"
    }
  }
}
```

### **Service Business Pages**

```json
{
  "content_dimensions": {
    "location": {
      "enabled": true,
      "extraction_method": "metadata",
      "source": "{meta-description}"
    },
    "service": {
      "enabled": true,
      "extraction_method": "content_selector",
      "source": "h1"
    }
  }
}
```

## 🚀 **AI Pipeline Integration**

Extracted dimensions automatically enhance AI prompts:

### **Before:**
```
"Optimize this content for better engagement: {content}"
```

### **After:**
```
"Optimize this {service} content for {brand} in {location} for better local engagement: {content}"
```

### **Real Example:**
```
"Optimize this watch repair content for Rolex in Ashford for better local engagement: {content}"
```

## 🔧 **Configuration Guide**

### **1. Enable Dimensions**
Add to your `extraction-config.json`:

```json
{
  "content_dimensions": {
    "location": {
      "enabled": true,
      "extraction_method": "url_pattern",
      "source": "{absoluteurl}",
      "pattern": "/watch-repairs-([^/]+)\\.html$",
      "extract": "$1"
    }
  }
}
```

### **2. Run Extraction**
```bash
gulp nimbus:scan:map --folder ../dist/local
```

### **3. Check Results**
Look for `dimensions` object in `.nimbus/maps/*.json` files:

```json
{
  "path": "/path/to/watch-repairs-ashford.html",
  "head": { ... },
  "blocks": [ ... ],
  "dimensions": {
    "location": { "success": true, "value": "ashford", "error": null }
  }
}
```

## 🎛️ **Advanced Configuration**

### **Fallback Chains**
```json
{
  "brand": {
    "enabled": true,
    "extraction_method": "content_selector",
    "source": "h1",
    "fallback": {
      "method": "metadata",
      "source": "{meta-title}"
    }
  }
}
```

### **Multiple Extractions**
```json
{
  "content_dimensions": {
    "primary_location": {
      "enabled": true,
      "extraction_method": "url_pattern",
      "source": "{absoluteurl}",
      "pattern": "/([^/]+)/",
      "extract": "$1"
    },
    "secondary_location": {
      "enabled": true,
      "extraction_method": "content_selector",
      "source": ".location-tag"
    }
  }
}
```

## 🚨 **Error Handling**

### **Error Codes**
- `NO_DATA_FOUND` - No data extracted from source
- `INVALID_PATTERN` - Regex pattern failed to match
- `SELECTOR_NOT_FOUND` - CSS selector found no elements
- `MISSING_CONFIG` - Required config fields missing
- `INVALID_SOURCE` - Invalid metadata source variable

### **Error Response**
```json
{
  "brand": {
    "success": false,
    "value": null,
    "error": "SELECTOR_NOT_FOUND"
  }
}
```

## 🎯 **Best Practices**

### **1. Start Simple**
- Enable one dimension at a time
- Test with simple patterns first
- Verify results before adding complexity

### **2. Use Appropriate Methods**
- **URL patterns** for consistent file structures
- **Content selectors** for HTML elements
- **Static values** for known constants
- **Metadata lookup** for SEO data

### **3. Plan for Failures**
- Always check `success` field
- Handle `null` values gracefully
- Use fallback methods for reliability

### **4. Performance Optimization**
- URL patterns are fastest
- Content selectors are fast
- Metadata lookup is instant (no DOM parsing)
- Static values are instant

## 📊 **Output Structure**

### **Success Response**
```json
{
  "success": true,
  "value": "ashford",
  "error": null
}
```

### **Failure Response**
```json
{
  "success": false,
  "value": null,
  "error": "SELECTOR_NOT_FOUND"
}
```

### **Complete Dimensions Object**
```json
{
  "dimensions": {
    "location": { "success": true, "value": "ashford", "error": null },
    "brand": { "success": true, "value": "rolex", "error": null },
    "service": { "success": true, "value": "watch repair", "error": null },
    "product": { "success": false, "value": null, "error": "SELECTOR_NOT_FOUND" }
  }
}
```

## 🔗 **Related Documentation**

- **[Configuration Guide](./CONFIG-GUIDE.md)** - Complete config reference
- **[Examples](./EXAMPLES.md)** - Real-world usage scenarios
- **[Architecture](./ARCHITECTURE.md)** - System design and modules
- **[API Reference](./API-REFERENCE.md)** - Technical specifications

## 🚀 **Future Enhancements**

- **AI-powered extraction** - Let AI analyze content and extract dimensions
- **Confidence scoring** - Rate extraction reliability
- **Multi-language support** - Extract from international content
- **Custom processors** - Transform extracted data
- **Validation rules** - Ensure data quality
