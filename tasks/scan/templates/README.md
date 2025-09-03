# Content Dimensions Configuration Guide

## 🎯 Overview

Content Dimensions allow you to extract structured data like location, brand, service, and product information from your HTML pages. This data is then available in your AI optimization prompts for context-aware content generation.

## 🔧 Extraction Methods

### 1. **url_pattern** - Extract from URLs using regex
- **Best for:** Consistent URL structures
- **Performance:** Fastest - no HTML parsing needed
- **Example:** `/watch-repairs-ashford.html` → `town: "ashford"`

### 2. **content_selector** - Extract from HTML elements
- **Best for:** Content within specific HTML elements
- **Performance:** Fast - simple DOM selection
- **Example:** `h1` → "Rolex Watch Repair in London" → extract brand/location

### 3. **ai_extraction** - AI-powered content analysis
- **Best for:** Complex content that needs interpretation
- **Performance:** Slower but most intelligent
- **Example:** AI analyzes any text and extracts structured data

### 4. **static_value** - Use fixed value for all pages
- **Best for:** Known constants (e.g., all pages are "watch repair" service)
- **Performance:** Instant
- **Example:** `"value": "watch repair"`

### 5. **metadata** - Extract from meta tags
- **Best for:** SEO metadata extraction
- **Performance:** Fast
- **Example:** `meta[name="keywords"]` → extract brand names

## 📦 Source Options

| Source | Description | Example |
|--------|-------------|---------|
| `{absoluteurl}` | Full page URL | `https://example.com/watch-repairs-ashford.html` |
| `h1` | Main heading | `<h1>Rolex Watch Repair in London</h1>` |
| `meta[name='description']` | Meta description | `<meta name="description" content="...">` |
| `.brand-name` | Any CSS selector | `<div class="brand-name">Rolex</div>` |
| `h1, .title` | Multiple selectors | First match wins |

## 🎯 Real-World Examples

### RBP Local Pages
**URL Pattern:** `/watch-repairs-{town}.html`

```json
{
  "location": {
    "enabled": true,
    "extraction_method": "url_pattern",
    "source": "{absoluteurl}",
    "pattern": "/watch-repairs-([^/]+)\\.html$",
    "extract": "$1",
    "fallback": {
      "method": "ai_extraction",
      "source": "h1",
      "prompt": "Extract the UK town or city name from this text: {source}"
    }
  },
  "service": {
    "enabled": true,
    "extraction_method": "static_value",
    "value": "watch repair"
  }
}
```

### RBP Brand Pages
**URL Pattern:** `/{brand}-watch-repair-{town}.html`

```json
{
  "brand": {
    "enabled": true,
    "extraction_method": "url_pattern",
    "source": "{absoluteurl}",
    "pattern": "/([^/]+)-watch-repair-([^/]+)\\.html$",
    "extract": "$1",
    "fallback": {
      "method": "content_selector",
      "source": "h1",
      "ai_prompt": "Extract the watch brand name from this text: {source}"
    }
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
```

### E-commerce Product Pages

```json
{
  "product": {
    "enabled": true,
    "extraction_method": "content_selector",
    "source": "h1.product-title",
    "ai_prompt": "Extract the product name from this text: {source}"
  },
  "brand": {
    "enabled": true,
    "extraction_method": "content_selector",
    "source": ".brand-name, meta[name='brand']",
    "ai_prompt": "Extract the brand name from this text: {source}"
  },
  "category": {
    "enabled": true,
    "extraction_method": "ai_extraction",
    "source": ".breadcrumb",
    "prompt": "Extract the product category from this breadcrumb: {source}"
  }
}
```

### Service Business Pages

```json
{
  "location": {
    "enabled": true,
    "extraction_method": "ai_extraction",
    "source": "h1, meta[name='description']",
    "prompt": "Extract the city or town name from this text: {source}"
  },
  "service": {
    "enabled": true,
    "extraction_method": "content_selector",
    "source": "h1",
    "ai_prompt": "Extract the main service type from this text: {source}"
  }
}
```

### FAQ/Help Pages

```json
{
  "faq_title": {
    "enabled": true,
    "extraction_method": "content_selector",
    "source": "h1, .faq-title"
  },
  "topic": {
    "enabled": true,
    "extraction_method": "ai_extraction",
    "source": "h1, .breadcrumb",
    "prompt": "Extract the help topic or category from this text: {source}"
  }
}
```

## 🚀 AI Prompt Integration

Extracted dimensions automatically enhance your AI prompts:

**Before:**
```
"Optimize this content for better engagement: {content}"
```

**After:**
```
"Optimize this {service} content for {brand} in {location} for better local engagement: {content}"
```

**Real Example:**
```
"Optimize this watch repair content for Rolex in Ashford for better local engagement: {content}"
```

## 🔧 Regex Pattern Guide

### Common URL Patterns

| Pattern | Matches | Extracts |
|---------|---------|----------|
| `/([^/]+)-([^/]+)\\.html$` | `/rolex-london.html` | `$1: rolex`, `$2: london` |
| `/watch-repairs-([^/]+)\\.html$` | `/watch-repairs-ashford.html` | `$1: ashford` |
| `/brand/([^/]+)/?$` | `/brand/rolex/` | `$1: rolex` |
| `/local/([^/]+)/?$` | `/local/ashford/` | `$1: ashford` |
| `/([^/]+)/([^/]+)/([^/]+)$` | `/brand/rolex/repair` | `$1: brand`, `$2: rolex`, `$3: repair` |

### Regex Tips
- `([^/]+)` = Capture anything except forward slash
- `\\.html$` = Literal `.html` at end of string
- `/?$` = Optional trailing slash at end
- `$1, $2, $3` = Reference captured groups in order

## ⚡ Performance Tips

1. **Use URL patterns first** - Fastest extraction method
2. **Add fallbacks** - Ensures data extraction even when primary method fails
3. **Static values** - Use for known constants to avoid processing
4. **AI extraction last** - Most powerful but slowest, use as fallback

## 🎯 Best Practices

1. **Start simple** - Enable one dimension at a time
2. **Test patterns** - Use regex testers to validate URL patterns
3. **Generic prompts** - Avoid hardcoded values in AI prompts
4. **Fallback chains** - Always have a backup extraction method
5. **Enable selectively** - Only extract dimensions you actually use

## 🔍 Testing Your Configuration

1. Set `enabled: true` for dimensions you want to extract
2. Run: `gulp nimbus:scan:map --folder ../dist/local`
3. Check results in `.nimbus/maps/` folder
4. Look for `dimensions` object in the output JSON

## 📝 Configuration Template

Copy this template and customize for your needs:

```json
{
  "content_dimensions": {
    "location": {
      "enabled": false,
      "extraction_method": "url_pattern",
      "source": "{absoluteurl}",
      "pattern": "",
      "extract": "",
      "fallback": {
        "method": "ai_extraction",
        "source": "h1",
        "prompt": "Extract the location from this text: {source}"
      }
    }
  }
}
```
