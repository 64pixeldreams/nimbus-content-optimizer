/**
 * Final improved version - captures true above-fold content
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
  
  console.log('Found H1 in:', h1Element.parentElement.className);
  
  // Start from H1 and work outward to find the hero section
  let container = h1Element.parentElement;
  let heroSection = null;
  
  // Look for the section that contains H1 + content + buttons
  for (let i = 0; i < 4; i++) {
    if (!container) break;
    
    // Count key elements in this container
    const paragraphs = container.querySelectorAll('p').length;
    const buttons = container.querySelectorAll('a.btn, button').length;
    const hasH1 = container.contains(h1Element);
    
    console.log(`Level ${i}: <${container.tagName} class="${container.className}"> - P:${paragraphs}, BTN:${buttons}`);
    
    // If this container has H1 + content + buttons, it's likely our hero
    if (hasH1 && (paragraphs > 0 || buttons > 0)) {
      heroSection = container;
      // Keep going one more level if the container is too small
      if (paragraphs < 2 && buttons < 1 && container.parentElement) {
        container = container.parentElement;
        continue;
      }
      break;
    }
    
    container = container.parentElement;
  }
  
  container = heroSection || h1Element.parentElement;
  console.log(`Selected container: <${container.tagName} class="${container.className}">\n`);
  
  // Extract content
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
  
  // Get direct child paragraphs and nearby paragraphs
  const paragraphs = container.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = p.textContent.trim();
    // Skip very short text, navigation items, or footer-like content
    if (text.length > 50 && !text.includes('©') && !text.includes('GMT Mon-Fri')) {
      extracted.content.push(text);
    }
  });
  
  // Get buttons/CTAs
  const buttonSelectors = ['a.btn', 'button', 'a[class*="cta"]', 'a[href*="quote"]', 'a[href*="start"]'];
  const foundButtons = new Set();
  
  buttonSelectors.forEach(selector => {
    const buttons = container.querySelectorAll(selector);
    buttons.forEach(btn => {
      const text = btn.textContent.trim();
      const key = text + btn.href;
      
      // Avoid duplicates and navigation items
      if (!foundButtons.has(key) && text.length > 2 && text.length < 50) {
        if (!['Brands', 'Contact', 'Help', 'About'].some(nav => text.includes(nav))) {
          foundButtons.add(key);
          extracted.buttons.push({
            text,
            href: btn.href || null,
            classes: btn.className || ''
          });
        }
      }
    });
  });
  
  // Get any important text that might be in divs or other elements
  const specialText = container.querySelector('.lead, .subtitle, .tagline, em');
  if (specialText) {
    const text = specialText.textContent.trim();
    if (text.length > 20 && !extracted.content.includes(text)) {
      extracted.content.push(text);
    }
  }
  
  // Look for star ratings or review text
  const reviewText = Array.from(container.querySelectorAll('*')).find(el => 
    el.textContent.includes('★') || el.textContent.includes('reviews')
  );
  if (reviewText && reviewText.textContent.length < 100) {
    extracted.content.push(reviewText.textContent.trim());
  }
  
  // Limit to reasonable above-fold amounts
  extracted.content = extracted.content.slice(0, 3);
  extracted.buttons = extracted.buttons.slice(0, 3);
  
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
  
  validation.quality = validation.score === 3 ? 'excellent' : validation.score >= 2 ? 'good' : 'fair';
  
  return {
    success: true,
    extracted,
    validation
  };
}

// Test function
async function testLiveURL(url) {
  console.log(`\nTesting: ${url} (Final Version)`);
  console.log('='.repeat(80));
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    console.log(`✓ Fetched HTML\n`);
    
    console.log('Container Discovery:');
    console.log('-'.repeat(40));
    
    const result = extractAboveFoldContent(html);
    
    if (result.success) {
      console.log('\nEXTRACTED ABOVE-FOLD CONTENT:');
      console.log('-'.repeat(40));
      
      console.log(`\nH1: "${result.extracted.h1}"`);
      
      if (result.extracted.content.length > 0) {
        console.log(`\nContent (${result.extracted.content.length} blocks):`);
        result.extracted.content.forEach((text, i) => {
          console.log(`\n${i + 1}. "${text}"`);
        });
      }
      
      if (result.extracted.buttons.length > 0) {
        console.log(`\nCTA Buttons (${result.extracted.buttons.length}):`);
        result.extracted.buttons.forEach((btn, i) => {
          console.log(`\n${i + 1}. "${btn.text}"`);
          if (btn.href) console.log(`   Link: ${btn.href}`);
          if (btn.classes) console.log(`   Classes: ${btn.classes}`);
        });
      }
      
      console.log(`\nValidation: ${result.validation.quality.toUpperCase()} (Score: ${result.validation.score}/3)`);
      
      console.log('\n\nCLEAN JSON OUTPUT:');
      console.log('-'.repeat(40));
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

