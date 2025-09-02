/**
 * Universal extractor - works without relying on specific classes
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

function extractAboveFoldContent(html, options = {}) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // Find the first visible H1
  const h1Element = doc.querySelector('h1');
  if (!h1Element) {
    return { success: false, error: 'No H1 found' };
  }
  
  // Strategy: Find the smallest container that has meaningful content around H1
  let bestContainer = null;
  let bestScore = 0;
  
  // Check containers from H1 up to body
  let current = h1Element.parentElement;
  let depth = 0;
  
  while (current && current.tagName !== 'BODY' && depth < 6) {
    const score = scoreContainer(current, h1Element);
    
    console.log(`Checking <${current.tagName}> at depth ${depth}: score = ${score}`);
    
    // A good hero section typically scores 3+
    if (score >= 3 && score > bestScore) {
      bestContainer = current;
      bestScore = score;
      
      // If we found a great container (score 5+), stop looking
      if (score >= 5) break;
    }
    
    current = current.parentElement;
    depth++;
  }
  
  // Use the best container found, or default to H1's parent
  const container = bestContainer || h1Element.parentElement;
  console.log(`Selected container: <${container.tagName}> with score ${bestScore}\n`);
  
  // Extract content based on structure, not classes
  const extracted = {
    h1: h1Element.textContent.trim(),
    h2: [],
    buttons: [],
    content: [],
    container: {
      tag: container.tagName.toLowerCase(),
      score: bestScore
    }
  };
  
  // Extract text content that's likely descriptive
  const textNodes = getTextNodes(container);
  textNodes.forEach(node => {
    const text = node.textContent.trim();
    
    // Filter for meaningful content
    if (text.length > 50 && text.length < 500) {
      // Skip if it looks like navigation, footer, or metadata
      if (!looksLikeNavigation(text) && !looksLikeMetadata(text)) {
        extracted.content.push(text);
      }
    }
  });
  
  // Find CTAs - look for links/buttons with action words
  const interactiveElements = container.querySelectorAll('a, button');
  const ctaPatterns = [
    /get.*quote/i, /free.*quote/i, /get.*started/i, /start.*now/i,
    /call.*now/i, /book.*now/i, /buy.*now/i, /shop.*now/i,
    /learn.*more/i, /find.*out/i, /contact.*us/i, /try.*free/i,
    /sign.*up/i, /request/i, /schedule/i, /download/i
  ];
  
  interactiveElements.forEach(elem => {
    const text = elem.textContent.trim();
    
    // Check if it's a CTA based on text content
    if (text.length > 2 && text.length < 50) {
      const isCTA = ctaPatterns.some(pattern => pattern.test(text)) ||
                    containsActionWords(text) ||
                    (elem.tagName === 'BUTTON') ||
                    looksLikePrimaryCTA(elem);
      
      if (isCTA && !looksLikeNavigation(text)) {
        extracted.buttons.push({
          text,
          href: elem.href || null,
          type: elem.tagName.toLowerCase()
        });
      }
    }
  });
  
  // Extract H2s that are siblings or children of our container
  const h2s = container.querySelectorAll('h2');
  h2s.forEach(h2 => {
    const text = h2.textContent.trim();
    if (text.length > 3 && text.length < 100) {
      extracted.h2.push(text);
    }
  });
  
  // Limit results to typical above-fold amounts
  extracted.content = extracted.content.slice(0, 2);
  extracted.buttons = extracted.buttons.slice(0, 3);
  extracted.h2 = extracted.h2.slice(0, 1);
  
  // Validation
  const validation = {
    isValid: !!(extracted.h1 && (extracted.buttons.length > 0 || extracted.content.length > 0)),
    hasH1: !!extracted.h1,
    hasButtons: extracted.buttons.length > 0,
    hasContent: extracted.content.length > 0,
    containerScore: bestScore
  };
  
  return {
    success: true,
    extracted,
    validation
  };
}

/**
 * Score a container based on its content structure
 */
function scoreContainer(container, h1Element) {
  let score = 0;
  
  // Must contain the H1
  if (!container.contains(h1Element)) return 0;
  
  // Count meaningful elements
  const paragraphs = container.querySelectorAll('p').length;
  const buttons = container.querySelectorAll('button').length;
  const links = container.querySelectorAll('a').length;
  const images = container.querySelectorAll('img').length;
  const headings = container.querySelectorAll('h2, h3').length;
  
  // Score based on typical hero section structure
  if (paragraphs >= 1 && paragraphs <= 5) score += 2;
  if (buttons >= 1 && buttons <= 3) score += 2;
  if (links >= 1 && links <= 10) score += 1;
  if (images >= 1 && images <= 3) score += 1;
  if (headings >= 0 && headings <= 2) score += 1;
  
  // Penalty for too many elements (likely full page)
  const totalElements = container.querySelectorAll('*').length;
  if (totalElements > 100) score -= 2;
  if (totalElements > 200) score -= 3;
  
  // Bonus for containing action words
  const text = container.textContent;
  if (/get.{0,20}started|call.{0,20}now|free.{0,20}quote/i.test(text)) score += 1;
  
  return Math.max(0, score);
}

/**
 * Get text nodes, including from divs and spans
 */
function getTextNodes(container) {
  const textElements = [];
  
  // Get paragraphs
  container.querySelectorAll('p').forEach(p => textElements.push(p));
  
  // Get divs that likely contain text
  container.querySelectorAll('div').forEach(div => {
    // Check if div contains mostly text (not other elements)
    const childElements = div.querySelectorAll('*').length;
    const text = div.textContent.trim();
    
    if (childElements < 3 && text.length > 50) {
      textElements.push(div);
    }
  });
  
  return textElements;
}

/**
 * Check if text looks like navigation
 */
function looksLikeNavigation(text) {
  const navPatterns = [
    /^(home|about|services|contact|blog|products)$/i,
    /^(log.?in|sign.?in|register|my.?account)$/i,
    /^(menu|search|cart|checkout)$/i
  ];
  
  return navPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if text looks like metadata
 */
function looksLikeMetadata(text) {
  return text.includes('©') || 
         text.includes('GMT') ||
         text.includes('Mon-Fri') ||
         text.includes('Copyright') ||
         text.includes('All rights reserved') ||
         /^\d{4}/.test(text); // Starts with year
}

/**
 * Check if text contains action words
 */
function containsActionWords(text) {
  const actionWords = ['get', 'start', 'call', 'book', 'buy', 'try', 'request', 'contact'];
  const lowerText = text.toLowerCase();
  return actionWords.some(word => lowerText.includes(word));
}

/**
 * Check if element looks like a primary CTA (without using classes)
 */
function looksLikePrimaryCTA(elem) {
  // Check if it's styled prominently (if we have access to styles)
  const style = elem.style;
  if (style) {
    // Check for inline styles that suggest importance
    if (style.backgroundColor || style.fontSize || style.padding) {
      return true;
    }
  }
  
  // Check if it's a button element
  if (elem.tagName === 'BUTTON') return true;
  
  // Check if it has role="button"
  if (elem.getAttribute('role') === 'button') return true;
  
  return false;
}

// Test function
async function testLiveURL(url) {
  console.log(`\nTesting Universal Extractor on: ${url}`);
  console.log('='.repeat(80));
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    console.log(`✓ Fetched HTML\n`);
    
    console.log('Container Analysis:');
    console.log('-'.repeat(40));
    
    const result = extractAboveFoldContent(html);
    
    if (result.success) {
      console.log('\nEXTRACTED CONTENT:');
      console.log('-'.repeat(40));
      
      console.log(`\nH1: "${result.extracted.h1}"`);
      
      if (result.extracted.h2.length > 0) {
        console.log(`\nH2: "${result.extracted.h2[0]}"`);
      }
      
      if (result.extracted.content.length > 0) {
        console.log(`\nContent (${result.extracted.content.length} blocks):`);
        result.extracted.content.forEach((text, i) => {
          console.log(`\n${i + 1}. "${text}"`);
        });
      }
      
      if (result.extracted.buttons.length > 0) {
        console.log(`\nCTA Buttons (${result.extracted.buttons.length}):`);
        result.extracted.buttons.forEach((btn, i) => {
          console.log(`  ${i + 1}. "${btn.text}" (${btn.type})`);
        });
      }
      
      console.log('\n\nFINAL JSON:');
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
