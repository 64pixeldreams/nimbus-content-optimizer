/**
 * Test the Above-the-Fold Content Extractor
 * Run with: node test-extractor.js
 */

import { extractAboveFoldContent } from './index.js';
import { JSDOM } from 'jsdom';

// Test HTML samples
const htmlSamples = {
  ashfordChroming: `
    <section class="hero-section">
      <div class="container">
        <h1>Top-Rated Chrome Plating Services in Manchester</h1>
        <h2>CLASSIC CARS | MOTORCYCLES | BOATS | HOUSEHOLD FIXTURES</h2>
        <p class="lead">At Ashford Chroming, we've been serving the Manchester area for over 20 years, providing top-quality Chrome plating and rechroming services to car enthusiasts, motorcycle clubs, and homeowners.</p>
        <div class="cta-buttons">
          <a href="/quote" class="btn btn-primary btn-lg">Get a Free Estimate in Manchester</a>
          <a href="/services" class="btn btn-secondary">View Our Services</a>
        </div>
        <img src="/images/chrome-plating-hero.jpg" alt="Chrome plating services" width="800" height="400">
      </div>
    </section>
  `,
  
  plumbing: `
    <div class="jumbotron">
      <h1>Emergency Plumbing Services London</h1>
      <p>Professional emergency plumbing services in London with 24/7 availability. Our 4.8★ rated experts provide emergency response, bathroom fitting, and boiler repair with a 100% satisfaction guarantee.</p>
      <button class="cta-button primary">Call Now: 0800 121 6030</button>
      <a href="/book" class="button secondary">Book Online</a>
    </div>
  `,
  
  watches: `
    <header class="page-header">
      <div class="header-content">
        <h1>Hublot Watch Repairs UK</h1>
        <h2>Luxury Watch Servicing & Restoration</h2>
        <div class="intro-text">
          <p>Professional Hublot watch repairs and luxury watch servicing across the UK. Our certified watchmakers specialize in Hublot timepieces with 500+ 4.9★ reviews and a 2-year warranty.</p>
        </div>
        <a class="btn-primary hero-cta" href="/get-quote">Get Quote Now</a>
        <a class="link-secondary" href="/services">View Our Services</a>
      </div>
    </header>
  `
};

// Helper to parse HTML in Node.js environment
function setupDOMParser() {
  // Override the parseHTML function for Node.js
  global.DOMParser = class {
    parseFromString(html, type) {
      const dom = new JSDOM(html);
      return dom.window.document;
    }
  };
}

// Run tests
function runTests() {
  setupDOMParser();
  
  console.log('Testing Above-the-Fold Content Extractor\n');
  console.log('=' .repeat(50) + '\n');
  
  Object.entries(htmlSamples).forEach(([name, html]) => {
    console.log(`Testing: ${name}`);
    console.log('-'.repeat(30));
    
    const result = extractAboveFoldContent(html, {
      debug: true,
      includeLinks: true
    });
    
    if (result.success) {
      console.log('✓ Extraction successful');
      console.log('\nExtracted content:');
      console.log('- H1:', result.extracted.h1);
      console.log('- H2:', result.extracted.h2);
      console.log('- Buttons:', result.extracted.buttons.map(b => b.text));
      console.log('- Content:', result.extracted.content.map(c => c.substring(0, 50) + '...'));
      console.log('- Images:', result.extracted.images.length);
      console.log('- Container:', result.extracted.container);
      
      console.log('\nValidation:');
      console.log('- Valid:', result.validation.isValid);
      console.log('- Score:', result.validation.score + '/' + result.validation.maxScore);
      console.log('- Quality:', result.validation.quality);
      console.log('- Feedback:', result.validation.feedback);
    } else {
      console.log('✗ Extraction failed:', result.error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  });
}

// Example of using specific options
function demonstrateOptions() {
  console.log('Demonstrating extraction options:\n');
  
  const html = htmlSamples.ashfordChroming;
  
  // Extract with custom options
  const result = extractAboveFoldContent(html, {
    maxButtons: 2,          // Limit buttons
    minContentLength: 30,   // Longer content only
    includeLinks: false,    // No regular links
    maxDepth: 3            // Don't search too deep
  });
  
  console.log('Custom extraction:', result.extracted);
}

// Run the tests
runTests();
demonstrateOptions();

