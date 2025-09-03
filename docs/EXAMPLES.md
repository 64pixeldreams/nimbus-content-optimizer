# 🎯 Real-World Examples

> **Practical usage scenarios and use cases for NimbusAI**

## 🎯 **Overview**

This document provides real-world examples of how to use NimbusAI for different types of websites and content optimization scenarios. Each example includes complete configuration files and expected results.

## 🏪 **E-commerce Product Pages**

### **Scenario: Watch Repair Service**
**Goal:** Extract product information, pricing, and call-to-action elements for AI optimization

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main",
    "above_fold": ".container"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.splash-title",
      "h2",
      "p.text-black",
      "a[href='/start-repair.html']",
      "p.text-center-xs-down"
    ],
    "rest_of_page": [
      "h2.text-center",
      "li",
      "a.underline",
      "p.text-center",
      "img"
    ]
  },
  "metadata_rules": {
    "title": "title",
    "meta_description": "meta[name='description']",
    "canonical": "link[rel='canonical']",
    "favicon": "link[rel='icon']"
  }
}
```

#### **Expected Results**
```json
{
  "head": {
    "title": "Expert Watch Repair In Ballynahinch: Quick Turnaround by Repairs by Post",
    "metaDescription": "For fast and reliable watch repair in Ballynahinch...",
    "canonical": "https://www.repairsbypost.com/branches/watch-repairs-ballynahinch",
    "favicon": "/favicon.ico"
  },
  "above_fold_blocks": [
    {
      "type": "h1",
      "text": "Expert Watch Repair In Ballynahinch",
      "tag_type": "H1"
    },
    {
      "type": "a",
      "anchor": "SUBMIT REPAIR (2 mins)",
      "href": "/start-repair.html",
      "link_type": "cta-money",
      "conversion_priority": "high"
    }
  ],
  "rest_of_page_blocks": [
    {
      "type": "h2",
      "text": "Watch batteries fitted near me?",
      "tag_type": "H2"
    },
    {
      "type": "li",
      "text": "12 months guarantee",
      "tag_type": "CONTENT"
    }
  ]
}
```

### **Scenario: Luxury Watch Brand Page**
**Goal:** Extract brand information, model details, and service offerings

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main.brand-page",
    "above_fold": ".hero-section"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.brand-title",
      "p.brand-description",
      "div.price-range",
      "button.service-cta",
      "img.brand-logo"
    ],
    "rest_of_page": [
      "h3.model-category",
      "li.model-item",
      "div.service-list",
      "a.contact-link"
    ]
  }
}
```

---

## 🏢 **Service Business Landing Pages**

### **Scenario: Local Service Provider**
**Goal:** Extract service information, location details, and contact elements

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main",
    "above_fold": ".hero"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.headline",
      "h2.subheadline",
      "p.intro",
      "button.cta-primary",
      "div.location-info"
    ],
    "rest_of_page": [
      "h3.services",
      "li.service-item",
      "div.testimonial",
      "a.phone-link",
      "div.hours"
    ]
  },
  "metadata_rules": {
    "title": "title",
    "meta_description": "meta[name='description']",
    "og_title": "meta[property='og:title']",
    "favicon": "link[rel='icon']"
  }
}
```

#### **Expected Results**
```json
{
  "above_fold_blocks": [
    {
      "type": "h1",
      "text": "Professional Watch Repair Services",
      "tag_type": "H1"
    },
    {
      "type": "button",
      "text": "Get Free Quote",
      "link_type": "cta-contact",
      "conversion_priority": "high"
    }
  ],
  "rest_of_page_blocks": [
    {
      "type": "h3",
      "text": "Our Services",
      "tag_type": "H3"
    },
    {
      "type": "li",
      "text": "Battery Replacement",
      "tag_type": "CONTENT"
    }
  ]
}
```

---

## 📝 **Blog and Content Pages**

### **Scenario: Technical Blog Post**
**Goal:** Extract article content, author information, and related links

#### **Configuration**
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
      "div.author-info",
      "div.publish-date"
    ],
    "rest_of_page": [
      "h2",
      "h3",
      "p",
      "blockquote",
      "ul",
      "ol",
      "img",
      "a.related-link"
    ]
  }
}
```

### **Scenario: News Article**
**Goal:** Extract headline, summary, and key information

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main.article",
    "above_fold": ".article-header"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.headline",
      "p.summary",
      "div.byline",
      "div.publish-info"
    ],
    "rest_of_page": [
      "h2",
      "p",
      "blockquote",
      "div.related-articles"
    ]
  }
}
```

---

## 🏠 **Real Estate Listings**

### **Scenario: Property Listing Page**
**Goal:** Extract property details, pricing, and contact information

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main.property",
    "above_fold": ".property-hero"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.property-title",
      "div.price",
      "div.location",
      "button.contact-agent",
      "img.property-image"
    ],
    "rest_of_page": [
      "h3.details",
      "li.feature",
      "div.description",
      "a.schedule-tour"
    ]
  }
}
```

---

## 🍕 **Restaurant and Food Service**

### **Scenario: Restaurant Menu Page**
**Goal:** Extract menu items, pricing, and ordering information

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main.menu",
    "above_fold": ".restaurant-header"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.restaurant-name",
      "p.description",
      "div.hours",
      "button.order-online"
    ],
    "rest_of_page": [
      "h3.menu-category",
      "li.menu-item",
      "div.price",
      "a.delivery-link"
    ]
  }
}
```

---

## 🎓 **Educational Content**

### **Scenario: Course Landing Page**
**Goal:** Extract course information, pricing, and enrollment details

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main.course",
    "above_fold": ".course-hero"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.course-title",
      "p.course-description",
      "div.price",
      "button.enroll-now",
      "div.instructor-info"
    ],
    "rest_of_page": [
      "h3.curriculum",
      "li.lesson",
      "div.prerequisites",
      "a.syllabus-link"
    ]
  }
}
```

---

## 🏥 **Healthcare and Medical**

### **Scenario: Medical Practice Page**
**Goal:** Extract services, contact information, and appointment booking

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main.practice",
    "above_fold": ".practice-header"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.practice-name",
      "p.specialty",
      "div.contact-info",
      "button.book-appointment"
    ],
    "rest_of_page": [
      "h3.services",
      "li.service",
      "div.doctor-info",
      "a.insurance-link"
    ]
  }
}
```

---

## 🚗 **Automotive Services**

### **Scenario: Auto Repair Shop**
**Goal:** Extract services, location, and emergency contact

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main.garage",
    "above_fold": ".service-hero"
  },
  "extraction_rules": {
    "above_fold": [
      "h1.service-title",
      "p.emergency-info",
      "div.location",
      "button.emergency-call"
    ],
    "rest_of_page": [
      "h3.service-type",
      "li.service-item",
      "div.warranty",
      "a.directions"
    ]
  }
}
```

---

## 🎯 **AI Pipeline Integration Examples**

### **Scenario: Content Optimization Pipeline**
**Goal:** Extract content for AI analysis and optimization

#### **Configuration**
```json
{
  "inherit": false,
  "selectors": {
    "main": "main",
    "above_fold": ".hero"
  },
  "extraction_rules": {
    "above_fold": [
      "h1",
      "h2",
      "p",
      "a[href*='contact']",
      "button[class*='cta']"
    ],
    "rest_of_page": [
      "h3",
      "li",
      "div.testimonial",
      "a[href*='service']"
    ]
  },
  "metadata_rules": {
    "title": "title",
    "meta_description": "meta[name='description']",
    "canonical": "link[rel='canonical']",
    "og_title": "meta[property='og:title']",
    "favicon": "link[rel='icon']"
  }
}
```

#### **AI Pipeline Usage**
```javascript
// Extract content
const content = await extractContent('page.html', config);

// Send to AI analysis
const analysis = await analyzeContent({
  above_fold: content.above_fold_blocks,
  metadata: content.head,
  context: 'service_business'
});

// Generate optimizations
const optimizations = await generateOptimizations(analysis);

// Apply results
await applyOptimizations(optimizations);
```

### **Scenario: Product Analysis Pipeline**
**Goal:** Extract product information for AI analysis

#### **Configuration**
```json
{
  "extraction_rules": {
    "above_fold": [
      "h1.product-title",
      "p.product-description",
      "div.price",
      "button.add-to-cart",
      "img.product-image"
    ],
    "rest_of_page": [
      "h3.specifications",
      "li.feature",
      "div.reviews",
      "a.related-products"
    ]
  }
}
```

#### **Product Analysis Pipeline**
```javascript
// Extract product data
const productData = await extractContent('product.html', config);

// Analyze product
const productAnalysis = await analyzeProduct({
  title: productData.head.title,
  description: productData.head.metaDescription,
  content: productData.above_fold_blocks
});

// Generate product insights
const insights = await generateInsights(productAnalysis);

// Create optimization recommendations
const recommendations = await createRecommendations(insights);
```

---

## 🔧 **Advanced Configuration Examples**

### **Scenario: Multi-Site Configuration**
**Goal:** Different extraction rules for different site sections

#### **Root Config (dist/extraction-config.json)**
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

#### **Brand Section Config (dist/brands/extraction-config.json)**
```json
{
  "inherit": true,
  "extraction_rules": {
    "above_fold": [
      "h1.brand-title",
      "p.brand-description",
      "div.price-range"
    ],
    "rest_of_page": [
      "h3.model-category",
      "li.model-item",
      "a.service-link"
    ]
  }
}
```

#### **Location Section Config (dist/local/extraction-config.json)**
```json
{
  "inherit": true,
  "extraction_rules": {
    "above_fold": [
      "h1.location-title",
      "p.service-description",
      "a[href='/start-repair.html']"
    ],
    "rest_of_page": [
      "h3.services",
      "li.service-item",
      "div.contact-info"
    ]
  }
}
```

### **Scenario: Conditional Extraction**
**Goal:** Extract different content based on page type

#### **Configuration**
```json
{
  "extraction_rules": {
    "above_fold": [
      "h1",
      "p:not(.hidden)",
      "a:not([href*='external'])",
      "img[src*='hero']"
    ],
    "rest_of_page": [
      "h3:not(.sidebar)",
      "li:not(.navigation)",
      "a[href*='internal']"
    ]
  }
}
```

---

## 📊 **Expected Output Examples**

### **E-commerce Output**
```json
{
  "head": {
    "title": "Rolex Watch Repair - Expert Service",
    "metaDescription": "Professional Rolex watch repair services...",
    "canonical": "https://example.com/rolex-repair",
    "favicon": "/favicon.ico"
  },
  "above_fold_blocks": [
    {
      "type": "h1",
      "text": "Rolex Watch Repair",
      "tag_type": "H1",
      "nimbus_priority": "high"
    },
    {
      "type": "button",
      "text": "Get Quote",
      "link_type": "cta-money",
      "conversion_priority": "high"
    }
  ],
  "rest_of_page_blocks": [
    {
      "type": "h3",
      "text": "Our Services",
      "tag_type": "H3"
    },
    {
      "type": "li",
      "text": "Movement Service",
      "tag_type": "CONTENT"
    }
  ]
}
```

### **Service Business Output**
```json
{
  "head": {
    "title": "Local Watch Repair - Fast Service",
    "metaDescription": "Quick watch repair in your area...",
    "og_title": "Local Watch Repair - Fast Service",
    "favicon": "/favicon.ico"
  },
  "above_fold_blocks": [
    {
      "type": "h1",
      "text": "Expert Watch Repair",
      "tag_type": "H1"
    },
    {
      "type": "a",
      "anchor": "Call Now",
      "href": "tel:555-1234",
      "link_type": "cta-contact",
      "conversion_priority": "high"
    }
  ]
}
```

---

## 🚀 **Best Practices**

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

---

**These examples demonstrate the power and flexibility of NimbusAI for real-world content extraction and AI pipeline integration scenarios.**

