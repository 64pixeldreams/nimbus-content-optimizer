// Enhanced Text Extraction for Inline Elements
// Modular function that can be easily enabled/disabled for testing

const cheerio = require('cheerio');

const enhancedTextExtractor = {
  
  // Feature flag - easy to toggle for testing
  ENHANCED_EXTRACTION_ENABLED: true,
  
  // Main extraction function with fallback
  extractText($elem, options = {}) {
    if (!this.ENHANCED_EXTRACTION_ENABLED || options.legacy_mode) {
      // Fallback to current system
      return {
        text: $elem.text().trim(),
        extraction_method: 'legacy',
        inline_elements: []
      };
    }
    
    try {
      // Enhanced extraction with cheerio context
      return this.extractEnhancedText($elem, options.cheerio);
    } catch (error) {
      console.warn('Enhanced extraction failed, falling back to legacy:', error.message);
      return {
        text: $elem.text().trim(),
        extraction_method: 'legacy_fallback',
        inline_elements: [],
        error: error.message
      };
    }
  },
  
  // Enhanced text extraction with inline element preservation
  extractEnhancedText($elem, $) {
    const tagName = $elem[0].tagName.toLowerCase();
    
    // Check if this should be treated as a container
    if (this.shouldTreatAsContainer($elem, $)) {
      return this.extractContainerBlock($elem, $);
    } else {
      // Use legacy extraction for complex structures
      return {
        text: $elem.text().trim(),
        extraction_method: 'legacy_complex',
        inline_elements: []
      };
    }
  },
  
  // Determine if element should be treated as single container
  shouldTreatAsContainer($elem, $ = cheerio) {
    const tagName = $elem[0].tagName.toLowerCase();
    const childElements = $elem.children().toArray().map(el => el.tagName.toLowerCase());
    
    // Container rules - treat as single unit if contains only inline elements
    const containerRules = {
      'p': ['a', 'strong', 'b', 'em', 'span', 'small', 'abbr', 'code', 'i'],
      'div': ['small', 'span', 'a', 'strong', 'em', 'i'],
      'h1': ['a', 'span', 'strong', 'em', 'abbr', 'i'],
      'h2': ['a', 'span', 'strong', 'em', 'abbr', 'i'],
      'h3': ['a', 'span', 'strong', 'em', 'abbr', 'i'],
      'button': ['span', 'i', 'strong', 'svg'],
      'small': ['a', 'strong', 'b', 'em', 'span', 'i'],
      'li': ['a', 'strong', 'b', 'em', 'span', 'small', 'i']
    };
    
    const allowedInlineElements = containerRules[tagName];
    if (!allowedInlineElements) return false;
    
    // Check if all children are allowed inline elements
    const hasOnlyInlineChildren = childElements.length === 0 || 
      childElements.every(child => allowedInlineElements.includes(child));
    
    // Check if element has significant text content
    const textContent = $elem.text().trim();
    const hasSignificantText = textContent.length > 10;
    
    // Check if not too complex (avoid deeply nested structures)
    const nestingDepth = $elem.find('*').length;
    const notTooComplex = nestingDepth < 5; // More conservative threshold
    
    return hasOnlyInlineChildren && hasSignificantText && notTooComplex;
  },
  
  // Extract container block with inline elements preserved
  extractContainerBlock($elem, $ = cheerio) {
    const completeText = this.getCompleteText($elem, $);
    const inlineElements = this.extractInlineElements($elem, completeText, $);
    
    return {
      text: completeText,
      extraction_method: 'enhanced_container',
      inline_elements: inlineElements,
      original_outer_html: $elem.prop('outerHTML'),
      wrapper_tag: $elem[0].tagName.toLowerCase(),
      wrapper_attributes: this.extractAttributes($elem)
    };
  },
  
  // Get complete text while preserving inline element text
  getCompleteText($elem, $) {
    // Clone element to avoid modifying original
    const $clone = $elem.clone();
    
    // Replace inline elements with their text content
    $clone.find('a, span, strong, b, em, small, abbr, code, i, svg').each(function() {
      const $this = $(this);
      $this.replaceWith($this.text());
    });
    
    return $clone.text().trim();
  },
  
  // Extract inline elements with position and attribute information
  extractInlineElements($elem, completeText, $) {
    const inlineElements = [];
    
    $elem.find('a, span, strong, b, em, small, abbr, code').each((i, el) => {
      const $el = $(el);
      const elementText = $el.text().trim();
      
      if (elementText) {
        // Find position in complete text
        const position = completeText.indexOf(elementText);
        
        inlineElements.push({
          tag: el.tagName.toLowerCase(),
          text: elementText,
          position: position >= 0 ? position : -1,
          attributes: this.extractAttributes($el),
          href: $el.attr('href') || null,
          original_html: $el.prop('outerHTML')
        });
      }
    });
    
    return inlineElements;
  },
  
  // Extract all attributes from element
  extractAttributes($elem) {
    const attributes = {};
    const elem = $elem[0];
    
    if (elem && elem.attributes) {
      for (let i = 0; i < elem.attributes.length; i++) {
        const attr = elem.attributes[i];
        attributes[attr.name] = attr.value;
      }
    }
    
    return attributes;
  },
  
  // Test function to validate extraction quality
  testExtraction(testCases) {
    const results = [];
    
    testCases.forEach((testCase, index) => {
      try {
        const $ = require('cheerio').load(testCase.html);
        const $elem = $.root().children().first();
        
        const result = this.extractText($elem);
        
        const success = result.text === testCase.expected_text;
        
        results.push({
          test_index: index,
          test_name: testCase.name,
          success: success,
          expected: testCase.expected_text,
          actual: result.text,
          method: result.extraction_method,
          inline_count: result.inline_elements.length
        });
        
        if (success) {
          console.log(`✅ Test ${index + 1}: ${testCase.name}`);
        } else {
          console.log(`❌ Test ${index + 1}: ${testCase.name}`);
          console.log(`   Expected: "${testCase.expected_text}"`);
          console.log(`   Actual:   "${result.text}"`);
        }
        
      } catch (error) {
        results.push({
          test_index: index,
          test_name: testCase.name,
          success: false,
          error: error.message
        });
        console.log(`💥 Test ${index + 1}: ${testCase.name} - ERROR: ${error.message}`);
      }
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 Test Results: ${successCount}/${results.length} passed`);
    
    return results;
  }
};

// Test cases for validation
const TEST_CASES = [
  {
    name: "Reviews with links",
    html: '<div><small>⭐⭐⭐⭐⭐ 4.8/5 (923 reviews) on <a target="_blank" class="text-primary" href="https://g.page/RepairsByPost?share">Google Places</a> and <a class="text-primary" target="_blank" href="https://www.trustpilot.com/review/repairsbypost.com">Trustpilot</a>.</small></div>',
    expected_text: '⭐⭐⭐⭐⭐ 4.8/5 (923 reviews) on Google Places and Trustpilot.'
  },
  {
    name: "Button with nested elements", 
    html: '<button class="btn btn-primary"><span class="icon">📞</span> <strong>Call Now</strong></button>',
    expected_text: '📞 Call Now'
  },
  {
    name: "Heading with brand link",
    html: '<h1>Expert <a href="/hublot" class="brand-link">Hublot</a> Repair Service</h1>',
    expected_text: 'Expert Hublot Repair Service'
  },
  {
    name: "Paragraph with multiple inline elements",
    html: '<p>We offer <strong>professional</strong> service with <a href="/guarantee">12-month guarantee</a> and <em>free</em> UK shipping.</p>',
    expected_text: 'We offer professional service with 12-month guarantee and free UK shipping.'
  },
  {
    name: "Complex nested structure",
    html: '<div class="service"><small class="rating">Rated <strong>4.8/5</strong> by <a href="/reviews">1,500+ customers</a></small></div>',
    expected_text: 'Rated 4.8/5 by 1,500+ customers'
  }
];

module.exports = { enhancedTextExtractor, TEST_CASES };
