/**
 * 🧠 Semantic HTML Rewriter System
 * Converts HTML to Markdown for AI processing, preserves Bootstrap formatting
 */

const TurndownService = require('turndown');
const { marked } = require('marked');

class SemanticRewriter {
  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    // Tag mapping for semantic placeholders
    this.tagMap = {
      // Bootstrap badges
      '<badge-info>': '<span class="badge bg-info">',
      '</badge-info>': '</span>',
      '<badge-success>': '<span class="badge bg-success">',
      '</badge-success>': '</span>',
      '<badge-warning>': '<span class="badge bg-warning">',
      '</badge-warning>': '</span>',
      '<badge-primary>': '<span class="badge bg-primary">',
      '</badge-primary>': '</span>',
      
      // Font Awesome icons
      '<icon-check>': '<i class="fa fa-check me-2"></i>',
      '</icon-check>': '',
      '<icon-star>': '<i class="fa fa-star me-2"></i>',
      '</icon-star>': '',
      '<icon-phone>': '<i class="fa fa-phone me-2"></i>',
      '</icon-phone>': '',
      '<icon-envelope>': '<i class="fa fa-envelope me-2"></i>',
      '</icon-envelope>': '',
      '<icon-clock>': '<i class="fa fa-clock me-2"></i>',
      '</icon-clock>': '',
      
      // Bootstrap buttons and links
      '<btn-primary>': '<a class="btn btn-primary">',
      '</btn-primary>': '</a>',
      '<btn-secondary>': '<a class="btn btn-secondary">',
      '</btn-secondary>': '</a>',
      '<link-underline>': '<a class="text-decoration-underline">',
      '</link-underline>': '</a>',
      
      // Bootstrap spacing utilities
      '<me-2>': '<span class="me-2">',
      '</me-2>': '</span>',
      '<mb-3>': '<div class="mb-3">',
      '</mb-3>': '</div>',
      
      // Bootstrap text utilities  
      '<text-muted>': '<span class="text-muted">',
      '</text-muted>': '</span>',
      '<text-primary>': '<span class="text-primary">',
      '</text-primary>': '</span>',
      '<fw-bold>': '<span class="fw-bold">',
      '</fw-bold>': '</span>'
    };
    
    // Reverse mapping for HTML → Markdown conversion
    this.reverseTagMap = {};
    Object.entries(this.tagMap).forEach(([semantic, html]) => {
      this.reverseTagMap[html] = semantic;
    });
  }

  /**
   * Extract content blocks from Cheerio DOM
   * @param {Object} $ - Cheerio instance
   * @returns {Array} Array of content blocks with metadata
   */
  extractContentBlocks($) {
    const blocks = [];
    
    // Target semantic content elements
    const contentSelectors = [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'blockquote', 'div.card-body',
      'div.alert', 'div.jumbotron'
    ];
    
    contentSelectors.forEach(selector => {
      $(selector).each((i, element) => {
        const $el = $(element);
        const html = $.html($el).trim();
        const text = $el.text().trim();
        
        // Skip empty or navigation elements
        if (!text || text.length < 10) return;
        if ($el.closest('nav, .navbar, .sidebar, .footer').length) return;
        if ($el.hasClass('d-none') || $el.hasClass('visually-hidden')) return;
        
        blocks.push({
          selector: this.generateSelector($, element),
          html: html,
          text: text,
          type: element.tagName.toLowerCase(),
          length: text.length
        });
      });
    });
    
    return blocks.filter(block => block.length > 0);
  }

  /**
   * Convert HTML block to semantic Markdown
   * @param {string} html - HTML content
   * @returns {string} Semantic Markdown
   */
  htmlToSemanticMarkdown(html) {
    let processedHtml = html;
    
    // Replace complex HTML with semantic placeholders
    processedHtml = this.replaceHtmlWithSemanticTags(processedHtml);
    
    // Convert to Markdown
    const markdown = this.turndown.turndown(processedHtml);
    
    return markdown;
  }

  /**
   * Convert semantic Markdown back to HTML
   * @param {string} markdown - Semantic Markdown from AI
   * @returns {string} HTML with Bootstrap classes restored
   */
  semanticMarkdownToHtml(markdown) {
    // Convert Markdown to HTML
    let html = marked(markdown);
    
    // Restore semantic placeholders to original HTML tags
    html = this.restoreSemanticTagsToHtml(html);
    
    return html;
  }

  /**
   * Replace HTML tags with semantic placeholders
   * @param {string} html - Original HTML
   * @returns {string} HTML with semantic placeholders
   */
  replaceHtmlWithSemanticTags(html) {
    let processed = html;
    
    // Badge replacements
    processed = processed.replace(/<span class="badge bg-info[^"]*"[^>]*>/g, '<badge-info>');
    processed = processed.replace(/<span class="badge bg-success[^"]*"[^>]*>/g, '<badge-success>');
    processed = processed.replace(/<span class="badge bg-warning[^"]*"[^>]*>/g, '<badge-warning>');
    processed = processed.replace(/<span class="badge bg-primary[^"]*"[^>]*>/g, '<badge-primary>');
    
    // Icon replacements
    processed = processed.replace(/<i class="fa fa-check[^"]*"[^>]*><\/i>/g, '<icon-check></icon-check>');
    processed = processed.replace(/<i class="fa fa-star[^"]*"[^>]*><\/i>/g, '<icon-star></icon-star>');
    processed = processed.replace(/<i class="fa fa-phone[^"]*"[^>]*><\/i>/g, '<icon-phone></icon-phone>');
    processed = processed.replace(/<i class="fa fa-envelope[^"]*"[^>]*><\/i>/g, '<icon-envelope></icon-envelope>');
    processed = processed.replace(/<i class="fa fa-clock[^"]*"[^>]*><\/i>/g, '<icon-clock></icon-clock>');
    
    // Button replacements
    processed = processed.replace(/<a class="btn btn-primary[^"]*"[^>]*>/g, '<btn-primary>');
    processed = processed.replace(/<a class="btn btn-secondary[^"]*"[^>]*>/g, '<btn-secondary>');
    processed = processed.replace(/<a class="text-decoration-underline[^"]*"[^>]*>/g, '<link-underline>');
    
    // Utility class replacements
    processed = processed.replace(/<span class="me-2[^"]*"[^>]*>/g, '<me-2>');
    processed = processed.replace(/<div class="mb-3[^"]*"[^>]*>/g, '<mb-3>');
    processed = processed.replace(/<span class="text-muted[^"]*"[^>]*>/g, '<text-muted>');
    processed = processed.replace(/<span class="text-primary[^"]*"[^>]*>/g, '<text-primary>');
    processed = processed.replace(/<span class="fw-bold[^"]*"[^>]*>/g, '<fw-bold>');
    
    // Generic closing tag replacements
    processed = processed.replace(/<\/span>/g, (match, offset, string) => {
      // Find the most recent opening semantic tag
      const precedingText = string.substring(0, offset);
      if (precedingText.includes('<badge-')) return '</badge-info>';
      if (precedingText.includes('<me-2>')) return '</me-2>';
      if (precedingText.includes('<text-muted>')) return '</text-muted>';
      if (precedingText.includes('<text-primary>')) return '</text-primary>';
      if (precedingText.includes('<fw-bold>')) return '</fw-bold>';
      return match;
    });
    
    processed = processed.replace(/<\/a>/g, (match, offset, string) => {
      const precedingText = string.substring(0, offset);
      if (precedingText.includes('<btn-primary>')) return '</btn-primary>';
      if (precedingText.includes('<btn-secondary>')) return '</btn-secondary>';
      if (precedingText.includes('<link-underline>')) return '</link-underline>';
      return match;
    });
    
    processed = processed.replace(/<\/div>/g, (match, offset, string) => {
      const precedingText = string.substring(0, offset);
      if (precedingText.includes('<mb-3>')) return '</mb-3>';
      return match;
    });
    
    return processed;
  }

  /**
   * Restore semantic placeholders to HTML tags
   * @param {string} html - HTML with semantic placeholders
   * @returns {string} HTML with Bootstrap classes
   */
  restoreSemanticTagsToHtml(html) {
    let processed = html;
    
    // Restore all semantic tags using the tag map
    Object.entries(this.tagMap).forEach(([semantic, htmlTag]) => {
      const regex = new RegExp(this.escapeRegex(semantic), 'g');
      processed = processed.replace(regex, htmlTag);
    });
    
    return processed;
  }

  /**
   * Generate CSS selector for element
   * @param {Object} $ - Cheerio instance
   * @param {Object} element - DOM element
   * @returns {string} CSS selector
   */
  generateSelector($, element) {
    const $el = $(element);
    const tagName = element.tagName.toLowerCase();
    
    // Use ID if available
    if ($el.attr('id')) {
      return `${tagName}#${$el.attr('id')}`;
    }
    
    // Use class if available
    const classes = $el.attr('class');
    if (classes) {
      const classList = classes.split(' ').filter(c => c.trim()).slice(0, 2);
      return `${tagName}.${classList.join('.')}`;
    }
    
    // Use nth-of-type as fallback
    const siblings = $el.siblings(tagName);
    const index = siblings.index($el) + 1;
    return `${tagName}:nth-of-type(${index})`;
  }

  /**
   * Escape string for regex
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Process content blocks for AI optimization
   * @param {Array} blocks - Content blocks from extractContentBlocks
   * @returns {Array} Processed blocks ready for AI
   */
  prepareBlocksForAI(blocks) {
    return blocks.map(block => ({
      ...block,
      markdown: this.htmlToSemanticMarkdown(block.html),
      originalHtml: block.html
    }));
  }

  /**
   * Process AI results back to HTML
   * @param {Array} aiResults - Results from AI with rewritten markdown
   * @returns {Array} Blocks with restored HTML
   */
  processAIResults(aiResults) {
    return aiResults.map(result => ({
      ...result,
      optimizedHtml: this.semanticMarkdownToHtml(result.optimizedMarkdown),
      originalHtml: result.originalHtml
    }));
  }
}

module.exports = SemanticRewriter;
