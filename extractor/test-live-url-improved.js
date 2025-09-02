/**
 * Improved test with better above-fold detection
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

function extractAboveFoldContent(html, options = {}) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // Find H1
  const h1Element = doc.querySelector('h1');
  if (!h1Element) {
    return { success: false, error: 'No H1 found' };
  }
  
  // Find container - but with better boundaries
  let container = findBoundedContainer(h1Element, options);
  
  // Extract elements ONLY within proximity of H1
  const extracted = {
    h1: h1Element.textContent.trim(),
    h2: [],
    h3: [],
    buttons: [],
    content: [],
    images: [],
    links: [],
    container: {
      tag: container.tagName.toLowerCase(),
      classes: container.className || '',
      id: container.id || ''
    }
  };
  
  // Extract H2s - only siblings or immediate children
  const h2Elements = findNearbyElements(container, h1Element, 'h2', 2);
  extracted.h2 = h2Elements.map(el => el.textContent.trim());
  
  // Extract buttons - only in the immediate hero area
  const buttonSelectors = ['button', 'a.btn', 'a.button', '[role="button"]', 'a[class*="cta"]'];
  buttonSelectors.forEach(selector => {
    const elements = container.querySelectorAll(selector);
    elements.forEach(el => {
      // Check if button is actually near the H1
      if (isNearElement(el, h1Element, 3)) {
        const text = el.textContent.trim();
        if (text && text.length > 2 && text.length < 50) {
          extracted.buttons.push({
            text,
            href: el.href || null,
            classes: el.className || ''
          });
        }
      }
    });
  });
  
  // Extract content - only paragraphs near H1
  const contentElements = findNearbyElements(container, h1Element, 'p', 3);
  contentElements.forEach(el => {
    const text = el.textContent.trim();
    if (text.length > 20 && text.length < 500) {
      extracted.content.push(text);
    }
  });
  
  // Limit results to what's likely above-fold
  extracted.buttons = extracted.buttons.slice(0, 2);  // Max 2 buttons
  extracted.content = extracted.content.slice(0, 2);  // Max 2 paragraphs
  extracted.h2 = extracted.h2.slice(0, 1);           // Max 1 H2
  
  // Validation
  const validation = {
    isValid: !!(extracted.h1 && (extracted.buttons.length > 0 || extracted.content.length > 0)),
    hasH1: !!extracted.h1,
    hasButtons: extracted.buttons.length > 0,
    hasContent: extracted.content.length > 0,
    score: 0
  };
  
  if (validation.hasH1) validation.score += 1;
  if (validation.hasButtons) validation.score += 1;
  if (validation.hasContent) validation.score += 1;
  
  validation.quality = validation.score >= 2 ? 'good' : 'fair';
  
  return {
    success: true,
    extracted,
    validation
  };
}

/**
 * Find container but stop at reasonable boundaries
 */
function findBoundedContainer(h1Element, options = {}) {
  let container = h1Element.parentElement;
  let depth = 0;
  const maxDepth = options.maxDepth || 3; // Reduced from 5
  
  while (container && depth < maxDepth) {
    const classes = (container.className || '').toLowerCase();
    const id = (container.id || '').toLowerCase();
    
    // Stop if we hit a major section boundary
    if (container.tagName === 'MAIN' || 
        container.tagName === 'BODY' ||
        classes.includes('wrapper') ||
        classes.includes('container-fluid')) {
      // Go back one level
      return container.children.length > 10 ? h1Element.parentElement : container;
    }
    
    // Check for hero patterns
    const heroPatterns = ['hero', 'jumbotron', 'banner', 'header-content', 'intro'];
    if (heroPatterns.some(pattern => classes.includes(pattern) || id.includes(pattern))) {
      return container;
    }
    
    container = container.parentElement;
    depth++;
  }
  
  // Default to H1's immediate parent
  return h1Element.parentElement;
}

/**
 * Find elements near another element
 */
function findNearbyElements(container, referenceElement, selector, maxDistance = 2) {
  const elements = container.querySelectorAll(selector);
  const nearby = [];
  
  elements.forEach(el => {
    if (isNearElement(el, referenceElement, maxDistance)) {
      nearby.push(el);
    }
  });
  
  return nearby;
}

/**
 * Check if two elements are near each other in the DOM
 */
function isNearElement(el1, el2, maxDistance) {
  // Check if they share a close common ancestor
  let parent1 = el1;
  for (let i = 0; i < maxDistance; i++) {
    if (!parent1) break;
    
    let parent2 = el2;
    for (let j = 0; j < maxDistance; j++) {
      if (!parent2) break;
      if (parent1 === parent2) return true;
      parent2 = parent2.parentElement;
    }
    parent1 = parent1.parentElement;
  }
  
  return false;
}

// Test function
async function testLiveURL(url) {
  console.log(`\nTesting: ${url} (Improved Version)`);
  console.log('='.repeat(80));
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    console.log(`✓ Fetched ${html.length} characters of HTML\n`);
    
    const result = extractAboveFoldContent(html, {
      maxDepth: 3,
      debug: true
    });
    
    if (result.success) {
      console.log('✓ Extraction successful!\n');
      
      console.log('ABOVE-THE-FOLD CONTENT (Bounded):');
      console.log('-'.repeat(40));
      
      console.log(`H1: "${result.extracted.h1}"`);
      
      if (result.extracted.h2.length > 0) {
        console.log(`\nH2: "${result.extracted.h2[0]}"`);
      }
      
      if (result.extracted.buttons.length > 0) {
        console.log(`\nButtons (${result.extracted.buttons.length}):`);
        result.extracted.buttons.forEach((btn, i) => {
          console.log(`  ${i + 1}. "${btn.text}"`);
        });
      }
      
      if (result.extracted.content.length > 0) {
        console.log(`\nContent (${result.extracted.content.length} paragraphs):`);
        result.extracted.content.forEach((text, i) => {
          console.log(`  ${i + 1}. "${text}"`);
        });
      }
      
      console.log(`\nContainer: <${result.extracted.container.tag} class="${result.extracted.container.classes}">`);
      
      console.log('\nJSON RESULT:');
      console.log(JSON.stringify(result, null, 2));
      
    } else {
      console.log('✗ Extraction failed:', result.error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test
testLiveURL('https://repairsbypost.com/').catch(console.error);
