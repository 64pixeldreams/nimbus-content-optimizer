# Language & Tone Configuration System

## 🎯 Goal: Configurable Language Patterns for Any Market/Business

### **Language Configuration Files**

**Base Language Config:**
```yaml
# _language-config.yaml
language_patterns:
  uk_english:
    authority_words: ["#1", "number one", "leading", "premier", "top", "best", "experts"]
    avoid_words: ["brilliant", "amazing", "awesome"] # Overused/American
    quality_indicators: ["professional", "certified", "accredited", "qualified"]
    trust_builders: ["trusted", "reliable", "established", "proven"]
    urgency_phrases: ["today", "now", "immediately", "same day", "24-hour"]
    
  us_english:
    authority_words: ["#1", "top-rated", "premier", "leading", "best-in-class"]
    avoid_words: ["brilliant", "proper"] # UK-specific
    quality_indicators: ["certified", "licensed", "professional", "expert"]
    trust_builders: ["trusted", "reliable", "established", "award-winning"]
    urgency_phrases: ["today", "now", "same day", "fast", "quick"]
    
  australian_english:
    authority_words: ["top", "leading", "premier", "best", "#1"]
    quality_indicators: ["qualified", "professional", "certified", "expert"]
    trust_builders: ["trusted", "reliable", "fair dinkum", "honest"]
```

### **Business Type Language Patterns**

```yaml
# Business-specific language config
business_language:
  local_service:
    positioning: ["{{location}}'s {{authority_word}} {{service}}", "{{location}} {{trust_builder}}"]
    value_props: ["free collection", "local expertise", "{{location}} specialists"]
    pain_points: ["nearest {{service}}", "local {{service}} {{location}}"]
    cta_patterns: ["Get your {{service}} sorted {{urgency}}", "{{location}} {{service}} quote"]
    
  professional_service:
    positioning: ["{{authority_word}} {{service}} {{specialists}}", "{{trust_builder}} {{service}}"]
    value_props: ["{{quality_indicator}} advice", "{{authority_word}} expertise"]
    pain_points: ["{{service}} specialist", "{{quality_indicator}} {{service}}"]
    cta_patterns: ["Get {{quality_indicator}} advice", "Speak to {{service}} {{authority_word}}"]
    
  e_commerce:
    positioning: ["{{authority_word}} {{product}} supplier", "{{trust_builder}} {{product}} store"]
    value_props: ["{{quality_indicator}} products", "{{trust_builder}} service"]
    pain_points: ["{{quality_indicator}} {{product}}", "{{trust_builder}} supplier"]
    cta_patterns: ["Shop {{authority_word}} {{products}}", "Get {{trust_builder}} {{product}}"]
```

### **Tone Configuration Matrix**

```yaml
# Tone combinations for different contexts
tone_configs:
  sales_local_friendly:
    language_base: "uk_english"
    business_type: "local_service"
    modifiers:
      - "Add urgency without pressure"
      - "Emphasize local convenience and trust"
      - "Use {{location}} throughout naturally"
      - "Include social proof and guarantees"
    
  authority_professional:
    language_base: "uk_english" 
    business_type: "professional_service"
    modifiers:
      - "Emphasize expertise and qualifications"
      - "Use {{quality_indicator}} language"
      - "Build authority through experience"
      - "Professional without being cold"
      
  seo_informational:
    language_base: "uk_english"
    business_type: "information"
    modifiers:
      - "Clear, helpful, authoritative"
      - "Answer questions directly"
      - "Build trust through knowledge"
      - "Guide to conversion subtly"
```

## 🔧 **Simple Implementation**

### **Folder Structure:**
```
dist/local/
├── _folder-config.yaml          # sales_local_friendly
├── watch-repairs-london.html
└── watch-repairs-manchester.html

dist/brands/
├── _folder-config.yaml          # authority_professional  
├── rolex-repair.html
└── omega-repair.html

dist/information/
├── _folder-config.yaml          # seo_informational
├── guarantee.html
└── faq.html
```

### **Usage in AI Prompts:**
```
LANGUAGE STYLE: {{language_config.authority_words}} (not "brilliant")
POSITIONING: {{business_config.positioning}}
VALUE PROPS: {{business_config.value_props}}
TONE MODIFIERS: {{tone_config.modifiers}}

Example Output:
- Generic: "Brilliant watch repair service"
- UK Config: "{{location}}'s leading {{service}} experts" 
- Result: "Abbots Langley's leading watch repair experts"
```

## 💰 **Impact on Conversion**

**Before (Hardcoded):**
- "Brilliant watch repair" (generic, overused)
- "Amazing service" (weak authority)
- "Great results" (meaningless)

**After (Configured):**
- "Abbots Langley's #1 watch repair experts" (authority + location)
- "Trusted local specialists serving Hertfordshire" (trust + geography)
- "Get your watch sorted today with free collection" (urgency + convenience)

## 🎯 **Simple Settings → Meaningful Results**

**3 Simple Configs:**
1. **Language base** (UK/US/AU English patterns)
2. **Business type** (local/professional/ecommerce)  
3. **Tone focus** (sales/authority/information)

**= Dramatically different optimization results for each folder!**

**This gives you maximum flexibility with minimal complexity.** 🚀

