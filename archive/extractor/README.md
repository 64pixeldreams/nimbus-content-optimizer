# Above-the-Fold Content Extractor

A flexible, modular system for extracting hero/jumbotron content from web pages.

## Features

- **Modular Design**: Separate extractors for buttons, content, images, and headings
- **Flexible Container Detection**: Smart detection of hero sections using multiple strategies
- **Validation System**: Validates extracted content and provides quality scores
- **Browser & Node.js Compatible**: Works in both environments
- **Highly Configurable**: Extensive options for customizing extraction behavior

## Structure

```
extractor/
├── index.js                    # Main entry point
├── extractors/
│   ├── button-extractor.js     # Extract CTAs and buttons
│   ├── content-extractor.js    # Extract text content
│   ├── heading-extractor.js    # Extract headings (H1, H2, H3)
│   └── image-extractor.js      # Extract hero images
├── utils/
│   ├── container-finder.js     # Find hero containers
│   └── validator.js            # Validate extracted content
├── test-extractor.js           # Node.js test file
├── browser-example.html        # Browser test page
└── README.md                   # This file
```

## Usage

### Basic Usage

```javascript
import { extractAboveFoldContent } from './extractor/index.js';

const html = `
  <section class="hero-section">
    <h1>Welcome to Our Site</h1>
    <p>This is the main content...</p>
    <button>Get Started</button>
  </section>
`;

const result = extractAboveFoldContent(html);

if (result.success) {
  console.log('H1:', result.extracted.h1);
  console.log('Buttons:', result.extracted.buttons);
  console.log('Valid:', result.validation.isValid);
}
```

### Options

```javascript
const result = extractAboveFoldContent(html, {
  maxDepth: 5,           // How deep to search for container (default: 5)
  minContentLength: 20,  // Minimum paragraph length (default: 20)
  maxButtons: 5,         // Maximum buttons to extract (default: 5)
  includeLinks: true,    // Include non-button links (default: true)
  debug: false          // Enable debug logging (default: false)
});
```

### Extracted Data Structure

```javascript
{
  success: true,
  extracted: {
    h1: "Main Heading",
    h2: ["Subheading 1", "Subheading 2"],
    h3: ["Minor heading"],
    buttons: [
      {
        text: "Get Started",
        type: "button",
        href: null,
        classes: "btn btn-primary",
        priority: 5
      }
    ],
    content: [
      "First paragraph of content...",
      "Second paragraph..."
    ],
    images: [
      {
        src: "/images/hero.jpg",
        alt: "Hero image",
        isHero: true
      }
    ],
    links: [
      {
        text: "Learn More",
        href: "/about",
        classes: "link"
      }
    ],
    container: {
      tag: "section",
      classes: "hero-section",
      id: "hero"
    }
  },
  validation: {
    isValid: true,
    score: 3.5,
    maxScore: 4.5,
    percentage: 78,
    quality: "good",
    feedback: ["✓ Core hero elements present"]
  }
}
```

## Testing

### Node.js Testing

```bash
# Install jsdom for Node.js DOM parsing
npm install jsdom

# Run tests
node test-extractor.js
```

### Browser Testing

Open `browser-example.html` in a web browser and click "Run Extraction" to see results.

## Container Detection Strategy

The extractor uses multiple strategies to find hero containers:

1. **Class/ID Matching**: Looks for common patterns like `hero`, `jumbotron`, `banner`
2. **Content Analysis**: Checks if container has typical hero elements (H1 + buttons/content)
3. **Hierarchical Search**: Searches up the DOM tree from H1 to find the best container

## Customization

### Adding New Patterns

To recognize new container patterns, edit `utils/container-finder.js`:

```javascript
const patterns = [
  'hero', 'jumbotron', 'banner', 'header-content',
  'page-header', 'intro', 'landing', 'above-fold',
  'your-custom-pattern' // Add your pattern here
];
```

### Custom Validators

Add custom validation logic in `utils/validator.js`:

```javascript
export const validators = {
  validateCustomElement(element) {
    // Your validation logic
    return true;
  }
};
```

## Integration with Optimizer

This extractor is designed to work with the content optimization system:

```javascript
// Extract content
const extraction = extractAboveFoldContent(html);

// Send to optimizer
const optimizedContent = await optimizer.optimizeAboveFold({
  blocks: [
    { tag_type: "H1", text: extraction.extracted.h1 },
    { tag_type: "BTN", text: extraction.extracted.buttons[0].text },
    { tag_type: "CONTENT", text: extraction.extracted.content[0] }
  ]
});
```

## Best Practices

1. **Always validate extraction results** before using them
2. **Use appropriate options** for your content type
3. **Test with various HTML structures** to ensure flexibility
4. **Monitor validation scores** to identify extraction issues
5. **Keep extractors focused** - each should do one thing well

## Troubleshooting

### No H1 Found
- Check if H1 is hidden with CSS
- Verify HTML structure has an H1 element
- Enable debug mode for more information

### Low Validation Score
- Check feedback array for specific issues
- Ensure hero section has standard structure
- Verify minimum content requirements are met

### Container Not Found
- Add custom patterns for your HTML structure
- Check if content is deeply nested
- Increase `maxDepth` option if needed

