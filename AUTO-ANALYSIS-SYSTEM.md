# 🤖 Auto-Analysis System - Intelligent Configuration Generation

## 🎯 **Vision: Zero-Setup Content Optimization**

Transform Nimbus from "configure then optimize" to "analyze then auto-configure then optimize" - making it truly plug-and-play for any website.

---

## 🚀 **Auto-Analysis System Overview**

### **New Command**
```bash
gulp nimbus:analyze --folder dist --domain yourdomain.com --batch auto-config
```

### **What It Does**
1. **🕵️ Business Intelligence Extraction** - Detect business type, services, market
2. **📍 Geographic Analysis** - Extract locations, service areas, target markets  
3. **🎭 Tone Detection** - Analyze existing content for brand personality
4. **🔗 URL Pattern Analysis** - Discover link structure and money pages
5. **📝 Auto-Configuration** - Generate all config files automatically
6. **✅ Validation & Testing** - Verify configuration accuracy

---

## 📋 **Implementation Plan: 6 Core Steps**

### **🔧 Step 1: Website Content Analysis Engine**

**Purpose**: Deep content analysis to understand the business

**Implementation**:
```javascript
// New task: gulp/tasks/analyze.js
async function analyzeWebsiteContent(folderPath, domain) {
  const htmlFiles = await glob(`${folderPath}/**/*.html`);
  const contentAnalysis = {};
  
  for (const file of htmlFiles) {
    const $ = cheerio.load(await fs.readFile(file));
    contentAnalysis[file] = {
      headings: extractHeadings($),
      services: detectServices($),
      locations: detectLocations($),
      contact: extractContactInfo($),
      tone: analyzeContentTone($),
      business_type: detectBusinessType($)
    };
  }
  
  return contentAnalysis;
}
```

**Analysis Functions**:
```javascript
detectBusinessType($) {
  // Analyze content to determine: e-commerce, local-service, professional, multi-location
  const indicators = {
    'local-service': ['repair', 'local', 'area', 'visit us'],
    'e-commerce': ['shop', 'buy', 'cart', 'checkout', 'product'],
    'professional': ['consultation', 'expertise', 'certified', 'qualified'],
    'multi-location': ['branches', 'locations', 'offices', 'stores']
  };
}

detectServices($) {
  // Extract services from content analysis
  const serviceKeywords = extractServiceKeywords($);
  return categorizeServices(serviceKeywords);
}

detectLocations($) {
  // Extract geographic information
  return {
    primary: extractPrimaryLocation($),
    service_areas: extractServiceAreas($),
    postcodes: extractPostcodes($),
    counties: extractCounties($)
  };
}
```

### **🎭 Step 2: Business Personality Detection**

**Purpose**: Analyze existing content to detect brand voice and personality

**Implementation**:
```javascript
async function detectBusinessPersonality(contentAnalysis) {
  const toneIndicators = {
    startup: ['innovative', 'cutting-edge', 'disrupting', 'next-level', 'revolutionary'],
    corporate: ['industry-leading', 'established', 'professional', 'expertise', 'reliable'],
    'local-shop': ['family', 'local', 'community', 'personal', 'neighborhood'],
    'premium-brand': ['luxury', 'exclusive', 'bespoke', 'prestigious', 'elite'],
    'modern-tech': ['simple', 'transparent', 'hassle-free', 'efficient', 'streamlined']
  };
  
  // Analyze content for tone indicators
  const toneScores = calculateToneScores(contentAnalysis, toneIndicators);
  return selectBestToneProfile(toneScores);
}
```

### **📍 Step 3: Geographic Intelligence Extraction**

**Purpose**: Comprehensive location and market analysis

**Implementation**:
```javascript
async function extractGeographicIntelligence(contentAnalysis, domain) {
  return {
    business_locations: extractBusinessLocations(contentAnalysis),
    service_areas: analyzeServiceAreas(contentAnalysis),
    target_markets: identifyTargetMarkets(contentAnalysis),
    geographic_scope: determineGeographicScope(contentAnalysis),
    local_seo_opportunities: findLocalSeoOpportunities(contentAnalysis)
  };
}

// Example geographic extraction
extractBusinessLocations(content) {
  // Look for patterns like:
  // "London office", "Manchester branch", "Birmingham store"
  // "Serving Essex", "County Down coverage", "Greater London area"
  // Extract postcodes: "SW1A 1AA", "M1 1AA", "BT1 1AA"
}
```

### **🔗 Step 4: URL Pattern & Money Page Detection**

**Purpose**: Intelligent detection of conversion pages and link structure

**Implementation**:
```javascript
async function analyzeUrlStructure(htmlFiles, contentAnalysis) {
  const urlAnalysis = {
    money_pages: detectMoneyPages(contentAnalysis),
    page_families: categorizePageFamilies(htmlFiles),
    link_pools: identifyLinkPools(htmlFiles),
    cta_patterns: detectCtaPatterns(contentAnalysis)
  };
  
  return urlAnalysis;
}

detectMoneyPages(content) {
  // Look for conversion indicators:
  const conversionPatterns = [
    '/contact', '/quote', '/book', '/start-', '/checkout', 
    '/cart', '/buy', '/order', '/consultation', '/appointment'
  ];
  
  // Analyze content for conversion intent:
  const conversionContent = ['get quote', 'contact us', 'book now', 'start repair'];
}
```

### **📝 Step 5: Auto-Configuration Generation**

**Purpose**: Generate all configuration files based on analysis

**Implementation**:
```javascript
async function generateConfiguration(analysis) {
  // Generate profile.yaml
  const profile = {
    name: analysis.business.name,
    domain: analysis.business.domain,
    services: analysis.services.detected,
    geo_scope: analysis.geographic.scope,
    goal: generateBusinessGoal(analysis.business.type),
    money_pages: analysis.urls.money_pages,
    trust_links: analysis.business.trust_links,
    phone: analysis.business.phone,
    review_count: analysis.business.reviews
  };
  
  // Generate _directive.yaml
  const directive = generateDirectiveConfig(analysis);
  
  // Generate _link-config.yaml  
  const linkConfig = generateLinkConfig(analysis);
  
  // Generate _tone-profiles.yaml selection
  const toneConfig = selectToneProfiles(analysis.personality);
  
  return { profile, directive, linkConfig, toneConfig };
}
```

### **✅ Step 6: Validation & Testing**

**Purpose**: Verify auto-generated configuration accuracy

**Implementation**:
```javascript
async function validateAutoConfiguration(config, originalContent) {
  const validation = {
    profile_accuracy: validateBusinessInfo(config.profile, originalContent),
    tone_match: validateToneSelection(config.tone, originalContent),
    money_pages_accuracy: validateMoneyPages(config.money_pages, originalContent),
    geographic_accuracy: validateLocations(config.geographic, originalContent)
  };
  
  return validation;
}
```

---

## 🎯 **Auto-Analysis Features**

### **🕵️ Business Intelligence Detection**

**Business Type Classification:**
```javascript
const businessTypes = {
  'local-service': {
    indicators: ['repair', 'local', 'area', 'visit', 'workshop'],
    tone_suggestion: 'local-shop',
    schema_types: ['LocalBusiness'],
    money_pages_pattern: ['/contact', '/quote', '/book']
  },
  'e-commerce': {
    indicators: ['shop', 'buy', 'product', 'cart', 'checkout'],
    tone_suggestion: 'modern-tech',
    schema_types: ['Organization', 'Product'],
    money_pages_pattern: ['/shop', '/checkout', '/cart']
  },
  'professional-services': {
    indicators: ['consultation', 'expertise', 'qualified', 'certified'],
    tone_suggestion: 'corporate', 
    schema_types: ['ProfessionalService'],
    money_pages_pattern: ['/contact', '/consultation', '/book-appointment']
  }
};
```

**Service Detection:**
```javascript
// Extract services from content patterns
const servicePatterns = {
  'watch-repair': ['watch repair', 'timepiece', 'watch service', 'watch battery'],
  'web-design': ['web design', 'website', 'development', 'digital'],
  'legal-services': ['legal', 'law', 'attorney', 'solicitor', 'consultation'],
  'accounting': ['accounting', 'tax', 'bookkeeping', 'financial']
};
```

### **📍 Geographic Intelligence**

**Location Extraction:**
```javascript
// Smart location detection
const locationPatterns = {
  uk_cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool'],
  us_cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
  postcodes: {
    uk: /[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}/g,
    us: /\b\d{5}(-\d{4})?\b/g
  },
  counties: {
    uk: ['Essex', 'Kent', 'Surrey', 'County Down', 'Lancashire'],
    us: ['Orange County', 'Cook County', 'Harris County']
  }
};
```

**Service Area Analysis:**
```javascript
// Detect service coverage
const serviceAreaPatterns = [
  'serving {{city}} and surrounding areas',
  'covering {{county}}',
  '{{postcode}} area coverage',
  'within {{number}} miles of {{city}}'
];
```

---

## 📊 **Auto-Analysis Output**

### **Generated Configuration Summary**
```bash
🤖 NIMBUS AUTO-ANALYSIS COMPLETE:

🏢 BUSINESS DETECTED:
- Type: local-service
- Name: Repairs by Post
- Domain: repairsbypost.com
- Services: watch-repair, battery-replacement, glass-replacement

📍 GEOGRAPHIC ANALYSIS:
- Primary: UK nationwide
- Locations: 93 local service areas detected
- Counties: Essex, Kent, Surrey, County Down, Lancashire
- Postcodes: BT24, CO1, M1, B1, LS1 patterns

🎭 TONE ANALYSIS:
- Detected personality: local-shop (85% confidence)
- Language style: Friendly, professional, community-focused
- Alternative: corporate (12% confidence)

💰 CONVERSION ANALYSIS:
- Money pages: /start-repair.html, /contact.html, /how-it-works.html
- CTA patterns: tel:, /quote, /contact, /start-
- Trust signals: Trustpilot, Google reviews detected

📝 AUTO-GENERATED CONFIG FILES:
✅ profile.yaml - Business configuration
✅ _directive.yaml - Page family rules  
✅ _tone-profiles.yaml - Selected tone profile
✅ _link-config.yaml - URL strategy

🎯 READY FOR OPTIMIZATION:
Run: gulp nimbus:scan:map --folder dist --batch auto-optimized
```

---

## 🔄 **Implementation Phases**

### **Phase 1: Content Analysis Engine** (Week 1)
1. **HTML content parsing** and text analysis
2. **Business type classification** algorithms
3. **Service detection** from content patterns
4. **Contact information extraction**

### **Phase 2: Geographic Intelligence** (Week 2)  
1. **Location extraction** from URLs and content
2. **Postcode and county detection**
3. **Service area analysis** 
4. **Geographic scope determination**

### **Phase 3: Configuration Generation** (Week 3)
1. **Profile.yaml auto-generation**
2. **Directive.yaml family classification**
3. **Tone profile selection** based on content analysis
4. **Link strategy configuration**

### **Phase 4: Validation & Testing** (Week 4)
1. **Configuration accuracy validation**
2. **A/B testing** auto vs manual config
3. **Performance comparison** 
4. **Edge case handling**

---

## 🎯 **Success Criteria**

### **Accuracy Targets**
- **Business type detection**: >90% accuracy
- **Service identification**: >85% accuracy  
- **Geographic extraction**: >95% accuracy
- **Money page detection**: >80% accuracy
- **Tone matching**: >75% user satisfaction

### **Performance Targets**
- **Analysis speed**: <2 minutes for 100-page site
- **Configuration generation**: <30 seconds
- **Validation accuracy**: >90% correct configurations
- **User override rate**: <20% (most configs work as-is)

---

## 🔧 **Technical Architecture**

### **Analysis Task Structure**
```javascript
// gulp/tasks/analyze.js
const analyzeTask = {
  async run(options) {
    const { folder, domain, batch } = options;
    
    // Step 1: Content analysis
    const contentAnalysis = await this.analyzeContent(folder);
    
    // Step 2: Business intelligence
    const businessIntel = await this.extractBusinessIntel(contentAnalysis);
    
    // Step 3: Geographic analysis
    const geoIntel = await this.analyzeGeography(contentAnalysis, domain);
    
    // Step 4: Configuration generation
    const autoConfig = await this.generateConfiguration(businessIntel, geoIntel);
    
    // Step 5: Validation
    const validation = await this.validateConfiguration(autoConfig, contentAnalysis);
    
    // Step 6: Save configurations
    await this.saveConfiguration(autoConfig, validation);
    
    return { autoConfig, validation, analysis: { businessIntel, geoIntel } };
  }
};
```

### **AI Integration for Complex Analysis**
```javascript
// Use AI for sophisticated business analysis
async function analyzeBusinessWithAI(contentSample, domain) {
  const prompt = `Analyze this website content and extract business information:

CONTENT SAMPLE: ${contentSample}
DOMAIN: ${domain}

Extract:
1. Business type (local-service, e-commerce, professional-services, etc.)
2. Primary services offered
3. Target market and geographic scope  
4. Brand personality (startup, corporate, local-shop, premium, etc.)
5. Conversion goals (quotes, sales, bookings, inquiries)

Return structured JSON with confidence scores.`;

  return await callOpenAI(prompt);
}
```

---

## 🎯 **Expected Auto-Generated Configurations**

### **Local Service Business Example**
**Input**: Watch repair website with 93 local pages
**Output**:
```yaml
# Auto-generated profile.yaml
name: "Repairs by Post"  # Extracted from content
domain: "repairsbypost.com"
goal: "Maximise quote submissions"  # Detected from CTA analysis
services: ["watch-repair", "battery-replacement", "glass-replacement"]  # Content analysis
geo_scope: ["UK"]  # Geographic analysis
money_pages: ["/start-repair.html", "/contact.html"]  # Conversion pattern detection
tone_profile: "local-shop"  # Content tone analysis
```

### **E-commerce Example**  
**Input**: Online store with product catalog
**Output**:
```yaml
# Auto-generated profile.yaml
name: "TechGear Store"
goal: "Increase online sales and cart conversions"
services: ["product-sales", "customer-support", "shipping"]
money_pages: ["/shop", "/checkout", "/cart", "/buy-now"]
tone_profile: "modern-tech"
```

---

## 🔍 **Analysis Algorithms**

### **Business Type Detection**
```javascript
const businessTypeDetection = {
  'local-service': {
    url_patterns: ['/branches/', '/locations/', '/areas/'],
    content_patterns: ['local', 'area', 'visit us', 'workshop', 'office'],
    cta_patterns: ['contact us', 'visit', 'call', 'book appointment'],
    confidence_threshold: 0.8
  },
  'e-commerce': {
    url_patterns: ['/shop/', '/products/', '/category/'],
    content_patterns: ['buy', 'shop', 'cart', 'checkout', 'product'],
    cta_patterns: ['add to cart', 'buy now', 'checkout', 'shop now'],
    confidence_threshold: 0.85
  }
};
```

### **Service Detection Algorithms**
```javascript
const serviceDetection = {
  // Industry-specific service patterns
  automotive: ['car repair', 'auto service', 'MOT', 'servicing'],
  healthcare: ['clinic', 'treatment', 'consultation', 'appointment'],
  beauty: ['salon', 'spa', 'treatment', 'beauty', 'hair'],
  legal: ['solicitor', 'legal advice', 'consultation', 'law'],
  financial: ['accounting', 'tax', 'financial advice', 'insurance']
};
```

### **Geographic Scope Detection**
```javascript
const geoScopeDetection = {
  local: {
    indicators: ['local', 'area', 'neighborhood', 'town', 'city'],
    url_patterns: ['/town-name/', '/area-name/'],
    radius_mentions: ['within 10 miles', 'local area', 'nearby']
  },
  regional: {
    indicators: ['county', 'region', 'across', 'throughout'],
    url_patterns: ['/county/', '/region/'],
    coverage_mentions: ['throughout Essex', 'across the North West']
  },
  national: {
    indicators: ['UK', 'nationwide', 'country', 'Britain'],
    coverage_mentions: ['across the UK', 'nationwide service']
  }
};
```

---

## 🎯 **Auto-Analysis Workflow**

### **Complete Auto-Setup Process**
```bash
# 1. Auto-analyze website  
gulp nimbus:analyze --folder dist --domain yourdomain.com --batch auto-setup

# 2. Review generated configuration (optional manual tweaks)
# Generated files: profile.yaml, _directive.yaml, _tone-profiles.yaml, _link-config.yaml

# 3. Start optimization with auto-config
gulp nimbus:scan:map --folder dist --batch auto-optimized
gulp nimbus:plan --batch auto-optimized
gulp nimbus:propose:v2 --batch auto-optimized
```

### **Configuration Confidence & Override**
```bash
🤖 AUTO-ANALYSIS RESULTS:

📊 CONFIDENCE SCORES:
- Business type: local-service (92% confidence)
- Primary services: watch-repair (88% confidence) 
- Geographic scope: UK nationwide (95% confidence)
- Tone profile: local-shop (78% confidence)

⚠️  LOW CONFIDENCE ITEMS (manual review recommended):
- Tone profile: 78% confidence - consider 'corporate' alternative
- Secondary services: Some ambiguity detected

✅ AUTO-GENERATED CONFIG FILES:
- profile.yaml ✅ 
- _directive.yaml ✅
- _tone-profiles.yaml ✅ 
- _link-config.yaml ✅

🔧 MANUAL OVERRIDE OPTIONS:
- Edit generated files before optimization
- Use --tone=corporate to override detected tone
- Add/remove services in profile.yaml as needed
```

---

## 📊 **Implementation Priority**

### **Phase 1: Foundation** (High Value, Medium Complexity)
1. **Content analysis engine** - Extract business info from HTML
2. **Business type detection** - Classify website purpose and market
3. **Basic auto-configuration** - Generate profile.yaml automatically

### **Phase 2: Intelligence** (Medium Value, High Complexity)
4. **Geographic analysis** - Location and service area detection
5. **Tone detection** - Brand personality analysis
6. **URL pattern analysis** - Money page and link structure detection

### **Phase 3: Validation** (High Value, Low Complexity)  
7. **Configuration validation** - Accuracy checking and confidence scores
8. **Manual override system** - Easy tweaking of auto-generated configs
9. **A/B testing framework** - Compare auto vs manual configurations

---

## 🎉 **Expected Benefits**

### **User Experience**
- **⚡ 5-minute setup** vs 30-minute manual configuration
- **🎯 Intelligent defaults** vs guesswork
- **📊 Data-driven decisions** vs assumptions
- **🔄 Consistent quality** across different business types

### **Business Value**
- **🚀 Faster project onboarding** for agencies
- **📈 Better optimization results** with accurate configuration
- **💡 Discovery of optimization opportunities** not manually identified
- **🎯 Reduced configuration errors** and mismatched settings

**This auto-analysis system would make Nimbus truly intelligent and plug-and-play for any website! 🤖**

---

## 🔧 **Ready to Implement?**

**Should we start with Phase 1 (Foundation) to build the content analysis engine and basic auto-configuration?**
