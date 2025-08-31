// Step 1: Content scanning and mapping task
// Implemented according to specs/step-1-scanning.md

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');
const chalk = require('chalk');

// V5: Enhanced text extraction for inline elements (modular - easy to disable)
const { enhancedTextExtractor } = require('../lib/enhanced-text-extractor');

const scanTask = {
  async run(options) {
    console.log(chalk.blue('🔍 Starting content scanning and mapping...'));
    
    const { folder, limit = 10, batch = 'new', main: customMainSelector } = options;
    
    // Validate required options
    if (!folder) {
      throw new Error('--folder option is required');
    }
    
    // Ensure .nimbus directories exist
    await fs.ensureDir('.nimbus/maps');
    await fs.ensureDir('.nimbus/work');
    
    // Discover HTML files
    const htmlFiles = await this.discoverFiles(folder, parseInt(limit));
    console.log(chalk.green(`📁 Found ${htmlFiles.length} HTML files to scan`));
    
    const contentMaps = [];
    
    // Process each HTML file
    for (let i = 0; i < htmlFiles.length; i++) {
      const filePath = htmlFiles[i];
      console.log(chalk.blue(`📄 Processing ${i + 1}/${htmlFiles.length}: ${path.basename(filePath)}`));
      
      try {
        const contentMap = await this.processHtmlFile(filePath, customMainSelector);
        contentMaps.push(contentMap);
        
        // Save individual content map
        const mapFileName = this.generateMapFileName(filePath);
        await fs.writeJson(`.nimbus/maps/${mapFileName}`, contentMap, { spaces: 2 });
        
        console.log(chalk.green(`✅ Generated content map: ${mapFileName}`));
      } catch (error) {
        console.error(chalk.red(`❌ Error processing ${filePath}:`), error.message);
      }
    }
    
    // Create index file
    const indexData = {
      batch_id: batch,
      created: new Date().toISOString(),
      total_pages: contentMaps.length,
      pages: contentMaps.map(map => ({
        id: this.generatePageId(map.path),
        path: map.path,
        route: map.route,
        title: map.head.title
      }))
    };
    
    await fs.writeJson('.nimbus/maps/index.json', indexData, { spaces: 2 });
    
    console.log(chalk.green(`🎉 Content scanning complete! Generated ${contentMaps.length} content maps`));
    
    return {
      success: true,
      maps_generated: contentMaps.length,
      batch_id: batch
    };
  },
  
  async discoverFiles(folder, limit) {
    const pattern = path.join(folder, '**/*.html').replace(/\\/g, '/');
    const files = glob.sync(pattern);
    return files.slice(0, limit);
  },
  
  async processHtmlFile(filePath, customMainSelector) {
    const htmlContent = await fs.readFile(filePath, 'utf8');
    const $ = cheerio.load(htmlContent);
    
    // Generate route from file path
    const route = this.generateRoute(filePath);
    
    // Extract head metadata
    const head = this.extractHeadMetadata($);
    
    // Find main content container
    const mainSelector = this.findMainContent($, customMainSelector);
    const mainElement = $(mainSelector);
    
    if (mainElement.length === 0) {
      throw new Error(`No main content found with selector: ${mainSelector}`);
    }
    
    // Extract content blocks in reading order
    const { blocks, selectorMap } = this.extractContentBlocks($, mainElement, mainSelector);
    
    // Extract all links and images for reference
    const linksPresent = this.extractAllLinks($);
    const imagesPresent = this.extractAllImages($);
    
    // Detect issues
    const flags = this.detectIssues($, blocks, linksPresent, imagesPresent);
    
    return {
      path: filePath,
      route: route,
      engine: 'html',
      main_selector: mainSelector,
      head: head,
      blocks: blocks,
      selector_map: selectorMap, // V4.3: ID-to-selector mapping
      links_present: linksPresent,
      images_present: imagesPresent,
      flags: flags
    };
  },
  
  generateRoute(filePath) {
    // Convert file path to route
    // ../dist/local/watch-repairs-abbots-langley.html -> /branches/watch-repairs-abbots-langley
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Find the dist part in the path
    const distIndex = normalizedPath.indexOf('/dist/');
    if (distIndex === -1) {
      // Fallback: use basename
      const basename = path.basename(filePath, '.html');
      return basename === 'index' ? '/' : `/${basename}`;
    }
    
    // Extract path after dist/
    const afterDist = normalizedPath.substring(distIndex + 6); // +6 for '/dist/'
    const routePath = afterDist.replace(/\.html$/, '');
    
    if (routePath === 'index' || routePath === '') {
      return '/';
    } else if (routePath.startsWith('local/')) {
      return `/branches/${routePath.replace('local/', '')}`;
    } else if (routePath.startsWith('brands/')) {
      return `/brands/${routePath.replace('brands/', '')}`;
    } else {
      return `/${routePath}`;
    }
  },
  
  extractHeadMetadata($) {
    return {
      title: $('title').text().trim() || '',
      metaDescription: $('meta[name="description"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || '',
      twitterImage: $('meta[name="twitter:image"]').attr('content') || ''
    };
  },
  
  findMainContent($, customSelector) {
    if (customSelector) {
      return customSelector;
    }
    
    // Priority order for finding main content
    const selectors = [
      'main',
      '[role="main"]',
      'article',
      '#content',
      '.content'
    ];
    
    for (const selector of selectors) {
      if ($(selector).length > 0) {
        return selector;
      }
    }
    
    // Heuristic fallback: find container with highest text density
    let bestSelector = 'body';
    let maxTextLength = 0;
    
    $('body > *').each((i, elem) => {
      const $elem = $(elem);
      const tagName = elem.tagName.toLowerCase();
      
      // Skip navigation, header, footer, aside
      if (['header', 'nav', 'footer', 'aside', 'script', 'style', 'link'].includes(tagName)) {
        return;
      }
      
      const textLength = $elem.text().trim().length;
      if (textLength > maxTextLength) {
        maxTextLength = textLength;
        bestSelector = this.generateSelector($, elem);
      }
    });
    
    return bestSelector;
  },
  
  extractContentBlocks($, mainElement, mainSelector) {
    const blocks = [];
    const selectorMap = {}; // V4.3: Map IDs to selectors for later application
    let index = 0;
    
    // Find all content elements in reading order
    const contentSelectors = 'h1, h2, h3, p, li, blockquote, a, img, button, input[type="submit"], [class*="btn"], [class*="cta"]';
    
    mainElement.find(contentSelectors).each((i, elem) => {
      const $elem = $(elem);
      const tagName = elem.tagName.toLowerCase();
      
      // V5: Enhanced text extraction (feature flag for easy disable)
      const USE_ENHANCED_EXTRACTION = true; // Easy toggle for testing
      
      let textData;
      if (USE_ENHANCED_EXTRACTION && ['h1', 'h2', 'h3', 'p', 'li', 'blockquote', 'div', 'small'].includes(tagName)) {
        textData = enhancedTextExtractor.extractText($elem, { cheerio: $ });
      } else {
        // Legacy extraction
        textData = { text: $elem.text().trim(), extraction_method: 'legacy' };
      }
      
      // Skip empty elements
      if (['h1', 'h2', 'h3', 'p', 'li', 'blockquote'].includes(tagName) && !textData.text) {
        return;
      }
      
      // V4.2: Check data-nimbus attributes for content control
      const nimbusAttr = $elem.attr('data-nimbus');
      if (nimbusAttr === 'ignore') {
        return; // Skip elements marked for ignoring
      }
      
      const selector = this.generateUniqueSelector($, elem, mainSelector);
      
      // V4.3: Generate unique ID for this element
      const elementId = this.generateElementId(index, tagName);
      selectorMap[elementId] = selector;
      
      if (['h1', 'h2', 'h3', 'p', 'li', 'blockquote'].includes(tagName)) {
        const blockData = {
          i: index++,
          id: elementId,
          type: tagName,
          text: textData.text,
          selector: selector, // Keep for backward compatibility during transition
          nimbus_priority: nimbusAttr === 'priority' ? 'high' : nimbusAttr === 'ignore' ? 'skip' : 'normal' // V4.2: Content priority
        };
        
        // V5: Add enhanced extraction data if available
        if (textData.extraction_method !== 'legacy') {
          blockData.extraction_method = textData.extraction_method;
          blockData.inline_elements = textData.inline_elements || [];
          blockData.enhanced = true;
          
          // V5: Skip processing inline links separately if enhanced extraction captured them
          if (textData.inline_elements && textData.inline_elements.length > 0) {
            blockData.skip_inline_processing = true;
          }
        }
        
        blocks.push(blockData);
      } else if (tagName === 'a') {
        // V5: Skip if this link was already captured by enhanced extraction
        const parentBlock = blocks.find(b => 
          b.inline_elements && 
          b.inline_elements.some(el => el.text === textData.text && el.href === $elem.attr('href'))
        );
        
        if (parentBlock && parentBlock.skip_inline_processing) {
          console.log(`   ⏭️  Skipping duplicate link: ${textData.text} (captured in enhanced block)`);
          return; // Skip this link - already captured
        }
        const href = $elem.attr('href');
        const anchor = textData.text;
        if (href && anchor) {
          // V4.3: Generate unique ID for this element
          const elementId = this.generateElementId(index, tagName);
          selectorMap[elementId] = selector;
          
          // Classify link type for business-aware optimization
          const linkType = this.classifyLinkType(href, anchor);
          
          blocks.push({
            i: index++,
            id: elementId,
            type: 'a',
            anchor: anchor,
            href: href,
            link_type: linkType.type,
            conversion_priority: linkType.priority,
            selector: selector, // Keep for backward compatibility during transition
            nimbus_priority: nimbusAttr === 'priority' ? 'high' : nimbusAttr === 'ignore' ? 'skip' : 'normal' // V4.2: Content priority
          });
        }
      } else if (tagName === 'img') {
        const src = $elem.attr('src');
        if (src) {
          // V4.3: Generate unique ID for this element
          const elementId = this.generateElementId(index, tagName);
          selectorMap[elementId] = selector;
          
          blocks.push({
            i: index++,
            id: elementId,
            type: 'img',
            src: src,
            alt: $elem.attr('alt') || '',
            width: parseInt($elem.attr('width')) || null,
            height: parseInt($elem.attr('height')) || null,
            selector: selector, // Keep for backward compatibility during transition
            nimbus_priority: nimbusAttr === 'priority' ? 'high' : nimbusAttr === 'ignore' ? 'skip' : 'normal' // V4.2: Content priority
          });
        }
      } else if (tagName === 'button' || tagName === 'input' || $elem.attr('class')?.includes('btn') || $elem.attr('class')?.includes('cta')) {
        // Handle buttons, submit inputs, and CTA elements
        const buttonText = tagName === 'input' ? $elem.attr('value') || $elem.text().trim() : $elem.text().trim();
        const buttonType = $elem.attr('type') || 'button';
        
        if (buttonText) {
          // V4.3: Generate unique ID for this element
          const elementId = this.generateElementId(index, tagName);
          selectorMap[elementId] = selector;
          
          blocks.push({
            i: index++,
            id: elementId,
            type: 'button',
            text: buttonText,
            button_type: buttonType,
            classes: $elem.attr('class') || '',
            selector: selector, // Keep for backward compatibility during transition
            nimbus_priority: nimbusAttr === 'priority' ? 'high' : nimbusAttr === 'ignore' ? 'skip' : 'normal' // V4.2: Content priority
          });
        }
      }
    });
    
    return { blocks, selectorMap };
  },
  
  generateUniqueSelector($, elem, mainSelector) {
    const $elem = $(elem);
    const tagName = elem.tagName.toLowerCase();
    
    // Get classes
    const className = $elem.attr('class');
    let selector = mainSelector + ' ' + tagName;
    
    if (className) {
      const firstClass = className.split(' ')[0];
      selector += '.' + firstClass;
      
      // Check if this selector is unique
      if ($(selector).length === 1) {
        return selector;
      }
    }
    
    // Use nth-of-type for repeated elements
    const siblings = $elem.siblings(tagName).addBack();
    const index = siblings.index($elem) + 1;
    
    if (className) {
      return `${mainSelector} ${tagName}.${className.split(' ')[0]}:nth-of-type(${index})`;
    } else {
      return `${mainSelector} ${tagName}:nth-of-type(${index})`;
    }
  },
  
  generateSelector($, elem) {
    const $elem = $(elem);
    const tagName = elem.tagName.toLowerCase();
    const id = $elem.attr('id');
    const className = $elem.attr('class');
    
    if (id) {
      return `#${id}`;
    } else if (className) {
      return `${tagName}.${className.split(' ')[0]}`;
    } else {
      return tagName;
    }
  },
  
  extractAllLinks($) {
    const links = [];
    $('a[href]').each((i, elem) => {
      const $elem = $(elem);
      const href = $elem.attr('href');
      const anchor = $elem.text().trim();
      if (anchor) {
        links.push({ anchor, href });
      }
    });
    return links;
  },
  
  extractAllImages($) {
    const images = [];
    $('img[src]').each((i, elem) => {
      const $elem = $(elem);
      images.push({
        src: $elem.attr('src'),
        alt: $elem.attr('alt') || ''
      });
    });
    return images;
  },
  
  detectIssues($, blocks, links, images) {
    const flags = {
      usedHeuristicMain: false,
      typosFound: [],
      emptyTrustLinks: [],
      missingAltText: [],
      missingImageDimensions: []
    };
    
    // Check for empty trust links
    links.forEach(link => {
      if ((link.anchor.toLowerCase().includes('trustpilot') || 
           link.anchor.toLowerCase().includes('google')) && 
          !link.href) {
        flags.emptyTrustLinks.push(link.anchor);
      }
    });
    
    // Check for missing alt text
    images.forEach(img => {
      if (!img.alt) {
        flags.missingAltText.push(img.src);
      }
    });
    
    // Check for missing image dimensions in blocks
    blocks.forEach(block => {
      if (block.type === 'img' && (!block.width || !block.height)) {
        flags.missingImageDimensions.push(block.src);
      }
    });
    
    // Basic typo detection (simple examples)
    const commonTypos = ['braclet', 'acredited', 'recieve', 'seperate'];
    blocks.forEach(block => {
      if (block.text) {
        commonTypos.forEach(typo => {
          if (block.text.toLowerCase().includes(typo)) {
            flags.typosFound.push(typo);
          }
        });
      }
    });
    
    return flags;
  },
  
  generateMapFileName(filePath) {
    const pageId = this.generatePageId(filePath);
    return `${pageId}.json`;
  },
  
  generatePageId(filePath) {
    // Convert file path to page ID
    // dist/local/watch-repairs-abbots-langley.html -> watch-repairs-abbots-langley
    const basename = path.basename(filePath, '.html');
    return basename === 'index' ? 'home' : basename;
  },

  // V4.3: Generate unique element ID
  generateElementId(index, type) {
    // Create a unique ID using timestamp + index + type
    const timestamp = Date.now().toString(36);
    const indexStr = index.toString(36);
    return `${timestamp}${indexStr}${type.charAt(0)}`;
  },

  // V4.1: Business-aware link classification
  classifyLinkType(href, anchor) {
    // Default money pages - will be overridden by profile config
    const defaultMoneyPages = [
      '/start-repair.html',
      '/contact.html',
      '/how-it-works.html',
      '/quote',
      '/checkout',
      '/shop',
      '/buy'
    ];
    
    const defaultCtaPatterns = [
      'tel:',
      'mailto:',
      '/quote',
      '/contact',
      '/start-'
    ];
    
    // Check for money pages (exact match)
    if (defaultMoneyPages.some(page => href === page || href.includes(page))) {
      return {
        type: 'cta-money',
        priority: 'high'
      };
    }
    
    // Check for CTA patterns
    if (defaultCtaPatterns.some(pattern => href.startsWith(pattern))) {
      return {
        type: 'cta-contact',
        priority: 'high'
      };
    }
    
    // Check anchor text for CTA keywords
    const ctaKeywords = ['quote', 'contact', 'buy', 'order', 'submit', 'start', 'get started', 'book', 'call'];
    const anchorLower = anchor.toLowerCase();
    if (ctaKeywords.some(keyword => anchorLower.includes(keyword))) {
      return {
        type: 'cta-intent',
        priority: 'medium'
      };
    }
    
    return {
      type: 'link-regular',
      priority: 'low'
    };
  }
};

module.exports = scanTask;