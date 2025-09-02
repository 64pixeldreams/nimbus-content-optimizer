/**
 * Test the extractor with live URLs
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// Mock the extractor since we can't use ES modules directly in Node without proper setup
// This is a simplified version for testing

function extractAboveFoldContent(html, options = {}) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // Find H1
  const h1Element = doc.querySelector('h1');
  if (!h1Element) {
    return { success: false, error: 'No H1 found' };
  }
  
  // Find container
  let container = h1Element.parentElement;
  let depth = 0;
  const maxDepth = options.maxDepth || 5;
  
  while (container && depth < maxDepth) {
    const classes = (container.className || '').toLowerCase();
    const id = (container.id || '').toLowerCase();
    const identifiers = classes + ' ' + id;
    
    const heroPatterns = ['hero', 'jumbotron', 'banner', 'header-content', 'page-header', 'intro', 'landing', 'above-fold'];
    if (heroPatterns.some(pattern => identifiers.includes(pattern))) {
      break;
    }
    
    container = container.parentElement;
    depth++;
  }
  
  if (!container) container = h1Element.parentElement;
  
  // Extract elements
  const buttons = [];
  const buttonSelectors = ['button', 'a.btn', 'a.button', '[role="button"]', 'a[class*="cta"]', 'a[class*="action"]'];
  buttonSelectors.forEach(selector => {
    const elements = container.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.textContent.trim();
      if (text && text.length > 2 && text.length < 50) {
        buttons.push({
          text,
          href: el.href || null,
          classes: el.className || ''
        });
      }
    });
  });
  
  // Extract content
  const content = [];
  const contentElements = container.querySelectorAll('p, div.content, div.description');
  contentElements.forEach(el => {
    const text = el.textContent.trim();
    if (text.length > 20 && text.length < 500) {
      content.push(text);
    }
  });
  
  // Extract subheadings
  const h2Elements = container.querySelectorAll('h2');
  const h2 = Array.from(h2Elements).map(el => el.textContent.trim()).filter(text => text.length > 3);
  
  const h3Elements = container.querySelectorAll('h3');
  const h3 = Array.from(h3Elements).map(el => el.textContent.trim()).filter(text => text.length > 3);
  
  // Extract images
  const images = [];
  const imgElements = container.querySelectorAll('img');
  imgElements.forEach(img => {
    if (img.src && !img.src.includes('icon') && !img.src.includes('logo')) {
      images.push({
        src: img.src,
        alt: img.alt || '',
        width: img.width || null,
        height: img.height || null
      });
    }
  });
  
  // Extract links
  const links = [];
  const linkElements = container.querySelectorAll('a');
  linkElements.forEach(link => {
    const classes = (link.className || '').toLowerCase();
    if (!classes.includes('btn') && !classes.includes('button') && link.role !== 'button') {
      const text = link.textContent.trim();
      if (text && text.length > 2) {
        links.push({
          text,
          href: link.href || '#'
        });
      }
    }
  });
  
  // Build result
  const extracted = {
    h1: h1Element.textContent.trim(),
    h2,
    h3,
    buttons: buttons.slice(0, 5),
    content: content.slice(0, 3),
    images: images.slice(0, 3),
    links: links.slice(0, 5),
    container: {
      tag: container.tagName.toLowerCase(),
      classes: container.className || '',
      id: container.id || ''
    }
  };
  
  // Simple validation
  const validation = {
    isValid: !!(extracted.h1 && (extracted.buttons.length > 0 || extracted.content.length > 0)),
    hasH1: !!extracted.h1,
    hasButtons: extracted.buttons.length > 0,
    hasContent: extracted.content.length > 0,
    hasImages: extracted.images.length > 0,
    score: 0
  };
  
  // Calculate score
  if (validation.hasH1) validation.score += 1;
  if (validation.hasButtons) validation.score += 1;
  if (validation.hasContent) validation.score += 1;
  if (validation.hasImages) validation.score += 0.5;
  if (extracted.h2.length > 0) validation.score += 0.5;
  
  validation.quality = validation.score >= 3 ? 'good' : validation.score >= 2 ? 'fair' : 'poor';
  
  return {
    success: true,
    extracted,
    validation
  };
}

async function testLiveURL(url) {
  console.log(`\nTesting: ${url}`);
  console.log('='.repeat(80));
  
  try {
    // Fetch the HTML
    console.log('Fetching HTML...');
    const response = await fetch(url);
    const html = await response.text();
    console.log(`✓ Fetched ${html.length} characters of HTML\n`);
    
    // Run extraction
    console.log('Running extraction...');
    const result = extractAboveFoldContent(html, {
      maxDepth: 5,
      debug: true
    });
    
    if (result.success) {
      console.log('✓ Extraction successful!\n');
      
      console.log('EXTRACTED CONTENT:');
      console.log('-'.repeat(40));
      
      console.log(`H1: "${result.extracted.h1}"`);
      
      if (result.extracted.h2.length > 0) {
        console.log(`\nH2 Headings (${result.extracted.h2.length}):`);
        result.extracted.h2.forEach((h2, i) => console.log(`  ${i + 1}. "${h2}"`));
      }
      
      if (result.extracted.buttons.length > 0) {
        console.log(`\nButtons (${result.extracted.buttons.length}):`);
        result.extracted.buttons.forEach((btn, i) => {
          console.log(`  ${i + 1}. "${btn.text}"`);
          if (btn.href) console.log(`     → ${btn.href}`);
        });
      }
      
      if (result.extracted.content.length > 0) {
        console.log(`\nContent Paragraphs (${result.extracted.content.length}):`);
        result.extracted.content.forEach((text, i) => {
          const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
          console.log(`  ${i + 1}. "${preview}"`);
        });
      }
      
      if (result.extracted.images.length > 0) {
        console.log(`\nImages (${result.extracted.images.length}):`);
        result.extracted.images.forEach((img, i) => {
          console.log(`  ${i + 1}. ${img.alt || 'No alt text'}`);
          console.log(`     src: ${img.src}`);
        });
      }
      
      if (result.extracted.links.length > 0) {
        console.log(`\nOther Links (${result.extracted.links.length}):`);
        result.extracted.links.slice(0, 3).forEach((link, i) => {
          console.log(`  ${i + 1}. "${link.text}"`);
        });
      }
      
      console.log(`\nContainer:`);
      console.log(`  Tag: ${result.extracted.container.tag}`);
      console.log(`  Classes: ${result.extracted.container.classes || '(none)'}`);
      console.log(`  ID: ${result.extracted.container.id || '(none)'}`);
      
      console.log('\nVALIDATION:');
      console.log('-'.repeat(40));
      console.log(`  Valid: ${result.validation.isValid ? '✓ Yes' : '✗ No'}`);
      console.log(`  Score: ${result.validation.score}/4.5`);
      console.log(`  Quality: ${result.validation.quality}`);
      console.log(`  Has H1: ${result.validation.hasH1 ? '✓' : '✗'}`);
      console.log(`  Has Buttons: ${result.validation.hasButtons ? '✓' : '✗'}`);
      console.log(`  Has Content: ${result.validation.hasContent ? '✓' : '✗'}`);
      console.log(`  Has Images: ${result.validation.hasImages ? '✓' : '✗'}`);
      
      // Display full JSON for debugging
      console.log('\nFULL JSON RESULT:');
      console.log('-'.repeat(40));
      console.log(JSON.stringify(result, null, 2));
      
    } else {
      console.log('✗ Extraction failed:', result.error);
    }
    
  } catch (error) {
    console.error('Error testing URL:', error.message);
  }
}

// Test the URL
testLiveURL('https://repairsbypost.com/').catch(console.error);
