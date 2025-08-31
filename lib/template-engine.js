// EJS Template Engine for Unified Preview System
// Clean, simple templating with Bootstrap 5

const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');

const templateEngine = {
  
  // Render search results list using EJS template
  async renderSearchResults(data) {
    const templatePath = path.join(__dirname, '..', 'templates', 'search-results.ejs');
    return await ejs.renderFile(templatePath, data);
  },
  
  // Render individual preview page using EJS template  
  async renderIndividualPreview(data) {
    const templatePath = path.join(__dirname, '..', 'templates', 'individual-preview.ejs');
    return await ejs.renderFile(templatePath, data);
  },
  
  // Helper: Format data for individual preview template
  formatIndividualPreviewData(result, originalData, profile, optimizationType, tierLevel) {
    return {
      page_title: `${result.page_id} - ${optimizationType} Results`,
      page_display_name: result.page_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      business_name: profile.name,
      optimization_type: optimizationType,
      tier: tierLevel, // Add tier level for conditional display
      
      // Page meta
      tone: result.directive?.tone,
      confidence: Math.round((result.confidence || 0) * 100),
      execution_time: result.execution_time_ms,
      changes_count: result.changes || 0,
      
      // SERP preview
      favicon_url: this.getFaviconUrl(profile),
      url_display: `https://www.${profile.domain} › ${result.page_id.replace(/-/g, ' › ')}`,
      optimized_title: this.extractTitle(result),
      optimized_description: this.extractDescription(result),
      cache_status: result.cached ? 'Cached' : 'Fresh',
      generated_at: new Date().toLocaleString('en-GB', { 
        timeZone: 'Europe/London',
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      
      // Hero section preview
      hero_image: this.getHeaderImage(result, profile),
      primary_cta: this.extractPrimaryCTA(result),
      secondary_cta: this.extractSecondaryCTA(result),
      
      // Before/after comparison
      show_comparison: true,
      original_title: originalData?.head?.title || 'No title found',
      original_description: originalData?.head?.metaDescription || 'No meta description found',
      original_title_length: (originalData?.head?.title || '').length,
      original_desc_length: (originalData?.head?.metaDescription || '').length,
      
      title_length: this.extractTitle(result).length,
      desc_length: this.extractDescription(result).length,
      
      // Above-fold component data (Tier 2+)
      original_h1: this.extractOriginalH1(originalData),
      original_h2: this.extractOriginalH2(originalData),
      original_body_content: this.extractOriginalBodyContent(originalData),
      original_primary_cta: this.extractOriginalPrimaryCTA(originalData),
      optimized_h1: this.extractOptimizedH1(result),
      optimized_h2: this.extractOptimizedH2(result),
      optimized_body_content: this.extractOptimizedBodyContent(result),
      optimized_primary_cta: this.extractOptimizedPrimaryCTA(result),
      optimized_secondary_cta: this.extractOptimizedSecondaryCTA(result),
      
      // AI notes
      ai_notes: this.extractAINotes(result),
      
      // Individual content blocks for detailed comparison (Tier 2+)
      content_blocks: this.extractContentBlocksForComparison(result)
    };
  },
  
  // Extract CTAs from optimization results
  extractPrimaryCTA(result) {
    const actualResult = result.result?.result || result.result || result;
    if (actualResult?.ctas && actualResult.ctas.length > 0) {
      return actualResult.ctas[0].new_anchor || actualResult.ctas[0].anchor;
    }
    return null;
  },
  
  extractSecondaryCTA(result) {
    const actualResult = result.result?.result || result.result || result;
    if (actualResult?.ctas && actualResult.ctas.length > 1) {
      return actualResult.ctas[1].new_anchor || actualResult.ctas[1].anchor;
    }
    return null;
  },
  
  extractAINotes(result) {
    const actualResult = result.result?.result || result.result || result;
    if (actualResult?.notes) return actualResult.notes;
    return [];
  },
  
  // Extract original above-fold components
  extractOriginalH1(originalData) {
    const blocks = originalData?.blocks || [];
    const h1Block = blocks.find(b => b.type === 'h1');
    return h1Block?.text || null;
  },
  
  extractOriginalH2(originalData) {
    const blocks = originalData?.blocks || [];
    const h2Block = blocks.find(b => b.type === 'h2');
    return h2Block?.text || null;
  },
  
  extractOriginalBodyContent(originalData) {
    const blocks = originalData?.blocks || [];
    // Get first 2-3 paragraphs for above-fold body content
    const bodyParagraphs = blocks.filter(b => b.type === 'p').slice(0, 2);
    return bodyParagraphs.map(p => p.text).join(' ').substring(0, 200) + '...' || null;
  },

  extractOriginalPrimaryCTA(originalData) {
    const blocks = originalData?.blocks || [];
    const ctaBlock = blocks.find(b => b.type === 'a' && (b.link_type === 'cta-money' || b.link_type === 'cta-contact'));
    return ctaBlock?.anchor || null;
  },
  
  // Extract optimized above-fold components
  extractOptimizedH1(result) {
    const actualResult = result.result?.result || result.result || result;
    const blocks = actualResult?.blocks || [];
    const h1Block = blocks.find(b => b.selector && (b.selector.includes('h1') || b.type === 'h1'));
    return h1Block?.new_text || null;
  },
  
  extractOptimizedH2(result) {
    const actualResult = result.result?.result || result.result || result;
    const blocks = actualResult?.blocks || [];
    const h2Block = blocks.find(b => b.selector && (b.selector.includes('h2') || b.type === 'h2'));
    return h2Block?.new_text || null;
  },
  
  extractOptimizedPrimaryCTA(result) {
    const actualResult = result.result?.result || result.result || result;
    const ctas = actualResult?.ctas || actualResult?.links || [];
    const primaryCta = ctas.find(c => c.cta_type === 'primary' || c.conversion_priority === 'high');
    return primaryCta?.new_anchor || primaryCta?.anchor || null;
  },
  
  extractOptimizedBodyContent(result) {
    const actualResult = result.result?.result || result.result || result;
    const blocks = actualResult?.blocks || [];
    // Get ALL optimized paragraphs for full content view
    const paragraphBlocks = blocks.filter(b => b.selector && b.selector.includes('p'));
    
    if (!paragraphBlocks.length) return null;
    
    // Join all paragraphs with double line breaks for readability
    const allBodyText = paragraphBlocks
      .map(p => p.optimized_text || p.new_text || p.text)
      .filter(text => text && text.trim())
      .join('\n\n');
    
    return allBodyText || null;
  },

  extractContentBlocksForComparison(result) {
    const actualResult = result.result?.result || result.result || result;
    const blocks = actualResult?.blocks || [];
    const originalBlocks = result.content_map?.blocks || [];
    
    // Get all content blocks with their selectors
    const contentBlocks = blocks
      .filter(b => b.selector && (b.selector.includes('p') || b.selector.includes('div') || b.selector.includes('span')))
      .map((block, index) => {
        // Try to find matching original block by index or type
        let originalBlock = null;
        
        // First try: exact selector match
        originalBlock = originalBlocks.find(b => b.selector === block.selector);
        
        // Second try: index-based match for paragraphs
        if (!originalBlock && block.selector === 'p') {
          const paragraphBlocks = originalBlocks.filter(b => b.type === 'p' || b.selector?.includes('p'));
          originalBlock = paragraphBlocks[index] || null;
        }
        
        // Third try: type-based match
        if (!originalBlock) {
          originalBlock = originalBlocks.find(b => b.type === block.type);
        }
        
        const blockData = {
          selector: `Paragraph ${index + 1}`,
          original_text: originalBlock?.text || `Original paragraph ${index + 1} content`,
          optimized_text: block.optimized_text || block.new_text || block.text || '',
          type: block.type || 'content'
        };
        
        return blockData;
      })
      .filter(block => block.original_text.trim() || block.optimized_text.trim());
    
    return contentBlocks;
  },

  extractOptimizedSecondaryCTA(result) {
    const actualResult = result.result?.result || result.result || result;
    const ctas = actualResult?.ctas || actualResult?.links || [];
    const secondaryCta = ctas.find(c => c.cta_type === 'secondary' || (c.conversion_priority !== 'high' && ctas.indexOf(c) === 1));
    return secondaryCta?.new_anchor || secondaryCta?.anchor || null;
  },
  
  // Helper: Format data for search results template
  formatSearchResultsData(results, profile, optimizationType, tierLevel) {
    const successfulResults = results.filter(r => !r.error);
    const avgConfidence = successfulResults.length > 0 ? Math.round(
      successfulResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / successfulResults.length * 100
    ) : 0;
    const totalChanges = successfulResults.reduce((sum, r) => sum + (r.changes || 0), 0);
    
    return {
      page_title: `${optimizationType} Results`,
      business_name: profile.name,
      optimization_type: optimizationType,
      business_goal: profile.goal,
      generated_at: new Date().toLocaleString('en-GB', { 
        timeZone: 'Europe/London',
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      
      // Statistics
      pages_count: successfulResults.length,
      avg_confidence: avgConfidence,
      total_changes: totalChanges,
      avg_time: successfulResults.length > 0 ? Math.round(
        successfulResults.reduce((sum, r) => sum + (r.execution_time_ms || 0), 0) / successfulResults.length
      ) : 0,
      
      // Favicon
      favicon_url: this.getFaviconUrl(profile),
      
      // Results array
      results: successfulResults.map(result => ({
        page_id: result.page_id,
        optimized_title: this.extractTitle(result),
        optimized_description: this.extractDescription(result),
        url_display: `https://www.${profile.domain} › ${result.page_id.replace(/-/g, ' › ')}`,
        
        // Meta information
        cache_status: result.cached ? 'Cached' : 'Fresh',
        confidence: Math.round((result.confidence || 0) * 100),
        changes_count: result.changes || 0,
        tone: result.directive?.tone,
        tier: tierLevel,
        
        // Character counts
        title_char_count: this.extractTitle(result).length,
        title_char_class: this.getCharClass(this.extractTitle(result).length, 60),
        desc_char_count: this.extractDescription(result).length,
        desc_char_class: this.getCharClass(this.extractDescription(result).length, 160),
        
        // Result image (use actual page content)
        result_image: this.getHeaderImage(result, profile)
      })),
      
      system_name: 'Progressive Optimization System'
    };
  },
  
  // Helper methods
  getFaviconUrl(profile) {
    if (profile.favicon_url) return profile.favicon_url;
    if (profile.domain) return `https://${profile.domain}/favicon.ico`;
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="%231a73e8"/></svg>';
  },
  
  extractTitle(result) {
    // For head optimization results
    if (result.result?.result?.head?.title) return result.result.result.head.title;
    if (result.result?.head?.title) return result.result.head.title;
    if (result.head?.title) return result.head.title;
    
    // For content optimization results - extract H1 as title
    const actualResult = result.result?.result || result.result || result;
    if (actualResult?.blocks) {
      const h1Block = actualResult.blocks.find(b => b.selector && b.selector.includes('h1'));
      if (h1Block?.new_text) return h1Block.new_text;
    }
    
    return result.page_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  },
  
  extractDescription(result) {
    // For head optimization results
    if (result.result?.result?.head?.metaDescription) return result.result.result.head.metaDescription;
    if (result.result?.head?.metaDescription) return result.result.head.metaDescription;
    if (result.head?.metaDescription) return result.head.metaDescription;
    
    // For content optimization results - extract H2 as description
    const actualResult = result.result?.result || result.result || result;
    if (actualResult?.blocks) {
      const h2Block = actualResult.blocks.find(b => b.selector && b.selector.includes('h2'));
      if (h2Block?.new_text) return h2Block.new_text;
    }
    
    return 'Optimization completed successfully.';
  },
  
  getCharClass(length, target) {
    if (length > target) return 'char-over';
    if (length < target * 0.8) return 'char-warn';
    return 'char-good';
  },
  
  getHeaderImage(result, profile) {
    // First try to get image from content map (actual page images)
    const contentMap = result.content_map || result.result?.content_map;
    if (contentMap && contentMap.blocks) {
      // Look for the first image in the content
      const imageBlock = contentMap.blocks.find(block => block.type === 'img' && block.src);
      if (imageBlock) {
        return imageBlock.src;
      }
    }
    
    // Fallback to profile default image
    if (profile.default_share_image) {
      return profile.default_share_image;
    }
    
    // Extract brand name for branded placeholder as last resort
    const brandMatch = result.page_id.match(/(.+)-watch-repair/);
    const brand = brandMatch ? brandMatch[1] : null;
    
    // Brand-specific placeholder images as final fallback
    const brandImages = {
      'hublot': 'https://via.placeholder.com/80x80/000000/FFFFFF?text=H',
      'hamilton': 'https://via.placeholder.com/80x80/2C5F2D/FFFFFF?text=HAM',
      'gucci': 'https://via.placeholder.com/80x80/8B0000/FFFFFF?text=G',
      'rolex': 'https://via.placeholder.com/80x80/006400/FFFFFF?text=R',
      'omega': 'https://via.placeholder.com/80x80/000080/FFFFFF?text=Ω',
      'fossil': 'https://via.placeholder.com/80x80/8B4513/FFFFFF?text=F'
    };
    
    // For local pages, use location placeholder
    if (result.page_id.includes('watch-repairs-')) {
      const location = result.page_id.replace('watch-repairs-', '').replace(/-/g, ' ');
      const firstLetter = location.charAt(0).toUpperCase();
      return `https://via.placeholder.com/80x80/1a73e8/FFFFFF?text=${firstLetter}`;
    }
    
    // Return brand image or final fallback
    return brandImages[brand] || 'https://via.placeholder.com/80x80/70757a/FFFFFF?text=?';
  }
};

module.exports = templateEngine;